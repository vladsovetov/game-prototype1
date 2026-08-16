/// <reference lib="webworker" />

import { env, pipeline } from '@huggingface/transformers';
import type { StoryWorkerMessage, StoryWorkerRequest } from './local-story-protocol';
import { expeditionPrompt, openingPrompt, radioPrompt, relicPrompt } from './local-story-prompts';
import { configureOnDeviceRuntime, fallbackStoryDevice, preferredStoryDevice, storyRuntimeError, type StoryDevice } from './local-story-runtime';

const MODEL = 'onnx-community/SmolLM2-135M-Instruct-ONNX';
type Generator = Awaited<ReturnType<typeof pipeline<'text-generation'>>>;
let generatorPromise: Promise<Generator> | undefined;
let loadedDevice: StoryDevice | undefined;
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

async function load(jobId: string, force?: StoryDevice) {
  if (generatorPromise && !force) return generatorPromise;
  generatorPromise = (async () => {
    const preferred = force ?? await preferredStoryDevice(self.navigator.gpu, self.navigator.userAgent);
    loadedDevice = preferred;
    try {
      return await createGenerator(jobId, preferred);
    } catch (error) {
      const fallback = fallbackStoryDevice(preferred);
      if (!fallback) throw error;
      loadedDevice = fallback;
      send({ type: 'progress', jobId, stage: 'read', progress: 0 });
      return createGenerator(jobId, fallback);
    }
  })().catch((error) => {
    generatorPromise = undefined;
    loadedDevice = undefined;
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
    const kind=event.data.type;
    const prompt = kind==='generate-expedition'
      ? expeditionPrompt(event.data.locale,{character,seed,contractName:event.data.contractName,siteIds:event.data.siteIds,recentMemories:event.data.recentMemories,recentFingerprints:event.data.recentFingerprints,seasonBeat:event.data.seasonBeat,throughline:event.data.throughline,priorBeats:event.data.priorBeats})
      : kind==='generate-radio'
        ? radioPrompt(event.data.locale,{character,voice:event.data.voice,beat:event.data.beat,lastDecision:event.data.lastDecision,remembered:event.data.remembered})
        : kind==='generate-relic'
          ? relicPrompt(event.data.locale,{character,eventTitle:event.data.eventTitle,allowedForms:event.data.allowedForms,allowedColors:event.data.allowedColors})
          : openingPrompt(event.data.locale,character,seed);
    const completeType=kind==='generate-expedition'?'complete-expedition':kind==='generate-radio'?'complete-radio':kind==='generate-relic'?'complete-relic':'complete';
    const maxTokens=kind==='generate-expedition'?420:kind==='generate-radio'?90:kind==='generate-relic'?180:360;
    const temperature=kind==='generate'?0.72:0.88;
    send({ type: 'progress', jobId, stage: 'weave', progress: .1 });
    let output: Awaited<ReturnType<Generator>>;
    try {
      output = await localGenerator(prompt, { max_new_tokens: maxTokens, do_sample: true, temperature, top_p: .92, repetition_penalty:1.12, return_full_text: false });
    } catch (error) {
      const fallback = fallbackStoryDevice(loadedDevice ?? 'webgpu');
      if (!fallback || latestJobId !== jobId) throw error;
      generatorPromise = undefined;
      const retry = await load(jobId, fallback);
      if (latestJobId !== jobId) return;
      output = await retry(prompt, { max_new_tokens: maxTokens, do_sample: true, temperature, top_p: .92, repetition_penalty:1.12, return_full_text: false });
    }
    if (latestJobId !== jobId) return;
    send({ type: 'progress', jobId, stage: 'weave', progress: 1 });
    send({ type: completeType, jobId, raw: generatedText(output) });
  } catch (error) {
    if (latestJobId !== jobId) return;
    send({ type: 'error', jobId, message: storyRuntimeError(event.data.locale) });
  }
};
