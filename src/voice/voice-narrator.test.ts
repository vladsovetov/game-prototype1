import { describe, expect, it } from 'vitest';
import { createVoiceNarrator, type VoiceStatus } from './voice-narrator';

class MemoryPreference {
  enabled = false;
  load() { return this.enabled; }
  save(enabled: boolean) { this.enabled = enabled; }
}

describe('voice narrator', () => {
  it('does not speak while the preference is off', () => {
    const spoken: string[] = [];
    const narrator = createVoiceNarrator({
      preference: new MemoryPreference(),
      locale: 'uk',
      speakUtterance: (text) => { spoken.push(text); return { stop() {} }; },
    });

    narrator.speak('Це Morrow.');
    expect(spoken).toEqual([]);
    expect(narrator.status().phase).toBe('off');
  });

  it('speaks the current locale text only after the player turns the voice on', () => {
    const spoken: string[] = [];
    const statuses: VoiceStatus[] = [];
    const preference = new MemoryPreference();
    const narrator = createVoiceNarrator({
      preference,
      locale: 'uk',
      speakUtterance: (text) => { spoken.push(text); return { stop() {} }; },
      onStatus: (status) => statuses.push(status),
    });

    narrator.setEnabled(true);
    narrator.speak('  Притулок щойно клацнув.  ');
    expect(spoken).toEqual(['Притулок щойно клацнув.']);
    expect(statuses.map((item) => item.phase)).toContain('speaking');
  });

  it('does not cancel the first utterance, so the browser keeps the click that started it', () => {
    const calls: string[] = [];
    const previousUtterance = globalThis.SpeechSynthesisUtterance;
    const previousSpeech = globalThis.speechSynthesis;
    class FakeUtterance {
      text: string;
      lang = '';
      rate = 1;
      volume = 1;
      voice: { lang: string; name: string } | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    globalThis.SpeechSynthesisUtterance = FakeUtterance as unknown as typeof SpeechSynthesisUtterance;
    globalThis.speechSynthesis = {
      paused: false,
      getVoices: () => [{ lang: 'uk-UA', name: 'Lesya' }],
      cancel: () => { calls.push('cancel'); },
      speak: () => { calls.push('speak'); },
      resume: () => {},
      addEventListener: () => {},
    } as unknown as SpeechSynthesis;

    const preference = new MemoryPreference();
    const narrator = createVoiceNarrator({ preference, locale: 'uk' });
    narrator.setEnabled(true);
    narrator.speak('Привіт з галявини.');
    expect(calls).toEqual(['speak']);
    narrator.destroy();
    globalThis.SpeechSynthesisUtterance = previousUtterance;
    globalThis.speechSynthesis = previousSpeech;
  });
});
