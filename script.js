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
let score = 0;
let running = false;
let quizActive = false;
let keysDown = {};

// === QUIZ DATA ===
const quizQuestions = [
  { question: "1 + 1 = ?", answers: ["1", "2", "3"], correct: "2" },
  { question: "Color of sky?", answers: ["Red", "Green", "Blue"], correct: "Blue" },
  { question: "Capital of France?", answers: ["Paris", "London", "Rome"], correct: "Paris" },
];

// === EVENT HANDLERS ===
document.addEventListener("keydown", (e) => (keysDown[e.key] = true));
document.addEventListener("keyup", (e) => (keysDown[e.key] = false));

// Start music on user interaction (autoplay fix)
document.addEventListener(
  "click",
  () => {
    bgSong.volume = 0.5;
    bgSong.play().catch(() => {});
  },
  { once: true }
);

// === PLAYER MOVEMENT ===
function movePlayer() {
  if (quizActive) return;
  if (keysDown["ArrowUp"] || keysDown["w"]) player.y -= player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) player.y += player.speed;
  if (keysDown["ArrowLeft"] || keysDown["a"]) player.x -= player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) player.x += player.speed;
}

// === ENEMY MOVEMENT ===
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

// === COLLISIONS ===
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
  const q = quizQuestions[index];
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
  const q = quizQuestions[currentQuestionIndex];
  if (ans === q.correct) {
    score += 100;
    totalScoreEl.textContent = score;
  }
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizQuestions.length) endQuiz();
  else showQuestion(currentQuestionIndex);
}

function endQuiz() {
  quizActive = false;
  quizContainer.style.display = "none";
  canvas.style.display = "block";
}

// === GAME OVER ===
function gameOver() {
  running = false;
  canvas.style.display = "none";
  gameOverContainer.style.display = "block";
  bgSong.pause();
}

// === RESTART ===
restartBtn.addEventListener("click", () => {
  player = { x: 50, y: 50, size: 40, speed: 3 };
  enemy = { x: 500, y: 50, size: 40, speed: 1.5 };
  key = { x: 300, y: 200, size: 30, collected: false };
  score = 0;
  totalScoreEl.textContent = score;
  running = true;
  gameOverContainer.style.display = "none";
  canvas.style.display = "block";
  bgSong.currentTime = 0;
  bgSong.play().catch(() => {});
  requestAnimationFrame(loop);
});

// === GAME LOOP ===
function loop() {
  if (!running) return;
  movePlayer();
  moveEnemy();
  checkKey();
  checkEnemyCollision();
  draw();
  requestAnimationFrame(loop);
}

// === START AFTER IMAGES LOADED ===
let imagesLoaded = 0;
playerImg.onload = enemyImg.onload = () => {
  imagesLoaded++;
  if (imagesLoaded === 2) {
    running = true;
    requestAnimationFrame(loop);
  }
};
