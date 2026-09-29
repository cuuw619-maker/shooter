const THREE=window.THREE;

const EXTERNALS={
  rifle:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/mp5a5_reloadable.glb",
  pistol:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/p226_reloadable.glb",
  sniper:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/m24_reloadable.glb"
};

export const WEAPONS={
  rifle:{name:"MP5A5",mag:30,reserve:120,damage:25,rate:91,reload:1550,spread:.010,recoil:.030,automatic:true,adsFov:54},
  pistol:{name:"P226",mag:15,reserve:75,damage:34,rate:210,reload:1050,spread:.007,recoil:.040,automatic:false,adsFov:49},
  sniper:{name:"M24",mag:5,reserve:25,damage:100,rate:1100,reload:2150,spread:.0009,recoil:.135,automatic:false,adsFov:27}
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
  g.userData.reloadParts=[{role:"mag",mesh:mag,basePosition:mag.position.clone(),baseRotation:mag.rotation.clone()}];
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
  g.userData.reloadParts=[{role:"mag",mesh:mag,basePosition:mag.position.clone(),baseRotation:mag.rotation.clone()}];
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
  g.userData.reloadParts=[{role:"mag",mesh:mag,basePosition:mag.position.clone(),baseRotation:mag.rotation.clone()}];
  g.userData.bolt=bolt;g.userData.boltBase=bolt.position.clone();addMuzzle(g,-1.84);return g;
}

function normalizeExternalWeapon(model,targetLength=1.65){
  model.traverse(o=>{
    if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true;}
  });
  model.scale.setScalar(1);
  model.rotation.set(0,0,0);
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const longest=Math.max(size.x,size.y,size.z,.001);
  model.scale.setScalar(targetLength/longest);
  const axis=size.x>=size.y&&size.x>=size.z?"x":size.y>=size.z?"y":"z";
  // The Quaternius M4 is authored along +X; +PI/2 maps that barrel onto Three.js -Z camera-forward.
  if(axis==="x") model.rotation.y=Math.PI/2;
  else if(axis==="y") model.rotation.x=-Math.PI/2;
  model.updateMatrixWorld(true);
  const box2=new THREE.Box3().setFromObject(model);
  const center=box2.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y-=.01;
  return model;
}

function addExternalMuzzle(model){
  let socket=null;
  model.traverse(node=>{
    const key=(node.name||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    if(!socket && /muzzlesocket|muzzle/.test(key)) socket=node;
  });
  if(socket){
    model.userData.muzzle=socket;
    return socket;
  }
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const muzzle=new THREE.Object3D();
  muzzle.position.set(0,0,-Math.max(size.x,size.y,size.z)*.54);
  muzzle.name="runtime_muzzle";
  model.add(muzzle);
  model.userData.muzzle=muzzle;
  return muzzle;
}

function prepareReloadParts(model){
  const parts=[];
  model.traverse(node=>{
    const key=(node.name||"").toLowerCase().replace(/[^a-z0-9]/g,"");
    if(!key)return;
    if(/^(magazine|magazinegeometry|mag)$/.test(key) && !parts.some(p=>p.role==="mag")){
      parts.push({role:"mag",mesh:node,basePosition:node.position.clone(),baseRotation:node.rotation.clone()});
    }else if(/bolt|slide|charginghandle|charging/.test(key) && !parts.some(p=>p.role==="bolt")){
      parts.push({role:"bolt",mesh:node,basePosition:node.position.clone(),baseRotation:node.rotation.clone()});
    }else if(/trigger/.test(key) && !parts.some(p=>p.role==="trigger")){
      parts.push({role:"trigger",mesh:node,basePosition:node.position.clone(),baseRotation:node.rotation.clone()});
    }
  });
  model.userData.reloadParts=parts;
  model.userData.reloadBasePosition=model.position.clone();
  model.userData.reloadBaseRotation=model.rotation.clone();
  return parts;
}


export function createWeaponSystem(camera){
  const root=new THREE.Group();
  root.position.set(.34,-.30,-.88);
  camera.add(root);
  const state={};
  for(const id of Object.keys(WEAPONS)) state[id]={mag:WEAPONS[id].mag,reserve:WEAPONS[id].reserve};

  const models={rifle:buildRifle(),pistol:buildPistol(),sniper:buildSniperFallback()};
  Object.values(models).forEach(m=>{
    m.visible=false;
    m.userData.reloadBasePosition=m.position.clone();
    m.userData.reloadBaseRotation=m.rotation.clone();
    root.add(m);
  });
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
          const targetLength=id==="rifle"?1.55:id==="pistol"?.72:1.74;
          const model=normalizeExternalWeapon(gltf.scene,targetLength);
          model.name="EXTERNAL_"+id.toUpperCase()+"_PUBLIC_DOMAIN";
          model.userData.reloadBasePosition=model.position.clone();
          model.userData.reloadBaseRotation=model.rotation.clone();
          addExternalMuzzle(model);
          prepareReloadParts(model);
          root.add(model);
          external[id]=model;
          externalReady[id]=true;
          const fallback=models[id];
          if(fallback){
            fallback.visible=false;
            root.remove(fallback);
          }
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
    reloading=true;aiming=false;reloadTimer=now+cfg.reload;
    return true;
  }

  function applyReloadAnimation(model,now){
    const cfg=WEAPONS[current];
    const p=Math.max(0,Math.min(1,1-Math.max(0,reloadTimer-now)/cfg.reload));
    const basePos=model.userData.reloadBasePosition||model.position.clone();
    const baseRot=model.userData.reloadBaseRotation||model.rotation.clone();
    const parts=model.userData.reloadParts||[];

    const mag=parts.find(p=>p.role==="mag");
    const bolt=parts.find(p=>p.role==="bolt");
    const trigger=parts.find(p=>p.role==="trigger");

    const easeIn=t=>t*t*(3-2*t);
    const magOut=easeIn(Math.min(1,p/.24));
    const magIn=easeIn(Math.max(0,Math.min(1,(p-.52)/.30)));
    const chamber=(p<.70)?Math.sin(Math.min(1,p/.70)*Math.PI):Math.sin(Math.max(0,(p-.70)/.30)*Math.PI);

    model.position.copy(basePos);
    model.rotation.copy(baseRot);

    // Lower and cant the weapon so the reload action reads as a physical manipulation.
    const inspect=Math.sin(Math.PI*Math.min(1,p/.30));
    model.position.y-=inspect*.11;
    model.position.x+=inspect*.025;
    model.rotation.x+=inspect*.24;
    model.rotation.z+=inspect*.10;

    if(mag){
      mag.mesh.position.copy(mag.basePosition);
      mag.mesh.rotation.copy(mag.baseRotation);
      if(p<.30){
        mag.mesh.position.y-=magOut*.20;
        mag.mesh.position.z+=magOut*.045;
        mag.mesh.rotation.x-=magOut*.18;
      }else if(p<.55){
        mag.mesh.position.y-=.20;
        mag.mesh.position.z+=.045;
      }else{
        mag.mesh.position.y-=.20*(1-magIn);
        mag.mesh.position.z+=.045*(1-magIn);
        mag.mesh.rotation.x-=.18*(1-magIn);
      }
    }else if(model.userData.reloadParts?.length===0){
      model.position.y-=Math.sin(Math.PI*p)*.045;
    }

    if(bolt){
      bolt.mesh.position.copy(bolt.basePosition);
      bolt.mesh.rotation.copy(bolt.baseRotation);
      bolt.mesh.position.z+=chamber*.18;
      bolt.mesh.rotation.y+=chamber*.20;
    }

    if(trigger){
      trigger.mesh.position.copy(trigger.basePosition);
      trigger.mesh.rotation.copy(trigger.baseRotation);
      trigger.mesh.rotation.x+=Math.sin(Math.PI*p)*.12;
    }
  }

  function resetReloadPose(model){
    for(const part of model.userData.reloadParts||[]){
      part.mesh.position.copy(part.basePosition);
      part.mesh.rotation.copy(part.baseRotation);
    }
    if(model.userData.reloadBasePosition)model.position.copy(model.userData.reloadBasePosition);
    if(model.userData.reloadBaseRotation)model.rotation.copy(model.userData.reloadBaseRotation);
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

    lastShot=now;
    ammo.mag--;
    recoil=cfg.recoil;

    // Generate spread around the crosshair, then launch the actual projectile line from the weapon muzzle.
    const radius=Math.sqrt(Math.random())*(aiming?(current==="sniper"?.16:.34):1);
    const theta=Math.random()*Math.PI*2;
    const spreadX=Math.cos(theta)*cfg.spread*radius;
    const spreadY=Math.sin(theta)*cfg.spread*radius;
    raycaster.setFromCamera({x:spreadX,y:spreadY},camera);

    const muzzle=activeModel().userData.muzzle;
    const muzzleWorld=muzzle?muzzle.getWorldPosition(new THREE.Vector3()):camera.getWorldPosition(new THREE.Vector3());
    const target=camera.getWorldPosition(new THREE.Vector3()).add(raycaster.ray.direction.clone().multiplyScalar(110));
    const direction=target.clone().sub(muzzleWorld).normalize();

    raycaster.ray.origin.copy(muzzleWorld);
    raycaster.ray.direction.copy(direction);

    const targets=remoteMesh?.userData?.hitTargets||remoteMesh?.children||[];
    const playerHits=targets.length?raycaster.intersectObjects(targets,true):[];
    const wallHits=obstacles.length?raycaster.intersectObjects(obstacles,true):[];
    const playerHit=playerHits[0]||null,wallHit=wallHits[0]||null;
    const playerDistance=playerHit?.distance??Infinity,wallDistance=wallHit?.distance??Infinity;
    const hitPlayer=playerDistance<wallDistance;
    const impact=hitPlayer?playerHit.point.clone():wallHit?wallHit.point.clone():muzzleWorld.clone().add(direction.clone().multiplyScalar(110));

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
