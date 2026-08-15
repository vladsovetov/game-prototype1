import { afterEach, describe, expect, it } from 'vitest';
import { createLocalePreference, detectLocale, getActiveLocale, localizedCopy, setActiveLocale } from './locale';
import { t } from './messages';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem'> {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('locale selection', () => {
  afterEach(() => setActiveLocale('uk'));

  it('uses the first supported browser language and normalizes regional tags', () => {
    expect(detectLocale(['pl-PL', 'ru-RU', 'uk-UA'])).toBe('ru');
    expect(detectLocale(['uk-UA', 'en-US'])).toBe('uk');
  });

  it('falls back to English when the browser offers no supported language', () => {
    expect(detectLocale(['pl-PL', 'de-DE'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });

  it('prefers and persists an explicit player choice', () => {
    const storage = new MemoryStorage();
    const preference = createLocalePreference(storage, ['ru-RU']);
    expect(preference.load()).toBe('ru');

    preference.save('uk');
    expect(createLocalePreference(storage, ['en-US']).load()).toBe('uk');
  });

  it('exposes the active locale to authored game copy', () => {
    setActiveLocale('en');
    expect(getActiveLocale()).toBe('en');
    setActiveLocale('ru');
    expect(getActiveLocale()).toBe('ru');
  });

  it('selects English from a regional browser tag and interpolates chrome copy', () => {
    expect(detectLocale(['en-GB', 'fr-FR'])).toBe('en');
    setActiveLocale('en');
    expect(t('wakeNow')).toBe('Wake up without waiting');
    expect(t('wakePurposeRoad', { name: 'Pip' })).toContain('Pip');
    expect(localizedCopy({ en: 'a', uk: 'b', ru: 'c' }, 'ru')).toBe('c');
  });
});
