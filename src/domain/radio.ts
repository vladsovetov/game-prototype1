import { getActiveLocale, localizedCopy, type Locale } from '../i18n/locale';
import { beatForExpedition, ensureSeason, seasonHook } from './season';
import type { GameState, RadioLog, RadioRemark, RadioVoice, SeasonBeatId } from './types';

export const RADIO_WALK_GAP = 420;

interface RadioLine {
  id: string;
  text: string;
  mistaken: boolean;
  beats: SeasonBeatId[];
  farther?: boolean;
}

const VOICES: RadioVoice[] = ['careful', 'curious', 'wistful'];

const LINES: Record<Locale, readonly RadioLine[]> = {
  uk: [
    { id: 'symbol-flipped', mistaken: false, beats: ['strange-signal', 'echo'], text: 'Цей символ уже був на дверях станції. Але минулого разу він був перевернутий.' },
    { id: 'cable-hum', mistaken: false, beats: ['first-evidence', 'source'], text: 'Чуєте? Під ногами гуде не вода. Це той самий кабель, лише тихіший.' },
    { id: 'wrong-east', mistaken: true, beats: ['first-evidence', 'contradiction'], text: 'Стрілка дивиться на схід. Ні, зачекайте — я, здається, плутаю з минулим маршрутом.' },
    { id: 'notes-disagree', mistaken: false, beats: ['contradiction', 'echo'], text: 'У записнику два рядки про це місце. Вони не можуть бути правдивими разом.' },
    { id: 'refuge-voice', mistaken: false, beats: ['strange-signal', 'source'], text: 'Притулок щойно клацнув у навушнику. Поле тут мовчить.' },
    { id: 'clock-rain', mistaken: false, beats: ['choice-consequence', 'lasting-decision'], text: 'Дощ знову почався за годинником, не за хмарами. Це вже не випадковість.' },
    { id: 'farther-cost', mistaken: false, beats: ['choice-consequence', 'echo'], farther: true, text: 'Ми вже раз пішли далі. Тоді припаси намокли, а слід став чіткішим.' },
    { id: 'turned-back', mistaken: false, beats: ['choice-consequence', 'lasting-decision'], farther: false, text: 'Минулого разу ми повернулися раніше. Поле тоді лишило нам незакрите питання.' },
    { id: 'mistaken-name', mistaken: true, beats: ['echo', 'strange-signal'], text: 'Це ж пост Орелі, так? Ні… табличка інша. Вибачте, я складаю характер із уламків.' },
    { id: 'lasting-quiet', mistaken: false, beats: ['lasting-decision', 'source'], text: 'Якщо зараз лишити це як є, наступна експедиція почує тихіший позивний.' },
  ],
  en: [
    { id: 'symbol-flipped', mistaken: false, beats: ['strange-signal', 'echo'], text: 'This symbol was already on the station door. Last time it was inverted.' },
    { id: 'cable-hum', mistaken: false, beats: ['first-evidence', 'source'], text: 'Hear that? It is not water underfoot. It is the same cable, only quieter.' },
    { id: 'wrong-east', mistaken: true, beats: ['first-evidence', 'contradiction'], text: 'The arrow faces east. No — wait. I think I am mixing this with the last route.' },
    { id: 'notes-disagree', mistaken: false, beats: ['contradiction', 'echo'], text: 'The notebook has two lines about this place. They cannot both be true.' },
    { id: 'refuge-voice', mistaken: false, beats: ['strange-signal', 'source'], text: 'The Refuge just clicked in the earpiece. The field here is silent.' },
    { id: 'clock-rain', mistaken: false, beats: ['choice-consequence', 'lasting-decision'], text: 'Rain started on the clock again, not on the clouds. That is no longer chance.' },
    { id: 'farther-cost', mistaken: false, beats: ['choice-consequence', 'echo'], farther: true, text: 'We went farther once already. The supplies got wet, and the trail got clearer.' },
    { id: 'turned-back', mistaken: false, beats: ['choice-consequence', 'lasting-decision'], farther: false, text: 'Last time we turned back earlier. The field left us an unfinished question.' },
    { id: 'mistaken-name', mistaken: true, beats: ['echo', 'strange-signal'], text: 'This is Aurelie’s post, yes? No… the plate is different. Sorry. I am assembling a character from scraps.' },
    { id: 'lasting-quiet', mistaken: false, beats: ['lasting-decision', 'source'], text: 'If we leave this as it is, the next expedition will hear a quieter call sign.' },
  ],
  ru: [
    { id: 'symbol-flipped', mistaken: false, beats: ['strange-signal', 'echo'], text: 'Этот символ уже был на двери станции. Но в прошлый раз он был перевёрнут.' },
    { id: 'cable-hum', mistaken: false, beats: ['first-evidence', 'source'], text: 'Слышите? Под ногами гудит не вода. Это тот же кабель, только тише.' },
    { id: 'wrong-east', mistaken: true, beats: ['first-evidence', 'contradiction'], text: 'Стрелка смотрит на восток. Нет, подождите — кажется, я путаю с прошлым маршрутом.' },
    { id: 'notes-disagree', mistaken: false, beats: ['contradiction', 'echo'], text: 'В блокноте две строки об этом месте. Они не могут быть правдой одновременно.' },
    { id: 'refuge-voice', mistaken: false, beats: ['strange-signal', 'source'], text: 'Убежище только что щёлкнуло в наушнике. Поле здесь молчит.' },
    { id: 'clock-rain', mistaken: false, beats: ['choice-consequence', 'lasting-decision'], text: 'Дождь снова начался по часам, не по тучам. Это уже не случайность.' },
    { id: 'farther-cost', mistaken: false, beats: ['choice-consequence', 'echo'], farther: true, text: 'Мы уже однажды пошли дальше. Тогда припасы промокли, а след стал яснее.' },
    { id: 'turned-back', mistaken: false, beats: ['choice-consequence', 'lasting-decision'], farther: false, text: 'В прошлый раз мы вернулись раньше. Поле оставило нам незакрытый вопрос.' },
    { id: 'mistaken-name', mistaken: true, beats: ['echo', 'strange-signal'], text: 'Это же пост Орели, да? Нет… табличка другая. Простите, я собираю характер из обломков.' },
    { id: 'lasting-quiet', mistaken: false, beats: ['lasting-decision', 'source'], text: 'Если оставить это как есть, следующая экспедиция услышит более тихий позывной.' },
  ],
};

export function radioBudget(seed: number) {
  return 2 + ((seed >>> 0) % 3);
}

export function ensureRadio(state: GameState): GameState {
  if (state.radio) return state;
  const seed = state.season?.seed ?? state.worldSeed ?? 1;
  return { ...ensureSeason(state), radio: { voice: VOICES[seed % VOICES.length]!, spoken: [] } };
}

export function spokenThisExpedition(radio: RadioLog | undefined, expeditionId: string) {
  return radio?.spoken.filter((remark) => remark.expeditionId === expeditionId) ?? [];
}

export function canSpeakRadio(state: GameState, walked: number, lastSpokeWalk: number) {
  const run = state.expedition;
  if (!run || run.status === 'decision') return false;
  if (spokenThisExpedition(state.radio, run.id).length >= radioBudget(run.seed)) return false;
  return walked - lastSpokeWalk >= RADIO_WALK_GAP;
}

function lineTable(locale = getActiveLocale()) {
  return localizedCopy(LINES, locale);
}

export function nextRadioRemark(state: GameState, now = Date.now()): RadioRemark | undefined {
  const run = state.expedition;
  if (!run) return undefined;
  const ready = ensureRadio(state);
  const season = ready.season!;
  const beat = beatForExpedition(season, run.id);
  const used = new Set(spokenThisExpedition(ready.radio, run.id).map((remark) => remark.lineId));
  const lastFarther = season.decisions.at(-1)?.wentFarther;
  const lines = lineTable();
  const ranked = [...lines].sort((left, right) => {
    const leftBeat = beat && left.beats.includes(beat.id) ? 0 : 1;
    const rightBeat = beat && right.beats.includes(beat.id) ? 0 : 1;
    if (leftBeat !== rightBeat) return leftBeat - rightBeat;
    const leftFarther = lastFarther !== undefined && left.farther === lastFarther ? 0 : 1;
    const rightFarther = lastFarther !== undefined && right.farther === lastFarther ? 0 : 1;
    return leftFarther - rightFarther;
  });
  const chosen = ranked.find((line) => !used.has(line.id)) ?? ranked[0];
  if (!chosen) return undefined;
  return {
    id: `radio-${run.id}-${now}`,
    expeditionId: run.id,
    lineId: chosen.id,
    text: chosen.text,
    mistaken: chosen.mistaken,
    source: 'fallback',
  };
}

export function speakRadio(state: GameState, remark: RadioRemark): GameState {
  const next = structuredClone(ensureRadio(state));
  const run = next.expedition;
  if (!run || remark.expeditionId !== run.id) return state;
  if (spokenThisExpedition(next.radio, run.id).length >= radioBudget(run.seed)) return next;
  next.radio!.spoken = [...next.radio!.spoken, remark].slice(-24);
  return next;
}

export function replaceLastRadio(state: GameState, remark: RadioRemark): GameState {
  const next = structuredClone(ensureRadio(state));
  const spoken = next.radio!.spoken;
  const last = spoken.at(-1);
  if (!last || last.expeditionId !== remark.expeditionId || last.source !== 'fallback') return speakRadio(state, remark);
  spoken[spoken.length - 1] = { ...remark, id: last.id, expeditionId: last.expeditionId };
  return next;
}

export function localizeRadio(radio: RadioLog | undefined, locale = getActiveLocale()): RadioLog | undefined {
  if (!radio) return radio;
  const lines = lineTable(locale);
  return {
    ...radio,
    spoken: radio.spoken.map((remark) => {
      const line = remark.lineId ? lines.find((item) => item.id === remark.lineId) : undefined;
      return line ? { ...remark, text: line.text, mistaken: line.mistaken } : remark;
    }),
  };
}

export function radioDirectorNotes(state: GameState) {
  const ready = ensureRadio(state);
  const run = ready.expedition;
  const season = ready.season;
  const beat = run && season ? beatForExpedition(season, run.id) : undefined;
  const last = season?.decisions.at(-1);
  return {
    voice: ready.radio!.voice,
    beat: beat ? `${beat.id}:${seasonHook(season!, beat.id)}` : '',
    lastDecision: last ? `${last.contractId}:${last.wentFarther ? 'farther' : 'returned'}` : '',
    remembered: ready.radio!.spoken.slice(-4).map((remark) => remark.text),
  };
}
