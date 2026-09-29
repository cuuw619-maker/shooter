const THREE = window.THREE;

const EXTERNAL_SNIPER_URL =
  "https://raw.githubusercontent.com/GodotVR/godot-xr-tools/2d8db860d1adbee97c0968c4b07afe9348263926/"+
  "assets/3dmodelscc0/models/sniper_rifle/sniper_rifle.glb";

export const WEAPONS = {
  rifle: {
    name:"CARBINE",
    mag:30, reserve:120, damage:24, rate:92,
    reload:1700, spread:.016, recoil:.034, automatic:true, adsFov:55
  },
  pistol: {
    name:"SIDEARM",
    mag:15, reserve:60, damage:32, rate:225,
    reload:1150, spread:.010, recoil:.050, automatic:false, adsFov:50
  },
  sniper: {
    name:"SNIPER",
    mag:5, reserve:25, damage:100, rate:1080,
    reload:2300, spread:.0012, recoil:.15, automatic:false, adsFov:28
  }
};

function mat(color, metal=.3, roughness=.5, emissive=0x000000) {
  return new THREE.MeshStandardMaterial({
    color, metalness:metal, roughness, emissive,
    emissiveIntensity: emissive ? .55 : 0
  });
}

function addMuzzle(g, z) {
  const muzzle = new THREE.Object3D();
  muzzle.position.z = z;
  g.add(muzzle);
  g.userData.muzzle = muzzle;
}

function addArmRig(root) {
  const skin = mat(0xb57b5d,0,.86);
  const glove = mat(0x151a1f,.16,.7);
  const sleeve = mat(0x30383e,.24,.72);

  const armL = new THREE.Group();
  armL.name = "view_arm_l";
  armL.position.set(-.16,-.18,.12);
  root.add(armL);
  const foreL = new THREE.Mesh(new THREE.CapsuleGeometry(.07,.44,5,8),skin);
  foreL.rotation.z=.13;
  foreL.position.set(0,0,.12);
  foreL.castShadow=true;
  armL.add(foreL);
  const gloveL = new THREE.Mesh(new THREE.BoxGeometry(.12,.13,.18),glove);
  gloveL.position.set(-.01,-.03,-.12);
  gloveL.rotation.x=-.25;
  armL.add(gloveL);

  const armR = new THREE.Group();
  armR.name = "view_arm_r";
  armR.position.set(.16,-.18,.12);
  root.add(armR);
  const foreR = foreL.clone();
  foreR.material = sleeve;
  foreR.rotation.z=-.13;
  armR.add(foreR);
  const gloveR = gloveL.clone();
  gloveR.position.x=.01;
  gloveR.material=glove;
  armR.add(gloveR);

  return {armL,armR};
}

function buildRifle() {
  const g = new THREE.Group();
  const dark = mat(0x151a1e,.62,.34);
  const bodyMat = mat(0x293138,.5,.42);
  const polymer = mat(0x22282c,.12,.75);
  const bronze = mat(0x865f36,.42,.42);
  const glass = new THREE.MeshStandardMaterial({
    color:0x213d4c, metalness:.5, roughness:.16, emissive:0x0b2631, emissiveIntensity:.75
  });

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(.28,.20,.74),bodyMat);
  receiver.position.z=-.12;
  const upper = new THREE.Mesh(new THREE.BoxGeometry(.22,.08,.66),dark);
  upper.position.set(0,.13,-.20);
  const handguard = new THREE.Mesh(new THREE.BoxGeometry(.21,.17,.55),polymer);
  handguard.position.set(0,.01,-.74);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.028,.036,.72,16),dark);
  barrel.rotation.x=Math.PI/2;
  barrel.position.z=-1.13;

  const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(.05,.042,.13,16),dark);
  muzzle.rotation.x=Math.PI/2;
  muzzle.position.z=-1.56;

  const stock = new THREE.Mesh(new THREE.BoxGeometry(.21,.17,.42),bronze);
  stock.position.z=.46;
  stock.rotation.x=.025;

  const grip = new THREE.Mesh(new THREE.BoxGeometry(.12,.30,.15),polymer);
  grip.position.set(0,-.20,.08);
  grip.rotation.x=-.20;

  const mag = new THREE.Mesh(new THREE.BoxGeometry(.14,.30,.19),polymer);
  mag.position.set(0,-.18,-.05);
  mag.rotation.x=-.12;

  const opticBase = new THREE.Mesh(new THREE.BoxGeometry(.09,.06,.30),dark);
  opticBase.position.set(0,.19,-.32);
  const optic = new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,.38,14),dark);
  optic.rotation.x=Math.PI/2;
  optic.position.set(0,.245,-.42);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.018,14),glass);
  lens.rotation.x=Math.PI/2;
  lens.position.set(0,.245,-.62);

  const bolt = new THREE.Mesh(new THREE.BoxGeometry(.07,.06,.24),dark);
  bolt.position.set(0,.10,.17);

  g.add(receiver,upper,handguard,barrel,muzzle,stock,grip,mag,opticBase,optic,lens,bolt);
  g.userData.reloadParts=[{mesh:mag,from:mag.position.clone(),to:mag.position.clone().add(new THREE.Vector3(0,-.18,.02))}];
  g.userData.bolt=bolt;
  g.userData.boltBase=bolt.position.clone();
  addMuzzle(g,-1.63);
  return g;
}

function buildPistol() {
  const g = new THREE.Group();
  const dark=mat(0x171c20,.65,.35);
  const frame=mat(0x283036,.16,.72);
  const metal=mat(0x525b63,.70,.32);
  const accent=mat(0x94643a,.28,.52);

  const frameMesh=new THREE.Mesh(new THREE.BoxGeometry(.21,.19,.46),frame);
  frameMesh.position.z=-.11;
  const slide=new THREE.Mesh(new THREE.BoxGeometry(.22,.105,.40),metal);
  slide.position.set(0,.10,-.14);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.023,.024,.32,12),dark);
  barrel.rotation.x=Math.PI/2;
  barrel.position.z=-.54;
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.07,12),dark);
  muzzle.rotation.x=Math.PI/2;
  muzzle.position.z=-.72;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.145,.31,.16),accent);
  grip.position.set(0,-.20,.06);
  grip.rotation.x=-.16;
  const mag=new THREE.Mesh(new THREE.BoxGeometry(.11,.29,.13),dark);
  mag.position.set(0,-.18,.04);
  const sightF=new THREE.Mesh(new THREE.BoxGeometry(.045,.05,.06),dark);
  sightF.position.set(0,.18,-.31);
  const sightR=sightF.clone();
  sightR.position.z=-.03;
  g.add(frameMesh,slide,barrel,muzzle,grip,mag,sightF,sightR);
  g.userData.reloadParts=[{mesh:mag,from:mag.position.clone(),to:mag.position.clone().add(new THREE.Vector3(0,-.22,.03))}];
  g.userData.slide=slide;
  g.userData.slideBase=slide.position.clone();
  addMuzzle(g,-.76);
  return g;
}

function buildSniperFallback() {
  const g = new THREE.Group();
  const body=mat(0x171c22,.52,.44);
  const metal=mat(0x222a30,.78,.28);
  const wood=mat(0x5b3a25,.04,.78);
  const glass=new THREE.MeshStandardMaterial({
    color:0x2c6177,metalness:.35,roughness:.14,emissive:0x0b3448,emissiveIntensity:.9
  });

  const receiver=new THREE.Mesh(new THREE.BoxGeometry(.24,.21,1.0),body);
  receiver.position.z=-.14;
  const stock=new THREE.Mesh(new THREE.BoxGeometry(.22,.18,.5),wood);
  stock.position.z=.58;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.12,.28,.15),body);
  grip.position.set(0,-.20,.13);
  grip.rotation.x=-.18;
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.037,.044,.92,16),metal);
  barrel.rotation.x=Math.PI/2;
  barrel.position.z=-1.25;
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.13,14),metal);
  muzzle.rotation.x=Math.PI/2;
  muzzle.position.z=-1.77;
  const scopeTube=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.54,16),metal);
  scopeTube.rotation.x=Math.PI/2;
  scopeTube.position.set(0,.20,-.50);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.02,16),glass);
  lens.rotation.x=Math.PI/2;
  lens.position.set(0,.20,-.79);
  const mag=new THREE.Mesh(new THREE.BoxGeometry(.12,.22,.16),body);
  mag.position.set(0,-.17,-.02);
  const bolt=new THREE.Mesh(new THREE.BoxGeometry(.065,.055,.22),metal);
  bolt.position.set(.17,.08,.10);
  g.add(receiver,stock,grip,barrel,muzzle,scopeTube,lens,mag,bolt);
  g.userData.reloadParts=[{mesh:mag,from:mag.position.clone(),to:mag.position.clone().add(new THREE.Vector3(0,-.18,.04))}];
  g.userData.bolt=bolt;
  g.userData.boltBase=bolt.position.clone();
  addMuzzle(g,-1.84);
  return g;
}

function normalizeExternalModel(model) {
  model.traverse(o => {
    if (o.isMesh) {
      o.castShadow=true;
      o.receiveShadow=true;
    }
  });
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  const longest=Math.max(size.x,size.y,size.z,.001);
  const scale=1.75/longest;
  model.scale.setScalar(scale);
  model.position.x -= center.x*scale;
  model.position.y -= center.y*scale;
  model.position.z -= center.z*scale;
  model.rotation.y=Math.PI;
  return model;
}

export function createWeaponSystem(camera) {
  const root = new THREE.Group();
  root.position.set(.42,-.34,-.72);
  camera.add(root);

  const armRig=addArmRig(root);
  const state={};
  for (const id of Object.keys(WEAPONS)) {
    state[id]={mag:WEAPONS[id].mag,reserve:WEAPONS[id].reserve};
  }

  const models={
    rifle:buildRifle(),
    pistol:buildPistol(),
    sniper:buildSniperFallback()
  };
  Object.values(models).forEach(m=>{
    m.visible=false;
    root.add(m);
  });
  models.rifle.visible=true;

  let externalSniper=null;
  let externalReady=false;
  let current="rifle";
  let lastShot=-Infinity;
  let reloading=false;
  let reloadTimer=0;
  let equipStarted=0;
  let recoil=0;
  let aiming=false;
  let boltTimer=0;

  let equipFrom=new THREE.Vector3(root.position.x,root.position.y,root.position.z);
  let equipTo= root.position.clone();
  let equipBlend=1;

  async function loadExternalAssets() {
    if (!window.THREE?.GLTFLoader) return false;
    return new Promise(resolve=>{
      try {
        const loader=new THREE.GLTFLoader();
        loader.setCrossOrigin?.("anonymous");
        loader.load(EXTERNAL_SNIPER_URL, gltf=>{
          const model=normalizeExternalModel(gltf.scene);
          model.visible=false;
          model.name="CC0_SNIPER_RIFLE";
          root.add(model);
          externalSniper=model;
          externalReady=true;
          if (current==="sniper") {
            models.sniper.visible=false;
            externalSniper.visible=true;
          }
          resolve(true);
        }, undefined, ()=>{
          resolve(false);
        });
      } catch {
        resolve(false);
      }
    });
  }

  function activeModel() {
    return current==="sniper" && externalSniper ? externalSniper : models[current];
  }

  function switchVisible(next) {
    Object.values(models).forEach(m=>m.visible=false);
    if (externalSniper) externalSniper.visible=false;
    activeModel().visible=true;
  }

  function equip(id) {
    if (!WEAPONS[id] || id===current || reloading) return false;
    equipFrom.copy(root.position);
    current=id;
    aiming=false;
    recoil=0;
    equipTo.set(.42,-.34,-.72);
    equipStarted=performance.now();
    equipBlend=0;
    switchVisible(current);
    return true;
  }

  function setAim(value) {
    if (reloading) return;
    aiming=Boolean(value);
  }

  function reload(now=performance.now()) {
    if (reloading) return false;
    const cfg=WEAPONS[current], ammo=state[current];
    if (ammo.mag>=cfg.mag || ammo.reserve<=0) return false;
    reloading=true;
    aiming=false;
    reloadTimer=now+cfg.reload;
    return true;
  }

  function applyReloadAnimation(model, now) {
    const cfg=WEAPONS[current];
    const total=cfg.reload;
    const progress=1-Math.max(0,reloadTimer-now)/total;
    const p=Math.max(0,Math.min(1,progress));
    const part=model.userData.reloadParts?.[0];
    if (part) {
      const down=Math.sin(Math.min(1,p*1.75)*Math.PI)*.22;
      part.mesh.position.copy(part.from);
      part.mesh.position.y -= down;
      part.mesh.rotation.x = -Math.sin(Math.min(1,p*1.4)*Math.PI)*.32;
    }
    if (model.userData.slide && model.userData.slideBase) {
      model.userData.slide.position.copy(model.userData.slideBase);
      model.userData.slide.position.z += Math.sin(p*Math.PI)*.13;
    }
    if (model.userData.bolt && model.userData.boltBase) {
      model.userData.bolt.position.copy(model.userData.boltBase);
      model.userData.bolt.position.z += Math.sin(p*Math.PI)*.18;
    }
  }

  function resetReloadPose(model) {
    const part=model.userData.reloadParts?.[0];
    if (part) {
      part.mesh.position.copy(part.from);
      part.mesh.rotation.set(0,0,0);
    }
    if (model.userData.slide && model.userData.slideBase) model.userData.slide.position.copy(model.userData.slideBase);
    if (model.userData.bolt && model.userData.boltBase) model.userData.bolt.position.copy(model.userData.boltBase);
  }

  function tick(now=performance.now(), events={}) {
    if (reloading && now>=reloadTimer) {
      const cfg=WEAPONS[current], ammo=state[current];
      const need=cfg.mag-ammo.mag;
      const take=Math.min(need,ammo.reserve);
      ammo.mag+=take;
      ammo.reserve-=take;
      reloading=false;
      reloadTimer=0;
      resetReloadPose(activeModel());
      events.onReloadComplete?.(current);
    }

    if (boltTimer && now>=boltTimer) {
      boltTimer=0;
      events.onBolt?.();
    }

    recoil*=.82;
    equipBlend=Math.min(1,equipBlend + .08);
    const equipEase=1-(1-equipBlend)*(1-equipBlend);
    const idleBob=Math.sin(now*.0042)*.003;
    const swayX=Math.sin(now*.0026)*.004;
    const swayY=Math.cos(now*.0031)*.003;
    const runBob=Math.abs(Math.cos(now*.008))*0.004;

    const ads=current==="sniper" || current==="rifle" || current==="pistol";
    const targetX=ads && aiming ? -.08 : .42;
    const targetY=ads && aiming ? -.29 : -.34;
    const targetZ=ads && aiming ? -.90 : -.72;

    const baseX=targetX+idleBob+swayX+runBob;
    const baseY=targetY+swayY;
    const baseZ=targetZ+recoil;

    const desired=new THREE.Vector3(baseX,baseY,baseZ);
    root.position.lerpVectors(equipFrom,desired,equipEase);

    const kick=recoil*.65;
    root.rotation.x=kick + Math.sin(now*.002)*.004;
    root.rotation.y=swayX*.7;
    root.rotation.z=Math.sin(now*.0018)*.004;

    armRig.armL.rotation.x=aiming ? -.08 : 0;
    armRig.armR.rotation.x=aiming ? -.08 : 0;

    if (reloading) applyReloadAnimation(activeModel(),now);
  }

  function fire({
    now=performance.now(),raycaster,camera,remoteMesh,obstacles=[],
    triggerPressed=false,onShot,onDry,onReload,onHit
  }) {
    const cfg=WEAPONS[current], ammo=state[current];
    if (!cfg.automatic && !triggerPressed) return false;
    if (reloading || now-lastShot<cfg.rate) return false;

    if (ammo.mag<=0) {
      onDry?.();
      if (reload(now)) onReload?.();
      return false;
    }

    lastShot=now;
    ammo.mag--;
    recoil=cfg.recoil;

    const spreadMultiplier=aiming ? (current==="sniper"?.18:.45) : 1;
    const spreadX=(Math.random()-.5)*cfg.spread*spreadMultiplier;
    const spreadY=(Math.random()-.5)*cfg.spread*spreadMultiplier;
    raycaster.setFromCamera({x:spreadX,y:spreadY},camera);

    const from=camera.getWorldPosition(new THREE.Vector3());
    const direction=raycaster.ray.direction.clone().normalize();
    const targets=remoteMesh ? remoteMesh.children : [];
    const playerHits=targets.length ? raycaster.intersectObjects(targets,true) : [];
    const wallHits=obstacles.length ? raycaster.intersectObjects(obstacles,true) : [];

    const playerHit=playerHits[0]||null;
    const wallHit=wallHits[0]||null;
    const playerDistance=playerHit?.distance ?? Infinity;
    const wallDistance=wallHit?.distance ?? Infinity;
    const hitPlayer=playerDistance<wallDistance;
    const impact=hitPlayer
      ? playerHit.point.clone()
      : wallHit ? wallHit.point.clone()
      : from.clone().add(direction.clone().multiplyScalar(110));

    const muzzle=activeModel().userData.muzzle;
    const muzzleWorld=muzzle ? muzzle.getWorldPosition(new THREE.Vector3()) : from.clone();

    onShot?.({
      weapon:current,config:cfg,from:muzzleWorld,to:impact,
      hit:hitPlayer,impact,direction,aiming
    });

    if (hitPlayer) {
      const headshot=playerHit.object?.userData?.hitbox==="head";
      const damage=headshot?Math.round(cfg.damage*1.65):cfg.damage;
      onHit?.({
        damage,weapon:current,headshot,point:impact,
        normal:direction.clone().multiplyScalar(-1)
      });
    }

    if (current==="sniper") boltTimer=now+260;
    if (ammo.mag===0 && ammo.reserve>0) {
      if (reload(now)) onReload?.();
    }
    return true;
  }

  const ready=loadExternalAssets();

  return {
    equip,reload,tick,fire,setAim,
    loadExternalAssets:()=>ready,
    get externalReady(){return externalReady;},
    get aiming(){return aiming;},
    get current(){return current;},
    get reloading(){return reloading;},
    ammo(){return {...state[current]};},
    config(){return WEAPONS[current];}
  };
}
