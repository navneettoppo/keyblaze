# 🔥 KeyBlaze — Bulletproof Product Plan
### *Kiro-CLI Steering Document v2.0 — Immersive · Addictive · Alive*

---

> **Mission:** Build the most psychologically addictive typing trainer ever shipped in a browser.
> Every keystroke should feel like dopamine. Every mistake should feel like a meme.
> Every session should leave the user wanting one more round.

---

## 🧠 Psychological Design Pillars

KeyBlaze is engineered around **four addiction loops** from behavioral psychology:

| Loop | Mechanic | Trigger |
|------|----------|---------|
| **Variable Reward** | Random meme per correct word | Unpredictability keeps users engaged |
| **Loss Aversion** | Streak counter + "Faaahhh" punishment | Fear of losing streaks = more focus |
| **Progress Illusion** | XP bar always partially filled | Users always feel close to leveling up |
| **Social Proof** | Leaderboard + shareable score cards | Ego-driven replay loops |

---

## 🏗️ Architecture Overview

```
keyblaze/
├── index.html              ← Shell + 3D canvas mount
├── src/
│   ├── core/
│   │   ├── engine.js       ← Typing logic, WPM calc, streak
│   │   ├── audio.js        ← Sound engine (correct / Faaahhh)
│   │   ├── meme.js         ← Meme API integration
│   │   └── subscription.js ← Paywall / tier gating
│   ├── ui/
│   │   ├── keyboard.js     ← 3D GSAP/Three.js keyboard
│   │   ├── speedometer.js  ← Live WPM dial (canvas-based)
│   │   ├── levels.js       ← Level map + progression UI
│   │   └── hud.js          ← HUD overlay (streak, XP, timer)
│   ├── scenes/
│   │   ├── landing.js      ← 3D hero scene
│   │   ├── trainer.js      ← Main game scene
│   │   └── results.js      ← End-screen + share card
│   └── data/
│       ├── levels.json     ← Level definitions
│       └── wordlists.json  ← Words per difficulty
├── assets/
│   ├── sounds/
│   │   ├── correct.mp3
│   │   ├── faaahhh.mp3     ← The legendary wrong-key sound
│   │   ├── levelup.mp3
│   │   └── streak.mp3
│   └── fonts/
├── styles/
│   ├── base.css
│   ├── keyboard.css
│   ├── hud.css
│   └── subscription.css
└── DESIGN.md
```

---

## 🎯 Feature Specifications

### ⚡ Feature 1 — WPM Speedometer (Live Dial)
- **What:** Analog-style circular gauge, canvas-rendered, updates every 500ms
- **Design:** Deep space aesthetic — glowing needle, tick marks, RPM-style red zone above 80 WPM
- **Tiers shown:** Slow (0–20) → Normal (20–50) → Fast (50–80) → Beast Mode (80+)
- **3D flair:** GSAP `gsap.to()` animates the needle with physics-like overshoot (`elastic.out`)
- **Psychological hook:** Red zone glows and pulses when user hits 80+ WPM — screams "push harder"
- **Formula:** `WPM = (correct_chars / 5) / elapsed_minutes`

---

### 💥 Feature 2 — "Faaahhh" Wrong-Key Punishment
- **What:** Every wrong keypress triggers audio + visual chaos
- **Audio:** Preloaded `faaahhh.mp3` — exaggerated game-show wrong-answer sound
- **Visual sequence (100ms total):**
  1. Target key shakes violently — GSAP `shake` keyframe (±8px, 4 cycles)
  2. Screen edge flashes red (vignette pulse via CSS `box-shadow inset`)
  3. Wrong key briefly renders a crying emoji 😭 overlay
  4. Streak counter resets with a "💔 STREAK BROKEN" toast
- **Psychological hook:** Punishment > Reward asymmetry = hyper-focus to avoid the sound

---

### 🐸 Feature 3 — Meme-Per-Word (Live Meme API)
- **What:** Every correctly typed word surfaces a contextually relevant meme
- **API:** [Meme API](https://memeapi.com) — `GET /meme?query={word}` OR `imgflip.com/api` fallback
- **UX Flow:**
  1. User types word correctly → 150ms delay → meme slides in from right (GSAP `xPercent: 100 → 0`)
  2. Meme displays in corner panel for 2.5s with caption overlaid
  3. Slides out, next word queued
- **Offline Fallback:** Cache last 50 memes in `localStorage` — shown randomly if API fails
- **Psychological hook:** Variable reward schedule — users type faster hoping for a funny meme

---

### 🏆 Feature 4 — Level System (KeyBlaze Levels)

#### Level Map (10 Levels)

| Level | Name | Unlock | Word Set | Target WPM | Gated By |
|-------|------|--------|----------|-----------|---------|
| 1 | **Newborn Fingers** | Free | Home row only (ASDF JKL;) | 15 WPM | — |
| 2 | **Warming Up** | Free | Home row + E, I | 20 WPM | Complete L1 |
| 3 | **Finding Rhythm** | Free | Full middle row | 25 WPM | Complete L2 |
| 4 | **Going Full Alpha** | Free | Full alphabet | 30 WPM | Complete L3 |
| 5 | **Number Cruncher** | 🔒 Starter | Numbers row added | 35 WPM | Subscription |
| 6 | **Symbol Slayer** | 🔒 Starter | Symbols + punctuation | 40 WPM | Subscription |
| 7 | **Sentence Master** | 🔒 Pro | Real English sentences | 50 WPM | Pro tier |
| 8 | **Code Monkey** | 🔒 Pro | Code snippets (JS/Python) | 55 WPM | Pro tier |
| 9 | **Speed Demon** | 🔒 Pro | Dense technical text | 65 WPM | Pro tier |
| 10 | **KeyBlaze Legend** | 🔒 Elite | Competition-grade passages | 80 WPM | Elite tier |

#### Level Progression UI
- **3D Level Map:** Three.js scene — islands in a stylized ocean, each island = a level
- **Animated unlock:** Volcano eruption particle effect when unlocking new level
- **Screenshot share:** Auto-generate canvas badge with level name + WPM score + timestamp
- **Badge system:** Earn badges for streaks (10, 25, 50 correct in a row), speed milestones, full accuracy runs

---

### 💳 Feature 5 — Subscription Model

#### Tiers

```
┌─────────────────────────────────────────────────────────┐
│  FREE SPARK          STARTER (₹199/mo)    PRO (₹499/mo) │
│  ─────────────       ───────────────────  ─────────────  │
│  Levels 1–4          Levels 1–6           Levels 1–9     │
│  Basic memes         All memes            All memes       │
│  WPM speedometer     WPM speedometer      WPM speedometer │
│  —                   Stats history        Stats history   │
│  —                   Leaderboard          Leaderboard     │
│  —                   —                    Code snippets   │
│  —                   —                    PDF export      │
│                                                           │
│         ELITE (₹999/mo) — Level 10 + everything          │
│         + 1:1 coaching booking + custom word lists        │
└─────────────────────────────────────────────────────────┘
```

#### Paywall UX
- Blur + frosted glass overlay on locked levels — content visible but inaccessible
- "Unlock this level" CTA with animated shimmer border
- 7-day free trial for Starter — no credit card, just email
- Psychological hook: Show the user their WPM ranking ("You're faster than 34% of users — Pro unlocks your true rank")

---

## 🎨 Design System (Extended)

### 3D & Motion Layer
- **Three.js:** Level map scene, landing hero keyboard floating in space
- **GSAP:** All UI transitions, speedometer needle, key press animations, meme slides
- **CSS 3D transforms:** Key press `translateZ(-4px)` depth on correct keypress
- **Particle system:** Three.js `Points` — star field behind keyboard, eruption on level-up

### Visual Language
```css
/* Core palette */
--bg-deep:       #060610;     /* near-void black */
--bg-surface:    #0f0f23;     /* card surfaces */
--accent-fire:   #ff6b35;     /* speed / danger / CTA */
--accent-glow:   #cbb7fb;     /* lavender — correct state */
--accent-meme:   #ffd23f;     /* meme panel border */
--danger:        #ff2d55;     /* wrong key / streak break */
--success:       #30d158;     /* streak active */

/* Typography */
--font-display:  'Orbitron', monospace;    /* HUD, numbers, level names */
--font-body:     'JetBrains Mono', mono;  /* word prompts, keyboard labels */
--font-ui:       'Syne', sans-serif;      /* nav, subscription, descriptions */
```

### Key Visual Modules
- **Speedometer:** Canvas 2D arc gauge, Orbitron numerals, fire gradient in red zone
- **Keyboard:** Flat SVG base + Three.js extruded geometry for 3D depth illusion
- **Meme Panel:** Frosted glass card, rounded-2xl, yellow border, slides from right
- **HUD:** Transparent overlay strip — WPM | Streak 🔥 | Accuracy | Timer | Level

---

## 📐 Phase Roadmap

### Phase 1 — Foundation (Week 1–2)
- [ ] Three.js scene setup — landing + trainer canvas
- [ ] GSAP integrated — base animation system
- [ ] WPM speedometer (canvas dial, live updates)
- [ ] Audio engine — preload correct + Faaahhh sounds
- [ ] "Faaahhh" wrong-key full sequence (shake + vignette + emoji)
- [x] Spacebar row on keyboard layout
- [x] Responsive layout (768px+)
- [x] `prefers-reduced-motion` respected

### Phase 2 — Core Loop (Week 3–4)
- [ ] Meme API integration (imgflip + fallback cache)
- [ ] Meme-per-word slide-in panel
- [x] Streak counter with break animation
- [x] Session mode — 30-key challenge with results screen
- [ ] Level 1–4 implementation (free tier word sets)
- [x] localStorage persistence (best CPM, streak records)
- [x] Accuracy % tracking
- [x] Wrong key red flash feedback

### Phase 3 — Progression (Week 5–6)
- [ ] Level 5–10 word sets + unlock gates
- [ ] 3D level map (Three.js islands scene)
- [ ] Badge system + shareable PNG score cards
- [ ] Stats history — last 10 sessions, mini spark chart
- [ ] Subscription paywall UI (blur, CTA, tiers)
- [ ] 7-day trial flow

### Phase 4 — Polish & Addiction (Week 7–8)
- [ ] Leaderboard (localStorage-based, show rank)
- [ ] Daily challenge mode — same word set for all users, resets midnight
- [ ] "Comeback" mechanic — if user exits mid-session, show "Your streak was at X — resume?"
- [ ] Level-up particle explosion + sound
- [ ] Screenshot share card (Canvas API, auto-download)
- [ ] `prefers-reduced-motion` — disable all GSAP animations gracefully
- [ ] Keyboard shortcut: `Space` restarts, `Escape` exits session

---

## 🔌 External Integrations

| Integration | Purpose | Endpoint | Fallback |
|-------------|---------|----------|---------|
| **Imgflip API** | Meme images per word | `https://api.imgflip.com/search_memes?query={word}` | localStorage cache (50 memes) |
| **Meme API** | Backup meme source | `https://memeapi.com/meme?search={word}` | Static meme pack bundled |
| **Web Audio API** | Sound engine | Browser native | No sound (graceful degrade) |
| **Canvas API** | Speedometer + share cards | Browser native | — |
| **Three.js r158** | 3D scenes | CDN `cdnjs` | Flat 2D fallback |
| **GSAP 3** | All animation | CDN `cdnjs` | CSS transitions fallback |

---

## 🚫 Non-Goals (Unchanged)
- No backend / server-side user accounts (all client-side)
- No multiplayer realtime
- No portrait phone support (landscape tablet+ only)
- No video/webcam integration
- No AI coaching (out of scope for v1)

---

## 📸 Screenshot Share Card Spec

Auto-generated via Canvas API when session ends:

```
┌────────────────────────────────────────┐
│  🔥 KeyBlaze                           │
│                                        │
│     [ Level 6: Symbol Slayer ]         │
│                                        │
│       ⚡ 67 WPM                        │
│       🎯 94% Accuracy                  │
│       🔥 23 Streak                     │
│                                        │
│  ████████████████░░░  L6 → L7          │
│                                        │
│  keyblaze.app · Beat me if you can     │
└────────────────────────────────────────┘
```
- 1200×630px (OG image dimensions — Twitter/WhatsApp shareable)
- Dark gradient background, Orbitron font, fire accent color
- "Download" button + "Share" button (Web Share API)

---

## 🧪 Psychological Addiction Checklist

- [x] **Variable reward** — random meme = unpredictable delight
- [x] **Punishment loop** — Faaahhh + streak reset = emotional pain → retry
- [x] **Progress always visible** — XP bar, level name, WPM trend
- [x] **Near-miss design** — "You needed 3 more WPM to unlock Level 5"
- [x] **Identity labeling** — "Level 8: Code Monkey" feels like a personality
- [x] **Daily ritual hook** — Daily challenge resets at midnight
- [x] **Loss aversion** — "Your 23-streak is on the line" messaging
- [x] **Social comparison** — Leaderboard rank shown during session
- [x] **Completion compulsion** — Progress bars always shown partially filled
- [x] **Sound design** — Correct = satisfying click, Wrong = Faaahhh shame

---

*Generated by Kiro-CLI · KeyBlaze v2.0 · Build something legendary*
