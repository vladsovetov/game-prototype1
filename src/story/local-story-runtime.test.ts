import { describe, expect, it } from 'vitest';
import { configureOnDeviceRuntime, fallbackStoryDevice, preferredStoryDevice, storyRuntimeError } from './local-story-runtime';

describe('on-device story runtime', () => {
  it('uses WASM unless a real WebGPU adapter answers', async () => {
    expect(await preferredStoryDevice()).toBe('wasm');
    expect(await preferredStoryDevice({ requestAdapter: async () => undefined })).toBe('wasm');
    expect(await preferredStoryDevice({ requestAdapter: async () => ({}) })).toBe('webgpu');
    expect(await preferredStoryDevice({ requestAdapter: async () => { throw new Error('blocked'); } })).toBe('wasm');
  });

  it('retries WASM after a WebGPU failure and does not loop after WASM fails', () => {
    expect(fallbackStoryDevice('webgpu')).toBe('wasm');
    expect(fallbackStoryDevice('wasm')).toBeUndefined();
  });

  it('forces a single-thread WASM path so phones without SharedArrayBuffer can load', () => {
    const wasm = { proxy: true, numThreads: 4 };
    configureOnDeviceRuntime(wasm);
    expect(wasm).toEqual({ proxy: false, numThreads: 1 });
  });

  it('does not blame WebGPU when the CPU path is the one that failed', () => {
    expect(storyRuntimeError('en')).toMatch(/CPU path/i);
    expect(storyRuntimeError('uk')).toMatch(/CPU/);
    expect(storyRuntimeError('ru')).toMatch(/CPU/);
  });
});
