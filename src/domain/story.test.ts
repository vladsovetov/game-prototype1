import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { prepareNewRun } from './run';
import { composeStory, createWovenStory, storyFor, wovenIngredients } from './story';
import { createInitialState } from './simulation';
import { createRunDirection } from './run-direction';

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

  it('uses genuinely different openings, questions, chapters, and endings for each story frame', () => {
    const character = generateCharacter(42);
    const ingredients = wovenIngredients(1234);
    const stationDirection = { ...createRunDirection(1), frame: 'station' as const };
    const surveyDirection = { ...createRunDirection(1), frame: 'surveyor' as const };
    const station = composeStory(character, 1234, ingredients, 'woven', stationDirection);
    const survey = composeStory(character, 1234, ingredients, 'woven', surveyDirection);

    expect(station.direction?.frame).toBe('station');
    expect(survey.direction?.frame).toBe('surveyor');
    expect(survey.premise).not.toBe(station.premise);
    expect(survey.question).not.toBe(station.question);
    expect(survey.chapters.sign?.story).not.toBe(station.chapters.sign?.story);
    expect(survey.ending.story).not.toBe(station.ending.story);
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
