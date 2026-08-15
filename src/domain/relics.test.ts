import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { WEARABLES } from './equipment';
import { applyWorkAction, chooseOptionalLead, completeExpedition, expeditionTarget, startExpedition } from './expedition';
import { RELIC_COLORS, RELIC_FORM_WEARABLE, awardExpeditionRelic, fallbackRelic } from './relics';
import { createInitialState } from './simulation';
import type { GameState, GiftId } from './types';

function open() {
  const state = createInitialState(generateCharacter(12), 9001);
  state.tutorial = { step: 'done', targetAnomalyId: 'sign', borrowedGift: 'mend', start: state.player };
  return state;
}

function finishRequired(state: GameState, tool: GiftId = 'mend') {
  let next = state;
  for (let step = 0; step < 3; step++) {
    next = applyWorkAction({ ...next, player: expeditionTarget(next)! }, tool).state;
  }
  return next;
}

describe('story-worn relics', () => {
  it('maps every generated form onto a trusted wearable and a verified color', () => {
    const started = startExpedition(open(), 'water-route', ['mend', 'reveal'], 7).state;
    const relic = fallbackRelic(started, started.expedition!);
    expect(RELIC_FORM_WEARABLE[relic.form]).toBe(relic.wearableId);
    expect(WEARABLES[relic.wearableId].id).toBe(relic.wearableId);
    expect(RELIC_COLORS).toContain(relic.color);
    expect(relic.story).toContain(started.expedition!.narrative.title);
  });

  it('unlocks the trusted shape without changing gift strength', () => {
    let state = finishRequired(startExpedition(open(), 'water-route', ['mend', 'reveal'], 7).state);
    const run = state.expedition!;
    state = chooseOptionalLead(state, false).state;
    const finished = completeExpedition({ ...state, player: expeditionTarget(state)! });
    const relic = finished.state.relics?.[0];
    expect(relic).toBeTruthy();
    expect(finished.state.wardrobe).toContain(relic!.wearableId);
    expect(finished.state.character.gift.id).toBe(state.character.gift.id);
    expect(awardExpeditionRelic(finished.state, { id: relic!.eventId, seed: 7, narrative: run.narrative }).relics).toHaveLength(1);
  });
});
