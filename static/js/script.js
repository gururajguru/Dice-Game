/**
 * script.js — Dice Game Frontend Logic
 * =====================================
 * Communicates with the Flask API and drives all UI updates.
 */

'use strict';

// ─────────────────────────────────────────────
//  DOM References
// ─────────────────────────────────────────────
const diceImg          = document.getElementById('dice-img');
const btnRoll          = document.getElementById('btn-roll');
const btnNewGame       = document.getElementById('btn-new-game');
const btnPlayAgain     = document.getElementById('btn-play-again');
const winnerOverlay    = document.getElementById('winner-overlay');
const winnerName       = document.getElementById('winner-name');
const winnerScoreText  = document.getElementById('winner-score-text');
const confettiContainer = document.getElementById('confetti-container');

const p1Score    = document.getElementById('p1-score');
const p2Score    = document.getElementById('p2-score');
const p1Progress = document.getElementById('p1-progress');
const p2Progress = document.getElementById('p2-progress');
const p1ProgLabel= document.getElementById('p1-prog-label');
const p2ProgLabel= document.getElementById('p2-prog-label');
const p1Status   = document.getElementById('p1-status');
const p2Status   = document.getElementById('p2-status');
const p1Chips    = document.getElementById('p1-chips');
const p2Chips    = document.getElementById('p2-chips');

const turnName      = document.getElementById('turn-name');
const lastRollBadge = document.getElementById('last-roll-badge');
const rollEventMsg  = document.getElementById('roll-event-msg');
const logList       = document.getElementById('log-list');
const p1Card        = document.getElementById('card-p1');
const p2Card        = document.getElementById('card-p2');
const diceGlowP1    = document.getElementById('glow-p1');
const diceGlowP2    = document.getElementById('glow-p2');

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────
const WINNING_SCORE   = 30;
const BONUS_ROLLS     = new Set([1, 6]);
const DICE_IMG_BASE   = '/static/images/dice-';
const DICE_IMG_EXT    = '.jpg';

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
let isRolling   = false;
let gameOver    = false;
let playerRolls = { 1: [], 2: [] };   // per-player roll history chips

// ─────────────────────────────────────────────
//  Particle Canvas Background
// ─────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize);
  resize();

  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.3,
    speed: Math.random() * 0.3 + 0.05,
    opacity: Math.random() * 0.6 + 0.1,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 255, ${s.opacity})`;
      ctx.fill();
      s.y += s.speed;
      if (s.y > canvas.height) { s.y = -2; s.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─────────────────────────────────────────────
//  API Helpers
// ─────────────────────────────────────────────
async function apiPost(url, body = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────
//  Dice Animation
// ─────────────────────────────────────────────
function animateDiceRoll(finalValue) {
  return new Promise(resolve => {
    let iterations = 0;
    const maxIterations = 8;
    diceImg.classList.add('rolling');

    const interval = setInterval(() => {
      const rnd = Math.floor(Math.random() * 6) + 1;
      diceImg.src = `${DICE_IMG_BASE}${rnd}${DICE_IMG_EXT}`;
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        diceImg.src = `${DICE_IMG_BASE}${finalValue}${DICE_IMG_EXT}`;
        diceImg.classList.remove('rolling');
        resolve();
      }
    }, 60);
  });
}

// ─────────────────────────────────────────────
//  Confetti
// ─────────────────────────────────────────────
function launchConfetti() {
  confettiContainer.innerHTML = '';
  const colors = ['#6c63ff','#ff6584','#ffd700','#00d4aa','#ffb347','#a29bfe','#ff9eb5'];
  const count = 60;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = `${Math.random() * 100}%`;
    el.style.width = `${Math.random() * 10 + 5}px`;
    el.style.height = `${Math.random() * 10 + 5}px`;
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = `${Math.random() * 2 + 1.5}s`;
    el.style.animationDelay = `${Math.random() * 0.5}s`;
    confettiContainer.appendChild(el);
  }
}

// ─────────────────────────────────────────────
//  Button Ripple Effect
// ─────────────────────────────────────────────
btnRoll.addEventListener('click', function(e) {
  const rect = this.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.cssText = `
    width: ${size}px; height: ${size}px;
    left: ${e.clientX - rect.left - size/2}px;
    top: ${e.clientY - rect.top - size/2}px;
  `;
  this.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});

// ─────────────────────────────────────────────
//  UI Rendering
// ─────────────────────────────────────────────
function updatePlayerCard(state, playerId) {
  const player  = state.players.find(p => p.player_id === playerId);
  const scoreEl = playerId === 1 ? p1Score : p2Score;
  const progEl  = playerId === 1 ? p1Progress : p2Progress;
  const progLbl = playerId === 1 ? p1ProgLabel : p2ProgLabel;
  const cardEl  = playerId === 1 ? p1Card : p2Card;
  const chipsEl = playerId === 1 ? p1Chips : p2Chips;
  const statusEl= playerId === 1 ? p1Status : p2Status;

  const isActive   = state.current_player_id === playerId && !state.game_over;
  const pct        = Math.min((player.score / WINNING_SCORE) * 100, 100).toFixed(1);

  // Score
  if (scoreEl.textContent !== String(player.score)) {
    scoreEl.textContent = player.score;
    scoreEl.classList.remove('flash');
    void scoreEl.offsetWidth;  // reflow to re-trigger
    scoreEl.classList.add('flash');
  }

  // Progress bar
  progEl.style.width = `${pct}%`;
  progLbl.textContent = `${player.score} / ${WINNING_SCORE}`;

  // Active card
  cardEl.classList.toggle('active', isActive);

  // Glow ring on dice
  if (playerId === 1) {
    diceGlowP1.classList.toggle('active', isActive);
    diceGlowP2.classList.toggle('active', !isActive && !state.game_over);
  }

  // Roll chips — rebuild from roll_history
  if (state.last_roll !== null) {
    const rolls = playerRolls[playerId];
    // Only add the chip when it's this player's last roll
    const lastEntry = [...state.roll_history].reverse().find(r => r.player_id === playerId);
    const chips = [...(playerRolls[playerId] || [])];
    chipsEl.innerHTML = chips.map(c => `
      <span class="chip ${c.bonus ? 'bonus' : ''}">${c.bonus ? '⭐' : ''} ${c.roll}</span>
    `).join('');
  }

  // Status text
  if (isActive) {
    statusEl.innerHTML = state.extra_throw
      ? `<span class="active-indicator">🎲 Extra Throw!</span>`
      : `<span class="active-indicator">▶ Your Turn</span>`;
  } else if (state.game_over && state.winner_id === playerId) {
    statusEl.innerHTML = `<span class="active-indicator">🏆 Winner!</span>`;
  } else {
    statusEl.innerHTML = `<span style="color:var(--text-muted); font-size:0.82rem;">Waiting...</span>`;
  }
}

function updateTurnBanner(state) {
  const current = state.players.find(p => p.player_id === state.current_player_id);
  turnName.textContent = current ? current.name : '—';
  turnName.style.color = state.current_player_id === 1
    ? 'var(--accent-p1)' : 'var(--accent-p2)';
}

function updateRollButton(state) {
  const isP2Turn = state.current_player_id === 2;
  btnRoll.classList.toggle('p2-turn', isP2Turn);
  btnRoll.disabled = state.game_over || isRolling;

  if (state.game_over) {
    btnRoll.innerHTML = `<span class="btn-icon">🏆</span> Game Over`;
  } else if (state.extra_throw) {
    btnRoll.innerHTML = `<span class="btn-icon">🎲</span> Extra Throw!`;
  } else {
    const name = state.players.find(p => p.player_id === state.current_player_id)?.name || '';
    btnRoll.innerHTML = `<span class="btn-icon">🎲</span> Roll — ${name}`;
  }
}

function updateRollEvent(event, roll) {
  const msgs = {
    extra_throw: roll === 1
      ? `🌟 Rolled a <strong>1</strong> — Lucky! Roll again!`
      : `🔥 Rolled a <strong>6</strong> — Maximum! Roll again!`,
    turn_end: `✅ Rolled <strong>${roll}</strong> — Turn ends. Next player!`,
    win: `🏆 Rolled <strong>${roll}</strong> — Winning roll!`,
  };
  rollEventMsg.innerHTML = msgs[event] || `Rolled ${roll}`;
}

function addLogEntry(state, event, roll) {
  const player = state.players.find(p => p.player_id === state.current_player_id)
    || state.players.find(p => p.player_id === state.winner_id);

  const li = document.createElement('li');
  const pClass = state.winner_id === player?.player_id && event === 'win'
    ? 'win-log'
    : `p${player?.player_id}-log`;
  li.className = `log-item ${pClass}`;

  const bonus = BONUS_ROLLS.has(roll) && event !== 'win';
  const bonusBadge = bonus ? `<span class="log-bonus">+throw</span>` : '';

  li.innerHTML = `
    <span class="log-player">${player?.name || '?'}</span>
    <span class="log-text">${event === 'win' ? 'wins with' : 'rolled'}</span>
    <span class="log-roll">${roll}</span>
    ${bonusBadge}
    <span style="color:var(--text-muted);font-size:0.7rem;margin-left:auto">${player?.score ?? '?'} pts</span>
  `;
  logList.prepend(li);
}

function showWinnerOverlay(state) {
  const winner = state.players.find(p => p.player_id === state.winner_id);
  winnerName.textContent = winner?.name || 'Winner!';
  winnerScoreText.innerHTML = `Reached <span>${winner?.score} points</span> to win!`;
  winnerOverlay.classList.add('show');
  launchConfetti();
}

function updateLastRollBadge(roll, isBonus) {
  lastRollBadge.textContent = roll;
  lastRollBadge.className = `last-roll-badge show ${isBonus ? 'bonus-badge' : 'normal-badge'}`;
}

// ─────────────────────────────────────────────
//  Main Render — apply full state to UI
// ─────────────────────────────────────────────
function renderState(state) {
  updatePlayerCard(state, 1);
  updatePlayerCard(state, 2);
  updateTurnBanner(state);
  updateRollButton(state);
}

// ─────────────────────────────────────────────
//  Roll Action
// ─────────────────────────────────────────────
async function handleRoll() {
  if (isRolling || gameOver) return;
  isRolling = true;
  btnRoll.disabled = true;

  try {
    // Immediately start dice animation with random values
    const rollPromise = animateDiceRoll(1);   // placeholder — we override after API call

    const data = await apiPost('/api/roll');

    // Finish the animation with the real value
    await animateDiceRoll(data.roll);

    // Update roll chips
    const currentPlayerId = data.current_player_id;
    const prevPlayerId = data.event === 'turn_end' ? currentPlayerId === 1 ? 2 : 1 : currentPlayerId;
    if (!playerRolls[prevPlayerId]) playerRolls[prevPlayerId] = [];
    playerRolls[prevPlayerId].push({ roll: data.roll, bonus: BONUS_ROLLS.has(data.roll) && data.event !== 'win' });

    // Cap chips to last 8 per player
    if (playerRolls[prevPlayerId].length > 8) playerRolls[prevPlayerId] = playerRolls[prevPlayerId].slice(-8);

    // Apply chips to the card that just rolled
    const chipsEl = prevPlayerId === 1 ? p1Chips : p2Chips;
    chipsEl.innerHTML = playerRolls[prevPlayerId].map(c => `
      <span class="chip ${c.bonus ? 'bonus' : ''}">${c.bonus ? '⭐' : ''} ${c.roll}</span>
    `).join('');

    // Update badge
    updateLastRollBadge(data.roll, BONUS_ROLLS.has(data.roll) && data.event !== 'win');

    // Roll event message
    updateRollEvent(data.event, data.roll);

    // Add to log
    addLogEntry(data, data.event, data.roll);

    // Render full state
    renderState(data);

    if (data.event === 'win') {
      gameOver = true;
      setTimeout(() => showWinnerOverlay(data), 900);
    }

  } catch (err) {
    console.error('Roll failed:', err);
    rollEventMsg.innerHTML = `<span style="color:var(--accent-p2)">⚠ Network error. Try again.</span>`;
  } finally {
    isRolling = false;
    if (!gameOver) btnRoll.disabled = false;
  }
}

// ─────────────────────────────────────────────
//  New Game / Reset
// ─────────────────────────────────────────────
async function handleNewGame() {
  try {
    const data = await apiPost('/api/reset');
    gameOver    = false;
    isRolling   = false;
    playerRolls = { 1: [], 2: [] };

    // Clear UI state
    logList.innerHTML  = '';
    p1Chips.innerHTML  = '';
    p2Chips.innerHTML  = '';
    rollEventMsg.innerHTML = `<span style="color:var(--text-muted)">Press Roll to begin!</span>`;
    lastRollBadge.className = 'last-roll-badge';
    diceImg.src = `${DICE_IMG_BASE}1${DICE_IMG_EXT}`;
    winnerOverlay.classList.remove('show');
    confettiContainer.innerHTML = '';

    renderState(data);
  } catch (err) {
    console.error('Reset failed:', err);
  }
}

// ─────────────────────────────────────────────
//  Event Listeners
// ─────────────────────────────────────────────
btnRoll.addEventListener('click', handleRoll);
btnNewGame.addEventListener('click', handleNewGame);
btnPlayAgain.addEventListener('click', handleNewGame);

// Keyboard shortcut: Space or Enter to roll
document.addEventListener('keydown', e => {
  if ((e.code === 'Space' || e.code === 'Enter') && document.activeElement.tagName !== 'BUTTON') {
    e.preventDefault();
    if (!gameOver && !isRolling) handleRoll();
  }
  if (e.code === 'KeyN') handleNewGame();
});

// ─────────────────────────────────────────────
//  Initialise on Load
// ─────────────────────────────────────────────
(async function init() {
  try {
    const state = await apiGet('/api/state');
    renderState(state);
    rollEventMsg.innerHTML = `<span style="color:var(--text-muted)">Press Roll to begin!</span>`;
  } catch (err) {
    console.error('Init failed:', err);
  }
})();
