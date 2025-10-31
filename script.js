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

let player = { x:50, y:50, size:40, speed:3 };
let enemy = { x:700, y:500, size:40, speed:2 };
let key = { x:400, y:300, size:30, collected:false };

// Key movement input
let keysDown = {};
document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup", e => keysDown[e.key] = false);

// Start music immediately
bgMusic.volume = 0.5;
bgMusic.play().catch(()=>{document.addEventListener("keydown", ()=>bgMusic.play(), {once:true});});

// ===== Movement =====
function movePlayer(){
  if(quizActive) return;
  let nx = player.x, ny = player.y;
  if(keysDown['ArrowUp'] || keysDown['w']) ny -= player.speed;
  if(keysDown['ArrowDown'] || keysDown['s']) ny += player.speed;
  if(keysDown['ArrowLeft'] || keysDown['a']) nx -= player.speed;
  if(keysDown['ArrowRight'] || keysDown['d']) nx += player.speed;
  player.x = nx;
  player.y = ny;
}

function moveEnemy(){
  if(quizActive) return;
  let dx = player.x - enemy.x;
  let dy = player.y - enemy.y;
  let dist = Math.hypot(dx, dy);
  enemy.x += (dx/dist)*enemy.speed;
  enemy.y += (dy/dist)*enemy.speed;
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
  // player & enemy
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);
  ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);
  // key
  if(!key.collected){ ctx.fillStyle='gold'; ctx.fillRect(key.x,key.y,key.size,key.size); }
}

// ===== Game Loop =====
function loop(){
  if(checkCollision(player,enemy)){gameOver(); return;}
  movePlayer();
  moveEnemy();
  checkKey();
  draw();
  requestAnimationFrame(loop);
}

// ===== Quiz =====
function startQuiz(){
  quizActive = true;
  quizContainer.style.display='flex';
  currentQuestionIndex = 0;
  quizTime=15;
  timeLeftEl.textContent=quizTime;
  specialSFX.played=false;
  showQuestion();
  quizTimer=setInterval(()=>{
    quizTime-=0.05;
    if(quizTime<=0){ endQuiz(false); return; }
    timeLeftEl.textContent=Math.ceil(quizTime);
    if(quizTime<=10 && !specialSFX.played){ specialSFX.played=true; specialSFX.play(); }
  },50);
}

function showQuestion(){
  const q=questions[currentQuestionIndex];
  questionText.textContent=q.q;
  answersDiv.innerHTML="";
  q.a.forEach(ans=>{
    const btn=document.createElement("button");
    btn.textContent=ans;
    btn.onclick=()=>answerQuestion(ans);
    answersDiv.appendChild(btn);
  });
}

function answerQuestion(ans){
  const q=questions[currentQuestionIndex];
  if(ans===q.c){ score+=100; document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`; }
  currentQuestionIndex++;
  if(currentQuestionIndex>=questions.length){ endQuiz(true); }
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
  key.collected=false;
  player.x=50; player.y=50;
  enemy.x=700; enemy.y=500;
}

// ===== Game Over =====
function gameOver(){
  gameOverScreen.style.display='flex';
}

restartBtn.addEventListener("click",()=>{
  gameOverScreen.style.display='none';
  player={x:50,y:50,size:40,speed:3};
  enemy={x:700,y:500,size:40,speed:2};
  key.collected=false;
  score=0;
  level=1;
  document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`;
  loop();
});

// ===== Start Game =====
loop();
