import {createWorld, createRenderer, createCamera, createRemote} from "./world.js";
import {createPlayer, respawn, getState, applyLook} from "./player.js";
import {updatePlayer} from "./physics.js";
import {shoot as fireWeapon} from "./weapons.js";
import {Room} from "../network/room.js";
import {createSync} from "../network/sync.js";
import {createHud, setupFullscreen} from "../ui/hud.js";
import {setupMobile} from "../ui/mobile.js";

const THREE = window.THREE;
const hud = createHud();
const input = {
  keyboardX: 0, keyboardZ: 0, moveX: 0, moveY: 0,
  lookX: 0, lookY: 0, fire() {}, jump() {}
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

function startGame() {
  if (scene) return;
  window.__ROOM_CODE = roomCode;
  const world = createWorld();
  scene = world.scene;
  obstacles = world.obstacles;
  renderer = createRenderer();
  camera = createCamera();
  clock = new THREE.Clock();
  player = createPlayer(camera, isHost);
  scene.add(player);
  setupInput();
  setupMobile(input);
  setupFullscreen(hud);
  hud.showGame();
  hud.room(roomCode);
  hud.waiting(false);
  requestAnimationFrame(loop);
}

function setupInput() {
  addEventListener("keydown", e => {
    if (e.code === "KeyW") input.keyboardZ = -1;
    if (e.code === "KeyS") input.keyboardZ = 1;
    if (e.code === "KeyA") input.keyboardX = -1;
    if (e.code === "KeyD") input.keyboardX = 1;
    if (e.code === "Space") input.jump();
  });
  addEventListener("keyup", e => {
    if (e.code === "KeyW" || e.code === "KeyS") input.keyboardZ = 0;
    if (e.code === "KeyA" || e.code === "KeyD") input.keyboardX = 0;
  });

  renderer.domElement.addEventListener("click", () => {
    const fn = renderer.domElement.requestPointerLock;
    if (fn) fn.call(renderer.domElement);
  });
  addEventListener("mousemove", e => {
    if (document.pointerLockElement === renderer.domElement) {
      yaw -= e.movementX * 0.0025;
      pitch -= e.movementY * 0.0025;
      pitch = Math.max(-1.45, Math.min(1.45, pitch));
    }
  });
  renderer.domElement.addEventListener("mousedown", e => {
    if (e.button === 0) fireWeapon(() => room?.send({t:"hit"}), () => {
      score++;
      hud.score(score, remoteScore);
      sync?.sendScore(score);
    });
  });
  input.fire = () => fireWeapon(() => room?.send({t:"hit"}), () => {
    score++;
    hud.score(score, remoteScore);
    sync?.sendScore(score);
  });
  input.jump = () => { player.position.y = 2.5; };
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
    health = Math.max(0, health - 20);
    hud.health(health);
    if (health === 0) {
      health = 100;
      hud.health(100);
      respawn(player, isHost);
    }
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
  updatePlayer(player, {yaw}, input, dt, obstacles);
  if (remoteMesh && remoteState) {
    remoteMesh.position.lerp(new THREE.Vector3(remoteState.x, remoteState.y - 1.6, remoteState.z), 0.25);
    remoteMesh.rotation.y = remoteState.yaw;
  }
  pitch = Math.max(-1.45, Math.min(1.45, pitch + input.lookY * -0.035));
  yaw -= input.lookX * 0.045;
  applyLook(player, camera, {yaw, pitch});
  if (room?.isConnected() && performance.now() - lastNet > 50) {
    lastNet = performance.now();
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
