import { localizedCopy, type Locale } from '../i18n/locale';
import type { Character, GameState, GiftId, InteractionResult, Point } from './types';
import { GIFTS } from './catalog';
import { ANOMALY_GEAR, gearForDirection, unlockWearable } from './equipment';
import { createRunDirection } from './run-direction';
import { distance, SEED_NAMES, worldFor } from './world';

const SAY: Record<Locale, Record<string, string>> = {
  uk: {
    closerItem: 'Підійдіть ближче до предмета, навколо якого кружляють вогні.',
    alreadyTold: '{name} уже розповів усе, що знав.',
    needsTool: '{name} потребує інструмента «{gift}».',
    closerTable: 'Підійдіть ближче до польового столу з інструментом.',
    tookTool: 'Ви взяли інструмент «{gift}».',
    onlyWind: 'Поруч лише вітер і паперова трава.',
    curious: ' Ви помічаєте сліди потрібного інструмента.',
    fieldTable: 'Польовий стіл: тут можна взяти «{gift}».',
    plantedHere: 'Тут посаджено спогад: {seed}.',
    emptyPlot: 'Порожнє місце у Притулку.',
    alreadyPlanted: 'У цьому місці вже зберігається спогад.',
    noSeed: 'Цієї зернини немає у вашій таці.',
    refugeKeeps: 'Притулок зберігає цей спогад.',
    alreadyEmpty: 'Це місце вже порожнє.',
    seedReturned: 'Спогад безпечно повертається до таці.',
  },
  en: {
    closerItem: 'Come closer to the object the glows are circling.',
    alreadyTold: '{name} has already told everything it knew.',
    needsTool: '{name} needs the tool “{gift}”.',
    closerTable: 'Come closer to the field table with a tool.',
    tookTool: 'You took the tool “{gift}”.',
    onlyWind: 'Nearby there is only wind and paper grass.',
    curious: ' You notice traces of the needed tool.',
    fieldTable: 'Field table: you can take “{gift}” here.',
    plantedHere: 'A memory is planted here: {seed}.',
    emptyPlot: 'An empty place in the Refuge.',
    alreadyPlanted: 'A memory is already kept in this place.',
    noSeed: 'That seed is not in your tray.',
    refugeKeeps: 'The Refuge keeps this memory.',
    alreadyEmpty: 'This place is already empty.',
    seedReturned: 'The memory returns safely to the tray.',
  },
  ru: {
    closerItem: 'Подойдите ближе к предмету, вокруг которого кружат огоньки.',
    alreadyTold: '{name} уже рассказал всё, что знал.',
    needsTool: '{name} требует инструмент «{gift}».',
    closerTable: 'Подойдите ближе к полевому столу с инструментом.',
    tookTool: 'Вы взяли инструмент «{gift}».',
    onlyWind: 'Рядом только ветер и бумажная трава.',
    curious: ' Вы замечаете следы нужного инструмента.',
    fieldTable: 'Полевой стол: здесь можно взять «{gift}».',
    plantedHere: 'Здесь посажено воспоминание: {seed}.',
    emptyPlot: 'Пустое место в Убежище.',
    alreadyPlanted: 'В этом месте уже хранится воспоминание.',
    noSeed: 'Этого зерна нет на вашей подносе.',
    refugeKeeps: 'Убежище хранит это воспоминание.',
    alreadyEmpty: 'Это место уже пусто.',
    seedReturned: 'Воспоминание безопасно возвращается на поднос.',
  },
};
function say(key: string, variables: Record<string, string | number | undefined> = {}) {
  let result = localizedCopy(SAY)[key] ?? key;
  for (const [name, value] of Object.entries(variables)) result = result.replaceAll(`{${name}}`, String(value ?? ''));
  return result;
}

const clone = (state: GameState): GameState => structuredClone(state);
export function createInitialState(character: Character, worldSeed?: number): GameState {
  const world = worldFor({ worldSeed });
  const gear = gearForDirection(createRunDirection(worldSeed ?? 0));
  return { version:1, character, player:{x:620,y:420}, ...(worldSeed===undefined?{}:{worldSeed}), anomalies:Object.fromEntries(world.anomalies.map((anomaly)=>[anomaly.id,0])), discoveries:[], seeds:[], plantings:{}, rewarded:[], ...gear, expeditionMeta:{completedContracts:0,supplies:0,insight:0,rareFinds:[],builtProjects:[],reports:[]}, effects:{rootedUntil:0,fragileUntil:0,fadingUntil:0,awakeProps:[]}, lastUpdated:Date.now() };
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
  if(!target||target.type!=='anomaly'||target.distance>145)return result(state,say('closerItem'));
  const anomaly=target.value,stage=state.anomalies[anomaly.id]??0,transition=anomaly.transitions[stage];
  if(!transition)return result(state,say('alreadyTold',{name:anomaly.states[stage]}));
  const gifts:GiftId[]=[state.character.gift.id,...(state.borrowedGift?[state.borrowedGift]:[])];
  if(!gifts.includes(transition.gift))return result(state,say('needsTool',{name:anomaly.states[stage],gift:GIFTS[transition.gift].name}));
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
  if(!shrine||shrine.distance>145)return result(state,say('closerTable'));
  const next=clone(state); next.borrowedGift=shrine.gift;
  return result(next,say('tookTool',{gift:GIFTS[shrine.gift].name}),true,'info');
}

export function inspectNearest(state:GameState):InteractionResult {
  const target=nearestTarget(state);
  if(!target||target.distance>160)return result(state,say('onlyWind'));
  if(target.type==='anomaly'){
    const stage=state.anomalies[target.value.id]??0;
    const curious=state.character.quirk.id==='curious'?say('curious'):'';
    return result(state,`${target.value.states[stage]}.${curious}`);
  }
  if(target.type==='shrine')return result(state,say('fieldTable',{gift:GIFTS[target.value.gift].name}));
  const planted=state.plantings[target.value.id];
  return result(state,planted?say('plantedHere',{seed:SEED_NAMES[planted]??planted}):say('emptyPlot'));
}

export function plantSeed(state:GameState,plotId:string,seedId:string):InteractionResult {
  if(state.plantings[plotId])return result(state,say('alreadyPlanted'));
  const index=state.seeds.indexOf(seedId);
  if(index<0)return result(state,say('noSeed'));
  const next=clone(state);next.seeds.splice(index,1);next.plantings[plotId]=seedId;
  return result(next,say('refugeKeeps'),true,'seed');
}
export function removePlanting(state:GameState,plotId:string):InteractionResult {
  const seed=state.plantings[plotId];if(!seed)return result(state,say('alreadyEmpty'));
  const next=clone(state);delete next.plantings[plotId];next.seeds.push(seed);
  return result(next,say('seedReturned'),true);
}
