export const VOICE_STORAGE_KEY = 'unwritten.prototype.voice.v1';

export function createVoicePreference(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  return {
    load(): boolean {
      return storage.getItem(VOICE_STORAGE_KEY) === 'on';
    },
    save(enabled: boolean) {
      storage.setItem(VOICE_STORAGE_KEY, enabled ? 'on' : 'off');
    },
  };
}
