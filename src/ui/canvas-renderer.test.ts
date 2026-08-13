import { describe,expect,it } from 'vitest';
import { cameraFor, worldToScreen } from './canvas-renderer';
describe('canvas camera',()=>{it('centers and clamps to the world',()=>{expect(cameraFor({x:100,y:100},800,600)).toEqual({x:0,y:0});expect(cameraFor({x:1600,y:900},800,600)).toEqual({x:1200,y:600});expect(worldToScreen({x:1300,y:650},{x:1200,y:600})).toEqual({x:100,y:50})})});
