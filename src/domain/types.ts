export type GiftId='reveal'|'grow'|'echo'|'mend';
export type BurdenId='fragile'|'loud'|'rooted'|'fading';
export type QuirkId='moon-touched'|'rain-kin'|'curious'|'shy';
export type BodyId='fox'|'moth'|'bird'|'wisp';
export type MaterialId='porcelain'|'moss'|'paper'|'starlight';
export type PaletteId='dusk'|'dawn'|'grove'|'tide';
export type MarkId='map-lines'|'stars'|'rings'|'cracks';
export interface CatalogEntry<I extends string>{id:I;name:string;description:string}
export interface Appearance{body:BodyId;material:MaterialId;palette:PaletteId;mark:MarkId}
export interface Character{version:1;name:string;description:string;appearance:Appearance;gift:CatalogEntry<GiftId>;burden:CatalogEntry<BurdenId>;quirk:CatalogEntry<QuirkId>}
export interface Point{x:number;y:number}
export type TutorialStep='wake'|'move'|'gift'|'clue'|'resonate'|'combine'|'recovered'|'plant'|'remember'|'personalize'|'done';
export interface TutorialState{step:TutorialStep;targetAnomalyId:string;borrowedGift:GiftId;start:Point}
export interface GameState{version:1;character:Character;player:Point;worldSeed?:number;anomalies:Record<string,number>;discoveries:string[];seeds:string[];plantings:Record<string,string>;rewarded:string[];borrowedGift?:GiftId;tutorial?:TutorialState;memoryDetails?:Record<string,string>;pendingChapter?:string;endingSeen?:boolean;effects:{rootedUntil:number;fragileUntil:number;fadingUntil:number;awakeProps:string[]};lastUpdated:number}
export type InteractionResult={state:GameState;message:string;changed:boolean;kind?:'discovery'|'seed'|'info'};
