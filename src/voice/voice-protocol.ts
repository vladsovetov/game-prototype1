import type { VoiceId } from '@diffusionstudio/vits-web';
import type { Locale } from '../i18n/locale';

export type VoiceWorkerRequest =
  | { type: 'speak'; jobId: string; locale: Locale; voiceId: VoiceId; text: string }
  | { type: 'cancel'; jobId: string };

export type VoiceWorkerMessage =
  | { type: 'progress'; jobId: string; progress: number }
  | { type: 'audio'; jobId: string; buffer: ArrayBuffer }
  | { type: 'error'; jobId: string; message: string };

export function voiceRuntimeError(locale: Locale) {
  if (locale === 'en') return 'The field voice could not start on this device. The text is still here.';
  if (locale === 'ru') return 'Полевой голос не смог запуститься на этом устройстве. Текст по-прежнему здесь.';
  return 'Голос поля не зміг запуститися на цьому пристрої. Текст лишається на екрані.';
}
