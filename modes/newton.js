// ============================================================
// Newton's Laws Simulator – PhysicsVerse
// Canvas-based 2D physics with elastic collisions, gravity,
// friction, force arrows, trails, and energy/momentum display.
// ============================================================

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  const G_SCALED        = 980;          // gravity in px/s²
  const RESTITUTION     = 0.85;         // wall bounce dampening
  const FLOOR_RATIO     = 0.80;         // floor at 80 % of canvas height
  const TRAIL_LENGTH    = 24;           // dots per object trail
  const GRID_SPACING    = 50;           // px between grid lines
  const ARROW_HEAD      = 10;           // px – arrow-head size
  const PRIMARY_BLUE    = '#4a90d9';    // var(--primary) fallback
  const COLLISION_FLASH = 6;            // frames of white flash

  // ── State ──────────────────────────────────────────────────
  let canvas, ctx;
  let W, H, floorY;
  let objects     = [];
  let running     = false;
  let animFrameId = null;
  let lastTime    = 0;

  // Visual effects state
  let particles      = [];
  let floatingTexts  = [];
  let defaultsPlaced = false;

  // ── Helpers ────────────────────────────────────────────────
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function vec2Len(x, y) { return Math.sqrt(x * x + y * y); }

  function getPrimary() {
    try {
      const v = getComputedStyle(document.documentElement)
                  .getPropertyValue('--primary').trim();
      return v || PRIMARY_BLUE;
    } catch (_) { return PRIMARY_BLUE; }
  }

  // ── Object factory ────────────────────────────────────────
  function createObject(type, x, y, mass, radius, color) {
    return {
      type,
      x, y,
      vx: 0, vy: 0,
      mass,
      radius: radius || (type === 'ball' ? 15 + mass : 12 + mass),
      color,
      trail: [],               // [{x,y}]
      flashTimer: 0            // collision flash countdown
    };
  }

  // ── Default scene ─────────────────────────────────────────
  function placeDefaults() {
    if (W < 50) return;
    objects = [];
    const yPos = floorY - 35;
    objects.push(createObject('ball', W * 0.25, yPos, 5,  20, '#3b82f6'));   // blue
    objects.push(createObject('ball', W * 0.60, yPos, 10, 30, '#ef4444'));   // red
    defaultsPlaced = true;
  }

  // ── Drawing helpers ───────────────────────────────────────

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,200,0.12)';
    ctx.lineWidth   = 1;
    for (let x = GRID_SPACING; x < W; x += GRID_SPACING) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = GRID_SPACING; y < H; y += GRID_SPACING) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloor() {
    ctx.save();
    // main floor line
    ctx.strokeStyle = 'rgba(120,120,140,0.45)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(W, floorY);
    ctx.stroke();
    // hatching below floor
    ctx.strokeStyle = 'rgba(120,120,140,0.18)';
    ctx.lineWidth   = 1;
    for (let x = -H; x < W + H; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + (H - floorY), H);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTrails() {
    for (const obj of objects) {
      if (obj.trail.length < 2) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(obj.trail[0].x, obj.trail[0].y);
      for (let i = 1; i < obj.trail.length; i++) {
        ctx.lineTo(obj.trail[i].x, obj.trail[i].y);
      }
      ctx.strokeStyle = hexAlpha(obj.color, 0.22);
      ctx.lineWidth = obj.radius * 0.45;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    ctx.save();
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = hexAlpha(p.color, p.alpha);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloatingTexts() {
    ctx.save();
    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
      ctx.font = 'bold 11px "Orbitron", sans-serif';
      ctx.fillStyle = hexAlpha(ft.color, ft.alpha);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  function drawObject(obj) {
    ctx.save();

    // shadow / glow
    ctx.shadowColor   = obj.flashTimer > 0 ? 'rgba(255,255,255,0.9)' : hexAlpha(obj.color, 0.45);
    ctx.shadowBlur    = obj.flashTimer > 0 ? 22 : 14;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    if (obj.type === 'ball') {
      // gradient fill
      const grad = ctx.createRadialGradient(
        obj.x - obj.radius * 0.3, obj.y - obj.radius * 0.3, obj.radius * 0.1,
        obj.x, obj.y, obj.radius
      );
      const baseColor = obj.flashTimer > 0 ? '#ffffff' : obj.color;
      grad.addColorStop(0, lighten(baseColor, 60));
      grad.addColorStop(0.7, baseColor);
      grad.addColorStop(1, darken(baseColor, 30));
      ctx.beginPath();
      ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // subtle outline
      ctx.lineWidth   = 1.5;
      ctx.strokeStyle = darken(baseColor, 40);
      ctx.stroke();
    } else {
      // block
      const s = obj.radius * 1.6;  // side length
      const baseColor = obj.flashTimer > 0 ? '#ffffff' : obj.color;
      const grad = ctx.createLinearGradient(obj.x - s / 2, obj.y - s / 2, obj.x + s / 2, obj.y + s / 2);
      grad.addColorStop(0, lighten(baseColor, 50));
      grad.addColorStop(1, darken(baseColor, 20));
      ctx.fillStyle   = grad;
      ctx.strokeStyle = darken(baseColor, 40);
      ctx.lineWidth   = 1.5;
      const rx = 4; // corner radius
      roundRect(ctx, obj.x - s / 2, obj.y - s / 2, s, s, rx);
      ctx.fill();
      ctx.stroke();
    }

    // mass label
    ctx.shadowColor = 'transparent';
    ctx.fillStyle   = '#fff';
    ctx.font        = `bold ${Math.max(10, obj.radius * 0.6)}px "Segoe UI", sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${obj.mass}`, obj.x, obj.y);

    ctx.restore();
  }

  function drawForceArrow(obj) {
    const speed = vec2Len(obj.vx, obj.vy);
    if (speed < 1) return;

    const maxLen = 60;
    const len    = clamp(speed * 0.35, 8, maxLen);
    const angle  = Math.atan2(obj.vy, obj.vx);

    const sx = obj.x + Math.cos(angle) * (obj.radius + 4);
    const sy = obj.y + Math.sin(angle) * (obj.radius + 4);
    const ex = sx + Math.cos(angle) * len;
    const ey = sy + Math.sin(angle) * len;

    const primary = getPrimary();

    ctx.save();
    ctx.strokeStyle = primary;
    ctx.fillStyle   = primary;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';

    // shaft
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // arrowhead
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(
      ex - ARROW_HEAD * Math.cos(angle - Math.PI / 6),
      ey - ARROW_HEAD * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      ex - ARROW_HEAD * Math.cos(angle + Math.PI / 6),
      ey - ARROW_HEAD * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEnergyMomentum() {
    let ke = 0;
    let px = 0, py = 0;
    for (const o of objects) {
      const v2 = o.vx * o.vx + o.vy * o.vy;
      ke += 0.5 * o.mass * v2;
      px += o.mass * o.vx;
      py += o.mass * o.vy;
    }
    const momentum = vec2Len(px, py);

    ctx.save();
    // background panel
    const panelW = 230, panelH = 62, pad = 14;
    const bx = W - panelW - pad, by = pad;
    ctx.fillStyle = 'rgba(15,15,30,0.65)';
    roundRect(ctx, bx, by, panelW, panelH, 8);
    ctx.fill();

    ctx.font         = '13px "Segoe UI", Consolas, monospace';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle    = '#c0d0ff';
    ctx.fillText(`⚡ Kinetic Energy: ${ke.toFixed(1)}`, bx + 12, by + 12);
    ctx.fillText(`🔀 Momentum:       ${momentum.toFixed(1)}`, bx + 12, by + 34);
    ctx.restore();
  }

  // ── Color utilities ───────────────────────────────────────
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }

  function rgbToHex(r,g,b) {
    return '#' + [r,g,b].map(c => clamp(Math.round(c),0,255).toString(16).padStart(2,'0')).join('');
  }

  function lighten(hex, amt) {
    const [r,g,b] = hexToRgb(hex);
    return rgbToHex(r+amt, g+amt, b+amt);
  }

  function darken(hex, amt) {
    return lighten(hex, -amt);
  }

  function hexAlpha(hex, a) {
    const [r,g,b] = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ── Rounded rect helper ───────────────────────────────────
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // ── Physics ───────────────────────────────────────────────

  let simFriction = 0.3;
  let simGravity  = false;

  function physicsStep(dt) {
    if (dt > 0.1) dt = 0.1; // cap large gaps

    for (const obj of objects) {
      // ── gravity ────────────────────────
      if (simGravity) {
        obj.vy += G_SCALED * dt;
      }

      // ── friction (kinetic, horizontal on floor or always if no gravity) ──
      const speed = vec2Len(obj.vx, obj.vy);
      if (speed > 0.5) {
        const frictionDecel = simFriction * (simGravity ? G_SCALED : 400) * dt;
        const ratio = Math.max(0, 1 - frictionDecel / speed);
        obj.vx *= ratio;
        obj.vy *= ratio;
      } else if (speed > 0) {
        // near-rest damping
        obj.vx *= 0.9;
        obj.vy *= 0.9;
      }

      // ── integrate ─────────────────────
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;

      // ── trail ─────────────────────────
      obj.trail.push({ x: obj.x, y: obj.y });
      if (obj.trail.length > TRAIL_LENGTH) obj.trail.shift();

      // ── flash timer ───────────────────
      if (obj.flashTimer > 0) obj.flashTimer--;

      // ── wall collisions ───────────────
      const r = obj.radius;

      // left / right walls
      if (obj.x - r < 0)  { obj.x = r;       obj.vx = Math.abs(obj.vx) * RESTITUTION; }
      if (obj.x + r > W)  { obj.x = W - r;   obj.vx = -Math.abs(obj.vx) * RESTITUTION; }

      // ceiling
      if (obj.y - r < 0)  { obj.y = r;        obj.vy = Math.abs(obj.vy) * RESTITUTION; }

      // floor
      if (obj.y + r > floorY) {
        obj.y  = floorY - r;
        obj.vy = -Math.abs(obj.vy) * RESTITUTION;
        // extra floor friction
        obj.vx *= (1 - simFriction * 0.5);
        if (Math.abs(obj.vy) < 15) obj.vy = 0;
      }
    }

    // ── Object-object collisions ────────
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        resolveCollision(objects[i], objects[j]);
      }
    }

    // update spark particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (simGravity) p.vy += 150 * dt;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // update floating texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 25 * dt;
      ft.alpha -= 1.8 * dt;
      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }
  }

  function resolveCollision(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = vec2Len(dx, dy);
    const minDist = a.radius + b.radius;

    if (dist >= minDist || dist === 0) return;

    // normal vector
    const nx = dx / dist;
    const ny = dy / dist;

    // separate objects (push apart)
    const overlap = minDist - dist;
    const totalMass = a.mass + b.mass;
    a.x -= nx * overlap * (b.mass / totalMass);
    a.y -= ny * overlap * (b.mass / totalMass);
    b.x += nx * overlap * (a.mass / totalMass);
    b.y += ny * overlap * (a.mass / totalMass);

    // relative velocity along normal
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dvDotN = dvx * nx + dvy * ny;

    // only resolve if objects are moving towards each other
    if (dvDotN <= 0) return;

    // elastic collision impulse
    const impulse = (2 * dvDotN) / totalMass;

    a.vx -= impulse * b.mass * nx;
    a.vy -= impulse * b.mass * ny;
    b.vx += impulse * a.mass * nx;
    b.vy += impulse * a.mass * ny;

    // collision flash
    a.flashTimer = COLLISION_FLASH;
    b.flashTimer = COLLISION_FLASH;

    // Spawning sparks (particles) at the collision point
    const cx = a.x + nx * a.radius;
    const cy = a.y + ny * a.radius;
    const sparkCount = 12;
    for (let k = 0; k < sparkCount; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 40;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? a.color : b.color,
        alpha: 1.0,
        size: Math.random() * 3 + 1,
        decay: Math.random() * 0.05 + 0.03
      });
    }

    // Spawning floating force text
    const forceVal = (impulse * a.mass * b.mass * 0.15).toFixed(0);
    floatingTexts.push({
      x: cx,
      y: cy - 10,
      text: `💥 F = ${forceVal} N`,
      alpha: 1.0,
      color: '#ffc73c'
    });
  }

  // ── Render loop ───────────────────────────────────────────

  function render(timestamp) {
    if (!running) return;
    animFrameId = requestAnimationFrame(render);

    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
    lastTime = timestamp;

    physicsStep(dt);

    // motion-blur clear
    ctx.fillStyle = 'rgba(10, 12, 28, 0.28)';
    ctx.fillRect(0, 0, W, H);

    drawGrid();
    drawFloor();
    drawTrails();
    drawParticles();

    for (const obj of objects) {
      drawObject(obj);
      drawForceArrow(obj);
    }

    drawFloatingTexts();
    drawEnergyMomentum();
  }

  function drawStatic() {
    ctx.fillStyle = '#0a0c1c';
    ctx.fillRect(0, 0, W, H);
    drawGrid();
    drawFloor();
    drawParticles();
    for (const obj of objects) {
      drawObject(obj);
    }
    drawFloatingTexts();
    drawEnergyMomentum();
  }

  // ── Resize handling ───────────────────────────────────────
  let resizeObserver = null;

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    
    // Check if we previously had zero width/height
    const wasZero = (!W || W === 0);

    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
    floorY = H * FLOOR_RATIO;

    // Place defaults once we get a valid size
    if (W > 50 && (wasZero || !defaultsPlaced)) {
      placeDefaults();
    }
  }

  // ── Public API ────────────────────────────────────────────

  function init(cvs) {
    canvas = cvs;
    ctx    = canvas.getContext('2d');
    syncSize();

    resizeObserver = new ResizeObserver(() => {
      syncSize();
      if (!running) drawStatic();
    });
    resizeObserver.observe(canvas);

    // Only draw defaults if W is already sized (>50)
    if (W > 50) {
      placeDefaults();
      drawStatic();
    }
  }

  function launch(force, friction, gravity) {
    if (running) {
      // if already running, stop first then re-launch
      cancelAnimationFrame(animFrameId);
    }

    simFriction = clamp(friction, 0, 1);
    simGravity  = !!gravity;

    // apply force: objects on left half go right, on right half go left
    const centerX = W / 2;
    for (const obj of objects) {
      const direction = obj.x < centerX ? 1 : -1;
      const accel = (force * 50) / obj.mass;   // F = ma  =>  a = F/m
      obj.vx += accel * direction;

      // small upward kick when gravity is on for a satisfying arc
      if (simGravity) {
        obj.vy -= force * 2;
      }
    }

    running  = true;
    lastTime = 0;
    animFrameId = requestAnimationFrame(render);
  }

  function reset() {
    running = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    lastTime = 0;
    particles = [];
    floatingTexts = [];
    syncSize();
    placeDefaults();
    drawStatic();
  }

  function cleanup() {
    running = false;
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
    objects = [];
    particles = [];
    floatingTexts = [];
    defaultsPlaced = false;
  }

  function getState() {
    const lines = [
      `Newton Sim — ${objects.length} objects, running=${running}`,
      `Friction=${simFriction.toFixed(2)}, Gravity=${simGravity}`
    ];
    objects.forEach((o, i) => {
      const speed = vec2Len(o.vx, o.vy).toFixed(1);
      lines.push(
        `  [${i}] ${o.type} m=${o.mass} r=${o.radius} ` +
        `pos=(${o.x.toFixed(0)},${o.y.toFixed(0)}) speed=${speed}`
      );
    });
    let ke = 0, px = 0, py = 0;
    for (const o of objects) {
      ke += 0.5 * o.mass * (o.vx * o.vx + o.vy * o.vy);
      px += o.mass * o.vx;
      py += o.mass * o.vy;
    }
    lines.push(`  KE=${ke.toFixed(1)}  |p|=${vec2Len(px,py).toFixed(1)}`);
    return lines.join('\n');
  }

  function setMass(index, mass) {
    if (index < 0 || index >= objects.length) return;
    const m = clamp(mass, 1, 20);
    objects[index].mass   = m;
    objects[index].radius = objects[index].type === 'ball' ? 15 + m : 12 + m;
    if (!running) drawStatic();
  }

  function addObject(type, x, y, mass) {
    const m = clamp(mass || 5, 1, 20);
    const colors = ['#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316'];
    const color  = colors[objects.length % colors.length];
    const obj    = createObject(type || 'ball', x || W / 2, y || floorY - 30, m, undefined, color);
    // clamp onto canvas
    obj.x = clamp(obj.x, obj.radius, W - obj.radius);
    obj.y = clamp(obj.y, obj.radius, floorY - obj.radius);
    objects.push(obj);
    if (!running) drawStatic();
  }

  // ── Expose ────────────────────────────────────────────────
  window.NewtonSim = {
    init,
    launch,
    reset,
    cleanup,
    getState,
    setMass,
    addObject
  };
})();
