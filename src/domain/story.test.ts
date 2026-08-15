import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { prepareNewRun } from './run';
import { createWovenStory, storyFor } from './story';
import { createInitialState } from './simulation';

describe('procedural story', () => {
  it('recreates one complete story from a character and seed', () => {
    const character = generateCharacter(42);
    const first = createWovenStory(character, 1234);

    expect(first).toEqual(createWovenStory(character, 1234));
    expect(Object.keys(first.chapters).sort()).toEqual(['bell', 'garden', 'moon', 'moth', 'pool', 'root', 'sign', 'stone']);
    expect(first.ending.story.length).toBeGreaterThan(120);
  });

  it('changes the tale with the seed and shapes it around the companion', () => {
    const character = generateCharacter(42);
    const first = createWovenStory(character, 1234);
    const second = createWovenStory(character, 5678);
    const allCopy = JSON.stringify(first);

    expect(second.premise).not.toBe(first.premise);
    expect(second.chapters.sign!.story).not.toBe(first.chapters.sign!.story);
    expect(allCopy).toContain(character.name);
    expect(allCopy).toContain(character.gift.name);
  });

  it('starts a new run with persisted world and story identity', () => {
    const character = generateCharacter(9);
    const state = prepareNewRun(character, 2468);

    expect(state.worldSeed).toBe(2468);
    expect(state.storyArc?.seed).toBe(2468);
    expect(state.tutorial?.step).toBe('wake');
  });

  it('keeps the Lantern House arc for an older save', () => {
    const legacy = createInitialState(generateCharacter(9));

    expect(storyFor(legacy).ending.title).toBe('Хранитель Дому Ліхтарів');
  });
});
