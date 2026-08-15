/// <reference lib="webworker" />

import { pipeline } from '@huggingface/transformers';
import type { StoryWorkerMessage, StoryWorkerRequest } from './local-story-protocol';

const MODEL = 'onnx-community/SmolLM2-135M-Instruct-ONNX';
type Generator = Awaited<ReturnType<typeof pipeline<'text-generation'>>>;
let generatorPromise: Promise<Generator> | undefined;
let latestJobId: string | undefined;

function send(message: StoryWorkerMessage) {
  self.postMessage(message);
}

function progressValue(event: unknown) {
  if (!event || typeof event !== 'object') return 0;
  const value = event as { progress?: number; loaded?: number; total?: number };
  if (typeof value.progress === 'number') return value.progress > 1 ? value.progress / 100 : value.progress;
  if (value.loaded && value.total) return value.loaded / value.total;
  return 0;
}

async function load(jobId: string) {
  if (generatorPromise) return generatorPromise;
  const options: Parameters<typeof pipeline<'text-generation'>>[2] = {
    dtype: 'q4',
    progress_callback: (event: unknown) => send({ type: 'progress', jobId, stage: 'download', progress: progressValue(event) }),
  };
  if ('gpu' in navigator) options.device = 'webgpu';
  generatorPromise = pipeline('text-generation', MODEL, options).catch((error) => {
    generatorPromise = undefined;
    throw error;
  });
  return generatorPromise;
}

function generatedText(output: Awaited<ReturnType<Generator>>) {
  const first = output[0];
  if (!first || !('generated_text' in first)) return '';
  const value = first.generated_text;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const last = value.at(-1) as { content?: unknown } | undefined;
    return typeof last?.content === 'string' ? last.content : '';
  }
  return '';
}

self.onmessage = async (event: MessageEvent<StoryWorkerRequest>) => {
  if (event.data.type === 'cancel') {
    if (latestJobId === event.data.jobId) latestJobId = undefined;
    return;
  }
  const { jobId, character, seed } = event.data;
  latestJobId = jobId;
  try {
    const localGenerator = await load(jobId);
    if (latestJobId !== jobId) return;
    send({ type: 'progress', jobId, stage: 'read', progress: 1 });
    const prompt = [
      { role: 'system', content: 'You are a compact fantasy story director. Reply with only six evocative English words separated by commas. No sentences, JSON, markdown, or explanations.' },
      { role: 'user', content: `Direct a gentle lost-memory tale for ${character.name}. Companion: ${character.description}. Gift: ${character.gift}. Burden: ${character.burden}. Quirk: ${character.quirk}. Random seed: ${seed}. Choose six motifs for place, role, disaster, vow, image, and truth.` },
    ];
    send({ type: 'progress', jobId, stage: 'weave', progress: .1 });
    const output = await localGenerator(prompt, { max_new_tokens: 48, do_sample: true, temperature: .8, top_p: .9 });
    if (latestJobId !== jobId) return;
    send({ type: 'progress', jobId, stage: 'weave', progress: 1 });
    send({ type: 'complete', jobId, raw: generatedText(output) });
  } catch (error) {
    if (latestJobId !== jobId) return;
    send({ type: 'error', jobId, message: 'Локальний оповідач не зміг завершити роботу. Перевірте підтримку WebGPU або спробуйте ще раз.' });
  }
};
