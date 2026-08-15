import { GIFTS, PALETTE_COLORS } from '../domain/catalog';
import { tutorialTarget } from '../domain/tutorial';
import type { Facing, GameState, Point } from '../domain/types';
import { SEED_NAMES, WORLD, worldFor, type WorldLayout } from '../domain/world';

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
    ctx.fillText('ВАШ ТИХИЙ ПРИТУЛОК', 132, 156);
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
  }

  function drawShrines(state: GameState, now: number, world: WorldLayout) {
    const colors = { reveal: '#f0a574', grow: '#76a96f', echo: '#9b82c1', mend: '#63aaa7' };
    for (const shrine of world.shrines) {
      const active = state.borrowedGift === shrine.gift;
      const pulse = Math.sin(now / 420 + shrine.position.x) * 4;
      ctx.save();
      ctx.translate(shrine.position.x, shrine.position.y);
      ctx.fillStyle = `${colors[shrine.gift]}2e`;
      ctx.beginPath();
      ctx.arc(0, 0, 53 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = colors[shrine.gift];
      ctx.shadowBlur = active ? 28 : 13;
      ctx.strokeStyle='#654f3d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-27,10);ctx.lineTo(-23,39);ctx.moveTo(27,10);ctx.lineTo(23,39);ctx.stroke();
      ctx.fillStyle = active ? '#ffe89d' : '#9b7757';ctx.fillRect(-38,-4,76,19);
      ctx.fillStyle=colors[shrine.gift];
      if(shrine.gift==='reveal'){ctx.fillRect(-9,-25,18,20);ctx.beginPath();ctx.arc(0,-25,9,Math.PI,0);ctx.fill()}
      else if(shrine.gift==='grow'){ctx.lineWidth=6;ctx.strokeStyle=colors.grow;ctx.beginPath();ctx.moveTo(-15,-18);ctx.lineTo(15,2);ctx.moveTo(15,-18);ctx.lineTo(-15,2);ctx.stroke()}
      else if(shrine.gift==='echo'){ctx.lineWidth=4;ctx.strokeStyle=colors.echo;ctx.beginPath();ctx.moveTo(-10,-27);ctx.lineTo(-10,0);ctx.moveTo(10,-27);ctx.lineTo(10,0);ctx.moveTo(-10,-27);ctx.lineTo(10,-27);ctx.stroke()}
      else {ctx.fillRect(-17,-23,34,25);ctx.fillStyle='#fff7df';ctx.fillRect(-7,-16,14,4)}
      ctx.restore();
      ctx.fillStyle = '#31554f';
      ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(GIFTS[shrine.gift].name.toLocaleUpperCase('uk-UA'), shrine.position.x, shrine.position.y + 54);
    }
  }

  function drawAnomalies(state: GameState, now: number, world: WorldLayout) {
    for (let index = 0; index < world.anomalies.length; index++) {
      const anomaly = world.anomalies[index]!;
      const stage = state.anomalies[anomaly.id] ?? 0;
      const pulse = Math.sin(now / 520 + index * 1.7) * 3;
      ctx.save();
      ctx.translate(anomaly.position.x, anomaly.position.y);
      ctx.shadowColor = anomaly.color;
      ctx.shadowBlur = 20 + stage * 6;
      ctx.fillStyle=`${anomaly.color}35`;ctx.beginPath();ctx.arc(0,0,43+stage*5+pulse,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff5dcce';
      ctx.lineWidth = 2;
      ctx.setLineDash(stage ? [] : [3, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, 48 + stage * 8 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      drawFieldObject(anomaly.id, stage, anomaly.color);
      ctx.fillStyle = '#294d47';
      ctx.font = '700 13px Avenir, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(anomaly.states[stage] ?? anomaly.name, 0, 70 + stage * 6);
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

  function drawTrail(state: GameState, now: number) {
    const target = tutorialTarget(state);
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
    ctx.translate(point.x, point.y-bob);
    ctx.globalAlpha = state.effects.fadingUntil > now ? .52 : 1;

    ctx.fillStyle = '#24463d35';
    ctx.beginPath();
    ctx.ellipse(0, 30, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    const outline='#243f39';ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.lineCap='round';
    if(state.equipped.back==='canvas-pack'){ctx.fillStyle='#9b744d';const packX=side? -side*16:0;ctx.beginPath();ctx.roundRect(packX-19,-25,38,42,9);ctx.fill();ctx.stroke()}
    ctx.strokeStyle=outline;ctx.beginPath();ctx.moveTo(-9,11);ctx.lineTo(-10+swing*.42,31);ctx.moveTo(9,11);ctx.lineTo(10-swing*.42,31);ctx.stroke();
    if(state.equipped.feet==='rubber-boots'){ctx.strokeStyle='#5b644f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-10+swing*.42,24);ctx.lineTo(-12+swing*.42,33);ctx.moveTo(10-swing*.42,24);ctx.lineTo(12-swing*.42,33);ctx.stroke()}
    ctx.strokeStyle=outline;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-16,-13);ctx.lineTo(-22-swing*.45,10);ctx.moveTo(16,-13);ctx.lineTo(22+swing*.45,10);ctx.stroke();
    ctx.shadowColor='#1a3e3560';ctx.shadowBlur=12;ctx.shadowOffsetY=5;ctx.fillStyle=base;ctx.beginPath();ctx.roundRect(-18,-23,36,42,13);ctx.fill();ctx.stroke();ctx.shadowColor='transparent';
    ctx.fillStyle=base;ctx.beginPath();ctx.arc(side*4,-40,22,0,Math.PI*2);ctx.fill();ctx.stroke();
    const body=state.character.appearance.body;
    if(body==='fox'){ctx.beginPath();ctx.moveTo(-16,-54);ctx.lineTo(-12,-72);ctx.lineTo(-2,-57);ctx.moveTo(7,-58);ctx.lineTo(15,-72);ctx.lineTo(19,-52);ctx.fill();ctx.stroke()}
    else if(body==='moth'){ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-59);ctx.quadraticCurveTo(-18,-75,-24,-66);ctx.moveTo(7,-59);ctx.quadraticCurveTo(18,-75,24,-66);ctx.stroke()}
    else if(body==='bird'&&side){ctx.fillStyle=accent;ctx.beginPath();ctx.moveTo(side*21,-44);ctx.lineTo(side*35,-38);ctx.lineTo(side*21,-34);ctx.closePath();ctx.fill()}
    if(pose.facing!=='up'){ctx.fillStyle=accent;const eyeY=-43;const eyeGap=side?0:8;if(side){ctx.beginPath();ctx.arc(side*12,eyeY,4,0,Math.PI*2);ctx.fill()}else{ctx.beginPath();ctx.arc(-eyeGap,eyeY,3.5,0,Math.PI*2);ctx.arc(eyeGap,eyeY,3.5,0,Math.PI*2);ctx.fill()}}
    if(state.equipped.neck==='wool-scarf'){ctx.strokeStyle='#c76255';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-15,-25);ctx.lineTo(15,-25);ctx.stroke();ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(side? -side*12:12,-24);ctx.lineTo(side? -side*27:23,-8);ctx.stroke()}
    if(state.equipped.head==='rain-hat'){ctx.fillStyle='#d5a94e';ctx.beginPath();ctx.ellipse(side*3,-60,29,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=outline;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.roundRect(side*3-16,-77,32,19,8);ctx.fill();ctx.stroke()}
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    const mark = state.character.appearance.mark;
    if (mark === 'rings') { ctx.beginPath(); ctx.arc(0, 11, 13, 0, Math.PI * 2); ctx.stroke(); }
    else if (mark === 'cracks' || state.effects.fragileUntil > now) { ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(4, 10); ctx.lineTo(-3, 20); ctx.stroke(); }
    else if (mark === 'map-lines') { ctx.beginPath(); ctx.moveTo(-16, 14); ctx.quadraticCurveTo(0, 0, 16, 14); ctx.stroke(); }
    else for (const x of [-12, 0, 12]) { ctx.beginPath(); ctx.arc(x, 12 + Math.abs(x) / 2, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  let stateForRender: GameState | undefined;
  function render(state: GameState, now: number, pose:MovementPose={facing:'down',walking:false}) {
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
    drawTrail(state, now);
    ctx.restore();
    canvas.dataset.facing=pose.facing;canvas.dataset.walking=String(pose.walking);canvas.dataset.equipment=Object.values(state.equipped).sort().join(',');
    drawAvatar(state, now, pose);
  }

  resize();
  return { resize, render, worldToScreen: (point: Point) => worldToScreen(point, camera) };
}
