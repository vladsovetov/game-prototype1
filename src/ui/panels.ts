import { aiContextPacket, validateCharacterCard } from '../domain/character';
import { t } from '../i18n/messages';
import { APPEARANCE_GROUP_NAMES, APPEARANCE_NAMES, BODIES, MARKS, MATERIALS, PALETTES, QUIRKS } from '../domain/catalog';
import { WEARABLES } from '../domain/equipment';
import { ROAD_HOME } from '../domain/memory';
import { LANTERN_HOUSE_ENDING, memoryChapter, type MemoryChapter } from '../domain/memory-arc';
import { storyFor } from '../domain/story';
import { SEED_NAMES, worldFor } from '../domain/world';
import type { Appearance, Character, GameState, QuirkId, StoryArc, WearableId } from '../domain/types';
import type { WriterStatus } from '../story/local-story-writer';
import { CONTRACTS, REFUGE_PROJECTS, availableWorkActions, expeditionMetaFor, expeditionNarrativeFor, expeditionRegionName } from '../domain/expedition';
import { GIFTS } from '../domain/catalog';
import type { ContractId, ExpeditionReport, GiftId, RefugeProjectId } from '../domain/types';

export interface PanelActions {
  onImport(character: Character): void;
  onReset(): void;
  onNewTale(): void;
  onPersonality(name: string, description: string, quirk: QuirkId): void;
  onAppearance(appearance: Appearance): void;
  onPersonalizationDone(): void;
  onLocalStory(): void;
  onEquip(id: WearableId): void;
  onStartExpedition(id: ContractId, loadout: [GiftId, GiftId]): void;
  onBuildProject(id: RefugeProjectId): void;
}

export function createPanels(root: HTMLElement, actions: PanelActions) {
  let currentCharacter: Character | undefined;
  const clear = () => root.replaceChildren();

  const shell = (title: string, compact = false, onClose: () => void = clear) => {
    clear();
    const section = document.createElement('section');
    section.className = `modal${compact ? ' modal-compact' : ''}`;
    section.innerHTML = `<div class="modal-body"><div class="modal-head"><div><span class="eyebrow"></span><h2></h2></div><button class="close" aria-label="">×</button></div><div data-slot="content"></div></div>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = t('brand');
    section.querySelector('.close')?.setAttribute('aria-label', t('close'));
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
    const localReady = story?.source === 'local-model';
    section.innerHTML = `<span class="eyebrow"></span><h1 data-testid="tutorial-character-name"></h1><p class="wake-purpose"></p><div class="first-memory"><small></small><strong></strong><span data-summary></span></div><div class="wake-actions"></div>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = localReady ? t('localWorldReady') : t('randomCompanion');
    (section.querySelector('h1') as HTMLElement).textContent = character.name;
    (section.querySelector('.first-memory small') as HTMLElement).textContent = t('firstMission');
    (section.querySelector('.wake-purpose') as HTMLElement).textContent = isRoadHome
      ? t('wakePurposeRoad', { name: character.name })
      : t('wakePurposeDiscovery', { name: character.name });
    (section.querySelector('.first-memory strong') as HTMLElement).textContent = isRoadHome ? (story?.chapters.sign?.title ?? t('roadHome')) : t('firstDiscovery');
    const shortPremise = story?.premise.split('. ').slice(0, 2).join('. ');
    (section.querySelector('[data-summary]') as HTMLElement).textContent = isRoadHome
      ? (shortPremise ? `${shortPremise}${shortPremise.endsWith('.') ? '' : '.'}` : t('rememberClues'))
      : t('followGlow', { gift: character.gift.name });
    const actionsRoot = section.querySelector<HTMLElement>('.wake-actions')!;
    if (!localReady) {
      const local = document.createElement('button');
      local.className = 'button primary wake-local';
      local.setAttribute('aria-label', t('createLocalAria'));
      local.innerHTML = `<span></span> <span aria-hidden="true">✦</span><small></small>`;
      (local.querySelector('span') as HTMLElement).textContent = t('createLocal');
      (local.querySelector('small') as HTMLElement).textContent = t('createLocalHint');
      local.addEventListener('click', actions.onLocalStory);
      actionsRoot.append(local);
    }
    const wake = document.createElement('button');
    wake.className = localReady ? 'button primary' : 'text-button';
    wake.innerHTML = `<span></span> <span aria-hidden="true">${localReady ? '→' : '→'}</span>`;
    (wake.querySelector('span') as HTMLElement).textContent = localReady ? t('enterWorld') : t('wakeNow');
    wake.addEventListener('click', onWake);
    actionsRoot.append(wake);
    root.append(section);
  }

  function showMemoryBeat(title: string, copy: string, action: string, onContinue: () => void, chapterTitle = t('roadHome')) {
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
    section.innerHTML = `<div class="chapter-number"><span></span><strong></strong></div><span class="eyebrow"></span><h2></h2><div class="chapter-keepsake"></div><p class="soft-copy"></p><button class="button primary"></button>`;
    (section.querySelector('.chapter-number span') as HTMLElement).textContent = t('memory');
    (section.querySelector('.eyebrow') as HTMLElement).textContent = t('anotherPage');
    (section.querySelector('button') as HTMLElement).textContent = t('saveMemory');
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
    section.innerHTML = `<div class="ending-lantern" aria-hidden="true">✦</div><span class="eyebrow"></span><h2></h2><p class="ending-name"></p><p class="ending-story"></p><button class="button primary"></button>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = t('sixPlanted');
    (section.querySelector('h2') as HTMLElement).textContent = ending.title;
    (section.querySelector('.ending-name') as HTMLElement).textContent = t('endingName', { name: character.name });
    (section.querySelector('button') as HTMLElement).textContent = t('carryLight');
    (section.querySelector('.ending-story') as HTMLElement).textContent = ending.story;
    section.querySelector('button')?.addEventListener('click', onContinue);
    root.append(section);
  }

  function showMemoryChoice(character: Character, onChoose: (answer: string) => void, story?: StoryArc) {
    clear();
    const section = document.createElement('section');
    section.className = 'story-card memory-choice-card';
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy"></p><div class="memory-choices"></div><button class="text-button" data-custom></button>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = t('oneTruth');
    (section.querySelector('p') as HTMLElement).textContent = t('memoryChoiceCopy', { name: character.name });
    (section.querySelector('h2') as HTMLElement).textContent = story?.question ?? ROAD_HOME.question;
    (section.querySelector('[data-custom]') as HTMLElement).textContent = t('writeOwn');
    const choices = [t('chosenFamily'), t('patientFriend'), t('keptForSelf')];
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
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy"></p><label class="field-label"><span></span><input name="memory" maxlength="100" autocomplete="off"></label><div class="choice-row"><button class="button primary" data-save disabled></button><button class="button ghost-light" data-back></button></div>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = story?.chapters.sign?.title ?? t('roadHome');
    (section.querySelector('p') as HTMLElement).textContent = t('writeShort', { name: character.name });
    (section.querySelector('.field-label span') as HTMLElement).textContent = t('yourAnswer');
    section.querySelector('input')!.setAttribute('placeholder', t('someoneWho'));
    (section.querySelector('[data-save]') as HTMLElement).textContent = t('saveMemory');
    (section.querySelector('[data-back]') as HTMLElement).textContent = t('back');
    (section.querySelector('h2') as HTMLElement).textContent = story?.question ?? ROAD_HOME.question;
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
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy"></p><button class="button primary"></button>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = t('saveProtected');
    (section.querySelector('h2') as HTMLElement).textContent = t('newVersion');
    (section.querySelector('p') as HTMLElement).textContent = t('newerSaveCopy', { version });
    (section.querySelector('button') as HTMLElement).textContent = t('startNewClearing');
    section.querySelector('button')?.addEventListener('click', actions.onReset);
    root.append(section);
  }

  function showPersonalize(character: Character) {
    currentCharacter = character;
    clear();
    const section = document.createElement('section');
    section.className = 'story-card personalize-card';
    section.innerHTML = `<span class="eyebrow"></span><h2></h2><p class="soft-copy"></p><div class="personalize-actions"><button class="personalize-choice" data-personality><span>01</span><b></b><small></small></button><button class="personalize-choice" data-look><span>02</span><b></b><small></small></button><button class="personalize-choice" data-ai><span>03</span><b></b><small></small></button></div><button class="text-button" data-done></button>`;
    (section.querySelector('.eyebrow') as HTMLElement).textContent = t('firstMemoryMade');
    (section.querySelector('h2') as HTMLElement).textContent = t('makeCharacterYours');
    (section.querySelector('p') as HTMLElement).textContent = t('personalizeCopy', { name: character.name });
    const personality = section.querySelector('[data-personality]')!;
    personality.querySelector('b')!.textContent = t('addPersonality');
    personality.querySelector('small')!.textContent = t('addPersonalityHint');
    const look = section.querySelector('[data-look]')!;
    look.querySelector('b')!.textContent = t('changeLook');
    look.querySelector('small')!.textContent = t('changeLookHint');
    const ai = section.querySelector('[data-ai]')!;
    ai.querySelector('b')!.textContent = t('createWithAi');
    ai.querySelector('small')!.textContent = t('createWithAiHint');
    (section.querySelector('[data-done]') as HTMLElement).textContent = t('exploreOn');
    section.querySelector('[data-personality]')?.addEventListener('click', () => showPersonality(character));
    section.querySelector('[data-look]')?.addEventListener('click', () => showAppearance(character));
    section.querySelector('[data-ai]')?.addEventListener('click', () => showAI(() => showPersonalize(currentCharacter ?? character)));
    section.querySelector('[data-done]')?.addEventListener('click', actions.onPersonalizationDone);
    root.append(section);
  }

  function showPersonality(character: Character) {
    const back = () => showPersonalize(currentCharacter ?? character);
    const c = shell(t('tellOneTruth'), true, back);
    c.innerHTML = `<p class="soft-copy"></p><label class="field-label"><span></span><input name="name" maxlength="24"></label><label class="field-label"><span></span><textarea name="description" maxlength="180"></textarea></label><label class="field-label"><span></span><select name="quirk"></select></label><div class="choice-row"><button class="button primary" data-save></button><button class="button ghost-light" data-back></button></div>`;
    (c.querySelector('p') as HTMLElement).textContent = t('personalityCopy');
    const labels = c.querySelectorAll('.field-label span');
    labels[0]!.textContent = t('nameLabel');
    labels[1]!.textContent = t('whatCharacter');
    labels[2]!.textContent = t('smallHabit');
    (c.querySelector('[data-save]') as HTMLElement).textContent = t('save');
    (c.querySelector('[data-back]') as HTMLElement).textContent = t('notNow');
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
    const c = shell(t('changeAppearance'), true, back);
    c.innerHTML = `<p class="soft-copy"></p><div class="appearance-grid"></div><div class="choice-row"><button class="button primary" data-save></button><button class="button ghost-light" data-back></button></div>`;
    (c.querySelector('p') as HTMLElement).textContent = t('appearanceCopy');
    (c.querySelector('[data-save]') as HTMLElement).textContent = t('chooseLook');
    (c.querySelector('[data-back]') as HTMLElement).textContent = t('notNow');
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
    const c = shell(t('addCharacter'), false, back);
    c.innerHTML = `<p class="soft-copy"></p><textarea spellcheck="false"></textarea><div data-errors></div><div class="choice-row"><button class="button primary"></button><button class="button ghost-light" data-back></button></div>`;
    (c.querySelector('p') as HTMLElement).textContent = t('importCopy');
    c.querySelector('textarea')!.setAttribute('aria-label', t('characterJson'));
    (c.querySelector('.primary') as HTMLElement).textContent = t('meetCharacter');
    (c.querySelector('[data-back]') as HTMLElement).textContent = t('back');
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
    const c = shell(t('createWithAi'), false, back);
    c.innerHTML = `<p class="soft-copy"></p><textarea readonly></textarea><div class="choice-row"><button class="button primary"></button><button class="button" data-import></button><button class="button ghost-light" data-back></button></div>`;
    (c.querySelector('p') as HTMLElement).textContent = t('aiCopy');
    const packet = aiContextPacket();
    c.querySelector('textarea')!.setAttribute('aria-label', t('aiContext'));
    c.querySelector('textarea')!.value = packet;
    (c.querySelector('.primary') as HTMLElement).textContent = t('copyWorld');
    (c.querySelector('[data-import]') as HTMLElement).textContent = t('pasteResult');
    (c.querySelector('[data-back]') as HTMLElement).textContent = t('back');
    c.querySelector('.primary')?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(packet);
      c.querySelector('.primary')!.textContent = t('copied');
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

  function showCharacter(state: GameState) {
    const character = state.character;
    currentCharacter = character;
    const c = shell(t('companion'));
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
    grid.append(trait(t('tool'), character.gift.name, character.gift.description), trait(t('workStyle'), character.burden.name, character.burden.description), trait(t('trait'), character.quirk.name, character.quirk.description));
    const edit = document.createElement('button');
    edit.className = 'text-button passport-edit';
    edit.textContent = t('customizeCharacter');
    edit.addEventListener('click', () => showPersonalize(character));
    const fieldKit = document.createElement('section');
    fieldKit.className = 'field-kit';
    const kitTitle = document.createElement('h4');
    kitTitle.textContent = t('fieldGear');
    const kitCopy = document.createElement('p');
    kitCopy.textContent = t('fieldGearCopy');
    const kitGrid = document.createElement('div');
    kitGrid.className = 'equipment-grid';
    for (const id of state.wardrobe) {
      const item = WEARABLES[id];
      const equipped = state.equipped[item.slot] === id;
      const button = document.createElement('button');
      button.className = `equipment-item${equipped ? ' equipped' : ''}`;
      button.dataset.testid = `equipment-${id}`;
      button.setAttribute('aria-pressed', String(equipped));
      button.innerHTML = `<span></span><strong></strong><small></small>`;
      button.querySelector('span')!.textContent = equipped ? t('equipped') : item.mark;
      button.querySelector('strong')!.textContent = item.name;
      button.querySelector('small')!.textContent = item.description;
      button.addEventListener('click', () => actions.onEquip(id));
      kitGrid.append(button);
    }
    fieldKit.append(kitTitle, kitCopy, kitGrid);
    info.append(h, p, grid, fieldKit, edit);
    pass.append(preview, info);
    c.append(pass);
  }

  function showJournal(state: GameState) {
    const c = shell(t('fieldJournal'));
    const arc = storyFor(state);
    const world = worldFor(state);
    const folio = document.createElement('article');
    folio.className = 'tale-folio';
    folio.dataset.testid = 'tale-folio';
    folio.innerHTML = `<div class="run-seal"><small></small><strong data-testid="tale-run-mark"></strong></div><div><span class="eyebrow"></span><h3></h3><p></p></div>`;
    (folio.querySelector('.run-seal small') as HTMLElement).textContent = t('tale');
    (folio.querySelector('[data-testid=tale-run-mark]') as HTMLElement).textContent = arc.runMark;
    (folio.querySelector('.eyebrow') as HTMLElement).textContent = arc.source === 'local-model' ? t('writtenHere') : t('wovenHere');
    (folio.querySelector('h3') as HTMLElement).textContent = world.theme.name;
    (folio.querySelector('p') as HTMLElement).textContent = arc.premise;
    c.append(folio);
    const summary = document.createElement('p');
    summary.className = 'soft-copy';
    summary.textContent = t('journalSummary', { discoveries: state.discoveries.length, seeds: state.seeds.length, planted: Object.keys(state.plantings).length });
    c.append(summary);
    const expeditionMeta=expeditionMetaFor(state);
    if(expeditionMeta.reports.length){
      const reports=document.createElement('section');
      reports.className='expedition-reports';
      const title=document.createElement('h3'); title.textContent=t('expeditionReports'); reports.append(title);
      for(const report of expeditionMeta.reports.slice(0,5)){
        const article=document.createElement('article'); article.className='expedition-report';
        const heading=document.createElement('strong'); heading.textContent=report.title;
        const copy=document.createElement('p'); copy.textContent=report.summary;
        const loot=document.createElement('small'); loot.textContent=t('reportLoot',{supplies:report.securedSupplies,insight:report.securedInsight,finds:report.rareFinds.length?` · ${report.rareFinds.join(', ')}`:''});
        article.append(heading,copy,loot); reports.append(article);
      }
      c.append(reports);
    }
    for (const id of state.rewarded) {
      const chapter = arc.chapters[id] ?? memoryChapter(id);
      if (!chapter) continue;
      const memory = document.createElement('article');
      memory.className = 'journal-memory';
      const eyebrow = document.createElement('span');
      eyebrow.className = 'eyebrow';
      eyebrow.textContent = t('recoveredMemory');
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
      eyebrow.textContent = t('storyComplete');
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
      p.textContent = t('emptyJournal');
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
      h.textContent = t('memoryTray');
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

  function showContractBoard(state:GameState){
    const c=shell(t('expeditionBoard'));
    const meta=expeditionMetaFor(state);
    c.innerHTML=`<div class="contract-intro"><div><span class="eyebrow"></span><p></p></div><div class="resource-strip"><span><b>${meta.supplies}</b> ${t('supplies')}</span><span><b>${meta.insight}</b> ${t('insight')}</span><span><b>${meta.rareFinds.length}</b> ${t('rares')}</span></div></div><div class="loadout-title"><strong></strong><small><span data-selected></span> <b data-loadout-count>0</b> / 2</small></div><div class="loadout-grid"></div><div class="contract-grid"></div><section class="refuge-projects"><div class="section-heading"><div><span class="eyebrow"></span><h3></h3></div><small></small></div><div class="project-grid"></div></section>`;
    (c.querySelector('.contract-intro .eyebrow') as HTMLElement).textContent = t('repeatingRoutes', { region: expeditionRegionName(state) });
    (c.querySelector('.contract-intro p') as HTMLElement).textContent = t('contractIntro');
    (c.querySelector('.loadout-title strong') as HTMLElement).textContent = t('fieldKit');
    const selectedLabel = c.querySelector<HTMLElement>('.loadout-title small')!;
    (c.querySelector('.section-heading .eyebrow') as HTMLElement).textContent = t('refugeChanges');
    (c.querySelector('.section-heading h3') as HTMLElement).textContent = t('workshopProjects');
    (c.querySelector('.section-heading small') as HTMLElement).textContent = t('cosmeticOnly');
    const selected:GiftId[]=[];
    const tools=c.querySelector<HTMLElement>('.loadout-grid')!;
    const contracts=c.querySelector<HTMLElement>('.contract-grid')!;
    const refresh=()=>{
      selectedLabel.textContent=t('selectedOf',{count:selected.length});
      tools.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button)=>button.classList.toggle('selected',selected.includes(button.dataset.tool as GiftId)));
      contracts.querySelectorAll<HTMLButtonElement>('[data-start]').forEach((button)=>button.disabled=selected.length!==2||!!state.expedition);
    };
    for(const tool of Object.values(GIFTS)){
      const button=document.createElement('button');button.className='loadout-tool';button.dataset.tool=tool.id;
      button.innerHTML=`<span aria-hidden="true">${tool.id==='reveal'?'◐':tool.id==='grow'?'✂':tool.id==='echo'?'♬':'⌁'}</span><strong></strong><small></small>`;
      button.querySelector('strong')!.textContent=tool.name;button.querySelector('small')!.textContent=tool.description;
      button.addEventListener('click',()=>{const index=selected.indexOf(tool.id);if(index>=0)selected.splice(index,1);else if(selected.length<2)selected.push(tool.id);else{selected.shift();selected.push(tool.id)}refresh()});tools.append(button);
    }
    for(const contract of Object.values(CONTRACTS)){
      const article=document.createElement('article');article.className='contract-card';
      article.innerHTML=`<div class="contract-mark">${contract.id==='water-route'?'≈':contract.id==='signal-line'?'⌁':'△'}</div><span class="eyebrow"></span><h3></h3><p></p><div class="contract-reward"></div><button class="button primary" data-start></button>`;
      article.querySelector('.eyebrow')!.textContent=t('threeJobs');
      article.querySelector('.contract-reward')!.textContent=t('contractReward');
      article.querySelector('button')!.textContent=t('setOut');
      article.querySelector('h3')!.textContent=contract.name;article.querySelector('p')!.textContent=contract.brief;
      article.querySelector('button')!.addEventListener('click',()=>actions.onStartExpedition(contract.id,[selected[0]!,selected[1]!]));contracts.append(article);
    }
    const projects=c.querySelector<HTMLElement>('.project-grid')!;
    for(const project of Object.values(REFUGE_PROJECTS)){
      const built=meta.builtProjects.includes(project.id);const affordable=meta.supplies>=project.cost.supplies&&meta.insight>=project.cost.insight&&meta.rareFinds.length>=project.cost.rare;
      const card=document.createElement('article');card.className=`project-card${built?' built':''}`;
      card.innerHTML=`<span class="project-icon">${project.id==='workshop'?'⚒':project.id==='archive'?'▤':'⌂'}</span><div><strong></strong><p></p><small></small></div><button class="button ghost-light"></button>`;
      card.querySelector('strong')!.textContent=project.name;card.querySelector('p')!.textContent=project.description;
      card.querySelector('small')!.textContent=t('projectCost',{supplies:project.cost.supplies,insight:project.cost.insight,rare:project.cost.rare});
      const button=card.querySelector('button')!;button.textContent=built?t('built'):affordable?t('build'):t('stillShort');button.disabled=built||!affordable;button.addEventListener('click',()=>actions.onBuildProject(project.id));projects.append(card);
    }
    refresh();
  }

  function showWorkChoices(state:GameState,onChoose:(tool:GiftId)=>void){
    const actionsAvailable=availableWorkActions(state);const c=shell(t('howToWork'),true);const run=state.expedition!;const narrative=expeditionNarrativeFor(state)!;const siteId=run.completed.length<run.requiredTotal?run.siteIds[run.completed.length]:run.optionalSiteId;const note=narrative.siteNotes.find((item)=>item.siteId===siteId)?.observation;
    c.innerHTML=`<div class="field-evidence"><span class="eyebrow"></span><strong></strong><p></p></div><p class="soft-copy"></p><div class="work-choice-grid"></div>`;
    c.querySelector('.field-evidence .eyebrow')!.textContent=t('fieldEvidence');
    c.querySelector('.soft-copy')!.textContent=t('bothWays');
    c.querySelector('.field-evidence strong')!.textContent=narrative.title;c.querySelector('.field-evidence p')!.textContent=note??narrative.cause;
    const grid=c.querySelector<HTMLElement>('.work-choice-grid')!;
    for(const action of actionsAvailable){const button=document.createElement('button');button.className='work-choice';button.innerHTML=`<span class="work-tool"></span><strong></strong><p></p><small></small>`;button.querySelector('.work-tool')!.textContent=GIFTS[action.tool].name;button.querySelector('strong')!.textContent=action.title;button.querySelector('p')!.textContent=action.outcome;button.querySelector('small')!.textContent=t('workLoot',{supplies:action.supplies,insight:action.insight,pressure:action.pressure});button.addEventListener('click',()=>onChoose(action.tool));grid.append(button)}
  }

  function showExpeditionDecision(state:GameState,onChoose:(accept:boolean)=>void){
    const run=state.expedition!,narrative=expeditionNarrativeFor(state)!;clear();const section=document.createElement('section');section.className='story-card expedition-decision';
    section.innerHTML=`<span class="eyebrow"></span><h2></h2><p></p><small class="decision-warning"></small><div class="decision-stakes"><span></span><span></span></div><div class="choice-row"><button class="button primary" data-push></button><button class="button ghost-light" data-return></button></div>`;
    section.querySelector('.eyebrow')!.textContent=t('requiredDone');
    section.querySelector('h2')!.textContent=t('stayOrGo');
    section.querySelector('p')!.textContent=`${narrative.optionalLead} ${t('possibleFind',{find:narrative.rareFind})}`;
    section.querySelector('.decision-warning')!.textContent=narrative.warning;
    const stakes=section.querySelectorAll('.decision-stakes span');
    stakes[0]!.textContent=t('packSupplies',{supplies:run.supplies});
    stakes[1]!.textContent=t('weatherPressure',{pressure:run.pressure});
    section.querySelector('[data-push]')!.textContent=t('goFarther');
    section.querySelector('[data-return]')!.textContent=t('returnNow');
    section.querySelector('[data-push]')!.addEventListener('click',()=>onChoose(true));section.querySelector('[data-return]')!.addEventListener('click',()=>onChoose(false));root.append(section);
  }

  function refreshExpeditionNarrative(state:GameState){
    const run=state.expedition,narrative=expeditionNarrativeFor(state);if(!run||!narrative)return;
    const evidence=root.querySelector<HTMLElement>('.field-evidence');
    if(evidence){const siteId=run.completed.length<run.requiredTotal?run.siteIds[run.completed.length]:run.optionalSiteId;evidence.querySelector('strong')!.textContent=narrative.title;evidence.querySelector('p')!.textContent=narrative.siteNotes.find((item)=>item.siteId===siteId)?.observation??narrative.cause}
    const decision=root.querySelector<HTMLElement>('.expedition-decision');
    if(decision){decision.querySelector('p')!.textContent=`${narrative.optionalLead} ${t('possibleFind',{find:narrative.rareFind})}`;decision.querySelector('.decision-warning')!.textContent=narrative.warning}
  }

  function showExpeditionDebrief(report:ExpeditionReport,onContinue:()=>void){
    clear();const section=document.createElement('section');section.className='story-card expedition-debrief';
    section.innerHTML=`<span class="eyebrow"></span><h2></h2><p class="debrief-story"></p><div class="debrief-loot"><span><b></b> ${t('supplies')}</span><span><b></b> ${t('insight')}</span><span><b></b> ${t('rares')}</span></div><small class="weather-result"></small><button class="button primary"></button>`;
    section.querySelector('.eyebrow')!.textContent=t('reportSaved');
    section.querySelector('h2')!.textContent=report.title;section.querySelector('.debrief-story')!.textContent=report.summary;
    const values=section.querySelectorAll<HTMLElement>('.debrief-loot b');values[0]!.textContent=String(report.securedSupplies);values[1]!.textContent=String(report.securedInsight);values[2]!.textContent=String(report.rareFinds.length);
    section.querySelector('.weather-result')!.textContent=report.pressure>3?t('debriefWeatherBad'):t('debriefWeatherGood');
    section.querySelector('button')!.textContent=t('returnRefuge');
    section.querySelector('button')!.addEventListener('click',onContinue);root.append(section);
  }

  function showHelp() {
    const c = shell(t('howToTravel'), true);
    c.innerHTML = `<div class="controls keyboard-help"><b></b><span></span><b>F</b><span></span><b>E</b><span></span><b>J</b><span></span><b>C</b><span></span></div><div class="touch-help"><div class="touch-help-mark">●</div><div><b></b><span></span></div><div class="touch-help-mark">✦</div><div><b></b><span></span></div></div><div class="help-map"><div class="help-map-row"><i class="legend-tool"></i><span></span></div><div class="help-map-row"><i class="legend-use"></i><span></span></div><p></p></div><p class="soft-copy help-note"></p><div class="new-tale-note"><span class="eyebrow"></span><p></p><button class="button danger"></button></div>`;
    const keys = c.querySelectorAll('.keyboard-help b, .keyboard-help span');
    keys[0]!.textContent = t('wasd');
    keys[1]!.textContent = t('helpMove');
    keys[3]!.textContent = t('helpF');
    keys[5]!.textContent = t('helpE');
    keys[7]!.textContent = t('helpJ');
    keys[9]!.textContent = t('helpC');
    const touch = c.querySelectorAll('.touch-help b, .touch-help span');
    touch[0]!.textContent = t('dragGlow');
    touch[1]!.textContent = t('dragGlowHint');
    touch[2]!.textContent = t('tapTool');
    touch[3]!.textContent = t('tapToolHint');
    const map = c.querySelectorAll('.help-map span, .help-map p');
    map[0]!.textContent = t('helpMapTool');
    map[1]!.textContent = t('helpMapUse');
    map[2]!.textContent = t('helpMapTap');
    (c.querySelector('.help-note') as HTMLElement).textContent = t('noTimer');
    (c.querySelector('.new-tale-note .eyebrow') as HTMLElement).textContent = t('anotherStart');
    (c.querySelector('.new-tale-note p') as HTMLElement).textContent = t('newTaleCopy');
    (c.querySelector('.danger') as HTMLElement).textContent = t('startOtherTale');
    c.querySelector('.danger')?.addEventListener('click', () => {
      if (confirm(t('newTaleConfirm'))) actions.onNewTale();
    });
  }

  function showStoryLoom(status: WriterStatus, onDismiss: () => void, onRetry: () => void) {
    const percent = Math.round(status.progress * 100);
    const stage = status.phase === 'download' ? t('loomDownload') : status.phase === 'read' ? t('loomRead') : t('loomWeave');
    const currentProgress = root.querySelector<HTMLElement>('.story-loom-card[data-progress]');
    if (currentProgress && status.phase !== 'complete' && status.phase !== 'error') {
      const progress = currentProgress.querySelector<HTMLElement>('[role=progressbar]')!;
      progress.setAttribute('aria-valuenow', String(percent));
      (progress.querySelector('span') as HTMLElement).style.width = `${percent}%`;
      (currentProgress.querySelector('.loom-status b') as HTMLElement).textContent = stage;
      (currentProgress.querySelector('.loom-status strong') as HTMLElement).textContent = `${percent}%`;
      return;
    }
    const section = currentProgress ?? document.createElement('section');
    if (!currentProgress) clear();
    else delete section.dataset.progress;
    section.className = 'story-card story-loom-card';
    if (status.phase === 'complete') {
      section.innerHTML = `<div class="loom-mark" aria-hidden="true"><i></i><i></i><i></i></div><span class="eyebrow"></span><h2></h2><p class="soft-copy" data-story></p><button class="button primary"></button>`;
      (section.querySelector('.eyebrow') as HTMLElement).textContent = t('writtenOnDevice');
      (section.querySelector('h2') as HTMLElement).textContent = t('taleTookRoot');
      (section.querySelector('button') as HTMLElement).textContent = t('saveTale');
      (section.querySelector('[data-story]') as HTMLElement).textContent = status.story.premise;
      section.querySelector('button')?.addEventListener('click', onDismiss);
    } else if (status.phase === 'error') {
      section.innerHTML = `<div class="loom-mark broken" aria-hidden="true"><i></i><i></i><i></i></div><span class="eyebrow"></span><h2></h2><p class="soft-copy" data-error></p><div class="choice-row"><button class="button primary" data-retry></button><button class="button ghost-light" data-dismiss></button></div>`;
      (section.querySelector('.eyebrow') as HTMLElement).textContent = t('taleSafe');
      (section.querySelector('h2') as HTMLElement).textContent = t('threadSlipped');
      (section.querySelector('[data-retry]') as HTMLElement).textContent = t('tryAgain');
      (section.querySelector('[data-dismiss]') as HTMLElement).textContent = t('keepExisting');
      (section.querySelector('[data-error]') as HTMLElement).textContent = status.message;
      section.querySelector('[data-retry]')?.addEventListener('click', onRetry);
      section.querySelector('[data-dismiss]')?.addEventListener('click', onDismiss);
    } else {
      section.dataset.progress = '';
      section.innerHTML = `<div class="loom-mark active" aria-hidden="true"><i></i><i></i><i></i></div><span class="eyebrow"></span><h2></h2><p class="soft-copy"></p><div class="loom-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><span></span></div><div class="loom-status"><b></b><strong></strong></div><button class="text-button"></button>`;
      (section.querySelector('.eyebrow') as HTMLElement).textContent = t('nothingLeaves');
      (section.querySelector('h2') as HTMLElement).textContent = t('deviceWillWeave');
      (section.querySelector('.soft-copy') as HTMLElement).textContent = t('loomCopy');
      section.querySelector('[role=progressbar]')!.setAttribute('aria-label', t('loomProgress'));
      (section.querySelector('.text-button') as HTMLElement).textContent = t('exploreWhileWriting');
      const progress = section.querySelector<HTMLElement>('[role=progressbar]')!;
      progress.setAttribute('aria-valuenow', String(percent));
      (progress.querySelector('span') as HTMLElement).style.width = `${percent}%`;
      (section.querySelector('.loom-status b') as HTMLElement).textContent = stage;
      (section.querySelector('.loom-status strong') as HTMLElement).textContent = `${percent}%`;
      section.querySelector('button')?.addEventListener('click', onDismiss);
    }
    root.append(section);
  }

  return { clear, showWake, showMemoryBeat, showMemoryChapter, showEnding, showMemoryChoice, showNewerSave, showPersonalize, showImport, showAI, showCharacter, showJournal, showHelp, showStoryLoom, showContractBoard, showWorkChoices, showExpeditionDecision, showExpeditionDebrief, refreshExpeditionNarrative };
}
