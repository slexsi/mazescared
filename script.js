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

// Player & Enemy Images
const playerImg = new Image();
playerImg.src = "player.png";
const enemyImg = new Image();
enemyImg.src = "enemy.png";

// Player, Enemy & Key
let player = { x:50, y:50, size:40, speed:3 };
let enemy = { x:700, y:500, size:40, speed:2 };
let key = { x:0, y:0, size:30, collected:false };

// Movement input
let keysDown = {};
document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup", e => keysDown[e.key] = false);

// Start background music immediately
bgMusic.volume = 0.5;
bgMusic.play().catch(()=>{document.addEventListener("keydown", ()=>bgMusic.play(), {once:true});});

// ===== Maze Layouts =====
const mazes = [
  // Level 1
  [
    {x:0, y:0, w:800, h:20}, {x:0, y:580, w:800, h:20}, {x:0, y:0, w:20, h:600}, {x:780, y:0, w:20, h:600},
    {x:150, y:100, w:500, h:20}, {x:150, y:200, w:20, h:300}, {x:200, y:400, w:400, h:20},
  ],
  // Level 2
  [
    {x:0, y:0, w:800, h:20}, {x:0, y:580, w:800, h:20}, {x:0, y:0, w:20, h:600}, {x:780, y:0, w:20, h:600},
    {x:100, y:100, w:600, h:20}, {x:100, y:150, w:20, h:400}, {x:100, y:500, w:600, h:20}, {x:680, y:150, w:20, h:370},
  ],
  // Level 3
  [
    {x:0, y:0, w:800, h:20}, {x:0, y:580, w:800, h:20}, {x:0, y:0, w:20, h:600}, {x:780, y:0, w:20, h:600},
    {x:150, y:80, w:500, h:20}, {x:150, y:120, w:20, h:400}, {x:150, y:500, w:500, h:20}, {x:630, y:120, w:20, h:380},
  ],
  // Level 4
  [
    {x:0, y:0, w:800, h:20}, {x:0, y:580, w:800, h:20}, {x:0, y:0, w:20, h:600}, {x:780, y:0, w:20, h:600},
    {x:100, y:100, w:600, h:20}, {x:100, y:150, w:20, h:400}, {x:100, y:500, w:600, h:20}, {x:680, y:150, w:20, h:370},
    {x:250, y:200, w:300, h:20},
  ],
  // Level 5
  [
    {x:0, y:0, w:800, h:20}, {x:0, y:580, w:800, h:20}, {x:0, y:0, w:20, h:600}, {x:780, y:0, w:20, h:600},
    {x:100, y:100, w:600, h:20}, {x:100, y:150, w:20, h:400}, {x:100, y:500, w:600, h:20}, {x:680, y:150, w:20, h:370},
    {x:200, y:250, w:400, h:20}, {x:200, y:350, w:20, h:100},
  ],
];

// ===== Collision detection with buffer =====
function rectCollision(r1, r2){
  const buffer = 1;
  return !(r1.x + r1.w - buffer < r2.x ||
           r1.x + buffer > r2.x + r2.w ||
           r1.y + r1.h - buffer < r2.y ||
           r1.y + buffer > r2.y + r2.h);
}

// ===== Movement =====
function movePlayer(){
  if(quizActive) return;
  let nx = player.x, ny = player.y;
  if(keysDown['ArrowUp'] || keysDown['w']) ny -= player.speed;
  if(keysDown['ArrowDown'] || keysDown['s']) ny += player.speed;
  if(keysDown['ArrowLeft'] || keysDown['a']) nx -= player.speed;
  if(keysDown['ArrowRight'] || keysDown['d']) nx += player.speed;

  const walls = mazes[level-1];
  const playerRect = {x:nx, y:ny, w:player.size, h:player.size};
  if(!walls.some(w => rectCollision(playerRect, w))){
    player.x = nx; player.y = ny;
  }
}

function moveEnemy(){
  if(quizActive) return;
  let dx = player.x - enemy.x;
  let dy = player.y - enemy.y;
  let dist = Math.hypot(dx, dy);
  if(dist>0){
    enemy.x += (dx/dist)*enemy.speed;
    enemy.y += (dy/dist)*enemy.speed;
  }
}

// ===== Key placement avoiding walls =====
function placeKey(){
  const walls = mazes[level-1];
  let valid = false;
  while(!valid){
    key.x = 50 + Math.random() * 700;
    key.y = 50 + Math.random() * 500;
    const keyRect = {x:key.x, y:key.y, w:key.size, h:key.size};
    valid = !walls.some(w => rectCollision(keyRect, w));
  }
  key.collected = false;
}

// ===== Collision =====
function checkCollision(a,b){
  return (Math.abs(a.x-b.x)<30 && Math.abs(a.y-b.y)<30);
}

function checkKey(){
  if(!key.collected && checkCollision(player,key)){
    key.collected=true;
    startQuiz();
  }
}

// ===== Draw =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const walls = mazes[level-1];
  ctx.fillStyle='gray';
  walls.forEach(w => ctx.fillRect(w.x,w.y,w.w,w.h));

  if(!key.collected) ctx.fillStyle='gold';
  ctx.fillRect(key.x,key.y,key.size,key.size);

  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
}

// ===== Game Loop =====
function loop(){
  if(checkCollision(player,enemy)){ gameOver(); return; }
  movePlayer();
  moveEnemy();
  checkKey();
  draw();
  requestAnimationFrame(loop);
}

// ===== Quiz Logic =====
function startQuiz(){
  quizActive = true;
  quizContainer.style.display='flex';
  currentQuestionIndex = 0;
  quizTime = 15;
  timeLeftEl.textContent = quizTime;
  specialSFX.played=false;
  showQuestion();
  quizTimer = setInterval(()=>{
    quizTime -= 0.05;
    if(quizTime<=0){ endQuiz(false); return; }
    timeLeftEl.textContent = Math.ceil(quizTime);
    if(quizTime<=10 && !specialSFX.played){ specialSFX.played=true; specialSFX.play(); }
  },50);
}

function showQuestion(){
  const startIndex = (level-1)*3;
  const q = questions[startIndex + currentQuestionIndex];
  questionText.textContent = q.q;
  answersDiv.innerHTML="";
  q.a.forEach(ans=>{
    const btn = document.createElement("button");
    btn.textContent=ans;
    btn.onclick=()=>answerQuestion(ans);
    answersDiv.appendChild(btn);
  });
}

function answerQuestion(ans){
  const startIndex = (level-1)*3;
  const q = questions[startIndex + currentQuestionIndex];
  if(ans===q.c){ score+=100; document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`; }
  currentQuestionIndex++;
  if(currentQuestionIndex>=3){ endQuiz(true); }
  else showQuestion();
}

function endQuiz(success){
  clearInterval(quizTimer);
  quizActive=false;
  quizContainer.style.display='none';
  if(success){ nextLevel(); } else { gameOver(); }
}

// ===== Levels =====
function nextLevel(){
  level++;
  if(level>5){ alert("You win!"); level=1; score=0; }
  player.x = 50; player.y = 50;
  enemy.x = 700; enemy.y = 500;
  enemy.size = 40 + (level-1)*5;
  placeKey();
}

// ===== Game Over =====
function gameOver(){
  gameOverScreen.style.display='flex';
}

restartBtn.addEventListener("click",()=>{
  gameOverScreen.style.display='none';
  player={x:50,y:50,size:40,speed:3};
  enemy={x:700,y:500,size:40,speed:2};
  level=1; score=0;
  document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`;
  placeKey();
  loop();
});

// ===== Start Game =====
placeKey();
loop();
