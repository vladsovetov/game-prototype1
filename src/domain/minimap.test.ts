import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { startExpedition } from './expedition';
import { fieldMarks, heldGifts, minimapFrame, navigationTarget, pickMinimapMark, worldToMinimap } from './minimap';
import { createInitialState } from './simulation';
import { prepareTutorial } from './tutorial';
import { WORLD, worldFor } from './world';

function playable() {
  const state = createInitialState(generateCharacter(4));
  state.tutorial = { ...prepareTutorial(state).tutorial!, step: 'done' };
  return state;
}

describe('field map', () => {
  it('marks broken objects as tool work and tables or plots as usable', () => {
    const state = playable();
    const marks = fieldMarks(state);
    expect(marks.filter((mark) => mark.kind === 'tool').map((mark) => mark.id).sort()).toEqual(
      worldFor(state).anomalies.map((anomaly) => anomaly.id).sort(),
    );
    expect(marks.filter((mark) => mark.kind === 'use')).toHaveLength(4);
    expect(marks.filter((mark) => mark.kind === 'plot')).toHaveLength(6);
    expect(heldGifts(state)).toEqual([state.character.gift.id]);
    expect(marks.find((mark) => mark.id === 'sign')?.ready).toBe(state.character.gift.id === 'reveal');
  });

  it('lights a tool mark only when the held gift matches the next repair', () => {
    const state = playable();
    state.character = { ...state.character, gift: { ...state.character.gift, id: 'echo' } };
    state.borrowedGift = 'reveal';
    state.anomalies.sign = 0;
    expect(fieldMarks(state).find((mark) => mark.id === 'sign')).toMatchObject({ kind: 'tool', ready: true, done: false });
    state.anomalies.sign = 2;
    expect(fieldMarks(state).find((mark) => mark.id === 'sign')).toMatchObject({ done: true, ready: false });
  });

  it('keeps the map off the joystick on phones and in the free corner on desktop', () => {
    const desktop = minimapFrame(1280, 800, false);
    const phone = minimapFrame(390, 844, true);
    expect(desktop.x).toBe(22);
    expect(desktop.y + desktop.h).toBe(778);
    expect(phone.x).toBe(14);
    expect(phone.y).toBeGreaterThan(480);
    expect(phone.y + phone.h).toBeLessThan(844 - 150);
  });

  it('picks the nearest mark from a map tap and ignores empty grass', () => {
    const state = playable();
    const world = worldFor(state);
    const frame = minimapFrame(1280, 800, false);
    const sign = fieldMarks(state).find((mark) => mark.id === 'sign')!;
    const onSign = worldToMinimap(sign.position, world, frame);
    expect(pickMinimapMark(onSign, fieldMarks(state), world, frame)?.id).toBe('sign');
    expect(pickMinimapMark({ x: frame.x + frame.w - 4, y: frame.y + frame.h - 4 }, fieldMarks(state), world, frame)).toBeUndefined();
  });

  it('keeps the tutorial trail until the meadow is free, then follows a waypoint', () => {
    const tutorial = prepareTutorial(createInitialState(generateCharacter(4)));
    tutorial.tutorial = { ...tutorial.tutorial!, step: 'gift' };
    const waypoint = { x: 100, y: 100 };
    expect(navigationTarget(tutorial, waypoint)).toEqual(worldFor(tutorial).anomalies.find((item) => item.id === 'sign')?.position);

    const open = playable();
    expect(navigationTarget(open, waypoint)).toEqual(waypoint);
    const expedition = startExpedition(open, 'water-route', ['reveal', 'mend'], 11).state;
    expect(navigationTarget(expedition)).toEqual(worldFor(expedition).anomalies.find((item) => item.id === expedition.expedition?.siteIds[0])?.position);
    expect(navigationTarget(expedition, waypoint)).toEqual(waypoint);
  });

  it('places every mark inside the authored world', () => {
    for (const mark of fieldMarks(playable())) {
      expect(mark.position.x).toBeGreaterThan(0);
      expect(mark.position.x).toBeLessThan(WORLD.width);
      expect(mark.position.y).toBeGreaterThan(0);
      expect(mark.position.y).toBeLessThan(WORLD.height);
    }
  });
});
