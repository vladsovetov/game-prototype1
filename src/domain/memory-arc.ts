import type { GameState } from './types';

export interface MemoryChapter {
  id: string;
  title: string;
  keepsake: string;
  story: string;
}

export const MEMORY_CHAPTERS: Record<string, MemoryChapter> = {
  sign: {
    id: 'sign',
    title: 'The Road Home',
    keepsake: 'Remembered Waypost',
    story: 'A sign for Lantern House led through a storm toward a distant light—one that somebody kept burning so the way home would not disappear.',
  },
  stone: {
    id: 'stone',
    title: 'The Song Below',
    keepsake: 'Singing Tree',
    story: 'Your voice returns inside the silver leaves. You taught a room of frightened travelers the same four notes, and they sang together until the thunder sounded small.',
  },
  pool: {
    id: 'pool',
    title: 'The Basin at Dawn',
    keepsake: 'Whispering Pool',
    story: 'Cold water circles your wrists. At every dawn after a storm, you washed the road from each guest’s coat before you ever asked their name.',
  },
  root: {
    id: 'root',
    title: 'The Door Left Unlocked',
    keepsake: 'Little Hidden Door',
    story: 'Behind the living roots waits a narrow room with blankets and dry bread. You never locked it; a refuge is only a refuge if anyone can enter.',
  },
  bell: {
    id: 'bell',
    title: 'The Storm Bell',
    keepsake: 'Rain Bell',
    story: 'You pulled this bell through the rain until your palms bled. Every ring told the people beyond the hill: Lantern House still stands. Follow the sound.',
  },
  moth: {
    id: 'moth',
    title: 'Letters with Wings',
    keepsake: 'Paper Flock',
    story: 'Hundreds of folded notes flew into the dark: “There is room here. You do not have to arrive brave.” Some returned carrying names.',
  },
  moon: {
    id: 'moon',
    title: 'A Name for the Moon',
    keepsake: 'Named Moon',
    story: 'A child at your window could not sleep. You named the blank moon Morrow and promised that morning would come. The name stayed after the storm.',
  },
  garden: {
    id: 'garden',
    title: 'The Garden That Waited',
    keepsake: 'Lantern Garden',
    story: 'When the lamp oil ran out, you planted warm flowers beside the road. Each bloom held enough dusk to show a lost traveler the next step.',
  },
};

export const LANTERN_HOUSE_ENDING = {
  title: 'The Keeper of Lantern House',
  story: 'Lantern House was never the home you were trying to find. It was the home you made for everyone still on the road. In the last great storm, you carried its light into the dark and spent your memories guiding others home. This meadow grew from what you gave away. You were the Keeper of Lantern House.',
} as const;

export function memoryChapter(id: string): MemoryChapter | undefined {
  return MEMORY_CHAPTERS[id];
}

export function sanctuaryProgress(state: GameState) {
  const required = 6;
  const planted = Math.min(Object.keys(state.plantings).length, required);
  return { planted, required, complete: planted >= required };
}

export function hasReachedEnding(state: GameState) {
  return sanctuaryProgress(state).complete && !state.endingSeen;
}
