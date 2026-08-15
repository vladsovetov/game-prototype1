import { describe, expect, it } from 'vitest';
import { equipWearable, gearForDirection, unlockWearable } from './equipment';
import { createRunDirection } from './run-direction';

describe('practical equipment', () => {
  it('turns both generated starter items into visible equipped gear', () => {
    const direction = { ...createRunDirection(33), starterWearables: ['rain-hat', 'canvas-pack'] as ['rain-hat', 'canvas-pack'] };
    const gear = gearForDirection(direction);

    expect(gear.wardrobe).toEqual(['rain-hat', 'canvas-pack']);
    expect(gear.equipped).toEqual({ head: 'rain-hat', back: 'canvas-pack' });
  });

  it('only equips owned items and lets the player take one off', () => {
    const state = { wardrobe: ['wool-scarf'] as const, equipped: {} as Partial<Record<'neck', 'wool-scarf'>> };

    expect(equipWearable(state, 'rain-hat')).toEqual(state);
    expect(equipWearable(state, 'wool-scarf').equipped.neck).toBe('wool-scarf');
    expect(equipWearable(equipWearable(state, 'wool-scarf'), 'wool-scarf').equipped.neck).toBeUndefined();
  });

  it('unlocks a recovered field item once', () => {
    const state = { wardrobe: ['wool-scarf'] as const, equipped: {} };
    expect(unlockWearable(unlockWearable(state, 'rubber-boots'), 'rubber-boots').wardrobe)
      .toEqual(['wool-scarf', 'rubber-boots']);
  });
});
