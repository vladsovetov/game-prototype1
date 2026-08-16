import { describe, expect, it } from 'vitest';
import { createVoiceNarrator, type VoiceStatus, type VoiceWorkerLike } from './voice-narrator';
import type { VoiceWorkerMessage, VoiceWorkerRequest } from './voice-protocol';

class MemoryPreference {
  enabled = false;
  load() { return this.enabled; }
  save(enabled: boolean) { this.enabled = enabled; }
}

function mockWorker() {
  const sent: VoiceWorkerRequest[] = [];
  const worker: VoiceWorkerLike = {
    onmessage: null,
    postMessage(message: VoiceWorkerRequest) { sent.push(message); },
    terminate() {},
  };
  return {
    sent,
    worker,
    emit(message: VoiceWorkerMessage) {
      worker.onmessage?.({ data: message } as MessageEvent<VoiceWorkerMessage>);
    },
  };
}

describe('voice narrator', () => {
  it('does not start a worker or speak while the preference is off', () => {
    let created = 0;
    const { sent, worker } = mockWorker();
    const narrator = createVoiceNarrator({
      workerFactory: () => { created += 1; return worker; },
      preference: new MemoryPreference(),
      locale: 'uk',
    });

    narrator.speak('Це Morrow.');
    expect(created).toBe(0);
    expect(sent).toEqual([]);
    expect(narrator.status().phase).toBe('off');
  });

  it('asks the locale voice to speak and plays the returned audio', () => {
    const { sent, worker, emit } = mockWorker();
    const played: number[] = [];
    const statuses: VoiceStatus[] = [];
    const preference = new MemoryPreference();
    const narrator = createVoiceNarrator({
      workerFactory: () => worker,
      preference,
      locale: 'uk',
      play: (buffer) => { played.push(buffer.byteLength); return { stop() {} }; },
      onStatus: (status) => statuses.push(status),
    });

    narrator.setEnabled(true);
    narrator.speak('  Притулок щойно клацнув.  ');
    expect(sent[0]).toMatchObject({ type: 'speak', locale: 'uk', voiceId: 'uk_UA-ukrainian_tts-medium', text: 'Притулок щойно клацнув.' });

    emit({ type: 'progress', jobId: sent[0]!.jobId, progress: 0.4 });
    emit({ type: 'audio', jobId: sent[0]!.jobId, buffer: new ArrayBuffer(16) });
    expect(played).toEqual([16]);
    expect(statuses.map((item) => item.phase)).toContain('speaking');
  });
});
