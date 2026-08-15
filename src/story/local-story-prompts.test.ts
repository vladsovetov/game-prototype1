import { describe, expect, it } from 'vitest';
import { openingPrompt, expeditionPrompt } from './local-story-prompts';

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
  });
});
