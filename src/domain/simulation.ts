import type { Character, GameState, GiftId, InteractionResult, Point } from './types';
import { GIFTS } from './catalog';
import { ANOMALY_GEAR, gearForDirection, unlockWearable } from './equipment';
import { createRunDirection } from './run-direction';
import { distance, SEED_NAMES, worldFor } from './world';

const clone = (state: GameState): GameState => structuredClone(state);
export function createInitialState(character: Character, worldSeed?: number): GameState {
  const world = worldFor({ worldSeed });
  const gear = gearForDirection(createRunDirection(worldSeed ?? 0));
  return { version:1, character, player:{x:620,y:420}, ...(worldSeed===undefined?{}:{worldSeed}), anomalies:Object.fromEntries(world.anomalies.map((anomaly)=>[anomaly.id,0])), discoveries:[], seeds:[], plantings:{}, rewarded:[], ...gear, effects:{rootedUntil:0,fragileUntil:0,fadingUntil:0,awakeProps:[]}, lastUpdated:Date.now() };
}
export function movePlayer(state:GameState,delta:Point,elapsedMs:number):GameState {
  if(state.effects.rootedUntil>elapsedMs)return state;
  const world=worldFor(state), next=clone(state);
  next.player={x:Math.max(40,Math.min(world.width-40,next.player.x+delta.x)),y:Math.max(40,Math.min(world.height-40,next.player.y+delta.y))};
  next.lastUpdated=elapsedMs;
  return next;
}
function result(state:GameState,message:string,changed=false,kind?:InteractionResult['kind']):InteractionResult{return{state,message,changed,...(kind?{kind}:{})}}
export function nearestTarget(state:GameState){const world=worldFor(state);const anomalies=world.anomalies.map(value=>({type:'anomaly' as const,value,distance:distance(state.player,value.position)}));const shrines=world.shrines.map(value=>({type:'shrine' as const,value,distance:distance(state.player,value.position)}));const plots=world.plots.map(value=>({type:'plot' as const,value,distance:distance(state.player,value.position)}));return[...anomalies,...shrines,...plots].sort((a,b)=>a.distance-b.distance)[0]}

export function activateGift(state:GameState,now=Date.now()):InteractionResult {
  const target=nearestTarget(state);
  if(!target||target.type!=='anomaly'||target.distance>145)return result(state,'Підійдіть ближче до предмета, навколо якого кружляють вогні.');
  const anomaly=target.value,stage=state.anomalies[anomaly.id]??0,transition=anomaly.transitions[stage];
  if(!transition)return result(state,`${anomaly.states[stage]} уже розповів усе, що знав.`);
  const gifts:GiftId[]=[state.character.gift.id,...(state.borrowedGift?[state.borrowedGift]:[])];
  if(!gifts.includes(transition.gift))return result(state,`${anomaly.states[stage]} потребує інструмента «${GIFTS[transition.gift].name}».`);
  const next=clone(state);
  next.anomalies[anomaly.id]=stage+1;
  next.discoveries.push(`${anomaly.states[stage]} → ${transition.to}`);
  if(transition.seed&&!next.rewarded.includes(anomaly.id)){
    next.rewarded.push(anomaly.id);next.seeds.push(transition.seed);
    const gear=ANOMALY_GEAR[anomaly.id];
    if(gear)Object.assign(next,unlockWearable(next,gear));
  }
  if(next.character.burden.id==='rooted')next.effects.rootedUntil=now+850;
  if(next.character.burden.id==='fragile')next.effects.fragileUntil=now+3500;
  if(next.character.burden.id==='fading')next.effects.fadingUntil=now+4500;
  if(next.character.burden.id==='loud')next.effects.awakeProps.push(anomaly.id);
  next.lastUpdated=now;
  return result(next,transition.message,true,transition.seed?'seed':'discovery');
}

export function activateShrine(state:GameState):InteractionResult {
  const shrine=worldFor(state).shrines.map(value=>({...value,distance:distance(state.player,value.position)})).sort((a,b)=>a.distance-b.distance)[0];
  if(!shrine||shrine.distance>145)return result(state,'Підійдіть ближче до польового столу з інструментом.');
  const next=clone(state); next.borrowedGift=shrine.gift;
  return result(next,`Ви взяли інструмент «${GIFTS[shrine.gift].name}».`,true,'info');
}

export function inspectNearest(state:GameState):InteractionResult {
  const target=nearestTarget(state);
  if(!target||target.distance>160)return result(state,'Поруч лише вітер і паперова трава.');
  if(target.type==='anomaly'){
    const stage=state.anomalies[target.value.id]??0;
    const curious=state.character.quirk.id==='curious'?' Ви помічаєте сліди потрібного інструмента.':'';
    return result(state,`${target.value.states[stage]}.${curious}`);
  }
  if(target.type==='shrine')return result(state,`Польовий стіл: тут можна взяти «${GIFTS[target.value.gift].name}».`);
  const planted=state.plantings[target.value.id];
  return result(state,planted?`Тут посаджено спогад: ${SEED_NAMES[planted]??planted}.`:'Порожнє місце у Притулку.');
}

export function plantSeed(state:GameState,plotId:string,seedId:string):InteractionResult {
  if(state.plantings[plotId])return result(state,'У цьому місці вже зберігається спогад.');
  const index=state.seeds.indexOf(seedId);
  if(index<0)return result(state,'Цієї зернини немає у вашій таці.');
  const next=clone(state);next.seeds.splice(index,1);next.plantings[plotId]=seedId;
  return result(next,'Притулок зберігає цей спогад.',true,'seed');
}
export function removePlanting(state:GameState,plotId:string):InteractionResult {
  const seed=state.plantings[plotId];if(!seed)return result(state,'Це місце вже порожнє.');
  const next=clone(state);delete next.plantings[plotId];next.seeds.push(seed);
  return result(next,'Спогад безпечно повертається до таці.',true);
}
