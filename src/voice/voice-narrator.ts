import type { Locale } from '../i18n/locale';
import { localeTag } from '../i18n/locale';
import { pickFieldVoice } from './voice-catalog';

export type VoicePhase = 'off' | 'ready' | 'speaking' | 'error';
export interface VoiceStatus { phase: VoicePhase; progress: number; message?: string }

interface NarratorOptions {
  preference: { load(): boolean; save(enabled: boolean): void };
  locale: Locale;
  speakUtterance?(text: string, locale: Locale): { stop(): void };
  onStatus?(status: VoiceStatus): void;
}

function browserSpeak(text: string, locale: Locale) {
  const speech = globalThis.speechSynthesis;
  if (!speech) throw new Error('missing-speech');
  if (speech.paused) speech.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = localeTag(locale);
  utterance.rate = 0.92;
  const chosen = pickFieldVoice(locale, speech.getVoices());
  if (chosen) utterance.voice = chosen as SpeechSynthesisVoice;
  speech.cancel();
  speech.speak(utterance);
  const stop = () => {
    utterance.onend = null;
    utterance.onerror = null;
    speech.cancel();
  };
  return { stop, utterance };
}

export function createVoiceNarrator(options: NarratorOptions) {
  const speech = globalThis.speechSynthesis;
  speech?.getVoices();
  speech?.addEventListener?.('voiceschanged', () => speech.getVoices(), { once: true });
  let enabled = options.preference.load();
  let playback: { stop(): void } | undefined;
  let current: VoiceStatus = { phase: enabled ? 'ready' : 'off', progress: enabled ? 1 : 0 };

  const publish = (status: VoiceStatus) => {
    current = status;
    options.onStatus?.(status);
  };

  const stopPlayback = () => {
    playback?.stop();
    playback = undefined;
  };

  return {
    isEnabled() {
      return enabled;
    },
    status() {
      return current;
    },
    setEnabled(next: boolean) {
      enabled = next;
      options.preference.save(next);
      if (!next) {
        stopPlayback();
        publish({ phase: 'off', progress: 0 });
        return;
      }
      publish({ phase: 'ready', progress: 1 });
    },
    speak(text: string) {
      const spoken = text.replace(/\s+/g, ' ').trim();
      if (!enabled || !spoken) return;
      stopPlayback();
      try {
        const spokenUtterance = (options.speakUtterance ?? ((value, locale) => {
          const session = browserSpeak(value, locale);
          session.utterance.onend = () => {
            if (playback) publish({ phase: 'ready', progress: 1 });
          };
          session.utterance.onerror = () => publish({ phase: 'error', progress: 1 });
          return session;
        }))(spoken, options.locale);
        playback = spokenUtterance;
        publish({ phase: 'speaking', progress: 1 });
      } catch {
        publish({ phase: 'error', progress: 1 });
      }
    },
    stop() {
      stopPlayback();
      if (enabled) publish({ phase: 'ready', progress: 1 });
    },
    destroy() {
      stopPlayback();
    },
  };
}

export type VoiceNarrator = ReturnType<typeof createVoiceNarrator>;
