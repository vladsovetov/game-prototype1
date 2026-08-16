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

function ignoredSpeechError(error: unknown) {
  const reason = error && typeof error === 'object' && 'error' in error ? String(error.error) : '';
  return reason === 'canceled' || reason === 'interrupted' || reason === 'not-allowed';
}

function browserSpeak(text: string, locale: Locale) {
  const speech = globalThis.speechSynthesis;
  if (!speech) throw new Error('missing-speech');
  if (speech.paused) speech.resume();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = localeTag(locale);
  utterance.rate = 0.92;
  utterance.volume = 1;
  const chosen = pickFieldVoice(locale, speech.getVoices());
  if (chosen) {
    utterance.voice = chosen as SpeechSynthesisVoice;
    if (chosen.lang) utterance.lang = chosen.lang;
  }
  speech.speak(utterance);
  const stop = () => {
    utterance.onend = null;
    utterance.onerror = null;
    utterance.onstart = null;
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
  let lastText = '';
  let awaitingStart = false;
  let current: VoiceStatus = { phase: enabled ? 'ready' : 'off', progress: enabled ? 1 : 0 };

  const publish = (status: VoiceStatus) => {
    current = status;
    options.onStatus?.(status);
  };

  const stopPlayback = () => {
    playback?.stop();
    playback = undefined;
  };

  const beginSpeak = (spoken: string, defer: boolean) => {
    const run = () => {
      if (!enabled) return;
      try {
        awaitingStart = true;
        const spokenUtterance = (options.speakUtterance ?? ((value, locale) => {
          const session = browserSpeak(value, locale);
          session.utterance.onstart = () => { awaitingStart = false; };
          session.utterance.onend = () => {
            awaitingStart = false;
            if (playback) publish({ phase: 'ready', progress: 1 });
          };
          session.utterance.onerror = (event) => {
            if (ignoredSpeechError(event)) return;
            awaitingStart = false;
            publish({ phase: 'error', progress: 1 });
          };
          return session;
        }))(spoken, options.locale);
        playback = spokenUtterance;
        publish({ phase: 'speaking', progress: 1 });
      } catch {
        awaitingStart = false;
        publish({ phase: 'error', progress: 1 });
      }
    };
    if (defer) setTimeout(run, 60);
    else run();
  };

  const unlock = () => {
    if (!enabled || !lastText || !awaitingStart) return;
    stopPlayback();
    beginSpeak(lastText, false);
  };
  if (typeof document !== 'undefined') document.addEventListener('pointerdown', unlock, true);

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
        lastText = '';
        awaitingStart = false;
        stopPlayback();
        publish({ phase: 'off', progress: 0 });
        return;
      }
      publish({ phase: 'ready', progress: 1 });
    },
    speak(text: string) {
      const spoken = text.replace(/\s+/g, ' ').trim();
      if (!enabled || !spoken) return;
      lastText = spoken;
      const interrupting = !!playback;
      stopPlayback();
      beginSpeak(spoken, interrupting);
    },
    stop() {
      lastText = '';
      awaitingStart = false;
      stopPlayback();
      if (enabled) publish({ phase: 'ready', progress: 1 });
    },
    destroy() {
      if (typeof document !== 'undefined') document.removeEventListener('pointerdown', unlock, true);
      lastText = '';
      awaitingStart = false;
      stopPlayback();
    },
  };
}

export type VoiceNarrator = ReturnType<typeof createVoiceNarrator>;
