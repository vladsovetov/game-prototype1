import { describe, expect, it } from 'vitest';
import { openingPrompt, expeditionPrompt, radioPrompt, relicPrompt } from './local-story-prompts';

const character = { name: 'Luma', description: 'A paper fox.', gift: 'Flashlight', burden: 'Careful hands', quirk: 'Curious' };

describe('local story prompts', () => {
  it('requests an English opening story without Ukrainian instructions', () => {
    const prompt = openingPrompt('en', character, 12).map((item) => item.content).join(' ');
    expect(prompt).toContain('Write only in English');
    expect(prompt).toContain('"place"');
    expect(prompt).not.toContain('Пиши лише українською');
  });

  it('uses localized stable expedition enums', () => {
    const base = { character, seed: 12, contractName: 'Repair the water route', siteIds: ['pool'], recentMemories: [], recentFingerprints: [] };
    expect(expeditionPrompt('en', base).map((item) => item.content).join(' ')).toContain('disappearance | breakdown | false-signal');
    expect(expeditionPrompt('ru', base).map((item) => item.content).join(' ')).toContain('пропажа | поломка | ложный-сигнал');
    expect(expeditionPrompt('en', { ...base, seasonBeat: 'first-evidence', throughline: 'a hidden cable', priorBeats: ['A strange signal'] }).map((item) => item.content).join(' ')).toContain('Hidden season beat');
  });

  it('asks the radio and relic jobs for flavor only', () => {
    expect(radioPrompt('uk', { character, voice: 'curious', beat: 'strange-signal', lastDecision: 'returned', remembered: [] }).map((item) => item.content).join(' ')).toContain('Не змінюй правила');
    expect(relicPrompt('en', { character, eventTitle: 'Water at night', allowedForms: 'hood|lantern', allowedColors: '#c47a3a' }).map((item) => item.content).join(' ')).toContain('no stats');
  });
});
