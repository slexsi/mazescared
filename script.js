const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const quizContainer = document.getElementById("quizContainer");
const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const timeLeftEl = document.getElementById("timeLeft");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartBtn = document.getElementById("restartBtn");

const bgMusic = document.getElementById("bgMusic");
const specialSFX = document.getElementById("specialSFX");

let score = 0;
let level = 1;
let quizActive = false;
let quizTimer = null;
let quizTime = 15;
let currentQuestionIndex = 0;

const playerImg = new Image();
playerImg.src = "player.png";
const enemyImg = new Image();
enemyImg.src = "enemy.png";

let player = { x: 50, y: 50, size: 40, speed: 3 };
let enemy = { x: 700, y: 500, size: 40, speed: 2 };
let key = { x: 0, y: 0, size: 30, collected: false };

let keysDown = {};
document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup", e => keysDown[e.key] = false);

// ===== Audio =====
bgMusic.volume = 0.5;
bgMusic.play().catch(() => {
  document.addEventListener("click", () => bgMusic.play(), { once: true });
});
specialSFX.load();

// ===== Maze Layouts (simpler + reachable paths) =====
const mazes = [
  // Level 1 - easy intro
  [
    { x: 0, y: 0, w: 800, h: 20 }, { x: 0, y: 580, w: 800, h: 20 },
    { x: 0, y: 0, w: 20, h: 600 }, { x: 780, y: 0, w: 20, h: 600 },
    { x: 200, y: 150, w: 400, h: 20 },
    { x: 200, y: 300, w: 400, h: 20 },
    { x: 200, y: 450, w: 400, h: 20 }
  ],
  // Level 2 - zigzag path
  [
    { x: 0, y: 0, w: 800, h: 20 }, { x: 0, y: 580, w: 800, h: 20 },
    { x: 0, y: 0, w: 20, h: 600 }, { x: 780, y: 0, w: 20, h: 600 },
    { x: 150, y: 100, w: 500, h: 20 },
    { x: 150, y: 100, w: 20, h: 400 },
    { x: 150, y: 480, w: 500, h: 20 },
    { x: 630, y: 250, w: 20, h: 250 },
    { x: 300, y: 250, w: 350, h: 20 }
  ],
  // Level 3 - box maze (now with openings)
  [
    { x: 0, y: 0, w: 800, h: 20 }, { x: 0, y: 580, w: 800, h: 20 },
    { x: 0, y: 0, w: 20, h: 600 }, { x: 780, y: 0, w: 20, h: 600 },
  
    // outer rectangle walls with gaps (top-left & bottom-right openings)
    { x: 100, y: 100, w: 520, h: 20 },              // top wall (gap on right)
    { x: 100, y: 100, w: 20, h: 280 },              // left wall (gap bottom)
    { x: 100, y: 480, w: 500, h: 20 },              // bottom wall (gap left)
    { x: 680, y: 100, w: 20, h: 400 },              // right wall
  
    // center divider
    { x: 250, y: 250, w: 300, h: 20 }
  ],

  // Level 4 - Spiral maze (fixed with open path)
[
  { x: 0, y: 0, w: 800, h: 20 }, { x: 0, y: 580, w: 800, h: 20 },
  { x: 0, y: 0, w: 20, h: 600 }, { x: 780, y: 0, w: 20, h: 600 },

  // outer spiral walls with proper entry/exit
  { x: 60, y: 60, w: 680, h: 20 },
  { x: 60, y: 60, w: 20, h: 480 },
  { x: 60, y: 520, w: 620, h: 20 },
  { x: 660, y: 100, w: 20, h: 440 },
  { x: 120, y: 100, w: 520, h: 20 },
  { x: 120, y: 140, w: 20, h: 360 },
  { x: 120, y: 480, w: 460, h: 20 },
  { x: 560, y: 180, w: 20, h: 320 },
  { x: 180, y: 180, w: 400, h: 20 },
  { x: 180, y: 220, w: 20, h: 260 },
  { x: 180, y: 440, w: 340, h: 20 },
  { x: 500, y: 260, w: 20, h: 180 }
],

  // Level 5 - final complex but open enough
  [
    { x: 0, y: 0, w: 800, h: 20 }, { x: 0, y: 580, w: 800, h: 20 },
    { x: 0, y: 0, w: 20, h: 600 }, { x: 780, y: 0, w: 20, h: 600 },
    { x: 150, y: 100, w: 500, h: 20 },
    { x: 150, y: 100, w: 20, h: 400 },
    { x: 150, y: 480, w: 500, h: 20 },
    { x: 630, y: 100, w: 20, h: 400 },
    { x: 300, y: 200, w: 200, h: 20 },
    { x: 400, y: 200, w: 20, h: 300 }
  ]
];

// ===== Collision Check =====
function rectCollision(r1, r2) {
  return !(
    r1.x + r1.w < r2.x ||
    r1.x > r2.x + r2.w ||
    r1.y + r1.h < r2.y ||
    r1.y > r2.y + r2.h
  );
}

// ===== Movement =====
function movePlayer() {
  if (quizActive) return;
  let nx = player.x, ny = player.y;
  if (keysDown["ArrowUp"] || keysDown["w"]) ny -= player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) ny += player.speed;
  if (keysDown["ArrowLeft"] || keysDown["a"]) nx -= player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) nx += player.speed;

  const walls = mazes[level - 1];
  const rect = { x: nx, y: ny, w: player.size, h: player.size };
  if (!walls.some(w => rectCollision(rect, w))) {
    player.x = nx;
    player.y = ny;
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

// ===== Key Placement =====
function placeKey() {
  const walls = mazes[level - 1];
  let valid = false;
  while (!valid) {
    key.x = 100 + Math.random() * 600;
    key.y = 100 + Math.random() * 400;
    const rect = { x: key.x, y: key.y, w: key.size, h: key.size };
    valid = !walls.some(w => rectCollision(rect, w));
  }
  key.collected = false;
}

// ===== Quiz =====
function startQuiz() {
  quizActive = true;
  quizContainer.style.display = "flex";
  currentQuestionIndex = 0;
  quizTime = 15;
  specialSFX.played = false;
  showQuestion();

  quizTimer = setInterval(() => {
    quizTime -= 0.05;
    timeLeftEl.textContent = Math.ceil(quizTime);
    if (quizTime <= 10 && !specialSFX.played) {
      specialSFX.play().catch(() => {});
      specialSFX.played = true;
    }
    if (quizTime <= 0) endQuiz(false);
  }, 50);
}

function showQuestion() {
  const startIndex = (level - 1) * 3;
  const q = questions[startIndex + currentQuestionIndex];
  questionText.textContent = q.q;
  answersDiv.innerHTML = "";
  q.a.forEach(ans => {
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.onclick = () => answerQuestion(ans);
    answersDiv.appendChild(btn);
  });
}

function answerQuestion(ans) {
  const startIndex = (level - 1) * 3;
  const q = questions[startIndex + currentQuestionIndex];
  if (ans === q.c) score += 100;
  document.getElementById("score").textContent = `Score: ${score} | Level: ${level}`;
  currentQuestionIndex++;
  if (currentQuestionIndex >= 3) endQuiz(true);
  else showQuestion();
}

function endQuiz(success) {
  clearInterval(quizTimer);
  quizContainer.style.display = "none";
  quizActive = false;
  if (success) nextLevel();
  else gameOver();
}

// ===== Level Progression =====
function nextLevel() {
  level++;
  if (level > 5) {
    alert("You beat all 5 levels! 🎉");
    level = 1;
    score = 0;
  }
  player = { x: 50, y: 50, size: 40, speed: 3 };
  enemy = { x: 700, y: 500, size: 40 + level * 5, speed: 2 + level * 0.2 };
  placeKey();
  document.getElementById("score").textContent = `Score: ${score} | Level: ${level}`;
}

// ===== Game Over =====
function gameOver() {
  gameOverScreen.style.display = "flex";
}

restartBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  player = { x: 50, y: 50, size: 40, speed: 3 };
  enemy = { x: 700, y: 500, size: 40, speed: 2 };
  level = 1;
  score = 0;
  placeKey();
  loop();
});

// ===== Drawing =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const walls = mazes[level - 1];
  ctx.fillStyle = "gray";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));
  if (!key.collected) {
    ctx.fillStyle = "gold";
    ctx.fillRect(key.x, key.y, key.size, key.size);
  }
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
}

// ===== Loop =====
function loop() {
  if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 30) return gameOver();
  movePlayer();
  moveEnemy();
  if (!key.collected && Math.abs(player.x - key.x) < 30 && Math.abs(player.y - key.y) < 30) {
    key.collected = true;
    startQuiz();
  }
  draw();
  requestAnimationFrame(loop);
}

// ===== Start Game =====
placeKey();
loop();
