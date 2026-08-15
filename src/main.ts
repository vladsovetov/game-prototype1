import './styles.css';
import { QUIRKS } from './domain/catalog';
import { generateCharacter } from './domain/character';
import { prepareNewRun } from './domain/run';
import { randomSeed } from './domain/random';
import type { Appearance, Character, ContractId, GiftId, QuirkId, RefugeProjectId, WearableId } from './domain/types';
import { createGameController } from './game-controller';
import { createSaveStore } from './persistence/save-store';
import { createCanvasRenderer } from './ui/canvas-renderer';
import { createPanels } from './ui/panels';
import { createLocalStoryWriter } from './story/local-story-writer';
import { createLocalePreference, setActiveLocale } from './i18n/locale';
import { t } from './i18n/messages';
import { createLanguageSwitcher } from './ui/language-switcher';

const localePreference = createLocalePreference(localStorage, navigator.languages?.length ? navigator.languages : [navigator.language]);
const locale = localePreference.load();
setActiveLocale(locale);
document.documentElement.lang = locale;
document.title = t('brand');

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const modal = document.querySelector<HTMLElement>('#modal-root');
const hud = document.querySelector<HTMLElement>('#hud');
const toasts = document.querySelector<HTMLElement>('#toast-root');
if (!canvas || !modal || !hud || !toasts) throw new Error(t('incompleteShell'));
canvas.setAttribute('aria-label', t('canvasLabel', { brand: t('brand') }));
document.body.append(createLanguageSwitcher(locale, (nextLocale) => {
  localePreference.save(nextLocale);
  location.reload();
}));

const store = createSaveStore(localStorage);
const renderer = createCanvasRenderer(canvas);
let controller: ReturnType<typeof createGameController> | undefined;
const WRITER_PREFERENCE = 'unwritten.prototype.local-writer.v1';

const panels = createPanels(modal, {
  onImport: (character: Character) => controller?.replaceCharacter(character),
  onReset: () => { store.clear(); location.reload(); },
  onNewTale: () => controller?.beginNewTale(),
  onPersonality: (name: string, description: string, quirk: QuirkId) => controller?.updatePersonality(name, description, QUIRKS[quirk]),
  onAppearance: (appearance: Appearance) => controller?.updateAppearance(appearance),
  onPersonalizationDone: () => controller?.finishPersonalization(),
  onLocalStory: () => controller?.startLocalStory(),
  onEquip: (id: WearableId) => controller?.updateEquipment(id),
  onStartExpedition: (id: ContractId, loadout: [GiftId, GiftId]) => controller?.startContract(id, loadout),
  onBuildProject: (id: RefugeProjectId) => controller?.buildProject(id),
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
    setTimeout(() => alert(t('corruptSave')), 50);
  }
  const localWriter = createLocalStoryWriter({
    workerFactory: () => new Worker(new URL('./story/local-story-worker.ts', import.meta.url), { type: 'module' }),
    onStatus: (status) => controller?.showWriterStatus(status),
    onStory: (story) => controller?.applyLocalStory(story),
    onExpedition: (expeditionId,narrative) => controller?.applyLocalExpedition(expeditionId,narrative),
  }, locale);
  controller = createGameController(state, renderer, panels, store, hud, toasts, localWriter, {
    enable: () => localStorage.setItem(WRITER_PREFERENCE, 'enabled'),
    isEnabled: () => localStorage.getItem(WRITER_PREFERENCE) === 'enabled',
  });
  controller.autoLocalStory();
}
