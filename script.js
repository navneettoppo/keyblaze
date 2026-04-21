// ── Levels ──────────────────────────────────────────────
const LEVELS = [
  { name: "Level 1: Home Row",    mode: "keys",     keys: [..."ASDFGHJKL"] },
  { name: "Level 2: Warming Up",  mode: "keys",     keys: [..."ASDFGHJKLQWERUIOPYTZXCVBNM"] },
  { name: "Level 3: Full Alpha",  mode: "keys",     keys: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"] },
  { name: "Level 4: Words",       mode: "words",    words: [
    // covers every letter of the alphabet, psychology-habit loop words
    "blaze","quick","jumpy","vexed","fritz","woken","squad","proxy",
    "focus","grind","habit","input","jazzy","knack","logic","mixed",
    "nexus","oxide","pivot","query","reflex","synth","track","ultra",
    "valor","wired","xenon","yield","zonal","adapt","boost","craft",
    "drive","excel","forge","grasp","hinge","index","joint","kinetic",
    "learn","motor","nerve","output","power","quest","rapid","skill",
    "tempo","unify","vivid","watch","exact","young","zest"
  ]},
  { name: "Level 5: Sentences",   mode: "sentence", sentences: [], dynamic: "quotes" },
  { name: "Level 6: Jokes",       mode: "sentence", sentences: [], dynamic: "jokes" },
];

const SESSION_LENGTH = 30;
const $ = id => document.getElementById(id);

// ── State ────────────────────────────────────────────────
let state = {
  level: parseInt(localStorage.getItem("kb_level") || "0"),
  lastTs: null,
  total: 0, correct: 0, streak: 0, bestStreak: 0,
  sessionCount: 0, cpmReadings: [], currentCPM: 0,
  // word/sentence mode
  currentWord: "", typedIndex: 0,
};

// ── Audio Engine ─────────────────────────────────────────
const WRONG_SRCS = [
  "addon/scream_chicken_tree.mp3","addon/chloo.mp3",
  "addon/uoooo.mp3","addon/fahhh.mp3","addon/anime_aah.mp3",
];
const wrongAudios = WRONG_SRCS.map(src => new Audio(src));
const levelUpAudio = new Audio("addon/aye.mp3");

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  [...wrongAudios, levelUpAudio].forEach(a => { a.play().then(() => a.pause()).catch(() => {}); a.currentTime = 0; });
}
document.addEventListener("keydown", unlockAudio, { once: true });

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function getAudioCtx() { if (!audioCtx) audioCtx = new AudioCtx(); return audioCtx; }

function playCorrect() {
  try {
    const ctx = getAudioCtx(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(); o.stop(ctx.currentTime + 0.12);
  } catch {}
}
function playWrong() {
  try { const a = wrongAudios[Math.floor(Math.random() * wrongAudios.length)]; a.currentTime = 0; a.play().catch(() => {}); } catch {}
}
function playLevelUp() {
  try { levelUpAudio.currentTime = 0; levelUpAudio.play().catch(() => {}); } catch {}
}

// ── Speedometer (DPR-aware, 88px golden ratio) ───────────
const canvas = $("speedometer");
const ctx2d = canvas.getContext("2d");
let needleAngle = -Math.PI * 0.75;
let targetAngle = -Math.PI * 0.75;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const size = 88;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  ctx2d.scale(dpr, dpr);
}

resizeCanvas();

function cpmToAngle(cpm) {
  return -Math.PI * 0.75 + Math.min(cpm / 300, 1) * Math.PI * 1.5;
}

function drawSpeedometer(cpm) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr, h = canvas.height / dpr;
  const cx = w / 2, cy = h * 0.54, r = w * 0.36;
  ctx2d.clearRect(0, 0, w, h);

  // Tick marks
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
    const inner = i % 5 === 0 ? r * 0.78 : r * 0.85;
    ctx2d.beginPath();
    ctx2d.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx2d.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx2d.strokeStyle = i % 5 === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)";
    ctx2d.lineWidth = i % 5 === 0 ? 1.5 : 1;
    ctx2d.stroke();
  }

  // Track
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, r, -Math.PI * 0.75, Math.PI * 0.75);
  ctx2d.strokeStyle = "rgba(255,255,255,0.07)";
  ctx2d.lineWidth = 7; ctx2d.lineCap = "round"; ctx2d.stroke();

  // Fill arc
  const isHot = cpm > 200;
  if (cpm > 0) {
    const grad = ctx2d.createLinearGradient(cx - r, cy, cx + r, cy);
    grad.addColorStop(0, "#cbb7fb");
    grad.addColorStop(1, isHot ? "#ff6b35" : "#a78bfa");
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r, -Math.PI * 0.75, cpmToAngle(cpm));
    ctx2d.strokeStyle = grad;
    ctx2d.lineWidth = 7; ctx2d.lineCap = "round"; ctx2d.stroke();
  }

  // Needle shadow
  ctx2d.save();
  ctx2d.translate(cx, cy); ctx2d.rotate(needleAngle);
  ctx2d.shadowColor = isHot ? "#ff6b35" : "#cbb7fb";
  ctx2d.shadowBlur = 6;
  ctx2d.beginPath();
  ctx2d.moveTo(-4, 0); ctx2d.lineTo(r * 0.68, 0);
  ctx2d.strokeStyle = isHot ? "#ff6b35" : "#cbb7fb";
  ctx2d.lineWidth = 2; ctx2d.lineCap = "round"; ctx2d.stroke();
  ctx2d.restore();

  // Center dot
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx2d.fillStyle = "#cbb7fb"; ctx2d.fill();

  // CPM number
  ctx2d.fillStyle = isHot ? "#ff6b35" : "#cbb7fb";
  ctx2d.font = `300 ${w * 0.18}px system-ui`;
  ctx2d.textAlign = "center";
  ctx2d.fillText(cpm, cx, cy - r * 0.3);

  ctx2d.fillStyle = "rgba(255,255,255,0.25)";
  ctx2d.font = `700 ${w * 0.08}px system-ui`;
  ctx2d.letterSpacing = "0.1em";
  ctx2d.fillText("CPM", cx, cy - r * 0.08);

  // Speed zone label
  const zone = cpm < 60 ? "Slow" : cpm < 150 ? "Normal" : cpm < 220 ? "Fast" : "Beast";
  ctx2d.fillStyle = isHot ? "rgba(255,107,53,0.6)" : "rgba(203,183,251,0.4)";
  ctx2d.font = `600 ${w * 0.07}px system-ui`;
  ctx2d.fillText(zone, cx, cy + r * 0.35);
}

function animateNeedle() {
  needleAngle += (targetAngle - needleAngle) * 0.1;
  drawSpeedometer(state.currentCPM);
  requestAnimationFrame(animateNeedle);
}
animateNeedle();

// ── Dynamic Content Loader ────────────────────────────────
const DAILY_KEY = "kb_daily_" + new Date().toDateString();

async function loadDailyQuotes() {
  const cached = localStorage.getItem(DAILY_KEY + "_quotes");
  if (cached) { LEVELS[4].sentences = JSON.parse(cached); return; }
  try {
    const res = await fetch("https://api.quotable.io/quotes/random?limit=20&maxLength=80");
    const data = await res.json();
    const quotes = data.map(q => q.content.toLowerCase().replace(/[^a-z0-9 .,!?'-]/g, ""));
    LEVELS[4].sentences = quotes;
    localStorage.setItem(DAILY_KEY + "_quotes", JSON.stringify(quotes));
  } catch {
    LEVELS[4].sentences = [
      "the quick brown fox jumps over the lazy dog",
      "practice makes perfect every single day",
      "speed comes from accuracy not from rushing",
      "keep your eyes on the screen and fingers on keys",
      "type with confidence and never look down",
    ];
  }
}

async function loadJokes() {
  const cached = localStorage.getItem(DAILY_KEY + "_jokes");
  if (cached) { LEVELS[5].sentences = JSON.parse(cached); return; }
  try {
    const res = await fetch("https://official-joke-api.appspot.com/jokes/ten");
    const data = await res.json();
    const jokes = data.map(j => (j.setup + " " + j.punchline).toLowerCase().replace(/[^a-z0-9 .,!?'-]/g, ""));
    LEVELS[5].sentences = jokes;
    localStorage.setItem(DAILY_KEY + "_jokes", JSON.stringify(jokes));
  } catch {
    LEVELS[5].sentences = [
      "why do programmers prefer dark mode because light attracts bugs",
      "i told my keyboard a joke but it did not laugh it was too key board",
      "why was the computer cold because it left its windows open",
      "what do you call a fish without eyes a fsh",
      "why do cows wear bells because their horns do not work",
    ];
  }
}

// ── Meme Engine — multi-source, browser-safe ─────────────
const seenMemes = new Set();
let imgflipMemes = [];

// Pre-fetch imgflip meme template list (i.imgflip.com CDN — no CORS issues)
fetch("https://api.imgflip.com/get_memes")
  .then(r => r.json())
  .then(d => { imgflipMemes = d.data.memes.map(m => m.url); })
  .catch(() => {});

// Memegen.link: pure URL-based meme images, no fetch/CORS needed
const MEMEGEN_TEMPLATES = [
  "doge","drake","buzz","distracted","change-my-mind","two-buttons",
  "uno-reverse","this-is-fine","hide-the-pain","success","bad-luck-brian",
  "first-world-problems","ancient-aliens","grumpy-cat","philosoraptor"
];
const MEMEGEN_TEXTS = [
  ["when you type","without looking down"],
  ["me after level 1","me after level 5"],
  ["fingers on home row","fingers everywhere else"],
  ["typing speed 20 wpm","typing speed 200 wpm"],
  ["practice every day","become a keyboard god"],
  ["ctrl n","unlocks all levels"],
  ["one more session","said every typist ever"],
  ["accuracy matters","speed follows"],
];

function getMemegenUrl() {
  const tpl = MEMEGEN_TEMPLATES[Math.floor(Math.random() * MEMEGEN_TEMPLATES.length)];
  const txt = MEMEGEN_TEXTS[Math.floor(Math.random() * MEMEGEN_TEXTS.length)];
  const top = encodeURIComponent(txt[0]).replace(/%20/g, "_");
  const bot = encodeURIComponent(txt[1]).replace(/%20/g, "_");
  return `https://api.memegen.link/images/${tpl}/${top}/${bot}.jpg?width=400`;
}

async function getNextMeme() {
  // 1. Try imgflip CDN (direct image URLs, no CORS)
  if (imgflipMemes.length) {
    const unseen = imgflipMemes.filter(u => !seenMemes.has(u));
    const pool = unseen.length ? unseen : imgflipMemes;
    const url = pool[Math.floor(Math.random() * pool.length)];
    seenMemes.add(url);
    return url;
  }
  // 2. Fallback: memegen.link (URL-based, always works)
  return getMemegenUrl();
}

let memeTimeout;
let memeInterval = null;

function showMeme(url) {
  if (!url) return;
  const panel = $("meme-panel");
  const img = $("meme-img");
  console.log("Meme URL:", url);
  img.style.opacity = "0";
  panel.classList.remove("visible");
  img.onload = () => { console.log("Meme loaded"); img.style.opacity = "1"; panel.classList.add("visible"); };
  img.onerror = () => { console.log("Meme failed, using fallback"); img.src = getMemegenUrl(); };
  img.src = url;
  clearTimeout(memeTimeout);
  memeTimeout = setTimeout(() => panel.classList.remove("visible"), 6000);
}

function startMemeTimer() {
  stopMemeTimer();
  memeInterval = setInterval(() => getNextMeme().then(showMeme), 15000);
}

function stopMemeTimer() {
  if (memeInterval) { clearInterval(memeInterval); memeInterval = null; }
}

function maybeFetchMeme() {
  getNextMeme().then(showMeme);
}

// ── GSAP helpers ─────────────────────────────────────────
function gsapHit(el) {
  if (!window.gsap || !el) return;
  gsap.fromTo(el, { scale: 1.35 }, { scale: 1, duration: 0.25, ease: "power2.out" });
}
function gsapWrong(el) {
  if (!window.gsap || !el) return;
  gsap.fromTo(el, { x: 0 }, { x: 8, duration: 0.05, ease: "power1.inOut", yoyo: true, repeat: 5, onComplete: () => gsap.set(el, { x: 0 }) });
}
function gsapScoreIn() {
  if (!window.gsap) return;
  gsap.fromTo("#score-screen .score-grid .score-item", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: "power3.out", delay: 0.2 });
}

// ── Word / Sentence mode ──────────────────────────────────
function getNextWord() {
  const lvl = LEVELS[state.level];
  if (lvl.mode === "words") return lvl.words[Math.floor(Math.random() * lvl.words.length)].toUpperCase();
  if (lvl.mode === "sentence") {
    const pool = lvl.sentences;
    if (!pool.length) return "LOADING PLEASE WAIT".toUpperCase();
    const s = pool[Math.floor(Math.random() * pool.length)];
    return s.toUpperCase();
  }
  return "";
}

function renderWordPrompt() {
  const prompt = $("word-prompt");
  const word = state.currentWord;
  const i = state.typedIndex;
  prompt.innerHTML =
    `<span class="typed">${word.slice(0, i)}</span>` +
    `<span class="current">${word[i] || ""}</span>` +
    `<span class="remaining">${word.slice(i + 1)}</span>`;
}

function highlightCurrentKey() {
  const prev = document.querySelector(".selected");
  if (prev) prev.classList.remove("selected");

  const lvl = LEVELS[state.level];
  if (lvl.mode === "keys") return;

  const ch = state.currentWord[state.typedIndex];
  if (!ch) return;
  const keyId = ch === " " ? "space" : ch;
  const el = $(keyId);
  if (el) {
    el.classList.add("selected");
  }
}

// ── Core logic ───────────────────────────────────────────
function getBestCPM() { return parseInt(localStorage.getItem("kb_best") || "0", 10); }
function saveBestCPM(cpm) { if (cpm > getBestCPM()) localStorage.setItem("kb_best", cpm); }

function updateCheckpoints() {
  document.querySelectorAll(".cp").forEach(cp => {
    const l = parseInt(cp.dataset.level);
    cp.classList.toggle("active", l === state.level);
    cp.classList.toggle("done", l < state.level);
  });
  document.querySelectorAll(".cp-line").forEach((line, i) => {
    line.classList.toggle("done", i < state.level);
  });
}

function updateUI() {
  const acc = state.total === 0 ? "—" : Math.round((state.correct / state.total) * 100) + "%";
  $("accuracy-value").textContent = acc;
  $("streak-value").textContent = state.streak;
  $("best-value").textContent = getBestCPM() > 0 ? getBestCPM() : "—";
}

function updateProgress() {
  $("progress-fill").style.width = (state.sessionCount / SESSION_LENGTH * 100) + "%";
  $("session-label").textContent = `${state.sessionCount} / ${SESSION_LENGTH}`;
}

function targetRandomKey() {
  const lvl = LEVELS[state.level];
  const prompt = $("word-prompt");

  if (lvl.mode === "keys") {
    prompt.hidden = true;
    const prev = document.querySelector(".selected");
    if (prev) prev.classList.remove("selected");
    const key = lvl.keys[Math.floor(Math.random() * lvl.keys.length)];
    const el = $(key);
    if (!el) return targetRandomKey();
    el.classList.add("selected");
  } else {
    prompt.hidden = false;
    if (!state.currentWord || state.typedIndex >= state.currentWord.length) {
      state.currentWord = getNextWord();
      state.typedIndex = 0;
    }
    renderWordPrompt();
    highlightCurrentKey();
  }
}

function endSession() {
  const avgCPM = state.cpmReadings.length
    ? Math.round(state.cpmReadings.reduce((a, b) => a + b, 0) / state.cpmReadings.length) : 0;
  const accNum = state.total === 0 ? 0 : Math.round((state.correct / state.total) * 100);
  saveBestCPM(avgCPM);

  const thresholds = [15, 20, 30, 40, 50, 60];
  if (state.level < LEVELS.length - 1 && accNum >= 80 && avgCPM >= thresholds[state.level]) {
    state.level = Math.min(state.level + 1, LEVELS.length - 1);
    localStorage.setItem("kb_level", state.level);
    playLevelUp();
    $("level-name").textContent = LEVELS[state.level].name;
    if (window.gsap) gsap.fromTo("#level-badge", { scale: 1.3, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.6, ease: "elastic.out(1,0.5)" });
  }

  $("final-cpm").textContent = avgCPM || "—";
  $("final-accuracy").textContent = accNum + "%";
  $("final-streak").textContent = state.bestStreak;
  $("score-screen").hidden = false;
  stopMemeTimer();
  gsapScoreIn();
}

function resetSession() {
  Object.assign(state, { lastTs: null, total: 0, correct: 0, streak: 0, bestStreak: 0, sessionCount: 0, cpmReadings: [], currentCPM: 0, currentWord: "", typedIndex: 0 });
  targetAngle = cpmToAngle(0);
  $("score-screen").hidden = true;
  $("cpm-value").textContent = "0";
  $("level-name").textContent = LEVELS[state.level].name;
  updateUI(); updateProgress(); updateCheckpoints();

  // Start meme timer for all levels
  startMemeTimer();

  targetRandomKey();
}

// ── Input handler ────────────────────────────────────────
document.addEventListener("keyup", event => {
  if (!$("score-screen").hidden) {
    if (event.key === " " || event.key === "Enter") resetSession();
    return;
  }

  const lvl = LEVELS[state.level];

  if (lvl.mode === "keys") {
    const keyPressed = event.key.toUpperCase();
    const keyEl = $(keyPressed);
    const highlighted = document.querySelector(".selected");
    if (!highlighted) return;

    state.total++;
    if (keyEl) gsapHit(keyEl);

    if (keyPressed === highlighted.id) {
      state.correct++; state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      state.sessionCount++;
      playCorrect();
      maybeFetchMeme();
      const now = Date.now();
      if (state.lastTs !== null) {
        const cpm = Math.round(60000 / (now - state.lastTs));
        state.cpmReadings.push(cpm); state.currentCPM = cpm;
        targetAngle = cpmToAngle(cpm); $("cpm-value").textContent = cpm;
      }
      state.lastTs = now;
      updateUI(); updateProgress();
      highlighted.classList.remove("selected");
      if (state.sessionCount >= SESSION_LENGTH) endSession();
      else targetRandomKey();
    } else {
      state.streak = 0; playWrong(); updateUI();
      if (keyEl) { gsapWrong(keyEl); keyEl.classList.add("wrong"); setTimeout(() => keyEl.classList.remove("wrong"), 300); }
      const v = $("vignette"); v.classList.add("flash"); setTimeout(() => v.classList.remove("flash"), 200);
    }

  } else {
    // Word / sentence mode
    const ch = state.currentWord[state.typedIndex];
    if (!ch) return;
    const expected = ch;
    const pressed = event.key === " " ? " " : event.key.toUpperCase();
    const keyEl = pressed === " " ? $("space") : $(pressed);

    state.total++;
    if (keyEl) gsapHit(keyEl);

    if (pressed === expected) {
      state.correct++; state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      playCorrect();

      const now = Date.now();
      if (state.lastTs !== null) {
        const cpm = Math.round(60000 / (now - state.lastTs));
        state.cpmReadings.push(cpm); state.currentCPM = cpm;
        targetAngle = cpmToAngle(cpm); $("cpm-value").textContent = cpm;
      }
      state.lastTs = now;

      state.typedIndex++;

      // Word completed
      if (state.typedIndex >= state.currentWord.length) {
        state.sessionCount++;
        maybeFetchMeme();
        updateUI(); updateProgress();
        if (state.sessionCount >= SESSION_LENGTH) { endSession(); return; }
        state.currentWord = getNextWord();
        state.typedIndex = 0;
      }

      renderWordPrompt();
      highlightCurrentKey();
      updateUI(); updateProgress();
    } else {
      state.streak = 0; playWrong(); updateUI();
      if (keyEl) { gsapWrong(keyEl); keyEl.classList.add("wrong"); setTimeout(() => keyEl.classList.remove("wrong"), 300); }
      const v = $("vignette"); v.classList.add("flash"); setTimeout(() => v.classList.remove("flash"), 200);
    }
  }
});

$("restart-btn").addEventListener("click", resetSession);

// ── Touch: tap keys on mobile ─────────────────────────────
document.querySelector(".keyboard").addEventListener("touchstart", e => {
  const li = e.target.closest("li[id]");
  if (!li) return;
  e.preventDefault();
  // Simulate keyup with the key's id
  const key = li.id === "space" ? " " : li.id;
  document.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
}, { passive: false });

// ── Checkpoint click — switch level ──────────────────────
document.querySelector(".checkpoints").addEventListener("click", e => {
  const cp = e.target.closest(".cp[data-level]");
  if (!cp) return;
  const lvl = parseInt(cp.dataset.level);
  state.level = lvl;
  localStorage.setItem("kb_level", lvl);
  $("level-name").textContent = LEVELS[lvl].name;
  if (window.gsap) gsap.fromTo("#level-badge", { scale: 1.2, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.5, ease: "elastic.out(1,0.5)" });
  resetSession();
});

// ── Level dropdown toggle ─────────────────────────────────
const levelBadge = $("level-badge");
const levelDropdown = $("level-dropdown");

levelBadge.addEventListener("click", e => {
  e.stopPropagation();
  const isOpen = !levelDropdown.hidden;
  levelDropdown.hidden = isOpen;
  levelBadge.classList.toggle("open", !isOpen);
  if (!isOpen) {
    document.querySelectorAll(".level-option").forEach(opt => {
      opt.classList.toggle("active", parseInt(opt.dataset.level) === state.level);
    });
  }
});

levelDropdown.addEventListener("click", e => {
  const opt = e.target.closest(".level-option");
  if (!opt) return;
  const lvl = parseInt(opt.dataset.level);
  state.level = lvl;
  localStorage.setItem("kb_level", lvl);
  $("level-name").textContent = LEVELS[lvl].name;
  if (window.gsap) gsap.fromTo("#level-badge", { scale: 1.2, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.5, ease: "elastic.out(1,0.5)" });
  levelDropdown.hidden = true;
  levelBadge.classList.remove("open");
  resetSession();
});

document.addEventListener("click", () => {
  if (!levelDropdown.hidden) {
    levelDropdown.hidden = true;
    levelBadge.classList.remove("open");
  }
});

// ── Finger guide ─────────────────────────────────────────
function dismissGuide() {
  const guide = $("finger-guide");
  if (window.gsap) gsap.to(guide, { opacity: 0, duration: 0.3, onComplete: () => { guide.hidden = true; } });
  else guide.hidden = true;
}
$("guide-start-btn").addEventListener("click", dismissGuide);

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener("keydown", event => {
  if (!event.ctrlKey || event.shiftKey) return;
  if (event.key === "n") {
    event.preventDefault();
    state.level = LEVELS.length - 1;
    localStorage.setItem("kb_level", state.level);
    $("level-name").textContent = LEVELS[state.level].name;
    if (window.gsap) gsap.fromTo("#level-badge", { scale: 1.3, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.6, ease: "elastic.out(1,0.5)" });
    resetSession();
  }
  if (event.key === "l") {
    event.preventDefault();
    if (state.level < LEVELS.length - 1) {
      state.level++;
      localStorage.setItem("kb_level", state.level);
      playLevelUp();
      $("level-name").textContent = LEVELS[state.level].name;
      if (window.gsap) gsap.fromTo("#level-badge", { scale: 1.3, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.6, ease: "elastic.out(1,0.5)" });
      resetSession();
    }
  }
});

// ── Keyboard auto-scale to fit any screen ────────────────
function scaleKeyboard() {
  const wrap = document.querySelector(".keyboard-wrap");
  const kb = $("keyboard");
  if (!wrap || !kb) return;
  wrap.style.transform = "scale(1)"; // reset first
  const kbW = kb.scrollWidth;
  const vw = window.innerWidth - 16; // 8px padding each side
  const scale = Math.min(1, vw / kbW);
  wrap.style.transform = `scale(${scale})`;
  // Collapse the layout height so gap stays correct
  wrap.style.marginBottom = scale < 1 ? `${(kb.scrollHeight * scale - kb.scrollHeight)}px` : "0";
}
window.addEventListener("resize", scaleKeyboard);

// ── Init ─────────────────────────────────────────────────
loadDailyQuotes();
loadJokes();
$("level-name").textContent = LEVELS[state.level].name;
$("best-value").textContent = getBestCPM() > 0 ? getBestCPM() : "—";
updateProgress();
updateCheckpoints();
drawSpeedometer(0);
targetRandomKey();
scaleKeyboard();
// Show first meme immediately, then start timer
getNextMeme().then(showMeme);
// Start meme timer for all levels
startMemeTimer();

// Debug: manual meme trigger
$("test-meme-btn").addEventListener("click", () => getNextMeme().then(showMeme));

// ── Theme toggle ──────────────────────────────────────────
const themeToggle = $("theme-toggle");
const savedTheme = localStorage.getItem("kb_theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.innerHTML = savedTheme === "dark" 
  ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
  : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("kb_theme", next);
  themeToggle.innerHTML = next === "dark"
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
});
