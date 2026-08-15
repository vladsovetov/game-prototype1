/// <reference lib="webworker" />

import { env, pipeline } from '@huggingface/transformers';
import type { StoryWorkerMessage, StoryWorkerRequest } from './local-story-protocol';
import { expeditionPrompt, openingPrompt } from './local-story-prompts';
import { configureOnDeviceRuntime, fallbackStoryDevice, preferredStoryDevice, storyRuntimeError, type StoryDevice } from './local-story-runtime';

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

async function createGenerator(jobId: string, device: StoryDevice) {
  configureOnDeviceRuntime(env.backends?.onnx?.wasm);
  return pipeline('text-generation', MODEL, {
    dtype: 'q4',
    device,
    progress_callback: (event: unknown) => send({ type: 'progress', jobId, stage: 'download', progress: progressValue(event) }),
  });
}

async function load(jobId: string) {
  if (generatorPromise) return generatorPromise;
  generatorPromise = (async () => {
    const preferred = await preferredStoryDevice(self.navigator.gpu);
    try {
      return await createGenerator(jobId, preferred);
    } catch (error) {
      const fallback = fallbackStoryDevice(preferred);
      if (!fallback) throw error;
      send({ type: 'progress', jobId, stage: 'read', progress: 0 });
      return createGenerator(jobId, fallback);
    }
  })().catch((error) => {
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
    const isExpedition=event.data.type==='generate-expedition';
    const prompt = isExpedition ? expeditionPrompt(event.data.locale,{character,seed,contractName:event.data.contractName,siteIds:event.data.siteIds,recentMemories:event.data.recentMemories,recentFingerprints:event.data.recentFingerprints}) : openingPrompt(event.data.locale,character,seed);
    send({ type: 'progress', jobId, stage: 'weave', progress: .1 });
    const output = await localGenerator(prompt, { max_new_tokens: isExpedition?420:220, do_sample: true, temperature: .88, top_p: .92, repetition_penalty:1.12 });
    if (latestJobId !== jobId) return;
    send({ type: 'progress', jobId, stage: 'weave', progress: 1 });
    send({ type: isExpedition?'complete-expedition':'complete', jobId, raw: generatedText(output) });
  } catch (error) {
    if (latestJobId !== jobId) return;
    send({ type: 'error', jobId, message: storyRuntimeError(event.data.locale) });
  }
};
