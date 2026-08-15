import type { StoryIngredients } from '../domain/story';

const LIMITS: Record<keyof StoryIngredients, number> = {
  place: 64,
  role: 64,
  disaster: 140,
  vow: 160,
  motif: 48,
  truth: 180,
};

export type StoryWorkerRequest = {
  type: 'generate';
  jobId: string;
  character: { name: string; description: string; gift: string; burden: string; quirk: string };
  seed: number;
} | { type: 'cancel'; jobId: string };

export type StoryWorkerMessage =
  | { type: 'progress'; jobId: string; stage: 'download' | 'read' | 'weave'; progress?: number }
  | { type: 'complete'; jobId: string; raw: string }
  | { type: 'error'; jobId: string; message: string };

export type StoryParseResult = { ok: true; value: StoryIngredients } | { ok: false; reason: string };

export function parseStoryIngredients(raw: string): StoryParseResult {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, reason: 'The device did not return a story object.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return { ok: false, reason: 'The device returned an unfinished story object.' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'The story object had the wrong shape.' };
  const source = parsed as Record<string, unknown>;
  const value = {} as StoryIngredients;
  for (const key of Object.keys(LIMITS) as Array<keyof StoryIngredients>) {
    const field = source[key];
    if (typeof field !== 'string' || !field.trim() || field.trim().length > LIMITS[key]) {
      return { ok: false, reason: `The ${key} was missing or too long.` };
    }
    value[key] = field.trim();
  }
  return { ok: true, value };
}
