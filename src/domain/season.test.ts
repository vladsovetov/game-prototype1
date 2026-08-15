import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { applyWorkAction, chooseOptionalLead, completeExpedition, expeditionTarget, startExpedition } from './expedition';
import { createSeason, seasonBeatPlan, seasonHook, seasonLength, seasonProgress, seasonSourceRevealed } from './season';
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
    const target = expeditionTarget(next);
    next = applyWorkAction({ ...next, player: target! }, tool).state;
  }
  return next;
}

describe('season arc', () => {
  it('keeps every new tale between five and eight expeditions', () => {
    const lengths = [1, 2, 3, 4, 5, 8, 21, 99].map((seed) => seasonLength(seed));
    expect(new Set(lengths)).toEqual(new Set([5, 6, 7, 8]));
    expect(seasonBeatPlan(1)[0]).toBe('strange-signal');
    expect(seasonBeatPlan(1).at(-1)).toBe('lasting-decision');
    expect(seasonBeatPlan(1)).toHaveLength(seasonLength(1));
    expect(createSeason(7).throughlineKey).toBe(7 % 5);
  });

  it('assigns hidden beats without changing the contract the player picked', () => {
    const started = startExpedition(open(), 'water-route', ['mend', 'reveal'], 7);
    const beat = started.state.season!.beats[0]!;
    expect(started.state.expedition?.contractId).toBe('water-route');
    expect(beat).toMatchObject({ id: 'strange-signal', expeditionId: started.state.expedition?.id });
    expect(started.state.expedition?.narrative.cause.startsWith(seasonHook(started.state.season!, beat.id))).toBe(true);
  });

  it('resolves a beat when the expedition returns and keeps the source hidden until then', () => {
    let state = finishRequired(startExpedition(open(), 'water-route', ['mend', 'reveal'], 7).state);
    expect(seasonSourceRevealed(state.season)).toBe(false);
    state = chooseOptionalLead(state, false).state;
    const finished = completeExpedition({ ...state, player: expeditionTarget(state)! });
    expect(finished.state.season?.beats[0]?.resolved).toBe(true);
    expect(finished.state.season?.decisions[0]?.wentFarther).toBe(false);
    expect(seasonSourceRevealed(finished.state.season)).toBe(false);
    expect(seasonProgress(finished.state.season)).toMatchObject({ resolved: 1, complete: false });
    expect(seasonProgress(finished.state.season).nextBeat?.id).not.toBe('strange-signal');
  });
});
