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
import { createLocalePreference, LOCALE_SWITCH_SESSION_KEY, setActiveLocale } from './i18n/locale';
import { createVoicePreference } from './i18n/voice-preference';
import { t } from './i18n/messages';
import { resetPlaythrough, WRITER_PREFERENCE_KEY } from './persistence/playthrough-reset';
import { createSiteChrome } from './ui/language-switcher';
import { createVersionMark } from './ui/version-mark';
import { createVoiceNarrator } from './voice/voice-narrator';

const localePreference = createLocalePreference(localStorage, navigator.languages?.length ? navigator.languages : [navigator.language]);
const locale = localePreference.load();
setActiveLocale(locale);
document.documentElement.lang = locale;
document.title = t('brand');
const voicePreference = createVoicePreference(localStorage);
document.documentElement.dataset.voiceState = voicePreference.load() ? 'ready' : 'off';
const voice = createVoiceNarrator({
  preference: voicePreference,
  locale,
  onStatus: (status) => {
    document.documentElement.dataset.voiceState = status.phase;
    panels.updateVoiceStatus(status);
  },
});

const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
const modal = document.querySelector<HTMLElement>('#modal-root');
const hud = document.querySelector<HTMLElement>('#hud');
const toasts = document.querySelector<HTMLElement>('#toast-root');
if (!canvas || !modal || !hud || !toasts) throw new Error(t('incompleteShell'));
canvas.setAttribute('aria-label', t('canvasLabel', { brand: t('brand') }));
const resetAndReload = () => {
  void resetPlaythrough(localStorage).then(() => location.reload());
};
document.body.append(createSiteChrome(locale, (nextLocale) => {
  localePreference.save(nextLocale);
  sessionStorage.setItem(LOCALE_SWITCH_SESSION_KEY, '1');
  location.reload();
}, () => {
  if (confirm(t('reloadGameConfirm'))) resetAndReload();
}), createVersionMark());

const store = createSaveStore(localStorage);
const renderer = createCanvasRenderer(canvas);
let controller: ReturnType<typeof createGameController> | undefined;

const panels = createPanels(modal, {
  onImport: (character: Character) => controller?.replaceCharacter(character),
  onReset: resetAndReload,
  onNewTale: () => controller?.beginNewTale(),
  onPersonality: (name: string, description: string, quirk: QuirkId) => controller?.updatePersonality(name, description, QUIRKS[quirk]),
  onAppearance: (appearance: Appearance) => controller?.updateAppearance(appearance),
  onPersonalizationDone: () => controller?.finishPersonalization(),
  onLocalStory: () => controller?.startLocalStory(),
  onEquip: (id: WearableId) => controller?.updateEquipment(id),
  onStartExpedition: (id: ContractId, loadout: [GiftId, GiftId]) => controller?.startContract(id, loadout),
  onBuildProject: (id: RefugeProjectId) => controller?.buildProject(id),
  onToggleVoice: (enabled) => controller?.toggleVoice(enabled),
  isVoiceEnabled: () => voice.isEnabled(),
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
    onRadio: (expeditionId, remark) => controller?.applyRadioRemark(expeditionId, remark),
    onRelic: (eventId, relic) => controller?.applyRelicCard(eventId, relic),
  }, locale);
  controller = createGameController(state, renderer, panels, store, hud, toasts, localWriter, {
    enable: () => localStorage.setItem(WRITER_PREFERENCE_KEY, 'enabled'),
    isEnabled: () => localStorage.getItem(WRITER_PREFERENCE_KEY) === 'enabled',
  }, voice);
  const localeOnly = sessionStorage.getItem(LOCALE_SWITCH_SESSION_KEY);
  if (localeOnly) sessionStorage.removeItem(LOCALE_SWITCH_SESSION_KEY);
  else controller.autoLocalStory();
}
