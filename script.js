// ===== script.js (Playable + Head Start + Scaled Enemy + Faster Player) =====
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

const playerImg = new Image(); playerImg.src = "player.png";
const enemyImg = new Image(); enemyImg.src = "enemy.png";

// player always level5 speed
let player = { x: 50, y: 50, size: 40, speed: 4 };
let enemy  = { x: 700, y: 500, size: 40, speed: 2 };
let key    = { x: 0, y: 0, size: 30, collected: false };

const playerHitboxReduction = 0.5; // 50% smaller collision

let keysDown = {};
document.addEventListener("keydown", e => keysDown[e.key] = true);
document.addEventListener("keyup",   e => keysDown[e.key] = false);

// ===== Audio Unlock =====
function unlockAudioOnFirstInteraction() {
  function unlock() {
    bgMusic.play().catch(()=>{});
    specialSFX.play().then(() => specialSFX.pause()).catch(()=>{});
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
  }
  document.addEventListener("click", unlock, { once: true });
  document.addEventListener("keydown", unlock, { once: true });
}
unlockAudioOnFirstInteraction();
bgMusic.volume = 0.5; bgMusic.loop = true; bgMusic.play().catch(()=>{});
specialSFX.load();
let sfxPlayed = false;

// ===== Mazes (playable openings) =====
const mazes = [
  // Level1
  [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:780,y:0,w:20,h:600},{x:200,y:150,w:400,h:20},{x:200,y:300,w:400,h:20},{x:200,y:450,w:400,h:20}],
  // Level2
  [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:780,y:0,w:20,h:600},{x:150,y:100,w:500,h:20},{x:150,y:100,w:20,h:380},{x:150,y:480,w:500,h:20},{x:630,y:250,w:20,h:250},{x:300,y:250,w:350,h:20}],
  // Level3
  [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:780,y:0,w:20,h:600},{x:100,y:100,w:520,h:20},{x:100,y:100,w:20,h:280},{x:100,y:480,w:500,h:20},{x:680,y:100,w:20,h:400},{x:250,y:250,w:300,h:20}],
  // Level4
  [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:780,y:0,w:20,h:600},{x:150,y:80,w:600,h:20},{x:150,y:80,w:20,h:400},{x:150,y:460,w:600,h:20},{x:730,y:100,w:20,h:380},{x:200,y:140,w:520,h:20},{x:200,y:140,w:20,h:320},{x:200,y:440,w:460,h:20},{x:620,y:180,w:20,h:260}],
  // Level5
  [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:780,y:0,w:20,h:600},{x:120,y:100,w:520,h:20},{x:120,y:100,w:20,h:380},{x:120,y:480,w:500,h:20},{x:630,y:100,w:20,h:400},{x:300,y:220,w:200,h:20},{x:400,y:220,w:20,h:300}]
];

// ===== Utilities =====
function rectCollision(r1,r2){
  return !(r1.x+r1.w<r2.x||r1.x>r2.x+r2.w||r1.y+r1.h<r2.y||r1.y>r2.y+r2.h);
}
function isRectCollidingAny(rect,walls){ return walls.some(w=>rectCollision(rect,w)); }
function findSafePosition(walls, opts={}) {
  const margin = opts.margin||10, attempts=500;
  for(let i=0;i<attempts;i++){
    const x = margin + Math.random()*(canvas.width-margin*2);
    const y = margin + Math.random()*(canvas.height-margin*2);
    const rect = {x,y,w:opts.w||40,h:opts.h||40};
    if(!isRectCollidingAny(rect,walls)) return {x,y};
  }
  return {x:50,y:50};
}

// ===== Movement =====
function movePlayer(){
  if(quizActive) return;
  let nx=player.x,ny=player.y;
  if(keysDown["ArrowUp"]||keysDown["w"]) ny-=player.speed;
  if(keysDown["ArrowDown"]||keysDown["s"]) ny+=player.speed;
  if(keysDown["ArrowLeft"]||keysDown["a"]) nx-=player.speed;
  if(keysDown["ArrowRight"]||keysDown["d"]) nx+=player.speed;
  const walls = mazes[level-1];
  const rect={x:nx,y:ny,w:player.size,h:player.size};
  if(!isRectCollidingAny(rect,walls)){ player.x=nx; player.y=ny; }
}

function moveEnemy(){
  if(quizActive) return;
  const dx=player.x-enemy.x, dy=player.y-enemy.y;
  const dist=Math.hypot(dx,dy);
  if(dist>0){ enemy.x+=(dx/dist)*enemy.speed; enemy.y+=(dy/dist)*enemy.speed; }
}

// ===== Key placement =====
function placeKey(){
  const walls=mazes[level-1];
  let pos=findSafePosition(walls,{w:key.size,h:key.size,margin:30});
  if(Math.hypot(pos.x-player.x,pos.y-player.y)<100) pos=findSafePosition(walls,{w:key.size,h:key.size,margin:30});
  key.x=pos.x; key.y=pos.y; key.collected=false;
}

// ===== Quiz functions =====
function showQuestion(){ /* same as before */ }
function answerQuestion(ans,clickedBtn){ /* same as before */ }
function nextOrShowNext(){ /* same as before */ }
function startQuiz(){ /* same as before */ }
function endQuiz(success){ /* same as before */ }

// ===== Head start =====
let headStartActive = true;
const headStartDuration = 1500; // 1.5s
let headStartStartTime = null;

// ===== Level progression =====
function nextLevel(){
  level++; if(level>5){ alert("You beat all 5 levels! 🎉"); level=1; score=0; }
  const walls=mazes[level-1];
  const pPos=findSafePosition(walls,{w:player.size,h:player.size,margin:40});
  const ePos=findSafePosition(walls,{w:enemy.size,h:enemy.size,margin:40});
  player.x=pPos.x; player.y=pPos.y; 
  enemy.x=ePos.x; enemy.y=ePos.y;

  // scale enemy aggressively
  enemy.size = 40 + level*15; // bigger jump
  enemy.speed = 2 + level*0.5; // faster

  placeKey();
  document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`;

  // head start
  headStartActive = true;
  headStartStartTime = null;
  specialSFX.play().catch(()=>{});
}

// ===== Game Over =====
function gameOver(){ gameOverScreen.style.display="flex"; }

// ===== Restart =====
restartBtn.addEventListener("click",()=>{
  gameOverScreen.style.display="none"; 
  level=1; score=0;
  player.speed=4;
  enemy.size=40; enemy.speed=2;
  const walls=mazes[level-1];
  const pPos=findSafePosition(walls,{w:player.size,h:player.size,margin:40});
  const ePos=findSafePosition(walls,{w:enemy.size,h:enemy.size,margin:40});
  player.x=pPos.x; player.y=pPos.y; enemy.x=ePos.x; enemy.y=ePos.y;
  placeKey();
  document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`;
  
  headStartActive = true;
  headStartStartTime = null;
  specialSFX.play().catch(()=>{});
  
  requestAnimationFrame(loop);
});

// ===== Draw =====
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const walls=mazes[level-1];
  ctx.fillStyle="gray"; walls.forEach(w=>ctx.fillRect(w.x,w.y,w.w,w.h));
  if(!key.collected){ ctx.fillStyle="gold"; ctx.fillRect(key.x,key.y,key.size,key.size); }
  ctx.drawImage(playerImg,player.x,player.y,player.size,player.size);
  ctx.drawImage(enemyImg,enemy.x,enemy.y,enemy.size,enemy.size);
}

// ===== Loop =====
function loop(timestamp){
  if(!headStartStartTime) headStartStartTime = timestamp;
  const elapsed = timestamp - headStartStartTime;

  const hitDist=(player.size*playerHitboxReduction+enemy.size)/2;
  if(Math.hypot(player.x-enemy.x,player.y-enemy.y)<hitDist) return gameOver();

  movePlayer();

  if(!headStartActive || elapsed >= headStartDuration){
    headStartActive = false;
    moveEnemy();
  }

  if(!key.collected && Math.abs(player.x-key.x)<(player.size/2+key.size/2) && Math.abs(player.y-key.y)<(player.size/2+key.size/2)){
    key.collected=true; startQuiz();
  }

  draw();
  requestAnimationFrame(loop);
}

// ===== Start =====
(function initGame(){
  const walls=mazes[level-1];
  const pPos=findSafePosition(walls,{w:player.size,h:player.size,margin:40});
  const ePos=findSafePosition(walls,{w:enemy.size,h:enemy.size,margin:40});
  player.x=pPos.x; player.y=pPos.y; enemy.x=ePos.x; enemy.y=ePos.y;
  headStartActive = true; headStartStartTime = null;
  specialSFX.play().catch(()=>{});
  placeKey(); 
  requestAnimationFrame(loop);
})();
