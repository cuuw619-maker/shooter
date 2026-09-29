const THREE=window.THREE;

const EXTERNALS={
  rifle:"https://raw.githubusercontent.com/solcloud/Counter-Strike/25a292ff1b9d8ac876f6a96fdbbd6712bbbba803/www/resources/model/m4.glb",
  pistol:"https://raw.githubusercontent.com/solcloud/Counter-Strike/25a292ff1b9d8ac876f6a96fdbbd6712bbbba803/www/resources/model/usp.glb",
  sniper:"https://raw.githubusercontent.com/solcloud/Counter-Strike/25a292ff1b9d8ac876f6a96fdbbd6712bbbba803/www/resources/model/awp.glb"
};

export const WEAPONS={
  rifle:{name:"M4 CARBINE",mag:30,reserve:120,damage:25,rate:91,reload:1650,spread:.014,recoil:.034,automatic:true,adsFov:54},
  pistol:{name:"USP SIDEARM",mag:12,reserve:60,damage:34,rate:230,reload:1100,spread:.009,recoil:.048,automatic:false,adsFov:49},
  sniper:{name:"AWP SNIPER",mag:5,reserve:25,damage:100,rate:1100,reload:2250,spread:.001,recoil:.155,automatic:false,adsFov:27}
};

function mat(color,metal=.3,roughness=.5,emissive=0x000000){
  return new THREE.MeshStandardMaterial({
    color,metalness:metal,roughness,emissive,
    emissiveIntensity:emissive?.55:0
  });
}

function addMuzzle(g,z){
  const muzzle=new THREE.Object3D();
  muzzle.position.z=z;
  g.add(muzzle);
  g.userData.muzzle=muzzle;
}

function addArmRig(root){
  const skin=mat(0xb57b5d,0,.86);
  const glove=mat(0x151a1f,.16,.7);
  const sleeve=mat(0x30383e,.24,.72);
  const armL=new THREE.Group();
  armL.name="view_arm_l";armL.position.set(-.16,-.18,.12);root.add(armL);
  const foreL=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.44,12),skin);
  foreL.rotation.z=.13;foreL.position.set(0,0,.12);foreL.castShadow=true;armL.add(foreL);
  const elbowL=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),skin);
  elbowL.position.set(0,.22,.12);elbowL.castShadow=true;armL.add(elbowL);
  const wristL=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),skin);
  wristL.position.set(0,-.22,.12);wristL.castShadow=true;armL.add(wristL);
  const gloveL=new THREE.Mesh(new THREE.BoxGeometry(.12,.13,.18),glove);
  gloveL.position.set(-.01,-.03,-.12);gloveL.rotation.x=-.25;armL.add(gloveL);

  const armR=new THREE.Group();
  armR.name="view_arm_r";armR.position.set(.16,-.18,.12);root.add(armR);
  const foreR=foreL.clone();foreR.material=sleeve;foreR.rotation.z=-.13;armR.add(foreR);
  const gloveR=gloveL.clone();gloveR.position.x=.01;gloveR.material=glove;armR.add(gloveR);
  return {armL,armR};
}

function buildRifle(){
  const g=new THREE.Group();
  const dark=mat(0x151a1e,.62,.34),body=mat(0x293138,.5,.42),polymer=mat(0x22282c,.12,.75),accent=mat(0x8c633d,.42,.42);
  const receiver=new THREE.Mesh(new THREE.BoxGeometry(.28,.20,.74),body);receiver.position.z=-.12;
  const upper=new THREE.Mesh(new THREE.BoxGeometry(.22,.08,.66),dark);upper.position.set(0,.13,-.20);
  const handguard=new THREE.Mesh(new THREE.BoxGeometry(.21,.17,.55),polymer);handguard.position.set(0,.01,-.74);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.028,.036,.72,16),dark);barrel.rotation.x=Math.PI/2;barrel.position.z=-1.13;
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.05,.042,.13,16),dark);muzzle.rotation.x=Math.PI/2;muzzle.position.z=-1.56;
  const stock=new THREE.Mesh(new THREE.BoxGeometry(.21,.17,.42),accent);stock.position.z=.46;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.12,.30,.15),polymer);grip.position.set(0,-.20,.08);grip.rotation.x=-.20;
  const mag=new THREE.Mesh(new THREE.BoxGeometry(.14,.30,.19),polymer);mag.position.set(0,-.18,-.05);mag.rotation.x=-.12;
  const opticBase=new THREE.Mesh(new THREE.BoxGeometry(.09,.06,.30),dark);opticBase.position.set(0,.19,-.32);
  const optic=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,.38,14),dark);optic.rotation.x=Math.PI/2;optic.position.set(0,.245,-.42);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.018,14),new THREE.MeshStandardMaterial({color:0x2d6175,metalness:.5,roughness:.16,emissive:0x0b2631,emissiveIntensity:.75}));
  lens.rotation.x=Math.PI/2;lens.position.set(0,.245,-.62);
  const bolt=new THREE.Mesh(new THREE.BoxGeometry(.07,.06,.24),dark);bolt.position.set(0,.10,.17);
  g.add(receiver,upper,handguard,barrel,muzzle,stock,grip,mag,opticBase,optic,lens,bolt);
  g.userData.reloadParts=[{mesh:mag,from:mag.position.clone(),to:mag.position.clone().add(new THREE.Vector3(0,-.18,.02))}];
  g.userData.bolt=bolt;g.userData.boltBase=bolt.position.clone();
  addMuzzle(g,-1.63);
  return g;
}

function buildPistol(){
  const g=new THREE.Group();
  const dark=mat(0x171c20,.65,.35),frame=mat(0x283036,.16,.72),metal=mat(0x525b63,.70,.32),accent=mat(0x94643a,.28,.52);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.21,.19,.46),frame);body.position.z=-.11;
  const slide=new THREE.Mesh(new THREE.BoxGeometry(.22,.105,.40),metal);slide.position.set(0,.10,-.14);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.023,.024,.32,12),dark);barrel.rotation.x=Math.PI/2;barrel.position.z=-.54;
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.07,12),dark);muzzle.rotation.x=Math.PI/2;muzzle.position.z=-.72;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.145,.31,.16),accent);grip.position.set(0,-.20,.06);grip.rotation.x=-.16;
  const mag=new THREE.Mesh(new THREE.BoxGeometry(.11,.29,.13),dark);mag.position.set(0,-.18,.04);
  const sf=new THREE.Mesh(new THREE.BoxGeometry(.045,.05,.06),dark);sf.position.set(0,.18,-.31);
  const sr=sf.clone();sr.position.z=-.03;
  g.add(body,slide,barrel,muzzle,grip,mag,sf,sr);
  g.userData.reloadParts=[{mesh:mag,from:mag.position.clone(),to:mag.position.clone().add(new THREE.Vector3(0,-.22,.03))}];
  g.userData.slide=slide;g.userData.slideBase=slide.position.clone();
  addMuzzle(g,-.76);return g;
}

function buildSniperFallback(){
  const g=new THREE.Group();
  const body=mat(0x171c22,.52,.44),metal=mat(0x222a30,.78,.28),wood=mat(0x5b3a25,.04,.78);
  const glass=new THREE.MeshStandardMaterial({color:0x2c6177,metalness:.35,roughness:.14,emissive:0x0b3448,emissiveIntensity:.9});
  const receiver=new THREE.Mesh(new THREE.BoxGeometry(.24,.21,1.0),body);receiver.position.z=-.14;
  const stock=new THREE.Mesh(new THREE.BoxGeometry(.22,.18,.5),wood);stock.position.z=.58;
  const grip=new THREE.Mesh(new THREE.BoxGeometry(.12,.28,.15),body);grip.position.set(0,-.20,.13);grip.rotation.x=-.18;
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.037,.044,.92,16),metal);barrel.rotation.x=Math.PI/2;barrel.position.z=-1.25;
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.13,14),metal);muzzle.rotation.x=Math.PI/2;muzzle.position.z=-1.77;
  const scope=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.54,16),metal);scope.rotation.x=Math.PI/2;scope.position.set(0,.20,-.50);
  const lens=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.02,16),glass);lens.rotation.x=Math.PI/2;lens.position.set(0,.20,-.79);
  const mag=new THREE.Mesh(new THREE.BoxGeometry(.12,.22,.16),body);mag.position.set(0,-.17,-.02);
  const bolt=new THREE.Mesh(new THREE.BoxGeometry(.065,.055,.22),metal);bolt.position.set(.17,.08,.10);
  g.add(receiver,stock,grip,barrel,muzzle,scope,lens,mag,bolt);
  g.userData.reloadParts=[{mesh:mag,from:mag.position.clone(),to:mag.position.clone().add(new THREE.Vector3(0,-.18,.04))}];
  g.userData.bolt=bolt;g.userData.boltBase=bolt.position.clone();addMuzzle(g,-1.84);return g;
}

function normalizeExternalWeapon(model,targetLength=1.75){
  model.traverse(o=>{
    if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}
  });
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const longest=Math.max(size.x,size.y,size.z,.001);
  const scale=targetLength/longest;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const box2=new THREE.Box3().setFromObject(model);
  const center=box2.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const axis=size.x>=size.y&&size.x>=size.z?"x":size.y>=size.z?"y":"z";
  if(axis==="x") model.rotation.y=-Math.PI/2;
  if(axis==="y") model.rotation.x=-Math.PI/2;
  return model;
}

function addExternalMuzzle(model){
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const muzzle=new THREE.Object3D();
  muzzle.position.set(0,0,-Math.max(size.x,size.y,size.z)*.48);
  model.add(muzzle);
  model.userData.muzzle=muzzle;
}

export function createWeaponSystem(camera){
  const root=new THREE.Group();
  root.position.set(.42,-.34,-.72);
  camera.add(root);
  const armRig=addArmRig(root);
  const state={};
  for(const id of Object.keys(WEAPONS)) state[id]={mag:WEAPONS[id].mag,reserve:WEAPONS[id].reserve};

  const models={rifle:buildRifle(),pistol:buildPistol(),sniper:buildSniperFallback()};
  Object.values(models).forEach(m=>{m.visible=false;root.add(m);});
  models.rifle.visible=true;

  const external={rifle:null,pistol:null,sniper:null};
  const externalReady={rifle:false,pistol:false,sniper:false};
  let current="rifle",lastShot=-Infinity,reloading=false,reloadTimer=0,equipStarted=0,recoil=0,aiming=false,boltTimer=0;
  let equipFrom=root.position.clone(),equipBlend=1;

  function activeModel(){return external[current]||models[current];}
  function switchVisible(){
    Object.values(models).forEach(m=>m.visible=false);
    Object.values(external).forEach(m=>{if(m)m.visible=false;});
    activeModel().visible=true;
  }

  async function loadExternal(id){
    if(!THREE.GLTFLoader||external[id]) return Boolean(external[id]);
    return new Promise(resolve=>{
      try{
        const loader=new THREE.GLTFLoader();
        loader.setCrossOrigin?.("anonymous");
        loader.load(EXTERNALS[id],gltf=>{
          const model=normalizeExternalWeapon(gltf.scene);
          model.name="EXTERNAL_"+id.toUpperCase()+"_PUBLIC_DOMAIN";
          addExternalMuzzle(model);
          root.add(model);
          external[id]=model;
          externalReady[id]=true;
          switchVisible();
          resolve(true);
        },undefined,()=>resolve(false));
      }catch(_){resolve(false);}
    });
  }

  const readyPromise=Promise.all(Object.keys(EXTERNALS).map(loadExternal));

  function equip(id){
    if(!WEAPONS[id]||id===current||reloading)return false;
    equipFrom.copy(root.position);
    current=id;aiming=false;recoil=0;equipStarted=performance.now();equipBlend=0;
    switchVisible();
    return true;
  }

  function setAim(value){if(!reloading)aiming=Boolean(value);}

  function reload(now=performance.now()){
    if(reloading)return false;
    const cfg=WEAPONS[current],ammo=state[current];
    if(ammo.mag>=cfg.mag||ammo.reserve<=0)return false;
    reloading=true;aiming=false;reloadTimer=now+cfg.reload;return true;
  }

  function applyReloadAnimation(model,now){
    const cfg=WEAPONS[current],p=Math.max(0,Math.min(1,1-Math.max(0,reloadTimer-now)/cfg.reload));
    const part=model.userData.reloadParts?.[0];
    if(part){
      const down=Math.sin(Math.min(1,p*1.75)*Math.PI)*.22;
      part.mesh.position.copy(part.from);part.mesh.position.y-=down;
      part.mesh.rotation.x=-Math.sin(Math.min(1,p*1.4)*Math.PI)*.32;
    }else if(model){
      model.rotation.z=Math.sin(p*Math.PI)*.08;
      model.position.y=-Math.sin(p*Math.PI)*.035;
    }
    if(model.userData.slide&&model.userData.slideBase){
      model.userData.slide.position.copy(model.userData.slideBase);
      model.userData.slide.position.z+=Math.sin(p*Math.PI)*.13;
    }
    if(model.userData.bolt&&model.userData.boltBase){
      model.userData.bolt.position.copy(model.userData.boltBase);
      model.userData.bolt.position.z+=Math.sin(p*Math.PI)*.18;
    }
  }

  function resetReloadPose(model){
    const part=model.userData.reloadParts?.[0];
    if(part){part.mesh.position.copy(part.from);part.mesh.rotation.set(0,0,0);}
    if(model.userData.slide&&model.userData.slideBase)model.userData.slide.position.copy(model.userData.slideBase);
    if(model.userData.bolt&&model.userData.boltBase)model.userData.bolt.position.copy(model.userData.boltBase);
    if(model&&!model.userData.reloadParts){model.rotation.z=0;model.position.y=0;}
  }

  function tick(now=performance.now(),events={}){
    if(reloading&&now>=reloadTimer){
      const cfg=WEAPONS[current],ammo=state[current],need=cfg.mag-ammo.mag,take=Math.min(need,ammo.reserve);
      ammo.mag+=take;ammo.reserve-=take;reloading=false;reloadTimer=0;
      resetReloadPose(activeModel());events.onReloadComplete?.(current);
    }
    if(boltTimer&&now>=boltTimer){boltTimer=0;events.onBolt?.();}
    recoil*=.82;equipBlend=Math.min(1,equipBlend+.08);
    const ease=1-(1-equipBlend)*(1-equipBlend);
    const idle=Math.sin(now*.0042)*.003,sx=Math.sin(now*.0026)*.004,sy=Math.cos(now*.0031)*.003,run=Math.abs(Math.cos(now*.008))*.004;
    const targetX=aiming?-.08:.42,targetY=aiming?-.29:-.34,targetZ=aiming?-.90:-.72;
    root.position.lerpVectors(equipFrom,new THREE.Vector3(targetX+idle+sx+run,targetY+sy,targetZ+recoil),ease);
    root.rotation.x=recoil*.65+Math.sin(now*.002)*.004;
    root.rotation.y=sx*.7;
    root.rotation.z=Math.sin(now*.0018)*.004;
    armRig.armL.rotation.x=aiming?-.08:0;
    armRig.armR.rotation.x=aiming?-.08:0;
    if(reloading)applyReloadAnimation(activeModel(),now);
  }

  function fire({now=performance.now(),raycaster,camera,remoteMesh,obstacles=[],triggerPressed=false,onShot,onDry,onReload,onHit}){
    const cfg=WEAPONS[current],ammo=state[current];
    if(!cfg.automatic&&!triggerPressed)return false;
    if(reloading||now-lastShot<cfg.rate)return false;
    if(ammo.mag<=0){
      onDry?.();
      if(reload(now))onReload?.();
      return false;
    }

    lastShot=now;ammo.mag--;recoil=cfg.recoil;
    const spreadMultiplier=aiming?(current==="sniper"?.16:.45):1;
    const spreadX=(Math.random()-.5)*cfg.spread*spreadMultiplier;
    const spreadY=(Math.random()-.5)*cfg.spread*spreadMultiplier;
    raycaster.setFromCamera({x:spreadX,y:spreadY},camera);

    const from=camera.getWorldPosition(new THREE.Vector3());
    const direction=raycaster.ray.direction.clone().normalize();
    const targets=remoteMesh?.userData?.hitTargets||remoteMesh?.children||[];
    const playerHits=targets.length?raycaster.intersectObjects(targets,true):[];
    const wallHits=obstacles.length?raycaster.intersectObjects(obstacles,true):[];
    const playerHit=playerHits[0]||null,wallHit=wallHits[0]||null;
    const playerDistance=playerHit?.distance??Infinity,wallDistance=wallHit?.distance??Infinity;
    const hitPlayer=playerDistance<wallDistance;
    const impact=hitPlayer?playerHit.point.clone():wallHit?wallHit.point.clone():from.clone().add(direction.clone().multiplyScalar(110));
    const muzzle=activeModel().userData.muzzle;
    const muzzleWorld=muzzle?muzzle.getWorldPosition(new THREE.Vector3()):from.clone();

    onShot?.({weapon:current,config:cfg,from:muzzleWorld,to:impact,hit:hitPlayer,impact,direction,aiming});
    if(hitPlayer){
      const headshot=playerHit.object?.userData?.hitbox==="head";
      const damage=headshot?Math.round(cfg.damage*1.65):cfg.damage;
      onHit?.({damage,weapon:current,headshot,point:impact,normal:direction.clone().multiplyScalar(-1)});
    }
    if(current==="sniper")boltTimer=now+260;
    if(ammo.mag===0&&ammo.reserve>0){if(reload(now))onReload?.();}
    return true;
  }

  return {
    equip,reload,tick,fire,setAim,
    loadExternalAssets:()=>readyPromise.then(results=>results.some(Boolean)),
    get externalReady(){return {...externalReady};},
    get aiming(){return aiming;},
    get current(){return current;},
    get reloading(){return reloading;},
    ammo(){return {...state[current]};},
    config(){return WEAPONS[current];}
  };
}
