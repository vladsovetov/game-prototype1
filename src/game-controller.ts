import { activateGift, activateShrine, inspectNearest, movePlayer, nearestTarget, plantSeed, removePlanting } from './domain/simulation';
import { advanceTutorial, tutorialObjective } from './domain/tutorial';
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

  const isTutorial = () => !!state.tutorial && state.tutorial.step !== 'done';

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
    if (isTutorial()) {
      if (state.tutorial?.step === 'wake') {
        hud.replaceChildren();
        return;
      }
      const objective = tutorialObjective(state);
      hud.innerHTML = `<div class="tutorial-hud" data-testid="tutorial-objective"><span class="eyebrow">A first memory</span><strong></strong><div class="objective-action"><span class="objective-key"></span><span class="objective-copy"></span></div></div>`;
      (hud.querySelector('.tutorial-hud strong') as HTMLElement).textContent = objective.title;
      (hud.querySelector('.objective-copy') as HTMLElement).textContent = objective.action;
      const key = hud.querySelector<HTMLElement>('.objective-key')!;
      if (objective.key) key.textContent = objective.key;
      else key.remove();
      return;
    }

    hud.innerHTML = `<div class="hud-top"><button class="hud-card identity" data-testid="character-button" aria-label="Your companion"><span class="identity-mark">✦</span><span><strong data-testid="player-name"></strong><small></small></span></button><div class="hud-actions"><button data-testid="journal-button" aria-label="Field journal"><span>J</span><small>Journal</small></button><button data-testid="help-button" aria-label="Help"><span>?</span><small>Help</small></button></div></div><div class="prompt"><span class="key">F</span> Gift <i></i><span class="key">E</span> Explore <span class="hud-meta"></span></div>`;
    (hud.querySelector('[data-testid=player-name]') as HTMLElement).textContent = state.character.name;
    (hud.querySelector('.identity small') as HTMLElement).textContent = state.borrowedGift ? `carrying ${state.borrowedGift}` : state.character.gift.name;
    (hud.querySelector('.hud-meta') as HTMLElement).textContent = state.seeds.length ? `${state.seeds.length} seed${state.seeds.length === 1 ? '' : 's'}` : '';
    hud.querySelector('[data-testid=character-button]')?.addEventListener('click', () => panels.showCharacter(state.character));
    hud.querySelector('[data-testid=journal-button]')?.addEventListener('click', () => panels.showJournal(state));
    hud.querySelector('[data-testid=help-button]')?.addEventListener('click', panels.showHelp);
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

  function useGift() {
    const before = state.tutorial?.step;
    const result = activateGift(state, performance.now());
    if (result.changed && before === 'gift') result.state = advanceTutorial(result.state, 'gift-used');
    if (result.changed && before === 'combine' && result.kind === 'seed') result.state = advanceTutorial(result.state, 'chain-completed');
    apply(result);
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
        const result = plantSeed(state, target.value.id, seed);
        if (result.changed && before === 'plant') result.state = advanceTutorial(result.state, 'seed-planted');
        apply(result);
        if (result.changed && before === 'plant') panels.showPersonalize(state.character);
        return;
      }
    }
    apply(inspectNearest(state));
  }

  function keydown(event: KeyboardEvent) {
    if ((event.target as HTMLElement).matches('textarea,input,select')) return;
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
    if (dx || dy) {
      const length = Math.hypot(dx, dy);
      state = movePlayer(state, { x: dx / length * dt * .24, y: dy / length * dt * .24 }, now);
      if (state.tutorial?.step === 'move' && distance(state.player, state.tutorial.start) > 35) {
        state = advanceTutorial(state, 'moved');
        saveAndRefresh();
      } else if (Math.floor(now / 500) !== Math.floor((now - dt) / 500)) {
        store.save(state);
      }
    }
    renderer.render(state, now);
    frameId = requestAnimationFrame(frame);
  }

  function replaceCharacter(character: Character) {
    state = { ...state, character };
    saveAndRefresh();
    if (state.tutorial?.step === 'personalize') panels.showPersonalize(character);
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

  addEventListener('keydown', keydown);
  addEventListener('keyup', keyup);
  addEventListener('resize', renderer.resize);
  updateHud();
  store.save(state);
  if (state.tutorial?.step === 'wake') panels.showWake(state.character, wake);
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
      removeEventListener('resize', renderer.resize);
      cancelAnimationFrame(frameId);
    },
  };
}
