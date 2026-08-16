import type { Locale } from '../i18n/locale';
import { fieldVoiceFor } from './voice-catalog';
import type { VoiceWorkerMessage, VoiceWorkerRequest } from './voice-protocol';

export type VoicePhase = 'off' | 'download' | 'ready' | 'speaking' | 'error';
export interface VoiceStatus { phase: VoicePhase; progress: number; message?: string }

export interface VoiceWorkerLike {
  onmessage: ((event: MessageEvent<VoiceWorkerMessage>) => void) | null;
  postMessage(message: VoiceWorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
}

interface NarratorOptions {
  workerFactory(): VoiceWorkerLike;
  preference: { load(): boolean; save(enabled: boolean): void };
  locale: Locale;
  play?(buffer: ArrayBuffer): { stop(): void };
  onStatus?(status: VoiceStatus): void;
}

function browserPlay(buffer: ArrayBuffer) {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
  const audio = new Audio(url);
  const stop = () => {
    audio.pause();
    audio.removeAttribute('src');
    URL.revokeObjectURL(url);
  };
  audio.addEventListener('ended', stop);
  audio.addEventListener('error', stop);
  void audio.play().catch(stop);
  return { stop };
}

export function createVoiceNarrator(options: NarratorOptions) {
  let worker: VoiceWorkerLike | undefined;
  let enabled = options.preference.load();
  let sequence = 0;
  let activeJobId: string | undefined;
  let playback: { stop(): void } | undefined;
  let current: VoiceStatus = { phase: enabled ? 'ready' : 'off', progress: enabled ? 1 : 0 };

  const publish = (status: VoiceStatus) => {
    current = status;
    options.onStatus?.(status);
  };

  const stopPlayback = () => {
    playback?.stop();
    playback = undefined;
  };

  const bindWorker = () => {
    if (worker) return worker;
    worker = options.workerFactory();
    worker.onmessage = (event) => {
      const message = event.data;
      if (!activeJobId || message.jobId !== activeJobId) return;
      if (message.type === 'progress') {
        publish({ phase: 'download', progress: message.progress });
        return;
      }
      if (message.type === 'error') {
        activeJobId = undefined;
        publish({ phase: 'error', progress: current.progress, message: message.message });
        return;
      }
      activeJobId = undefined;
      stopPlayback();
      playback = (options.play ?? browserPlay)(message.buffer);
      publish({ phase: 'speaking', progress: 1 });
    };
    return worker;
  };

  const cancelActive = () => {
    if (!activeJobId) return;
    worker?.postMessage({ type: 'cancel', jobId: activeJobId });
    activeJobId = undefined;
    stopPlayback();
  };

  return {
    isEnabled() {
      return enabled;
    },
    status() {
      return current;
    },
    setEnabled(next: boolean) {
      enabled = next;
      options.preference.save(next);
      if (!next) {
        cancelActive();
        publish({ phase: 'off', progress: 0 });
        return;
      }
      publish({ phase: current.phase === 'error' ? 'ready' : current.phase === 'off' ? 'ready' : current.phase, progress: current.progress });
    },
    speak(text: string) {
      const spoken = text.replace(/\s+/g, ' ').trim();
      if (!enabled || !spoken) return;
      cancelActive();
      const jobId = `voice-${++sequence}`;
      activeJobId = jobId;
      publish({ phase: 'download', progress: current.phase === 'ready' || current.phase === 'speaking' ? 1 : 0 });
      const voice = fieldVoiceFor(options.locale);
      bindWorker().postMessage({ type: 'speak', jobId, locale: options.locale, voiceId: voice.id, text: spoken });
    },
    stop() {
      cancelActive();
      if (enabled) publish({ phase: 'ready', progress: 1 });
    },
    destroy() {
      cancelActive();
      worker?.terminate();
      worker = undefined;
    },
  };
}

export type VoiceNarrator = ReturnType<typeof createVoiceNarrator>;
