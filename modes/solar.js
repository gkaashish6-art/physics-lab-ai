// =============================================================
// Solar System Mode – PhysicsVerse
// Three.js interactive solar system with clickable planets
// =============================================================

(function () {
  'use strict';

  const THREE = window.THREE;

  // ── Planet data ──────────────────────────────────────────────
  const planetData = [
    { name: 'Mercury', color: 0xA0522D, size: 0.5, realSize: 0.19, distance: 8,  speed: 0.04,  facts: 'Smallest planet. No atmosphere. Extreme temperature swings from -180°C to 430°C. Orbital period: 88 Earth days.' },
    { name: 'Venus',   color: 0xDEB887, size: 0.9, realSize: 0.48, distance: 11, speed: 0.03,  facts: 'Hottest planet (465°C). Thick CO₂ atmosphere. Rotates backwards. Similar size to Earth.' },
    { name: 'Earth',   color: 0x4169E1, size: 1,   realSize: 0.50, distance: 15, speed: 0.02,  facts: 'Only known planet with life. 71% water surface. One moon. Perfect distance from Sun for liquid water.' },
    { name: 'Mars',    color: 0xCD5C5C, size: 0.7, realSize: 0.27, distance: 19, speed: 0.016, facts: 'The Red Planet. Has the tallest volcano (Olympus Mons). Two small moons. Thin CO₂ atmosphere.' },
    { name: 'Jupiter', color: 0xDAA520, size: 3,   realSize: 5.60, distance: 26, speed: 0.008, facts: 'Largest planet. Great Red Spot storm. 79+ moons. Mostly hydrogen and helium. Strong magnetic field.' },
    { name: 'Saturn',  color: 0xF4A460, size: 2.5, realSize: 4.73, distance: 34, speed: 0.006, facts: 'Famous rings of ice and rock. 83+ moons. Least dense planet — would float in water. Titan has an atmosphere.' },
    { name: 'Uranus',  color: 0x87CEEB, size: 1.8, realSize: 2.01, distance: 42, speed: 0.004, facts: 'Ice giant. Rotates on its side (98° tilt). 27 moons. Extremely cold (-224°C). Methane gives blue-green color.' },
    { name: 'Neptune', color: 0x1E90FF, size: 1.7, realSize: 1.94, distance: 48, speed: 0.003, facts: 'Windiest planet (2,100 km/h). Ice giant. 14 moons. Great Dark Spot. Takes 165 years to orbit Sun.' }
  ];

  // ── Module-level state ───────────────────────────────────────
  let scene, camera, renderer, controls;
  let sun, sunGlow;
  let planets = [];          // { mesh, ringMesh, data, angle, labelEl }
  let orbitRings = [];
  let animationFrameId = null;
  let raycaster, mouse;
  let onPlanetClickCb = null;
  let selectedPlanet = null;
  let containerEl = null;
  let boundOnClick = null;
  let boundOnResize = null;

  // HUD variables
  let isPaused = false;
  let speedMultiplier = 1.0;
  let orbitsVisible = true;
  let labelsVisible = true;
  let scaleMode = 'schematic';
  let cameraMode = 'free';
  let starsParticles = null;
  const targetLookAt = new THREE.Vector3(0, 0, 0);
  const currentLookAt = new THREE.Vector3(0, 0, 0);

  // ── Procedural Canvas Textures ───────────────────────────────
  function createSunTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#ff4500');
    grad.addColorStop(0.5, '#ff8c00');
    grad.addColorStop(1, '#ff3300');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? '#ffd700' : '#ffae00';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 30 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createMercuryTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8e8e93';
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const r = Math.random() * 8 + 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createVenusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e5b25d';
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 25; i++) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#b8772a' : '#fcedc0';
      ctx.lineWidth = Math.random() * 12 + 4;
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(128, y + Math.random() * 40 - 20, 384, y + Math.random() * 40 - 20, 512, y);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0d2b45';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#203c14';
    for (let i = 0; i < 14; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 180 + 38;
      const r = Math.random() * 50 + 15;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#325c22';
      for (let j = 0; j < 6; j++) {
        ctx.beginPath();
        ctx.arc(cx + Math.random() * r - r/2, cy + Math.random() * r - r/2, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 15; i++) {
      ctx.lineWidth = Math.random() * 16 + 4;
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(128, y + Math.random() * 60 - 30, 384, y + Math.random() * 60 - 30, 512, y);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createMarsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b7410e';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#692100';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 35 + 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f0f3f5';
    ctx.beginPath(); ctx.arc(256, 0, 18, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(256, 256, 18, Math.PI, 0); ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  function createJupiterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d8ca9d';
    ctx.fillRect(0, 0, 512, 256);
    const bands = ['#a57c52', '#d8ca9d', '#b07f35', '#f3ebd4', '#8a5e38', '#b89f72'];
    let y = 0;
    while (y < 256) {
      ctx.fillStyle = bands[Math.floor(Math.random() * bands.length)];
      const h = Math.floor(Math.random() * 10) + 3;
      ctx.fillRect(0, y, 512, h);
      y += h;
    }
    ctx.fillStyle = '#ab2a15';
    ctx.beginPath(); ctx.ellipse(300, 175, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f3ebd4'; ctx.lineWidth = 2; ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }

  function createSaturnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#e2d0a8';
    ctx.fillRect(0, 0, 512, 256);
    const bands = ['#cbb793', '#e2d0a8', '#f2e8cf', '#d5c4a1'];
    let y = 0;
    while (y < 256) {
      ctx.fillStyle = bands[Math.floor(Math.random() * bands.length)];
      const h = Math.floor(Math.random() * 15) + 5;
      ctx.fillRect(0, y, 512, h);
      y += h;
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createSaturnRingsTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);
    const cx = 256; const cy = 256;
    for (let r = 100; r < 240; r++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const opacity = 0.15 + Math.sin(r * 0.1) * 0.4 + Math.random() * 0.25;
      let col = '200, 180, 140';
      if (r > 165 && r < 180) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      } else {
        if (r > 200) col = '230, 220, 200';
        ctx.strokeStyle = `rgba(${col}, ${opacity})`;
      }
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createUranusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#b7eaf7';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(0, Math.random() * 256, 512, Math.random() * 22 + 4);
    }
    return new THREE.CanvasTexture(canvas);
  }

  function createNeptuneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#2f5bb2';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#1e3c7a';
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(0, Math.random() * 256, 512, Math.random() * 25 + 5);
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(0, Math.random() * 256, 512, Math.random() * 4 + 1);
    }
    ctx.fillStyle = '#0f224f';
    ctx.beginPath(); ctx.ellipse(190, 160, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  const textureCreatorMap = {
    'Mercury': createMercuryTexture,
    'Venus': createVenusTexture,
    'Earth': createEarthTexture,
    'Mars': createMarsTexture,
    'Jupiter': createJupiterTexture,
    'Saturn': createSaturnTexture,
    'Uranus': createUranusTexture,
    'Neptune': createNeptuneTexture
  };

  // ── Helpers ──────────────────────────────────────────────────

  function createSun() {
    // Core sun sphere with unit radius for dynamic scaling
    const sunGeo = new THREE.SphereGeometry(1, 32, 32);
    const sunTex = createSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex });
    sun = new THREE.Mesh(sunGeo, sunMat);
    sun.scale.set(5, 5, 5);
    sun.position.set(0, 0, 0);
    scene.add(sun);

    // Glow effect – larger semi-transparent sphere
    const glowGeo = new THREE.SphereGeometry(1.3, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xFDB813,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    sunGlow = new THREE.Mesh(glowGeo, glowMat);
    sunGlow.scale.copy(sun.scale);
    sunGlow.position.set(0, 0, 0);
    scene.add(sunGlow);
  }

  function createPlanets() {
    const labelsContainer = document.getElementById('solar-labels-container');
    if (labelsContainer) {
      labelsContainer.innerHTML = '';
    }

    planetData.forEach(function (data, index) {
      // Planet mesh with unit radius for dynamic scaling
      const geo = new THREE.SphereGeometry(1, 32, 32);
      
      const texCreator = textureCreatorMap[data.name];
      const texture = texCreator ? texCreator() : null;
      
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      
      // Initial scale is schematic
      mesh.scale.set(data.size, data.size, data.size);

      // Unique start angle spread evenly
      const startAngle = (index / planetData.length) * Math.PI * 2;
      mesh.position.x = Math.cos(startAngle) * data.distance;
      mesh.position.z = Math.sin(startAngle) * data.distance;

      // Store reference for raycasting
      mesh.userData = { name: data.name, facts: data.facts, index: index };
      scene.add(mesh);

      // Saturn Rings
      let ringMesh = null;
      if (data.name === 'Saturn') {
        const ringGeo = new THREE.RingGeometry(1.4, 2.8, 64);
        const ringTex = createSaturnRingsTexture();
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85
        });
        ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2 + 0.3; // tilt
        ringMesh.rotation.y = 0.1;
        mesh.add(ringMesh);
      }

      // Orbit ring
      const ringGeo = new THREE.RingGeometry(
        data.distance - 0.05,
        data.distance + 0.05,
        64
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.1,
        transparent: true,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      orbitRings.push(ring);

      // Label DOM Element
      let labelEl = null;
      if (labelsContainer) {
        labelEl = document.createElement('div');
        labelEl.className = 'planet-label';
        labelEl.textContent = data.name;
        
        const hexColor = '#' + data.color.toString(16).padStart(6, '0');
        labelEl.style.color = hexColor;
        labelEl.style.setProperty('--accent', hexColor);
        labelEl.style.borderColor = `rgba(${parseInt(hexColor.slice(1,3), 16)}, ${parseInt(hexColor.slice(3,5), 16)}, ${parseInt(hexColor.slice(5,7), 16)}, 0.35)`;
        
        labelEl.onclick = function() {
          selectPlanetByName(data.name);
        };
        labelsContainer.appendChild(labelEl);
      }

      planets.push({
        mesh: mesh,
        ringMesh: ringMesh,
        data: data,
        angle: startAngle,
        labelEl: labelEl
      });
    });
  }

  function createBackgroundStars() {
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const r = 120 + Math.random() * 150;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i+1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i+2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.6,
      transparent: true,
      opacity: 0.7
    });
    starsParticles = new THREE.Points(starGeo, starMat);
    scene.add(starsParticles);
  }

  // ── Raycasting / Click ───────────────────────────────────────

  function selectPlanetByName(name) {
    // Reset previously selected planet
    if (selectedPlanet) {
      selectedPlanet.mesh.material.emissive.setHex(0x000000);
      selectedPlanet.mesh.material.emissiveIntensity = 0;
      selectedPlanet = null;
    }

    const planet = planets.find(p => p.data.name === name);
    if (planet) {
      // Highlight selected planet
      planet.mesh.material.emissive.setHex(planet.data.color);
      planet.mesh.material.emissiveIntensity = 0.55;
      selectedPlanet = planet;

      // Fire callback
      if (typeof onPlanetClickCb === 'function') {
        onPlanetClickCb({
          name: planet.data.name,
          facts: planet.data.facts
        });
      }
    }
  }

  function onCanvasClick(event) {
    if (!renderer || !camera) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const planetMeshes = planets.map(function (p) { return p.mesh; });
    const intersects = raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      selectPlanetByName(hitMesh.userData.name);
    }
  }

  // ── Resize handler ──────────────────────────────────────────

  function onWindowResize() {
    if (!containerEl || !camera || !renderer) return;
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  // ── Animation loop ──────────────────────────────────────────

  function animate() {
    animationFrameId = requestAnimationFrame(animate);

    const speed = isPaused ? 0 : speedMultiplier;

    const baseSunScale = (scaleMode === 'realistic') ? 10 : 5;

    // Rotate and pulse sun slowly
    if (sun) {
      sun.scale.set(baseSunScale, baseSunScale, baseSunScale);
      sun.rotation.y += 0.002;
    }
    if (sunGlow) {
      const pulse = 1.0 + Math.sin(performance.now() * 0.0015) * 0.05;
      const glowScale = baseSunScale * 1.3 * pulse;
      sunGlow.scale.set(glowScale, glowScale, glowScale);
      sunGlow.rotation.y -= 0.001;
    }

    // Update planet orbits and scales
    for (var i = 0; i < planets.length; i++) {
      var p = planets[i];
      p.angle += p.data.speed * 0.05 * speed;  // scale down for smooth motion
      p.mesh.position.x = Math.cos(p.angle) * p.data.distance;
      p.mesh.position.z = Math.sin(p.angle) * p.data.distance;
      // Gentle self-rotation
      p.mesh.rotation.y += 0.01 * speed;

      // Adjust scale dynamically
      const targetScale = (scaleMode === 'realistic') ? p.data.realSize : p.data.size;
      p.mesh.scale.set(targetScale, targetScale, targetScale);
    }

    // Project HTML labels
    const tempV = new THREE.Vector3();
    const labelsContainer = document.getElementById('solar-labels-container');
    const showLabels = labelsContainer && !labelsContainer.classList.contains('hidden-labels') && labelsVisible;

    for (var i = 0; i < planets.length; i++) {
      var p = planets[i];
      if (p.labelEl) {
        if (showLabels) {
          p.labelEl.style.display = 'block';
          p.mesh.getWorldPosition(tempV);
          tempV.project(camera);

          if (tempV.z > 1) {
            p.labelEl.style.opacity = '0';
          } else {
            const w = containerEl.clientWidth;
            const h = containerEl.clientHeight;
            const x = (tempV.x * 0.5 + 0.5) * w;
            const y = (tempV.y * -0.5 + 0.5) * h;

            p.labelEl.style.left = `${x}px`;
            const currentSize = (scaleMode === 'realistic') ? p.data.realSize : p.data.size;
            // Position above the planet sphere
            const offset = currentSize * 12 + 15;
            p.labelEl.style.top = `${y - offset}px`;
            p.labelEl.style.opacity = '1';
          }
        } else {
          p.labelEl.style.display = 'none';
        }
      }
    }

    // Update camera look-at target smoothly
    if (cameraMode === 'follow' && selectedPlanet) {
      selectedPlanet.mesh.getWorldPosition(targetLookAt);
    } else {
      targetLookAt.set(0, 0, 0); // focus sun
    }

    // Update controls
    if (controls) {
      currentLookAt.lerp(targetLookAt, 0.08);
      controls.target.copy(currentLookAt);
      controls.update();
    }

    renderer.render(scene, camera);
  }

  // ── HUD API Functions ────────────────────────────────────────

  function togglePlay() {
    isPaused = !isPaused;
    const btn = document.getElementById('btn-solar-play');
    if (btn) {
      btn.innerHTML = isPaused ? '▶️ Play' : '⏸️ Pause';
      btn.classList.toggle('active', isPaused);
    }
    return isPaused;
  }

  function toggleOrbits() {
    orbitsVisible = !orbitsVisible;
    orbitRings.forEach(function (ring) {
      ring.visible = orbitsVisible;
    });
    const btn = document.getElementById('btn-solar-orbits');
    if (btn) {
      btn.innerHTML = orbitsVisible ? '🌐 Orbits: ON' : '🌐 Orbits: OFF';
      btn.classList.toggle('active', !orbitsVisible);
    }
  }

  function toggleLabels() {
    labelsVisible = !labelsVisible;
    const container = document.getElementById('solar-labels-container');
    if (container) {
      container.classList.toggle('hidden-labels', !labelsVisible);
    }
    const btn = document.getElementById('btn-solar-labels');
    if (btn) {
      btn.innerHTML = labelsVisible ? '🏷️ Labels: ON' : '🏷️ Labels: OFF';
      btn.classList.toggle('active', !labelsVisible);
    }
  }

  function toggleScaleMode() {
    scaleMode = (scaleMode === 'schematic') ? 'realistic' : 'schematic';
    const btn = document.getElementById('btn-solar-scale');
    if (btn) {
      btn.innerHTML = (scaleMode === 'schematic') ? '📏 Scale: Schematic' : '📏 Scale: Realistic';
      btn.classList.toggle('active', scaleMode === 'realistic');
    }
  }

  function toggleCameraMode() {
    cameraMode = (cameraMode === 'free') ? 'follow' : 'free';
    const btn = document.getElementById('btn-solar-cam-mode');
    if (btn) {
      btn.innerHTML = (cameraMode === 'free') ? '🎥 Cam: Free' : '🎥 Cam: Follow';
      btn.classList.toggle('active', cameraMode === 'follow');
    }
  }

  function setSpeedMultiplier(val) {
    speedMultiplier = val;
    const valText = document.getElementById('solar-speed-val');
    if (valText) {
      valText.textContent = val.toFixed(1) + 'x';
    }
  }

  function resetHUDToDefault() {
    isPaused = false;
    speedMultiplier = 1.0;
    orbitsVisible = true;
    labelsVisible = true;
    scaleMode = 'schematic';
    cameraMode = 'free';
    targetLookAt.set(0, 0, 0);
    currentLookAt.set(0, 0, 0);

    const btnPlay = document.getElementById('btn-solar-play');
    if (btnPlay) {
      btnPlay.innerHTML = '⏸️ Pause';
      btnPlay.classList.remove('active');
    }
    const btnOrbits = document.getElementById('btn-solar-orbits');
    if (btnOrbits) {
      btnOrbits.innerHTML = '🌐 Orbits: ON';
      btnOrbits.classList.remove('active');
    }
    const btnLabels = document.getElementById('btn-solar-labels');
    if (btnLabels) {
      btnLabels.innerHTML = '🏷️ Labels: ON';
      btnLabels.classList.remove('active');
    }
    const btnScale = document.getElementById('btn-solar-scale');
    if (btnScale) {
      btnScale.innerHTML = '📏 Scale: Schematic';
      btnScale.classList.remove('active');
    }
    const btnCam = document.getElementById('btn-solar-cam-mode');
    if (btnCam) {
      btnCam.innerHTML = '🎥 Cam: Free';
      btnCam.classList.remove('active');
    }
    const sliderSpeed = document.getElementById('solar-speed-slider');
    if (sliderSpeed) {
      sliderSpeed.value = 100;
    }
    const valText = document.getElementById('solar-speed-val');
    if (valText) {
      valText.textContent = '1.0x';
    }

    const container = document.getElementById('solar-labels-container');
    if (container) {
      container.classList.remove('hidden-labels');
    }
  }

  // ── Public API ──────────────────────────────────────────────

  function init(container, onPlanetClick) {
    containerEl = container;
    onPlanetClickCb = onPlanetClick || null;

    var width = container.clientWidth;
    var height = container.clientHeight;

    // Reset HUD DOM settings
    resetHUDToDefault();

    // ── Scene ──
    scene = new THREE.Scene();
    // Do not set scene.background to allow the CSS starfield/space background to show through renderer transparency!

    // ── Camera ──
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 25, 45);

    // ── Renderer ──
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // ── OrbitControls ──
    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 6;
      controls.maxDistance = 150;
      controls.enablePan = true;
    }

    // ── Lights ──
    var ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffffff, 2.5, 300);
    pointLight.position.set(0, 0, 0); // at sun position
    scene.add(pointLight);

    // ── Raycaster ──
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // ── Build objects ──
    createSun();
    createPlanets();
    createBackgroundStars();

    // ── Event listeners ──
    boundOnClick = onCanvasClick;
    renderer.domElement.addEventListener('click', boundOnClick, false);

    boundOnResize = onWindowResize;
    window.addEventListener('resize', boundOnResize, false);

    // ── Start animation ──
    animate();
  }

  function cleanup() {
    // Cancel animation
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Remove event listeners
    if (renderer && boundOnClick) {
      renderer.domElement.removeEventListener('click', boundOnClick, false);
    }
    if (boundOnResize) {
      window.removeEventListener('resize', boundOnResize, false);
    }

    // Dispose orbit controls
    if (controls) {
      controls.dispose();
      controls = null;
    }

    // Clear labels DOM elements
    const labelsContainer = document.getElementById('solar-labels-container');
    if (labelsContainer) {
      labelsContainer.innerHTML = '';
    }

    // Dispose parallax stars
    if (starsParticles) {
      starsParticles.geometry.dispose();
      starsParticles.material.dispose();
      scene.remove(starsParticles);
      starsParticles = null;
    }

    // Dispose planets and custom textures
    for (var i = 0; i < planets.length; i++) {
      var p = planets[i];
      if (p.mesh) {
        p.mesh.geometry.dispose();
        if (p.mesh.material) {
          if (p.mesh.material.map) p.mesh.material.map.dispose();
          p.mesh.material.dispose();
        }
        scene.remove(p.mesh);
      }
      if (p.ringMesh) {
        p.ringMesh.geometry.dispose();
        if (p.ringMesh.material) {
          if (p.ringMesh.material.map) p.ringMesh.material.map.dispose();
          p.ringMesh.material.dispose();
        }
      }
    }
    planets = [];

    // Dispose orbit rings
    for (var j = 0; j < orbitRings.length; j++) {
      var ring = orbitRings[j];
      if (ring) {
        ring.geometry.dispose();
        ring.material.dispose();
        scene.remove(ring);
      }
    }
    orbitRings = [];

    // Dispose sun and texture
    if (sun) {
      sun.geometry.dispose();
      if (sun.material) {
        if (sun.material.map) sun.material.map.dispose();
        sun.material.dispose();
      }
      scene.remove(sun);
      sun = null;
    }

    // Dispose sun glow
    if (sunGlow) {
      sunGlow.geometry.dispose();
      sunGlow.material.dispose();
      scene.remove(sunGlow);
      sunGlow = null;
    }

    // Dispose renderer
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer = null;
    }

    // Clear remaining references
    scene = null;
    camera = null;
    raycaster = null;
    mouse = null;
    selectedPlanet = null;
    onPlanetClickCb = null;
    containerEl = null;
    boundOnClick = null;
    boundOnResize = null;
  }

  // ── Expose on window ────────────────────────────────────────
  window.SolarSystem = {
    init: init,
    cleanup: cleanup,
    togglePlay: togglePlay,
    toggleOrbits: toggleOrbits,
    toggleLabels: toggleLabels,
    toggleScaleMode: toggleScaleMode,
    toggleCameraMode: toggleCameraMode,
    setSpeedMultiplier: setSpeedMultiplier,
    selectPlanetByName: selectPlanetByName
  };

})();
