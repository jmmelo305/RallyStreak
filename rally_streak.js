// ─── CONFIG ──────────────────────────────────────────────────────────────────
const COURT_W  = 8.23;
const COURT_L  = 23.77;
const NET_H    = 0.914;
const BALL_R   = 0.12;
const GRAVITY  = -9.8;
const PLAYER_Z = COURT_L / 2 - 0.5;
const CAM_Y    = 1.7;
const FOV      = 75;

// ─── THREE.JS SETUP ──────────────────────────────────────────────────────────
const canvas   = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

const scene  = new THREE.Scene();
scene.background = new THREE.Color(0x111e0f);
scene.fog        = new THREE.Fog(0x0d1a0a, 30, 80);

const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, CAM_Y, PLAYER_Z);
camera.lookAt(0, CAM_Y - 0.15, 0);

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);

// ─── LIGHTS ──────────────────────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff5e0, 1.1);
sun.position.set(5, 14, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const fill = new THREE.DirectionalLight(0x88ccff, 0.3);
fill.position.set(-4, 6, -8);
scene.add(fill);

// ─── MATERIALS ───────────────────────────────────────────────────────────────
const mCourt   = new THREE.MeshLambertMaterial({ color: 0x2e6320 });
const mGrass   = new THREE.MeshLambertMaterial({ color: 0x1a3d0f });
const mLine    = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
const mNet     = new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
const mNetPost = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
const mBall    = new THREE.MeshPhongMaterial({ color: 0xccdd00, emissive: 0x334400, shininess: 60 });
const mOppBody = new THREE.MeshLambertMaterial({ color: 0xff5511 });
const mOppHead = new THREE.MeshLambertMaterial({ color: 0xe8b87a });
const mRacket  = new THREE.MeshPhongMaterial({ color: 0xddff00, emissive: 0x224400, shininess: 80 });

// ─── BUILD COURT ─────────────────────────────────────────────────────────────
function buildCourt() {
  const hw = COURT_W / 2, hl = COURT_L / 2;

  // Outer grass
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mGrass);
  grass.rotation.x = -Math.PI / 2;
  scene.add(grass);

  // Court surface
  const court = new THREE.Mesh(new THREE.PlaneGeometry(COURT_W, COURT_L), mCourt);
  court.rotation.x = -Math.PI / 2;
  court.position.y = 0.002;
  scene.add(court);

  // Line helpers
  function hLine(z, thick = 0.05) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(COURT_W, thick), mLine);
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.004, z);
    scene.add(m);
  }
  function vLine(x, thick = 0.05) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(thick, COURT_L), mLine);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.004, 0);
    scene.add(m);
  }

  hLine(-hl); hLine(hl);
  hLine(-COURT_L / 4); hLine(COURT_L / 4);
  vLine(-hw); vLine(hw); vLine(0);

  // Net posts
  const postGeo = new THREE.CylinderGeometry(0.04, 0.04, NET_H + 0.12, 8);
  [-hw - 0.5, hw + 0.5].forEach(x => {
    const post = new THREE.Mesh(postGeo, mNetPost);
    post.position.set(x, (NET_H + 0.12) / 2, 0);
    scene.add(post);
  });

  // Net horizontal bands
  for (let i = 0; i <= 8; i++) {
    const y = (i / 8) * NET_H;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(COURT_W + 1, 0.02), mNet);
    m.position.set(0, y, 0);
    scene.add(m);
  }
  // Net vertical straps
  for (let xi = -4; xi <= 4; xi++) {
    const x = xi * (COURT_W / 8);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.015, NET_H), mNet);
    m.position.set(x, NET_H / 2, 0);
    scene.add(m);
  }

  // Sky box
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x0d1e36, side: THREE.BackSide });
  const skyBox = new THREE.Mesh(new THREE.BoxGeometry(120, 60, 120), skyMat);
  skyBox.position.y = 20;
  scene.add(skyBox);

  // Stadium point lights
  [[hw * 3, 12, -hl], [-hw * 3, 12, -hl], [hw * 3, 12, hl], [-hw * 3, 12, hl]].forEach(([x, y, z]) => {
    const pl = new THREE.PointLight(0xfff8e0, 0.5, 40);
    pl.position.set(x, y, z);
    scene.add(pl);
  });
}
buildCourt();

// ─── OPPONENT ────────────────────────────────────────────────────────────────
const oppGroup = new THREE.Group();
scene.add(oppGroup);

const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 1.05, 10), mOppBody);
body.position.y = 0.525;
oppGroup.add(body);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), mOppHead);
head.position.y = 1.22;
oppGroup.add(head);

const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 6), mOppBody);
arm.position.set(0.38, 0.78, 0);
arm.rotation.z = -0.5;
oppGroup.add(arm);

const rktHead = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 20), mRacket);
rktHead.position.set(0.65, 0.55, 0);
oppGroup.add(rktHead);

oppGroup.position.set(0, 0, -COURT_L / 2 + 0.5);

// ─── BALL ────────────────────────────────────────────────────────────────────
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 14, 14), mBall);
ballMesh.visible = false;
scene.add(ballMesh);

// Ball trail
const TRAIL_LEN   = 10;
const trailMeshes = [];
for (let i = 0; i < TRAIL_LEN; i++) {
  const tm = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R * (1 - i / TRAIL_LEN) * 0.7, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xccdd00, transparent: true, opacity: (1 - i / TRAIL_LEN) * 0.35 })
  );
  tm.visible = false;
  scene.add(tm);
  trailMeshes.push(tm);
}
const trailPos = [];

// Ball indicator ring via canvas sprite
const ringCanvas = document.createElement('canvas');
ringCanvas.width = ringCanvas.height = 64;
const ringCtx = ringCanvas.getContext('2d');

function drawRing(color, alpha) {
  ringCtx.clearRect(0, 0, 64, 64);
  ringCtx.beginPath();
  ringCtx.arc(32, 32, 26, 0, Math.PI * 2);
  ringCtx.strokeStyle = color;
  ringCtx.globalAlpha = alpha;
  ringCtx.lineWidth   = 3;
  ringCtx.stroke();
}

const ringTex    = new THREE.CanvasTexture(ringCanvas);
const ringSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, transparent: true, depthTest: false }));
ringSprite.scale.set(1.0, 1.0, 1);
ringSprite.visible = false;
scene.add(ringSprite);

// ─── RACKET HUD (2D canvas overlay) ──────────────────────────────────────────
const hud2d = document.createElement('canvas');
const hCtx  = hud2d.getContext('2d');
hud2d.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
document.body.appendChild(hud2d);

function resizeHud() {
  hud2d.width  = innerWidth;
  hud2d.height = innerHeight;
}
resizeHud();
window.addEventListener('resize', resizeHud);

// ─── GAME STATE ──────────────────────────────────────────────────────────────
const gs = {
  phase:       'title',
  score:       0,
  bestScore:   0,
  streak:      0,
  bestStreak:  0,
  lives:       3,
  phaseTimer:  0,
  faultReason: 'out',

  ballPos:  [0, 1, -COURT_L / 2 + 2],
  ballVel:  [0, 0, 0],
  ballLive: false,

  oppX:    0,
  oppSpd:  3.0,

  mouseX:   innerWidth  / 2,
  mouseY:   innerHeight / 2,
  swinging: false,
  swingT:   0,
  hitFlash: 0,

  shotDirX: 0,
  shotLob:  false,
  shotSoft: false,

  particles: [],
  serveReady: false,   // true only after an explicit delay — prevents accidental serves

  multiplier()    { return 1.0 + Math.floor(this.streak / 2) * 0.5; },
  ballSpeedBase() { return 7.0 + this.multiplier() * 1.5; },
};

const keys = {};
window.addEventListener('keydown', e => {
  // ESC — quit to title screen from anywhere in the game
  if (e.code === 'Escape') {
    returnToTitle();
    return;
  }
  // Use code (layout-independent) mapped to WASD logical names
  const k = codeToKey(e.code);
  if (k) { keys[k] = true; e.preventDefault(); }
});
window.addEventListener('keyup', e => {
  const k = codeToKey(e.code);
  if (k) keys[k] = false;
});

function returnToTitle() {
  // Reset game state silently
  gs.phase      = 'title';
  gs.ballLive   = false;
  gs.swinging   = false;
  gs.swingT     = 0;
  gs.hitFlash   = 0;
  gs.serveReady = false;
  gs.particles.forEach(p => scene.remove(p.mesh));
  gs.particles  = [];
  ballMesh.visible = false;
  trailMeshes.forEach(t => t.visible = false);
  trailPos.length = 0;
  // Hide all game overlays
  document.getElementById('msg-overlay').classList.remove('visible');
  document.getElementById('gameover-screen').classList.remove('visible');
  // Hide game, show title
  document.getElementById('game-wrap').classList.remove('active');
  const titlePage = document.getElementById('title-page');
  titlePage.style.display = '';
  titlePage.classList.remove('hidden');
}
function codeToKey(code) {
  switch(code) {
    case 'KeyW': case 'ArrowUp':    return 'w';
    case 'KeyS': case 'ArrowDown':  return 's';
    case 'KeyA': case 'ArrowLeft':  return 'a';
    case 'KeyD': case 'ArrowRight': return 'd';
    default: return null;
  }
}

// ─── INPUT ───────────────────────────────────────────────────────────────────
window.addEventListener('mousemove', e => {
  gs.mouseX = e.clientX;
  gs.mouseY = e.clientY;
  const ch = document.getElementById('crosshair');
  ch.style.left = e.clientX + 'px';
  ch.style.top  = e.clientY + 'px';
});

// mousedown eliminates browser click-delay entirely
window.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  // Block clicks on HUD elements (text, dots, etc.) but allow canvas + overlays
  if (e.target.closest('#hud, #flash, #crosshair')) return;
  if (e.target.closest && e.target.closest('.btn')) return;


  if (gs.phase === 'serve' && gs.serveReady) {
    document.getElementById('msg-overlay').classList.remove('visible');
    gs.phase = 'rally'; // set immediately so loop toggle sees it right away
    serve();
    return;
  }
  if (gs.phase === 'rally') {
    // Snapshot ALL shot modifier keys at the exact moment of click
    const wHeld = !!keys['w'];
    const sHeld = !!keys['s'];
    const aHeld = !!keys['a'];
    const dHeld = !!keys['d'];
    gs.shotLob   = wHeld && !sHeld;
    gs.shotSoft  = sHeld && !wHeld;
    gs.shotDirX  = aHeld && !dHeld ? -1 : dHeld && !aHeld ? 1 : 0;
    // Start swing animation
    gs.swinging = true;
    gs.swingT   = 0;
    // Attempt hit immediately with the snapshotted flags
    attemptHit();
  }
});

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('gameover-screen').classList.remove('visible');
  resetGame();
});

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────
function resetGame() {
  gs.score      = 0;
  gs.streak     = 0;
  gs.lives      = 3;
  gs.phase      = 'serve';
  gs.phaseTimer = 0;
  gs.ballLive   = false;
  gs.swinging   = false;
  gs.swingT     = 0;
  gs.hitFlash   = 0;
  gs.particles  = [];
  gs.oppX       = 0;
  ballMesh.visible = false;
  trailMeshes.forEach(t => t.visible = false);
  trailPos.length = 0;
  updateHUD();
  gs.serveReady = false;
  setTimeout(() => { gs.serveReady = true; }, 600);
  document.getElementById('msg-overlay').classList.remove('visible');
}

function serve() {
  const speed = gs.ballSpeedBase();
  const sx    = (Math.random() - 0.5) * 1.0;
  gs.ballPos  = [sx, 2.2, PLAYER_Z - 0.5];
  const tx    = (Math.random() - 0.5) * 2.4;
  const dz    = (-COURT_L / 2 + 2) - gs.ballPos[2];
  const dx    = tx - sx;
  const len   = Math.sqrt(dx * dx + dz * dz);
  gs.ballVel  = [dx / len * speed * 0.3, 6.5, dz / len * speed];
  gs.ballLive = true;
  gs.phase    = 'rally';
  ballMesh.visible = true;
}

function opponentHit() {
  if (gs.ballVel[2] > 0) return;

  // Pick a random shot type — weighted by multiplier so harder shots appear more at higher streaks
  const mult = gs.multiplier();
  const rand = Math.random();
  // At low mult: mostly flat. At high mult: more lobs and drops mixed in
  const lobChance  = Math.min(0.25, 0.05 * mult);
  const dropChance = Math.min(0.20, 0.04 * mult);
  const isLob  = rand < lobChance;
  const isDrop = !isLob && rand < lobChance + dropChance;

  // Pick a target X: left corner, right corner, or body — random each shot
  const cornerRoll = Math.random();
  let targetX;
  if      (cornerRoll < 0.35) targetX = -(COURT_W / 2) * (0.6 + Math.random() * 0.3); // left corner
  else if (cornerRoll < 0.70) targetX =  (COURT_W / 2) * (0.6 + Math.random() * 0.3); // right corner
  else                        targetX = (Math.random() - 0.5) * 1.5;                   // body/centre

  const dToNet = Math.abs(gs.ballPos[2]);

  let speed, vy;

  if (isLob) {
    speed = gs.ballSpeedBase() * (0.45 + Math.random() * 0.1);
    vy    = 9.0 + Math.random() * 2.5;
  } else if (isDrop) {
    speed = gs.ballSpeedBase() * (0.32 + Math.random() * 0.08);
    const tDrop = dToNet / Math.max(speed, 0.1);
    const vyMin = (NET_H + 0.8 - gs.ballPos[1] - 0.5 * GRAVITY * tDrop * tDrop) / Math.max(tDrop, 0.1);
    vy = Math.max(vyMin + 1.0, 3.0);
  } else {
    // Flat — scale speed with multiplier for more pressure at higher streaks
    speed = gs.ballSpeedBase() * (0.85 + Math.random() * 0.3);
    const tNet  = dToNet / Math.max(speed, 0.1);
    const vyMin = (NET_H + 0.2 - gs.ballPos[1] - 0.5 * GRAVITY * tNet * tNet) / Math.max(tNet, 0.1);
    vy = Math.max(vyMin + 1.5, 3.0);
  }

  gs.ballVel[0] = (targetX - gs.ballPos[0]) * (0.5 + Math.random() * 0.2);
  gs.ballVel[1] = vy;
  gs.ballVel[2] = speed;
  spawnParticles(gs.ballPos[0], gs.ballPos[1], gs.ballPos[2], false);
}

// Use Three.js to project ball world pos directly onto screen — perfectly accurate
const _projVec = new THREE.Vector3();
function projectBallToScreen() {
  _projVec.set(gs.ballPos[0], gs.ballPos[1], gs.ballPos[2]);
  _projVec.project(camera);          // NDC: -1..1
  if (_projVec.z > 1) return null;   // behind camera
  const sx = (_projVec.x + 1) * 0.5 * innerWidth;
  const sy = (-_projVec.y + 1) * 0.5 * innerHeight;
  return [sx, sy];
}

// Called every frame during rally — keeps checking during active swing window
function checkPlayerHit() {
  if (!gs.swinging) return;
  attemptHit();
}

// Core hit test — called immediately on click AND each frame while swinging
function attemptHit() {
  if (!gs.ballLive) return;

  // Generous hit window: ball anywhere in front half of the court coming toward player
  const inZone = gs.ballPos[2] > PLAYER_Z - 5.0 && gs.ballPos[2] < PLAYER_Z + 1.0;
  if (!inZone) return;

  const bs = projectBallToScreen();
  if (!bs) return;

  // Hit radius: generous fixed screen-space distance, scaled to viewport
  const hitRadius = 150 * Math.min(innerWidth, innerHeight) / 720;
  const d = Math.hypot(bs[0] - gs.mouseX, bs[1] - gs.mouseY);
  if (d < hitRadius) playerHit();
}

function playerHit() {
  // --- Capture shot intent (already snapshotted at click time) ---
  const isLob   = gs.shotLob;
  const isDrop  = gs.shotSoft;
  const dirX    = gs.shotDirX;  // -1 left, 0 centre, +1 right

  let speed = gs.ballSpeedBase() * (0.9 + Math.random() * 0.15);
  const distToNet = Math.max(gs.ballPos[2], 0.5); // distance player -> net
  let vy;

  if (isLob) {
    // LOB: slow, very high arc — clears net with lots of margin
    speed *= 0.55;
    vy = 10.0 + Math.random() * 2;
  } else if (isDrop) {
    // DROP SHOT: slow, clears the net with solid margin, lands just past it
    speed *= 0.38;
    const tDrop = distToNet / Math.max(speed, 0.1);
    const vyMin = (NET_H + 0.8 - gs.ballPos[1] - 0.5 * GRAVITY * tDrop * tDrop) / Math.max(tDrop, 0.1);
    vy = Math.max(vyMin + 1.0, 3.0);
  } else {
    // FLAT: calculated arc to clear net cleanly
    const tNet  = distToNet / speed;
    const vyMin = (NET_H + 0.2 - gs.ballPos[1] - 0.5 * GRAVITY * tNet * tNet) / Math.max(tNet, 0.1);
    vy = Math.max(vyMin + 1.2, 3.0);
  }

  // Corner placement: dirX drives X velocity toward the target corner
  // Add small random noise so it's not robotic
  const cornerStrength = isLob ? 3.0 : isDrop ? 2.5 : 4.0;
  const vx = dirX * cornerStrength + (Math.random() - 0.5) * 0.4;

  gs.ballVel = [vx, vy, -speed];

  gs.streak++;
  gs.bestStreak = Math.max(gs.bestStreak, gs.streak);
  gs.score     += Math.floor(10 * gs.multiplier());
  gs.bestScore  = Math.max(gs.bestScore, gs.score);
  gs.hitFlash   = 1.0;

  spawnParticles(gs.ballPos[0], gs.ballPos[1], gs.ballPos[2], true);

  // Clear swing state
  gs.swinging = false;
  gs.swingT   = 0;
  gs.shotDirX = 0;
  gs.shotLob  = false;
  gs.shotSoft = false;
  updateHUD();
  pulseStreak();
}

function netFault() {
  gs.ballLive    = false;
  gs.streak      = 0;
  gs.lives--;
  gs.hitFlash    = 0;
  gs.faultReason = 'net';
  ballMesh.visible = false;
  trailMeshes.forEach(t => t.visible = false);
  spawnParticles(gs.ballPos[0], NET_H, 0, false);
  triggerFault();
}

function fault() {
  gs.ballLive    = false;
  gs.streak      = 0;
  gs.lives--;
  gs.hitFlash    = 0;
  gs.faultReason = 'out';
  ballMesh.visible = false;
  trailMeshes.forEach(t => t.visible = false);
  spawnParticles(gs.ballPos[0], 0.1, PLAYER_Z, false);
  triggerFault();
}

function triggerFault() {
  updateHUD();
  if (gs.lives <= 0) {
    gs.phase = 'gameover';
    document.getElementById('go-score').textContent  = gs.score;
    document.getElementById('go-streak').textContent = gs.bestStreak;
    document.getElementById('gameover-screen').classList.add('visible');
    return;
  }
  gs.phase      = 'fault';
  gs.phaseTimer = 2.0;
  const reason  = gs.faultReason === 'net' ? 'NET FAULT!' : 'FAULT!';
  const sub     = gs.faultReason === 'net' ? 'Aim higher next time' : 'Streak lost';
  showMsg(reason, sub, `${gs.lives} life${gs.lives !== 1 ? 's' : ''} remaining`);
  document.getElementById('msg-overlay').classList.add('visible');
  document.getElementById('msg-title').style.color = '#ff3333';
}

function showMsg(title, sub, hint) {
  document.getElementById('msg-title').textContent = title;
  document.getElementById('msg-sub').textContent   = sub;
  document.getElementById('msg-hint').textContent  = hint;
  document.getElementById('msg-title').style.color = '#ffffff';
}

// ─── PHYSICS ─────────────────────────────────────────────────────────────────
function updatePhysics(dt) {
  if (!gs.ballLive) return;

  gs.ballVel[1] += GRAVITY * dt;
  gs.ballPos[0] += gs.ballVel[0] * dt;
  gs.ballPos[1] += gs.ballVel[1] * dt;
  gs.ballPos[2] += gs.ballVel[2] * dt;

  // Ground bounce
  if (gs.ballPos[1] < BALL_R) {
    gs.ballPos[1]  = BALL_R;
    gs.ballVel[1] *= -0.5;
  }

  // Ceiling cap — ball bounces back down if it goes too high
  const BALL_MAX_Y = 10.0;
  if (gs.ballPos[1] > BALL_MAX_Y) {
    gs.ballPos[1]  = BALL_MAX_Y;
    gs.ballVel[1] *= -0.7;
  }

  // Side walls
  const hw = COURT_W / 2 + 1;
  if (Math.abs(gs.ballPos[0]) > hw) {
    gs.ballVel[0] *= -1;
    gs.ballPos[0]  = Math.sign(gs.ballPos[0]) * hw;
  }

  // Net fault
  if (gs.ballLive && gs.ballPos[2] > -0.2 && gs.ballPos[2] < 0.2
      && gs.ballPos[1] < NET_H + BALL_R && gs.ballVel[2] < 0) {
    netFault(); return;
  }

  // Opponent hits
  if (gs.ballLive && gs.ballPos[2] < -COURT_L/2 + 1.5 && gs.ballPos[2] > -COURT_L/2 - 1
      && gs.ballVel[2] < 0) {
    opponentHit();
  }

  // Ball past opponent — bonus score
  if (gs.ballLive && gs.ballPos[2] < -COURT_L/2 - 1 && gs.ballVel[2] < 0) {
    gs.ballLive = false;
    gs.score   += Math.floor(50 * gs.multiplier());
    gs.bestScore = Math.max(gs.bestScore, gs.score);
    gs.hitFlash  = 1.0;
    ballMesh.visible = false;
    trailMeshes.forEach(t => t.visible = false);
    updateHUD();
    gs.phase      = 'fault';
    gs.phaseTimer = 1.5;
    showMsg('POINT!', '+' + Math.floor(50 * gs.multiplier()) + ' BONUS', '');
    document.getElementById('msg-title').style.color = '#d4ff00';
    document.getElementById('msg-overlay').classList.add('visible');
    return;
  }

  // Player hit check — runs whenever swinging, ball in range
  if (gs.ballLive && gs.swinging) {
    checkPlayerHit();
  }

  // Ball past player
  if (gs.ballLive && gs.ballPos[2] > PLAYER_Z + 1.5) {
    fault(); return;
  }

  // Opponent tracking
  if (gs.ballVel[2] < 0) {
    gs.oppX += (gs.ballPos[0] - gs.oppX) * Math.min(1, gs.oppSpd * dt);
  }

  // Sync ball mesh
  ballMesh.position.set(gs.ballPos[0], gs.ballPos[1], gs.ballPos[2]);

  // Trail
  trailPos.unshift([...gs.ballPos]);
  if (trailPos.length > TRAIL_LEN) trailPos.pop();
  trailMeshes.forEach((tm, i) => {
    if (i < trailPos.length) {
      tm.visible = true;
      tm.position.set(...trailPos[i]);
    } else {
      tm.visible = false;
    }
  });

  // Ring indicator
  const bs = projectBallToScreen();
  if (bs && gs.ballVel[2] > 0) {
    const dist   = Math.abs(gs.ballPos[2] - PLAYER_Z);
    const coming = dist < 5.0 && gs.ballVel[2] > 0;
    drawRing(coming ? '#44ff44' : '#ccdd00', coming ? Math.max(0.25, 1 - dist / 5) : 0.18);
    ringTex.needsUpdate = true;
    ringSprite.position.set(gs.ballPos[0], gs.ballPos[1], gs.ballPos[2]);
    ringSprite.visible = true;
  } else {
    ringSprite.visible = false;
  }
}

// ─── PARTICLES ───────────────────────────────────────────────────────────────
const particleMat  = new THREE.MeshBasicMaterial({ color: 0xd4ff00 });
const particleMatR = new THREE.MeshBasicMaterial({ color: 0xff4422 });
const particleGeo  = new THREE.SphereGeometry(0.06, 4, 4);

function spawnParticles(x, y, z, hit) {
  for (let i = 0; i < 14; i++) {
    const angle  = Math.random() * Math.PI * 2;
    const angle2 = (Math.random() - 0.5) * Math.PI;
    const spd    = 1.5 + Math.random() * 3.5;
    const mesh   = new THREE.Mesh(particleGeo, hit ? particleMat : particleMatR);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    gs.particles.push({
      mesh,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
      vel: [
        Math.cos(angle) * Math.cos(angle2) * spd,
        Math.sin(angle2) * spd,
        Math.sin(angle) * Math.cos(angle2) * spd,
      ],
    });
  }
}

function updateParticles(dt) {
  gs.particles = gs.particles.filter(p => {
    p.life -= dt;
    if (p.life <= 0) { scene.remove(p.mesh); return false; }
    p.vel[1] -= 5 * dt;
    p.mesh.position.x += p.vel[0] * dt;
    p.mesh.position.y += p.vel[1] * dt;
    p.mesh.position.z += p.vel[2] * dt;
    const s = p.life / p.maxLife;
    p.mesh.scale.setScalar(s);
    p.mesh.material.opacity = s;
    return true;
  });
}

// ─── HUD UPDATE ──────────────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('score-val').textContent       = gs.score;
  document.getElementById('best-score-val').textContent  = gs.bestScore;
  document.getElementById('streak-val').textContent      = gs.streak;
  document.getElementById('best-streak-val').textContent = gs.bestStreak;

  const mult = gs.multiplier();
  const pct  = Math.min((mult - 1.0) / 3.0 * 100, 100);
  document.getElementById('bar-fill').style.width   = pct + '%';
  document.getElementById('mult-lbl').textContent   = '×' + mult.toFixed(1) + ' POWER';

  const col = mult >= 3 ? '#ff1f1f' : mult >= 2 ? '#ff6b00' : '#d4ff00';
  document.getElementById('bar-fill').style.background = col;
  document.getElementById('bar-fill').style.boxShadow  = `0 0 8px ${col}88`;
  document.getElementById('streak-val').style.color    = col;
  document.getElementById('mult-lbl').style.color      = col;

  for (let i = 0; i < 3; i++) {
    document.getElementById('life-' + i).classList.toggle('used', i >= gs.lives);
  }
}

function pulseStreak() {
  const el = document.getElementById('streak-val');
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

// ─── SHOT DIRECTION INDICATOR ─────────────────────────────────────────────────
function updateShotIndicator() {
  const el  = document.getElementById('dir-val');
  const w   = !!keys['w'], s = !!keys['s'];
  const a   = !!keys['a'], d = !!keys['d'];
  const lob  = w && !s;
  const drop = s && !w;
  const left  = a && !d;
  const right = d && !a;

  let label, color;
  if      (lob  && left)  { label = '↖  LOB LEFT';        color = '#00cfff'; }
  else if (lob  && right) { label = 'LOB RIGHT  ↗';       color = '#00cfff'; }
  else if (lob)           { label = '▲  LOB';             color = '#00cfff'; }
  else if (drop && left)  { label = '↙  DROP LEFT';       color = '#88ff88'; }
  else if (drop && right) { label = 'DROP RIGHT  ↘';      color = '#88ff88'; }
  else if (drop)          { label = '▼  DROP SHOT';       color = '#88ff88'; }
  else if (left)          { label = '◀  LEFT';            color = '#ffcc33'; }
  else if (right)         { label = 'RIGHT  ▶';           color = '#ffcc33'; }
  else                    { label = '—  FLAT  —';         color = 'rgba(200,200,200,0.55)'; }

  el.textContent  = label;
  el.style.color  = color;
}

// ─── RACKET 2D DRAW ──────────────────────────────────────────────────────────
function drawRacket2D() {
  hCtx.clearRect(0, 0, hud2d.width, hud2d.height);
  if (gs.phase === 'title' || gs.phase === 'gameover') return;

  // Scale racket to viewport so it feels the same size on any screen
  const scale   = Math.min(innerWidth, innerHeight) / 720;
  const cx      = gs.mouseX, cy = gs.mouseY;
  const swingDy = gs.swinging ? -Math.sin(gs.swingT * Math.PI) * 65 * scale : 0;
  const col     = gs.swinging ? '#ffffff' : '#d4ff00';

  // Handle
  hCtx.strokeStyle = col;
  hCtx.lineWidth   = Math.max(3, 8 * scale);
  hCtx.lineCap     = 'round';
  hCtx.shadowColor = col;
  hCtx.shadowBlur  = gs.swinging ? 20 * scale : 8 * scale;
  hCtx.beginPath();
  hCtx.moveTo(cx + 25 * scale, cy + 80 * scale + swingDy * 0.4);
  hCtx.lineTo(cx + 55 * scale, cy + 170 * scale + swingDy * 0.2);
  hCtx.stroke();

  // Racket head
  hCtx.lineWidth = Math.max(2, 5 * scale);
  hCtx.beginPath();
  const rx  = 52 * scale, ry = 65 * scale;
  const rhx = cx + 30 * scale + swingDy * 0.1;
  const rhy = cy + 18 * scale + swingDy;
  hCtx.ellipse(rhx, rhy, rx, ry, 0, 0, Math.PI * 2);
  hCtx.stroke();

  // Strings
  const strGap = 14 * scale;
  hCtx.lineWidth   = Math.max(0.5, scale);
  hCtx.globalAlpha = 0.4;
  for (let i = -3; i <= 3; i++) {
    hCtx.beginPath();
    hCtx.moveTo(rhx + i * strGap, rhy - ry + 10 * scale);
    hCtx.lineTo(rhx + i * strGap, rhy + ry - 10 * scale);
    hCtx.stroke();
    hCtx.beginPath();
    hCtx.moveTo(rhx - rx + 10 * scale, rhy + i * strGap);
    hCtx.lineTo(rhx + rx - 10 * scale, rhy + i * strGap);
    hCtx.stroke();
  }
  hCtx.globalAlpha = 1;
  hCtx.shadowBlur  = 0;
}

// ─── FLASH ───────────────────────────────────────────────────────────────────
function updateFlash() {
  const f = document.getElementById('flash');
  if (gs.hitFlash > 0) {
    f.style.background = (gs.faultReason === 'net' && !gs.ballLive)
      ? 'rgba(255,30,30,0.18)'
      : 'rgba(212,255,0,0.14)';
    f.style.opacity = gs.hitFlash;
  } else {
    f.style.opacity = 0;
  }
}

// ─── OPPONENT ANIMATION ──────────────────────────────────────────────────────
function updateOpponent() {
  oppGroup.position.x = gs.oppX;
  oppGroup.position.y = Math.sin(Date.now() * 0.002) * 0.03;
}

// ─── MAIN LOOP ───────────────────────────────────────────────────────────────
let lastTime = performance.now();

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (gs.phase === 'rally') updatePhysics(dt);

  if (gs.swinging) {
    gs.swingT += dt * 4;
    if (gs.swingT >= 1) { gs.swinging = false; gs.swingT = 0; }
  }

  if (gs.hitFlash > 0) gs.hitFlash = Math.max(0, gs.hitFlash - dt * 3);

  if (gs.phase === 'fault') {
    gs.phaseTimer -= dt;
    if (gs.phaseTimer <= 0) {
      gs.phase = 'serve';
      gs.serveReady = false;
      setTimeout(() => { gs.serveReady = true; }, 600);
      document.getElementById('msg-overlay').classList.remove('visible');
    }
  }

  updateParticles(dt);
  updateOpponent();
  updateShotIndicator();
  updateFlash();
  drawRacket2D();

  renderer.render(scene, camera);
}

// ─── INIT ────────────────────────────────────────────────────────────────────
// ── START BUTTON ──
document.getElementById('start-btn').addEventListener('click', () => {
  const titlePage = document.getElementById('title-page');
  titlePage.classList.add('hidden');
  // Wait for fade-out transition to finish, then remove entirely and start game
  titlePage.addEventListener('transitionend', () => {
    titlePage.style.display = 'none';
    document.getElementById('game-wrap').classList.add('active');
    gs.phase = 'serve';
    gs.serveReady = false;
    setTimeout(() => { gs.serveReady = true; }, 200);
  }, { once: true });
});

updateHUD();
requestAnimationFrame(loop);
