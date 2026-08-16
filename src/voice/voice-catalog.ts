import type { VoiceId } from '@diffusionstudio/vits-web';
import type { Locale } from '../i18n/locale';

export interface FieldVoice {
  id: VoiceId;
  sizeMb: number;
}

export const FIELD_VOICE: Record<Locale, FieldVoice> = {
  uk: { id: 'uk_UA-ukrainian_tts-medium', sizeMb: 80 },
  en: { id: 'en_US-lessac-high', sizeMb: 110 },
  ru: { id: 'ru_RU-irina-medium', sizeMb: 64 },
};

export function fieldVoiceFor(locale: Locale): FieldVoice {
  return FIELD_VOICE[locale];
}
