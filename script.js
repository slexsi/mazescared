// ===== script.js (Refined Version) =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// DOM Elements
const quizContainer = document.getElementById("quizContainer");
const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const timeLeftEl = document.getElementById("timeLeft");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartBtn = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("score");

// Audio
const bgMusic = document.getElementById("bgMusic");
const specialSFX = document.getElementById("specialSFX");

// Images
const bgImg = new Image();
bgImg.src = "background.png";
const playerImg = new Image(); 
playerImg.src = "player.png";
const enemyImg = new Image(); 
enemyImg.src = "enemy.png";

// Game State
const GameState = {
  score: 0,
  level: 1,
  quizActive: false,
  quizTimer: null,
  quizTime: 15,
  currentQuestionIndex: 0,
  headStartActive: true,
  headStartDuration: 1500,
  headStartStartTime: null,
  sfxPlayed: false
};

// Game Objects
const Player = {
  x: 50, y: 50, size: 40, speed: 3, hitbox: 25,
  getCenter() {
    return { x: this.x + this.size/2, y: this.y + this.size/2 };
  }
};

const Enemy = {
  x: 700, y: 500, size: 40, speed: 2,
  getCenter() {
    return { x: this.x + this.size/2, y: this.y + this.size/2 };
  }
};

const Key = {
  x: 0, y: 0, size: 30, collected: false,
  getCenter() {
    return { x: this.x + this.size/2, y: this.y + this.size/2 };
  }
};

// Input Handling
const keysDown = {};
document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup", e => keysDown[e.key] = false);

// ===== Audio Management =====
function initAudio() {
  function unlockAudio() {
    bgMusic.play().catch(() => {});
    specialSFX.play().then(() => specialSFX.pause()).catch(() => {});
    document.removeEventListener("click", unlockAudio);
    document.removeEventListener("keydown", unlockAudio);
  }
  
  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });
  
  bgMusic.volume = 0.5;
  bgMusic.loop = true;
  specialSFX.load();
}

// ===== Mazes =====
const mazes = [
  // Level 1 - Simple
  [
    { x:0, y:0, w:800, h:20 }, { x:0, y:580, w:800, h:20 },
    { x:0, y:0, w:20, h:600 }, { x:780, y:0, w:20, h:600 },
    { x:200, y:150, w:400, h:20 },
    { x:200, y:300, w:400, h:20 },
    { x:200, y:450, w:400, h:20 }
  ],
  // Level 2 - Medium
  [
    { x:0, y:0, w:800, h:20 }, { x:0, y:580, w:800, h:20 },
    { x:0, y:0, w:20, h:600 }, { x:780, y:0, w:20, h:600 },
    { x:150, y:100, w:500, h:20 },
    { x:150, y:100, w:20, h:380 },
    { x:150, y:480, w:500, h:20 },
    { x:630, y:250, w:20, h:250 },
    { x:300, y:250, w:350, h:20 }
  ],
  // Level 3 - Complex
  [
    { x:0, y:0, w:800, h:20 }, { x:0, y:580, w:800, h:20 },
    { x:0, y:0, w:20, h:600 }, { x:780, y:0, w:20, h:600 },
    { x:100, y:100, w:520, h:20 }, { x:100, y:100, w:20, h:280 },
    { x:100, y:480, w:500, h:20 }, { x:680, y:100, w:20, h:400 },
    { x:250, y:250, w:300, h:20 }
  ],
  // Level 4 - Spiral
  [
    { x:0, y:0, w:800, h:20 }, { x:0, y:580, w:800, h:20 },
    { x:0, y:0, w:20, h:600 }, { x:780, y:0, w:20, h:600 },
    { x:100, y:100, w:600, h:20 }, 
    { x:100, y:100, w:20, h:400 },
    { x:100, y:500, w:600, h:20 },
    { x:680, y:200, w:20, h:300 },
    { x:250, y:200, w:400, h:20 },
    { x:250, y:200, w:20, h:200 },
    { x:250, y:400, w:350, h:20 }
  ],
  // Level 5 - Corridor
  [
    { x:0, y:0, w:800, h:20 }, { x:0, y:580, w:800, h:20 },
    { x:0, y:0, w:20, h:600 }, { x:780, y:0, w:20, h:600 },
    { x:100, y:120, w:600, h:20 },
    { x:100, y:300, w:600, h:20 },
    { x:100, y:460, w:600, h:20 },
    { x:100, y:120, w:20, h:100 },
    { x:680, y:300, w:20, h:160 },
    { x:250, y:140, w:20, h:160 },
    { x:530, y:320, w:20, h:140 }
  ]
];

// ===== Utility Functions =====
function rectCollision(r1, r2) {
  return !(r1.x + r1.w < r2.x || r1.x > r2.x + r2.w || 
           r1.y + r1.h < r2.y || r1.y > r2.y + r2.h);
}

function isRectCollidingAny(rect, walls) {
  return walls.some(wall => rectCollision(rect, wall));
}

function findSafePosition(walls, options = {}) {
  const margin = options.margin || 10;
  const width = options.w || 40;
  const height = options.h || 40;
  
  for (let i = 0; i < 500; i++) {
    const x = margin + Math.random() * (canvas.width - margin * 2);
    const y = margin + Math.random() * (canvas.height - margin * 2);
    const rect = { x, y, w: width, h: height };
    
    if (!isRectCollidingAny(rect, walls)) {
      return { x, y };
    }
  }
  return { x: 50, y: 50 }; // Fallback position
}

function distanceBetween(obj1, obj2) {
  const center1 = obj1.getCenter ? obj1.getCenter() : obj1;
  const center2 = obj2.getCenter ? obj2.getCenter() : obj2;
  return Math.hypot(center1.x - center2.x, center1.y - center2.y);
}

// ===== Movement =====
function movePlayer() {
  if (GameState.quizActive) return;
  
  let newX = Player.x;
  let newY = Player.y;
  
  if (keysDown["ArrowUp"] || keysDown["w"]) newY -= Player.speed;
  if (keysDown["ArrowDown"] || keysDown["s"]) newY += Player.speed;
  if (keysDown["ArrowLeft"] || keysDown["a"]) newX -= Player.speed;
  if (keysDown["ArrowRight"] || keysDown["d"]) newX += Player.speed;
  
  const walls = mazes[GameState.level - 1];
  const playerRect = {
    x: newX, 
    y: newY, 
    w: Player.hitbox, 
    h: Player.hitbox
  };
  
  if (!isRectCollidingAny(playerRect, walls)) {
    Player.x = newX;
    Player.y = newY;
  }
}

function moveEnemy() {
  if (GameState.quizActive) return;
  
  const dx = Player.x - Enemy.x;
  const dy = Player.y - Enemy.y;
  const distance = Math.hypot(dx, dy);
  
  if (distance > 0) {
    Enemy.x += (dx / distance) * Enemy.speed;
    Enemy.y += (dy / distance) * Enemy.speed;
  }
}

// ===== Key Management =====
function placeKey() {
  const walls = mazes[GameState.level - 1];
  let position = findSafePosition(walls, {
    w: Key.size,
    h: Key.size,
    margin: 30
  });
  
  // Ensure key isn't too close to player
  if (distanceBetween(Player, position) < 100) {
    position = findSafePosition(walls, {
      w: Key.size,
      h: Key.size,
      margin: 30
    });
  }
  
  Key.x = position.x;
  Key.y = position.y;
  Key.collected = false;
}

// ===== Quiz System =====
function showQuestion() {
  const startIndex = (GameState.level - 1) * 3;
  const question = questions[startIndex + GameState.currentQuestionIndex];
  
  if (!question) return;
  
  questionText.textContent = question.q;
  answersDiv.innerHTML = "";
  question.buttons = [];
  
  question.a.forEach(answer => {
    const button = document.createElement("button");
    button.textContent = answer;
    button.onclick = () => answerQuestion(answer, button);
    answersDiv.appendChild(button);
    question.buttons.push(button);
  });
}

function answerQuestion(answer, clickedButton) {
  const startIndex = (GameState.level - 1) * 3;
  const question = questions[startIndex + GameState.currentQuestionIndex];
  
  if (answer === question.c) {
    GameState.score += 100;
    nextOrShowNextQuestion();
  } else {
    if (clickedButton) clickedButton.style.backgroundColor = "red";
    question.buttons.forEach(btn => {
      if (btn.textContent === question.c) btn.style.backgroundColor = "green";
    });
    setTimeout(nextOrShowNextQuestion, 1000);
  }
  
  updateScoreDisplay();
}

function nextOrShowNextQuestion() {
  GameState.currentQuestionIndex++;
  
  if (GameState.currentQuestionIndex >= 3) {
    endQuiz(true);
  } else {
    showQuestion();
  }
}

function startQuiz() {
  GameState.quizActive = true;
  GameState.quizTime = 15;
  GameState.sfxPlayed = false;
  GameState.currentQuestionIndex = 0;
  
  quizContainer.style.display = "flex";
  
  // Reset SFX
  try {
    specialSFX.pause();
    specialSFX.currentTime = 0;
  } catch (e) {}
  
  showQuestion();
  
  GameState.quizTimer = setInterval(() => {
    GameState.quizTime -= 0.05;
    timeLeftEl.textContent = Math.ceil(GameState.quizTime);
    
    if (GameState.quizTime <= 10 && !GameState.sfxPlayed) {
      specialSFX.play().catch(() => {});
      GameState.sfxPlayed = true;
    }
    
    if (GameState.quizTime <= 0) {
      endQuiz(false);
    }
  }, 50);
}

function endQuiz(success) {
  clearInterval(GameState.quizTimer);
  GameState.quizActive = false;
  quizContainer.style.display = "none";
  
  try {
    specialSFX.pause();
    specialSFX.currentTime = 0;
  } catch (e) {}
  
  if (success) {
    nextLevel();
  } else {
    gameOver();
  }
}

// ===== Level Management =====
function nextLevel() {
  GameState.level++;
  
  if (GameState.level > 5) {
    alert("You beat all 5 levels! 🎉");
    GameState.level = 1;
    GameState.score = 0;
  }
  
  const walls = mazes[GameState.level - 1];
  const playerPos = findSafePosition(walls, {
    w: Player.size,
    h: Player.size,
    margin: 40
  });
  const enemyPos = findSafePosition(walls, {
    w: Enemy.size,
    h: Enemy.size,
    margin: 40
  });
  
  Player.x = playerPos.x;
  Player.y = playerPos.y;
  Enemy.x = enemyPos.x;
  Enemy.y = enemyPos.y;
  
  // Scale enemy difficulty
  Enemy.size = 40 + (GameState.level - 1) * 20;
  Enemy.speed = 2 + (GameState.level - 1) * 0.5;
  
  // Consistent player speed
  Player.speed = 4.5;
  
  placeKey();
  updateScoreDisplay();
  
  // Reset head start
  GameState.headStartActive = true;
  GameState.headStartStartTime = null;
  
  specialSFX.play().catch(() => {});
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${GameState.score} | Level: ${GameState.level}`;
}

// ===== Game Over =====
function gameOver() {
  gameOverScreen.style.display = "flex";
}

// ===== Rendering =====
function draw() {
  // Draw background
  if (bgImg.complete) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw walls
  const walls = mazes[GameState.level - 1];
  ctx.fillStyle = "gray";
  walls.forEach(wall => ctx.fillRect(wall.x, wall.y, wall.w, wall.h));
  
  // Draw key
  if (!Key.collected) {
    ctx.fillStyle = "gold";
    ctx.fillRect(Key.x, Key.y, Key.size, Key.size);
  }
  
  // Draw characters
  ctx.drawImage(playerImg, Player.x, Player.y, Player.size, Player.size);
  ctx.drawImage(enemyImg, Enemy.x, Enemy.y, Enemy.size, Enemy.size);
}

// ===== Game Loop =====
function gameLoop(timestamp) {
  // Initialize head start timing
  if (!GameState.headStartStartTime) {
    GameState.headStartStartTime = timestamp;
  }
  
  const elapsed = timestamp - GameState.headStartStartTime;
  
  // Check collision
  const hitDistance = (Player.hitbox + Enemy.size) / 2;
  if (distanceBetween(Player, Enemy) < hitDistance) {
    return gameOver();
  }
  
  // Move player
  movePlayer();
  
  // Move enemy (after head start period)
  if (!GameState.headStartActive || elapsed >= GameState.headStartDuration) {
    GameState.headStartActive = false;
    moveEnemy();
  }
  
  // Check key collection
  if (!Key.collected && distanceBetween(Player, Key) < (Player.hitbox/2 + Key.size/2)) {
    Key.collected = true;
    startQuiz();
  }
  
  // Render
  draw();
  requestAnimationFrame(gameLoop);
}

// ===== Game Initialization =====
function initGame() {
  initAudio();
  
  const walls = mazes[GameState.level - 1];
  const playerPos = findSafePosition(walls, {
    w: Player.size,
    h: Player.size,
    margin: 40
  });
  const enemyPos = findSafePosition(walls, {
    w: Enemy.size,
    h: Enemy.size,
    margin: 40
  });
  
  Player.x = playerPos.x;
  Player.y = playerPos.y;
  Enemy.x = enemyPos.x;
  Enemy.y = enemyPos.y;
  
  Player.speed = 4.5;
  GameState.headStartActive = true;
  GameState.headStartStartTime = null;
  
  specialSFX.play().catch(() => {});
  placeKey();
  updateScoreDisplay();
  
  requestAnimationFrame(gameLoop);
}

// ===== Event Listeners =====
restartBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  
  // Reset game state
  GameState.level = 1;
  GameState.score = 0;
  Enemy.size = 40;
  Enemy.speed = 2;
  Player.speed = 4.5;
  
  const walls = mazes[GameState.level - 1];
  const playerPos = findSafePosition(walls, {
    w: Player.size,
    h: Player.size,
    margin: 40
  });
  const enemyPos = findSafePosition(walls, {
    w: Enemy.size,
    h: Enemy.size,
    margin: 40
  });
  
  Player.x = playerPos.x;
  Player.y = playerPos.y;
  Enemy.x = enemyPos.x;
  Enemy.y = enemyPos.y;
  
  placeKey();
  updateScoreDisplay();
  
  GameState.headStartActive = true;
  GameState.headStartStartTime = null;
  
  specialSFX.play().catch(() => {});
  requestAnimationFrame(gameLoop);
});

// Start the game
initGame();
