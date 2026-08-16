/// <reference lib="webworker" />

import { predict } from '@diffusionstudio/vits-web';
import type { VoiceWorkerMessage, VoiceWorkerRequest } from './voice-protocol';
import { voiceRuntimeError } from './voice-protocol';

let latestJobId: string | undefined;

function send(message: VoiceWorkerMessage, transfer: Transferable[] = []) {
  self.postMessage(message, transfer);
}

self.onmessage = async (event: MessageEvent<VoiceWorkerRequest>) => {
  if (event.data.type === 'cancel') {
    if (latestJobId === event.data.jobId) latestJobId = undefined;
    return;
  }
  const { jobId, locale, voiceId, text } = event.data;
  latestJobId = jobId;
  try {
    const blob = await predict({ text, voiceId }, (progress) => {
      if (latestJobId !== jobId) return;
      const total = progress.total || 1;
      send({ type: 'progress', jobId, progress: Math.max(0, Math.min(1, progress.loaded / total)) });
    });
    if (latestJobId !== jobId) return;
    const buffer = await blob.arrayBuffer();
    if (latestJobId !== jobId) return;
    send({ type: 'audio', jobId, buffer }, [buffer]);
  } catch {
    if (latestJobId !== jobId) return;
    send({ type: 'error', jobId, message: voiceRuntimeError(locale) });
  }
};
