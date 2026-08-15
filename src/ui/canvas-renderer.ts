import { PALETTE_COLORS } from '../domain/catalog';
import { tutorialTarget } from '../domain/tutorial';
import type { GameState, Point } from '../domain/types';
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

export function createCanvasRenderer(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');
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
    ctx.strokeStyle = world.theme.trail;
    ctx.lineWidth = 118;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(world.trail[0].x, world.trail[0].y);
    ctx.bezierCurveTo(world.trail[1].x, world.trail[1].y, world.trail[2].x, world.trail[2].y, world.trail[3].x, world.trail[3].y);
    ctx.stroke();
    ctx.strokeStyle = '#fff2cf3f';
    ctx.lineWidth = 72;
    ctx.stroke();
    ctx.restore();

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
    ctx.fillText('YOUR QUIET PATCH', 132, 156);
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
      ctx.rotate(Math.PI / 4);
      ctx.shadowColor = colors[shrine.gift];
      ctx.shadowBlur = active ? 28 : 13;
      ctx.fillStyle = active ? '#ffe89d' : colors[shrine.gift];
      ctx.fillRect(-21, -21, 42, 42);
      ctx.strokeStyle = '#fff7df';
      ctx.lineWidth = 3;
      ctx.strokeRect(-21, -21, 42, 42);
      ctx.restore();
      ctx.fillStyle = '#31554f';
      ctx.font = '700 10px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(shrine.gift.toUpperCase(), shrine.position.x, shrine.position.y + 54);
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
      blob(0, 0, 34 + stage * 8 + pulse, anomaly.color, 9, .13);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff5dcce';
      ctx.lineWidth = 2;
      ctx.setLineDash(stage ? [] : [3, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, 48 + stage * 8 + pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#294d47';
      ctx.font = '700 13px Avenir, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(anomaly.states[stage] ?? anomaly.name, 0, 70 + stage * 6);
      ctx.restore();
    }
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

  function drawAvatar(state: GameState, now: number) {
    const point = worldToScreen(state.player, camera);
    const [base, accent] = PALETTE_COLORS[state.character.appearance.palette];
    ctx.save();
    ctx.translate(point.x, point.y + Math.sin(now / 330) * 2);
    ctx.globalAlpha = state.effects.fadingUntil > now ? .52 : 1;

    ctx.fillStyle = '#24463d35';
    ctx.beginPath();
    ctx.ellipse(0, 30, 30, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#1a3e3560';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = base;
    ctx.strokeStyle = '#23423c';
    ctx.lineWidth = 3;
    const body = state.character.appearance.body;
    ctx.beginPath();
    if (body === 'fox') {
      ctx.moveTo(-23, -15); ctx.lineTo(-17, -43); ctx.lineTo(-3, -28); ctx.lineTo(15, -43); ctx.lineTo(23, -14); ctx.quadraticCurveTo(27, 23, 0, 31); ctx.quadraticCurveTo(-27, 23, -23, -15);
    } else if (body === 'moth') {
      ctx.ellipse(0, 0, 12, 30, 0, 0, Math.PI * 2); ctx.moveTo(-8, -8); ctx.bezierCurveTo(-52, -43, -52, 24, -12, 19); ctx.moveTo(8, -8); ctx.bezierCurveTo(52, -43, 52, 24, 12, 19);
    } else if (body === 'bird') {
      ctx.ellipse(-2, 0, 26, 31, 0, 0, Math.PI * 2); ctx.moveTo(17, -9); ctx.lineTo(40, 0); ctx.lineTo(17, 8);
    } else {
      ctx.moveTo(0, -39); ctx.bezierCurveTo(34, -24, 31, 20, 0, 35); ctx.bezierCurveTo(-31, 20, -34, -24, 0, -39);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(-8, -8, 4, 0, Math.PI * 2); ctx.arc(8, -8, 4, 0, Math.PI * 2); ctx.fill();
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
  function render(state: GameState, now: number) {
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
    drawAvatar(state, now);
  }

  resize();
  return { resize, render, worldToScreen: (point: Point) => worldToScreen(point, camera) };
}
