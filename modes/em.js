// ============================================================
// PhysicsVerse — Electromagnetism Simulator Mode (em.js)
// Canvas-based circuit builder & magnetic field visualizer
// ============================================================

(function () {
  'use strict';

  // ── Component Definitions ──────────────────────────────────
  const componentTypes = [
    { type: 'battery',  emoji: '🔋', label: 'Battery',   color: '#F5C518' },
    { type: 'resistor', emoji: '⚡', label: 'Resistor',  color: '#7B5EA7' },
    { type: 'bulb',     emoji: '💡', label: 'Bulb',      color: '#4F8EF7' },
    { type: 'wire',     emoji: '➰', label: 'Wire',      color: '#888888' },
    { type: 'magnet',   emoji: '🧲', label: 'Magnet',    color: '#ef4444' }
  ];

  // ── Constants ──────────────────────────────────────────────
  const GRID   = 20;
  const CELL   = 40;
  const HALF   = CELL / 2;
  const SNAP   = CELL;            // components snap to CELL-sized grid
  const DOT_SPEED       = 0.065;  // current-dot travel fraction / frame
  const FIELD_DOT_SPEED = 0.012;  // magnetic-field dot speed
  const CURRENT_DOT_R   = 3;
  const FIELD_DOT_R     = 2.5;

  // ── Internal State ─────────────────────────────────────────
  let canvas, ctx;
  let onStateChange = null;
  let animId = null;

  let components  = [];   // {id, type, x, y}
  let nextId      = 1;
  let selectedTool = null; // component type string or null

  let dragTarget   = null; // component being dragged
  let dragOffsetX  = 0;
  let dragOffsetY  = 0;
  let isDragging   = false;

  let circuitComplete = false;
  let circuitPath     = [];  // ordered array of components forming the circuit

  let time = 0;  // animation clock

  // ── Toolbar DOM (created once) ─────────────────────────────
  let toolbarEl = null;

  function buildToolbar(container) {
    if (toolbarEl) { toolbarEl.remove(); }

    toolbarEl = document.createElement('div');
    toolbarEl.style.cssText =
      'display:flex;gap:8px;padding:8px 0 12px;flex-wrap:wrap;align-items:center;justify-content:center;';

    componentTypes.forEach(ct => {
      const btn = document.createElement('button');
      btn.textContent = `${ct.emoji} ${ct.label}`;
      btn.dataset.type = ct.type;
      btn.style.cssText =
        `padding:6px 14px;border-radius:8px;border:2px solid ${ct.color};
         background:rgba(0,0,0,0.25);color:#eee;font-size:14px;cursor:pointer;
         transition:all .2s;font-family:inherit;`;

      btn.addEventListener('mouseenter', () => { btn.style.background = ct.color + '33'; });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = selectedTool === ct.type ? ct.color + '55' : 'rgba(0,0,0,0.25)';
      });

      btn.addEventListener('click', () => {
        selectedTool = selectedTool === ct.type ? null : ct.type;
        highlightToolbar();
      });

      toolbarEl.appendChild(btn);
    });

    // Reset button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '🗑️ Clear';
    resetBtn.style.cssText =
      'margin-left:12px;padding:6px 14px;border-radius:8px;border:2px solid #ef4444;' +
      'background:rgba(0,0,0,0.25);color:#eee;font-size:14px;cursor:pointer;font-family:inherit;';
    resetBtn.addEventListener('click', resetAll);
    toolbarEl.appendChild(resetBtn);

    container.insertBefore(toolbarEl, canvas);
  }

  function highlightToolbar() {
    if (!toolbarEl) return;
    const btns = toolbarEl.querySelectorAll('button[data-type]');
    btns.forEach(btn => {
      const ct = componentTypes.find(c => c.type === btn.dataset.type);
      if (!ct) return;
      if (selectedTool === ct.type) {
        btn.style.background = ct.color + '55';
        btn.style.boxShadow  = `0 0 10px ${ct.color}66`;
      } else {
        btn.style.background = 'rgba(0,0,0,0.25)';
        btn.style.boxShadow  = 'none';
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────
  function snapTo(v) { return Math.round(v / SNAP) * SNAP; }

  function componentAt(x, y) {
    // Return topmost component that overlaps (x,y)
    for (let i = components.length - 1; i >= 0; i--) {
      const c = components[i];
      if (x >= c.x && x < c.x + CELL && y >= c.y && y < c.y + CELL) return c;
    }
    return null;
  }

  function fireChange() {
    if (typeof onStateChange === 'function') {
      onStateChange({
        isCircuitComplete: circuitComplete,
        hasComponents: components.length > 0,
        componentCount: components.length
      });
    }
  }

  // ── Circuit Detection ──────────────────────────────────────
  function areCellNeighbors(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return (dx === CELL && dy === 0) || (dx === 0 && dy === CELL);
  }

  function detectCircuit() {
    circuitComplete = false;
    circuitPath = [];

    // We need at least a battery and a load (bulb or resistor) connected via wires
    const batteries = components.filter(c => c.type === 'battery');
    if (batteries.length === 0) return;

    // Build adjacency graph
    const adj = new Map();
    components.forEach(c => adj.set(c.id, []));
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        if (areCellNeighbors(components[i], components[j])) {
          adj.get(components[i].id).push(components[j]);
          adj.get(components[j].id).push(components[i]);
        }
      }
    }

    // DFS from each battery — try to find a cycle back to start
    for (const bat of batteries) {
      const visited = new Set();
      const path = [];

      function dfs(node, parent) {
        visited.add(node.id);
        path.push(node);

        const neighbors = adj.get(node.id) || [];
        for (const nb of neighbors) {
          if (nb.id === bat.id && path.length >= 3) {
            // Found a loop back to the battery
            circuitPath = [...path];
            return true;
          }
          if (!visited.has(nb.id)) {
            if (dfs(nb, node)) return true;
          }
        }

        path.pop();
        return false;
      }

      if (dfs(bat, null)) {
        // Verify the path contains a battery + at least one load
        const hasLoad = circuitPath.some(c => c.type === 'bulb' || c.type === 'resistor');
        if (hasLoad) {
          circuitComplete = true;
          return;
        }
      }
    }
  }

  // ── Drawing ────────────────────────────────────────────────

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
    // Slightly brighter lines at CELL intervals
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    for (let x = 0; x <= canvas.width; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawComponent(comp) {
    const ct = componentTypes.find(c => c.type === comp.type);
    if (!ct) return;

    const cx = comp.x + HALF;
    const cy = comp.y + HALF;
    const r  = 8; // corner radius

    ctx.save();

    // ── Glow for bulb in complete circuit ──
    if (comp.type === 'bulb' && circuitComplete && circuitPath.some(p => p.id === comp.id)) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 4);
      const glowR = 28 + pulse * 10;
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, glowR);
      glow.addColorStop(0, `rgba(255,230,80,${0.55 + pulse * 0.3})`);
      glow.addColorStop(0.5, `rgba(255,200,50,${0.2 + pulse * 0.15})`);
      glow.addColorStop(1, 'rgba(255,200,50,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Background rounded rect ──
    ctx.fillStyle = 'rgba(30,30,45,0.85)';
    ctx.strokeStyle = ct.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(comp.x + r, comp.y);
    ctx.lineTo(comp.x + CELL - r, comp.y);
    ctx.quadraticCurveTo(comp.x + CELL, comp.y, comp.x + CELL, comp.y + r);
    ctx.lineTo(comp.x + CELL, comp.y + CELL - r);
    ctx.quadraticCurveTo(comp.x + CELL, comp.y + CELL, comp.x + CELL - r, comp.y + CELL);
    ctx.lineTo(comp.x + r, comp.y + CELL);
    ctx.quadraticCurveTo(comp.x, comp.y + CELL, comp.x, comp.y + CELL - r);
    ctx.lineTo(comp.x, comp.y + r);
    ctx.quadraticCurveTo(comp.x, comp.y, comp.x + r, comp.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ── Shadow under emoji ──
    ctx.shadowColor = ct.color + '44';
    ctx.shadowBlur = 8;

    // ── Emoji ──
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(ct.emoji, cx, cy + 1);

    ctx.shadowBlur = 0;

    // ── Label below ──
    ctx.font = '9px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(ct.label, cx, comp.y + CELL + 10);

    ctx.restore();
  }

  // ── Current Flow Animation ─────────────────────────────────
  function drawCurrentFlow() {
    if (!circuitComplete || circuitPath.length < 2) return;

    ctx.save();

    // Draw connecting wires between circuit path nodes
    ctx.strokeStyle = 'rgba(255,220,60,0.25)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let i = 0; i < circuitPath.length; i++) {
      const c = circuitPath[i];
      const cx = c.x + HALF;
      const cy = c.y + HALF;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    // Close loop
    ctx.lineTo(circuitPath[0].x + HALF, circuitPath[0].y + HALF);
    ctx.stroke();
    ctx.setLineDash([]);

    // Animate dots along the path
    const segments = [];
    for (let i = 0; i < circuitPath.length; i++) {
      const a = circuitPath[i];
      const b = circuitPath[(i + 1) % circuitPath.length];
      segments.push({
        x1: a.x + HALF, y1: a.y + HALF,
        x2: b.x + HALF, y2: b.y + HALF
      });
    }

    const totalSegs = segments.length;
    const numDots = Math.max(6, totalSegs * 2);

    for (let d = 0; d < numDots; d++) {
      let t = ((d / numDots) + time * DOT_SPEED) % 1;
      let segFloat = t * totalSegs;
      let segIdx = Math.floor(segFloat);
      let frac = segFloat - segIdx;
      if (segIdx >= totalSegs) { segIdx = totalSegs - 1; frac = 1; }

      const s = segments[segIdx];
      const px = s.x1 + (s.x2 - s.x1) * frac;
      const py = s.y1 + (s.y2 - s.y1) * frac;

      const glow = ctx.createRadialGradient(px, py, 0, px, py, CURRENT_DOT_R * 2.5);
      glow.addColorStop(0, 'rgba(255,240,80,0.9)');
      glow.addColorStop(0.5, 'rgba(255,200,40,0.4)');
      glow.addColorStop(1, 'rgba(255,200,40,0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, CURRENT_DOT_R * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFE84C';
      ctx.beginPath();
      ctx.arc(px, py, CURRENT_DOT_R, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ── Circuit Complete Indicator ─────────────────────────────
  function drawCircuitIndicator() {
    if (!circuitComplete) return;
    ctx.save();
    const pulse = 0.7 + 0.3 * Math.sin(time * 3);

    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const text = '⚡ Circuit Complete!';
    const tx = 14;
    const ty = 14;

    // Background pill
    const metrics = ctx.measureText(text);
    const pw = metrics.width + 20;
    const ph = 26;
    ctx.fillStyle = `rgba(40,180,80,${0.2 + pulse * 0.15})`;
    ctx.strokeStyle = `rgba(40,220,90,${0.5 + pulse * 0.3})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx - 6 + 8, ty - 4);
    ctx.lineTo(tx - 6 + pw - 8, ty - 4);
    ctx.quadraticCurveTo(tx - 6 + pw, ty - 4, tx - 6 + pw, ty - 4 + 8);
    ctx.lineTo(tx - 6 + pw, ty - 4 + ph - 8);
    ctx.quadraticCurveTo(tx - 6 + pw, ty - 4 + ph, tx - 6 + pw - 8, ty - 4 + ph);
    ctx.lineTo(tx - 6 + 8, ty - 4 + ph);
    ctx.quadraticCurveTo(tx - 6, ty - 4 + ph, tx - 6, ty - 4 + ph - 8);
    ctx.lineTo(tx - 6, ty - 4 + 8);
    ctx.quadraticCurveTo(tx - 6, ty - 4, tx - 6 + 8, ty - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(130,255,160,${pulse})`;
    ctx.fillText(text, tx, ty);
    ctx.restore();
  }

  // ── Magnetic Field Lines ───────────────────────────────────
  function drawMagneticField(mag) {
    const cx = mag.x + HALF;
    const cy = mag.y + HALF;

    ctx.save();

    const numLines = 8;
    const maxRadius = 80;

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const flipY = Math.sin(angle) >= 0 ? 1 : -1;

      // Draw curved field lines from N-pole side to S-pole side
      ctx.beginPath();
      const steps = 40;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const theta = -Math.PI / 2 + Math.PI * t; // from -90° to +90° (N to S)
        const r = maxRadius * (0.3 + 0.7 * Math.sin((i + 1) / numLines * Math.PI * 0.9));

        const px = cx + r * Math.cos(theta) * Math.cos(angle);
        const py = cy + r * Math.sin(theta) + r * 0.3 * Math.cos(angle) * flipY * Math.sin(theta);

        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      // Gradient stroke N(red) → S(blue)
      const grad = ctx.createLinearGradient(
        cx - maxRadius, cy, cx + maxRadius, cy
      );
      grad.addColorStop(0, 'rgba(239,68,68,0.35)');
      grad.addColorStop(0.5, 'rgba(180,120,220,0.25)');
      grad.addColorStop(1, 'rgba(59,130,246,0.35)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Flowing dots along field lines
      const numDots = 3;
      for (let d = 0; d < numDots; d++) {
        const dt = ((d / numDots) + time * FIELD_DOT_SPEED * (i + 1)) % 1;
        const theta2 = -Math.PI / 2 + Math.PI * dt;
        const r2 = maxRadius * (0.3 + 0.7 * Math.sin((i + 1) / numLines * Math.PI * 0.9));

        const dx = cx + r2 * Math.cos(theta2) * Math.cos(angle);
        const dy = cy + r2 * Math.sin(theta2) + r2 * 0.3 * Math.cos(angle) * flipY * Math.sin(theta2);

        // Color interpolation
        const redAmt = 1 - dt;
        const blueAmt = dt;
        const dotR = Math.round(239 * redAmt + 59 * blueAmt);
        const dotG = Math.round(68 * redAmt + 130 * blueAmt);
        const dotB = Math.round(68 * redAmt + 246 * blueAmt);

        const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, FIELD_DOT_R * 3);
        glow.addColorStop(0, `rgba(${dotR},${dotG},${dotB},0.7)`);
        glow.addColorStop(1, `rgba(${dotR},${dotG},${dotB},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(dx, dy, FIELD_DOT_R * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgb(${dotR},${dotG},${dotB})`;
        ctx.beginPath();
        ctx.arc(dx, dy, FIELD_DOT_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // N / S labels
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('N', cx - HALF - 8, cy);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('S', cx + HALF + 8, cy);

    ctx.restore();
  }

  // ── Selection highlight ────────────────────────────────────
  function drawSelectionHint() {
    if (!selectedTool) return;
    const ct = componentTypes.find(c => c.type === selectedTool);
    if (!ct) return;

    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`Selected: ${ct.emoji} ${ct.label}  •  Click canvas to place`, canvas.width - 14, 14);
    ctx.restore();
  }

  // ── Empty state ────────────────────────────────────────────
  function drawEmptyHint() {
    if (components.length > 0) return;
    ctx.save();
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillText('Select a component above, then click here to place it', canvas.width / 2, canvas.height / 2);
    ctx.font = '12px sans-serif';
    ctx.fillText('Right-click a component to remove it  •  Drag to move', canvas.width / 2, canvas.height / 2 + 24);
    ctx.restore();
  }

  // ── Main Render Loop ───────────────────────────────────────
  function render() {
    time += 0.016;  // ~60 fps tick

    // Resize canvas to fill parent
    const parent = canvas.parentElement;
    if (parent) {
      const w = parent.clientWidth;
      const h = Math.max(parent.clientHeight, 350);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawEmptyHint();
    drawSelectionHint();

    // Draw magnetic fields first (behind components)
    components.filter(c => c.type === 'magnet').forEach(drawMagneticField);

    // Draw current flow behind components
    drawCurrentFlow();

    // Draw each component
    components.forEach(drawComponent);

    // Draw circuit indicator
    drawCircuitIndicator();

    animId = requestAnimationFrame(render);
  }

  // ── Event Handlers ─────────────────────────────────────────

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  function handleMouseDown(e) {
    if (e.button === 2) return; // right-click handled separately

    const pos = getCanvasPos(e);
    const hit = componentAt(pos.x, pos.y);

    if (hit) {
      // Start dragging existing component
      dragTarget = hit;
      dragOffsetX = pos.x - hit.x;
      dragOffsetY = pos.y - hit.y;
      isDragging = false; // haven't moved yet
    }
  }

  function handleMouseMove(e) {
    if (!dragTarget) return;
    isDragging = true;
    const pos = getCanvasPos(e);
    dragTarget.x = snapTo(pos.x - dragOffsetX);
    dragTarget.y = snapTo(pos.y - dragOffsetY);
    detectCircuit();
  }

  function handleMouseUp(e) {
    if (e.button === 2) return;

    const pos = getCanvasPos(e);

    if (dragTarget) {
      if (!isDragging) {
        // Was a click on existing — do nothing (wasn't dragged)
      } else {
        // Snap to grid
        dragTarget.x = snapTo(dragTarget.x);
        dragTarget.y = snapTo(dragTarget.y);
        detectCircuit();
        fireChange();
      }
      dragTarget = null;
      isDragging = false;
      return;
    }

    // Place new component
    if (selectedTool) {
      const sx = snapTo(pos.x - HALF);
      const sy = snapTo(pos.y - HALF);

      // Don't place on top of existing
      const occupied = components.some(c => c.x === sx && c.y === sy);
      if (!occupied) {
        components.push({
          id: nextId++,
          type: selectedTool,
          x: sx,
          y: sy
        });
        detectCircuit();
        fireChange();
      }
    }
  }

  function handleContextMenu(e) {
    e.preventDefault();
    const pos = getCanvasPos(e);
    const hit = componentAt(pos.x, pos.y);
    if (hit) {
      components = components.filter(c => c.id !== hit.id);
      detectCircuit();
      fireChange();
    }
  }

  // ── Public API ─────────────────────────────────────────────

  function init(canvasEl, stateCb) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    onStateChange = stateCb || null;

    // Ensure canvas styles
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.cursor = 'crosshair';
    canvas.style.borderRadius = '12px';
    canvas.style.background = 'rgba(10,10,25,0.6)';

    // Build toolbar above canvas
    buildToolbar(canvas.parentElement);

    // Event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup',   handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);

    // Kick off render
    render();
    fireChange();
  }

  function cleanup() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    if (canvas) {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup',   handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    }
    if (toolbarEl) {
      toolbarEl.remove();
      toolbarEl = null;
    }
  }

  function resetAll() {
    components = [];
    nextId = 1;
    selectedTool = null;
    circuitComplete = false;
    circuitPath = [];
    highlightToolbar();
    detectCircuit();
    fireChange();
  }

  function getState() {
    const counts = {};
    components.forEach(c => { counts[c.type] = (counts[c.type] || 0) + 1; });

    let desc = `Electromagnetism simulator with ${components.length} component(s) placed.`;
    if (components.length > 0) {
      const parts = Object.entries(counts).map(([t, n]) => `${n} ${t}(s)`);
      desc += ` Components: ${parts.join(', ')}.`;
    }
    if (circuitComplete) {
      desc += ' A complete circuit has been detected — current is flowing.';
      const hasBulb = circuitPath.some(c => c.type === 'bulb');
      const hasResistor = circuitPath.some(c => c.type === 'resistor');
      if (hasBulb) desc += ' A bulb is glowing.';
      if (hasResistor) desc += ' Current passes through a resistor.';
    }
    const magnets = components.filter(c => c.type === 'magnet');
    if (magnets.length > 0) {
      desc += ` ${magnets.length} magnet(s) are generating visible magnetic field lines.`;
    }
    if (components.length === 0) {
      desc += ' The canvas is empty — ready for the user to build a circuit or explore magnets.';
    }
    return desc;
  }

  // ── Expose on window ──────────────────────────────────────
  window.EMSimulator = {
    init,
    cleanup,
    getState,
    reset: resetAll
  };

})();
