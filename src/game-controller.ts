import { activateGift, activateShrine, inspectNearest, movePlayer, nearestTarget, plantSeed, removePlanting } from './domain/simulation';
import { advanceTutorial, prepareTutorial, tutorialObjective, tutorialTarget } from './domain/tutorial';
import { memoryProgress, ROAD_HOME } from './domain/memory';
import { hasReachedEnding, memoryChapter, sanctuaryProgress } from './domain/memory-arc';
import { storyFor } from './domain/story';
import { prepareNewRun } from './domain/run';
import type { Appearance, CatalogEntry, Character, ContractId, GameState, GiftId, InteractionResult, Point, QuirkId, RefugeProjectId } from './domain/types';
import { fieldMarks, minimapFrame, pickMinimapMark } from './domain/minimap';
import { SEED_NAMES, distance, worldFor } from './domain/world';
import type { createSaveStore } from './persistence/save-store';
import type { createCanvasRenderer } from './ui/canvas-renderer';
import type { createPanels } from './ui/panels';
import type { createLocalStoryWriter, WriterStatus } from './story/local-story-writer';
import { GIFTS } from './domain/catalog';
import { equipWearable } from './domain/equipment';
import { gearForDirection } from './domain/equipment';
import type { WearableId } from './domain/types';
import { movementPose } from './ui/canvas-renderer';
import { CONTRACTS, applyExpeditionNarrative, applyWorkAction, buildRefugeProject, chooseOptionalLead, completeExpedition, expeditionMetaFor, expeditionNarrativeFor, expeditionTarget, startExpedition } from './domain/expedition';
import { canSpeakRadio, nextRadioRemark, RADIO_HOLD_MS, radioDirectorNotes, replaceLastRadio, speakRadio } from './domain/radio';
import { RELIC_COLORS, RELIC_FORMS, replaceLastRelic } from './domain/relics';
import { seasonBeatName, seasonDirectorNotes, seasonProgress } from './domain/season';
import type { RadioRemark, Relic } from './domain/types';
import { randomSeed } from './domain/random';
import { t } from './i18n/messages';

type Renderer = ReturnType<typeof createCanvasRenderer>;
type Panels = ReturnType<typeof createPanels>;
type Store = ReturnType<typeof createSaveStore>;
type LocalWriter = ReturnType<typeof createLocalStoryWriter>;

const PHYSICAL_GAME_KEYS: Readonly<Record<string, string>> = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd',
  KeyF: 'f', KeyE: 'e', KeyJ: 'j', KeyC: 'c', KeyK: 'k',
};
const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

function gameKey(event: KeyboardEvent) {
  return PHYSICAL_GAME_KEYS[event.code] ?? event.key.toLowerCase();
}

export function createGameController(initial: GameState, renderer: Renderer, panels: Panels, store: Store, hud: HTMLElement, toastRoot: HTMLElement, localWriter?: LocalWriter, writerPreference?: { enable(): void; isEnabled(): boolean }) {
  let state = initial;
  const keys = new Set<string>();
  let previous = performance.now();
  let toastTimer = 0;
  let radioTimer = 0;
  let frameId = 0;
  let wasNearResonance = false;
  let touchPointer: number | undefined;
  let touchOrigin = { x: 0, y: 0 };
  let touchVector = { x: 0, y: 0 };
  let touchKnob: HTMLElement | undefined;
  let writerPanelVisible = false;
  let pose = movementPose(0, 0, 'down');
  let waypoint: Point | undefined;
  let waypointId: string | undefined;
  let expeditionWalk = 0;
  let lastRadioWalk = -999;
  const radioRoot = document.createElement('aside');
  radioRoot.className = 'radio-remark';
  radioRoot.dataset.testid = 'radio-remark';
  radioRoot.hidden = true;
  radioRoot.setAttribute('aria-live', 'polite');
  toastRoot.parentElement?.prepend(radioRoot);

  const isTutorial = () => !!state.tutorial && state.tutorial.step !== 'done';
  const hasBlockingStory = () => !!state.pendingChapter || hasReachedEnding(state);
  const isTouchLayout = () => matchMedia('(max-width: 720px), (pointer: coarse)').matches;

  function resetTouch() {
    touchPointer = undefined;
    touchVector = { x: 0, y: 0 };
    if (touchKnob) touchKnob.style.transform = 'translate3d(0, 0, 0)';
  }

  function moveTouch(event: PointerEvent) {
    if (event.pointerId !== touchPointer) return;
    event.preventDefault();
    const radius = 42;
    const dx = event.clientX - touchOrigin.x;
    const dy = event.clientY - touchOrigin.y;
    const length = Math.hypot(dx, dy);
    const scale = length > radius ? radius / length : 1;
    const x = dx * scale;
    const y = dy * scale;
    touchVector = { x: x / radius, y: y / radius };
    if (touchKnob) touchKnob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function endTouch(event: PointerEvent) {
    if (event.pointerId === touchPointer) {
      resetTouch();
      store.save(state);
    }
  }

  function interruptTouch() {
    if (touchPointer === undefined) return;
    resetTouch();
    store.save(state);
  }

  function haptic() {
    if ('vibrate' in navigator) navigator.vibrate(12);
  }

  function toast(message: string) {
    toastRoot.replaceChildren();
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = message;
    toastRoot.append(d);
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => d.remove(), 3600);
  }

  function clearToast() {
    clearTimeout(toastTimer);
    toastRoot.replaceChildren();
  }

  function renderRadio(remark?: RadioRemark) {
    clearTimeout(radioTimer);
    if (!remark) {
      radioRoot.hidden = true;
      radioRoot.replaceChildren();
      return;
    }
    radioRoot.hidden = false;
    radioRoot.replaceChildren();
    const label = document.createElement('small');
    label.textContent = t('radioLabel');
    const copy = document.createElement('p');
    copy.textContent = remark.text;
    radioRoot.append(label, copy);
    radioTimer = window.setTimeout(() => renderRadio(), RADIO_HOLD_MS);
  }

  function updateHud() {
    if (hasBlockingStory()) {
      hud.replaceChildren();
      resetTouch();
      return;
    }
    if (isTutorial()) {
      if (state.tutorial?.step === 'wake' || state.tutorial?.step === 'clue' || state.tutorial?.step === 'recovered' || state.tutorial?.step === 'remember' || state.tutorial?.step === 'personalize') {
        hud.replaceChildren();
        resetTouch();
        return;
      }
      const objective = tutorialObjective(state);
      const progress = memoryProgress(state);
      hud.innerHTML = `<div class="tutorial-hud" data-testid="tutorial-objective"><div class="memory-progress"><span class="eyebrow"></span><small></small></div><strong></strong><div class="objective-action"><span class="objective-key"></span><span class="objective-copy"></span></div></div>`;
      (hud.querySelector('.memory-progress .eyebrow') as HTMLElement).textContent = progress.title;
      (hud.querySelector('.memory-progress small') as HTMLElement).textContent = `${progress.found} / ${progress.total} ${t('clues')}`;
      (hud.querySelector('.tutorial-hud strong') as HTMLElement).textContent = objective.title;
      (hud.querySelector('.objective-copy') as HTMLElement).textContent = objective.action;
      const key = hud.querySelector<HTMLElement>('.objective-key')!;
      if (objective.key) key.textContent = isTouchLayout() ? (objective.key === 'WASD' ? t('drag') : t('touch')) : objective.key;
      else key.remove();
      if (isTouchLayout()) renderTouchControls(objective.key === 'E');
      mountMinimap();
      return;
    }

    const run=state.expedition;
    hud.innerHTML = `<div class="hud-top"><button class="hud-card identity" data-testid="character-button"><span class="identity-mark">✦</span><span><strong data-testid="player-name"></strong><small></small><em class="memory-count"></em></span></button><div class="hud-actions"><button data-testid="contracts-button"><span>K</span><small></small></button><button data-testid="journal-button"><span>J</span><small></small></button><button data-testid="help-button"><span>?</span><small></small></button></div></div><div class="expedition-objective" data-expedition-objective></div><div class="prompt"><span class="key">F</span> <span data-primary-label></span> <i></i><span class="key">E</span> <span data-secondary-label></span> <span class="hud-meta"></span></div>`;
    hud.querySelector('[data-testid=character-button]')?.setAttribute('aria-label', t('companion'));
    hud.querySelector('[data-testid=contracts-button]')?.setAttribute('aria-label', t('expeditionBoard'));
    hud.querySelector('[data-testid=journal-button]')?.setAttribute('aria-label', t('fieldJournal'));
    hud.querySelector('[data-testid=help-button]')?.setAttribute('aria-label', t('help'));
    (hud.querySelector('[data-testid=contracts-button] small') as HTMLElement).textContent = t('expeditions');
    (hud.querySelector('[data-testid=journal-button] small') as HTMLElement).textContent = t('journal');
    (hud.querySelector('[data-testid=help-button] small') as HTMLElement).textContent = t('help');
    (hud.querySelector('[data-primary-label]') as HTMLElement).textContent = t('tool');
    (hud.querySelector('[data-secondary-label]') as HTMLElement).textContent = t('inspect');
    (hud.querySelector('[data-testid=player-name]') as HTMLElement).textContent = state.character.name;
    (hud.querySelector('.identity small') as HTMLElement).textContent = state.borrowedGift ? t('borrowed', { gift: GIFTS[state.borrowedGift].name }) : state.character.gift.name;
    const progress = sanctuaryProgress(state);
    const season = seasonProgress(state.season);
    const memoryPart = state.endingSeen ? t('companionRemembered') : t('memoriesPlanted', { planted: progress.planted, required: progress.required });
    const seasonPart = !season.total ? '' : season.complete ? t('seasonClosedHud') : t('seasonHud', { done: season.resolved, total: season.total });
    (hud.querySelector('.memory-count') as HTMLElement).textContent = seasonPart ? `${memoryPart} · ${seasonPart}` : memoryPart;
    (hud.querySelector('.hud-meta') as HTMLElement).textContent = state.seeds.length ? t('seedsInTray', { count: state.seeds.length }) : '';
    const meta=expeditionMetaFor(state);
    if(run){
      const narrative=expeditionNarrativeFor(state)!;
      const requiredDone=Math.min(run.completed.length,run.requiredTotal);const objective=hud.querySelector<HTMLElement>('[data-expedition-objective]')!;
      objective.innerHTML=`<span class="eyebrow"></span><strong></strong><small></small><div class="pressure-meter"><i></i></div>`;
      objective.querySelector('.eyebrow')!.textContent=t('expeditionHud',{done:requiredDone,total:run.requiredTotal});
      objective.querySelector('strong')!.textContent=narrative.title;
      const statusCopy=run.status==='returning'?t('returnToGate'):run.status==='decision'?t('decideFarther'):t('followGlows');
      objective.querySelector('small')!.textContent=`${statusCopy} · ${t('expeditionMeta',{supplies:run.supplies,insight:run.insight,pressure:run.pressure})}`;
      (objective.querySelector('.pressure-meter i') as HTMLElement).style.width=`${Math.min(100,run.pressure*12)}%`;
      (hud.querySelector('[data-primary-label]') as HTMLElement).textContent=run.status==='active'?t('doWork'):t('tool');
      (hud.querySelector('[data-secondary-label]') as HTMLElement).textContent=run.status==='returning'?t('finishExpedition'):t('inspect');
    }else{
      hud.querySelector('[data-expedition-objective]')?.remove();
      (hud.querySelector('.hud-meta') as HTMLElement).textContent=`${meta.supplies} ${t('supplies')} · ${meta.insight} ${t('insight')}`;
    }
    hud.querySelector('[data-testid=character-button]')?.addEventListener('click', () => panels.showCharacter(state));
    hud.querySelector('[data-testid=journal-button]')?.addEventListener('click', () => panels.showJournal(state));
    hud.querySelector('[data-testid=contracts-button]')?.addEventListener('click', () => panels.showContractBoard(state));
    hud.querySelector('[data-testid=help-button]')?.addEventListener('click', panels.showHelp);
    if (isTouchLayout()) renderTouchControls(false);
    mountMinimap();
  }

  function mountMinimap() {
    const frame = minimapFrame(innerWidth, innerHeight, isTouchLayout());
    const button = document.createElement('button');
    button.className = 'minimap-hit';
    button.dataset.testid = 'minimap';
    button.setAttribute('aria-label', t('minimapAria'));
    button.style.left = `${frame.x}px`;
    button.style.top = `${frame.y}px`;
    button.style.width = `${frame.w}px`;
    button.style.height = `${frame.h}px`;
    button.addEventListener('click', (event) => {
      const mark = pickMinimapMark({ x: event.clientX, y: event.clientY }, fieldMarks(state), worldFor(state), frame);
      if (!mark || mark.id === waypointId) {
        if (waypointId) toast(t('waypointCleared'));
        waypoint = undefined;
        waypointId = undefined;
        return;
      }
      waypoint = mark.position;
      waypointId = mark.id;
      toast(t('waypointSet', { name: mark.label }));
    });
    hud.append(button);
  }

  function renderTouchControls(atResonance: boolean) {
    resetTouch();
    const controls = document.createElement('div');
    controls.className = 'touch-controls';
    controls.dataset.testid = 'touch-controls';
    controls.innerHTML = `<div class="touch-joystick" data-testid="touch-joystick" role="application"><span class="touch-ring"><i class="touch-knob"></i></span><small></small></div><div class="touch-actions"></div>`;
    controls.querySelector('.touch-joystick')?.setAttribute('aria-label', t('moveCharacter'));
    (controls.querySelector('.touch-joystick small') as HTMLElement).textContent = t('touchMove');
    const joystick = controls.querySelector<HTMLElement>('.touch-joystick')!;
    touchKnob = controls.querySelector<HTMLElement>('.touch-knob')!;
    joystick.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (touchPointer !== undefined && touchPointer !== event.pointerId) return;
      const bounds = controls.querySelector<HTMLElement>('.touch-ring')!.getBoundingClientRect();
      touchPointer = event.pointerId;
      touchOrigin = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      if (event.isTrusted) joystick.setPointerCapture?.(event.pointerId);
      moveTouch(event);
    });
    joystick.addEventListener('lostpointercapture', interruptTouch);

    const actions = controls.querySelector<HTMLElement>('.touch-actions')!;
    const addAction = (label: string, ariaLabel: string, icon: string, onPress: () => void, primary = false) => {
      const button = document.createElement('button');
      button.className = `touch-action${primary ? ' primary' : ''}`;
      button.setAttribute('aria-label', ariaLabel);
      button.innerHTML = `<span aria-hidden="true">${icon}</span><small></small>`;
      (button.querySelector('small') as HTMLElement).textContent = label;
      button.addEventListener('click', () => { haptic(); onPress(); });
      actions.append(button);
      return button;
    };

    const step = state.tutorial?.step;
    if (!isTutorial()) {
      const gift = addAction(state.expedition?.status==='active'?t('work'):t('tool'), t('useTool'), '✦', useGift, true);
      gift.dataset.testid = 'touch-primary-action';
      addAction(t('inspect'), t('inspectNearby'), '◌', interact);
    } else if (step === 'gift') {
      const button = addAction(state.character.gift.name, t('useNamedTool', { gift: state.character.gift.name }), '✦', useGift, true);
      button.dataset.testid = 'touch-primary-action';
    } else if (step === 'combine') {
      const borrowed = state.tutorial?.borrowedGift ?? state.character.gift.id;
      const label = GIFTS[borrowed].name;
      const button = addAction(label, label, '✦', useGift, true);
      button.dataset.testid = 'touch-primary-action';
    } else if (step === 'plant') {
      const button = addAction(t('plantMemory'), t('plantMemory'), '⌁', interact, true);
      button.dataset.testid = 'touch-primary-action';
    } else if (step === 'resonate' && atResonance) {
      const borrowed = state.tutorial?.borrowedGift ?? 'mend';
      const label = t('takeNamed', { gift: GIFTS[borrowed].name });
      const button = addAction(label, label, '◇', interact, true);
      button.dataset.testid = 'touch-primary-action';
    }
    hud.append(controls);
  }

  function saveAndRefresh() {
    store.save(state);
    updateHud();
  }

  function apply(result: InteractionResult) {
    state = result.state;
    if (result.changed) saveAndRefresh();
    toast(result.message);
  }

  function finishClue() {
    state = advanceTutorial(state, 'clue-read');
    panels.clear();
    saveAndRefresh();
  }

  function finishRecoveredMemory() {
    state = advanceTutorial(state, 'memory-read');
    panels.clear();
    saveAndRefresh();
  }

  function showCurrentStoryStep() {
    const story = storyFor(state);
    if (state.tutorial?.step === 'clue') {
      panels.showMemoryBeat(t('clueReturned'), story.firstClue, t('finishMemory'), finishClue, story.chapters.sign?.title);
    } else if (state.tutorial?.step === 'recovered') {
      panels.showMemoryBeat(t('memoryRestored'), story.recovered, t('takeHome'), finishRecoveredMemory, story.chapters.sign?.title);
    }
  }

  function finishMemoryChapter() {
    state = { ...state, pendingChapter: undefined };
    panels.clear();
    saveAndRefresh();
    showPendingEnding();
  }

  function showPendingMemoryChapter() {
    if (!state.pendingChapter) return;
    const chapter = storyFor(state).chapters[state.pendingChapter] ?? memoryChapter(state.pendingChapter);
    if (!chapter) {
      finishMemoryChapter();
      return;
    }
    clearToast();
    panels.showMemoryChapter(chapter, state.rewarded.length, finishMemoryChapter);
  }

  function finishEnding() {
    state = { ...state, endingSeen: true };
    panels.clear();
    saveAndRefresh();
    toast(t('afterEnding'));
  }

  function showPendingEnding() {
    if (!hasReachedEnding(state)) return;
    clearToast();
    const season = seasonProgress(state.season);
    panels.showEnding(state.character, storyFor(state).ending, finishEnding, t('endingNext', {
      total: season.total || 6,
      remaining: Math.max(0, (season.total || 6) - season.resolved),
    }));
  }

  function useGift() {
    if(!isTutorial()&&state.expedition?.status==='active'){
      if(!expeditionTarget(state)||distance(state.player,expeditionTarget(state)!)>165){toast(t('followGold'));return}
      panels.showWorkChoices(state,performExpeditionWork);return;
    }
    const before = state.tutorial?.step;
    const targetId = state.tutorial?.targetAnomalyId;
    const nearby = nearestTarget(state);
    const recoveredId = nearby?.type === 'anomaly' ? nearby.value.id : undefined;
    const wasRewarded = recoveredId ? state.rewarded.includes(recoveredId) : false;
    const targetStage = targetId ? state.anomalies[targetId] ?? 0 : undefined;
    const result = activateGift(state, performance.now());
    const nextTargetStage = targetId ? result.state.anomalies[targetId] ?? 0 : undefined;
    const isRoadHomeRoute = targetId === 'sign';
    if (result.changed && before === 'gift' && targetStage === 0 && nextTargetStage === 1) {
      result.state = advanceTutorial(result.state, 'gift-used');
      if (!isRoadHomeRoute) result.state = advanceTutorial(result.state, 'clue-read');
    }
    if (result.changed && before === 'combine' && targetStage === 1 && nextTargetStage === 2 && result.kind === 'seed') {
      result.state = advanceTutorial(result.state, 'chain-completed');
      if (!isRoadHomeRoute) result.state = advanceTutorial(result.state, 'memory-read');
    }
    if (!isTutorial() && result.changed && result.kind === 'seed' && recoveredId && !wasRewarded) {
      result.state = { ...result.state, pendingChapter: recoveredId };
    }
    apply(result);
    showCurrentStoryStep();
    showPendingMemoryChapter();
  }

  function performExpeditionWork(tool:GiftId){
    const worked=applyWorkAction(state,tool);state=worked.state;panels.clear();saveAndRefresh();toast(worked.message);
    if(worked.ok&&state.expedition?.status==='decision')panels.showExpeditionDecision(state,decideExpedition);
  }

  function decideExpedition(accept:boolean){
    const decision=chooseOptionalLead(state,accept);state=decision.state;panels.clear();saveAndRefresh();toast(decision.message);
  }

  function interact() {
    if(!isTutorial()&&state.expedition?.status==='returning'){
      const target=expeditionTarget(state);
      if(target&&distance(state.player,target)<=185){
        const completed=completeExpedition(state);state=completed.state;saveAndRefresh();
        const relic=state.relics?.at(-1);
        toast(relic?`${completed.message} ${t('relicFound',{name:relic.name})}`:completed.message);
        if(relic)startRelicDirector(relic.eventId,relic.eventTitle??completed.report?.title??relic.name,state.worldSeed??Date.now());
        if(completed.report){
          const season=seasonProgress(state.season);
          const note=season.complete?t('debriefSeasonDone'):t('debriefSeason',{done:season.resolved,total:season.total,next:season.nextBeat?seasonBeatName(season.nextBeat.id):''});
          panels.showExpeditionDebrief(completed.report,()=>{
            if(season.complete)panels.showSeasonClose(state,panels.clear);
            else panels.clear();
          },note);
        }
        renderRadio();
        return;
      }
    }
    const target = nearestTarget(state);
    if (!target || target.distance > 160) {
      apply(inspectNearest(state));
      return;
    }
    if (target.type === 'shrine') {
      const before = state.tutorial?.step;
      const result = activateShrine(state);
      if (result.changed && before === 'resonate' && result.state.borrowedGift === state.tutorial?.borrowedGift) {
        result.state = advanceTutorial(result.state, 'resonance-borrowed');
      }
      apply(result);
      return;
    }
    if (target.type === 'plot') {
      const planted = state.plantings[target.value.id];
      if (planted) {
        if (!isTutorial() && confirm(t('returnSeed', { seed: SEED_NAMES[planted] ?? planted }))) apply(removePlanting(state, target.value.id));
        return;
      }
      const seed = state.seeds[0];
      if (seed) {
        const before = state.tutorial?.step;
        const isRoadHomeRoute = state.tutorial?.targetAnomalyId === 'sign';
        const result = plantSeed(state, target.value.id, seed);
        if (result.changed && before === 'plant') {
          result.state = advanceTutorial(result.state, 'seed-planted');
          if (!isRoadHomeRoute) result.state = advanceTutorial(result.state, 'memory-shaped');
        }
        apply(result);
        if (result.changed && before === 'plant') {
          if (isRoadHomeRoute) panels.showMemoryChoice(state.character, rememberMemory, storyFor(state));
          else panels.showPersonalize(state.character);
        }
        if (result.changed && !isTutorial()) showPendingEnding();
        return;
      }
    }
    apply(inspectNearest(state));
  }

  function keydown(event: KeyboardEvent) {
    if ((event.target as HTMLElement).matches('textarea,input,select')) return;
    if (hasBlockingStory()) return;
    const key = gameKey(event);
    if (MOVEMENT_KEYS.has(key)) event.preventDefault();
    keys.add(key);
    if (key === 'f' && (!isTutorial() || state.tutorial?.step === 'gift' || state.tutorial?.step === 'combine')) useGift();
    if (key === 'e' && (!isTutorial() || state.tutorial?.step === 'resonate' || state.tutorial?.step === 'plant')) interact();
    if (!isTutorial() && key === 'j') panels.showJournal(state);
    if (!isTutorial() && key === 'c') panels.showCharacter(state);
    if (!isTutorial() && key === 'k') panels.showContractBoard(state);
  }

  function keyup(event: KeyboardEvent) {
    const key=gameKey(event),wasMoving=MOVEMENT_KEYS.has(key)&&keys.has(key);
    keys.delete(key);
    if(wasMoving)store.save(state);
  }

  function wake() {
    state = advanceTutorial(state, 'wake');
    panels.clear();
    saveAndRefresh();
  }

  function frame(now: number) {
    const dt = Math.min(40, now - previous);
    previous = now;
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy--;
    if (keys.has('s') || keys.has('arrowdown')) dy++;
    if (keys.has('a') || keys.has('arrowleft')) dx--;
    if (keys.has('d') || keys.has('arrowright')) dx++;
    dx += touchVector.x;
    dy += touchVector.y;
    const step = state.tutorial?.step;
    if (step === 'wake' || step === 'clue' || step === 'recovered' || step === 'remember' || step === 'personalize' || hasBlockingStory()) {
      dx = 0;
      dy = 0;
    }
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      const keyboardMoving = keys.has('w') || keys.has('arrowup') || keys.has('s') || keys.has('arrowdown') || keys.has('a') || keys.has('arrowleft') || keys.has('d') || keys.has('arrowright');
      const strength = keyboardMoving ? 1 : Math.min(1, length);
      const moveX = dx / length * strength * dt * .24;
      const moveY = dy / length * strength * dt * .24;
      state = movePlayer(state, { x: moveX, y: moveY }, now);
      if (state.expedition && !isTutorial()) maybeSpeakRadio(Math.hypot(moveX, moveY));
      if (state.tutorial?.step === 'move' && distance(state.player, state.tutorial.start) > 35) {
        state = advanceTutorial(state, 'moved');
        saveAndRefresh();
      } else if (Math.floor(now / 500) !== Math.floor((now - dt) / 500)) {
        store.save(state);
      }
      if (state.tutorial?.step === 'resonate') {
        const target = tutorialTarget(state);
        const isNear = !!target && distance(state.player, target) <= 160;
        if (isNear !== wasNearResonance) {
          wasNearResonance = isNear;
          updateHud();
        }
      }
    }
    if (waypoint && distance(state.player, waypoint) < 140) {
      waypoint = undefined;
      waypointId = undefined;
    }
    pose = movementPose(dx, dy, pose.facing);
    renderer.render(state, now, pose, waypoint);
    frameId = requestAnimationFrame(frame);
  }

  function replaceCharacter(character: Character) {
    state = { ...state, character };
    saveAndRefresh();
    if (state.pendingChapter) showPendingMemoryChapter();
    else if (hasReachedEnding(state)) showPendingEnding();
    else if (state.tutorial?.step === 'clue' || state.tutorial?.step === 'recovered') showCurrentStoryStep();
    else if (state.tutorial?.step === 'remember') panels.showMemoryChoice(character, rememberMemory, storyFor(state));
    else if (state.tutorial?.step === 'personalize') panels.showPersonalize(character);
    else panels.clear();
    toast(t('entersMemory', { name: character.name }));
  }

  function updatePersonality(name: string, description: string, quirk: CatalogEntry<QuirkId>) {
    state = { ...state, character: { ...state.character, name, description, quirk } };
    saveAndRefresh();
    panels.showPersonalize(state.character);
    toast(t('clearingRemembered'));
  }

  function updateAppearance(appearance: Appearance) {
    state = { ...state, character: { ...state.character, appearance } };
    saveAndRefresh();
    panels.showPersonalize(state.character);
    toast(t('newLook'));
  }

  function updateEquipment(id: WearableId) {
    state = equipWearable(state, id);
    saveAndRefresh();
    panels.showCharacter(state);
  }

  function finishPersonalization() {
    state = advanceTutorial(state, 'personalization-dismissed');
    saveAndRefresh();
    panels.showWhatNext(state, () => panels.showContractBoard(state), () => {
      panels.clear();
      toast(t('clearingOpen'));
    });
  }

  function startContract(contractId:ContractId,loadout:[GiftId,GiftId]){
    const started=startExpedition(state,contractId,loadout,randomSeed()||1);state=started.state;
    if(started.ok){
      expeditionWalk = 0;
      lastRadioWalk = -999;
      renderRadio();
      panels.clear();
      startExpeditionDirector();
    }
    saveAndRefresh();toast(started.message);
  }

  function startExpeditionDirector(){
    const run=state.expedition;if(!run||!writerPreference?.isEnabled())return;
    const meta=expeditionMetaFor(state);
    const season=seasonDirectorNotes(state);
    localWriter?.startExpedition({expeditionId:run.id,seed:run.seed,character:state.character,contractName:CONTRACTS[run.contractId].name,siteIds:[...run.siteIds,run.optionalSiteId],recentMemories:meta.reports.flatMap((report)=>report.memory?[report.memory]:[]).slice(0,5),recentFingerprints:meta.reports.flatMap((report)=>report.narrativeFingerprint?[report.narrativeFingerprint]:[]).slice(0,10),seasonBeat:season.seasonBeat,throughline:season.throughline,priorBeats:season.priorBeats});
  }

  function maybeSpeakRadio(distanceMoved: number) {
    expeditionWalk += distanceMoved;
    if (!canSpeakRadio(state, expeditionWalk, lastRadioWalk)) return;
    const fallback = nextRadioRemark(state);
    if (!fallback) return;
    state = speakRadio(state, fallback);
    lastRadioWalk = expeditionWalk;
    renderRadio(fallback);
    store.save(state);
    if (writerPreference?.isEnabled() && localWriter?.isIdle()) {
      const notes = radioDirectorNotes(state);
      localWriter.startRadio({
        expeditionId: fallback.expeditionId, seed: state.expedition!.seed, character: state.character,
        voice: notes.voice, beat: notes.beat, lastDecision: notes.lastDecision, remembered: notes.remembered,
      });
    }
  }

  function applyRadioRemark(expeditionId: string, remark: Pick<RadioRemark, 'text' | 'mistaken'>) {
    if (state.expedition?.id !== expeditionId) return;
    const spoken: RadioRemark = { id: `radio-${expeditionId}-model`, expeditionId, text: remark.text, mistaken: remark.mistaken, source: 'local-model' };
    state = replaceLastRadio(state, spoken);
    renderRadio(state.radio?.spoken.at(-1));
    store.save(state);
  }

  function applyRelicCard(eventId: string, relic: Relic) {
    if (relic.eventId !== eventId) return;
    state = replaceLastRelic(state, relic);
    saveAndRefresh();
  }

  function startRelicDirector(eventId: string, eventTitle: string, seed: number) {
    if (!writerPreference?.isEnabled() || !localWriter?.isIdle()) return;
    localWriter.startRelic({
      eventId, seed, character: state.character, eventTitle,
      allowedForms: RELIC_FORMS.join('|'), allowedColors: RELIC_COLORS.join('|'),
    });
  }

  function applyLocalExpedition(expeditionId:string,narrative:Parameters<typeof applyExpeditionNarrative>[2]){
    const next=applyExpeditionNarrative(state,expeditionId,narrative);
    if(next===state)return;
    state=next;saveAndRefresh();panels.refreshExpeditionNarrative(state);toast(t('directorFinished',{title:narrative.title}));
  }

  function buildProject(projectId:RefugeProjectId){
    const built=buildRefugeProject(state,projectId);state=built.state;saveAndRefresh();toast(built.message);panels.showContractBoard(state);
  }

  function rememberMemory(answer: string) {
    const detail = answer.trim().slice(0, 100);
    if (!detail || state.tutorial?.step !== 'remember') return;
    state = {
      ...state,
      memoryDetails: { ...state.memoryDetails, [ROAD_HOME.id]: detail },
    };
    state = advanceTutorial(state, 'memory-shaped');
    saveAndRefresh();
    panels.showPersonalize(state.character);
    toast(t('truthNowPart', { title: storyFor(state).chapters.sign?.title ?? t('thisMemory') }));
  }

  function beginNewTale() {
    localWriter?.cancel();
    keys.clear();
    resetTouch();
    waypoint = undefined;
    waypointId = undefined;
    expeditionWalk = 0;
    lastRadioWalk = -999;
    renderRadio();
    clearToast();
    state = prepareNewRun(state.character);
    panels.clear();
    saveAndRefresh();
    panels.showWake(state.character, wake, true, storyFor(state));
    if (writerPreference?.isEnabled()) localWriter?.start(state.character, state.worldSeed ?? 0);
  }

  function showWriterStatus(status: WriterStatus) {
    if (!writerPanelVisible) return;
    panels.showStoryLoom(status, dismissLocalStory, retryLocalStory);
  }

  function applyLocalStory(story: NonNullable<GameState['storyArc']>) {
    if (story.seed !== (state.worldSeed ?? 0)) return;
    state = { ...state, storyArc: story, ...gearForDirection(story.direction!) };
    if (state.tutorial?.step === 'wake') state = prepareTutorial(state);
    writerPreference?.enable();
    saveAndRefresh();
    if (!writerPanelVisible && state.tutorial?.step === 'wake') panels.showWake(state.character, wake, true, storyFor(state));
  }

  function startLocalStory() {
    writerPanelVisible = true;
    localWriter?.start(state.character, state.worldSeed ?? 0);
  }

  function retryLocalStory() {
    localWriter?.cancel();
    startLocalStory();
  }

  function dismissLocalStory() {
    writerPanelVisible = false;
    if (state.tutorial?.step === 'wake') panels.showWake(state.character, wake, true, storyFor(state));
    else if (state.tutorial?.step === 'personalize') panels.showPersonalize(state.character);
    else panels.clear();
  }

  function autoLocalStory() {
    writerPanelVisible = state.tutorial?.step === 'wake';
    if(!writerPreference?.isEnabled())return;
    if(state.expedition&&expeditionNarrativeFor(state)?.source!=='local-model')startExpeditionDirector();
    else if(state.storyArc?.source!=='local-model')localWriter?.start(state.character,state.worldSeed??0);
  }

  addEventListener('keydown', keydown);
  addEventListener('keyup', keyup);
  addEventListener('pointermove', moveTouch, { passive: false });
  addEventListener('pointerup', endTouch);
  addEventListener('pointercancel', endTouch);
  addEventListener('blur', interruptTouch);
  const visibilityChanged = () => { if (document.hidden) interruptTouch(); };
  document.addEventListener('visibilitychange', visibilityChanged);
  const resize = () => { renderer.resize(); updateHud(); };
  addEventListener('resize', resize);
  updateHud();
  store.save(state);
  if (state.pendingChapter) showPendingMemoryChapter();
  else if (hasReachedEnding(state)) showPendingEnding();
  else if (state.tutorial?.step === 'wake') panels.showWake(state.character, wake, state.tutorial.targetAnomalyId === 'sign', storyFor(state));
  else if (state.tutorial?.step === 'clue' || state.tutorial?.step === 'recovered') showCurrentStoryStep();
  else if (state.tutorial?.step === 'remember') panels.showMemoryChoice(state.character, rememberMemory, storyFor(state));
  else if (state.tutorial?.step === 'personalize') panels.showPersonalize(state.character);
  else panels.clear();
  frameId = requestAnimationFrame(frame);

  return {
    getState: () => state,
    replaceCharacter,
    updatePersonality,
    updateAppearance,
    updateEquipment,
    startContract,
    buildProject,
    finishPersonalization,
    beginNewTale,
    showWriterStatus,
    applyLocalStory,
    applyLocalExpedition,
    applyRadioRemark,
    applyRelicCard,
    startLocalStory,
    autoLocalStory,
    destroy: () => {
      removeEventListener('keydown', keydown);
      removeEventListener('keyup', keyup);
      removeEventListener('pointermove', moveTouch);
      removeEventListener('pointerup', endTouch);
      removeEventListener('pointercancel', endTouch);
      removeEventListener('blur', interruptTouch);
      document.removeEventListener('visibilitychange', visibilityChanged);
      removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
      clearTimeout(radioTimer);
      radioRoot.remove();
      localWriter?.destroy();
    },
  };
}
