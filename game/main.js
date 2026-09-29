import {createWorld, createRenderer, createCamera} from "./world.js?v=20260929-9";
import {createPlayer, respawn, getState, applyLook} from "./player.js";
import {updatePlayer, isBlocked} from "./physics.js?v=20260929-4";
import {createWeaponSystem} from "./weapons.js?v=20260929-5";
import {Room} from "../network/room.js";
import {createSync} from "../network/sync.js";
import {createHud, setupFullscreen} from "../ui/hud.js?v=20260925-9";
import {setupMobile} from "../ui/mobile.js?v=20260925-4";
import {createEngine} from "../engine/core.js?v=20260929-3";
import {createAudioEngine} from "../engine/audio.js";
import {createFx} from "../engine/fx.js";
import {createPlayerVisual} from "./assets.js?v=20260929-2";

const THREE=window.THREE;
const hud=createHud();

const input={
  keyboardX:0,keyboardZ:0,moveX:0,moveY:0,
  lookX:0,lookY:0,sprint:false,
  fire(){},stopFire(){},jump(){},aim(){}
};

let room=null;
let sync=null;
let scene=null;
let obstacles=[];
let solids=[];
let renderer=null;
let camera=null;
let player=null;
let remoteMesh=null;
let remoteState=null;
let remoteController=null;
let clock=null;
let score=0;
let remoteScore=0;
let health=100;
let yaw=0;
let pitch=0;
let lastNet=0;
let isHost=false;
let roomCode="";
let weapons=null;
let fireHeld=false;
let firePressed=false;
let raycaster=null;
let engine=null;
let audio=null;
let fx=null;
let worldAnimation=null;
let spawnPoints=null;
let lastScopeState=false;
let roundNumber=1;
let roundState="live";
let roundResetAt=0;
let matchResetAt=0;
let matchWinner=null;

const ROUNDS_TO_WIN=5;
const ROUND_DELAY=2600;
const MATCH_DELAY=4200;

function startGame(){
  if(scene) return;
  window.__ROOM_CODE=roomCode;

  const world=createWorld();
  scene=world.scene;
  obstacles=world.obstacles;
  solids=world.solids;
  spawnPoints=world.spawnPoints;
  worldAnimation=world.animation;

  renderer=createRenderer();
  camera=createCamera();
  clock=new THREE.Clock();
  player=createPlayer(camera,isHost);
  scene.add(player);

  weapons=createWeaponSystem(camera);
  raycaster=new THREE.Raycaster();
  engine=createEngine({renderer,scene,camera,clock});
  engine.collision.setColliders(obstacles);
  world.environmentAssetPromise?.then(result=>{
    engine.collision.setColliders(obstacles);
    if(result?.loaded>=result?.total){
      hud.loading("NIGHTLINE • 25/25 READY-MADE MAP ASSETS ✓");
    }else{
      hud.loading("NIGHTLINE • MAP "+(result?.loaded??0)+"/"+(result?.total??25));
    }
  });
  audio=createAudioEngine();
  fx=createFx(scene);
  engine.use(worldAnimation);
  engine.use(fx);

  positionAtOpenSpawn(player,isHost,engine.collision);
  setupInput();
  setupMobile(input);
  setupFullscreen(hud);

  document.querySelectorAll("[data-weapon]").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{
      e.preventDefault();
      audio?.unlock();
      if(weapons.equip(btn.dataset.weapon)) audio?.switchWeapon();
    });
  });

  document.getElementById("reload").addEventListener("pointerdown",e=>{
    e.preventDefault();
    audio?.unlock();
    if(weapons.reload()) audio.reload();
  });

  hud.showGame();
  hud.room(roomCode);
  hud.loading("NIGHTLINE FACILITY • ASSETS ONLINE");
  hud.rounds(roundNumber,score,remoteScore);
  hud.roundStatus("ПЕРВЫЙ ДО "+ROUNDS_TO_WIN);
  hud.waiting(false);

  weapons.loadExternalAssets().then(loaded=>{
    hud.loading(loaded ? "NIGHTLINE • REMOTE 3D ASSETS ✓" : "NIGHTLINE • LOCAL FALLBACK");
  });

  requestAnimationFrame(loop);
}

function setupInput(){
  const keys=new Set();
  const movementKeys=new Set(["KeyW","KeyA","KeyS","KeyD","ShiftLeft","ShiftRight"]);

  function refreshMovement(){
    input.keyboardZ=(keys.has("KeyS")?1:0)-(keys.has("KeyW")?1:0);
    input.keyboardX=(keys.has("KeyD")?1:0)-(keys.has("KeyA")?1:0);
    input.sprint=keys.has("ShiftLeft")||keys.has("ShiftRight");
  }

  addEventListener("keydown",e=>{
    if(movementKeys.has(e.code)){
      keys.add(e.code);
      e.preventDefault();
      audio?.unlock();
      refreshMovement();
    }
    if(e.code==="Space"){
      if(!e.repeat) input.jump();
      e.preventDefault();
    }
    if(e.code==="Digit1"){audio?.unlock();if(weapons?.equip("rifle"))audio?.switchWeapon();}
    if(e.code==="Digit2"){audio?.unlock();if(weapons?.equip("pistol"))audio?.switchWeapon();}
    if(e.code==="Digit3"){audio?.unlock();if(weapons?.equip("sniper"))audio?.switchWeapon();}
    if(e.code==="KeyR"){audio?.unlock();if(weapons?.reload())audio.reload();}
  });

  addEventListener("keyup",e=>{
    if(movementKeys.has(e.code)){
      keys.delete(e.code);
      e.preventDefault();
      refreshMovement();
    }
  });

  renderer.domElement.addEventListener("click",()=>{
    if(document.pointerLockElement!==renderer.domElement){
      renderer.domElement.requestPointerLock?.();
    }
  });

  addEventListener("mousemove",e=>{
    if(document.pointerLockElement===renderer.domElement){
      yaw-=e.movementX*.0018;
      pitch-=e.movementY*.0018;
      pitch=Math.max(-1.48,Math.min(1.48,pitch));
    }
  });

  renderer.domElement.addEventListener("mousedown",e=>{
    if(e.button===0 && document.pointerLockElement===renderer.domElement){
      fireHeld=true;
      firePressed=true;
      audio?.unlock();
    }
    if(e.button===2 && document.pointerLockElement===renderer.domElement){
      audio?.unlock();
      input.aim(true);
      e.preventDefault();
    }
  });

  addEventListener("mouseup",e=>{
    if(e.button===0) fireHeld=false;
    if(e.button===2) input.aim(false);
  });

  addEventListener("pointerlockchange",()=>{
    if(document.pointerLockElement!==renderer.domElement) fireHeld=false;
  });

  addEventListener("blur",()=>{
    keys.clear();
    input.keyboardX=input.keyboardZ=0;
    input.sprint=false;
    fireHeld=false;
    firePressed=false;
  });

  renderer.domElement.addEventListener("contextmenu",e=>e.preventDefault());

  input.fire=()=>{
    audio?.unlock();
    fireHeld=true;
    firePressed=true;
  };
  input.stopFire=()=>{fireHeld=false;};
  input.aim=value=>{
    const before=Boolean(weapons?.aiming);
    weapons?.setAim(Boolean(value));
    const after=Boolean(weapons?.aiming);
    if(before!==after) audio?.aim(after);
  };
  input.jump=()=>{
    audio?.unlock();
    if(!player)return;
    player.userData.jumpQueued=true;
    if(player.userData.grounded||player.userData.coyoteTimer>0) audio?.jump();
  };

  addEventListener("resize",()=>{
    if(!camera||!renderer) return;
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
}

function finishRound(winnerSide){
  if(roundState!=="live") return;

  const localWon=(winnerSide==="host")===isHost;
  if(localWon){
    score++;
    hud.roundWin(true);
  }else{
    remoteScore++;
    hud.roundWin(false);
  }

  roundState="transition";
  roundResetAt=performance.now()+ROUND_DELAY;
  health=100;
  hud.health(100);
  respawn(player,isHost);

  const matchFinished=score>=ROUNDS_TO_WIN||remoteScore>=ROUNDS_TO_WIN;
  if(matchFinished){
    matchWinner=localWon?"local":"remote";
    matchResetAt=performance.now()+MATCH_DELAY;
    hud.rounds(roundNumber,score,remoteScore);
    hud.match(matchWinner==="local");
  }else{
    roundNumber++;
    hud.rounds(roundNumber,score,remoteScore);
    hud.roundStatus("СЛЕДУЮЩИЙ РАУНД "+roundNumber);
  }
}

function upgradeRemotePlayer(){
  if(!scene||!remoteState) return;

  if(remoteMesh){
    scene.remove(remoteMesh);
    remoteMesh=null;
    remoteController=null;
  }

  remoteController=createPlayerVisual();
  remoteMesh=remoteController.root;
  remoteMesh.name="TACTICAL_REMOTE_PLAYER";
  remoteMesh.position.set(remoteState.x,remoteState.y-1.6,remoteState.z);
  remoteMesh.rotation.y=remoteState.yaw;
  scene.add(remoteMesh);
}

function handleData(data){
  const packet=sync.receive(data);
  if(!packet) return;

  if(data.t==="state"){
    remoteState=data;
    if(!remoteMesh) upgradeRemotePlayer();
    remoteScore=packet.remoteScore;
    hud.rounds(roundNumber,score,remoteScore);
  }else if(data.t==="score"){
    remoteScore=packet.remoteScore;
    hud.rounds(roundNumber,score,remoteScore);
  }else if(data.t==="roundEnd"){
    finishRound(String(data.winner));
  }else if(data.t==="hit"){
    if(roundState!=="live") return;
    health=Math.max(0,health-(Number(data.damage)||20));
    hud.health(health);
    hud.hit(Boolean(data.headshot));
    audio?.hurt();

    if(health===0){
      const winner=isHost?"guest":"host";
      room?.send({t:"roundEnd",winner});
      finishRound(winner);
    }
  }
}

function connectRoom(code,host){
  if(!/^\d{5}$/.test(code)){
    hud.status("Код должен содержать ровно 5 цифр.");
    return;
  }

  if(room) room.destroy();
  isHost=host;
  roomCode=code;
  window.__ROOM_CODE=code;

  room=new Room({
    code,host,
    onOpen:id=>{
      hud.status(host
        ?"Комната "+id+" создана. Передайте код второму игроку."
        :"Комната найдена. Подключение...");
      startGame();
      hud.waiting(room.isConnected());
    },
    onConnection:()=>{
      hud.status("P2P соединение установлено");
      hud.waiting(true);
    },
    onData:handleData,
    onClose:()=>{
      hud.status("Второй игрок отключился.");
      hud.waiting(false);
    },
    onError:error=>{
      const type=error?.type||"unknown";
      if(type==="unavailable-id") hud.status("Этот код уже занят. Выберите другой пятизначный код.");
      else if(type==="peer-unavailable") hud.status("Комната с таким кодом не найдена.");
      else hud.status("Ошибка P2P: "+type);
    }
  });

  sync=createSync(room);
  if(host) room.create().catch(error=>hud.status("Не удалось создать комнату: "+(error.type||error.message)));
  else room.join().catch(error=>hud.status("Не удалось войти: "+(error.type||error.message)));
}

function loop(){
  requestAnimationFrame(loop);

  const dt=Math.min(clock.getDelta(),.05);
  const now=performance.now();

  if(matchWinner){
    if(now>=matchResetAt){
      score=0;
      remoteScore=0;
      roundNumber=1;
      roundState="live";
      roundResetAt=0;
      matchResetAt=0;
      matchWinner=null;
      hud.rounds(roundNumber,score,remoteScore);
      hud.roundStatus("ПЕРВЫЙ ДО "+ROUNDS_TO_WIN);
    }else{
      roundState="transition";
    }
  }else if(roundState==="transition"&&now>=roundResetAt){
    roundState="live";
    hud.roundStatus("РАУНД "+roundNumber);
  }

  const lookSensitivity=input.mobileSettings?.lookSensitivity||1;
  const invertY=input.mobileSettings?.invertY?-1:1;
  pitch=Math.max(-1.45,Math.min(1.45,pitch-input.lookY*.035*lookSensitivity*invertY));
  yaw-=input.lookX*.045*lookSensitivity;

  const recoilNow=Boolean(weapons?.reloading)?0.0:1;
  applyLook(player,camera,{yaw,pitch});
  camera.rotation.x-=player.userData.cameraRecoil||0;
  player.userData.cameraRecoil=(player.userData.cameraRecoil||0)*.80*recoilNow;

  const beforeGrounded=player.userData.grounded===true;
  updatePlayer(player,{yaw},input,dt,engine.collision);

  const moveSpeed=Math.hypot(player.userData.velocityX||0,player.userData.velocityZ||0);
  const bobStrength=Math.min(1,moveSpeed/6.5)*(player.userData.grounded?1:0);
  const bobTime=now*.0105;
  camera.position.x+=((Math.sin(bobTime)*.018*bobStrength)-camera.position.x)*Math.min(1,dt*12);
  camera.position.y+=((Math.abs(Math.cos(bobTime))*.025*bobStrength)-camera.position.y)*Math.min(1,dt*12);

  if(beforeGrounded===false&&player.userData.grounded===true) audio?.land();
  if(player.userData.grounded&&moveSpeed>1) audio?.step(Boolean(input.sprint));

  if(remoteMesh&&remoteState){
    remoteMesh.position.lerp(
      new THREE.Vector3(remoteState.x,remoteState.y-1.6,remoteState.z),.24
    );
    remoteMesh.rotation.y=remoteState.yaw;

    const dx=remoteMesh.position.x-(remoteController?.lastX??remoteMesh.position.x);
    const dz=remoteMesh.position.z-(remoteController?.lastZ??remoteMesh.position.z);
    const remoteSpeed=Math.hypot(dx,dz)/Math.max(dt,.001);
    const remoteAirborne=Math.abs((remoteState.y??1.6)-1.6)>.10;
    remoteController?.update(dt,remoteSpeed>.55,remoteSpeed,remoteAirborne);
    if(remoteController){
      remoteController.lastX=remoteMesh.position.x;
      remoteController.lastZ=remoteMesh.position.z;
    }
  }

  engine?.update(dt,now);

  const aiming=Boolean(weapons?.aiming);
  const weaponCfg=weapons?.config();
  const targetFov=aiming?(weaponCfg?.adsFov||28):77;
  camera.fov+=(targetFov-camera.fov)*Math.min(1,dt*11);
  camera.updateProjectionMatrix();

  const scope=document.getElementById("scopeOverlay");
  const scopeState=aiming&&weapons?.current==="sniper";
  if(scope&&scopeState!==lastScopeState){
    scope.classList.toggle("active",scopeState);
    lastScopeState=scopeState;
  }

  weapons?.tick(now,{
    onBolt:()=>audio?.bolt(),
    onReloadComplete:id=>{
      audio?.reload();
      if(id==="sniper") audio?.bolt();
    }
  });

  if(weapons){
    const a=weapons.ammo();
    hud.weapon(weapons.config().name);
    hud.ammo(weapons.config().name,a.mag,a.reserve,weapons.reloading);
  }

  if(roundState==="live"&&fireHeld&&weapons){
    weapons.fire({
      triggerPressed:firePressed,
      now,raycaster,camera,remoteMesh,obstacles:solids,
      onDry:()=>audio?.dry(),
      onReload:()=>audio?.reload(),
      onShot:info=>{
        audio?.shot(info.weapon);
        player.userData.cameraRecoil=Math.min(.18,(player.userData.cameraRecoil||0)+info.config.recoil*.55);
        pitch+=info.config.recoil*.14;
        fx?.tracer(info.from.clone(),info.to.clone());
        fx?.burst(info.from.clone(),info.direction.clone(),"muzzle");
      },
      onHit:info=>{
        audio?.hit();
        if(info.point) fx?.burst(info.point,info.normal||new THREE.Vector3(0,1,0),"hit");
        sync?.sendHit({damage:info.damage,headshot:info.headshot});
      }
    });
    firePressed=false;
  }else{
    firePressed=false;
  }

  if(room?.isConnected()&&now-lastNet>33){
    lastNet=now;
    sync.sendState(getState(player,{yaw,pitch},score));
  }

  renderer.render(scene,camera);
}

function positionAtOpenSpawn(target,host,collisionWorld){
  const preferred=spawnPoints||[
    {host:[-31,-27],guest:[31,27]},
    {host:[-31,-18],guest:[31,18]},
    {host:[-25,-30],guest:[25,30]}
  ];
  const candidates=preferred.map(p=>host?p.host:p.guest);
  for(const [x,z] of candidates){
    if(!isBlocked(x,z,.40,collisionWorld)){
      target.position.set(x,1.6,z);
      target.userData.spawnX=x;
      target.userData.spawnZ=z;
      target.userData.grounded=true;
      return;
    }
  }
}

export function init(){
  document.getElementById("host").addEventListener("click",()=>{
    const code=document.getElementById("hostCode").value.replace(/\D/g,"").slice(0,5);
    if(!/^\d{5}$/.test(code)){
      hud.status("Введите код комнаты из 5 цифр.");
      return;
    }
    connectRoom(code,true);
  });

  document.getElementById("join").addEventListener("click",()=>{
    const code=document.getElementById("code").value.replace(/\D/g,"").slice(0,5);
    if(!/^\d{5}$/.test(code)){
      hud.status("Введите ровно 5 цифр.");
      return;
    }
    connectRoom(code,false);
  });

  for(const id of ["hostCode","code"]){
    document.getElementById(id).addEventListener("input",e=>{
      e.target.value=e.target.value.replace(/\D/g,"").slice(0,5);
    });
  }
}

init();
