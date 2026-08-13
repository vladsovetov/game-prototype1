import { describe, expect, it } from 'vitest';
import { generateCharacter } from './character';
import { activateGift, activateShrine, createInitialState, movePlayer, plantSeed, removePlanting } from './simulation';
import { ANOMALIES, SHRINES } from './world';

describe('world simulation',()=>{
 it('bounds movement to the world',()=>{let s=createInitialState(generateCharacter(2));s={...s,player:{x:1,y:1}};s=movePlayer(s,{x:-100,y:-100},100);expect(s.player).toEqual({x:40,y:40})});
 it('completes a compound chain and rewards once',()=>{let s=createInitialState(generateCharacter(1));const a=ANOMALIES[0]!;s={...s,player:a.position,character:{...s.character,gift:{id:'echo',name:'Echo',description:''}}};let r=activateGift(s,100);expect(r.changed).toBe(true);s={...r.state,borrowedGift:'grow'};r=activateGift(s,200);expect(r.state.seeds).toContain('singing-tree');const again=activateGift(r.state,300);expect(again.state.seeds.filter(x=>x==='singing-tree')).toHaveLength(1)});
 it('borrows a nearby shrine gift only in range',()=>{let s=createInitialState(generateCharacter(1));s={...s,player:SHRINES[0]!.position};let r=activateShrine(s);expect(r.state.borrowedGift).toBe(SHRINES[0]!.gift);r=activateShrine({...r.state,player:{x:0,y:0}});expect(r.changed).toBe(false)});
 it('plants, removes, and recovers a seed',()=>{let s=createInitialState(generateCharacter(1));s={...s,seeds:['singing-tree']};let r=plantSeed(s,'plot-1','singing-tree');expect(r.state.plantings['plot-1']).toBe('singing-tree');r=removePlanting(r.state,'plot-1');expect(r.state.seeds).toContain('singing-tree')});
});
