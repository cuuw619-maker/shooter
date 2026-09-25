import {createWorld, createRenderer, createCamera, createRemote} from "./world.js";
import {createPlayer, respawn, getState, applyLook} from "./player.js";
import {updatePlayer} from "./physics.js";
import {createWeaponSystem} from "./weapons.js";
import {Room} from "../network/room.js";
import {createSync} from "../network/sync.js";
import {createHud, setupFullscreen} from "../ui/hud.js";
import {setupMobile} from "../ui/mobile.js";
import {createEngine} from "../engine/core.js";
import {createAudioEngine} from "../engine/audio.js";
import {createFx} from "../engine/fx.js";

const THREE = window.THREE;
const hud = createHud();
const input = {
  keyboardX: 0, keyboardZ: 0, moveX: 0, moveY: 0,
  lookX: 0, lookY: 0, sprint: false, fire() {}, jump() {}
};

let room = null;
let sync = null;
let scene = null;
let obstacles = [];
let renderer = null;
let camera = null;
let player = null;
let remoteMesh = null;
let remoteState = null;
let clock = null;
let score = 0;
let remoteScore = 0;
let health = 100;
let yaw = 0;
let pitch = 0;
let lastNet = 0;
let isHost = false;
let roomCode = "";
let weapons = null;
let fireHeld = false;
let firePressed = false;
let raycaster = null;
let solids = [];
let engine = null;
let audio = null;
let fx = null;

function startGame() {
  if (scene) return;
  window.__ROOM_CODE = roomCode;
  const world = createWorld();
  scene = world.scene;
  obstacles = world.obstacles;
  solids = world.solids || [];
  renderer = createRenderer();
  camera = createCamera();
  clock = new THREE.Clock();
  player = createPlayer(camera, isHost);
  scene.add(player);
  weapons = createWeaponSystem(camera);
  raycaster = new THREE.Raycaster();
  engine = createEngine({renderer, scene, camera, clock});
  audio = createAudioEngine();
  fx = createFx(scene);
  engine.use(fx);
  setupInput();
  setupMobile(input);
  setupFullscreen(hud);
  document.querySelectorAll("[data-weapon]").forEach(btn => btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    audio?.unlock();
    weapons.equip(btn.dataset.weapon);
  }));
  document.getElementById("reload").addEventListener("pointerdown", e => {
    e.preventDefault();
    audio?.unlock();
    if (weapons.reload()) audio.reload();
  });
  hud.showGame();
  hud.room(roomCode);
  hud.waiting(false);
  requestAnimationFrame(loop);
}

function setupInput() {
  const keys = new Set();
  const movementKeys = new Set(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"]);

  function refreshMovement() {
    input.keyboardZ = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
    input.keyboardX = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
    input.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
  }

  addEventListener("keydown", e => {
    if (movementKeys.has(e.code)) {
      keys.add(e.code);
      e.preventDefault();
      audio?.unlock();
      refreshMovement();
    }
    if (e.code === "Space") {
      if (!e.repeat) input.jump();
      e.preventDefault();
    }
    if (e.code === "Digit1") weapons?.equip("rifle");
    if (e.code === "Digit2") weapons?.equip("pistol");
    if (e.code === "Digit3") weapons?.equip("sniper");
    if (e.code === "KeyR") {
      audio?.unlock();
      if (weapons?.reload()) audio?.reload();
    }
  });

  addEventListener("keyup", e => {
    if (movementKeys.has(e.code)) {
      keys.delete(e.code);
      e.preventDefault();
      refreshMovement();
    }
  });

  renderer.domElement.addEventListener("click", () => {
    if (document.pointerLockElement !== renderer.domElement) {
      renderer.domElement.requestPointerLock?.();
    }
  });
  addEventListener("mousemove", e => {
    if (document.pointerLockElement === renderer.domElement) {
      const sensitivity = 0.0018;
      yaw -= e.movementX * sensitivity;
      pitch -= e.movementY * sensitivity;
      pitch = Math.max(-1.48, Math.min(1.48, pitch));
    }
  });
  renderer.domElement.addEventListener("mousedown", e => {
    if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
      fireHeld = true;
      firePressed = true;
      audio?.unlock();
    }
  });
  addEventListener("mouseup", e => {
    if (e.button === 0) fireHeld = false;
  });
  addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement !== renderer.domElement) fireHeld = false;
  });
  addEventListener("blur", () => {
    keys.clear();
    input.keyboardX = input.keyboardZ = 0;
    input.sprint = false;
    fireHeld = false;
    firePressed = false;
  });
  renderer.domElement.addEventListener("contextmenu", e => e.preventDefault());
  input.fire = () => { audio?.unlock(); fireHeld = true; firePressed = true; };
  input.stopFire = () => { fireHeld = false; };
  input.jump = () => {
    audio?.unlock();
    if (player?.userData.grounded) {
      player.userData.jumpQueued = true;
      audio?.jump();
    }
  };
  addEventListener("resize", () => {
    if (!camera || !renderer) return;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

function handleData(data) {
  const packet = sync.receive(data);
  if (!packet) return;
  if (data.t === "state") {
    remoteState = data;
    if (!remoteMesh) remoteMesh = createRemote(scene);
    remoteScore = packet.remoteScore;
    hud.score(score, remoteScore);
  } else if (data.t === "score") {
    remoteScore = packet.remoteScore;
    hud.score(score, remoteScore);
  } else if (data.t === "hit") {
    health = Math.max(0, health - (Number(data.damage) || 20));
    hud.health(health);
    hud.hit(Boolean(data.headshot));
    audio?.hurt();
    if (health === 0) {
      room?.send({t:"death"});
      health = 100;
      hud.health(100);
      respawn(player, isHost);
    }
  } else if (data.t === "death") {
    score++;
    hud.score(score, remoteScore);
    sync?.sendScore(score);
    hud.kill();
  }
}

function connectRoom(code, host) {
  if (!/^\d{5}$/.test(code)) {
    hud.status("Код должен содержать ровно 5 цифр.");
    return;
  }
  if (room) room.destroy();
  isHost = host;
  roomCode = code;
  window.__ROOM_CODE = code;

  room = new Room({
    code,
    host,
    onOpen: id => {
      hud.status(host ? "Комната " + id + " создана. Передайте код второму игроку." : "Комната найдена. Подключение...");
      startGame();
      hud.waiting(room.isConnected());
    },
    onConnection: () => {
      hud.status("P2P соединение установлено");
      hud.waiting(true);
    },
    onData: handleData,
    onClose: () => {
      hud.status("Второй игрок отключился.");
      hud.waiting(false);
    },
    onError: error => {
      const type = error?.type || "unknown";
      if (type === "unavailable-id") hud.status("Этот код уже занят. Выберите другой пятизначный код.");
      else if (type === "peer-unavailable") hud.status("Комната с таким кодом не найдена.");
      else hud.status("Ошибка P2P: " + type);
    }
  });

  sync = createSync(room);
  if (host) room.create().catch(error => hud.status("Не удалось создать комнату: " + (error.type || error.message)));
  else room.join().catch(error => hud.status("Не удалось войти: " + (error.type || error.message)));
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const now = performance.now();
  updatePlayer(player, {yaw}, input, dt, obstacles);
  if (remoteMesh && remoteState) {
    remoteMesh.position.lerp(new THREE.Vector3(remoteState.x, remoteState.y, remoteState.z), 0.25);
    remoteMesh.rotation.y = remoteState.yaw;
  }
  pitch = Math.max(-1.45, Math.min(1.45, pitch + input.lookY * -0.035));
  yaw -= input.lookX * 0.045;
  applyLook(player, camera, {yaw, pitch});
  engine?.update(dt, now);
  weapons?.tick(now);
  if (weapons) {
    const a = weapons.ammo();
    hud.weapon(weapons.config().name);
    hud.ammo(weapons.config().name, a.mag, a.reserve, weapons.reloading);
  }
  if (fireHeld && weapons) {
    weapons.fire({
      triggerPressed: firePressed,
      now,
      raycaster,
      camera,
      remoteMesh,
      obstacles: solids,
      onDry: () => audio?.dry(),
      onReload: () => audio?.reload(),
      onShot: info => {
        audio?.shot(info.weapon);
        fx?.tracer(info.from.clone(), info.to.clone());
        fx?.burst(info.from.clone(), info.direction.clone(), "muzzle");
      },
      onHit: info => {
        audio?.hit();
        if (info.point) fx?.burst(info.point, info.normal || new THREE.Vector3(0,1,0), "hit");
        room?.send({t:"hit", damage: info.damage, headshot: info.headshot});
        hud.score(score, remoteScore);
        sync?.sendScore(score);
      }
    });
    firePressed = false;
  } else {
    firePressed = false;
  }
  if (room?.isConnected() && now - lastNet > 50) {
    lastNet = now;
    sync.sendState(getState(player, {yaw, pitch}, score));
  }
  renderer.render(scene, camera);
}

export function init() {
  document.getElementById("host").addEventListener("click", () => {
    const code = document.getElementById("hostCode").value.replace(/\D/g, "").slice(0, 5);
    if (!/^\d{5}$/.test(code)) {
      hud.status("Введите код комнаты из 5 цифр.");
      return;
    }
    connectRoom(code, true);
  });
  document.getElementById("join").addEventListener("click", () => {
    const code = document.getElementById("code").value.replace(/\D/g, "").slice(0, 5);
    if (!/^\d{5}$/.test(code)) {
      hud.status("Введите ровно 5 цифр.");
      return;
    }
    connectRoom(code, false);
  });
  for (const id of ["hostCode", "code"]) {
    document.getElementById(id).addEventListener("input", e => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
    });
  }
}
init();
