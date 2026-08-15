import type { GameState } from '../domain/types';
export interface StorageLike{getItem(key:string):string|null;setItem(key:string,value:string):void;removeItem(key:string):void}
type LoadResult={kind:'empty'}|{kind:'loaded';state:GameState}|{kind:'corrupt';message:string}|{kind:'newer-version';version:number};
const SAVE='unwritten.prototype.save.v1',DIAGNOSTIC='unwritten.prototype.diagnostic';
function isState(v:unknown):v is GameState{if(!v||typeof v!=='object')return false;const x=v as Partial<GameState>;return x.version===1&&!!x.character&&!!x.player&&!!x.anomalies&&Array.isArray(x.discoveries)&&Array.isArray(x.seeds)&&!!x.plantings&&Array.isArray(x.rewarded)&&!!x.effects}
export function createSaveStore(storage:StorageLike){return{
 load():LoadResult{const raw=storage.getItem(SAVE);if(!raw)return{kind:'empty'};try{const parsed:unknown=JSON.parse(raw);if(parsed&&typeof parsed==='object'&&'version'in parsed&&typeof parsed.version==='number'&&parsed.version>1){storage.setItem(DIAGNOSTIC,raw);return{kind:'newer-version',version:parsed.version}}if(!isState(parsed))throw new Error('Required save fields are missing.');return{kind:'loaded',state:parsed}}catch(error){storage.setItem(DIAGNOSTIC,raw);return{kind:'corrupt',message:error instanceof Error?error.message:'Save could not be read.'}}},
 save(state:GameState){storage.setItem(SAVE,JSON.stringify({...state,version:1,lastUpdated:Date.now()}))},
 clear(){storage.removeItem(SAVE);storage.removeItem(DIAGNOSTIC)},
 exportDiagnostic(){return storage.getItem(DIAGNOSTIC)}
}}
