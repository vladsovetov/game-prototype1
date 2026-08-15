export const SUPPORTED_LOCALES = ['en', 'uk', 'ru'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export const LOCALE_STORAGE_KEY = 'unwritten.prototype.locale.v1';

let activeLocale: Locale = 'uk';

function supported(value: string | null | undefined): Locale | undefined {
  if (!value) return;
  const primary = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.find((locale) => locale === primary);
}

export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const locale = supported(language);
    if (locale) return locale;
  }
  return 'en';
}

export function createLocalePreference(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  browserLanguages: readonly string[],
) {
  return {
    load(): Locale {
      return supported(storage.getItem(LOCALE_STORAGE_KEY)) ?? detectLocale(browserLanguages);
    },
    save(locale: Locale) {
      storage.setItem(LOCALE_STORAGE_KEY, locale);
    },
  };
}

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function getActiveLocale() {
  return activeLocale;
}

export function localeTag(locale = activeLocale) {
  return locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
}

export function localizedCopy<T>(copy: Record<Locale, T>, locale = activeLocale): T {
  return copy[locale] ?? copy.en;
}
