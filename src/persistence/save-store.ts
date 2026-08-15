import { localizeState } from '../domain/localization';
import type { GameState } from '../domain/types';

export interface StorageLike { getItem(key:string):string|null; setItem(key:string,value:string):void; removeItem(key:string):void }
type LoadResult = {kind:'empty'} | {kind:'loaded';state:GameState} | {kind:'corrupt';message:string} | {kind:'newer-version';version:number};
const SAVE='unwritten.prototype.save.v1', DIAGNOSTIC='unwritten.prototype.diagnostic';
function isState(value:unknown):value is GameState {
  if(!value||typeof value!=='object')return false;
  const state=value as Partial<GameState>;
  return state.version===1&&!!state.character&&!!state.player&&!!state.anomalies&&Array.isArray(state.discoveries)&&Array.isArray(state.seeds)&&!!state.plantings&&Array.isArray(state.rewarded)&&!!state.effects;
}
export function createSaveStore(storage:StorageLike){return{
  load():LoadResult{
    const raw=storage.getItem(SAVE);if(!raw)return{kind:'empty'};
    try{
      const parsed:unknown=JSON.parse(raw);
      if(parsed&&typeof parsed==='object'&&'version'in parsed&&typeof parsed.version==='number'&&parsed.version>1){storage.setItem(DIAGNOSTIC,raw);return{kind:'newer-version',version:parsed.version}}
      if(!isState(parsed))throw new Error('У збереженні бракує обов’язкових полів.');
      const state=localizeState(parsed);
      return{kind:'loaded',state:{...state,effects:{...state.effects,rootedUntil:0,fragileUntil:0,fadingUntil:0}}};
    }catch(error){storage.setItem(DIAGNOSTIC,raw);return{kind:'corrupt',message:error instanceof Error?error.message:'Не вдалося прочитати збереження.'}}
  },
  save(state:GameState){storage.setItem(SAVE,JSON.stringify({...state,version:1,lastUpdated:Date.now()}))},
  clear(){storage.removeItem(SAVE);storage.removeItem(DIAGNOSTIC)},
  exportDiagnostic(){return storage.getItem(DIAGNOSTIC)},
}}
