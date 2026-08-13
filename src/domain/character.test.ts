import { describe, expect, it } from 'vitest';
import { generateCharacter, validateCharacterCard } from './character';

const morrow = JSON.stringify({version:1,name:'Morrow',description:'A porcelain fox that remembers vanished roads.',appearance:{body:'fox',material:'porcelain',palette:'dusk',mark:'map-lines'},gift:'reveal',burden:'fragile',quirk:'moon-touched',power:999,stats:{speed:999}});

describe('character import', () => {
  it('normalizes a valid card through trusted catalogs', () => {
    const result = validateCharacterCard(morrow);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.character.gift.id).toBe('reveal');
      expect(result.character).not.toHaveProperty('power');
      expect(result.character).not.toHaveProperty('stats');
    }
  });
  it('reports all invalid fields together', () => {
    const result = validateCharacterCard(JSON.stringify({version:2,name:'',description:'x',appearance:{body:'dragon'},gift:'destroy'}));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(6);
  });
  it('sanitizes markup without evaluating or merging unknown keys', () => {
    const card = JSON.parse(morrow); card.name='<b>Morrow</b>'; card.description='<img src=x> road'; card.__proto__={polluted:true};
    const result = validateCharacterCard(JSON.stringify(card));
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.character.name).not.toContain('<'); expect(({} as Record<string,unknown>).polluted).toBeUndefined(); }
  });
  it('generates deterministic catalog-valid characters', () => {
    expect(generateCharacter(42)).toEqual(generateCharacter(42));
    expect(generateCharacter(42)).not.toEqual(generateCharacter(43));
  });
});
