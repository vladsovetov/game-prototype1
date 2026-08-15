import { describe, expect, it } from 'vitest';
import { generateCharacter } from '../domain/character';
import { createLocalStoryWriter, type StoryWorkerLike, type WriterStatus } from './local-story-writer';

class FakeWorker implements StoryWorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage() {}
  terminate() {}
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
}

const raw = JSON.stringify({
  place: 'The Glass Orchard', role: 'keeper of small storms', disaster: 'the northern road disappeared in rain',
  vow: 'No traveler will be left without a light.', motif: 'copper leaves', truth: 'home was the promise they kept together',
});

describe('local story writer', () => {
  it('turns worker progress and valid output into an on-device story', () => {
    const worker = new FakeWorker();
    const statuses: WriterStatus[] = [];
    const stories: string[] = [];
    const writer = createLocalStoryWriter({ workerFactory: () => worker, onStatus: (status) => statuses.push(status), onStory: (story) => stories.push(story.source) });
    const jobId = writer.start(generateCharacter(4), 99);

    worker.emit({ type: 'progress', jobId, stage: 'download', progress: .4 });
    worker.emit({ type: 'complete', jobId, raw });

    expect(statuses.at(-2)).toMatchObject({ phase: 'download', progress: .4 });
    expect(statuses.at(-1)).toMatchObject({ phase: 'complete' });
    expect(stories).toEqual(['local-model']);
  });

  it('keeps the existing story after worker or validation failure', () => {
    const worker = new FakeWorker();
    const statuses: WriterStatus[] = [];
    const stories: string[] = [];
    const writer = createLocalStoryWriter({ workerFactory: () => worker, onStatus: (status) => statuses.push(status), onStory: (story) => stories.push(story.source) });
    const first = writer.start(generateCharacter(4), 99);
    worker.emit({ type: 'error', jobId: first, message: 'Model unavailable' });
    const second = writer.start(generateCharacter(4), 99);
    worker.emit({ type: 'complete', jobId: second, raw: '{broken}' });

    expect(stories).toEqual([]);
    expect(statuses.at(-1)).toMatchObject({ phase: 'error' });
  });

  it('ignores a stale result after the run changes', () => {
    const worker = new FakeWorker();
    const stories: number[] = [];
    const writer = createLocalStoryWriter({ workerFactory: () => worker, onStatus: () => {}, onStory: (story) => stories.push(story.seed) });
    const stale = writer.start(generateCharacter(4), 99);
    writer.cancel();
    const current = writer.start(generateCharacter(4), 100);
    worker.emit({ type: 'complete', jobId: stale, raw });
    worker.emit({ type: 'complete', jobId: current, raw });

    expect(stories).toEqual([100]);
  });
});
