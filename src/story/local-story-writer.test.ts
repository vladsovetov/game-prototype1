import { describe, expect, it } from 'vitest';
import { generateCharacter } from '../domain/character';
import { createLocalStoryWriter, type StoryWorkerLike, type WriterStatus } from './local-story-writer';
import { createRunDirection } from '../domain/run-direction';

class FakeWorker implements StoryWorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  postMessage() {}
  terminate() {}
  emit(data: unknown) { this.onmessage?.({ data } as MessageEvent); }
}

const raw = JSON.stringify({
  place: 'Скляний сад', role: 'хранитель малих буревіїв', disaster: 'північна дорога зникла під дощем',
  vow: 'Жоден мандрівник не залишиться без світла.', motif: 'мідне листя', truth: 'домом була обіцянка, яку берегли разом',
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

  it('turns a real non-JSON model response into a coherent Ukrainian story', () => {
    const worker = new FakeWorker();
    const statuses: WriterStatus[] = [];
    const stories: Array<{ source: string; premise: string; direction?: ReturnType<typeof createRunDirection> }> = [];
    const writer = createLocalStoryWriter({ workerFactory: () => worker, onStatus: (status) => statuses.push(status), onStory: (story) => stories.push(story) });
    const jobId = writer.start(generateCharacter(4), 99);

    const modelSignal =
      'З ти пишуще 15 й лагідні і складникі історіёрівилістіри, і 4 клабіки, 15 острікі васірі віт';
    worker.emit({
      type: 'complete',
      jobId,
      raw: modelSignal,
    });

    expect(statuses.at(-1)).toMatchObject({ phase: 'complete' });
    expect(stories).toHaveLength(1);
    expect(stories[0]!.source).toBe('local-model');
    expect(stories[0]!.premise).toMatch(/[А-ЯІЇЄҐа-яіїєґ]/);
    expect(stories[0]!.premise).not.toMatch(/[A-Za-z]/);
    expect(stories[0]!.direction).toEqual(createRunDirection(99, modelSignal));
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

  it('replays current progress when an active writer is reopened', () => {
    const worker = new FakeWorker();
    const statuses: WriterStatus[] = [];
    const writer = createLocalStoryWriter({ workerFactory: () => worker, onStatus: (status) => statuses.push(status), onStory: () => {} });
    const jobId = writer.start(generateCharacter(4), 99);
    worker.emit({ type: 'progress', jobId, stage: 'download', progress: .6 });
    const before = statuses.length;

    writer.start(generateCharacter(4), 99);

    expect(statuses).toHaveLength(before + 1);
    expect(statuses.at(-1)).toMatchObject({ phase: 'download', progress: .6 });
  });

  it('generates a validated expedition card without replacing the opening story', () => {
    const worker = new FakeWorker();
    const expeditions: Array<{ expeditionId: string; title: string }> = [];
    const writer = createLocalStoryWriter({
      workerFactory: () => worker,
      onStatus: () => {},
      onStory: () => {},
      onExpedition: (expeditionId, narrative) => expeditions.push({ expeditionId, title: narrative.title }),
    });
    const jobId = writer.startExpedition({
      expeditionId: 'water-route-7', seed: 7, character: generateCharacter(4),
      contractName: 'Відновити водний маршрут', siteIds: ['pool', 'root', 'sign', 'garden'],
      recentMemories: ['Минулого разу помпу полагодили набором.'], recentFingerprints: [],
    });
    worker.emit({
      type: 'complete-expedition', jobId,
      raw: JSON.stringify({
        title: 'Шепіт у водогоні', situation: 'зникнення', mood: 'тиха-тривога', palette: 'мідь-мох',
        cause: 'Хтось щоночі перенаправляє воду до старого саду.',
        siteNotes: [
          { siteId: 'pool', observation: 'Помпа тепла, хоча давно не працює.' },
          { siteId: 'root', observation: 'Під корінням чути рівний потік.' },
          { siteId: 'sign', observation: 'На покажчику з’явилася свіжа риска.' },
          { siteId: 'garden', observation: 'Одна грядка вкрита росою.' },
        ],
        optionalLead: 'За садом видно відблиск прихованого бака.', warning: 'Негода швидко наближається.',
        rareFind: 'мідний жетон водника', visualTags: ['мідь', 'мох', 'вода'],
      }),
    });

    expect(expeditions).toEqual([{ expeditionId: 'water-route-7', title: 'Шепіт у водогоні' }]);
  });
});
