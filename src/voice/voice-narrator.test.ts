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
});
