import { composeStory } from '../domain/story';
import type { Character, StoryArc } from '../domain/types';
import { parseStoryIngredients, type StoryWorkerMessage, type StoryWorkerRequest } from './local-story-protocol';

export type WriterStatus =
  | { phase: 'idle'; progress: number }
  | { phase: 'download' | 'read' | 'weave'; progress: number }
  | { phase: 'complete'; progress: 1; story: StoryArc }
  | { phase: 'error'; progress: number; message: string };

export interface StoryWorkerLike {
  onmessage: ((event: MessageEvent<StoryWorkerMessage>) => void) | null;
  postMessage(message: StoryWorkerRequest): void;
  terminate(): void;
}

interface WriterOptions {
  workerFactory(): StoryWorkerLike;
  onStatus(status: WriterStatus): void;
  onStory(story: StoryArc): void;
}

export function createLocalStoryWriter(options: WriterOptions) {
  const worker = options.workerFactory();
  let active: { jobId: string; character: Character; seed: number } | undefined;
  let sequence = 0;

  worker.onmessage = (event) => {
    const message = event.data;
    if (!active || message.jobId !== active.jobId) return;
    if (message.type === 'progress') {
      options.onStatus({ phase: message.stage, progress: Math.max(0, Math.min(1, message.progress ?? 0)) });
      return;
    }
    if (message.type === 'error') {
      active = undefined;
      options.onStatus({ phase: 'error', progress: 0, message: message.message || 'The local writer could not finish.' });
      return;
    }
    const parsed = parseStoryIngredients(message.raw);
    if (!parsed.ok) {
      active = undefined;
      options.onStatus({ phase: 'error', progress: 0, message: parsed.reason });
      return;
    }
    const story = composeStory(active.character, active.seed, parsed.value, 'local-model');
    active = undefined;
    options.onStory(story);
    options.onStatus({ phase: 'complete', progress: 1, story });
  };

  return {
    start(character: Character, seed: number) {
      if (active) return active.jobId;
      const jobId = `${seed >>> 0}-${++sequence}`;
      active = { jobId, character, seed: seed >>> 0 };
      options.onStatus({ phase: 'download', progress: 0 });
      worker.postMessage({
        type: 'generate', jobId, seed: seed >>> 0,
        character: { name: character.name, description: character.description, gift: character.gift.name, burden: character.burden.name, quirk: character.quirk.name },
      });
      return jobId;
    },
    cancel() {
      active = undefined;
      options.onStatus({ phase: 'idle', progress: 0 });
    },
    destroy() {
      active = undefined;
      worker.terminate();
    },
  };
}
