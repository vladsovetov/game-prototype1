import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { startExpedition } from './expedition';
import { canSpeakRadio, nextRadioRemark, radioBudget, RADIO_WALK_GAP, speakRadio } from './radio';
import { createInitialState } from './simulation';

function onRoute() {
  const state = createInitialState(generateCharacter(12), 9001);
  state.tutorial = { step: 'done', targetAnomalyId: 'sign', borrowedGift: 'mend', start: state.player };
  return startExpedition(state, 'water-route', ['mend', 'reveal'], 7).state;
}

describe('radio companion', () => {
  it('keeps two to four remarks in an expedition and never invents a fifth', () => {
    expect(radioBudget(7)).toBe(2 + (7 % 3));
    let state = onRoute();
    const budget = radioBudget(state.expedition!.seed);
    for (let index = 0; index < budget + 2; index++) {
      const remark = nextRadioRemark(state, 100 + index);
      if (!remark || !canSpeakRadio(state, RADIO_WALK_GAP * (index + 1), index === 0 ? -999 : RADIO_WALK_GAP * index)) break;
      state = speakRadio(state, remark);
    }
    expect(state.radio!.spoken.filter((remark) => remark.expeditionId === state.expedition!.id)).toHaveLength(budget);
  });

  it('can be mistaken and still leaves tools, routes, and rules untouched', () => {
    const state = onRoute();
    const remark = nextRadioRemark(state, 1)!;
    const spoken = speakRadio(state, remark);
    expect(spoken.expedition?.siteIds).toEqual(state.expedition?.siteIds);
    expect(spoken.expedition?.loadout).toEqual(state.expedition?.loadout);
    expect(spoken.character.gift.id).toBe(state.character.gift.id);
    expect(['symbol-flipped', 'cable-hum', 'wrong-east', 'notes-disagree', 'refuge-voice', 'clock-rain', 'farther-cost', 'turned-back', 'mistaken-name', 'lasting-quiet']).toContain(remark.lineId);
  });
});
