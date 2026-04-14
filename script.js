const KEYS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const SESSION_LENGTH = 30;

let lastTimestamp = null;
let totalPressed = 0;
let correctPressed = 0;
let streak = 0;
let bestStreak = 0;
let sessionCount = 0;
let cpmReadings = [];

const $ = id => document.getElementById(id);

function getBestCPM() {
  return parseInt(localStorage.getItem("keyblaze_best") || "0", 10);
}

function saveBestCPM(cpm) {
  const best = getBestCPM();
  if (cpm > best) localStorage.setItem("keyblaze_best", cpm);
}

function updateStats(cpm) {
  const acc = totalPressed === 0 ? "—" : Math.round((correctPressed / totalPressed) * 100) + "%";
  if (cpm !== null) $("cpm-value").textContent = cpm;
  $("accuracy-value").textContent = acc;
  $("streak-value").textContent = streak;
  const best = getBestCPM();
  $("best-value").textContent = best > 0 ? best : "—";
}

function updateProgress() {
  const pct = (sessionCount / SESSION_LENGTH) * 100;
  $("progress-fill").style.width = pct + "%";
  $("session-label").textContent = `${sessionCount} / ${SESSION_LENGTH}`;
}

function targetRandomKey() {
  const key = KEYS[Math.floor(Math.random() * KEYS.length)];
  document.getElementById(key).classList.add("selected");
}

function endSession() {
  const avgCPM = cpmReadings.length
    ? Math.round(cpmReadings.reduce((a, b) => a + b, 0) / cpmReadings.length)
    : 0;
  const acc = totalPressed === 0 ? "0%" : Math.round((correctPressed / totalPressed) * 100) + "%";

  saveBestCPM(avgCPM);

  $("final-cpm").textContent = avgCPM || "—";
  $("final-accuracy").textContent = acc;
  $("final-streak").textContent = bestStreak;
  $("score-screen").hidden = false;
}

function resetSession() {
  lastTimestamp = null;
  totalPressed = 0;
  correctPressed = 0;
  streak = 0;
  bestStreak = 0;
  sessionCount = 0;
  cpmReadings = [];

  $("score-screen").hidden = true;
  $("cpm-value").textContent = "—";
  $("accuracy-value").textContent = "—";
  $("streak-value").textContent = "0";
  updateProgress();
  updateStats(null);

  const prev = document.querySelector(".selected");
  if (prev) prev.classList.remove("selected");
  targetRandomKey();
}

document.addEventListener("keyup", event => {
  if ($("score-screen") && !$("score-screen").hidden) {
    if (event.key === " " || event.key === "Enter") resetSession();
    return;
  }

  const keyPressed = event.key.toUpperCase();
  const keyElement = document.getElementById(keyPressed);
  const highlighted = document.querySelector(".selected");
  if (!highlighted) return;

  totalPressed++;

  if (keyElement) {
    keyElement.classList.add("hit");
    keyElement.addEventListener("animationend", () => keyElement.classList.remove("hit"), { once: true });
  }

  if (keyPressed === highlighted.id) {
    // Correct
    correctPressed++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    sessionCount++;

    const now = Date.now();
    if (lastTimestamp !== null) {
      const cpm = Math.round(60000 / (now - lastTimestamp));
      cpmReadings.push(cpm);
      updateStats(cpm);
    } else {
      updateStats(null);
    }
    lastTimestamp = now;

    updateProgress();
    highlighted.classList.remove("selected");

    if (sessionCount >= SESSION_LENGTH) {
      endSession();
    } else {
      targetRandomKey();
    }
  } else {
    // Wrong
    streak = 0;
    updateStats(null);
    if (keyElement) {
      keyElement.classList.add("wrong");
      setTimeout(() => keyElement.classList.remove("wrong"), 300);
    }
  }
});

$("restart-btn").addEventListener("click", resetSession);

// Init
updateStats(null);
updateProgress();
$("best-value").textContent = getBestCPM() > 0 ? getBestCPM() : "—";
targetRandomKey();
