import type { GiftId, Point } from './types';
export const WORLD={width:3200,height:1800,sanctuary:{x:80,y:90,w:780,h:620},gate:{x:850,y:400}};
export interface Transition{gift:GiftId;to:string;message:string;seed?:string}
export interface Anomaly{id:string;name:string;position:Point;states:string[];transitions:Record<number,Transition>;color:string}
export const ANOMALIES:Anomaly[]=[
 {id:'stone',name:'Silent Stone',position:{x:1120,y:390},states:['Silent Stone','Humming Stone','Singing Tree'],transitions:{0:{gift:'echo',to:'Humming Stone',message:'A note older than footsteps wakes inside the stone.'},1:{gift:'grow',to:'Singing Tree',message:'The note takes root and opens into silver leaves.',seed:'singing-tree'}},color:'#8d83a4'},
 {id:'sign',name:'Covered Sign',position:{x:1700,y:280},states:['Covered Sign','Remembered Sign','Restored Waypost'],transitions:{0:{gift:'reveal',to:'Remembered Sign',message:'Names return to the rain-worn wood.'},1:{gift:'mend',to:'Restored Waypost',message:'The old road remembers where it was going.',seed:'waypost'}},color:'#d9a85f'},
 {id:'pool',name:'Dry Pool',position:{x:2300,y:450},states:['Dry Pool','Clear Pool','Whispering Pool'],transitions:{0:{gift:'mend',to:'Clear Pool',message:'Water stitches itself across the empty basin.'},1:{gift:'echo',to:'Whispering Pool',message:'The pool repeats a secret from tomorrow.',seed:'whisper-pool'}},color:'#5aa8a1'},
 {id:'root',name:'Tangled Root',position:{x:2790,y:720},states:['Tangled Root','Root Arch','Hidden Door'],transitions:{0:{gift:'grow',to:'Root Arch',message:'The roots lift, careful as old hands.'},1:{gift:'reveal',to:'Hidden Door',message:'A door appears where the shade was deepest.',seed:'hidden-door'}},color:'#79956b'},
 {id:'bell',name:'Sleepy Bell',position:{x:1350,y:1050},states:['Sleepy Bell','Rain Bell'],transitions:{0:{gift:'echo',to:'Rain Bell',message:'One clear note sends rings through the grass.',seed:'rain-bell'}},color:'#cf8063'},
 {id:'moth',name:'Folded Moth',position:{x:1950,y:1280},states:['Folded Moth','Paper Flock'],transitions:{0:{gift:'mend',to:'Paper Flock',message:'Creases become wings. The page takes flight.',seed:'paper-flock'}},color:'#d6ccb4'},
 {id:'moon',name:'Blank Moon',position:{x:2550,y:1350},states:['Blank Moon','Named Moon'],transitions:{0:{gift:'reveal',to:'Named Moon',message:'A small moon accepts the name you found for it.',seed:'named-moon'}},color:'#e0c47b'},
 {id:'garden',name:'Waiting Garden',position:{x:1120,y:1460},states:['Waiting Garden','Lantern Garden'],transitions:{0:{gift:'grow',to:'Lantern Garden',message:'Warm flowers unfold, each holding a pocket of dusk.',seed:'lantern-garden'}},color:'#b3bf72'}
];
export const SHRINES:{id:string;gift:GiftId;position:Point}[]=[{id:'shrine-grow',gift:'grow',position:{x:1030,y:600}},{id:'shrine-echo',gift:'echo',position:{x:2050,y:570}},{id:'shrine-mend',gift:'mend',position:{x:2460,y:900}},{id:'shrine-reveal',gift:'reveal',position:{x:1680,y:1150}}];
export const PLOTS=Array.from({length:6},(_,i)=>({id:`plot-${i+1}`,position:{x:230+(i%3)*190,y:300+Math.floor(i/3)*190}}));
export const SEED_NAMES:Record<string,string>={'singing-tree':'Singing Tree','waypost':'Remembered Waypost','whisper-pool':'Whispering Pool','hidden-door':'Little Hidden Door','rain-bell':'Rain Bell','paper-flock':'Paper Flock','named-moon':'Named Moon','lantern-garden':'Lantern Garden'};
export function distance(a:Point,b:Point){return Math.hypot(a.x-b.x,a.y-b.y)}
