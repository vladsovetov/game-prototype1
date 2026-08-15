import { describe,expect,it } from 'vitest';
import { avatarVisualPlan, backHeadMark, cameraFor, movementPose, worldToScreen } from './canvas-renderer';
import type { BodyId, Facing, WearableId } from '../domain/types';
describe('canvas camera',()=>{it('centers and clamps to the world',()=>{expect(cameraFor({x:100,y:100},800,600)).toEqual({x:0,y:0});expect(cameraFor({x:1600,y:900},800,600)).toEqual({x:1200,y:600});expect(worldToScreen({x:1300,y:650},{x:1200,y:600})).toEqual({x:100,y:50})})});

describe('directional walking pose', () => {
  it.each([
    [{ x: -1, y: 0 }, 'left'], [{ x: 1, y: 0 }, 'right'],
    [{ x: 0, y: -1 }, 'up'], [{ x: 0, y: 1 }, 'down'],
  ] as const)('faces with movement %o', (movement, facing) => {
    expect(movementPose(movement.x, movement.y, 'down')).toEqual({ facing, walking: true });
  });

  it('keeps the last facing when standing still', () => {
    expect(movementPose(0, 0, 'left')).toEqual({ facing: 'left', walking: false });
  });
});

describe('directional avatar visual plan',()=>{
  const bodies:BodyId[]=['fox','moth','bird','wisp'];
  const facings:Facing[]=['up','down','left','right'];
  const gear:WearableId[]=['rain-hat','wool-scarf','canvas-pack','rubber-boots'];

  it.each(bodies.flatMap((body)=>facings.map((facing)=>[body,facing] as const)))('keeps the %s silhouette identifiable when facing %s',(body,facing)=>{
    const plan=avatarVisualPlan(body,facing,gear);
    expect(plan.parts).toContain('head');
    expect(plan.parts).toContain('torso');
    expect(plan.parts).toContain('hands');
    expect(plan.parts).toContain('feet');
    expect(plan.parts).toContain(`signature-${body}`);
    expect(plan.parts).toContain(facing==='up'?'back-of-head':'face');
  });

  it.each(facings)('keeps every equipped cosmetic represented when facing %s',(facing)=>{
    const plan=avatarVisualPlan('bird',facing,gear);
    expect(plan.parts).toEqual(expect.arrayContaining(gear.map((item)=>`wearable-${item}`)));
    expect(plan.packLayer).toBe(facing==='up'?'foreground':'background');
  });

  it('places the rear head mark on the crown instead of making a false smiling face',()=>{
    const mark=backHeadMark();
    expect(mark.start).toBeGreaterThan(Math.PI);
    expect(mark.end).toBeLessThan(Math.PI*2);
  });
});
