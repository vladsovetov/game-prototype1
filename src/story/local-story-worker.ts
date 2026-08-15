/// <reference lib="webworker" />

import { pipeline } from '@huggingface/transformers';
import type { StoryWorkerMessage, StoryWorkerRequest } from './local-story-protocol';

const MODEL = 'onnx-community/SmolLM2-135M-Instruct-ONNX';
type Generator = Awaited<ReturnType<typeof pipeline<'text-generation'>>>;
let generator: Generator | undefined;

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
  if (generator) return generator;
  const options: Parameters<typeof pipeline<'text-generation'>>[2] = {
    dtype: 'q4',
    progress_callback: (event: unknown) => send({ type: 'progress', jobId, stage: 'download', progress: progressValue(event) }),
  };
  if ('gpu' in navigator) options.device = 'webgpu';
  generator = await pipeline('text-generation', MODEL, options);
  return generator;
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
  if (event.data.type !== 'generate') return;
  const { jobId, character, seed } = event.data;
  try {
    const localGenerator = await load(jobId);
    send({ type: 'progress', jobId, stage: 'read', progress: 1 });
    const prompt = [
      { role: 'system', content: 'You write compact, gentle fantasy story ingredients. Return JSON only. Never add powers, rules, HTML, markdown, or extra keys.' },
      { role: 'user', content: `Create one coherent lost-memory tale for ${character.name}. Description: ${character.description}. Gift: ${character.gift}. Burden: ${character.burden}. Quirk: ${character.quirk}. Random run seed: ${seed}. Return exactly these short string fields: place, role, disaster, vow, motif, truth. Keep place/role/motif under 8 words and the other fields under 18 words.` },
    ];
    send({ type: 'progress', jobId, stage: 'weave', progress: .1 });
    const output = await localGenerator(prompt, { max_new_tokens: 180, do_sample: true, temperature: .8, top_p: .9 });
    send({ type: 'progress', jobId, stage: 'weave', progress: 1 });
    send({ type: 'complete', jobId, raw: generatedText(output) });
  } catch (error) {
    send({ type: 'error', jobId, message: error instanceof Error ? error.message : 'The local writer could not finish.' });
  }
};
