import { BODIES, BURDENS, GIFTS, MARKS, MATERIALS, PALETTES, QUIRKS } from './catalog';
import type { BodyId, BurdenId, Character, GiftId, MarkId, MaterialId, PaletteId, QuirkId } from './types';
export type CharacterValidation={ok:true;character:Character}|{ok:false;errors:string[]};
const clean=(value:unknown,max:number)=>typeof value==='string'?value.replace(/[<>]/g,'').trim().slice(0,max):'';
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
export function validateCharacterCard(input:string):CharacterValidation{
 let raw:unknown; try{raw=JSON.parse(input)}catch{return{ok:false,errors:['The card is not valid JSON.']}};
 if(!record(raw))return{ok:false,errors:['The card must be a JSON object.']};
 const errors:string[]=[]; const name=clean(raw.name,24),description=clean(raw.description,180); const appearance=record(raw.appearance)?raw.appearance:{};
 if(raw.version!==1)errors.push('version must be 1.'); if(!name)errors.push('name must contain 1–24 characters.'); if(!description)errors.push('description must contain 1–180 characters.');
 const body=appearance.body,material=appearance.material,palette=appearance.palette,mark=appearance.mark,gift=raw.gift,burden=raw.burden,quirk=raw.quirk;
 if(!BODIES.includes(body as BodyId))errors.push(`body must be one of: ${BODIES.join(', ')}.`); if(!MATERIALS.includes(material as MaterialId))errors.push(`material must be one of: ${MATERIALS.join(', ')}.`); if(!PALETTES.includes(palette as PaletteId))errors.push(`palette must be one of: ${PALETTES.join(', ')}.`); if(!MARKS.includes(mark as MarkId))errors.push(`mark must be one of: ${MARKS.join(', ')}.`);
 if(typeof gift!=='string'||!(gift in GIFTS))errors.push('gift must be reveal, grow, echo, or mend.'); if(typeof burden!=='string'||!(burden in BURDENS))errors.push('burden must be fragile, loud, rooted, or fading.'); if(typeof quirk!=='string'||!(quirk in QUIRKS))errors.push('quirk must be moon-touched, rain-kin, curious, or shy.');
 if(errors.length)return{ok:false,errors};
 return{ok:true,character:{version:1,name,description,appearance:{body:body as BodyId,material:material as MaterialId,palette:palette as PaletteId,mark:mark as MarkId},gift:GIFTS[gift as GiftId],burden:BURDENS[burden as BurdenId],quirk:QUIRKS[quirk as QuirkId]}};
}
const names=['Morrow','Pip','Sable','Luma','Tatter','Nim']; const subjects=['remembers vanished roads','collects rain that never fell','sings to sleeping doorways','keeps promises in tiny jars'];
function rng(seed:number){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function generateCharacter(seed:number):Character{const r=rng(seed);const pick=<T>(a:readonly T[])=>a[Math.floor(r()*a.length)] as T;const body=pick(BODIES),material=pick(MATERIALS),palette=pick(PALETTES),mark=pick(MARKS),gift=pick(Object.keys(GIFTS) as GiftId[]),burden=pick(Object.keys(BURDENS) as BurdenId[]),quirk=pick(Object.keys(QUIRKS) as QuirkId[]);return{version:1,name:pick(names),description:`A ${material} ${body} that ${pick(subjects)}.`,appearance:{body,material,palette,mark},gift:GIFTS[gift],burden:BURDENS[burden],quirk:QUIRKS[quirk]}}
export const AI_CONTEXT_PACKET=`Create one original character for a peaceful discovery game. Output JSON only, with exactly this shape:\n{"version":1,"name":"1-24 characters","description":"1-180 characters","appearance":{"body":"fox|moth|bird|wisp","material":"porcelain|moss|paper|starlight","palette":"dusk|dawn|grove|tide","mark":"map-lines|stars|rings|cracks"},"gift":"reveal|grow|echo|mend","burden":"fragile|loud|rooted|fading","quirk":"moon-touched|rain-kin|curious|shy"}\nMake the description imaginative and connect the three traits thematically. Do not add statistics, powers, fields, markdown, or explanation. The game controls all numerical balance.`;
