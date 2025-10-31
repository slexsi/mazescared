// ======= Canvas and Game Setup =======
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');

// Audio
const bgSong = document.getElementById('bg-song');
const specialSFX = document.getElementById('special-sfx');

// UI
const quizContainer = document.getElementById('quiz-container');
const quizTab = document.getElementById('quiz-tab');
const timerBar = document.getElementById('quiz-timer-bar');
const totalScoreEl = document.getElementById('total-score');
const gameOverContainer = document.getElementById('game-over-container');
const restartBtn = document.getElementById('restart-btn');

// Images
const playerImg = new Image();
playerImg.src = "player.png";
const enemyImg = new Image();
enemyImg.src = "enemy.png";

// ======= Variables =======
let level = 0;
let score = 0;
let running = true;
let quizActive = false;
let quizTimer = null;
let quizStartTime = 0;
let quizDuration = 15; // 15 seconds for 3 questions
let currentQuestions = [];
let answersGiven = 0;
let correctAnswers = 0;

let player = { x: 50, y: 50, size: 40, speed: 3 };
let enemy = { x: 500, y: 50, size: 40, speed: 1.5 };
let key = { x: 300, y: 200, size: 30, collected: false };

let keysDown = {};
document.addEventListener('keydown', e => keysDown[e.key] = true);
document.addEventListener('keyup', e => keysDown[e.key] = false);

// ======= Mazes =======
const mazes = [
  // Level 1
  [
    {x:100,y:0,w:20,h:200},{x:200,y:200,w:20,h:200},
    {x:300,y:0,w:20,h:200},{x:400,y:200,w:20,h:200}
  ],
  // Level 2
  [
    {x:50,y:50,w:500,h:20},{x:50,y:330,w:500,h:20},
    {x:50,y:70,w:20,h:260},{x:530,y:70,w:20,h:260},
    {x:150,y:100,w:20,h:200},{x:350,y:100,w:20,h:200}
  ],
  // Level 3
  [
    {x:100,y:0,w:20,h:400},{x:200,y:100,w:200,h:20},
    {x:400,y:100,w:20,h:200},{x:200,y:300,w:200,h:20}
  ],
  // Level 4
  [
    {x:100,y:50,w:400,h:20},{x:100,y:330,w:400,h:20},
    {x:100,y:50,w:20,h:280},{x:480,y:50,w:20,h:280},
    {x:200,y:100,w:20,h:200},{x:300,y:100,w:20,h:200},{x:400,y:100,w:20,h:200}
  ],
  // Level 5
  [
    {x:50,y:50,w:500,h:20},{x:50,y:330,w:500,h:20},
    {x:50,y:70,w:20,h:260},{x:530,y:70,w:20,h:260},
    {x:150,y:100,w:20,h:200},{x:250,y:70,w:20,h:200},{x:400,y:100,w:20,h:200}
  ]
];

// ======= Resize =======
function resizeCanvas(){
  const aspect = 600/400;
  let width = window.innerWidth - 40;
  let height = window.innerHeight - 100;
  if(width/height > aspect) width = height*aspect;
  else height = width/aspect;
  canvas.width = 600;
  canvas.height = 400;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  bgSong.loop = true;
  bgSong.volume = 0.5;
  document.addEventListener('click', ()=>{bgSong.play().catch(()=>{});},{once:true});
});

// ======= Movement =======
function movePlayer(){
  if(quizActive) return;
  let nx = player.x, ny = player.y;
  if(keysDown['ArrowUp'] || keysDown['w']) ny -= player.speed;
  if(keysDown['ArrowDown'] || keysDown['s']) ny += player.speed;
  if(keysDown['ArrowLeft'] || keysDown['a']) nx -= player.speed;
  if(keysDown['ArrowRight'] || keysDown['d']) nx += player.speed;

  // Collision
  let next = {x: nx, y: ny, size: player.size};
  if(!isColliding(next)) {
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

// ======= Collision Detection =======
function isColliding(obj){
  for(let w of mazes[level]){
    if(obj.x < w.x + w.w && obj.x + obj.size > w.x && obj.y < w.y + w.h && obj.y + obj.size > w.y){
      return true;
    }
  }
  return false;
}

// ======= Key Collection =======
function checkKey(){
  if(!key.collected && Math.abs(player.x - key.x) < 30 && Math.abs(player.y - key.y) < 30){
    key.collected = true;
    startQuiz();
  }
}

// ======= Drawing =======
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw maze
  ctx.fillStyle = 'gray';
  for(let w of mazes[level]){
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }

  // Key
  if(!key.collected){
    ctx.fillStyle = 'gold';
    ctx.fillRect(key.x, key.y, key.size, key.size);
  }

  // Player
  ctx.drawImage(playerImg, player.x, player.y, player.size, player.size);

  // Enemy
  ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.size, enemy.size);

  // Level text
  ctx.fillStyle = 'white';
  ctx.font = "20px Arial";
  ctx.fillText("Level " + (level + 1), 10, 20);
}

// ======= Game Loop =======
function loop(){
  if(!running) return;
  movePlayer();
  moveEnemy();
  checkKey();

  // collision with enemy
  if(Math.hypot(player.x - enemy.x, player.y - enemy.y) < 28){ gameOver(); return; }

  draw();
  requestAnimationFrame(loop);
}

// ======= Quiz =======
function startQuiz(){
  quizActive = true;
  currentQuestions = quizQuestions[level];
  answersGiven = 0;
  correctAnswers = 0;
  quizContainer.style.display = 'flex';
  canvas.style.display = 'none';
  startQuizTimer();
  showQuestions();
}

function showQuestions(){
  quizTab.innerHTML = '';
  currentQuestions.forEach((q, i) => {
    const div = document.createElement('div');
    div.innerHTML = `<p>${q.question}</p>`;
    q.answers.forEach(a => {
      const btn = document.createElement('button');
      btn.textContent = a;
      btn.onclick = ()=>answerQuestion(a, q.correct, btn);
      div.appendChild(btn);
    });
    quizTab.appendChild(div);
  });
}

function answerQuestion(ans, correct, btn){
  answersGiven++;
  if(ans === correct){
    correctAnswers++;
    btn.style.background = 'green';
  } else {
    btn.style.background = 'red';
  }

  if(answersGiven === currentQuestions.length){
    endQuiz();
  }
}

function startQuizTimer(){
  if(quizTimer) clearInterval(quizTimer);
  quizStartTime = Date.now();
  specialSFX.played = false;
  quizTimer = setInterval(()=>{
    let elapsed = (Date.now() - quizStartTime)/1000;
    timerBar.style.width = Math.max(0, 100 - (elapsed/quizDuration*100)) + '%';
    if(elapsed >= 5 && !specialSFX.played){ 
      specialSFX.played = true; 
      specialSFX.currentTime = 0;
      specialSFX.play().catch(()=>{}); 
    }
    if(elapsed >= quizDuration){
      clearInterval(quizTimer);
      quizFailed();
    }
  }, 50);
}

function endQuiz(){
  clearInterval(quizTimer);
  quizActive = false;
  quizContainer.style.display = 'none';
  canvas.style.display = 'block';
  resizeCanvas();
  
  if(correctAnswers === currentQuestions.length){
    levelUp();
  } else {
    quizFailed();
  }
}

function quizFailed(){
  gameOver();
}

// ======= Level Progression =======
function levelUp(){
  level++;
  if(level >= mazes.length){
    alert("🎉 You beat all levels!");
    gameOver();
    return;
  }
  enemy.speed += 0.5;
  player.x = 50; player.y = 50;
  enemy.x = 500; enemy.y = 50;
  key = { x: 300, y: 200, size: 30, collected: false };
  requestAnimationFrame(loop);
}

// ======= Game Over =======
function gameOver(){
  running = false;
  canvas.style.display = 'none';
  gameOverContainer.style.display = 'block';
  bgSong.pause();
}

// ======= Restart =======
restartBtn.addEventListener('click', ()=>{
  level = 0;
  score = 0;
  player = { x:50, y:50, size:40, speed:3 };
  enemy = { x:500, y:50, size:40, speed:1.5 };
  key = { x:300, y:200, size:30, collected:false };
  running = true;
  gameOverContainer.style.display = 'none';
  canvas.style.display = 'block';
  resizeCanvas();
  bgSong.currentTime = 0;
  bgSong.play().catch(()=>{});
  requestAnimationFrame(loop);
});

// Start game
requestAnimationFrame(loop);
