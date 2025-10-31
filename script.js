// ===== script.js (Full Rewrite: Correct Answer Feedback + 1.5s Head Start + Enemy Scaling + Open Start) =====
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

let player = { x: 50, y: 50, size: 40, speed: 3 };
let enemy  = { x: 700, y: 500, size: 40, speed: 2 };
let key    = { x: 0, y: 0, size: 30, collected: false };

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

// ===== Mazes =====
const mazes = [
  // Level1
  [
    { x:0,y:0,w:800,h:20},{ x:0,y:580,w:800,h:20 },
    { x:0,y:0,w:20,h:600 },{ x:780,y:0,w:20,h:600 },
    { x:200,y:150,w:400,h:20 },
    { x:200,y:300,w:400,h:20 },
    { x:200,y:450,w:400,h:20 }
  ],
  // Level2
  [
    { x:0,y:0,w:800,h:20},{ x:0,y:580,w:800,h:20 },
    { x:0,y:0,w:20,h:600 },{ x:780,y:0,w:20,h:600 },
    { x:150,y:100,w:500,h:20 },
    { x:150,y:100,w:20,h:380 },
    { x:150,y:480,w:500,h:20 },
    { x:630,y:250,w:20,h:250 },
    { x:300,y:250,w:350,h:20 }
  ],
  // Level3
  [
    { x:0,y:0,w:800,h:20},{ x:0,y:580,w:800,h:20 },
    { x:0,y:0,w:20,h:600 },{ x:780,y:0,w:20,h:600 },
    { x:100,y:100,w:520,h:20 },{ x:100,y:100,w:20,h:280 },
    { x:100,y:480,w:500,h:20 },{ x:680,y:100,w:20,h:400 },
    { x:250,y:250,w:300,h:20 }
  ],
  // Level4 Spiral with open start
  [
    { x:0,y:0,w:800,h:20 },{ x:0,y:580,w:800,h:20 },
    { x:0,y:0,w:20,h:600 },{ x:780,y:0,w:20,h:600 },
    // shifted down to leave top-left opening
    { x:60,y:80,w:680,h:20 },
    { x:60,y:60,w:20,h:460 },
    { x:60,y:500,w:640,h:20 },
    { x:680,y:100,w:20,h:420 },
    { x:100,y:100,w:600,h:20 },
    { x:100,y:100,w:20,h:380 },
    { x:100,y:460,w:520,h:20 },
    { x:600,y:140,w:20,h:340 },
    { x:140,y:140,w:480,h:20 },
    { x:140,y:140,w:20,h:300 },
    { x:140,y:420,w:440,h:20 },
    { x:560,y:180,w:20,h:260 }
  ],
  // Level5 with open start
  [
    { x:0,y:0,w:800,h:20 },{ x:0,y:580,w:800,h:20 },
    { x:0,y:0,w:20,h:600 },{ x:780,y:0,w:20,h:600 },
    // shifted down to leave top-left opening
    { x:150,y:120,w:500,h:20 },
    { x:150,y:120,w:20,h:380 },
    { x:150,y:480,w:500,h:20 },
    { x:630,y:100,w:20,h:400 },
    { x:300,y:200,w:200,h:20 },
    { x:400,y:200,w:20,h:300 }
  ]
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
  for(let y=40;y<canvas.height-40;y+=10){
    for(let x=40;x<canvas.width-40;x+=10){
      const rect={x,y,w:opts.w||40,h:opts.h||40};
      if(!isRectCollidingAny(rect,walls)) return {x,y};
    }
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
  let pos=null;
  if(level===2) pos={x:300+Math.random()*200,y:200+Math.random()*200};
  else if(level===3) pos={x:300+Math.random()*200,y:220+Math.random()*200};
  if(!pos) pos=findSafePosition(walls,{w:key.size,h:key.size,margin:30});
  if(Math.hypot(pos.x-player.x,pos.y-player.y)<100) pos=findSafePosition(walls,{w:key.size,h:key.size,margin:30});
  key.x=pos.x; key.y=pos.y; key.collected=false;
}

// ===== Quiz =====
function showQuestion(){
  const startIndex=(level-1)*3;
  const q=questions[startIndex+currentQuestionIndex]; if(!q) return;
  questionText.textContent=q.q;
  answersDiv.innerHTML="";
  q.btns=[];
  q.a.forEach(ans=>{
    const btn=document.createElement("button");
    btn.textContent=ans;
    btn.onclick=()=>answerQuestion(ans,btn);
    answersDiv.appendChild(btn);
    q.btns.push(btn);
  });
}
function answerQuestion(ans,clickedBtn){
  const startIndex=(level-1)*3;
  const q=questions[startIndex+currentQuestionIndex];
  if(ans===q.c){ score+=100; nextOrShowNext(); }
  else{
    if(clickedBtn) clickedBtn.style.backgroundColor="red";
    q.btns.forEach(btn=>{ if(btn.textContent===q.c) btn.style.backgroundColor="green"; });
    setTimeout(()=>{ nextOrShowNext(); },1000);
  }
  document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`;
}
function nextOrShowNext(){
  currentQuestionIndex++;
  if(currentQuestionIndex>=3) endQuiz(true);
  else showQuestion();
}
function startQuiz(){
  quizActive=true; quizContainer.style.display="flex"; currentQuestionIndex=0; quizTime=15; sfxPlayed=false;
  try{ specialSFX.pause(); specialSFX.currentTime=0; }catch(e){}
  showQuestion();
  quizTimer=setInterval(()=>{
    quizTime-=0.05; timeLeftEl.textContent=Math.ceil(quizTime);
    if(quizTime<=10 && !sfxPlayed){ specialSFX.play().catch(()=>{}); sfxPlayed=true; }
    if(quizTime<=0) endQuiz(false);
  },50);
}
function endQuiz(success){
  clearInterval(quizTimer); quizActive=false; quizContainer.style.display="none";
  try{ specialSFX.pause(); specialSFX.currentTime=0; }catch(e){}
  if(success) nextLevel(); else gameOver();
}

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
  player.x=pPos.x; player.y=pPos.y; enemy.x=ePos.x; enemy.y=ePos.y;

  // scale enemy size and speed
  enemy.size=40 + (level-1)*20; // bigger increase
  enemy.speed=2 + (level-1)*0.5;

  placeKey(); 
  document.getElementById("score").textContent=`Score: ${score} | Level: ${level}`;

  // reset head start
  headStartActive = true;
  headStartStartTime = null;

  specialSFX.play().catch(()=>{});
}

// ===== Game Over =====
function gameOver(){ gameOverScreen.style.display="flex"; }

// ===== Restart =====
restartBtn.addEventListener("click",()=>{
  gameOverScreen.style.display="none"; level=1; score=0; enemy.size=40; enemy.speed=2;
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

  const hitDist=(player.size+enemy.size)/2;
  if(Math.hypot(player.x-enemy.x,player.y-enemy.y)<hitDist) return gameOver();

  movePlayer();

  // enemy moves only after head start
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

  headStartActive = true;
  headStartStartTime = null;

  specialSFX.play().catch(()=>{});
  placeKey(); 
  requestAnimationFrame(loop);
})();
