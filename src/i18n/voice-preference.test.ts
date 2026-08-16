import { describe, expect, it } from 'vitest';
import { createVoicePreference, VOICE_STORAGE_KEY } from './voice-preference';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('voice preference', () => {
  it('stays off until the player turns it on', () => {
    const storage = new MemoryStorage();
    const preference = createVoicePreference(storage);
    expect(preference.load()).toBe(false);

    preference.save(true);
    expect(storage.getItem(VOICE_STORAGE_KEY)).toBe('on');
    expect(createVoicePreference(storage).load()).toBe(true);

    preference.save(false);
    expect(createVoicePreference(storage).load()).toBe(false);
  });
});
