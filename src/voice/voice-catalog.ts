import type { Locale } from '../i18n/locale';
import { localeTag } from '../i18n/locale';

export interface FieldVoice {
  lang: string;
  prefer: string[];
}

export const FIELD_VOICE: Record<Locale, FieldVoice> = {
  uk: { lang: 'uk-UA', prefer: ['lesya', 'ukrainian', 'ukrain'] },
  en: { lang: 'en-US', prefer: ['samantha', 'allison', 'serena', 'female'] },
  ru: { lang: 'ru-RU', prefer: ['milena', 'katya', 'irina', 'russian'] },
};

export function fieldVoiceFor(locale: Locale): FieldVoice {
  return FIELD_VOICE[locale];
}

export function pickFieldVoice(locale: Locale, voices: ReadonlyArray<{ lang: string; name: string }>) {
  const wanted = localeTag(locale).toLowerCase();
  const family = locale.toLowerCase();
  const prefer = fieldVoiceFor(locale).prefer;
  const matching = voices.filter((voice) => {
    const lang = voice.lang.toLowerCase().replace('_', '-');
    return lang === wanted || lang.startsWith(`${family}-`) || lang === family;
  });
  const pool = matching.length ? matching : voices;
  return pool.find((voice) => prefer.some((hint) => voice.name.toLowerCase().includes(hint))) ?? matching[0];
}
