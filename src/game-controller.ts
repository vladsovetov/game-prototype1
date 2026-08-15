import { activateGift, activateShrine, inspectNearest, movePlayer, nearestTarget, plantSeed, removePlanting } from './domain/simulation';
import { advanceTutorial, tutorialObjective, tutorialTarget } from './domain/tutorial';
import { memoryProgress, ROAD_HOME } from './domain/memory';
import { hasReachedEnding, memoryChapter, sanctuaryProgress } from './domain/memory-arc';
import type { Appearance, CatalogEntry, Character, GameState, InteractionResult, QuirkId } from './domain/types';
import { SEED_NAMES, distance } from './domain/world';
import type { createSaveStore } from './persistence/save-store';
import type { createCanvasRenderer } from './ui/canvas-renderer';
import type { createPanels } from './ui/panels';

type Renderer = ReturnType<typeof createCanvasRenderer>;
type Panels = ReturnType<typeof createPanels>;
type Store = ReturnType<typeof createSaveStore>;

export function createGameController(initial: GameState, renderer: Renderer, panels: Panels, store: Store, hud: HTMLElement, toastRoot: HTMLElement) {
  let state = initial;
  const keys = new Set<string>();
  let previous = performance.now();
  let toastTimer = 0;
  let frameId = 0;
  let wasNearResonance = false;
  let touchPointer: number | undefined;
  let touchOrigin = { x: 0, y: 0 };
  let touchVector = { x: 0, y: 0 };
  let touchKnob: HTMLElement | undefined;

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
      (hud.querySelector('.memory-progress small') as HTMLElement).textContent = `${progress.found} / ${progress.total} CLUES`;
      (hud.querySelector('.tutorial-hud strong') as HTMLElement).textContent = objective.title;
      (hud.querySelector('.objective-copy') as HTMLElement).textContent = objective.action;
      const key = hud.querySelector<HTMLElement>('.objective-key')!;
      if (objective.key) key.textContent = isTouchLayout() ? (objective.key === 'WASD' ? 'DRAG' : 'TAP') : objective.key;
      else key.remove();
      if (isTouchLayout()) renderTouchControls(objective.key === 'E');
      return;
    }

    hud.innerHTML = `<div class="hud-top"><button class="hud-card identity" data-testid="character-button" aria-label="Your companion"><span class="identity-mark">✦</span><span><strong data-testid="player-name"></strong><small></small><em class="memory-count"></em></span></button><div class="hud-actions"><button data-testid="journal-button" aria-label="Field journal"><span>J</span><small>Journal</small></button><button data-testid="help-button" aria-label="Help"><span>?</span><small>Help</small></button></div></div><div class="prompt"><span class="key">F</span> Gift <i></i><span class="key">E</span> Explore <span class="hud-meta"></span></div>`;
    (hud.querySelector('[data-testid=player-name]') as HTMLElement).textContent = state.character.name;
    (hud.querySelector('.identity small') as HTMLElement).textContent = state.borrowedGift ? `carrying ${state.borrowedGift}` : state.character.gift.name;
    const progress = sanctuaryProgress(state);
    (hud.querySelector('.memory-count') as HTMLElement).textContent = state.endingSeen ? 'Story complete' : `${progress.planted} / ${progress.required} memories planted`;
    (hud.querySelector('.hud-meta') as HTMLElement).textContent = state.seeds.length ? `${state.seeds.length} seed${state.seeds.length === 1 ? '' : 's'}` : '';
    hud.querySelector('[data-testid=character-button]')?.addEventListener('click', () => panels.showCharacter(state.character));
    hud.querySelector('[data-testid=journal-button]')?.addEventListener('click', () => panels.showJournal(state));
    hud.querySelector('[data-testid=help-button]')?.addEventListener('click', panels.showHelp);
    if (isTouchLayout()) renderTouchControls(false);
  }

  function renderTouchControls(atResonance: boolean) {
    resetTouch();
    const controls = document.createElement('div');
    controls.className = 'touch-controls';
    controls.dataset.testid = 'touch-controls';
    controls.innerHTML = `<div class="touch-joystick" data-testid="touch-joystick" role="application" aria-label="Move character"><span class="touch-ring"><i class="touch-knob"></i></span><small>Move</small></div><div class="touch-actions"></div>`;
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
      const gift = addAction('Gift', 'Use Gift', '✦', useGift, true);
      gift.dataset.testid = 'touch-primary-action';
      addAction('Explore', 'Explore nearby', '◌', interact);
    } else if (step === 'gift') {
      const button = addAction(`Use ${state.character.gift.name}`, `Use ${state.character.gift.name}`, '✦', useGift, true);
      button.dataset.testid = 'touch-primary-action';
    } else if (step === 'combine') {
      const borrowed = state.tutorial?.borrowedGift ?? state.character.gift.id;
      const label = `Use ${borrowed[0]!.toUpperCase()}${borrowed.slice(1)}`;
      const button = addAction(label, label, '✦', useGift, true);
      button.dataset.testid = 'touch-primary-action';
    } else if (step === 'plant') {
      const button = addAction('Plant memory', 'Plant memory', '⌁', interact, true);
      button.dataset.testid = 'touch-primary-action';
    } else if (step === 'resonate' && atResonance) {
      const borrowed = state.tutorial?.borrowedGift ?? 'mend';
      const label = `Borrow ${borrowed[0]!.toUpperCase()}${borrowed.slice(1)}`;
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
    if (state.tutorial?.step === 'clue') {
      panels.showMemoryBeat('A clue returned', ROAD_HOME.firstClue(state.character.name), 'Finish the memory', finishClue);
    } else if (state.tutorial?.step === 'recovered') {
      panels.showMemoryBeat('Memory recovered', ROAD_HOME.recovered(state.character.name), 'Bring it home', finishRecoveredMemory);
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
    const chapter = memoryChapter(state.pendingChapter);
    if (!chapter) {
      finishMemoryChapter();
      return;
    }
    panels.showMemoryChapter(chapter, state.rewarded.length, finishMemoryChapter);
  }

  function finishEnding() {
    state = { ...state, endingSeen: true };
    panels.clear();
    saveAndRefresh();
    toast('The sanctuary remembers. The meadow remains yours to explore.');
  }

  function showPendingEnding() {
    if (hasReachedEnding(state)) panels.showEnding(state.character, finishEnding);
  }

  function useGift() {
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

  function interact() {
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
        if (!isTutorial() && confirm(`Return ${SEED_NAMES[planted] ?? planted} to the seed tray?`)) apply(removePlanting(state, target.value.id));
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
          if (isRoadHomeRoute) panels.showMemoryChoice(state.character, rememberMemory);
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
    const key = event.key.toLowerCase();
    keys.add(key);
    if (key === 'f' && (!isTutorial() || state.tutorial?.step === 'gift' || state.tutorial?.step === 'combine')) useGift();
    if (key === 'e' && (!isTutorial() || state.tutorial?.step === 'resonate' || state.tutorial?.step === 'plant')) interact();
    if (!isTutorial() && key === 'j') panels.showJournal(state);
    if (!isTutorial() && key === 'c') panels.showCharacter(state.character);
  }

  function keyup(event: KeyboardEvent) { keys.delete(event.key.toLowerCase()); }

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
      state = movePlayer(state, { x: dx / length * strength * dt * .24, y: dy / length * strength * dt * .24 }, now);
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
    renderer.render(state, now);
    frameId = requestAnimationFrame(frame);
  }

  function replaceCharacter(character: Character) {
    state = { ...state, character };
    saveAndRefresh();
    if (state.pendingChapter) showPendingMemoryChapter();
    else if (hasReachedEnding(state)) showPendingEnding();
    else if (state.tutorial?.step === 'clue' || state.tutorial?.step === 'recovered') showCurrentStoryStep();
    else if (state.tutorial?.step === 'remember') panels.showMemoryChoice(character, rememberMemory);
    else if (state.tutorial?.step === 'personalize') panels.showPersonalize(character);
    else panels.clear();
    toast(`${character.name} steps into this memory.`);
  }

  function updatePersonality(name: string, description: string, quirk: CatalogEntry<QuirkId>) {
    state = { ...state, character: { ...state.character, name, description, quirk } };
    saveAndRefresh();
    panels.showPersonalize(state.character);
    toast('The meadow remembers that.');
  }

  function updateAppearance(appearance: Appearance) {
    state = { ...state, character: { ...state.character, appearance } };
    saveAndRefresh();
    panels.showPersonalize(state.character);
    toast('A new shape settles into place.');
  }

  function finishPersonalization() {
    state = advanceTutorial(state, 'personalization-dismissed');
    panels.clear();
    saveAndRefresh();
    toast('The whole meadow is open. There is no timer.');
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
    toast('That truth is now part of The Road Home.');
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
  else if (state.tutorial?.step === 'wake') panels.showWake(state.character, wake, state.tutorial.targetAnomalyId === 'sign');
  else if (state.tutorial?.step === 'clue' || state.tutorial?.step === 'recovered') showCurrentStoryStep();
  else if (state.tutorial?.step === 'remember') panels.showMemoryChoice(state.character, rememberMemory);
  else if (state.tutorial?.step === 'personalize') panels.showPersonalize(state.character);
  else panels.clear();
  frameId = requestAnimationFrame(frame);

  return {
    getState: () => state,
    replaceCharacter,
    updatePersonality,
    updateAppearance,
    finishPersonalization,
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
    },
  };
}
