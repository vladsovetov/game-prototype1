import { seededRandom } from './random';
import type { Character, GameState, StoryArc, StoryChapter } from './types';
import { LANTERN_HOUSE_ENDING, MEMORY_CHAPTERS } from './memory-arc';

export interface StoryIngredients {
  place: string;
  role: string;
  disaster: string;
  vow: string;
  motif: string;
  truth: string;
}

const PLACES = ['the House of Blue Windows', 'Mothbell Refuge', 'the Rain Archive', 'the Last Warm Station', 'the Orchard of Small Moons'];
const ROLES = ['keeper of the night road', 'listener at the weather door', 'mender of travelers’ names', 'cartographer of vanished paths', 'gardener of borrowed light'];
const DISASTERS = ['the river rose into the sky', 'a silver storm erased every road', 'the moon went dark for seven nights', 'the bells forgot how to warn the valley', 'the wind carried every name away'];
const VOWS = ['No lost traveler will face the dark alone.', 'I will leave a light wherever the road divides.', 'Every stranger will be welcomed before they are questioned.', 'What the storm scatters, I will gather gently.', 'I will remember for those who cannot.'];
const MOTIFS = ['blue thread', 'rain on warm glass', 'four quiet notes', 'paper wings', 'golden seeds'];
const TRUTHS = ['home was the shelter they made for others', 'their memories became the lights that guided everyone out', 'the road survived because they taught strangers to care for one another', 'they were never searching for a refuge—they were building one', 'every person they saved carried one piece of them onward'];

function pick<T>(values: readonly T[], random: () => number) {
  return values[Math.floor(random() * values.length)]!;
}

export function wovenIngredients(seed: number): StoryIngredients {
  const random = seededRandom((seed ^ 0x51f15e) >>> 0);
  return {
    place: pick(PLACES, random), role: pick(ROLES, random), disaster: pick(DISASTERS, random),
    vow: pick(VOWS, random), motif: pick(MOTIFS, random), truth: pick(TRUTHS, random),
  };
}

function chapter(id: string, title: string, keepsake: string, story: string): StoryChapter {
  return { id, title, keepsake, story };
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function composeStory(character: Character, seed: number, ingredients: StoryIngredients, source: StoryArc['source']): StoryArc {
  const name = character.name;
  const place = ingredients.place;
  const motif = ingredients.motif;
  const role = ingredients.role;
  return {
    seed: seed >>> 0,
    source,
    worldName: place.replace(/^the /i, ''),
    runMark: (seed >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(-6),
    premise: `${name} wakes in a meadow that remembers ${motif}. Once, they tended ${place} as its ${role}; then ${ingredients.disaster}, and their past broke into living keepsakes.`,
    question: `Who helped ${name} keep their vow?`,
    firstClue: `The erased letters return: “${place}.” ${name} feels the shape of an old promise: ${ingredients.vow}`,
    recovered: `${name} remembers walking through ${ingredients.disaster}. A trail of ${motif} led toward ${place}, where someone was still waiting.`,
    chapters: {
      sign: chapter('sign', 'The Road That Remembered', 'Remembered Waypost', `The restored sign points toward ${place}. In ${name}’s hand, its letters glow like ${motif}: the first proof that the lost road was real.`),
      stone: chapter('stone', 'The Song Under Stone', 'Singing Tree', `${name} once used ${character.gift.name} to wake a song beneath the floor of ${place}. Travelers learned its four notes and sang until ${ingredients.disaster} sounded far away.`),
      pool: chapter('pool', 'Water Before Questions', 'Whispering Pool', `At every dawn, ${name} washed the road from each guest’s coat before asking their name. The water still whispers their vow: “${ingredients.vow}”`),
      root: chapter('root', 'The Unlocked Room', 'Little Hidden Door', `Behind living roots waits a narrow room with blankets and bread. The door of ${place} was never locked; refuge had to belong to whoever found it.`),
      bell: chapter('bell', 'The Warning in the Rain', 'Rain Bell', `${name} pulled the bell through the dark while ${ingredients.disaster}. Each ring meant that ${place} still stood and that the next step was safe.`),
      moth: chapter('moth', 'Letters Given Wings', 'Paper Flock', `Hundreds of folded notes left ${place} on paper wings. Each carried ${name}’s promise to the lost: “${ingredients.vow}” Some returned bearing names.`),
      moon: chapter('moon', 'A Name for Morning', 'Named Moon', `A child at the window could not sleep, so ${name} named the blank moon after ${motif}. The invented name stayed after the storm and became a word for courage.`),
      garden: chapter('garden', 'The Garden That Answered', 'Lantern Garden', `When the lamps failed, ${name} planted warm flowers beside the road. Each bloom held a trace of ${motif}, enough to show one traveler the next step.`),
    },
    ending: {
      title: `The ${titleCase(role)}`,
      story: `${name} was not trying to return to ${place}. They made it for everyone still on the road. When ${ingredients.disaster}, they spent their memories guiding others through the dark. ${ingredients.truth[0]!.toUpperCase()}${ingredients.truth.slice(1)}. This meadow grew from what they gave away, and every recovered keepsake carries the old vow: ${ingredients.vow}`,
    },
  };
}

export function createWovenStory(character: Character, seed: number) {
  return composeStory(character, seed, wovenIngredients(seed), 'woven');
}

const LEGACY_ARC: StoryArc = {
  seed: 0, source: 'woven', worldName: 'Lantern House', runMark: 'LEGACY',
  premise: 'A forgotten road crosses this meadow. Its scattered memories lead toward Lantern House and the truth of its missing keeper.',
  question: 'Who kept the light burning?',
  firstClue: '', recovered: '', chapters: MEMORY_CHAPTERS,
  ending: LANTERN_HOUSE_ENDING,
};

export function storyFor(state: GameState): StoryArc {
  if (state.storyArc) return state.storyArc;
  return {
    ...LEGACY_ARC,
    firstClue: `The erased letters return: “Lantern House.” The words make ${state.character.name}'s chest feel warm. This was a road they once followed.`,
    recovered: `${state.character.name} remembers walking through a storm toward a distant light—one that somebody kept burning so they could find the way home.`,
  };
}
