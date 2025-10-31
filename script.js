// === CANVAS SETUP ===
const canvas = document.getElementById("mazeCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 600;
canvas.height = 400;

// === ELEMENTS ===
const bgSong = document.getElementById("bg-song");
const specialSFX = document.getElementById("special-sfx");
const quizContainer = document.getElementById("quiz-container");
const quizTab = document.getElementById("quiz-tab");
const timerBar = document.getElementById("quiz-timer-bar");
const totalScoreEl = document.getElementById("total-score");
const gameOverContainer = document.getElementById("game-over-container");
const restartBtn = document.getElementById("restart-btn");

// === IMAGES ===
const playerImg = new Image();
const enemyImg = new Image();
playerImg.src = "player.png";
enemyImg.src = "enemy.png";

// === OBJECTS ===
let player = { x: 50, y: 50, size: 40, speed: 3 };
let enemy = { x: 500, y: 50, size: 40, speed: 1.5 };
let key = { x: 300, y: 200, size: 30, collected: false };
let level = 1;
let score = 0;
let running = false;
let quizActive = false;
let keysDown = {};

// === MAZE WALLS ===
let walls = [
  { x: 0, y: 0, w: 600, h: 10 },
  { x: 0, y: 0, w: 10, h: 400 },
  { x: 0, y: 390, w: 600, h: 10 },
  { x: 590, y: 0, w: 10, h: 400 },
  { x: 100, y: 100, w: 400, h: 10 },
  { x: 100, y: 200, w: 10, h: 100 },
  { x: 200, y: 300, w: 300, h: 10 },
];

// === QUIZ DATA ===
const quizQuestions = [
  [
    { question: "2 + 2 = ?", answers: ["3", "4", "5"], correct: "4" },
    { question: "Color of grass?", answers: ["Blue", "Green", "Yellow"], correct: "Green" },
    { question: "Capital of Japan?", answers: ["Tokyo", "Osaka", "Beijing"], correct: "Tokyo" },
  ],
  [
    { question: "5 x 2 = ?", answers: ["7", "10", "12"], correct: "10" },
    { question: "Opposite of hot?", answers: ["Cold", "Warm", "Wet"], correct: "Cold" },
    { question: "Planet we live on?", answers: ["Mars", "Earth", "Venus"], correct: "Earth" },
  ],
  [
    { question: "10 / 2 = ?", answers: ["2", "5", "8"], correct: "5" },
    { question: "Color of banana?", answers: ["Green", "Yellow", "Red"], correct: "Yellow" },
    { question: "Capital of France?", answers: ["London", "Paris", "Berlin"], correct: "Paris" },
  ]
];

// === EVENT HANDLERS ===
document.addEventListener("keydown", (e) => (keysDown[e.key] = true));
document.addEventListener("keyup", (e) => (keysDown[e.key] = false));

// Start music on user interaction
document.addEventListener(
  "click",
  () => {
    bgSong.volume = 0.5;
    bgSong.play().catch(() => {});
  },
  { once: true }
);

// === MOVEMENT & COLLISION ===
function movePlayer() {
  if (quizActive) return;

  const oldX = player.x;
  const oldY = player.y;

  if (keysDown["ArrowUp"] || keysDown["w"]) player.y -= player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) player.y += player.speed;
  if (keysDown["ArrowLeft"] || keysDown["a"]) player.x -= player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) player.x += player.speed;

  // Wall collision
  for (let w of walls) {
    if (
      player.x < w.x + w.w &&
      player.x + player.size > w.x &&
      player.y < w.y + w.h &&
      player.y + player.size > w.y
    ) {
      player.x = oldX;
      player.y = oldY;
    }
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

function checkKey() {
  if (!key.collected && Math.abs(player.x - key.x) < 30 && Math.abs(player.y - key.y) < 30) {
    key.collected = true;
    startQuiz();
  }
}

function checkEnemyCollision() {
  if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < 28) {
    gameOver();
  }
}

// === DRAWING ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw maze
  ctx.fillStyle = "gray";
  for (let w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);

  // Draw key
  if (!key.collected) {
    ctx.fillStyle = "gold";
    ctx.fillRect(key.x, key.y, key.size, key.size);
  }

  // Draw player
  if (playerImg.complete) ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  else {
    ctx.fillStyle = "cyan";
    ctx.fillRect(player.x, player.y, player.size, player.size);
  }

  // Draw enemy
  if (enemyImg.complete) ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
  else {
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
  }

  // Level text
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Level: " + level, 10, 20);
}

// === QUIZ SYSTEM ===
let quizTimer = null;
let quizDuration = 0;
let quizStartTime = 0;
let currentQuestionIndex = 0;

function startQuiz() {
  quizActive = true;
  currentQuestionIndex = 0;
  quizContainer.style.display = "flex";
  canvas.style.display = "none";
  showQuestion(0);
  startQuizTimer();
}

function showQuestion(index) {
  quizTab.innerHTML = "";
  const q = quizQuestions[level - 1][index];
  const p = document.createElement("p");
  p.textContent = q.question;
  quizTab.appendChild(p);

  q.answers.forEach((a) => {
    const btn = document.createElement("button");
    btn.textContent = a;
    btn.onclick = () => answerQuestion(a);
    quizTab.appendChild(btn);
  });
}

function startQuizTimer() {
  if (quizTimer) clearInterval(quizTimer);
  quizDuration = 8 + Math.random() * 7;
  quizStartTime = Date.now();
  timerBar.style.width = "100%";
  specialSFX.played = false;

  quizTimer = setInterval(() => {
    const elapsed = (Date.now() - quizStartTime) / 1000;
    const remaining = Math.max(0, 100 - (elapsed / quizDuration) * 100);
    timerBar.style.width = remaining + "%";

    if (elapsed >= 5 && !specialSFX.played) {
      specialSFX.played = true;
      specialSFX.currentTime = 0;
      specialSFX.play().catch(() => {});
    }

    if (elapsed >= quizDuration) {
      clearInterval(quizTimer);
      endQuiz();
    }
  }, 50);
}

function answerQuestion(ans) {
  const q = quizQuestions[level - 1][currentQuestionIndex];
  if (ans === q.correct) {
    score += 100;
    totalScoreEl.textContent = score;
  }
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizQuestions[level - 1].length) endQuiz();
  else showQuestion(currentQuestionIndex);
}

function endQuiz() {
  quizActive = false;
  quizContainer.style.display = "none";
  canvas.style.display = "block";

  // Progress to next level
  level++;
  if (level > quizQuestions.length) {
    gameOver(true); // win condition
    return;
  }

  // Reset positions and make harder
  player.x = 50;
  player.y = 50;
  enemy.x = 500;
  enemy.y = 50;
  key = { x: 100 + Math.random() * 400, y: 100 + Math.random() * 200, size: 30, collected: false };
  enemy.speed += 0.5;
}

// === GAME OVER ===
function gameOver(win = false) {
  running = false;
  canvas.style.display = "none";
  gameOverContainer.style.display = "block";
  gameOverContainer.querySelector("p").textContent = win
    ? "🎉 You Win! Final Score: " + score
    : "Game Over! Final Score: " + score;
  bgSong.pause();
}

// === RESTART ===
restartBtn.addEventListener("click", () => {
  player = { x: 50, y: 50, size: 40, speed: 3 };
  enemy = { x: 500, y: 50, size: 40, speed: 1.5 };
  key = { x: 300, y: 200, size: 30, collected: false };
  level = 1;
  score = 0;
  totalScoreEl.textContent = score;
  running = true;
  gameOverContainer.style.display = "none";
  canvas.style.display = "block";
  bgSong.currentTime = 0;
  bgSong.play().catch(() => {});
  requestAnimationFrame(loop);
});

// === MAIN LOOP ===
function loop() {
  if (!running) return;
  movePlayer();
  moveEnemy();
  checkKey();
  checkEnemyCollision();
  draw();
  requestAnimationFrame(loop);
}

// === START GAME ===
let imagesLoaded = 0;
playerImg.onload = enemyImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded === 2) {
    running = true;
    requestAnimationFrame(loop);
  }
};
