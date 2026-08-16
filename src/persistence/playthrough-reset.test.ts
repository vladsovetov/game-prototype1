import { describe, expect, it } from 'vitest';
import { LOCALE_STORAGE_KEY } from '../i18n/locale';
import { VOICE_STORAGE_KEY } from '../i18n/voice-preference';
import { DIAGNOSTIC_STORAGE_KEY, resetPlaythrough, SAVE_STORAGE_KEY, WRITER_PREFERENCE_KEY } from './playthrough-reset';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

describe('playthrough reset', () => {
  it('clears the save and caches but keeps the chosen language', async () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCALE_STORAGE_KEY, 'ru');
    storage.setItem(SAVE_STORAGE_KEY, '{"version":1}');
    storage.setItem(DIAGNOSTIC_STORAGE_KEY, 'broken');
    storage.setItem(WRITER_PREFERENCE_KEY, 'enabled');
    storage.setItem(VOICE_STORAGE_KEY, 'on');

    await resetPlaythrough(storage);

    expect(storage.getItem(LOCALE_STORAGE_KEY)).toBe('ru');
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(DIAGNOSTIC_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(WRITER_PREFERENCE_KEY)).toBeNull();
    expect(storage.getItem(VOICE_STORAGE_KEY)).toBeNull();
  });
});
