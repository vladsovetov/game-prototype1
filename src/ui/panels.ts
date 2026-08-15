import { AI_CONTEXT_PACKET, validateCharacterCard } from '../domain/character';
import { APPEARANCE_GROUP_NAMES, APPEARANCE_NAMES, BODIES, MARKS, MATERIALS, PALETTES, QUIRKS } from '../domain/catalog';
import { ROAD_HOME } from '../domain/memory';
import { LANTERN_HOUSE_ENDING, memoryChapter, type MemoryChapter } from '../domain/memory-arc';
import { storyFor } from '../domain/story';
import { SEED_NAMES, worldFor } from '../domain/world';
import type { Appearance, Character, GameState, QuirkId, StoryArc } from '../domain/types';
import type { WriterStatus } from '../story/local-story-writer';

export interface PanelActions {
  onImport(character: Character): void;
  onReset(): void;
  onNewTale(): void;
  onPersonality(name: string, description: string, quirk: QuirkId): void;
  onAppearance(appearance: Appearance): void;
  onPersonalizationDone(): void;
  onLocalStory(): void;
}

export function createPanels(root: HTMLElement, actions: PanelActions) {
  let currentCharacter: Character | undefined;
  const clear = () => root.replaceChildren();

  const shell = (title: string, compact = false, onClose: () => void = clear) => {
    clear();
    const section = document.createElement('section');
    section.className = `modal${compact ? ' modal-compact' : ''}`;
    section.innerHTML = `<div class="modal-body"><div class="modal-head"><div><span class="eyebrow">Ненаписане</span><h2></h2></div><button class="close" aria-label="Закрити">×</button></div><div data-slot="content"></div></div>`;
    (section.querySelector('h2') as HTMLElement).textContent = title;
    section.querySelector('.close')?.addEventListener('click', onClose);
    root.append(section);
    return section.querySelector<HTMLElement>('[data-slot=content]')!;
  };

  function showWake(character: Character, onWake: () => void, isRoadHome = true, story?: StoryArc) {
    currentCharacter = character;
    clear();
    const section = document.createElement('section');
    section.className = 'story-card wake-card';
    section.innerHTML = `<span class="eyebrow">Ваш супутник</span><h1 data-testid="tutorial-character-name"></h1><p class="wake-purpose"></p><div class="first-memory"><small>ПЕРШИЙ СПОГАД</small><strong></strong><span data-summary></span></div><button class="button primary">Прокинутися <span aria-hidden="true">→</span></button>`;
    (section.querySelector('h1') as HTMLElement).textContent = character.name;
    (section.querySelector('.wake-purpose') as HTMLElement).textContent = isRoadHome
      ? `Допоможіть ${character.name} повернути втрачений спогад і дізнатися, ким цей персонаж був до появи галявини.`
      : `Допоможіть ${character.name} зробити перше відкриття на цій дивній галявині.`;
    (section.querySelector('.first-memory strong') as HTMLElement).textContent = isRoadHome ? (story?.chapters.sign?.title ?? 'Дорога додому') : 'Перше відкриття';
    (section.querySelector('[data-summary]') as HTMLElement).textContent = isRoadHome
      ? (story?.premise ?? 'Поверніть дві підказки, щоб дізнатися, хто чекав попереду.')
      : `Ідіть за одним вогником і подивіться, що відкриє Дар «${character.gift.name}».`;
    section.querySelector('button')?.addEventListener('click', onWake);
    root.append(section);
  }

  function showMemoryBeat(title: string, copy: string, action: string, onContinue: () => void, chapterTitle = 'Дорога додому') {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card memory-beat';
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy"></p><button class="button primary"></button>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = chapterTitle;
    (section.querySelector('h2') as HTMLElement).textContent = title;
    (section.querySelector('p') as HTMLElement).textContent = copy;
    (section.querySelector('button') as HTMLElement).textContent = action;
    section.querySelector('button')?.addEventListener('click', onContinue);
    root.append(section);
  }

  function showMemoryChapter(chapter: MemoryChapter, recovered: number, onContinue: () => void) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card memory-chapter-card';
    section.innerHTML = `<div class="chapter-number"><span>Спогад</span><strong></strong></div><span class="eyebrow">Повертається ще одна сторінка</span><h2></h2><div class="chapter-keepsake"></div><p class="soft-copy"></p><button class="button primary">Зберегти цей спогад</button>`;
    (section.querySelector('.chapter-number strong') as HTMLElement).textContent = String(recovered).padStart(2, '0');
    (section.querySelector('h2') as HTMLElement).textContent = chapter.title;
    (section.querySelector('.chapter-keepsake') as HTMLElement).textContent = chapter.keepsake;
    (section.querySelector('p') as HTMLElement).textContent = chapter.story;
    section.querySelector('button')?.addEventListener('click', onContinue);
    root.append(section);
  }

  function showEnding(character: Character, ending: StoryArc['ending'] = LANTERN_HOUSE_ENDING, onContinue: () => void) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card ending-card';
    section.innerHTML = `<div class="ending-lantern" aria-hidden="true">✦</div><span class="eyebrow">Посаджено шість спогадів · Тепер ви пам’ятаєте</span><h2></h2><p class="ending-name"></p><p class="ending-story"></p><button class="button primary">Нести світло далі</button>`;
    (section.querySelector('h2') as HTMLElement).textContent = ending.title;
    (section.querySelector('.ending-name') as HTMLElement).textContent = `${character.name}, ось що Притулок намагався вам розповісти.`;
    (section.querySelector('.ending-story') as HTMLElement).textContent = ending.story;
    section.querySelector('button')?.addEventListener('click', onContinue);
    root.append(section);
  }

  function showMemoryChoice(character: Character, onChoose: (answer: string) => void, story?: StoryArc) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card memory-choice-card';
    section.innerHTML = `<span class="eyebrow">Одна правда досі не написана</span><h2></h2><p class="soft-copy">Посаджений дороговказ зробив цей спогад видимим у Притулку. Сам спогад не знає останньої відповіді. Ваша відповідь стане частиною історії <b data-name></b>.</p><div class="memory-choices"></div><button class="text-button" data-custom>Написати власну відповідь →</button>`;
    (section.querySelector('h2') as HTMLElement).textContent = story?.question ?? ROAD_HOME.question;
    (section.querySelector('[data-name]') as HTMLElement).textContent = character.name;
    const choices = ['Обрана родина', 'Терплячий друг', 'Вогонь підтримували для себе'];
    const list = section.querySelector<HTMLElement>('.memory-choices')!;
    for (const choice of choices) {
      const button = document.createElement('button');
      button.className = 'memory-choice';
      button.textContent = choice;
      button.addEventListener('click', () => onChoose(choice));
      list.append(button);
    }
    section.querySelector('[data-custom]')?.addEventListener('click', () => showCustomMemory(character, onChoose, story));
    root.append(section);
  }

  function showCustomMemory(character: Character, onChoose: (answer: string) => void, story?: StoryArc) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card memory-choice-card';
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy">Напишіть одну коротку відповідь. Вона залишиться в історії <b data-name></b>.</p><label class="field-label">Ваша відповідь<input name="memory" maxlength="100" autocomplete="off" placeholder="Хтось, хто..."></label><div class="choice-row"><button class="button primary" data-save disabled>Зберегти цей спогад</button><button class="button ghost-light" data-back>Назад</button></div>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = story?.chapters.sign?.title ?? 'Дорога додому';
    (section.querySelector('h2') as HTMLElement).textContent = story?.question ?? ROAD_HOME.question;
    (section.querySelector('[data-name]') as HTMLElement).textContent = character.name;
    const input = section.querySelector<HTMLInputElement>('[name=memory]')!;
    const save = section.querySelector<HTMLButtonElement>('[data-save]')!;
    input.addEventListener('input', () => { save.disabled = !input.value.trim(); });
    save.addEventListener('click', () => {
      const answer = input.value.trim().slice(0, 100);
      if (answer) onChoose(answer);
    });
    section.querySelector('[data-back]')?.addEventListener('click', () => showMemoryChoice(character, onChoose, story));
    root.append(section);
    input.focus();
  }

  function showNewerSave(version: number) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card compatibility-card';
    section.innerHTML = `<span class="eyebrow">Збереження захищене</span><h2>Ця галявина з новішої версії</h2><p class="soft-copy">Цей прототип не може безпечно відкрити версію <b data-version></b>. Ваші збережені дані залишилися без змін.</p><button class="button primary">Почати на новій галявині</button>`;
    (section.querySelector('[data-version]') as HTMLElement).textContent = String(version);
    section.querySelector('button')?.addEventListener('click', actions.onReset);
    root.append(section);
  }

  function showPersonalize(character: Character) {
    currentCharacter = character;
    clear();
    const section = document.createElement('section');
    section.className = 'story-card personalize-card';
    section.innerHTML = `<span class="eyebrow">Перший спогад створено</span><h2>Зробіть персонажа своїм</h2><p class="soft-copy">Тепер, коли ви зустріли <b data-name></b>, можна додати щось від себе або зберегти таємницю.</p><div class="personalize-actions"><button class="personalize-choice" data-personality><span>01</span><b>Додати характер</b><small>Дайте світові більше рис для відгуку</small></button><button class="personalize-choice" data-look><span>02</span><b>Змінити вигляд</b><small>Оберіть тіло, матеріал і кольори</small></button><button class="personalize-choice" data-ai><span>03</span><b>Створити за допомогою ШІ</b><small>Додайте глибше уявленого персонажа</small></button><button class="personalize-choice local-writer-choice" data-local aria-label="Дозволити цьому пристрою написати історію"><span>04 · ЛОКАЛЬНО</span><b>Дозволити пристрою написати історію</b><small>120–180 МБ один раз · текст залишається тут</small></button></div><button class="text-button" data-done>Досліджувати далі <span aria-hidden="true">→</span></button>`;
    (section.querySelector('[data-name]') as HTMLElement).textContent = character.name;
    section.querySelector('[data-personality]')?.addEventListener('click', () => showPersonality(character));
    section.querySelector('[data-look]')?.addEventListener('click', () => showAppearance(character));
    section.querySelector('[data-ai]')?.addEventListener('click', () => showAI(() => showPersonalize(currentCharacter ?? character)));
    section.querySelector('[data-local]')?.addEventListener('click', actions.onLocalStory);
    section.querySelector('[data-done]')?.addEventListener('click', actions.onPersonalizationDone);
    root.append(section);
  }

  function showPersonality(character: Character) {
    const back = () => showPersonalize(currentCharacter ?? character);
    const c = shell('Розкажіть одну правдиву річ', true, back);
    c.innerHTML = `<p class="soft-copy">Кількох слів достатньо. Це змінює лише те, як галявина описує вашого супутника, а не силу персонажа.</p><label class="field-label">Ім’я<input name="name" maxlength="24"></label><label class="field-label">Який це персонаж?<textarea name="description" maxlength="180"></textarea></label><label class="field-label">Маленька звичка<select name="quirk"></select></label><div class="choice-row"><button class="button primary" data-save>Зберегти</button><button class="button ghost-light" data-back>Не зараз</button></div>`;
    const name = c.querySelector<HTMLInputElement>('[name=name]')!;
    const description = c.querySelector<HTMLTextAreaElement>('[name=description]')!;
    const quirk = c.querySelector<HTMLSelectElement>('[name=quirk]')!;
    name.value = character.name;
    description.value = character.description;
    for (const id of Object.keys(QUIRKS) as QuirkId[]) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = QUIRKS[id].name;
      option.selected = id === character.quirk.id;
      quirk.append(option);
    }
    c.querySelector('[data-save]')?.addEventListener('click', () => {
      const nextName = name.value.trim().slice(0, 24) || character.name;
      const nextDescription = description.value.trim().slice(0, 180) || character.description;
      actions.onPersonality(nextName, nextDescription, quirk.value as QuirkId);
    });
    c.querySelector('[data-back]')?.addEventListener('click', back);
  }

  function showAppearance(character: Character) {
    const back = () => showPersonalize(currentCharacter ?? character);
    const c = shell('Змініть вигляд', true, back);
    c.innerHTML = `<p class="soft-copy">Усі ці зміни лише візуальні. Їх можна змінити будь-коли.</p><div class="appearance-grid"></div><div class="choice-row"><button class="button primary" data-save>Обрати цей вигляд</button><button class="button ghost-light" data-back>Не зараз</button></div>`;
    const grid = c.querySelector<HTMLElement>('.appearance-grid')!;
    const groups: Array<[keyof Appearance, readonly string[]]> = [
      ['body', BODIES], ['material', MATERIALS], ['palette', PALETTES], ['mark', MARKS],
    ];
    for (const [key, values] of groups) {
      const label = document.createElement('label');
      label.className = 'field-label';
      label.textContent = APPEARANCE_GROUP_NAMES[key];
      const select = document.createElement('select');
      select.name = key;
      for (const value of values) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = APPEARANCE_NAMES[key][value as never];
        option.selected = value === character.appearance[key];
        select.append(option);
      }
      label.append(select);
      grid.append(label);
    }
    c.querySelector('[data-save]')?.addEventListener('click', () => {
      const select = (name: string) => c.querySelector<HTMLSelectElement>(`[name=${name}]`)!.value;
      actions.onAppearance({ body: select('body') as Appearance['body'], material: select('material') as Appearance['material'], palette: select('palette') as Appearance['palette'], mark: select('mark') as Appearance['mark'] });
    });
    c.querySelector('[data-back]')?.addEventListener('click', back);
  }

  function showImport(back: () => void = clear) {
    const c = shell('Додайте персонажа', false, back);
    c.innerHTML = `<p class="soft-copy">Вставте JSON-картку, створену вашим ШІ. Галявина приймає уяву, але ігнорує вигадані характеристики й сили.</p><textarea aria-label="JSON персонажа" spellcheck="false"></textarea><div data-errors></div><div class="choice-row"><button class="button primary">Зустріти персонажа</button><button class="button ghost-light" data-back>Назад</button></div>`;
    const box = c.querySelector('textarea')!;
    const errors = c.querySelector<HTMLElement>('[data-errors]')!;
    c.querySelector('.primary')?.addEventListener('click', () => {
      const result = validateCharacterCard(box.value);
      if (result.ok) {
        currentCharacter = result.character;
        actions.onImport(result.character);
      } else {
        errors.className = 'errors';
        errors.dataset.testid = 'import-errors';
        errors.replaceChildren(...result.errors.map((error) => {
          const p = document.createElement('div');
          p.textContent = error;
          return p;
        }));
      }
    });
    c.querySelector('[data-back]')?.addEventListener('click', back);
  }

  function showAI(back: () => void = clear) {
    const c = shell('Створіть за допомогою ШІ', false, back);
    c.innerHTML = `<p class="soft-copy">Скопіюйте короткий опис світу до будь-якого ШІ. Попросіть уявити вашого супутника, а потім поверніть сюди результат у форматі JSON.</p><textarea readonly aria-label="Контекст для створення персонажа ШІ"></textarea><div class="choice-row"><button class="button primary">Скопіювати опис світу</button><button class="button" data-import>Вставити результат</button><button class="button ghost-light" data-back>Назад</button></div>`;
    c.querySelector('textarea')!.value = AI_CONTEXT_PACKET;
    c.querySelector('.primary')?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(AI_CONTEXT_PACKET);
      c.querySelector('.primary')!.textContent = 'Скопійовано';
    });
    c.querySelector('[data-import]')?.addEventListener('click', () => showImport(back));
    c.querySelector('[data-back]')?.addEventListener('click', back);
  }

  function trait(label: string, name: string, description: string) {
    const d = document.createElement('div');
    d.className = 'trait';
    const b = document.createElement('b');
    b.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = name;
    const p = document.createElement('p');
    p.textContent = description;
    d.append(b, strong, p);
    return d;
  }

  function showCharacter(character: Character) {
    currentCharacter = character;
    const c = shell('Ваш супутник');
    const pass = document.createElement('div');
    pass.className = 'passport';
    const preview = document.createElement('div');
    preview.className = `avatar-preview palette-${character.appearance.palette}`;
    preview.textContent = `${APPEARANCE_NAMES.material[character.appearance.material]} · ${APPEARANCE_NAMES.body[character.appearance.body]}`;
    const info = document.createElement('div');
    const h = document.createElement('h3');
    const p = document.createElement('p');
    h.textContent = character.name;
    p.textContent = character.description;
    const grid = document.createElement('div');
    grid.className = 'trait-grid';
    grid.append(trait('Дар', character.gift.name, character.gift.description), trait('Тягар', character.burden.name, character.burden.description), trait('Особливість', character.quirk.name, character.quirk.description));
    const edit = document.createElement('button');
    edit.className = 'text-button passport-edit';
    edit.textContent = 'Налаштувати персонажа →';
    edit.addEventListener('click', () => showPersonalize(character));
    info.append(h, p, grid, edit);
    pass.append(preview, info);
    c.append(pass);
  }

  function showJournal(state: GameState) {
    const c = shell('Польовий щоденник');
    const arc = storyFor(state);
    const world = worldFor(state);
    const folio = document.createElement('article');
    folio.className = 'tale-folio';
    folio.dataset.testid = 'tale-folio';
    folio.innerHTML = `<div class="run-seal"><small>ОПОВІДЬ</small><strong data-testid="tale-run-mark"></strong></div><div><span class="eyebrow"></span><h3></h3><p></p></div>`;
    (folio.querySelector('[data-testid=tale-run-mark]') as HTMLElement).textContent = arc.runMark;
    (folio.querySelector('.eyebrow') as HTMLElement).textContent = arc.source === 'local-model' ? 'Написано на цьому пристрої' : 'Виткано з цієї мандрівки';
    (folio.querySelector('h3') as HTMLElement).textContent = world.theme.name;
    (folio.querySelector('p') as HTMLElement).textContent = arc.premise;
    c.append(folio);
    const summary = document.createElement('p');
    summary.className = 'soft-copy';
    summary.textContent = `Відгуків збережено: ${state.discoveries.length} · Зернин чекає: ${state.seeds.length} · Посаджено: ${Object.keys(state.plantings).length}`;
    c.append(summary);
    for (const id of state.rewarded) {
      const chapter = arc.chapters[id] ?? memoryChapter(id);
      if (!chapter) continue;
      const memory = document.createElement('article');
      memory.className = 'journal-memory';
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = 'Відновлений спогад';
      const title = document.createElement('h3');
      title.textContent = chapter.title;
      const story = document.createElement('p');
      story.textContent = chapter.story;
      memory.append(eyebrow, title, story);
      const meaning = id === 'sign' ? state.memoryDetails?.[ROAD_HOME.id] : undefined;
      if (meaning) {
        const answer = document.createElement('blockquote');
        answer.textContent = meaning;
        memory.append(answer);
      }
      c.append(memory);
    }
    if (state.endingSeen) {
      const ending = document.createElement('article');
      ending.className = 'journal-memory journal-ending';
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = 'Історію завершено';
      const title = document.createElement('h3');
      title.textContent = arc.ending.title;
      const story = document.createElement('p');
      story.textContent = arc.ending.story;
      ending.append(eyebrow, title, story);
      c.append(ending);
    }
    const list = document.createElement('div');
    list.className = 'journal-list';
    if (!state.discoveries.length) {
      const p = document.createElement('p');
      p.textContent = 'Перша сторінка чекає. Ідіть за сяйвом і спробуйте свій Дар.';
      list.append(p);
    }
    for (const item of state.discoveries) {
      const d = document.createElement('div');
      d.className = 'journal-item';
      d.textContent = item;
      list.append(d);
    }
    c.append(list);
    if (state.seeds.length) {
      const h = document.createElement('h3');
      h.textContent = 'Таця спогадів';
      const seeds = document.createElement('div');
      seeds.className = 'seed-grid';
      for (const seed of state.seeds) {
        const d = document.createElement('div');
        d.className = 'seed';
        d.textContent = SEED_NAMES[seed] ?? seed;
        seeds.append(d);
      }
      c.append(h, seeds);
    }
  }

  function showHelp() {
    const c = shell('Як мандрувати', true);
    c.innerHTML = `<div class="controls keyboard-help"><b>WASD / СТРІЛКИ</b><span>Рух</span><b>F</b><span>Застосувати поточний Дар біля дивного предмета</span><b>E</b><span>Дослідити, позичити Дар або посадити спогад</span><b>J</b><span>Відкрити польовий щоденник</span><b>C</b><span>Зустріти супутника</span></div><div class="touch-help"><div class="touch-help-mark">●</div><div><b>Тягніть золотий вогник</b><span>Рухайтеся в будь-якому напрямку. Відпустіть, щоб зупинитися.</span></div><div class="touch-help-mark">✦</div><div><b>Торкніться сяючої пелюстки</b><span>Застосуйте Дар або дослідіть те, що поруч.</span></div></div><p class="soft-copy help-note">Вогники лише підказують шлях — таймера немає. Мандруйте скільки захочете.</p><div class="new-tale-note"><span class="eyebrow">Інший початок</span><p>Супутник залишиться, але ця галявина, її історія та весь прогрес будуть замінені новою випадково створеною оповіддю.</p><button class="button danger">Почати іншу оповідь</button></div>`;
    c.querySelector('.danger')?.addEventListener('click', () => {
      if (confirm('Почати іншу оповідь? Супутник залишиться, але ця галявина й увесь її прогрес будуть замінені.')) actions.onNewTale();
    });
  }

  function showStoryLoom(status: WriterStatus, onDismiss: () => void, onRetry: () => void) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card story-loom-card';
    const percent = Math.round(status.progress * 100);
    if (status.phase === 'complete') {
      section.innerHTML = `<div class="loom-mark" aria-hidden="true"><i></i><i></i><i></i></div><span class="eyebrow">Повністю написано на цьому пристрої</span><h2>Нова оповідь пустила коріння</h2><p class="soft-copy" data-story></p><button class="button primary">Зберегти цю оповідь</button>`;
      (section.querySelector('[data-story]') as HTMLElement).textContent = status.story.premise;
      section.querySelector('button')?.addEventListener('click', onDismiss);
    } else if (status.phase === 'error') {
      section.innerHTML = `<div class="loom-mark broken" aria-hidden="true"><i></i><i></i><i></i></div><span class="eyebrow">Поточна оповідь у безпеці</span><h2>Нитка історії вислизнула</h2><p class="soft-copy" data-error></p><div class="choice-row"><button class="button primary" data-retry>Спробувати ще раз</button><button class="button ghost-light" data-dismiss>Залишити наявну історію</button></div>`;
      (section.querySelector('[data-error]') as HTMLElement).textContent = status.message;
      section.querySelector('[data-retry]')?.addEventListener('click', onRetry);
      section.querySelector('[data-dismiss]')?.addEventListener('click', onDismiss);
    } else {
      const stage = status.phase === 'download' ? 'Завантажуємо маленького оповідача в браузер' : status.phase === 'read' ? 'Читаємо про супутника й цю галявину' : 'Виткаємо приватну історію';
      section.innerHTML = `<div class="loom-mark active" aria-hidden="true"><i></i><i></i><i></i></div><span class="eyebrow">Жоден запит не залишає цей пристрій</span><h2>Пристрій виткає оповідь</h2><p class="soft-copy">Під час першого запуску завантажиться близько 120–180 МБ. Можна продовжувати гру: наявна оповідь у безпеці.</p><div class="loom-progress" role="progressbar" aria-label="Прогрес локального оповідача" aria-valuemin="0" aria-valuemax="100"><span></span></div><div class="loom-status"><b></b><strong></strong></div><button class="text-button">Досліджувати далі, поки пишеться історія →</button>`;
      const progress = section.querySelector<HTMLElement>('[role=progressbar]')!;
      progress.setAttribute('aria-valuenow', String(percent));
      (progress.querySelector('span') as HTMLElement).style.width = `${percent}%`;
      (section.querySelector('.loom-status b') as HTMLElement).textContent = stage;
      (section.querySelector('.loom-status strong') as HTMLElement).textContent = `${percent}%`;
      section.querySelector('button')?.addEventListener('click', onDismiss);
    }
    root.append(section);
  }

  return { clear, showWake, showMemoryBeat, showMemoryChapter, showEnding, showMemoryChoice, showNewerSave, showPersonalize, showImport, showAI, showCharacter, showJournal, showHelp, showStoryLoom };
}
