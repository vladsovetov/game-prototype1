import { localizedCopy } from '../i18n/locale';
import { GIFTS } from './catalog';
import { expeditionTarget } from './expedition';
import { tutorialTarget } from './tutorial';
import type { GameState, GiftId, Point } from './types';
import { distance, worldFor, type Anomaly, type WorldLayout } from './world';

export type MinimapMarkKind = 'tool' | 'use' | 'plot';

export interface MinimapMark {
  id: string;
  kind: MinimapMarkKind;
  position: Point;
  label: string;
  ready: boolean;
  done: boolean;
}

export interface MinimapFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PLOT_LABEL = {
  uk: 'Грядка Притулку',
  en: 'Refuge plot',
  ru: 'Грядка Убежища',
} as const;

export function heldGifts(state: Pick<GameState, 'character' | 'borrowedGift'>): GiftId[] {
  return [state.character.gift.id, ...(state.borrowedGift ? [state.borrowedGift] : [])];
}

export function anomalyNeedsHeldTool(state: Pick<GameState, 'character' | 'borrowedGift' | 'anomalies'>, anomaly: Anomaly) {
  const transition = anomaly.transitions[state.anomalies[anomaly.id] ?? 0];
  return !!transition && heldGifts(state).includes(transition.gift);
}

export function anomalyIsFinished(state: Pick<GameState, 'anomalies'>, anomaly: Anomaly) {
  return !anomaly.transitions[state.anomalies[anomaly.id] ?? 0];
}

export function fieldMarks(state: GameState): MinimapMark[] {
  const world = worldFor(state);
  return [
    ...world.anomalies.map((anomaly) => ({
      id: anomaly.id,
      kind: 'tool' as const,
      position: anomaly.position,
      label: anomaly.states[state.anomalies[anomaly.id] ?? 0] ?? anomaly.name,
      ready: anomalyNeedsHeldTool(state, anomaly),
      done: anomalyIsFinished(state, anomaly),
    })),
    ...world.shrines.map((shrine) => ({
      id: shrine.id,
      kind: 'use' as const,
      position: shrine.position,
      label: GIFTS[shrine.gift].name,
      ready: state.borrowedGift !== shrine.gift,
      done: state.borrowedGift === shrine.gift,
    })),
    ...world.plots.map((plot) => ({
      id: plot.id,
      kind: 'plot' as const,
      position: plot.position,
      label: localizedCopy(PLOT_LABEL),
      ready: !state.plantings[plot.id] && state.seeds.length > 0,
      done: !!state.plantings[plot.id],
    })),
  ];
}

export function minimapFrame(viewW: number, viewH: number, touch: boolean): MinimapFrame {
  const w = Math.min(touch ? 152 : 204, Math.max(120, viewW - 28));
  const h = touch ? 96 : 118;
  if (touch) return { x: 14, y: viewH - 166 - h, w, h };
  return { x: 22, y: viewH - 22 - h, w, h };
}

export function worldToMinimap(point: Point, world: Pick<WorldLayout, 'width' | 'height'>, frame: MinimapFrame): Point {
  return {
    x: frame.x + (point.x / world.width) * frame.w,
    y: frame.y + (point.y / world.height) * frame.h,
  };
}

export function pickMinimapMark(tap: Point, marks: MinimapMark[], world: Pick<WorldLayout, 'width' | 'height'>, frame: MinimapFrame): MinimapMark | undefined {
  if (tap.x < frame.x || tap.y < frame.y || tap.x > frame.x + frame.w || tap.y > frame.y + frame.h) return;
  const worldTap = {
    x: ((tap.x - frame.x) / frame.w) * world.width,
    y: ((tap.y - frame.y) / frame.h) * world.height,
  };
  const nearest = [...marks].sort((left, right) => distance(left.position, worldTap) - distance(right.position, worldTap))[0];
  if (!nearest || distance(nearest.position, worldTap) > 280) return;
  return nearest;
}

export function navigationTarget(state: GameState, waypoint?: Point): Point | undefined {
  if (state.tutorial && state.tutorial.step !== 'done') return tutorialTarget(state);
  return waypoint ?? expeditionTarget(state);
}
