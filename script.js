// script.js
// 5 levels, 3-question simultaneous quiz per key, 20s to answer all correctly or game over.
// Player/enemy/key are rectangles (no images).

// ====== CANVAS SETUP ======
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 400;

// ====== DOM ELEMENTS ======
const bgSong = document.getElementById("bg-song");
const specialSFX = document.getElementById("special-sfx");
const quizContainer = document.getElementById("quiz-container");
const quizTab = document.getElementById("quiz-tab");
const timerBar = document.getElementById("quiz-timer-bar");
const totalScoreEl = document.getElementById("total-score");
const gameOverContainer = document.getElementById("game-over-container");
const restartBtn = document.getElementById("restart-btn");

// ====== GAME STATE ======
let level = 1;
const MAX_LEVEL = 5;
let score = 0;

let player = { x: 50, y: 50, size: 36, speed: 3 };
let enemy = { x: 520, y: 20, size: 36, speed: 1.4 };

let key = { x: 300, y: 200, size: 28, collected: false };

let running = false;
let quizActive = false;
let keysDown = {};

// ====== QUIZ / TIMER ======
const QUIZ_TIME = 20; // seconds to answer all 3
let quizStartTimestamp = 0;
let quizTimerInterval = null;
let answersSelected = [null, null, null];

// ====== LEVEL MAZES (walls arrays) ======
// Each level has walls defined as {x,y,w,h}. You can tune these layouts.
const LEVELS = [
  // Level 1 (easy)
  {
    walls: [
      { x: 0, y: 0, w: 600, h: 12 },
      { x: 0, y: 0, w: 12, h: 400 },
      { x: 0, y: 388, w: 600, h: 12 },
      { x: 588, y: 0, w: 12, h: 400 },
      { x: 120, y: 110, w: 360, h: 12 },
    ],
    keyPos: { x: 520, y: 340 }
  },

  // Level 2
  {
    walls: [
      { x: 0, y: 0, w: 600, h: 12 },
      { x: 0, y: 0, w: 12, h: 400 },
      { x: 0, y: 388, w: 600, h: 12 },
      { x: 588, y: 0, w: 12, h: 400 },
      { x: 80, y: 80, w: 440, h: 12 },
      { x: 80, y: 80, w: 12, h: 120 },
      { x: 520, y: 120, w: 12, h: 120 }
    ],
    keyPos: { x: 540, y: 40 }
  },

  // Level 3
  {
    walls: [
      { x: 0, y: 0, w: 600, h: 12 },
      { x: 0, y: 0, w: 12, h: 400 },
      { x: 0, y: 388, w: 600, h: 12 },
      { x: 588, y: 0, w: 12, h: 400 },
      { x: 100, y: 100, w: 400, h: 12 },
      { x: 100, y: 100, w: 12, h: 200 },
      { x: 100, y: 300, w: 300, h: 12 },
      { x: 400, y: 200, w: 12, h: 100 }
    ],
    keyPos: { x: 520, y: 320 }
  },

  // Level 4 (harder maze)
  {
    walls: [
      { x: 0, y: 0, w: 600, h: 12 },
      { x: 0, y: 0, w: 12, h: 400 },
      { x: 0, y: 388, w: 600, h: 12 },
      { x: 588, y: 0, w: 12, h: 400 },

      // more internal walls
      { x: 60, y: 80, w: 480, h: 12 },
      { x: 60, y: 80, w: 12, h: 120 },
      { x: 540, y: 80, w: 12, h: 120 },

      { x: 180, y: 160, w: 300, h: 12 },
      { x: 180, y: 160, w: 12, h: 140 },
      { x: 468, y: 160, w: 12, h: 140 },

      { x: 120, y: 320, w: 360, h: 12 }
    ],
    keyPos: { x: 50, y: 340 }
  },

  // Level 5 (hardest)
  {
    walls: [
      { x: 0, y: 0, w: 600, h: 12 },
      { x: 0, y: 0, w: 12, h: 400 },
      { x: 0, y: 388, w: 600, h: 12 },
      { x: 588, y: 0, w: 12, h: 400 },

      // labyrinth-ish
      { x: 40, y: 60, w: 520, h: 12 },
      { x: 40, y: 60, w: 12, h: 80 },
      { x: 548, y: 60, w: 12, h: 80 },

      { x: 120, y: 140, w: 360, h: 12 },
      { x: 120, y: 140, w: 12, h: 100 },
      { x: 468, y: 140, w: 12, h: 100 },

      { x: 200, y: 240, w: 200, h: 12 },
      { x: 200, y: 240, w: 12, h: 80 },
      { x: 388, y: 240, w: 12, h: 80 },

      { x: 80, y: 320, w: 440, h: 12 }
    ],
    keyPos: { x: 560, y: 40 }
  }
];

// ====== SAMPLE QUIZ QUESTIONS (3 per level) ======
const QUIZ_SETS = [
  [
    { question: "2 + 2 = ?", answers: ["3", "4", "5"], correct: "4" },
    { question: "Color of grass?", answers: ["Blue", "Green", "Yellow"], correct: "Green" },
    { question: "Capital of France?", answers: ["Berlin", "Paris", "Madrid"], correct: "Paris" }
  ],
  [
    { question: "5 * 2 = ?", answers: ["7", "10", "12"], correct: "10" },
    { question: "Opposite of hot?", answers: ["Cold", "Warm", "Wet"], correct: "Cold" },
    { question: "Planet we live on?", answers: ["Mars", "Earth", "Venus"], correct: "Earth" }
  ],
  [
    { question: "10 / 2 = ?", answers: ["2", "5", "8"], correct: "5" },
    { question: "Color of banana?", answers: ["Green", "Yellow", "Red"], correct: "Yellow" },
    { question: "Capital of Japan?", answers: ["Tokyo", "Kyoto", "Osaka"], correct: "Tokyo" }
  ],
  [
    { question: "3^2 = ?", answers: ["6", "9", "12"], correct: "9" },
    { question: "Primary color?", answers: ["Purple", "Blue", "Brown"], correct: "Blue" },
    { question: "Ocean between Americas & Europe?", answers: ["Pacific", "Atlantic", "Indian"], correct: "Atlantic" }
  ],
  [
    { question: "7 + 3 = ?", answers: ["9", "10", "11"], correct: "10" },
    { question: "Opposite of up?", answers: ["Down", "Side", "Back"], correct: "Down" },
    { question: "Capital of Italy?", answers: ["Venice", "Rome", "Naples"], correct: "Rome" }
  ]
];

// ====== HELPERS: input & resize ======
document.addEventListener("keydown", (e) => (keysDown[e.key] = true));
document.addEventListener("keyup", (e) => (keysDown[e.key] = false));

// music start on first interaction (autoplay policy)
document.addEventListener(
  "click",
  () => {
    bgSong.volume = 0.5;
    bgSong.play().catch(() => {});
  },
  { once: true }
);

// keep canvas scale fixed (no partial zoom)
function fixCanvasSize() {
  canvas.style.width = canvas.width + "px";
  canvas.style.height = canvas.height + "px";
}
window.addEventListener("load", fixCanvasSize);
window.addEventListener("resize", fixCanvasSize);

// ====== COLLISION UTIL ======
function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h);
}
function playerIntersectsWall(px, py) {
  const pr = { x: px, y: py, w: player.size, h: player.size };
  for (let w of LEVELS[level - 1].walls) {
    if (rectsOverlap(pr, w)) return true;
  }
  return false;
}

// ====== GAME LOGIC ======
function spawnLevel(lv) {
  level = lv;
  // set walls and key from LEVELS array
  key.collected = false;
  key.x = LEVELS[lv - 1].keyPos.x;
  key.y = LEVELS[lv - 1].keyPos.y;
  // reset positions (player start, enemy start)
  player.x = 50;
  player.y = 50;
  enemy.x = 520;
  enemy.y = 20;
  // increase enemy speed a bit per level
  enemy.speed = 1.4 + (lv - 1) * 0.6;
  // update score display
  totalScoreEl.textContent = score;
}

// movement with wall collisions
function movePlayer() {
  if (quizActive) return;
  const oldX = player.x;
  const oldY = player.y;

  if (keysDown["ArrowUp"] || keysDown["w"]) player.y -= player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) player.y += player.speed;
  if (keysDown["ArrowLeft"] || keysDown["a"]) player.x -= player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) player.x += player.speed;

  // if collides with any wall of the current level, revert
  if (playerIntersectsWall(player.x, player.y)) {
    player.x = oldX;
    player.y = oldY;
  }
}

function moveEnemy() {
  if (quizActive) return;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0) {
    enemy.x += (dx / dist) * enemy.speed;
    enemy.y += (dy / dist) * enemy.speed;
  }
}

function checkKeyCollected() {
  if (!key.collected && Math.abs(player.x - key.x) < 28 && Math.abs(player.y - key.y) < 28) {
    key.collected = true;
    beginQuizForLevel(level);
  }
}

function checkEnemyCollision() {
  if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 28) {
    endGame(false);
  }
}

// ====== DRAW ======
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw walls of current level
  ctx.fillStyle = "#666";
  for (let w of LEVELS[level - 1].walls) {
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }

  // draw key
  if (!key.collected) {
    ctx.fillStyle = "gold";
    ctx.fillRect(key.x, key.y, key.size, key.size);
  }

  // player
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // enemy
  ctx.fillStyle = "crimson";
  ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText("Level: " + level, 10, 20);
  ctx.fillText("Score: " + score, 10, 40);
}

// ====== QUIZ BEHAVIOR (3 questions shown simultaneously) ======
function beginQuizForLevel(lv) {
  quizActive = true;
  // load the 3 questions for this level
  const questions = QUIZ_SETS[lv - 1].slice(0, 3);
  // build quiz UI: show all 3 questions with answer buttons
  quizTab.innerHTML = "";
  answersSelected = [null, null, null];
  questions.forEach((q, qi) => {
    const block = document.createElement("div");
    block.style.marginBottom = "10px";
    const pq = document.createElement("p");
    pq.textContent = `Q${qi + 1}: ${q.question}`;
    block.appendChild(pq);

    q.answers.forEach((a) => {
      const btn = document.createElement("button");
      btn.textContent = a;
      btn.style.marginRight = "6px";
      btn.onclick = () => {
        answersSelected[qi] = a;
        // visual feedback
        // remove selected class from siblings
        for (let sib of block.querySelectorAll("button")) sib.style.outline = "none";
        btn.style.outline = "3px solid #0f0";
      };
      block.appendChild(btn);
    });

    quizTab.appendChild(block);
  });

  // Add submit button
  const submit = document.createElement("button");
  submit.textContent = "Submit all answers";
  submit.style.marginTop = "8px";
  submit.onclick = () => evaluateQuizAnswers(questions);
  quizTab.appendChild(submit);

  // show quiz UI
  quizContainer.style.display = "flex";
  canvas.style.display = "none";

  // start quiz timer
  startQuizTimer(QUIZ_TIME, questions);
}

function startQuizTimer(seconds, questions) {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  quizStartTimestamp = Date.now();
  timerBar.style.width = "100%";
  specialSFX.played = false;

  quizTimerInterval = setInterval(() => {
    const elapsed = (Date.now() - quizStartTimestamp) / 1000;
    const remainingPct = Math.max(0, 100 - (elapsed / seconds) * 100);
    timerBar.style.width = remainingPct + "%";

    // play special SFX at 5s mark
    if (elapsed >= 5 && !specialSFX.played) {
      specialSFX.played = true;
      specialSFX.currentTime = 0;
      specialSFX.play().catch(() => {});
    }

    if (elapsed >= seconds) {
      clearInterval(quizTimerInterval);
      // time ran out => game over
      evaluateQuizAnswers(questions, true);
    }
  }, 100);
}

// evaluate quiz answers; if timedOut === true treat as failed
function evaluateQuizAnswers(questions, timedOut = false) {
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }

  // if timed out => fail
  if (timedOut) {
    quizContainer.style.display = "none";
    canvas.style.display = "none";
    endGame(false);
    return;
  }

  // ensure all selected
  for (let i = 0; i < 3; i++) {
    if (!answersSelected[i]) {
      // Not all answered — treat as fail
      quizContainer.style.display = "none";
      canvas.style.display = "none";
      endGame(false);
      return;
    }
  }

  // check correctness: all must be correct
  const set = QUIZ_SETS[level - 1];
  for (let i = 0; i < 3; i++) {
    if (answersSelected[i] !== set[i].correct) {
      // wrong answer -> game over
      quizContainer.style.display = "none";
      canvas.style.display = "none";
      endGame(false);
      return;
    }
  }

  // all correct -> success: award score and progress
  score += 300; // 100 per question equivalently
  totalScoreEl.textContent = score;

  quizContainer.style.display = "none";
  canvas.style.display = "block";
  quizActive = false;

  // progress to next level or win
  if (level >= MAX_LEVEL) {
    // win
    endGame(true);
    return;
  } else {
    level++;
    spawnLevel(level);
  }
}

// ====== END / RESTART ======
function endGame(win) {
  running = false;
  quizActive = false;
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }
  canvas.style.display = "none";
  gameOverContainer.style.display = "flex";
  const p = gameOverContainer.querySelector("p");
  if (win) p.textContent = `🎉 You Win! Final Score: ${score}`;
  else p.textContent = `Game Over! Final Score: ${score}`;
  bgSong.pause();
}

restartBtn.addEventListener("click", () => {
  // reset everything
  score = 0;
  totalScoreEl.textContent = score;
  level = 1;
  key.collected = false;
  spawnLevel(1);
  gameOverContainer.style.display = "none";
  canvas.style.display = "block";
  running = true;
  bgSong.currentTime = 0;
  bgSong.play().catch(() => {});
  requestAnimationFrame(loop);
});

// spawn initial level state
function spawnLevel(lv) {
  level = lv;
  // set key from level definition
  key.collected = false;
  key.x = LEVELS[lv - 1].keyPos.x;
  key.y = LEVELS[lv - 1].keyPos.y;
  // reset positions
  player.x = 50;
  player.y = 50;
  enemy.x = 520;
  enemy.y = 20;
  // difficulty scaling
  enemy.speed = 1.4 + (lv - 1) * 0.6;
}

// ====== MAIN LOOP ======
function loop() {
  if (!running) return;
  movePlayer();
  moveEnemy();
  checkKeyCollected();
  checkEnemyCollision();
  draw();
  requestAnimationFrame(loop);
}

// ====== START GAME ======
window.addEventListener("load", () => {
  // initial spawn
  spawnLevel(1);
  running = true;
  // start the loop
  requestAnimationFrame(loop);
});
