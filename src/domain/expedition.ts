import { GIFTS } from './catalog';
import { directionFor, REGION_NAMES } from './run-direction';
import type { ContractId, ExpeditionMeta, ExpeditionProgress, ExpeditionReport, GameState, GiftId, Point, RefugeProjectId } from './types';
import { distance, worldFor } from './world';

export interface ContractDefinition{id:ContractId;name:string;brief:string;sitePool:string[]}
export interface WorkAction{tool:GiftId;title:string;outcome:string;supplies:number;insight:number;pressure:number}
export interface ExpeditionResult{ok:boolean;state:GameState;message:string;report?:ExpeditionReport}

export const CONTRACTS:Record<ContractId,ContractDefinition>={
  'water-route':{id:'water-route',name:'Відновити водний маршрут',brief:'Полагодьте три ланки водопостачання й поверніться до Притулку.',sitePool:['pool','root','sign','garden','stone']},
  'signal-line':{id:'signal-line',name:'Підняти сигнальну лінію',brief:'Знайдіть три слабкі місця в мережі польових сигналів.',sitePool:['stone','bell','moon','sign','moth']},
  'storm-shelter':{id:'storm-shelter',name:'Підготувати сховища',brief:'Зміцніть три місця до погіршення погоди.',sitePool:['root','sign','garden','moth','pool']},
};

export const REFUGE_PROJECTS:Record<RefugeProjectId,{id:RefugeProjectId;name:string;description:string;cost:{supplies:number;insight:number;rare:number}}>= {
  workshop:{id:'workshop',name:'Польова майстерня',description:'Додає верстак, креслення та тепле робоче світло.',cost:{supplies:8,insight:0,rare:0}},
  archive:{id:'archive',name:'Архів маршрутів',description:'Наповнює Притулок мапами й записами з експедицій.',cost:{supplies:0,insight:6,rare:0}},
  'guest-canopy':{id:'guest-canopy',name:'Гостьовий навіс',description:'Створює затишне місце для майбутніх мандрівників.',cost:{supplies:6,insight:0,rare:1}},
};

const TOOL_ORDER:GiftId[]=['reveal','grow','echo','mend'];
const EMPTY_META:ExpeditionMeta={completedContracts:0,supplies:0,insight:0,rareFinds:[],builtProjects:[],reports:[]};
const SITE_NAMES:Record<string,string>={stone:'резонатора',sign:'покажчика',pool:'водяної помпи',root:'входу до комори',bell:'сигнального дзвона',moth:'польових записок',moon:'сигнальної лампи',garden:'робочої ділянки'};
const VERBS:Record<GiftId,string>={reveal:'Оглянути з ліхтарем',grow:'Розчистити секатором',echo:'Перевірити камертоном',mend:'Полагодити набором'};
const RESULTS:Record<GiftId,{outcome:string;supplies:number;insight:number;pressure:number}>={
  reveal:{outcome:'Приховані позначки відкрили безпечніший шлях і корисну схему.',supplies:1,insight:2,pressure:0},
  grow:{outcome:'Зарості розчищено швидко, але робота під відкритим небом виснажила час.',supplies:2,insight:0,pressure:2},
  echo:{outcome:'Перевірка звуком знайшла дефект без розбирання механізму.',supplies:1,insight:2,pressure:1},
  mend:{outcome:'Вузол укріплено надійно, а придатні деталі складено до наплічника.',supplies:2,insight:1,pressure:1},
};

const clone=(state:GameState):GameState=>structuredClone(state);
const result=(state:GameState,ok:boolean,message:string,report?:ExpeditionReport):ExpeditionResult=>({state,ok,message,...(report?{report}:{})});

export function expeditionMetaFor(state:Pick<GameState,'expeditionMeta'>):ExpeditionMeta{
  const meta=state.expeditionMeta;
  return meta?{...EMPTY_META,...meta,rareFinds:[...(meta.rareFinds??[])],builtProjects:[...(meta.builtProjects??[])],reports:[...(meta.reports??[])]}:{...EMPTY_META,rareFinds:[],builtProjects:[],reports:[]};
}

export function startExpedition(state:GameState,contractId:ContractId,loadout:GiftId[],seed=Date.now()):ExpeditionResult{
  if(state.expedition)return result(state,false,'Спершу завершіть поточну експедицію.');
  if(loadout.length!==2||loadout[0]===loadout[1]||loadout.some((tool)=>!TOOL_ORDER.includes(tool)))return result(state,false,'Оберіть рівно два різні інструменти.');
  const contract=CONTRACTS[contractId];
  if(!contract)return result(state,false,'Цей контракт недоступний.');
  const offset=(seed>>>0)%contract.sitePool.length;
  const route=Array.from({length:4},(_,index)=>contract.sitePool[(offset+index)%contract.sitePool.length]!);
  const expedition:ExpeditionProgress={id:`${contractId}-${seed>>>0}`,contractId,seed:seed>>>0,loadout:[loadout[0]!,loadout[1]!],siteIds:route.slice(0,3),requiredTotal:3,completed:[],optionalSiteId:route[3]!,pressure:0,supplies:0,insight:0,rareFinds:[],status:'active'};
  return result({...clone(state),expedition},true,`Контракт «${contract.name}» розпочато. Перша точка позначена на маршруті.`);
}

function sitePosition(state:GameState,siteId:string):Point|undefined{return worldFor(state).anomalies.find((site)=>site.id===siteId)?.position}

export function expeditionTarget(state:GameState):Point|undefined{
  const run=state.expedition;
  if(!run)return undefined;
  if(run.status==='returning')return worldFor(state).gate;
  if(run.status==='decision')return undefined;
  const required=run.siteIds[run.completed.length];
  const siteId=required??(run.optionalAccepted&&!run.optionalCompleted?run.optionalSiteId:undefined);
  return siteId?sitePosition(state,siteId):undefined;
}

export function availableWorkActions(state:GameState):WorkAction[]{
  const run=state.expedition,target=expeditionTarget(state);
  if(!run||run.status!=='active'||!target||distance(state.player,target)>165)return[];
  const completedRequired=run.completed.length<run.requiredTotal;
  const siteId=completedRequired?run.siteIds[run.completed.length]:run.optionalSiteId;
  return TOOL_ORDER.filter((tool)=>run.loadout.includes(tool)).map((tool)=>({tool,title:`${VERBS[tool]} біля ${SITE_NAMES[siteId!]??'об’єкта'}`,...RESULTS[tool]}));
}

export function applyWorkAction(state:GameState,tool:GiftId):ExpeditionResult{
  const run=state.expedition;
  if(!run||run.status!=='active')return result(state,false,'Зараз немає доступної польової роботи.');
  const action=availableWorkActions(state).find((candidate)=>candidate.tool===tool);
  if(!action)return result(state,false,`Підійдіть до позначеної точки з інструментом «${GIFTS[tool].name}».`);
  const next=clone(state),active=next.expedition!;
  const required=active.completed.length<active.requiredTotal;
  const siteId=required?active.siteIds[active.completed.length]!:active.optionalSiteId;
  active.completed.push({siteId,tool,title:action.title,outcome:action.outcome});
  active.supplies+=action.supplies; active.insight+=action.insight; active.pressure+=action.pressure;
  if(required&&active.completed.length===active.requiredTotal)active.status='decision';
  else if(!required){active.optionalCompleted=true;active.status='returning';active.pressure+=2;active.rareFinds.push(rareFindFor(state));}
  return result(next,true,required?`${action.outcome} Виконано ${active.completed.length} з ${active.requiredTotal}.`:`${action.outcome} Рідкісну знахідку закріплено; час повертатися.`);
}

export function chooseOptionalLead(state:GameState,accept:boolean):ExpeditionResult{
  if(state.expedition?.status!=='decision')return result(state,false,'Рішення про дальній маршрут зараз недоступне.');
  const next=clone(state),run=next.expedition!;
  run.optionalAccepted=accept;
  run.status=accept?'active':'returning';
  return result(next,true,accept?'Ви йдете далі. Погода посилиться, але там є рідкісна знахідка.':'Зібраного достатньо. Повертайтеся до воріт Притулку.');
}

function rareFindFor(state:GameState){const region=directionFor(state).region;return{orchard:'бурштин старого саду',marsh:'очеретяна мапа',highland:'гірське скло',coast:'сигнальне скло'}[region]}

export function completeExpedition(state:GameState,now=Date.now()):ExpeditionResult{
  const run=state.expedition,gate=worldFor(state).gate;
  if(!run||run.status!=='returning')return result(state,false,'Спершу завершіть польові роботи.');
  if(distance(state.player,gate)>185)return result(state,false,'Поверніться до воріт Притулку.');
  const securedSupplies=Math.max(1,run.supplies-Math.max(0,run.pressure-3));
  const securedInsight=run.insight;
  const contract=CONTRACTS[run.contractId];
  const report:ExpeditionReport={id:`report-${run.id}-${now}`,contractId:run.contractId,title:contract.name,summary:`${state.character.name} повертається з маршруту «${contract.name}». ${run.completed.map((action)=>action.outcome).join(' ')}`,actions:[...run.completed],securedSupplies,securedInsight,rareFinds:[...run.rareFinds],pressure:run.pressure,completedAt:now};
  const next=clone(state),meta=expeditionMetaFor(next);
  next.expeditionMeta={completedContracts:meta.completedContracts+1,supplies:meta.supplies+securedSupplies,insight:meta.insight+securedInsight,rareFinds:[...meta.rareFinds,...run.rareFinds],builtProjects:meta.builtProjects,reports:[report,...meta.reports].slice(0,20)};
  delete next.expedition;
  return result(next,true,`Експедицію завершено: +${securedSupplies} припасів, +${securedInsight} знань.`,report);
}

export function buildRefugeProject(state:GameState,projectId:RefugeProjectId):ExpeditionResult{
  const project=REFUGE_PROJECTS[projectId],meta=expeditionMetaFor(state);
  if(meta.builtProjects.includes(projectId))return result(state,false,'Цей проєкт уже збудовано.');
  if(meta.supplies<project.cost.supplies||meta.insight<project.cost.insight||meta.rareFinds.length<project.cost.rare)return result(state,false,'Для цього проєкту ще бракує матеріалів.');
  const next=clone(state);
  next.expeditionMeta={...meta,supplies:meta.supplies-project.cost.supplies,insight:meta.insight-project.cost.insight,rareFinds:meta.rareFinds.slice(project.cost.rare),builtProjects:[...meta.builtProjects,projectId]};
  return result(next,true,`Проєкт «${project.name}» збудовано. Притулок змінився.`);
}

export function expeditionRegionName(state:GameState){return REGION_NAMES[directionFor(state).region]}
