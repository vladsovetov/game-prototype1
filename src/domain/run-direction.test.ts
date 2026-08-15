import { describe, expect, it } from 'vitest';
import { createRunDirection } from './run-direction';

describe('run direction', () => {
  it('recreates the same complete direction from the same seed and model signal', () => {
    const first = createRunDirection(1234, 'orchard, rain, parcel, red, scarf');

    expect(createRunDirection(1234, 'orchard, rain, parcel, red, scarf')).toEqual(first);
    expect(first.starterWearables).toHaveLength(2);
    expect(new Set(first.starterWearables).size).toBe(2);
    expect(first.colors).toHaveLength(5);
    expect(first.colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
  });

  it('lets model direction materially change one run', () => {
    const first = createRunDirection(44, 'apple station warm parcel copper');
    const second = createRunDirection(44, 'marsh survey mist water blue');

    expect(second).not.toEqual(first);
  });

  it('can reach every region and story frame from ordinary run seeds', () => {
    const directions = Array.from({ length: 256 }, (_, seed) => createRunDirection(seed + 1));

    expect(new Set(directions.map((direction) => direction.region))).toEqual(new Set(['orchard', 'marsh', 'highland', 'coast']));
    expect(new Set(directions.map((direction) => direction.frame))).toEqual(new Set(['station', 'harvest', 'surveyor', 'water-route']));
  });
});
