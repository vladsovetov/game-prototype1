import { getActiveLocale, localizedCopy, type Locale } from '../i18n/locale';
import type { ExpeditionNarrative, ExpeditionProgress, GameState, SeasonArc, SeasonBeat, SeasonBeatId } from './types';

const CORE_BEATS: SeasonBeatId[] = ['strange-signal', 'first-evidence', 'contradiction', 'choice-consequence', 'source', 'lasting-decision'];
const THROUGHLINE_COUNT = 5;

const THROUGHLINES: Record<Locale, readonly string[]> = {
  uk: [
    'Хтось перевертає старі станційні символи, ніби шукає правильний бік дверей.',
    'Вода й сигнал ділять один прихований кабель під схилом.',
    'Попередній мандрівник лишає нотатки, що суперечать одна одній.',
    'Притулок відповідає полю голосом, якого там не повинно бути.',
    'Негода повторює зламаний польовий годинник, а не небо.',
  ],
  en: [
    'Someone is turning the old station symbols, as if hunting the right side of a door.',
    'Water and signal share one hidden cable under the slope.',
    'A previous traveler leaves notes that contradict each other.',
    'The Refuge answers the field in a voice that should not be there.',
    'The weather follows a broken field clock, not the sky.',
  ],
  ru: [
    'Кто-то переворачивает старые станционные символы, будто ищет нужную сторону двери.',
    'Вода и сигнал делят один скрытый кабель под склоном.',
    'Прежний путник оставляет записки, которые противоречат друг другу.',
    'Убежище отвечает полю голосом, которого там быть не должно.',
    'Непогода повторяет сломанные полевые часы, а не небо.',
  ],
};

const HOOKS: Record<Locale, Record<Exclude<SeasonBeatId, 'echo'>, readonly string[]>> = {
  uk: {
    'strange-signal': [
      'На приймачі коротко спалахнув символ зі станційних дверей — перевернутий.',
      'У навушнику клацнуло так, ніби кабель і вода відповіли разом.',
      'Хтось уже викликав цей маршрут голосом, якого немає в журналі.',
      'Притулок тихо повторив позивний ще до виходу за ворота.',
      'Дощ почався в ту саму хвилину, що й зламаний годинник на стовпі.',
    ],
    'first-evidence': [
      'На металі лишився свіжий відбиток того самого символу, лише прямий.',
      'Під кришкою помпи видно той самий обплетений кабель, що несе сигнал.',
      'У записнику два рядки про одне місце — і вони не сходяться.',
      'На воротах Притулку з’явилася риска, якої вчора не було.',
      'Стрілки польового годинника знову стали там, де була буря.',
    ],
    contradiction: [
      'Символ на дверях станції дивиться інакше, ніж той, що був на камені.',
      'Кабель сухий, хоча вода тут явно йшла вночі.',
      'Нова нотатка закреслює стару тим самим олівцем.',
      'Поле мовчить, а Притулок усе ще повторює вчорашній позивний.',
      'Небо ясне, але годинник знову б’є штормову годину.',
    ],
    'choice-consequence': [
      'Після вашого рішення символ знову зрушили — уже третій раз.',
      'Обраний шлях натягнув прихований кабель сильніше, ніж сусідній.',
      'Мандрівник відповів на ваш вибір новою суперечливою позначкою.',
      'Притулок змінив тон відповіді одразу після того, як ви повернулися.',
      'Годинник запізнився рівно на той час, що ви витратили далі від воріт.',
    ],
    source: [
      'Джерело — не нові двері, а людина, що перевертає старі знаки.',
      'Джерело — спільна жила: хто тягне воду, той глушить сигнал.',
      'Джерело — той самий мандрівник, що пише собі суперечливі накази.',
      'Джерело звуку — порожня кімната Притулку, не поле.',
      'Джерело негоди — заводний механізм, а не хмари.',
    ],
    'lasting-decision': [
      'Якщо лишити символи прямими, станція перестане кликати вночі.',
      'Якщо розвести воду й сигнал, обидва маршрути стануть тихішими надовго.',
      'Якщо зібрати нотатки в один зошит, наступний сезон не повторить плутанину.',
      'Якщо відповісти Притулку своїм голосом, чужий позивний згасне.',
      'Якщо зупинити годинник, буря більше не приходитиме за розкладом.',
    ],
  },
  en: {
    'strange-signal': [
      'The receiver flashed the station-door symbol — inverted, and only for a breath.',
      'The earpiece clicked as if cable and water answered together.',
      'Someone already called this route in a voice that is not in the log.',
      'The Refuge repeated the call sign before you left the gate.',
      'Rain began at the same minute as the broken clock on the post.',
    ],
    'first-evidence': [
      'The same symbol is pressed into the metal, only this time it is upright.',
      'Under the pump lid lies the same wrapped cable that also carries signal.',
      'Two lines in the notebook describe one place, and they do not agree.',
      'A mark appeared on the Refuge gate that was not there yesterday.',
      'The field-clock hands are back where the storm last stood.',
    ],
    contradiction: [
      'The station-door symbol faces a different way than the one on the stone.',
      'The cable is dry, though water clearly ran here at night.',
      'A new note crosses out the old one in the same pencil.',
      'The field is quiet, but the Refuge still repeats yesterday’s call.',
      'The sky is clear, yet the clock strikes the storm hour again.',
    ],
    'choice-consequence': [
      'After your choice the symbol was moved again — a third time.',
      'The path you took pulled the hidden cable tighter than the other.',
      'The traveler answered your choice with another contradictory mark.',
      'The Refuge changed its answering tone as soon as you returned.',
      'The clock lost exactly the time you spent farther from the gate.',
    ],
    source: [
      'The source is not a new door, but someone turning the old signs.',
      'The source is a shared vein: whoever draws water also dulls the signal.',
      'The source is the same traveler writing contradictory orders to themself.',
      'The sound’s source is an empty Refuge room, not the field.',
      'The weather’s source is a wound spring, not the clouds.',
    ],
    'lasting-decision': [
      'Leave the symbols upright, and the station will stop calling at night.',
      'Separate water from signal, and both routes will stay quieter for a long time.',
      'Bind the notes into one book, and the next season will not repeat the tangle.',
      'Answer the Refuge in your own voice, and the foreign call sign will fade.',
      'Stop the clock, and the storm will no longer arrive on a schedule.',
    ],
  },
  ru: {
    'strange-signal': [
      'На приёмнике коротко вспыхнул символ со станционной двери — перевёрнутый.',
      'В наушнике щёлкнуло, будто кабель и вода ответили вместе.',
      'Кто-то уже вызвал этот маршрут голосом, которого нет в журнале.',
      'Убежище тихо повторило позывной ещё до выхода за ворота.',
      'Дождь начался в ту же минуту, что и сломанные часы на столбе.',
    ],
    'first-evidence': [
      'На металле остался свежий оттиск того же символа, только прямой.',
      'Под крышкой помпы виден тот же обмотанный кабель, что несёт сигнал.',
      'В блокноте две строки об одном месте — и они не сходятся.',
      'На воротах Убежища появилась риска, которой вчера не было.',
      'Стрелки полевых часов снова встали там, где была буря.',
    ],
    contradiction: [
      'Символ на двери станции смотрит иначе, чем тот, что был на камне.',
      'Кабель сухой, хотя вода здесь явно шла ночью.',
      'Новая записка зачёркивает старую тем же карандашом.',
      'Поле молчит, а Убежище всё ещё повторяет вчерашний позывной.',
      'Небо ясное, но часы снова бьют штормовой час.',
    ],
    'choice-consequence': [
      'После вашего решения символ снова сдвинули — уже в третий раз.',
      'Выбранный путь натянул скрытый кабель сильнее соседнего.',
      'Путник ответил на ваш выбор новой противоречивой меткой.',
      'Убежище сменило тон ответа сразу после вашего возвращения.',
      'Часы опоздали ровно на то время, что вы провели дальше от ворот.',
    ],
    source: [
      'Источник — не новая дверь, а человек, который переворачивает старые знаки.',
      'Источник — общая жила: кто тянет воду, тот глушит сигнал.',
      'Источник — тот же путник, что пишет себе противоречивые приказы.',
      'Источник звука — пустая комната Убежища, не поле.',
      'Источник непогоды — заводной механизм, а не тучи.',
    ],
    'lasting-decision': [
      'Если оставить символы прямыми, станция перестанет звать ночью.',
      'Если развести воду и сигнал, оба маршрута надолго станут тише.',
      'Если собрать записки в одну тетрадь, следующий сезон не повторит путаницу.',
      'Если ответить Убежищу своим голосом, чужой позывной погаснет.',
      'Если остановить часы, буря больше не будет приходить по расписанию.',
    ],
  },
};

const ECHOES: Record<Locale, readonly string[]> = {
  uk: [
    'Той самий символ повернувся, але цього разу кут знову неправильний.',
    'Кабель клацнув знайомо, ніби сезон повторює вже чуту фразу.',
    'У записнику з’явився рядок, який ви вже читали — лише з іншим висновком.',
    'Притулок повторив старий позивний тихіше, ніж минулого разу.',
    'Годинник знову вдарив ту годину, яку ви вже бачили на цьому схилі.',
  ],
  en: [
    'The same symbol returned, but the angle is wrong again.',
    'The cable clicked in a familiar way, as if the season were repeating a heard phrase.',
    'A line you already read is back in the notebook — with a different conclusion.',
    'The Refuge repeated the old call sign more quietly than last time.',
    'The clock struck the hour you have already seen on this slope.',
  ],
  ru: [
    'Тот же символ вернулся, но угол снова неверный.',
    'Кабель щёлкнул знакомо, будто сезон повторяет уже слышанную фразу.',
    'В блокноте снова строка, которую вы уже читали — только с другим выводом.',
    'Убежище повторило старый позывной тише, чем в прошлый раз.',
    'Часы снова пробили тот час, который вы уже видели на этом склоне.',
  ],
};

const BEAT_NAMES: Record<Locale, Record<SeasonBeatId, string>> = {
  uk: {
    'strange-signal': 'Дивний сигнал',
    'first-evidence': 'Перший доказ',
    contradiction: 'Суперечність',
    'choice-consequence': 'Наслідок вибору',
    source: 'Джерело',
    'lasting-decision': 'Рішення надовго',
    echo: 'Відлуння',
  },
  en: {
    'strange-signal': 'A strange signal',
    'first-evidence': 'First evidence',
    contradiction: 'A contradiction',
    'choice-consequence': 'A consequence',
    source: 'The source',
    'lasting-decision': 'A lasting decision',
    echo: 'An echo',
  },
  ru: {
    'strange-signal': 'Странный сигнал',
    'first-evidence': 'Первое доказательство',
    contradiction: 'Противоречие',
    'choice-consequence': 'Следствие выбора',
    source: 'Источник',
    'lasting-decision': 'Долгое решение',
    echo: 'Эхо',
  },
};

export function seasonLength(seed: number) {
  return 5 + ((seed >>> 0) % 4);
}

export function seasonBeatPlan(seed: number): SeasonBeatId[] {
  const length = seasonLength(seed);
  if (length === 5) return CORE_BEATS.filter((id) => id !== 'contradiction');
  if (length === 6) return [...CORE_BEATS];
  if (length === 7) return [...CORE_BEATS.slice(0, 4), 'echo', ...CORE_BEATS.slice(4)];
  return [...CORE_BEATS.slice(0, 2), 'echo', ...CORE_BEATS.slice(2, 5), 'echo', CORE_BEATS[5]!];
}

export function createSeason(seed: number): SeasonArc {
  const value = seed >>> 0;
  return {
    seed: value,
    length: seasonLength(value),
    throughlineKey: value % THROUGHLINE_COUNT,
    beats: seasonBeatPlan(value).map((id) => ({ id })),
    decisions: [],
  };
}

export function ensureSeason(state: GameState): GameState {
  if (state.season && state.season.beats.length >= 5) return state;
  return { ...state, season: createSeason(state.worldSeed ?? state.storyArc?.seed ?? 1) };
}

export function seasonThroughline(season: SeasonArc, locale = getActiveLocale()) {
  return localizedCopy(THROUGHLINES, locale)[season.throughlineKey % THROUGHLINE_COUNT]!;
}

export function seasonHook(season: SeasonArc, beatId: SeasonBeatId, locale = getActiveLocale()) {
  const key = season.throughlineKey % THROUGHLINE_COUNT;
  if (beatId === 'echo') return localizedCopy(ECHOES, locale)[key]!;
  return localizedCopy(HOOKS, locale)[beatId][key]!;
}

export function seasonBeatName(beatId: SeasonBeatId, locale = getActiveLocale()) {
  return localizedCopy(BEAT_NAMES, locale)[beatId];
}

export function beatForExpedition(season: SeasonArc | undefined, expeditionId: string): SeasonBeat | undefined {
  return season?.beats.find((beat) => beat.expeditionId === expeditionId);
}

export function seasonSourceRevealed(season: SeasonArc | undefined) {
  return !!season?.beats.some((beat) => (beat.id === 'source' || beat.id === 'lasting-decision') && beat.resolved);
}

export function seasonProgress(season: SeasonArc | undefined) {
  if (!season) return { resolved: 0, total: 0, complete: false, nextBeat: undefined as SeasonBeat | undefined };
  const resolved = season.beats.filter((beat) => beat.resolved).length;
  return {
    resolved,
    total: season.length,
    complete: resolved >= season.length,
    nextBeat: season.beats.find((beat) => !beat.resolved),
  };
}

export function colorNarrative(narrative: ExpeditionNarrative, season: SeasonArc, beat: SeasonBeat): ExpeditionNarrative {
  const hook = seasonHook(season, beat.id);
  if (narrative.cause.startsWith(hook)) return narrative;
  return { ...narrative, cause: `${hook} ${narrative.cause}` };
}

export function assignSeasonBeat(state: GameState, expeditionId: string): GameState {
  const next = structuredClone(ensureSeason(state));
  const season = next.season!;
  if (season.beats.some((beat) => beat.expeditionId === expeditionId)) return next;
  const open = season.beats.find((beat) => !beat.expeditionId);
  if (open) open.expeditionId = expeditionId;
  return next;
}

export function resolveSeasonBeat(state: GameState, run: Pick<ExpeditionProgress, 'id' | 'contractId' | 'optionalAccepted' | 'narrative'>): GameState {
  const next = structuredClone(ensureSeason(state));
  const season = next.season!;
  const beat = season.beats.find((item) => item.expeditionId === run.id);
  if (beat) {
    beat.resolved = true;
    beat.memory = run.narrative.cause.slice(0, 180);
  }
  if (!season.decisions.some((decision) => decision.expeditionId === run.id)) {
    season.decisions.push({ expeditionId: run.id, contractId: run.contractId, wentFarther: !!run.optionalAccepted });
  }
  return next;
}

export function seasonDirectorNotes(state: GameState) {
  const season = state.season;
  const run = state.expedition;
  if (!season || !run) return { seasonBeat: '', throughline: '', priorBeats: [] as string[] };
  const beat = beatForExpedition(season, run.id);
  return {
    seasonBeat: beat ? `${beat.id}:${seasonBeatName(beat.id)}` : '',
    throughline: seasonThroughline(season),
    priorBeats: season.beats.filter((item) => item.resolved).map((item) => `${seasonBeatName(item.id)}: ${item.memory ?? seasonHook(season, item.id)}`),
  };
}
