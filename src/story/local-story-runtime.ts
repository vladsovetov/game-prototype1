export type StoryDevice = 'webgpu' | 'wasm';

export interface GpuLike {
  requestAdapter(): Promise<unknown>;
}

export interface OnnxWasmEnv {
  proxy?: boolean;
  numThreads?: number;
}

export function configureOnDeviceRuntime(wasm?: OnnxWasmEnv) {
  if (!wasm) return;
  wasm.proxy = false;
  wasm.numThreads = 1;
}

export async function preferredStoryDevice(gpu?: GpuLike): Promise<StoryDevice> {
  if (!gpu) return 'wasm';
  try {
    return (await gpu.requestAdapter()) ? 'webgpu' : 'wasm';
  } catch {
    return 'wasm';
  }
}

export function fallbackStoryDevice(failed: StoryDevice): StoryDevice | undefined {
  return failed === 'webgpu' ? 'wasm' : undefined;
}

export function storyRuntimeError(locale: 'en' | 'uk' | 'ru') {
  if (locale === 'en') return 'The local storyteller could not finish on this device. It will try the CPU path, or you can try again.';
  if (locale === 'ru') return 'Локальный рассказчик не смог завершить работу на этом устройстве. Он попробует путь CPU, или попробуйте ещё раз.';
  return 'Локальний оповідач не зміг завершити роботу на цьому пристрої. Він спробує шлях CPU, або спробуйте ще раз.';
}
