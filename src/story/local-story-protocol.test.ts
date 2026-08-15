import { describe, expect, it } from 'vitest';
import { parseExpeditionNarrative, parseRadioRemark, parseRelicCard, parseStoryIngredients } from './local-story-protocol';

const valid = {
  place: 'Скляний сад',
  role: 'хранитель малих буревіїв',
  disaster: 'північна дорога зникла під дощем',
  vow: 'Жоден мандрівник не залишиться без світла.',
  motif: 'мідне листя',
  truth: 'домом була обіцянка, яку вони берегли разом',
};

describe('local story protocol', () => {
  it('extracts one bounded ingredient object from a model response', () => {
    const result = parseStoryIngredients(`Here is the tale:\n\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``);

    expect(result).toEqual({ ok: true, value: valid });
  });

  it('rejects empty, missing, and overlong required fields', () => {
    expect(parseStoryIngredients(JSON.stringify({ ...valid, vow: '' })).ok).toBe(false);
    expect(parseStoryIngredients(JSON.stringify({ ...valid, truth: 'x'.repeat(181) })).ok).toBe(false);
    const { motif: _motif, ...missing } = valid;
    expect(parseStoryIngredients(JSON.stringify(missing)).ok).toBe(false);
  });

  it('rejects malformed model prose without changing game data', () => {
    expect(parseStoryIngredients('The answer is {not actually json}.').ok).toBe(false);
    expect(parseStoryIngredients('The answer is {not actually json}.', 'en')).toEqual({
      ok: false,
      reason: 'The device returned an unfinished story object.',
    });
  });

  it('rejects an English result so it cannot leak into the Ukrainian interface', () => {
    const english = { ...valid, place: 'The Glass Orchard', role: 'keeper of small storms', motif: 'copper leaves' };

    expect(parseStoryIngredients(JSON.stringify(english))).toEqual({
      ok: false,
      reason: 'Локальний оповідач не повернув текст українською.',
    });
  });

  it('accepts English for an English job and rejects Cyrillic output', () => {
    const english = {
      place: 'The Glass Orchard', role: 'keeper of small storms', disaster: 'the north road vanished in rain',
      vow: 'No traveler will be left without a light.', motif: 'copper leaves', truth: 'home was the promise they kept together',
    };
    expect(parseStoryIngredients(JSON.stringify(english), 'en')).toEqual({ ok: true, value: english });
    expect(parseStoryIngredients(JSON.stringify(valid), 'en').ok).toBe(false);
  });

  it('accepts Russian for a Russian job and rejects Latin output', () => {
    const russian = {
      place: 'Стеклянный сад', role: 'хранитель малых бурь', disaster: 'северная дорога исчезла под дождём',
      vow: 'Ни один путник не останется без света.', motif: 'медные листья', truth: 'домом было обещание, которое они хранили вместе',
    };
    expect(parseStoryIngredients(JSON.stringify(russian), 'ru')).toEqual({ ok: true, value: russian });
    expect(parseStoryIngredients(JSON.stringify({ ...russian, motif: 'copper leaves' }), 'ru').ok).toBe(false);
  });
});

describe('local expedition protocol', () => {
  const validExpedition = {
    title: 'Голос під старою помпою',
    situation: 'зникнення',
    mood: 'тиха-тривога',
    palette: 'мідь-мох',
    cause: 'Старий клапан відкривається лише після заходу сонця.',
    siteNotes: [
      { siteId: 'pool', observation: 'На камені лишилися мокрі сліди долонь.' },
      { siteId: 'root', observation: 'Коріння обплело справний водогін.' },
      { siteId: 'sign', observation: 'Стрілка вказує на давно засипаний канал.' },
      { siteId: 'garden', observation: 'Суха грядка тихо дзвенить під кроками.' },
    ],
    optionalLead: 'За грядкою блимає ще один аварійний маяк.',
    warning: 'Далекий маршрут посилить негоду.',
    rareFind: 'мідний ключ водника',
    visualTags: ['мідь', 'мох', 'дощ'],
  };

  it('accepts a bounded Ukrainian expedition card for the exact route', () => {
    const result = parseExpeditionNarrative(JSON.stringify(validExpedition), ['pool', 'root', 'sign', 'garden'], []);

    expect(result).toMatchObject({ ok: true, value: { title: validExpedition.title, source: 'local-model' } });
  });

  it('rejects invented route sites and a recently repeated narrative fingerprint', () => {
    const invented = { ...validExpedition, siteNotes: [{ siteId: 'castle', observation: 'Замок виник із туману.' }, ...validExpedition.siteNotes.slice(1)] };
    expect(parseExpeditionNarrative(JSON.stringify(invented), ['pool', 'root', 'sign', 'garden'], []).ok).toBe(false);

    const first = parseExpeditionNarrative(JSON.stringify(validExpedition), ['pool', 'root', 'sign', 'garden'], []);
    if (!first.ok) throw new Error('Expected a valid expedition card.');
    expect(parseExpeditionNarrative(JSON.stringify(validExpedition), ['pool', 'root', 'sign', 'garden'], [first.value.fingerprint])).toEqual({
      ok: false,
      reason: 'Локальний режисер повторив недавню пригоду.',
    });
  });

  it('rejects null and primitive site-note entries without throwing', () => {
    const nullNotes = { ...validExpedition, siteNotes: [null, null, null, null] };
    const primitiveNotes = { ...validExpedition, siteNotes: ['pool', 'root', 'sign', 'garden'] };

    expect(() => parseExpeditionNarrative(JSON.stringify(nullNotes), ['pool', 'root', 'sign', 'garden'], [])).not.toThrow();
    expect(parseExpeditionNarrative(JSON.stringify(nullNotes), ['pool', 'root', 'sign', 'garden'], []).ok).toBe(false);
    expect(parseExpeditionNarrative(JSON.stringify(primitiveNotes), ['pool', 'root', 'sign', 'garden'], []).ok).toBe(false);
  });

  it('maps an English expedition schema to stable game values', () => {
    const english = {
      title: 'A Voice Under the Old Pump', situation: 'disappearance', mood: 'quiet-tension', palette: 'copper-moss',
      cause: 'An old valve opens only after sunset.',
      siteNotes: validExpedition.siteNotes.map((note) => ({ siteId: note.siteId, observation: `Fresh field evidence near ${note.siteId}.` })),
      optionalLead: 'A weak beacon flashes beyond the garden.', warning: 'The longer route will worsen the weather.',
      rareFind: 'old waterworks token', visualTags: ['copper', 'moss', 'rain'],
    };
    const result = parseExpeditionNarrative(JSON.stringify(english), ['pool', 'root', 'sign', 'garden'], [], 'en');
    expect(result).toMatchObject({ ok: true, value: { title: english.title, situation: 'зникнення', mood: 'тиха-тривога', palette: 'мідь-мох' } });
  });
});

describe('radio and relic protocol', () => {
  it('accepts a short Ukrainian radio line and rejects English on a Ukrainian job', () => {
    expect(parseRadioRemark(JSON.stringify({ text: 'Цей символ уже був на дверях станції.', mistaken: true }))).toEqual({
      ok: true, value: { text: 'Цей символ уже був на дверях станції.', mistaken: true },
    });
    expect(parseRadioRemark(JSON.stringify({ text: 'This symbol was on the door.', mistaken: false })).ok).toBe(false);
  });

  it('accepts only trusted relic forms and remaps unknown colors', () => {
    const parsed = parseRelicCard(JSON.stringify({
      name: 'Мідний ліхтар', story: 'Зібрано після нічної помпи.', material: 'copper', color: '#ffffff',
      symbol: 'крапля', condition: 'weathered', form: 'lantern',
    }), 7);
    expect(parsed).toMatchObject({ ok: true, value: { form: 'lantern', material: 'copper' } });
    if (parsed.ok) expect(parsed.value.color).not.toBe('#ffffff');
    expect(parseRelicCard(JSON.stringify({
      name: 'Меч', story: 'Сила плюс десять.', material: 'steel', color: '#c47a3a', symbol: 'лезо', condition: 'new', form: 'sword',
    }), 7).ok).toBe(false);
  });
});
