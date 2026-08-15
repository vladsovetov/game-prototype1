import { describe, expect, it } from 'vitest';
import { randomSeed } from './random';
import { createWorld } from './world';
import { createRunDirection } from './run-direction';

describe('seeded meadow', () => {
  it('recreates the same layout from the same seed', () => {
    expect(createWorld(1234)).toEqual(createWorld(1234));
  });

  it('changes both atmosphere and object placement for another seed', () => {
    const first = createWorld(1234);
    const second = createWorld(5678);

    expect(second.theme.name).not.toBe(first.theme.name);
    expect(second.anomalies.map(({ id, position }) => ({ id, position })))
      .not.toEqual(first.anomalies.map(({ id, position }) => ({ id, position })));
  });

  it('builds structurally different scenery and routes for each region', () => {
    const orchard = createWorld(222, { ...createRunDirection(222), region: 'orchard' });
    const marsh = createWorld(222, { ...createRunDirection(222), region: 'marsh' });
    const highland = createWorld(222, { ...createRunDirection(222), region: 'highland' });
    const coast = createWorld(222, { ...createRunDirection(222), region: 'coast' });

    expect(orchard.scenery.map((item) => item.kind)).toEqual(expect.arrayContaining(['fruit-tree', 'fence', 'shed']));
    expect(marsh.scenery.map((item) => item.kind)).toEqual(expect.arrayContaining(['water', 'reeds', 'boardwalk']));
    expect(highland.scenery.map((item) => item.kind)).toEqual(expect.arrayContaining(['pine', 'boulder', 'weather-station']));
    expect(coast.scenery.map((item) => item.kind)).toEqual(expect.arrayContaining(['shore', 'dock', 'boat']));
    expect(marsh.routes).not.toEqual(orchard.routes);
    expect(highland.anomalies.map((item) => item.position)).not.toEqual(coast.anomalies.map((item) => item.position));
  });

  it('keeps generated discoveries separated from each other and the sanctuary', () => {
    const world = createWorld(987654321);
    const sanctuaryEdgeX = world.sanctuary.x + world.sanctuary.w;

    for (const anomaly of world.anomalies) {
      expect(anomaly.position.x).toBeGreaterThan(sanctuaryEdgeX + 100);
    }
    for (let left = 0; left < world.anomalies.length; left++) {
      for (let right = left + 1; right < world.anomalies.length; right++) {
        const a = world.anomalies[left]!.position;
        const b = world.anomalies[right]!.position;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(220);
      }
    }
    expect(world.shrines.map((shrine) => shrine.gift).sort()).toEqual(['echo', 'grow', 'mend', 'reveal']);
  });

  it('creates a uint32 seed from the supplied entropy source', () => {
    expect(randomSeed(() => 0.5)).toBe(2147483648);
  });
});
