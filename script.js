// script.js - 5 levels, 3-question simultaneous quiz, 15s total timer, images + proper collision

// ===== CANVAS =====
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 400;

// keep CSS size equal to logical size (no weird zoom)
function fixCanvasSize() {
  canvas.style.width = canvas.width + "px";
  canvas.style.height = canvas.height + "px";
}
window.addEventListener("load", fixCanvasSize);
window.addEventListener("resize", fixCanvasSize);

// ===== DOM =====
const bgSong = document.getElementById("bg-song");
const specialSFX = document.getElementById("special-sfx");
const quizContainer = document.getElementById("quiz-container");
const quizTab = document.getElementById("quiz-tab");
const timerBar = document.getElementById("quiz-timer-bar");
const totalScoreEl = document.getElementById("total-score");
const gameOverContainer = document.getElementById("game-over-container");
const restartBtn = document.getElementById("restart-btn");

// ===== IMAGES =====
const playerImg = new Image(); playerImg.src = "player.png";
const enemyImg = new Image();  enemyImg.src  = "enemy.png";
// We don't block on images; draw when available (fallback rectangles otherwise).

// ===== GAME STATE =====
let level = 1;
const MAX_LEVEL = 5;
let score = 0;

let player = { x: 50, y: 50, size: 36, speed: 3 };
let enemy  = { x: 520, y: 20, size: 36, speed: 1.4 };
let key    = { x: 300, y: 200, size: 28, collected: false };

let running = false;
let quizActive = false;
let keysDown = {};

// ===== QUIZ =====
const QUIZ_TIME = 15; // seconds total for all 3
let quizTimerInterval = null;
let quizStartTimestamp = 0;
let answersSelected = [null, null, null];

// ===== LEVEL MAZES & KEYS =====
const LEVELS = [
  { // L1
    walls: [
      {x:0,y:0,w:600,h:12},{x:0,y:0,w:12,h:400},{x:0,y:388,w:600,h:12},{x:588,y:0,w:12,h:400},
      {x:120,y:110,w:360,h:12}
    ],
    keyPos: {x:520,y:340}
  },
  { // L2
    walls: [
      {x:0,y:0,w:600,h:12},{x:0,y:0,w:12,h:400},{x:0,y:388,w:600,h:12},{x:588,y:0,w:12,h:400},
      {x:80,y:80,w:440,h:12},{x:80,y:80,w:12,h:120},{x:520,y:120,w:12,h:120}
    ],
    keyPos: {x:540,y:40}
  },
  { // L3
    walls: [
      {x:0,y:0,w:600,h:12},{x:0,y:0,w:12,h:400},{x:0,y:388,w:600,h:12},{x:588,y:0,w:12,h:400},
      {x:100,y:100,w:400,h:12},{x:100,y:100,w:12,h:200},{x:100,y:300,w:300,h:12},{x:400,y:200,w:12,h:100}
    ],
    keyPos: {x:520,y:320}
  },
  { // L4
    walls: [
      {x:0,y:0,w:600,h:12},{x:0,y:0,w:12,h:400},{x:0,y:388,w:600,h:12},{x:588,y:0,w:12,h:400},
      {x:60,y:80,w:480,h:12},{x:60,y:80,w:12,h:120},{x:540,y:80,w:12,h:120},
      {x:180,y:160,w:300,h:12},{x:180,y:160,w:12,h:140},{x:468,y:160,w:12,h:140},
      {x:120,y:320,w:360,h:12}
    ],
    keyPos: {x:50,y:340}
  },
  { // L5
    walls: [
      {x:0,y:0,w:600,h:12},{x:0,y:0,w:12,h:400},{x:0,y:388,w:600,h:12},{x:588,y:0,w:12,h:400},
      {x:40,y:60,w:520,h:12},{x:40,y:60,w:12,h:80},{x:548,y:60,w:12,h:80},
      {x:120,y:140,w:360,h:12},{x:120,y:140,w:12,h:100},{x:468,y:140,w:12,h:100},
      {x:200,y:240,w:200,h:12},{x:200,y:240,w:12,h:80},{x:388,y:240,w:12,h:80},
      {x:80,y:320,w:440,h:12}
    ],
    keyPos: {x:560,y:40}
  }
];

// ===== QUIZ SETS (3 per level) =====
const QUIZ_SETS = [
  [
    {question:"2 + 2 = ?", answers:["3","4","5"], correct:"4"},
    {question:"Color of grass?", answers:["Blue","Green","Yellow"], correct:"Green"},
    {question:"Capital of France?", answers:["Berlin","Paris","Madrid"], correct:"Paris"}
  ],
  [
    {question:"5 * 2 = ?", answers:["7","10","12"], correct:"10"},
    {question:"Opposite of hot?", answers:["Cold","Warm","Wet"], correct:"Cold"},
    {question:"Planet we live on?", answers:["Mars","Earth","Venus"], correct:"Earth"}
  ],
  [
    {question:"10 / 2 = ?", answers:["2","5","8"], correct:"5"},
    {question:"Color of banana?", answers:["Green","Yellow","Red"], correct:"Yellow"},
    {question:"Capital of Japan?", answers:["Tokyo","Kyoto","Osaka"], correct:"Tokyo"}
  ],
  [
    {question:"3^2 = ?", answers:["6","9","12"], correct:"9"},
    {question:"Primary color?", answers:["Purple","Blue","Brown"], correct:"Blue"},
    {question:"Ocean between Americas & Europe?", answers:["Pacific","Atlantic","Indian"], correct:"Atlantic"}
  ],
  [
    {question:"7 + 3 = ?", answers:["9","10","11"], correct:"10"},
    {question:"Opposite of up?", answers:["Down","Side","Back"], correct:"Down"},
    {question:"Capital of Italy?", answers:["Venice","Rome","Naples"], correct:"Rome"}
  ]
];

// ===== INPUT =====
document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup", e => keysDown[e.key] = false);

// start bg music on first interaction (autoplay policy)
document.addEventListener("click", () => {
  bgSong.volume = 0.5;
  bgSong.play().catch(()=>{});
}, { once: true });

// ===== HELPERS: rectangle overlap =====
function rectsOverlap(a, b) {
  return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h);
}
function playerOverlapsWall(px, py) {
  const pr = { x: px, y: py, w: player.size, h: player.size };
  for (let w of LEVELS[level-1].walls) {
    if (rectsOverlap(pr, w)) return true;
  }
  return false;
}

// ===== SPAWN LEVEL =====
function spawnLevel(lv) {
  level = lv;
  const L = LEVELS[lv-1];
  key.collected = false;
  key.x = L.keyPos.x;
  key.y = L.keyPos.y;
  // reset positions
  player.x = 50; player.y = 50;
  enemy.x = 520; enemy.y = 20;
  enemy.speed = 1.4 + (lv-1) * 0.6;
  totalScoreEl.textContent = score;
}

// ===== MOVEMENT with per-axis collision (fix stuck) =====
function movePlayer() {
  if (quizActive) return;
  const prev = { x: player.x, y: player.y };

  // horizontal movement first
  if (keysDown["ArrowLeft"] || keysDown["a"]) player.x -= player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) player.x += player.speed;
  // check collision horizontally; if collide revert
  if (playerOverlapsWall(player.x, player.y)) player.x = prev.x;

  // vertical movement
  if (keysDown["ArrowUp"] || keysDown["w"]) player.y -= player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) player.y += player.speed;
  // check collision vertically; if collide revert
  if (playerOverlapsWall(player.x, player.y)) player.y = prev.y;
}

function moveEnemy() {
  if (quizActive) return;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const d = Math.hypot(dx, dy);
  if (d > 0) {
    enemy.x += (dx / d) * enemy.speed;
    enemy.y += (dy / d) * enemy.speed;
  }
}

// ===== CHECKS =====
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

// ===== DRAW =====
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw walls
  ctx.fillStyle = "#666";
  for (let w of LEVELS[level-1].walls) ctx.fillRect(w.x, w.y, w.w, w.h);

  // key
  if (!key.collected) {
    ctx.fillStyle = "gold";
    ctx.fillRect(key.x, key.y, key.size, key.size);
  }

  // player (image fallback)
  if (playerImg.complete && playerImg.naturalWidth > 0) ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  else { ctx.fillStyle = "cyan"; ctx.fillRect(player.x, player.y, player.size, player.size); }

  // enemy (image fallback)
  if (enemyImg.complete && enemyImg.naturalWidth > 0) ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
  else { ctx.fillStyle = "crimson"; ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size); }

  // HUD
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText("Level: " + level, 10, 20);
  ctx.fillText("Score: " + score, 10, 40);
}

// ===== QUIZ: show 3 questions at once, 15s total =====
function beginQuizForLevel(lv) {
  quizActive = true;
  answersSelected = [null, null, null];
  const set = QUIZ_SETS[lv-1];
  quizTab.innerHTML = "";

  set.forEach((q, i) => {
    const block = document.createElement("div");
    block.style.marginBottom = "8px";
    const p = document.createElement("p");
    p.textContent = `Q${i+1}: ${q.question}`;
    block.appendChild(p);
    q.answers.forEach(a => {
      const btn = document.createElement("button");
      btn.textContent = a;
      btn.style.marginRight = "6px";
      btn.onclick = () => {
        answersSelected[i] = a;
        // visual feedback
        for (let b of block.querySelectorAll("button")) b.style.outline = "none";
        btn.style.outline = "3px solid #0f0";
      };
      block.appendChild(btn);
    });
    quizTab.appendChild(block);
  });

  const submit = document.createElement("button");
  submit.textContent = "Submit Answers";
  submit.style.marginTop = "6px";
  submit.onclick = () => evaluateQuizAnswers(set, false);
  quizTab.appendChild(submit);

  quizContainer.style.display = "flex";
  canvas.style.display = "none";

  startQuizTimer(QUIZ_TIME, set);
}

function startQuizTimer(seconds, set) {
  if (quizTimerInterval) clearInterval(quizTimerInterval);
  quizStartTimestamp = Date.now();
  timerBar.style.width = "100%";
  specialSFX.played = false;

  quizTimerInterval = setInterval(() => {
    const elapsed = (Date.now() - quizStartTimestamp) / 1000;
    const remainingPct = Math.max(0, 100 - (elapsed / seconds) * 100);
    timerBar.style.width = remainingPct + "%";

    if (elapsed >= 5 && !specialSFX.played) {
      specialSFX.played = true;
      specialSFX.currentTime = 0;
      specialSFX.play().catch(()=>{});
    }

    if (elapsed >= seconds) {
      clearInterval(quizTimerInterval);
      evaluateQuizAnswers(set, true); // timed out
    }
  }, 100);
}

function evaluateQuizAnswers(set, timedOut = false) {
  if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }

  if (timedOut) {
    quizContainer.style.display = "none";
    canvas.style.display = "none";
    endGame(false);
    return;
  }

  // require all answered
  for (let i=0;i<3;i++){
    if (!answersSelected[i]) {
      quizContainer.style.display = "none";
      canvas.style.display = "none";
      endGame(false);
      return;
    }
  }

  // require all correct
  for (let i=0;i<3;i++){
    if (answersSelected[i] !== set[i].correct) {
      quizContainer.style.display = "none";
      canvas.style.display = "none";
      endGame(false);
      return;
    }
  }

  // success: award points and progress
  score += 300; // 100 per question
  totalScoreEl.textContent = score;
  quizContainer.style.display = "none";
  canvas.style.display = "block";
  quizActive = false;

  if (level >= MAX_LEVEL) {
    endGame(true);
  } else {
    level++;
    spawnLevel(level);
  }
}

// ===== END GAME / RESTART =====
function endGame(win) {
  running = false;
  quizActive = false;
  if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }
  canvas.style.display = "none";
  gameOverContainer.style.display = "flex";
  const p = gameOverContainer.querySelector("p");
  p.textContent = win ? `🎉 You Win! Final Score: ${score}` : `Game Over! Final Score: ${score}`;
  bgSong.pause();
}

restartBtn.addEventListener("click", () => {
  score = 0;
  totalScoreEl.textContent = score;
  level = 1;
  spawnLevel(1);
  gameOverContainer.style.display = "none";
  canvas.style.display = "block";
  running = true;
  bgSong.currentTime = 0;
  bgSong.play().catch(()=>{});
  requestAnimationFrame(loop);
});

// spawn level specifics
function spawnLevel(lv) {
  level = lv;
  key.collected = false;
  key.x = LEVELS[lv-1].keyPos.x;
  key.y = LEVELS[lv-1].keyPos.y;
  player.x = 50; player.y = 50;
  enemy.x = 520; enemy.y = 20;
  enemy.speed = 1.4 + (lv-1) * 0.6;
  totalScoreEl.textContent = score;
}

// ===== MAIN LOOP =====
function loop() {
  if (!running) return;
  movePlayer();
  moveEnemy();
  checkKeyCollected();
  checkEnemyCollision();
  draw();
  requestAnimationFrame(loop);
}

// start
window.addEventListener("load", () => {
  spawnLevel(1);
  running = true;
  // start loop immediately (images drawn when available)
  requestAnimationFrame(loop);
});
