import './styles.css';
import { QUIRKS } from './domain/catalog';
import { generateCharacter } from './domain/character';
import { prepareNewRun } from './domain/run';
import { randomSeed } from './domain/random';
import type { Appearance, Character, QuirkId } from './domain/types';
import { createGameController } from './game-controller';
import { createSaveStore } from './persistence/save-store';
import { createCanvasRenderer } from './ui/canvas-renderer';
import { createPanels } from './ui/panels';

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const modal = document.querySelector<HTMLElement>('#modal-root');
const hud = document.querySelector<HTMLElement>('#hud');
const toasts = document.querySelector<HTMLElement>('#toast-root');
if (!canvas || !modal || !hud || !toasts) throw new Error('Application shell is incomplete.');

const store = createSaveStore(localStorage);
const renderer = createCanvasRenderer(canvas);
let controller: ReturnType<typeof createGameController> | undefined;

const panels = createPanels(modal, {
  onImport: (character: Character) => controller?.replaceCharacter(character),
  onReset: () => { store.clear(); location.reload(); },
  onPersonality: (name: string, description: string, quirk: QuirkId) => controller?.updatePersonality(name, description, QUIRKS[quirk]),
  onAppearance: (appearance: Appearance) => controller?.updateAppearance(appearance),
  onPersonalizationDone: () => controller?.finishPersonalization(),
});

const loaded = store.load();
if (loaded.kind === 'newer-version') {
  panels.showNewerSave(loaded.version);
} else {
  const seed = randomSeed() || 1;
  const state = loaded.kind === 'loaded'
    ? loaded.state
    : prepareNewRun(generateCharacter(seed), seed);
  if (loaded.kind === 'corrupt') {
    setTimeout(() => alert('Your old local save could not be read, so a fresh meadow was opened.'), 50);
  }
  controller = createGameController(state, renderer, panels, store, hud, toasts);
}
