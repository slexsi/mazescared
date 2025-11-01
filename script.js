// ===== Canvas Setup =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgImage = new Image();
bgImage.src = "background.png"; // your outer background image

// ===== Player & Enemy Setup =====
let player = { x: 50, y: 50, size: 32, speed: 4 };
let enemy = { x: 700, y: 500, size: 40, speed: 1.5 };
let key = { x: 0, y: 0, size: 20 };
let walls = [];
let level = 1;
let score = 0;
let quizActive = false;
let keyCollected = false;
let gameRunning = true;
let headStart = true;

// ===== DOM Elements =====
const quizContainer = document.getElementById("quizContainer");
const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const timeLeftEl = document.getElementById("timeLeft");
const bgMusic = document.getElementById("bgMusic");
const specialSFX = document.getElementById("specialSFX");

// ===== Input Control =====
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ===== Maze Layouts =====
const mazes = [
  // Level 1
  [
    [0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,1,1,1,1,0],
    [0,1,0,1,0,1,0,0,1,0],
    [0,1,0,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,1,0,1,0],
    [0,1,1,1,1,0,1,1,1,0],
    [0,0,0,0,1,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 2 (fixed & simpler)
  [
    [0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,1,0,1,0,1,0],
    [0,1,1,0,1,1,1,1,1,0],
    [0,0,1,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 3
  [
    [0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,1,0,1,0],
    [0,1,1,1,1,0,1,1,1,0],
    [0,0,0,0,1,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 4 (simplified open center)
  [
    [0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,1,0,0,1,0],
    [0,1,0,1,1,1,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,0,0,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 5 (more open paths)
  [
    [0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,0,1,0,1,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0],
  ],
];

// ===== Build Maze =====
function buildMaze(lvl) {
  walls = [];
  const layout = mazes[lvl - 1];
  const cellSize = 60;
  for (let y = 0; y < layout.length; y++) {
    for (let x = 0; x < layout[y].length; x++) {
      if (layout[y][x] === 0) {
        walls.push({ x: x * cellSize, y: y * cellSize, w: cellSize, h: cellSize });
      }
    }
  }

  player.x = 70;
  player.y = 70;
  enemy.x = 700;
  enemy.y = 500;
  key.x = 700;
  key.y = 100;
  keyCollected = false;
  headStart = true;
  gameRunning = true;

  // Enemy scale + speed increase
  enemy.size = 40 + level * 10;
  enemy.speed = 1.5 + level * 0.3;

  setTimeout(() => {
    headStart = false;
    specialSFX.play().catch(() => {});
  }, 1500);
}

// ===== Collision Check =====
function checkCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.size > b.x &&
    a.y < b.y + b.h &&
    a.y + a.size > b.y
  );
}

// ===== Player Move =====
function movePlayer() {
  let tempX = player.x;
  let tempY = player.y;
  if (keys["ArrowUp"]) tempY -= player.speed;
  if (keys["ArrowDown"]) tempY += player.speed;
  if (keys["ArrowLeft"]) tempX -= player.speed;
  if (keys["ArrowRight"]) tempX += player.speed;

  const hitWall = walls.some(w => checkCollision({ x: tempX, y: tempY, size: player.size }, w));
  if (!hitWall) {
    player.x = tempX;
    player.y = tempY;
  }
}

// ===== Enemy Move =====
function moveEnemy() {
  if (headStart) return;
  let dx = player.x - enemy.x;
  let dy = player.y - enemy.y;
  let dist = Math.hypot(dx, dy);
  if (dist > 0) {
    enemy.x += (dx / dist) * enemy.speed;
    enemy.y += (dy / dist) * enemy.speed;
  }
}

// ===== Game Loop =====
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  // Draw maze
  ctx.fillStyle = "#333";
  walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // Draw key
  if (!keyCollected) {
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(key.x, key.y, key.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw player
  ctx.fillStyle = "cyan";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw enemy
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.size / 2, 0, Math.PI * 2);
  ctx.fill();

  if (gameRunning && !quizActive) {
    movePlayer();
    moveEnemy();

    // Check key collection
    if (
      !keyCollected &&
      Math.hypot(player.x - key.x, player.y - key.y) < player.size
    ) {
      keyCollected = true;
      startQuiz();
    }

    // Check enemy collision
    if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < enemy.size / 2 + player.size / 3) {
      gameOver();
    }
  }

  requestAnimationFrame(gameLoop);
}

// ===== Quiz System =====
function startQuiz() {
  quizActive = true;
  quizContainer.style.display = "flex";
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
  const q = questions[(level - 1) * 3];
  questionText.textContent = q.q;
  answersDiv.innerHTML = "";
  q.a.forEach(ans => {
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.onclick = () => answerQuestion(ans, q);
    answersDiv.appendChild(btn);
  });
}

function answerQuestion(ans, q) {
  if (ans === q.c) {
    score += 100;
    endQuiz(true);
  } else {
    endQuiz(false);
  }
}

function endQuiz(success) {
  clearInterval(quizTimer);
  quizContainer.style.display = "none";
  quizActive = false;
  if (success) nextLevel();
  else gameOver();
}

// ===== Level Handling =====
function nextLevel() {
  level++;
  if (level > mazes.length) {
    alert("You win!");
    location.reload();
  } else {
    document.getElementById("score").textContent = `Score: ${score} | Level: ${level}`;
    buildMaze(level);
  }
}

function gameOver() {
  alert("Game Over!");
  location.reload();
}

// ===== Start Game =====
bgMusic.play().catch(() => {});
buildMaze(level);
gameLoop();
