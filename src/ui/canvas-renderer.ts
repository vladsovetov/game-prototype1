import { GIFTS, PALETTE_COLORS } from '../domain/catalog';
import { t } from '../i18n/messages';
import { anomalyNeedsHeldTool, fieldMarks, minimapFrame, navigationTarget, worldToMinimap } from '../domain/minimap';
import { relicTintFor } from '../domain/relics';
import type { BodyId, Facing, GameState, Point, WearableId } from '../domain/types';
import { SEED_NAMES, WORLD, worldFor, type WorldLayout } from '../domain/world';
import { expeditionMetaFor } from '../domain/expedition';

export function cameraFor(player: Point, width: number, height: number) {
  return {
    x: Math.max(0, Math.min(Math.max(0, WORLD.width - width), player.x - width / 2)),
    y: Math.max(0, Math.min(Math.max(0, WORLD.height - height), player.y - height / 2)),
  };
}

export function worldToScreen(point: Point, camera: Point) {
  return { x: point.x - camera.x, y: point.y - camera.y };
}

export interface MovementPose { facing: Facing; walking: boolean }
export function movementPose(dx: number, dy: number, previousFacing: Facing): MovementPose {
  if (!dx && !dy) return { facing: previousFacing, walking: false };
  if (Math.abs(dx) > Math.abs(dy)) return { facing: dx < 0 ? 'left' : 'right', walking: true };
  return { facing: dy < 0 ? 'up' : 'down', walking: true };
}

export interface AvatarVisualPlan{parts:string[];packLayer:'foreground'|'background'}
export function avatarVisualPlan(body:BodyId,facing:Facing,wearables:readonly WearableId[]):AvatarVisualPlan{
  return {
    parts:['shadow','legs','feet','arms','hands','torso','head',`signature-${body}`,facing==='up'?'back-of-head':'face',...wearables.map((item)=>`wearable-${item}`)],
    packLayer:facing==='up'?'foreground':'background',
  };
}
export function backHeadMark(){return{start:Math.PI*1.15,end:Math.PI*1.85}}

export function createCanvasRenderer(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Полотно Canvas 2D недоступне.');
  const ctx = context;
  let width = innerWidth;
  let height = innerHeight;
  let scale = devicePixelRatio || 1;
  let camera = { x: 0, y: 0 };

  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    scale = devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  };

  function blob(x: number, y: number, radius: number, color: string, points = 12, wobble = .09) {
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const angle = i / points * Math.PI * 2;
      const r = radius * (1 + Math.sin(i * 4.7 + x * .01) * wobble);
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawMeadow(now: number, world: WorldLayout) {
    const wash = ctx.createLinearGradient(0, 0, world.width, world.height);
    wash.addColorStop(0, world.theme.ground[0]);
    wash.addColorStop(.48, world.theme.ground[1]);
    wash.addColorStop(1, world.theme.ground[2]);
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, world.width, world.height);

    const washCenters = [{ x: 460, y: 940, r: 620 }, { x: 1580, y: 1220, r: 720 }, { x: 2650, y: 400, r: 620 }, { x: 2800, y: 1480, r: 530 }];
    washCenters.forEach((center, index) => blob(center.x, center.y, center.r, world.theme.washes[index]!, 18, .04));

    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const route of world.routes) {
      ctx.strokeStyle = world.theme.trail; ctx.lineWidth = 96;
      ctx.beginPath(); route.forEach((point,index)=>index?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y)); ctx.stroke();
      ctx.strokeStyle = '#fff2cf3f'; ctx.lineWidth = 56; ctx.stroke();
    }
    ctx.restore();

    drawScenery(world);

    for (let i = 0; i < world.grass.length; i++) {
      const { x, y } = world.grass[i]!;
      const sway = Math.sin(now / 900 + i) * 2;
      ctx.strokeStyle = i % 4 === 0 ? '#496f6290' : '#668c7490';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y + 7);
      ctx.quadraticCurveTo(x + sway, y, x + 3 + sway, y - 8 - i % 8);
      ctx.stroke();
      if (i % 7 === 0) {
        ctx.fillStyle = ['#f4ca71', '#f18d7e', '#e8ddf2'][i % 3]!;
        ctx.beginPath();
        ctx.arc(x + 3 + sway, y - 10 - i % 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawScenery(world: WorldLayout) {
    for (const item of world.scenery) {
      const { x, y } = item.position;
      const size = item.size;
      ctx.save(); ctx.translate(x,y); ctx.rotate(item.rotation ?? 0); ctx.lineCap='round'; ctx.lineJoin='round';
      if (item.kind === 'fruit-tree' || item.kind === 'pine') {
        ctx.fillStyle='#66513f'; ctx.fillRect(-size*.08,-size*.1,size*.16,size*.72);
        if(item.kind==='pine'){
          ctx.fillStyle='#416457';
          for(const [dy,w] of [[-.82,.55],[-.52,.72],[-.18,.9]] as const){ctx.beginPath();ctx.moveTo(0,size*dy);ctx.lineTo(-size*w,size*.34);ctx.lineTo(size*w,size*.34);ctx.closePath();ctx.fill()}
        }else{
          blob(0,-size*.28,size*.68,'#63805d',11,.1); blob(-size*.35,-size*.12,size*.45,'#729065',10,.1); blob(size*.36,-size*.08,size*.42,'#6e8a62',10,.1);
          ctx.fillStyle='#d78b55'; for(const offset of [-.3,.05,.34]){ctx.beginPath();ctx.arc(size*offset,-size*(.16+Math.abs(offset)),size*.075,0,Math.PI*2);ctx.fill()}
        }
      } else if(item.kind==='fence'||item.kind==='boardwalk'||item.kind==='dock'){
        ctx.strokeStyle=item.kind==='fence'?'#785e46':'#76634f';ctx.lineWidth=item.kind==='fence'?7:14;
        ctx.beginPath();ctx.moveTo(-size/2,0);ctx.lineTo(size/2,0);ctx.stroke();
        for(const p of [-.42,-.14,.14,.42]){ctx.beginPath();ctx.moveTo(size*p,-size*.14);ctx.lineTo(size*p,size*.14);ctx.stroke()}
      } else if(item.kind==='water'){
        ctx.fillStyle='#70aeb7aa';ctx.beginPath();ctx.ellipse(0,0,size,size*.46,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d9efdf99';ctx.lineWidth=3;ctx.stroke();
      } else if(item.kind==='reeds'||item.kind==='dune-grass'){
        ctx.strokeStyle=item.kind==='reeds'?'#55785c':'#85865c';ctx.lineWidth=3;
        for(const p of [-.35,0,.35]){ctx.beginPath();ctx.moveTo(size*p,size*.4);ctx.quadraticCurveTo(size*(p+.1),0,size*(p+.16),-size*.6);ctx.stroke()}
      } else if(item.kind==='boulder'){
        blob(0,0,size,'#77786d',8,.12);ctx.strokeStyle='#a7a899';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-size*.4,-size*.2);ctx.lineTo(size*.1,-size*.45);ctx.stroke();
      } else if(item.kind==='shed'||item.kind==='weather-station'){
        ctx.fillStyle=item.kind==='shed'?'#805e45':'#d6d0b9';ctx.fillRect(-size*.45,-size*.35,size*.9,size*.75);ctx.fillStyle='#60473b';ctx.beginPath();ctx.moveTo(-size*.58,-size*.35);ctx.lineTo(0,-size*.75);ctx.lineTo(size*.58,-size*.35);ctx.closePath();ctx.fill();
        if(item.kind==='weather-station'){ctx.strokeStyle='#405d5e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-size*.72);ctx.lineTo(0,-size*1.2);ctx.stroke();ctx.beginPath();ctx.arc(0,-size*1.2,size*.18,0,Math.PI*2);ctx.stroke()}
      } else if(item.kind==='shore'){
        ctx.fillStyle='#e5c888';ctx.beginPath();ctx.ellipse(0,0,size,size*.34,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#6ba5aa';ctx.beginPath();ctx.ellipse(size*.12,size*.18,size*.82,size*.22,0,0,Math.PI*2);ctx.fill();
      } else if(item.kind==='boat'){
        ctx.fillStyle='#8a6547';ctx.beginPath();ctx.moveTo(-size*.7,-size*.18);ctx.lineTo(size*.7,-size*.18);ctx.lineTo(size*.45,size*.26);ctx.lineTo(-size*.45,size*.26);ctx.closePath();ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSanctuary(world: WorldLayout) {
    ctx.save();
    ctx.fillStyle = '#f4e5bf7d';
    ctx.beginPath();
    ctx.roundRect(world.sanctuary.x, world.sanctuary.y, world.sanctuary.w, world.sanctuary.h, 70);
    ctx.fill();
    ctx.strokeStyle = '#fff4d090';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 14]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#315c55';
    ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText(t('quietRefuge'), 132, 156);
    ctx.restore();

    for (const plot of world.plots) {
      ctx.save();
      ctx.translate(plot.position.x, plot.position.y);
      ctx.fillStyle = '#6d8871';
      ctx.beginPath();
      ctx.ellipse(0, 5, 61, 39, -.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5e8c09c';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
      const seed = stateForRender?.plantings[plot.id];
      if (!seed && stateForRender?.seeds.length) drawPlantBadge(26, -28);
      if (seed) {
        ctx.strokeStyle = '#426d55';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.quadraticCurveTo(-8, -24, 4, -49);
        ctx.stroke();
        blob(-10, -47, 19, '#f0b95f', 7, .12);
        blob(12, -55, 16, '#e77e77', 7, .12);
        ctx.fillStyle = '#31564d';
        ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(SEED_NAMES[seed] ?? seed, 0, 64);
      }
      ctx.restore();
    }
    const projects=stateForRender?expeditionMetaFor(stateForRender).builtProjects:[];
    if(projects.includes('workshop')){
      ctx.save();ctx.translate(690,225);ctx.fillStyle='#765940';ctx.fillRect(-65,-28,130,56);ctx.fillStyle='#ead3a0';ctx.fillRect(-55,-38,110,15);ctx.strokeStyle='#4f4136';ctx.lineWidth=7;for(const x of [-48,48]){ctx.beginPath();ctx.moveTo(x,26);ctx.lineTo(x,55);ctx.stroke()}ctx.fillStyle='#f2bd58';ctx.beginPath();ctx.arc(0,-58,12,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if(projects.includes('archive')){
      ctx.save();ctx.translate(690,405);ctx.fillStyle='#f2e4bc';ctx.strokeStyle='#526b61';ctx.lineWidth=5;ctx.fillRect(-52,-48,104,96);ctx.strokeRect(-52,-48,104,96);ctx.fillStyle='#cb765e';for(const y of [-28,-5,18])ctx.fillRect(-37,y,74,9);ctx.restore();
    }
    if(projects.includes('guest-canopy')){
      ctx.save();ctx.translate(675,575);ctx.strokeStyle='#5d5141';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-55,35);ctx.lineTo(-45,-45);ctx.moveTo(55,35);ctx.lineTo(45,-45);ctx.stroke();ctx.fillStyle='#d7896f';ctx.beginPath();ctx.moveTo(-72,-37);ctx.quadraticCurveTo(0,-78,72,-37);ctx.lineTo(56,-5);ctx.quadraticCurveTo(0,-34,-56,-5);ctx.closePath();ctx.fill();ctx.restore();
    }
  }

  function drawTakeBadge(x: number, y: number) {
    ctx.fillStyle = '#3d7d72';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eef8f2';
    ctx.beginPath();
    ctx.roundRect(x - 3.2, y - 1, 7.2, 7.4, 2.2);
    ctx.fill();
    for (const offset of [-4.6, -1.5, 1.6, 4.6]) {
      ctx.beginPath();
      ctx.roundRect(x + offset - 1.15, y - 7.2, 2.3, 7.4, 1.1);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(x - 6.2, y + 2.2, 2.3, 3.4, -.7, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlantBadge(x: number, y: number) {
    ctx.fillStyle = '#3d7d72';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eef8f2';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.quadraticCurveTo(x - 1, y, x, y - 4);
    ctx.stroke();
    ctx.fillStyle = '#eef8f2';
    ctx.beginPath();
    ctx.ellipse(x - 4.2, y - 1.5, 4.2, 2.4, -.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 4.2, y - 2.4, 4.2, 2.4, .65, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawToolBadge(x: number, y: number, ready: boolean) {
    ctx.fillStyle = ready ? '#d66a32' : '#c56a3c';
    ctx.beginPath();
    ctx.roundRect(x - 11, y - 11, 22, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#fff6e4';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 6);
    ctx.lineTo(x + 5, y - 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 5, y - 5, 3.2, -0.4, Math.PI * 1.2);
    ctx.stroke();
  }

  function drawFixedBadge(x: number, y: number) {
    ctx.fillStyle = '#4f8a6e';
    ctx.beginPath();
    ctx.roundRect(x - 11, y - 11, 22, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#eef8f2';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 5.5, y + .5);
    ctx.lineTo(x - 1.2, y + 5);
    ctx.lineTo(x + 6.2, y - 5);
    ctx.stroke();
  }

  function drawShrines(state: GameState, now: number, world: WorldLayout) {
    const colors = { reveal: '#f0a574', grow: '#76a96f', echo: '#9b82c1', mend: '#63aaa7' };
    for (const shrine of world.shrines) {
      const active = state.borrowedGift === shrine.gift;
      const pulse = Math.sin(now / 520 + shrine.position.x) * 2;
      ctx.save();
      ctx.translate(shrine.position.x, shrine.position.y);
      ctx.fillStyle = '#4f8f8633';
      ctx.beginPath();
      ctx.ellipse(0, 8, 46, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = active ? '#6a8f84' : '#3d7d72';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 2, 54 + pulse, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle='#654f3d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-27,10);ctx.lineTo(-23,39);ctx.moveTo(27,10);ctx.lineTo(23,39);ctx.stroke();
      ctx.fillStyle = active ? '#ffe89d' : '#9b7757';ctx.fillRect(-38,-4,76,19);
      ctx.fillStyle=colors[shrine.gift];
      if(shrine.gift==='reveal'){ctx.fillRect(-9,-25,18,20);ctx.beginPath();ctx.arc(0,-25,9,Math.PI,0);ctx.fill()}
      else if(shrine.gift==='grow'){ctx.lineWidth=6;ctx.strokeStyle=colors.grow;ctx.beginPath();ctx.moveTo(-15,-18);ctx.lineTo(15,2);ctx.moveTo(15,-18);ctx.lineTo(-15,2);ctx.stroke()}
      else if(shrine.gift==='echo'){ctx.lineWidth=4;ctx.strokeStyle=colors.echo;ctx.beginPath();ctx.moveTo(-10,-27);ctx.lineTo(-10,0);ctx.moveTo(10,-27);ctx.lineTo(10,0);ctx.moveTo(-10,-27);ctx.lineTo(10,-27);ctx.stroke()}
      else {ctx.fillRect(-17,-23,34,25);ctx.fillStyle='#fff7df';ctx.fillRect(-7,-16,14,4)}
      if (!active) drawTakeBadge(30, -36);
      ctx.restore();
      ctx.fillStyle = '#31554f';
      ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(GIFTS[shrine.gift].name.toLocaleUpperCase('uk-UA'), shrine.position.x, shrine.position.y + 68);
    }
  }

  function drawAnomalies(state: GameState, now: number, world: WorldLayout) {
    for (let index = 0; index < world.anomalies.length; index++) {
      const anomaly = world.anomalies[index]!;
      const stage = state.anomalies[anomaly.id] ?? 0;
      const ready = anomalyNeedsHeldTool(state, anomaly);
      const finished = !anomaly.transitions[stage];
      const pulse = finished ? 0 : Math.sin(now / 520 + index * 1.7) * (ready ? 5 : 3);
      ctx.save();
      ctx.translate(anomaly.position.x, anomaly.position.y);
      ctx.shadowColor = finished ? '#4f8a6e' : ready ? '#e08a3a' : anomaly.color;
      ctx.shadowBlur = finished ? 8 : ready ? 28 : 16 + stage * 4;
      ctx.fillStyle=finished?'#4f8a6e28':`${anomaly.color}35`;ctx.beginPath();ctx.arc(0,0,43+stage*5+pulse,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = finished ? '#4f8a6e' : ready ? '#e39a4a' : '#c47a48';
      ctx.lineWidth = ready && !finished ? 4 : 3;
      ctx.setLineDash(finished || ready ? [] : [5, 6]);
      const ring = 46 + stage * 4 + pulse;
      ctx.beginPath();
      ctx.ellipse(0, -4, ring + 4, ring - 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      drawFieldObject(anomaly.id, stage, anomaly.color);
      if (finished) drawFixedBadge(32, -40);
      else drawToolBadge(32, -40, ready);
      ctx.fillStyle = '#294d47';
      ctx.font = '700 13px Avenir, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(anomaly.states[stage] ?? anomaly.name, 0, ring + 28);
      ctx.restore();
    }
  }

  function drawFieldObject(id:string,stage:number,color:string){
    ctx.strokeStyle='#3c514a';ctx.fillStyle=color;ctx.lineWidth=6;ctx.lineCap='round';ctx.lineJoin='round';
    if(id==='sign'){ctx.fillRect(-5,-35,10,70);ctx.beginPath();ctx.moveTo(-32,-30);ctx.lineTo(30,-30);ctx.lineTo(39,-20);ctx.lineTo(30,-10);ctx.lineTo(-32,-10);ctx.closePath();ctx.fill();if(stage>1){ctx.fillStyle='#f0d28e';ctx.fillRect(-3,-34,6,68)}}
    else if(id==='pool'){ctx.beginPath();ctx.arc(-5,10,28,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-5,-17);ctx.lineTo(-5,-47);ctx.lineTo(20,-47);ctx.lineTo(20,-30);ctx.stroke();if(stage) {ctx.fillStyle='#70b4bd';ctx.beginPath();ctx.arc(23,-21,5,0,Math.PI*2);ctx.fill()}}
    else if(id==='root'){ctx.fillStyle='#5f7154';ctx.fillRect(-35,-40,70,76);ctx.fillStyle=stage>1?'#e7c985':'#253b35';ctx.fillRect(-20,-24,40,60);ctx.strokeStyle='#77905e';for(const x of [-28,28]){ctx.beginPath();ctx.moveTo(x,25);ctx.quadraticCurveTo(x*1.4,-5,x*.7,-45);ctx.stroke()}}
    else if(id==='bell'){ctx.beginPath();ctx.moveTo(-25,15);ctx.quadraticCurveTo(-19,-33,0,-38);ctx.quadraticCurveTo(19,-33,25,15);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-30,16);ctx.lineTo(30,16);ctx.stroke();ctx.fillStyle='#5b493c';ctx.beginPath();ctx.arc(0,24,6,0,Math.PI*2);ctx.fill()}
    else if(id==='moth'){ctx.fillStyle='#efe1bd';for(const r of [-.1,.06,.2]){ctx.save();ctx.rotate(r);ctx.fillRect(-29,-22,58,44);ctx.strokeRect(-29,-22,58,44);ctx.restore()}ctx.strokeStyle='#8c7355';ctx.lineWidth=2;for(const y of [-10,0,10]){ctx.beginPath();ctx.moveTo(-20,y);ctx.lineTo(18,y);ctx.stroke()}}
    else if(id==='moon'){ctx.fillRect(-22,-25,44,48);ctx.strokeRect(-22,-25,44,48);ctx.strokeStyle='#5b493c';ctx.beginPath();ctx.moveTo(-15,-25);ctx.lineTo(-7,-42);ctx.lineTo(7,-42);ctx.lineTo(15,-25);ctx.stroke();if(stage){ctx.fillStyle='#ffe98c';ctx.beginPath();ctx.arc(0,-2,15,0,Math.PI*2);ctx.fill()}}
    else if(id==='garden'){ctx.strokeStyle='#557351';ctx.lineWidth=5;for(const x of [-22,0,22]){ctx.beginPath();ctx.moveTo(x,26);ctx.quadraticCurveTo(x-8,0,x+3,-29-stage*4);ctx.stroke();ctx.fillStyle='#d8a35e';ctx.beginPath();ctx.arc(x+3,-29-stage*4,8,0,Math.PI*2);ctx.fill()}}
    else {ctx.strokeStyle='#48534d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,29);ctx.lineTo(0,-45);ctx.moveTo(-18,-35);ctx.lineTo(18,-35);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-35,12+stage*3,0,Math.PI*2);ctx.stroke()}
  }

  function drawTrail(state: GameState, now: number, waypoint?: Point) {
    const target = navigationTarget(state, waypoint);
    if (!target) return;
    const dx = target.x - state.player.x;
    const dy = target.y - state.player.y;
    const length = Math.hypot(dx, dy);
    const count = Math.max(4, Math.min(12, Math.floor(length / 55)));
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const drift = Math.sin(now / 360 + i * 1.4) * 8;
      const x = state.player.x + dx * t + (-dy / length) * drift;
      const y = state.player.y + dy * t + (dx / length) * drift;
      const alpha = .45 + Math.sin(now / 260 + i) * .18;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(now / 1200 + i);
      ctx.shadowColor = '#ffdf78';
      ctx.shadowBlur = 18;
      ctx.fillStyle = `rgba(255, 229, 139, ${alpha})`;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    ctx.strokeStyle = '#fff0a2aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(target.x, target.y, 62 + Math.sin(now / 350) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawAvatar(state: GameState, now: number, pose:MovementPose) {
    const point = worldToScreen(state.player, camera);
    const [base, accent] = PALETTE_COLORS[state.character.appearance.palette];
    ctx.save();
    const bob=pose.walking?Math.abs(Math.sin(now/120))*2:0;
    const swing=pose.walking?Math.sin(now/115)*8:0;
    const side=pose.facing==='left'?-1:pose.facing==='right'?1:0;
    const isBack=pose.facing==='up';
    const body=state.character.appearance.body;
    const plan=avatarVisualPlan(body,pose.facing,Object.values(state.equipped).filter((item):item is WearableId=>!!item));
    ctx.translate(point.x, point.y-bob);
    ctx.globalAlpha = state.effects.fadingUntil > now ? .52 : 1;

    ctx.fillStyle = '#24463d35';
    ctx.beginPath();
    ctx.ellipse(0, 30, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const outline='#243f39';ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
    const tint=(id:WearableId,fallback:string)=>relicTintFor(state,id,fallback);
    const drawPack=()=>{const packX=side?-side*16:0;ctx.fillStyle=tint('canvas-pack','#9b744d');ctx.strokeStyle=outline;ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(packX-20,-25,40,43,9);ctx.fill();ctx.stroke();ctx.fillStyle='#d8af72';ctx.fillRect(packX-13,-18,26,5)};
    const drawCloak=()=>{ctx.fillStyle=tint('storm-cloak','#4d5f6a');ctx.strokeStyle=outline;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-16,-20);ctx.quadraticCurveTo(side?-side*28:0,8,side?-side*22: -20,28);ctx.lineTo(side?side*22:20,28);ctx.quadraticCurveTo(side?side*28:0,8,16,-20);ctx.closePath();ctx.fill();ctx.stroke()};

    // Species silhouettes are deliberately drawn behind the limbs and torso so
    // turning never replaces one creature with the generic body shape.
    if(body==='fox'){
      ctx.fillStyle=accent;ctx.strokeStyle=outline;ctx.lineWidth=4;ctx.beginPath();
      const tailX=side?-side*18:22;ctx.moveTo(tailX,5);ctx.quadraticCurveTo(tailX+side*20+(side?0:18),-3,tailX+side*25+(side?0:13),16);ctx.quadraticCurveTo(tailX+side*8,25,tailX-5,14);ctx.closePath();ctx.fill();ctx.stroke();
    }else if(body==='moth'){
      ctx.fillStyle=`${accent}c7`;ctx.strokeStyle=outline;ctx.lineWidth=3;
      for(const wing of [-1,1]){ctx.beginPath();ctx.moveTo(wing*10,-17);ctx.bezierCurveTo(wing*47,-39,wing*48,12,wing*14,16);ctx.quadraticCurveTo(wing*25,1,wing*10,-17);ctx.closePath();ctx.fill();ctx.stroke()}
    }else if(body==='bird'){
      ctx.fillStyle=accent;ctx.strokeStyle=outline;ctx.lineWidth=3;
      for(const wing of [-1,1]){ctx.beginPath();ctx.moveTo(wing*12,-16);ctx.quadraticCurveTo(wing*34,-6,wing*25,18);ctx.lineTo(wing*10,8);ctx.closePath();ctx.fill();ctx.stroke()}
      ctx.beginPath();ctx.moveTo(-10,14);ctx.lineTo(0,34);ctx.lineTo(10,14);ctx.closePath();ctx.fill();ctx.stroke();
    }else{
      ctx.strokeStyle=`${accent}aa`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-12,31+Math.sin(now/260)*2,0,Math.PI*2);ctx.stroke();
    }
    if(state.equipped.outer==='storm-cloak'&&!isBack)drawCloak();
    if(state.equipped.back==='canvas-pack'&&plan.packLayer==='background')drawPack();

    const legSwing=swing*.42;const leftFoot={x:-11+legSwing,y:32};const rightFoot={x:11-legSwing,y:32};
    ctx.strokeStyle=outline;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,10);ctx.lineTo(leftFoot.x,leftFoot.y-2);ctx.moveTo(8,10);ctx.lineTo(rightFoot.x,rightFoot.y-2);ctx.stroke();
    ctx.fillStyle=state.equipped.feet==='rubber-boots'?'#59664f':accent;ctx.strokeStyle=outline;ctx.lineWidth=3;
    for(const foot of [leftFoot,rightFoot]){ctx.beginPath();ctx.ellipse(foot.x+(side?side*2:0),foot.y,state.equipped.feet==='rubber-boots'?8:6,state.equipped.feet==='rubber-boots'?6:4,side*.12,0,Math.PI*2);ctx.fill();ctx.stroke()}

    const leftHand={x:-23-swing*.45,y:9};const rightHand={x:23+swing*.45,y:9};
    ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-14,-13);ctx.lineTo(leftHand.x,leftHand.y);ctx.moveTo(14,-13);ctx.lineTo(rightHand.x,rightHand.y);ctx.stroke();
    ctx.fillStyle=base;ctx.strokeStyle=outline;ctx.lineWidth=2;for(const hand of [leftHand,rightHand]){ctx.beginPath();ctx.arc(hand.x,hand.y,5,0,Math.PI*2);ctx.fill();ctx.stroke()}

    ctx.shadowColor='#1a3e3560';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.fillStyle=base;ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(-18,-23,36,42,13);ctx.fill();ctx.stroke();ctx.shadowColor='transparent';
    if(state.equipped.chest==='route-patches'){
      ctx.fillStyle=tint('route-patches','#c47a3a');
      for(const patch of [-8,2,8]){ctx.beginPath();ctx.roundRect(patch-5,-8,9,7,2);ctx.fill();ctx.strokeStyle=outline;ctx.lineWidth=2;ctx.stroke()}
    }
    if(state.equipped.outer==='storm-cloak'&&isBack)drawCloak();
    if(state.equipped.back==='canvas-pack'&&plan.packLayer==='foreground')drawPack();
    if(state.equipped.hand==='signal-lantern'){
      const lamp=rightHand;
      ctx.fillStyle=tint('signal-lantern','#d8af72');ctx.strokeStyle=outline;ctx.lineWidth=2;
      ctx.beginPath();ctx.roundRect(lamp.x-5,lamp.y-14,10,12,2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#f3e4b6aa';ctx.beginPath();ctx.arc(lamp.x,lamp.y-8,7+Math.sin(now/240)*1.4,0,Math.PI*2);ctx.fill();
    }

    const headX=side*4;ctx.fillStyle=base;ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.beginPath();ctx.arc(headX,-40,22,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(body==='fox'){
      ctx.fillStyle=base;for(const earX of [-13,13]){ctx.beginPath();ctx.moveTo(headX+earX-7,-53);ctx.lineTo(headX+earX,-73);ctx.lineTo(headX+earX+9,-53);ctx.closePath();ctx.fill();ctx.stroke()}
    }else if(body==='moth'){
      ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(headX-7,-59);ctx.quadraticCurveTo(headX-18,-75,headX-25,-66);ctx.moveTo(headX+7,-59);ctx.quadraticCurveTo(headX+18,-75,headX+25,-66);ctx.stroke();
    }else if(body==='bird'){
      ctx.fillStyle=accent;ctx.strokeStyle=outline;ctx.lineWidth=3;
      if(side){ctx.beginPath();ctx.moveTo(headX+side*19,-45);ctx.lineTo(headX+side*35,-39);ctx.lineTo(headX+side*19,-34);ctx.closePath();ctx.fill();ctx.stroke()}
      else if(!isBack){ctx.beginPath();ctx.moveTo(headX-7,-37);ctx.lineTo(headX,-27);ctx.lineTo(headX+7,-37);ctx.closePath();ctx.fill();ctx.stroke()}
      else{for(const feather of [-7,0,7]){ctx.beginPath();ctx.moveTo(headX+feather,-59);ctx.lineTo(headX+feather*.7,-69-Math.abs(feather)*.25);ctx.stroke()}}
    }else{
      ctx.fillStyle=accent;ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(headX-10,-58);ctx.quadraticCurveTo(headX-3,-72,headX,-63);ctx.quadraticCurveTo(headX+7,-78,headX+12,-57);ctx.closePath();ctx.fill();ctx.stroke();
    }
    if(isBack){const mark=backHeadMark();ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.beginPath();ctx.arc(headX,-39,11,mark.start,mark.end);ctx.stroke()}
    else{ctx.fillStyle=accent;const eyeY=-43;if(side){ctx.beginPath();ctx.arc(headX+side*9,eyeY,4,0,Math.PI*2);ctx.fill()}else{ctx.beginPath();ctx.arc(headX-8,eyeY,3.5,0,Math.PI*2);ctx.arc(headX+8,eyeY,3.5,0,Math.PI*2);ctx.fill()}}
    if(state.equipped.face==='wire-glasses'&&!isBack){
      ctx.strokeStyle=tint('wire-glasses','#5f7a8a');ctx.lineWidth=2;
      const eyeY=-43;
      if(side){ctx.beginPath();ctx.arc(headX+side*9,eyeY,6,0,Math.PI*2);ctx.stroke()}
      else{ctx.beginPath();ctx.arc(headX-8,eyeY,6,0,Math.PI*2);ctx.arc(headX+8,eyeY,6,0,Math.PI*2);ctx.moveTo(headX-2,eyeY);ctx.lineTo(headX+2,eyeY);ctx.stroke()}
    }

    if(state.equipped.back==='canvas-pack'&&!isBack){ctx.strokeStyle='#6f523b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-12,-18);ctx.quadraticCurveTo(-17,-1,-12,13);ctx.moveTo(12,-18);ctx.quadraticCurveTo(17,-1,12,13);ctx.stroke()}
    if(state.equipped.neck==='wool-scarf'){
      ctx.strokeStyle='#c76255';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-15,-25);ctx.lineTo(15,-25);ctx.stroke();ctx.lineWidth=6;const tailStart=side?-side*12:(isBack?-6:12);const tailEnd=side?-side*27:(isBack?6:23);ctx.beginPath();ctx.moveTo(tailStart,-24);ctx.lineTo(tailEnd,-8);ctx.stroke();
    }
    if(state.equipped.head==='field-hood'){
      ctx.fillStyle=tint('field-hood','#6d7a55');ctx.strokeStyle=outline;ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(headX-20,-48);ctx.quadraticCurveTo(headX,-78,headX+20,-48);ctx.quadraticCurveTo(headX, -36, headX-20,-48);ctx.fill();ctx.stroke();
    }else if(state.equipped.head==='rain-hat'){ctx.fillStyle='#d5a94e';ctx.beginPath();ctx.ellipse(headX,-60,29,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.roundRect(headX-16,-77,32,19,8);ctx.fill();ctx.stroke()}
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    const mark = state.character.appearance.mark;
    if (mark === 'rings') { ctx.beginPath(); ctx.arc(0, 11, 13, 0, Math.PI * 2); ctx.stroke(); }
    else if (mark === 'cracks' || state.effects.fragileUntil > now) { ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(4, 10); ctx.lineTo(-3, 20); ctx.stroke(); }
    else if (mark === 'map-lines') { ctx.beginPath(); ctx.moveTo(-16, 14); ctx.quadraticCurveTo(0, 0, 16, 14); ctx.stroke(); }
    else for (const x of [-12, 0, 12]) { ctx.beginPath(); ctx.arc(x, 12 + Math.abs(x) / 2, 2, 0, Math.PI * 2); ctx.fill(); }
    canvas.dataset.avatarParts=plan.parts.join(',');
    ctx.restore();
  }

  function drawMinimap(state: GameState, waypoint?: Point) {
    const touch = matchMedia('(max-width: 720px), (pointer: coarse)').matches;
    const frame = minimapFrame(width, height, touch);
    const world = worldFor(state);
    const marks = fieldMarks(state);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(frame.x, frame.y, frame.w, frame.h, [16, 5, 16, 5]);
    ctx.fillStyle = 'rgba(255, 249, 233, 0.92)';
    ctx.fill();
    ctx.strokeStyle = '#ffffffa0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.clip();
    const wash = ctx.createLinearGradient(frame.x, frame.y, frame.x + frame.w, frame.y + frame.h);
    wash.addColorStop(0, world.theme.ground[0]);
    wash.addColorStop(1, world.theme.ground[2]);
    ctx.globalAlpha = .55;
    ctx.fillStyle = wash;
    ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
    ctx.globalAlpha = 1;
    const sanctuary = worldToMinimap({ x: world.sanctuary.x, y: world.sanctuary.y }, world, frame);
    ctx.fillStyle = '#f4e5bfaa';
    ctx.fillRect(sanctuary.x, sanctuary.y, world.sanctuary.w / world.width * frame.w, world.sanctuary.h / world.height * frame.h);
    ctx.strokeStyle = '#fff2cf88';
    ctx.lineWidth = 1.5;
    for (const route of world.routes) {
      ctx.beginPath();
      route.forEach((point, index) => {
        const mapped = worldToMinimap(point, world, frame);
        if (index) ctx.lineTo(mapped.x, mapped.y);
        else ctx.moveTo(mapped.x, mapped.y);
      });
      ctx.stroke();
    }
    const view = {
      x: frame.x + (camera.x / world.width) * frame.w,
      y: frame.y + (camera.y / world.height) * frame.h,
      w: (width / world.width) * frame.w,
      h: (height / world.height) * frame.h,
    };
    ctx.strokeStyle = '#173f3a99';
    ctx.strokeRect(view.x, view.y, view.w, view.h);
    const colors = { tool: '#d66a32', use: '#3d7d72', plot: '#7aa36a', fixed: '#4f8a6e' };
    for (const mark of marks) {
      const point = worldToMinimap(mark.position, world, frame);
      ctx.fillStyle = mark.kind === 'tool' && mark.done ? colors.fixed : colors[mark.kind];
      ctx.globalAlpha = mark.kind === 'tool' && mark.done ? 1 : mark.done ? .35 : 1;
      ctx.beginPath();
      if (mark.kind === 'tool') ctx.roundRect(point.x - 3.5, point.y - 3.5, 7, 7, 1.5);
      else ctx.arc(point.x, point.y, mark.kind === 'use' ? 3.6 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (mark.ready) {
        ctx.strokeStyle = '#fff6d8';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    const you = worldToMinimap(state.player, world, frame);
    ctx.fillStyle = '#f2bd58';
    ctx.beginPath();
    ctx.arc(you.x, you.y, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff8de';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (waypoint) {
      const aim = worldToMinimap(waypoint, world, frame);
      ctx.strokeStyle = '#ffe58b';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(you.x, you.y);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#173f3a';
    ctx.font = '800 8px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(t('minimap'), frame.x + 8, frame.y + 14);
    ctx.fillStyle = '#d66a32';
    ctx.fillRect(frame.x + 8, frame.y + frame.h - 11, 6, 6);
    ctx.fillStyle = '#3d7d72';
    ctx.beginPath();
    ctx.arc(frame.x + 22, frame.y + frame.h - 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    canvas.dataset.minimap = `${Math.round(frame.x)},${Math.round(frame.y)},${frame.w},${frame.h}`;
    canvas.dataset.minimapMarks = JSON.stringify(marks.map((mark) => {
      const point = worldToMinimap(mark.position, world, frame);
      return { id: mark.id, kind: mark.kind, x: Math.round(point.x), y: Math.round(point.y) };
    }));
    canvas.dataset.fieldKinds = 'tool,use,plot';
  }

  let stateForRender: GameState | undefined;
  function render(state: GameState, now: number, pose:MovementPose={facing:'down',walking:false}, waypoint?: Point) {
    stateForRender = state;
    camera = cameraFor(state.player, width, height);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#9bbcaf';
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    const world = worldFor(state);
    drawMeadow(now, world);
    drawSanctuary(world);
    drawShrines(state, now, world);
    drawAnomalies(state, now, world);
    drawTrail(state, now, waypoint);
    ctx.restore();
    canvas.dataset.facing=pose.facing;canvas.dataset.walking=String(pose.walking);canvas.dataset.equipment=Object.values(state.equipped).sort().join(',');
    canvas.dataset.refugeProjects=expeditionMetaFor(state).builtProjects.join(',');
    drawAvatar(state, now, pose);
    drawMinimap(state, waypoint);
  }

  resize();
  return { resize, render, worldToScreen: (point: Point) => worldToScreen(point, camera) };
}
