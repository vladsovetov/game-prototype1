import { AI_CONTEXT_PACKET, validateCharacterCard } from '../domain/character';
import { BODIES, MARKS, MATERIALS, PALETTES, QUIRKS } from '../domain/catalog';
import { ROAD_HOME } from '../domain/memory';
import { LANTERN_HOUSE_ENDING, memoryChapter, type MemoryChapter } from '../domain/memory-arc';
import { storyFor } from '../domain/story';
import { SEED_NAMES, worldFor } from '../domain/world';
import type { Appearance, Character, GameState, QuirkId, StoryArc } from '../domain/types';

export interface PanelActions {
  onImport(character: Character): void;
  onReset(): void;
  onNewTale(): void;
  onPersonality(name: string, description: string, quirk: QuirkId): void;
  onAppearance(appearance: Appearance): void;
  onPersonalizationDone(): void;
}

export function createPanels(root: HTMLElement, actions: PanelActions) {
  let currentCharacter: Character | undefined;
  const clear = () => root.replaceChildren();

  const shell = (title: string, compact = false, onClose: () => void = clear) => {
    clear();
    const section = document.createElement('section');
    section.className = `modal${compact ? ' modal-compact' : ''}`;
    section.innerHTML = `<div class="modal-body"><div class="modal-head"><div><span class="eyebrow">The Unwritten</span><h2></h2></div><button class="close" aria-label="Close">×</button></div><div data-slot="content"></div></div>`;
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
    section.innerHTML = `<span class="eyebrow">Your companion</span><h1 data-testid="tutorial-character-name"></h1><p class="wake-purpose"></p><div class="first-memory"><small>FIRST MEMORY</small><strong></strong><span data-summary></span></div><button class="button primary">Wake up <span aria-hidden="true">→</span></button>`;
    (section.querySelector('h1') as HTMLElement).textContent = character.name;
    (section.querySelector('.wake-purpose') as HTMLElement).textContent = isRoadHome
      ? `Help ${character.name} recover a lost memory—and discover who they were before this meadow.`
      : `Help ${character.name} make a first discovery in this strange meadow.`;
    (section.querySelector('.first-memory strong') as HTMLElement).textContent = isRoadHome ? (story?.chapters.sign?.title ?? 'The Road Home') : 'A First Discovery';
    (section.querySelector('[data-summary]') as HTMLElement).textContent = isRoadHome
      ? (story?.premise ?? 'Recover two clues to learn who was waiting for them.')
      : `Follow one glow and see what ${character.gift.name} reveals.`;
    section.querySelector('button')?.addEventListener('click', onWake);
    root.append(section);
  }

  function showMemoryBeat(title: string, copy: string, action: string, onContinue: () => void, chapterTitle = 'The Road Home') {
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
    section.innerHTML = `<div class="chapter-number"><span>Memory</span><strong></strong></div><span class="eyebrow">Another page returns</span><h2></h2><div class="chapter-keepsake"></div><p class="soft-copy"></p><button class="button primary">Keep this memory</button>`;
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
    section.innerHTML = `<div class="ending-lantern" aria-hidden="true">✦</div><span class="eyebrow">Six memories planted · You remember now</span><h2></h2><p class="ending-name"></p><p class="ending-story"></p><button class="button primary">Carry the light forward</button>`;
    (section.querySelector('h2') as HTMLElement).textContent = ending.title;
    (section.querySelector('.ending-name') as HTMLElement).textContent = `${character.name}, this is what the sanctuary was trying to tell you.`;
    (section.querySelector('.ending-story') as HTMLElement).textContent = ending.story;
    section.querySelector('button')?.addEventListener('click', onContinue);
    root.append(section);
  }

  function showMemoryChoice(character: Character, onChoose: (answer: string) => void, story?: StoryArc) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card memory-choice-card';
    section.innerHTML = `<span class="eyebrow">One truth is still unwritten</span><h2></h2><p class="soft-copy">Planting the Waypost made this memory visible in your sanctuary. The memory cannot answer this last part. Your answer becomes part of who <b data-name></b> is.</p><div class="memory-choices"></div><button class="text-button" data-custom>Write my own answer →</button>`;
    (section.querySelector('h2') as HTMLElement).textContent = story?.question ?? ROAD_HOME.question;
    (section.querySelector('[data-name]') as HTMLElement).textContent = character.name;
    const choices = ['A family they chose', 'A patient friend', 'They kept it burning for themself'];
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
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy">Write one short answer. It will be remembered in <b data-name></b>'s story.</p><label class="field-label">Your answer<input name="memory" maxlength="100" autocomplete="off" placeholder="Someone who..."></label><div class="choice-row"><button class="button primary" data-save disabled>Keep this memory</button><button class="button ghost-light" data-back>Back</button></div>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = story?.chapters.sign?.title ?? 'The Road Home';
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
    section.innerHTML = `<span class="eyebrow">Save protected</span><h2>This meadow is from a newer version</h2><p class="soft-copy">This prototype cannot safely open version <b data-version></b>. Your saved data has been left untouched.</p><button class="button primary">Start a fresh meadow</button>`;
    (section.querySelector('[data-version]') as HTMLElement).textContent = String(version);
    section.querySelector('button')?.addEventListener('click', actions.onReset);
    root.append(section);
  }

  function showPersonalize(character: Character) {
    currentCharacter = character;
    clear();
    const section = document.createElement('section');
    section.className = 'story-card personalize-card';
    section.innerHTML = `<span class="eyebrow">First memory made</span><h2>Make them yours</h2><p class="soft-copy">Now that you have met <b data-name></b>, you can add more of yourself—or leave the mystery intact.</p><div class="personalize-actions"><button class="personalize-choice" data-personality><span>01</span><b>Add personality</b><small>Give the world more to notice</small></button><button class="personalize-choice" data-look><span>02</span><b>Shape their look</b><small>Choose body, material, and colors</small></button><button class="personalize-choice" data-ai><span>03</span><b>Create with your AI</b><small>Bring in a richer imagined character</small></button></div><button class="text-button" data-done>Keep exploring <span aria-hidden="true">→</span></button>`;
    (section.querySelector('[data-name]') as HTMLElement).textContent = character.name;
    section.querySelector('[data-personality]')?.addEventListener('click', () => showPersonality(character));
    section.querySelector('[data-look]')?.addEventListener('click', () => showAppearance(character));
    section.querySelector('[data-ai]')?.addEventListener('click', () => showAI(() => showPersonalize(currentCharacter ?? character)));
    section.querySelector('[data-done]')?.addEventListener('click', actions.onPersonalizationDone);
    root.append(section);
  }

  function showPersonality(character: Character) {
    const back = () => showPersonalize(currentCharacter ?? character);
    const c = shell('Tell us one true thing', true, back);
    c.innerHTML = `<p class="soft-copy">A few words are enough. This changes how the meadow describes your companion, never how powerful they are.</p><label class="field-label">Name<input name="name" maxlength="24"></label><label class="field-label">What are they like?<textarea name="description" maxlength="180"></textarea></label><label class="field-label">A small instinct<select name="quirk"></select></label><div class="choice-row"><button class="button primary" data-save>Keep this</button><button class="button ghost-light" data-back>Not now</button></div>`;
    const name = c.querySelector<HTMLInputElement>('[name=name]')!;
    const description = c.querySelector<HTMLTextAreaElement>('[name=description]')!;
    const quirk = c.querySelector<HTMLSelectElement>('[name=quirk]')!;
    name.value = character.name;
    description.value = character.description;
    for (const id of Object.keys(QUIRKS) as QuirkId[]) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id.replace('-', ' ');
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
    const c = shell('Shape their look', true, back);
    c.innerHTML = `<p class="soft-copy">Every choice is visual. You can change it whenever you like.</p><div class="appearance-grid"></div><div class="choice-row"><button class="button primary" data-save>Wear this look</button><button class="button ghost-light" data-back>Not now</button></div>`;
    const grid = c.querySelector<HTMLElement>('.appearance-grid')!;
    const groups: Array<[keyof Appearance, readonly string[]]> = [
      ['body', BODIES], ['material', MATERIALS], ['palette', PALETTES], ['mark', MARKS],
    ];
    for (const [key, values] of groups) {
      const label = document.createElement('label');
      label.className = 'field-label';
      label.textContent = key[0]!.toUpperCase() + key.slice(1);
      const select = document.createElement('select');
      select.name = key;
      for (const value of values) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value.replace('-', ' ');
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
    const c = shell('Bring in a character', false, back);
    c.innerHTML = `<p class="soft-copy">Paste the JSON card made by your AI. The meadow accepts imagination, but ignores invented stats and powers.</p><textarea aria-label="Character JSON" spellcheck="false"></textarea><div data-errors></div><div class="choice-row"><button class="button primary">Meet this character</button><button class="button ghost-light" data-back>Back</button></div>`;
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
    const c = shell('Create with your AI', false, back);
    c.innerHTML = `<p class="soft-copy">Copy this small world guide into any AI. Ask it to imagine your companion, then bring the JSON result back here.</p><textarea readonly aria-label="AI creation context"></textarea><div class="choice-row"><button class="button primary">Copy world guide</button><button class="button" data-import>Paste the result</button><button class="button ghost-light" data-back>Back</button></div>`;
    c.querySelector('textarea')!.value = AI_CONTEXT_PACKET;
    c.querySelector('.primary')?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(AI_CONTEXT_PACKET);
      c.querySelector('.primary')!.textContent = 'Copied';
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
    const c = shell('Your companion');
    const pass = document.createElement('div');
    pass.className = 'passport';
    const preview = document.createElement('div');
    preview.className = `avatar-preview palette-${character.appearance.palette}`;
    preview.textContent = `${character.appearance.material} ${character.appearance.body}`;
    const info = document.createElement('div');
    const h = document.createElement('h3');
    const p = document.createElement('p');
    h.textContent = character.name;
    p.textContent = character.description;
    const grid = document.createElement('div');
    grid.className = 'trait-grid';
    grid.append(trait('Gift', character.gift.name, character.gift.description), trait('Burden', character.burden.name, character.burden.description), trait('Quirk', character.quirk.name, character.quirk.description));
    const edit = document.createElement('button');
    edit.className = 'text-button passport-edit';
    edit.textContent = 'Personalize character →';
    edit.addEventListener('click', () => showPersonalize(character));
    info.append(h, p, grid, edit);
    pass.append(preview, info);
    c.append(pass);
  }

  function showJournal(state: GameState) {
    const c = shell('Field journal');
    const arc = storyFor(state);
    const world = worldFor(state);
    const folio = document.createElement('article');
    folio.className = 'tale-folio';
    folio.dataset.testid = 'tale-folio';
    folio.innerHTML = `<div class="run-seal"><small>RUN</small><strong data-testid="tale-run-mark"></strong></div><div><span class="eyebrow"></span><h3></h3><p></p></div>`;
    (folio.querySelector('[data-testid=tale-run-mark]') as HTMLElement).textContent = arc.runMark;
    (folio.querySelector('.eyebrow') as HTMLElement).textContent = arc.source === 'local-model' ? 'Written on this device' : 'Woven from this run';
    (folio.querySelector('h3') as HTMLElement).textContent = world.theme.name;
    (folio.querySelector('p') as HTMLElement).textContent = arc.premise;
    c.append(folio);
    const summary = document.createElement('p');
    summary.className = 'soft-copy';
    summary.textContent = `${state.discoveries.length} reactions remembered · ${state.seeds.length} seeds waiting · ${Object.keys(state.plantings).length} planted`;
    c.append(summary);
    for (const id of state.rewarded) {
      const chapter = arc.chapters[id] ?? memoryChapter(id);
      if (!chapter) continue;
      const memory = document.createElement('article');
      memory.className = 'journal-memory';
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = 'Recovered memory';
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
      eyebrow.textContent = 'Story complete';
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
      p.textContent = 'The first page is waiting. Follow a glow and try your Gift.';
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
      h.textContent = 'Seed tray';
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
    const c = shell('How to wander', true);
    c.innerHTML = `<div class="controls keyboard-help"><b>WASD / ARROWS</b><span>Move</span><b>F</b><span>Use your current Gift near a strange object</span><b>E</b><span>Explore, borrow a Gift, or plant</span><b>J</b><span>Open field journal</span><b>C</b><span>Meet your companion</span></div><div class="touch-help"><div class="touch-help-mark">●</div><div><b>Drag the golden ember</b><span>Move in any direction. Let go to stop.</span></div><div class="touch-help-mark">✦</div><div><b>Tap a glowing petal</b><span>Use your Gift or explore whatever is nearby.</span></div></div><p class="soft-copy help-note">The lights are suggestions, not a timer. Wander as long as you like.</p><div class="new-tale-note"><span class="eyebrow">Another beginning</span><p>Your companion stays, but this meadow, its story, and all progress will be replaced by a newly generated tale.</p><button class="button danger">Begin another tale</button></div>`;
    c.querySelector('.danger')?.addEventListener('click', () => {
      if (confirm('Begin another tale? Your companion stays, but this meadow and all of its progress will be replaced.')) actions.onNewTale();
    });
  }

  return { clear, showWake, showMemoryBeat, showMemoryChapter, showEnding, showMemoryChoice, showNewerSave, showPersonalize, showImport, showAI, showCharacter, showJournal, showHelp };
}
