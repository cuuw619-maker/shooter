import {loadAssetGLTF} from "./asset-loader.js?v=20260929-1";
import {createCharacterAnimator} from "../engine/character.js?v=20260929-2";
const THREE=window.THREE;

function material(color,roughness=.7,metalness=.05){
  return new THREE.MeshStandardMaterial({color,roughness,metalness});
}

function part(root,geometry,mat,name,position,rotation=[0,0,0]){
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.name=name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  root.add(mesh);
  return mesh;
}

function buildFallback(root){
  const armor=material(0x33414b,.55,.40);
  const armorDark=material(0x151b21,.70,.50);
  const fabric=material(0x20282e,.92,.02);
  const skin=material(0xb97b5d,.84,.02);
  const helmet=material(0x0e1419,.52,.46);
  const visor=new THREE.MeshStandardMaterial({
    color:0x6fc3da,metalness:.46,roughness:.18,
    emissive:0x113b47,emissiveIntensity:.65
  });
  const boot=material(0x0b0f12,.67,.44);
  const accent=material(0xb98a43,.48,.48);

  const chest=new THREE.Group();
  chest.name="chest"; chest.position.set(0,1.04,0); root.add(chest);
  part(chest,new THREE.BoxGeometry(.64,.92,.36),fabric,"torso",[0,0,0]);
  part(chest,new THREE.BoxGeometry(.75,.48,.43),armor,"plate",[0,.14,-.03]);
  part(chest,new THREE.BoxGeometry(.80,.17,.44),armorDark,"belt",[0,-.27,0]);
  part(chest,new THREE.BoxGeometry(.13,.35,.40),accent,"radio",[.38,.12,0]);
  part(chest,new THREE.BoxGeometry(.16,.20,.30),armorDark,"front_utility",[.42,-.08,-.04]);

  const head=new THREE.Group();
  head.name="head"; head.position.set(0,1.72,0); root.add(head);
  part(head,new THREE.SphereGeometry(.215,16,12),skin,"face",[0,-.02,.01]);
  part(head,new THREE.SphereGeometry(.25,18,12),helmet,"helmet",[0,.08,0]);
  part(head,new THREE.BoxGeometry(.35,.072,.045),visor,"visor",[0,.01,-.21]);

  for(const side of [-1,1]){
    const sx=side<0?"L":"R";
    const arm=new THREE.Group();
    arm.name=side<0?"leftarm":"rightarm";
    arm.position.set(side*.44,1.22,0);
    root.add(arm);
    part(arm,new THREE.CylinderGeometry(.11,.11,.55,10),armorDark,"upperarm_"+sx,[0,-.22,0],[0,0,side*.08]);
    const fore=new THREE.Group();
    fore.name=side<0?"lefthand":"righthand";
    fore.position.set(0,-.52,-.02);
    arm.add(fore);
    part(fore,new THREE.CylinderGeometry(.09,.09,.47,10),fabric,"forearm_"+sx,[0,-.18,-.01]);
    part(fore,new THREE.SphereGeometry(.10,10,8),skin,"hand_"+sx,[0,-.40,-.05]);
    part(fore,new THREE.BoxGeometry(.16,.08,.18),armorDark,"glove_"+sx,[0,-.40,-.05]);
  }

  for(const side of [-1,1]){
    const sx=side<0?"L":"R";
    const leg=new THREE.Group();
    leg.name=side<0?"leftleg":"rightleg";
    leg.position.set(side*.18,.63,0);
    root.add(leg);
    part(leg,new THREE.CylinderGeometry(.13,.13,.60,10),fabric,"thigh_"+sx,[0,-.22,0]);
    const shin=new THREE.Group();
    shin.name="shin_"+sx; shin.position.set(0,-.55,0); leg.add(shin);
    part(shin,new THREE.CylinderGeometry(.115,.115,.55,10),armorDark,"shin_"+sx,[0,-.18,0]);
    part(shin,new THREE.BoxGeometry(.23,.12,.45),boot,"boot_"+sx,[0,-.43,-.11]);
  }

  const backpack=part(root,new THREE.BoxGeometry(.39,.62,.22),armorDark,"backpack",[0,1.0,.26]);
  backpack.rotation.x=-.04;
}

function normalizeCharacter(model){
  model.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true;
      o.receiveShadow=true;
      if(o.material){
        const materials=Array.isArray(o.material)?o.material:[o.material];
        for(const m of materials){
          if(m.color){
            const c=m.color.clone();
            const lum=.2126*c.r+.7152*c.g+.0722*c.b;
            const target=lum>.70?0x8a949e:lum>.42?0x404a53:0x20282e;
            m.color.setHex(target);
            m.roughness=Math.min(.9,Math.max(.35,m.roughness??.7));
          }
        }
      }
    }
  });
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const targetHeight=2.05;
  const scale=targetHeight/Math.max(size.y,.001);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const box2=new THREE.Box3().setFromObject(model);
  model.position.y-=box2.min.y;
  return model;
}

function attachHitboxes(root){
  const bodyHit=new THREE.Mesh(
    new THREE.BoxGeometry(.70,1.30,.52),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  bodyHit.name="BODY_HITBOX";
  bodyHit.position.set(0,.84,0);
  bodyHit.userData.hitbox="body";

  const headHit=new THREE.Mesh(
    new THREE.SphereGeometry(.25,12,8),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  headHit.name="HEAD_HITBOX";
  headHit.position.set(0,1.62,0);
  headHit.userData.hitbox="head";
  root.add(bodyHit,headHit);
  root.userData.hitTargets=[bodyHit,headHit];
}

export function createPlayerVisual(){
  const root=new THREE.Group();
  root.name="TACTICAL_REMOTE_PLAYER";
  const fallback=new THREE.Group();
  fallback.name="PROCEDURAL_FALLBACK";
  root.add(fallback);
  buildFallback(fallback);
  attachHitboxes(root);

  const proceduralAnimator=createCharacterAnimator(fallback);
  let mixer=null;
  let actions={};
  let currentAction=null;
  let lastSpeed=0;
  let externalReady=false;
  let disposed=false;

  const setExternalAction=(name,crossFade=.20)=>{
    if(!mixer||!actions[name]) return;
    const next=actions[name];
    const isOnce=name==="jump"||name==="death";
    if(currentAction===next){
      if(name==="walk"||name==="run"){
        next.setEffectiveTimeScale(name==="run"?Math.max(.8,Math.min(1.55,lastSpeed/5.6)):Math.max(.82,Math.min(1.35,lastSpeed/4.2)));
      }
      return;
    }
    next.reset();
    next.enabled=true;
    next.clampWhenFinished=isOnce;
    next.setLoop(isOnce?THREE.LoopOnce:THREE.LoopRepeat,isOnce?1:Infinity);
    next.setEffectiveTimeScale(name==="run"?Math.max(.8,Math.min(1.55,lastSpeed/5.6)):1);
    next.play();
    if(currentAction) currentAction.fadeOut(crossFade);
    next.fadeIn(crossFade);
    currentAction=next;
  };

  if(THREE.GLTFLoader){
    loadAssetGLTF("character").then(gltf=>{
        if(disposed) return;
        const model=normalizeCharacter(gltf.scene);
        model.name="CC0_ANIMATED_HUMAN";
        fallback.visible=false;
        root.add(model);
        mixer=new THREE.AnimationMixer(model);
        for(const clip of (gltf.animations||[])){
          const key=(clip.name||"").toLowerCase().replace(/[^a-z0-9]+/g," ");
          if(/idle|stand/.test(key)) actions.idle=mixer.clipAction(clip);
          else if(/walk|walking/.test(key)) actions.walk=mixer.clipAction(clip);
          else if(/run|running|sprint/.test(key)) actions.run=mixer.clipAction(clip);
          else if(/jump|fall|air/.test(key)) actions.jump=mixer.clipAction(clip);
          else if(/death|die/.test(key)) actions.death=mixer.clipAction(clip);
        }
        if(!actions.idle && gltf.animations?.[0]) actions.idle=mixer.clipAction(gltf.animations[0]);
        setExternalAction("idle",0);
        externalReady=true;
    }).catch(()=>{});
  }

  return {
    root,
    get externalReady(){return externalReady;},
    update(dt,moving,speed=0,airborne=false){
      lastSpeed += (speed-lastSpeed)*Math.min(1,dt*10);
      if(mixer){
        let desired="idle";
        if(airborne && actions.jump) desired="jump";
        else if(lastSpeed>4.5 && actions.run) desired="run";
        else if(moving && actions.walk) desired="walk";
        setExternalAction(desired);
        mixer.update(Math.min(dt,.05));
      }else{
        proceduralAnimator.update(Math.min(dt,.05),moving,lastSpeed,airborne);
      }
    },
    dispose(){
      disposed=true;
      if(mixer) mixer.stopAllAction();
    }
  };
}

export function buildMapColliders(root){
  const colliders=[];
  root?.userData?.colliders?.forEach(c=>colliders.push(c));
  return colliders;
}

export function collectMapSolids(root){
  const solids=[];
  root?.traverse?.(o=>{if(o.isMesh)solids.push(o);});
  return solids;
}
