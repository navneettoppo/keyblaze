// ── Levels ──────────────────────────────────────────────
const LEVELS = [
  { name: "Level 1: Home Row",    mode: "keys",     keys: [..."ASDFGHJKL"] },
  { name: "Level 2: Warming Up",  mode: "keys",     keys: [..."ASDFGHJKLEI"] },
  { name: "Level 3: Full Alpha",  mode: "keys",     keys: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"] },
  { name: "Level 4: Words",       mode: "words",    words: ["type","fast","keys","blaze","fire","code","play","game","win","run","jump","flow","mind","hand","skill","speed","focus","train","level","score"] },
  { name: "Level 5: Sentences",   mode: "sentence", sentences: [
    "the quick brown fox jumps over the lazy dog",
    "practice makes perfect every single day",
    "keep your eyes on the screen and fingers on keys",
    "speed comes from accuracy not from rushing",
    "type with confidence and never look down",
  ]},
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

// ── Speedometer (DPR-aware Canvas) ───────────────────────
const canvas = $("speedometer");
const ctx2d = canvas.getContext("2d");
let needleAngle = -Math.PI * 0.75;
let targetAngle = -Math.PI * 0.75;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const size = parseFloat(getComputedStyle(canvas).width) || 140;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx2d.scale(dpr, dpr);
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
}
resizeCanvas();
window.addEventListener("resize", () => { resizeCanvas(); });

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

// ── Meme API (Indian + word-based) ───────────────────────
const INDIAN_SUBS = ["dankindianmemes", "IndianDankMemes", "indiameme", "bollywood"];
const MEME_CACHE_KEY = "kb_memes";
function getMemeCache() { try { return JSON.parse(localStorage.getItem(MEME_CACHE_KEY) || "[]"); } catch { return []; } }
function saveMemeCache(m) { try { localStorage.setItem(MEME_CACHE_KEY, JSON.stringify(m.slice(-50))); } catch {} }

async function fetchMeme(query) {
  try {
    // For word/sentence mode, search by word; otherwise random Indian sub
    const url = query
      ? `https://meme-api.com/gimme/${encodeURIComponent(query)}`
      : `https://meme-api.com/gimme/${INDIAN_SUBS[Math.floor(Math.random() * INDIAN_SUBS.length)]}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.url && !data.nsfw) {
      const c = getMemeCache(); c.push(data.url); saveMemeCache(c);
      return data.url;
    }
  } catch {}
  // Fallback: random Indian sub
  try {
    const res = await fetch(`https://meme-api.com/gimme/${INDIAN_SUBS[Math.floor(Math.random() * INDIAN_SUBS.length)]}`);
    const data = await res.json();
    if (data.url && !data.nsfw) return data.url;
  } catch {}
  const cache = getMemeCache();
  return cache.length ? cache[Math.floor(Math.random() * cache.length)] : null;
}

let memeTimeout;
function showMeme(url) {
  if (!url) return;
  const panel = $("meme-panel");
  $("meme-img").src = url;
  panel.hidden = false;
  clearTimeout(memeTimeout);
  if (window.gsap) {
    gsap.fromTo(panel, { x: 260 }, { x: 0, duration: 0.4, ease: "power3.out" });
    memeTimeout = setTimeout(() => gsap.to(panel, { x: 260, duration: 0.35, ease: "power2.in", onComplete: () => { panel.hidden = true; } }), 2800);
  } else {
    memeTimeout = setTimeout(() => { panel.hidden = true; }, 2800);
  }
}

let memeCounter = 0;
function maybeFetchMeme(word) {
  memeCounter++;
  const lvl = LEVELS[state.level];
  // In word/sentence mode fetch meme based on the word typed
  const query = (lvl.mode === "words" || lvl.mode === "sentence") ? word : null;
  if (memeCounter % 5 === 0) fetchMeme(query).then(showMeme);
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
    const s = lvl.sentences[Math.floor(Math.random() * lvl.sentences.length)];
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

  const thresholds = [15, 20, 30, 40, 50];
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
  gsapScoreIn();
}

function resetSession() {
  Object.assign(state, { lastTs: null, total: 0, correct: 0, streak: 0, bestStreak: 0, sessionCount: 0, cpmReadings: [], currentCPM: 0, currentWord: "", typedIndex: 0 });
  memeCounter = 0;
  targetAngle = cpmToAngle(0);
  $("score-screen").hidden = true;
  $("cpm-value").textContent = "0";
  $("level-name").textContent = LEVELS[state.level].name;
  updateUI(); updateProgress();
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
      maybeFetchMeme(keyPressed);
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
        maybeFetchMeme(state.currentWord.toLowerCase().split(" ")[0]);
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

// ── Finger guide ─────────────────────────────────────────
function dismissGuide() {
  const guide = $("finger-guide");
  if (window.gsap) gsap.to(guide, { opacity: 0, duration: 0.3, onComplete: () => { guide.hidden = true; } });
  else guide.hidden = true;
}
$("guide-start-btn").addEventListener("click", dismissGuide);

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener("keydown", event => {
  if (!event.ctrlKey || !event.shiftKey) return;
  if (event.key === "N") {
    event.preventDefault();
    state.level = LEVELS.length - 1;
    localStorage.setItem("kb_level", state.level);
    $("level-name").textContent = LEVELS[state.level].name;
    if (window.gsap) gsap.fromTo("#level-badge", { scale: 1.3, color: "#fbbf24" }, { scale: 1, color: "#cbb7fb", duration: 0.6, ease: "elastic.out(1,0.5)" });
    resetSession();
  }
  if (event.key === "L") {
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
$("level-name").textContent = LEVELS[state.level].name;
$("best-value").textContent = getBestCPM() > 0 ? getBestCPM() : "—";
updateProgress();
drawSpeedometer(0);
targetRandomKey();
scaleKeyboard();
fetchMeme(null);
