// ── Levels ──────────────────────────────────────────────
const LEVELS = [
  { name: "Level 1: Home Row",    keys: [..."ASDFGHJKL"] },
  { name: "Level 2: Warming Up",  keys: [..."ASDFGHJKLEI"] },
  { name: "Level 3: Full Middle", keys: [..."ASDFGHJKLQWERTYUIOP"] },
  { name: "Level 4: Full Alpha",  keys: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"] },
];

const SESSION_LENGTH = 30;
const $ = id => document.getElementById(id);

// ── State ────────────────────────────────────────────────
let state = {
  level: parseInt(localStorage.getItem("kb_level") || "0"),
  lastTs: null,
  total: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  sessionCount: 0,
  cpmReadings: [],
  currentCPM: 0,
};

<<<<<<< HEAD
// ── Audio Engine (real MP3 files) ────────────────────────
const WRONG_SOUNDS = [
=======
// ── Audio Engine ─────────────────────────────────────────
const WRONG_SRCS = [
>>>>>>> 0834439 (refactor: Simplify audio playback logic and preload audio clips)
  "addon/scream_chicken_tree.mp3",
  "addon/chloo.mp3",
  "addon/uoooo.mp3",
  "addon/fahhh.mp3",
  "addon/anime_aah.mp3",
];

<<<<<<< HEAD
// Preload all audio
const wrongAudios = WRONG_SOUNDS.map(src => { const a = new Audio(src); a.preload = "auto"; return a; });
const levelUpAudio = new Audio("addon/aye.mp3");
levelUpAudio.preload = "auto";

// Correct key — keep Web Audio API ping (lightweight, instant)
=======
// Preload all clips
const wrongAudios = WRONG_SRCS.map(src => new Audio(src));
const levelUpAudio = new Audio("addon/aye.mp3");

// Unlock audio on first user gesture (browser autoplay policy)
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  [...wrongAudios, levelUpAudio].forEach(a => {
    a.play().then(() => a.pause()).catch(() => {});
    a.currentTime = 0;
  });
}
document.addEventListener("keydown", unlockAudio, { once: true });

// Correct key — Web Audio API ping (instant, no file latency)
>>>>>>> 0834439 (refactor: Simplify audio playback logic and preload audio clips)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playCorrect() {
  try {
    const ctx = getAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.12);
  } catch {}
}

function playWrong() {
  try {
    const audio = wrongAudios[Math.floor(Math.random() * wrongAudios.length)];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

function playLevelUp() {
  try {
    levelUpAudio.currentTime = 0;
    levelUpAudio.play().catch(() => {});
  } catch {}
}

// ── Speedometer (Canvas) ─────────────────────────────────
const canvas = $("speedometer");
const ctx2d = canvas.getContext("2d");
let needleAngle = -Math.PI * 0.75;
let targetAngle = -Math.PI * 0.75;

function cpmToAngle(cpm) {
  const max = 300;
  const ratio = Math.min(cpm / max, 1);
  return -Math.PI * 0.75 + ratio * Math.PI * 1.5;
}

function drawSpeedometer(cpm) {
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2 + 10;
  const r = w * 0.38;
  ctx2d.clearRect(0, 0, w, h);

  // Track
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.75);
  ctx2d.strokeStyle = "rgba(255,255,255,0.08)";
  ctx2d.lineWidth = 8;
  ctx2d.lineCap = "round";
  ctx2d.stroke();

  // Fill arc — lavender → fire at high CPM
  const fillAngle = cpmToAngle(cpm);
  const isHot = cpm > 200;
  const grad = ctx2d.createLinearGradient(cx - r, cy, cx + r, cy);
  grad.addColorStop(0, "#cbb7fb");
  grad.addColorStop(1, isHot ? "#ff6b35" : "#a78bfa");
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, r, -Math.PI * 0.75, fillAngle);
  ctx2d.strokeStyle = grad;
  ctx2d.lineWidth = 8;
  ctx2d.lineCap = "round";
  ctx2d.stroke();

  // Needle
  ctx2d.save();
  ctx2d.translate(cx, cy);
  ctx2d.rotate(needleAngle);
  ctx2d.beginPath();
  ctx2d.moveTo(0, 4);
  ctx2d.lineTo(r * 0.72, 0);
  ctx2d.moveTo(0, -4);
  ctx2d.lineTo(r * 0.72, 0);
  ctx2d.strokeStyle = isHot ? "#ff6b35" : "#cbb7fb";
  ctx2d.lineWidth = 2;
  ctx2d.lineCap = "round";
  ctx2d.stroke();
  ctx2d.restore();

  // Center dot
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx2d.fillStyle = "#cbb7fb";
  ctx2d.fill();

  // CPM number
  ctx2d.fillStyle = cpm > 200 ? "#ff6b35" : "#cbb7fb";
  ctx2d.font = `bold ${w * 0.16}px system-ui`;
  ctx2d.textAlign = "center";
  ctx2d.fillText(cpm, cx, cy - r * 0.25);

  ctx2d.fillStyle = "rgba(255,255,255,0.3)";
  ctx2d.font = `${w * 0.09}px system-ui`;
  ctx2d.fillText("CPM", cx, cy - r * 0.05);
}

function animateNeedle() {
  needleAngle += (targetAngle - needleAngle) * 0.12;
  drawSpeedometer(state.currentCPM);
  requestAnimationFrame(animateNeedle);
}
animateNeedle();

// ── Meme API ─────────────────────────────────────────────
const MEME_CACHE_KEY = "kb_memes";

function getMemeCache() {
  try { return JSON.parse(localStorage.getItem(MEME_CACHE_KEY) || "[]"); } catch { return []; }
}

function saveMemeCache(memes) {
  try { localStorage.setItem(MEME_CACHE_KEY, JSON.stringify(memes.slice(-50))); } catch {}
}

async function fetchMeme() {
  try {
    const res = await fetch("https://meme-api.com/gimme");
    const data = await res.json();
    if (data.url) {
      const cache = getMemeCache();
      cache.push(data.url);
      saveMemeCache(cache);
      return data.url;
    }
  } catch {}
  // Fallback: random from cache
  const cache = getMemeCache();
  return cache.length ? cache[Math.floor(Math.random() * cache.length)] : null;
}

let memeTimeout;
function showMeme(url) {
  if (!url) return;
  const panel = $("meme-panel");
  const img = $("meme-img");
  img.src = url;
  panel.hidden = false;
  clearTimeout(memeTimeout);

  if (window.gsap) {
    gsap.fromTo(panel, { x: 240 }, { x: 0, duration: 0.4, ease: "power3.out" });
    memeTimeout = setTimeout(() => {
      gsap.to(panel, { x: 240, duration: 0.35, ease: "power2.in",
        onComplete: () => { panel.hidden = true; } });
    }, 2500);
  } else {
    memeTimeout = setTimeout(() => { panel.hidden = true; }, 2500);
  }
}

// Show meme every 5 correct presses
let memeCounter = 0;
function maybeFetchMeme() {
  memeCounter++;
  if (memeCounter % 5 === 0) {
    fetchMeme().then(showMeme);
  }
}

// ── GSAP helpers ─────────────────────────────────────────
function gsapHit(el) {
  if (!window.gsap || !el) return;
  gsap.fromTo(el, { scale: 1.35 }, { scale: 1, duration: 0.25, ease: "power2.out" });
}

function gsapWrong(el) {
  if (!window.gsap || !el) return;
  gsap.fromTo(el,
    { x: 0 },
    { x: 8, duration: 0.05, ease: "power1.inOut", yoyo: true, repeat: 5,
      onComplete: () => gsap.set(el, { x: 0 }) }
  );
}

function gsapScoreIn() {
  if (!window.gsap) return;
  gsap.fromTo("#score-screen .score-grid .score-item",
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "power3.out", delay: 0.2 }
  );
}

// ── Core logic ───────────────────────────────────────────
function currentKeys() {
  return LEVELS[state.level].keys;
}

function getBestCPM() {
  return parseInt(localStorage.getItem("kb_best") || "0", 10);
}

function saveBestCPM(cpm) {
  if (cpm > getBestCPM()) localStorage.setItem("kb_best", cpm);
}

function updateUI() {
  const acc = state.total === 0 ? "—" : Math.round((state.correct / state.total) * 100) + "%";
  $("accuracy-value").textContent = acc;
  $("streak-value").textContent = state.streak;
  const best = getBestCPM();
  $("best-value").textContent = best > 0 ? best : "—";
}

function updateProgress() {
  const pct = (state.sessionCount / SESSION_LENGTH) * 100;
  $("progress-fill").style.width = pct + "%";
  $("session-label").textContent = `${state.sessionCount} / ${SESSION_LENGTH}`;
}

function targetRandomKey() {
  const keys = currentKeys();
  const key = keys[Math.floor(Math.random() * keys.length)];
  const el = $(key);
  if (!el) return targetRandomKey();
  el.classList.add("selected");
}

function endSession() {
  const avgCPM = state.cpmReadings.length
    ? Math.round(state.cpmReadings.reduce((a, b) => a + b, 0) / state.cpmReadings.length)
    : 0;
  const acc = state.total === 0 ? "0%" : Math.round((state.correct / state.total) * 100) + "%";

  saveBestCPM(avgCPM);

  // Level up if accuracy >= 80% and avgCPM meets threshold
  const thresholds = [15, 20, 25, 30];
  const accNum = parseInt(acc);
  if (state.level < LEVELS.length - 1 && accNum >= 80 && avgCPM >= thresholds[state.level]) {
    state.level = Math.min(state.level + 1, LEVELS.length - 1);
    localStorage.setItem("kb_level", state.level);
    playLevelUp();
    $("level-name").textContent = LEVELS[state.level].name;
    if (window.gsap) {
      gsap.fromTo("#level-badge", { scale: 1.3, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.6, ease: "elastic.out(1,0.5)" });
    }
  }

  $("final-cpm").textContent = avgCPM || "—";
  $("final-accuracy").textContent = acc;
  $("final-streak").textContent = state.bestStreak;
  $("score-screen").hidden = false;
  gsapScoreIn();
}

function resetSession() {
  state.lastTs = null;
  state.total = 0;
  state.correct = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.sessionCount = 0;
  state.cpmReadings = [];
  state.currentCPM = 0;
  memeCounter = 0;
  targetAngle = cpmToAngle(0);

  $("score-screen").hidden = true;
  $("cpm-value").textContent = "0";
  $("level-name").textContent = LEVELS[state.level].name;
  updateUI();
  updateProgress();

  const prev = document.querySelector(".selected");
  if (prev) prev.classList.remove("selected");
  targetRandomKey();
}

// ── Input handler ────────────────────────────────────────
document.addEventListener("keyup", event => {
  if (!$("score-screen").hidden) {
    if (event.key === " " || event.key === "Enter") resetSession();
    return;
  }

  const keyPressed = event.key.toUpperCase();
  const keyEl = $(keyPressed);
  const highlighted = document.querySelector(".selected");
  if (!highlighted) return;

  state.total++;

  if (keyEl) gsapHit(keyEl);

  if (keyPressed === highlighted.id) {
    // ✅ Correct
    state.correct++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    state.sessionCount++;
    playCorrect();
    maybeFetchMeme();

    const now = Date.now();
    if (state.lastTs !== null) {
      const cpm = Math.round(60000 / (now - state.lastTs));
      state.cpmReadings.push(cpm);
      state.currentCPM = cpm;
      targetAngle = cpmToAngle(cpm);
      $("cpm-value").textContent = cpm;
    }
    state.lastTs = now;

    updateUI();
    updateProgress();
    highlighted.classList.remove("selected");

    if (state.sessionCount >= SESSION_LENGTH) {
      endSession();
    } else {
      targetRandomKey();
    }
  } else {
    // ❌ Wrong
    state.streak = 0;
    playWrong();
    updateUI();

    if (keyEl) {
      gsapWrong(keyEl);
      keyEl.classList.add("wrong");
      setTimeout(() => keyEl.classList.remove("wrong"), 300);
    }

    // Vignette flash
    const v = $("vignette");
    v.classList.add("flash");
    setTimeout(() => v.classList.remove("flash"), 200);
  }
});

$("restart-btn").addEventListener("click", resetSession);

// ── Init ─────────────────────────────────────────────────
$("level-name").textContent = LEVELS[state.level].name;
$("best-value").textContent = getBestCPM() > 0 ? getBestCPM() : "—";
updateProgress();
drawSpeedometer(0);
targetRandomKey();

// Pre-fetch a meme on load
fetchMeme();
