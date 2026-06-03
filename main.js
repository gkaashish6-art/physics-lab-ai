// ============================================
// PhysicsVerse — Main Application Controller
// ============================================

// ---- State ----
let currentScreen = 'home';
let xp = parseInt(localStorage.getItem('physicsverse_xp') || '0');
let badges = JSON.parse(localStorage.getItem('physicsverse_badges') || '{}');
let gravityOn = false;
let currentAIText = { solar: '', em: '', newton: '' };
let quizData = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizMode = '';
let currentPlanet = null;
let solarInitialized = false;
let emInitialized = false;
let newtonInitialized = false;
let isSpeaking = false;

// ---- Video Fade Controller ----
(function initVideoFade() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  let fadeState = 'waiting'; // waiting | fading-in | playing | fading-out
  let fadeStart = 0;
  const FADE_DURATION = 500; // ms

  function fadeLoop(timestamp) {
    if (!video || video.paused && fadeState !== 'waiting') {
      requestAnimationFrame(fadeLoop);
      return;
    }

    switch (fadeState) {
      case 'waiting':
        break;

      case 'fading-in': {
        const elapsed = timestamp - fadeStart;
        const progress = Math.min(elapsed / FADE_DURATION, 1);
        video.style.opacity = progress;
        if (progress >= 1) {
          fadeState = 'playing';
        }
        break;
      }

      case 'playing': {
        // Check if near end
        if (video.duration && video.currentTime >= video.duration - 0.5) {
          fadeState = 'fading-out';
          fadeStart = timestamp;
        }
        break;
      }

      case 'fading-out': {
        const elapsed = timestamp - fadeStart;
        const progress = Math.min(elapsed / FADE_DURATION, 1);
        video.style.opacity = 1 - progress;
        if (progress >= 1) {
          fadeState = 'ended';
          video.pause();
        }
        break;
      }

      case 'ended':
        break;
    }

    requestAnimationFrame(fadeLoop);
  }

  video.addEventListener('canplay', function () {
    if (fadeState === 'waiting') {
      video.play().then(() => {
        fadeState = 'fading-in';
        fadeStart = performance.now();
      }).catch(() => {
        // Autoplay blocked, try muted
        video.muted = true;
        video.play().then(() => {
          fadeState = 'fading-in';
          fadeStart = performance.now();
        });
      });
    }
  });

  video.addEventListener('ended', function () {
    video.style.opacity = '0';
    fadeState = 'waiting';
    setTimeout(() => {
      video.currentTime = 0;
      video.play().then(() => {
        fadeState = 'fading-in';
        fadeStart = performance.now();
      });
    }, 100);
  });

  requestAnimationFrame(fadeLoop);

  // Try to start immediately if already loaded
  if (video.readyState >= 3) {
    video.play().then(() => {
      fadeState = 'fading-in';
      fadeStart = performance.now();
    }).catch(() => {});
  }
})();

// ---- Starfield Generator ----
function createStarfield() {
  const container = document.getElementById('starfield');
  if (!container) return;
  container.innerHTML = '';

  const numStars = 200;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.opacity = Math.random() * 0.5 + 0.2;
    star.style.animation = `twinkle ${2 + Math.random() * 4}s ease-in-out ${Math.random() * 4}s infinite`;
    container.appendChild(star);
  }
}

// ---- Sound Manager ----
const SoundManager = {
  ctx: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  click() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  },

  success() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(523, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.4);
  },

  error() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.3);
  },

  levelUp() {
    this.init();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.12 + 0.3);
      osc.start(this.ctx.currentTime + i * 0.12);
      osc.stop(this.ctx.currentTime + i * 0.12 + 0.3);
    });
  }
};

// ---- XP System ----
function addXP(amount) {
  const oldXP = xp;
  xp += amount;
  localStorage.setItem('physicsverse_xp', xp.toString());
  updateXPDisplay();

  // Check milestones
  const milestones = [50, 100, 200, 300, 500];
  for (const m of milestones) {
    if (oldXP < m && xp >= m) {
      showRankUp(m);
      break;
    }
  }
}

function updateXPDisplay() {
  const maxXP = 500;
  const fill = document.getElementById('xp-fill');
  const text = document.getElementById('xp-text');
  if (fill) fill.style.width = Math.min((xp / maxXP) * 100, 100) + '%';
  if (text) text.textContent = `${xp} / ${maxXP} XP`;
}

function showRankUp(milestone) {
  SoundManager.levelUp();
  const overlay = document.getElementById('rank-up-overlay');
  const emoji = document.getElementById('rank-up-emoji');
  const message = document.getElementById('rank-up-message');

  const ranks = {
    50: { emoji: '🌟', msg: 'Rising Star!' },
    100: { emoji: '🔥', msg: 'Physics Prodigy!' },
    200: { emoji: '⚡', msg: 'Quantum Leaper!' },
    300: { emoji: '🚀', msg: 'Rocket Scientist!' },
    500: { emoji: '🏆', msg: 'PhysicsVerse Champion!' }
  };

  const rank = ranks[milestone] || { emoji: '🎉', msg: 'Level Up!' };
  emoji.textContent = rank.emoji;
  message.textContent = rank.msg;
  overlay.classList.add('active');

  setTimeout(() => overlay.classList.remove('active'), 3000);
}

// ---- Badge System ----
function earnBadge(badgeId) {
  if (badges[badgeId]) return;
  badges[badgeId] = true;
  localStorage.setItem('physicsverse_badges', JSON.stringify(badges));
  updateBadgeDisplay();

  // Check for master badge
  if (badges.solar && badges.em && badges.newton && !badges.master) {
    setTimeout(() => earnBadge('master'), 1000);
  }

  showToast(`🏅 Badge Earned: ${getBadgeName(badgeId)}!`);
}

function getBadgeName(id) {
  const names = { solar: 'Star Gazer', em: 'Circuit Master', newton: 'Force Field', master: 'PhysicsVerse Master' };
  return names[id] || id;
}

function updateBadgeDisplay() {
  ['solar', 'em', 'newton', 'master'].forEach(id => {
    const el = document.getElementById('badge-' + id);
    const lb = document.getElementById('lb-badge-' + id);
    if (el) el.classList.toggle('earned', !!badges[id]);
    if (lb) lb.classList.toggle('earned', !!badges[id]);
  });
}

// ---- Toast ----
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ---- Screen Navigation ----
function enterApp() {
  SoundManager.click();
  const heroPage = document.getElementById('hero-page');
  const appContainer = document.getElementById('app-container');

  heroPage.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  heroPage.style.opacity = '0';
  heroPage.style.transform = 'translateY(-30px)';

  setTimeout(() => {
    heroPage.style.display = 'none';
    appContainer.classList.add('active');
    appContainer.classList.add('fade-enter');
    createStarfield();
    updateXPDisplay();
    updateBadgeDisplay();
  }, 500);
}

function showScreen(screenId) {
  SoundManager.click();
  // Stop any voice playback when switching screens
  if (isSpeaking) stopAllVoice();
  const currentEl = document.getElementById('screen-' + currentScreen);
  const targetEl = document.getElementById('screen-' + screenId);

  if (currentEl) {
    currentEl.classList.add('fade-exit');
    setTimeout(() => {
      currentEl.classList.remove('active', 'fade-exit');
    }, 300);
  }

  setTimeout(() => {
    if (targetEl) {
      targetEl.classList.add('active', 'fade-enter');
      setTimeout(() => targetEl.classList.remove('fade-enter'), 400);
    }

    // Initialize mode if needed
    if (screenId === 'solar' && !solarInitialized) {
      initSolarSystem();
    }
    if (screenId === 'em' && !emInitialized) {
      initEM();
    }
    if (screenId === 'newton' && !newtonInitialized) {
      initNewton();
    }
    if (screenId === 'leaderboard') {
      renderLeaderboard();
    }

    // Cleanup when leaving modes
    if (currentScreen === 'solar' && screenId !== 'solar') {
      if (window.SolarSystem) window.SolarSystem.cleanup();
      solarInitialized = false;
      const panel = document.getElementById('solar-panel');
      if (panel) panel.classList.add('hidden');
    }

    currentScreen = screenId;
  }, currentEl ? 300 : 0);
}

// ---- Solar System Init ----
function initSolarSystem() {
  const container = document.getElementById('three-container');
  if (!container || !window.SolarSystem) return;

  window.SolarSystem.init(container, function (planetData) {
    currentPlanet = planetData;
    const panel = document.getElementById('solar-panel');
    document.getElementById('planet-name').textContent = planetData.name;
    document.getElementById('planet-facts').textContent = planetData.facts;
    panel.classList.remove('hidden');

    // Clear previous AI content
    document.getElementById('solar-ai-container').innerHTML = '';
    document.getElementById('btn-solar-voice').style.display = 'none';
    currentAIText.solar = '';
  });

  solarInitialized = true;
}

// ---- EM Init ----
function initEM() {
  const canvas = document.getElementById('em-canvas');
  if (!canvas || !window.EMSimulator) return;

  // Size canvas
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  // Hide the external controls div since em.js builds its own toolbar
  const controlsContainer = document.getElementById('em-controls');
  if (controlsContainer) controlsContainer.style.display = 'none';

  window.EMSimulator.init(canvas, function (state) {
    const status = document.getElementById('em-status');
    if (state.isCircuitComplete) {
      status.innerHTML = '<span style="color: #22c55e;">✅ Circuit Complete!</span> Current is flowing.';
    } else if (state.componentCount > 0) {
      status.textContent = `${state.componentCount} components placed. Keep building!`;
    } else {
      status.textContent = 'Select a component and click on the grid to place it.';
    }
  });

  emInitialized = true;

  // Handle resize
  window.addEventListener('resize', () => {
    if (emInitialized && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
  });
}

function resetEM() {
  if (window.EMSimulator) {
    window.EMSimulator.reset();
    document.getElementById('em-status').textContent = 'Select a component and click on the grid to place it.';
    document.getElementById('em-ai-container').innerHTML = '';
  }
}

// ---- Newton Init ----
function initNewton() {
  const canvas = document.getElementById('newton-canvas');
  if (!canvas || !window.NewtonSim) return;

  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  window.NewtonSim.init(canvas);
  newtonInitialized = true;

  window.addEventListener('resize', () => {
    if (newtonInitialized && canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
  });
}

function updateSliderDisplay() {
  document.getElementById('val-mass').textContent = document.getElementById('slider-mass').value;
  document.getElementById('val-force').textContent = document.getElementById('slider-force').value;
  document.getElementById('val-friction').textContent = (document.getElementById('slider-friction').value / 100).toFixed(2);
}

function toggleGravity() {
  gravityOn = !gravityOn;
  const btn = document.getElementById('btn-gravity');
  btn.textContent = gravityOn ? 'ON' : 'OFF';
  btn.style.borderColor = gravityOn ? 'var(--primary)' : 'var(--glass-border)';
  btn.style.background = gravityOn ? 'rgba(79, 142, 247, 0.15)' : 'var(--glass-bg)';
}

function launchNewton() {
  if (!window.NewtonSim) return;
  SoundManager.click();
  const force = parseInt(document.getElementById('slider-force').value);
  const friction = parseInt(document.getElementById('slider-friction').value) / 100;
  window.NewtonSim.launch(force, friction, gravityOn);
}

function resetNewton() {
  if (!window.NewtonSim) return;
  window.NewtonSim.reset();
  document.getElementById('newton-ai-container').innerHTML = '';
}

function addNewNewtonObject(type) {
  if (!window.NewtonSim) return;
  SoundManager.click();
  const mass = parseInt(document.getElementById('slider-mass').value);
  // Add object at random X in top-center, near top (Y = 40)
  window.NewtonSim.addObject(type, Math.random() * 200 + 100, 40, mass);
}

// ---- AI Integration ----
async function handleAIExplain(mode) {
  SoundManager.click();
  let topic, context;
  let containerId;

  switch (mode) {
    case 'solar':
      if (!currentPlanet) {
        showToast('Click a planet first!');
        return;
      }
      topic = currentPlanet.name;
      context = `Planet ${currentPlanet.name}. ${currentPlanet.facts}`;
      containerId = 'solar-ai-container';
      break;
    case 'em':
      topic = 'electromagnetism';
      context = window.EMSimulator ? window.EMSimulator.getState() : 'Circuit building exercise';
      containerId = 'em-ai-container';
      break;
    case 'newton':
      topic = 'newton';
      context = window.NewtonSim ? window.NewtonSim.getState() : 'Newton\'s laws simulation';
      containerId = 'newton-ai-container';
      break;
  }

  const container = document.getElementById(containerId);
  container.innerHTML = '<div class="spinner"></div><p style="text-align: center; color: hsl(var(--foreground)/0.5); font-size: 13px;">AI is thinking...</p>';

  try {
    const explanation = await window.PhysicsAI.getExplanation(topic, context);
    currentAIText[mode] = explanation;

    container.innerHTML = `<div class="ai-explanation">${explanation.replace(/\n/g, '<br>')}</div>`;

    // Show voice button
    const voiceBtn = document.getElementById(`btn-${mode}-voice`);
    if (voiceBtn) voiceBtn.style.display = 'flex';

    // Award XP for viewing explanation
    addXP(5);
    showToast('+5 XP for learning!');
  } catch (err) {
    container.innerHTML = '<p style="color: #ef4444;">Failed to get explanation. Try again.</p>';
  }
}

function handleVoiceRead(mode) {
  if (isSpeaking) {
    stopAllVoice();
    return;
  }
  if (currentAIText[mode]) {
    window.PhysicsAI.speakText(currentAIText[mode]);
    isSpeaking = true;
    updateVoiceButtons();
    showToast('🔊 Reading aloud...');

    // Poll for speech end to reset button state
    const checkEnd = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(checkEnd);
        isSpeaking = false;
        updateVoiceButtons();
      }
    }, 300);
  }
}

function stopAllVoice() {
  if (window.PhysicsAI) window.PhysicsAI.stopSpeaking();
  isSpeaking = false;
  updateVoiceButtons();
  showToast('🔇 Voice stopped');
}

function updateVoiceButtons() {
  ['solar', 'em', 'newton'].forEach(mode => {
    const btn = document.getElementById(`btn-${mode}-voice`);
    if (!btn) return;
    if (isSpeaking) {
      btn.innerHTML = '⏹️ Stop Voice';
      btn.style.borderColor = '#ef4444';
      btn.style.color = '#ef4444';
    } else {
      btn.innerHTML = '🔊 Read Aloud';
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  });
}

// ---- Quiz System ----
async function handleQuiz(mode) {
  SoundManager.click();
  quizMode = mode;
  quizIndex = 0;
  quizCorrect = 0;

  const overlay = document.getElementById('quiz-overlay');
  const modeLabel = document.getElementById('quiz-mode-label');
  const labels = { solar: '🌌 Solar System', em: '⚡ Electromagnetism', newton: '🏎️ Newton\'s Laws' };
  modeLabel.textContent = labels[mode] || 'Quiz';

  // Show loading state
  overlay.classList.add('active');
  document.getElementById('quiz-question').textContent = 'Loading questions...';
  document.getElementById('quiz-options').innerHTML = '<div class="spinner"></div>';
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'none';

  try {
    let topic;
    switch (mode) {
      case 'solar':
        topic = currentPlanet ? currentPlanet.name : 'solar system';
        break;
      case 'em':
        topic = 'electromagnetism and circuits';
        break;
      case 'newton':
        topic = 'Newton\'s laws of motion';
        break;
    }
    quizData = await window.PhysicsAI.generateQuiz(topic);
    renderQuizQuestion();
  } catch (err) {
    document.getElementById('quiz-question').textContent = 'Failed to load quiz. Please try again.';
    document.getElementById('quiz-options').innerHTML = '';
  }
}

function renderQuizQuestion() {
  if (quizIndex >= quizData.length) {
    showQuizResult();
    return;
  }

  const q = quizData[quizIndex];
  document.getElementById('quiz-num').textContent = quizIndex + 1;
  document.getElementById('quiz-question').textContent = q.question;
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').style.display = 'none';
  document.getElementById('quiz-result').style.display = 'none';

  const optionsDiv = document.getElementById('quiz-options');
  optionsDiv.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = `${labels[i]}. ${opt}`;
    btn.onclick = () => answerQuiz(labels[i], btn);
    optionsDiv.appendChild(btn);
  });
}

function answerQuiz(selectedLetter, btnElement) {
  const q = quizData[quizIndex];
  const correct = q.answer.trim().toUpperCase();
  const feedback = document.getElementById('quiz-feedback');

  // Disable all options
  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.onclick = null;
    btn.style.cursor = 'default';
  });

  // Highlight correct/wrong
  const labels = ['A', 'B', 'C', 'D'];
  document.querySelectorAll('.quiz-option').forEach((btn, i) => {
    if (labels[i] === correct) {
      btn.classList.add('correct');
    }
    if (labels[i] === selectedLetter && selectedLetter !== correct) {
      btn.classList.add('wrong');
    }
  });

  if (selectedLetter === correct) {
    SoundManager.success();
    quizCorrect++;
    addXP(10);
    feedback.innerHTML = '<span style="color: #22c55e;">✅ Correct! +10 XP</span>';
  } else {
    SoundManager.error();
    feedback.innerHTML = `<span style="color: #ef4444;">❌ Wrong! The answer is ${correct}.</span>`;
  }

  document.getElementById('quiz-next-btn').style.display = 'block';
}

function nextQuizQuestion() {
  SoundManager.click();
  quizIndex++;
  renderQuizQuestion();
}

function showQuizResult() {
  document.getElementById('quiz-question').textContent = '';
  document.getElementById('quiz-options').innerHTML = '';
  document.getElementById('quiz-feedback').textContent = '';
  document.getElementById('quiz-next-btn').style.display = 'none';

  const result = document.getElementById('quiz-result');
  result.style.display = 'block';
  document.getElementById('quiz-score-text').textContent = `${quizCorrect}/5 Correct!`;
  document.getElementById('quiz-xp-earned').textContent = `You earned ${quizCorrect * 10} XP from this quiz!`;

  if (quizCorrect >= 3) {
    SoundManager.success();
  }

  // Award badge if scored well
  if (quizCorrect >= 4) {
    earnBadge(quizMode);
  }
}

function closeQuiz() {
  SoundManager.click();
  document.getElementById('quiz-overlay').classList.remove('active');
}

// ---- Leaderboard ----
function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  const fakeUsers = [
    { name: 'AstroMax', xp: 480 },
    { name: 'QuantumQueen', xp: 420 },
    { name: 'NebulaNerd', xp: 350 },
    { name: 'PhotonPhil', xp: 280 },
    { name: 'GravityGuru', xp: 200 }
  ];

  // Insert user into the list
  const allUsers = [...fakeUsers, { name: 'You', xp: xp, isUser: true }];
  allUsers.sort((a, b) => b.xp - a.xp);

  list.innerHTML = allUsers.map((user, i) => `
    <div class="leaderboard-entry ${user.isUser ? 'current-user' : ''} fade-enter" style="animation-delay: ${i * 0.1}s">
      <span class="leaderboard-rank">#${i + 1}</span>
      <span class="leaderboard-name">${user.name} ${user.isUser ? '(You)' : ''}</span>
      <span class="leaderboard-xp">${user.xp} XP</span>
    </div>
  `).join('');

  updateBadgeDisplay();
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  updateXPDisplay();
  updateBadgeDisplay();
});
