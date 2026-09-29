import {createCharacterAnimator} from "../engine/character.js?v=20260929-1";
const THREE = window.THREE;

function material(color, roughness=.7, metalness=.05) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness});
}

function part(root, geometry, mat, name, position, rotation=[0,0,0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  return mesh;
}

export function createPlayerVisual() {
  const root = new THREE.Group();
  root.name = "TACTICAL_PLAYER";

  const armor = material(0x33404a,.62,.35);
  const armorDark = material(0x1a2026,.72,.42);
  const fabric = material(0x20282f,.9,.02);
  const skin = material(0xb97d60,.8,.02);
  const helmet = material(0x11171c,.54,.38);
  const visor = new THREE.MeshStandardMaterial({
    color:0x78a8bb, metalness:.45, roughness:.2, emissive:0x173441, emissiveIntensity:.5
  });
  const boot = material(0x0f1215,.72,.32);
  const accent = material(0xc28b3e,.5,.45);

  const chest = new THREE.Group();
  chest.name = "chest";
  chest.position.set(0,1.02,0);
  root.add(chest);
  part(chest,new THREE.BoxGeometry(.64, .9, .36),fabric,"torso",[0,0,0]);
  part(chest,new THREE.BoxGeometry(.72, .48, .42),armor,"plate",[0,.14,-.02]);
  part(chest,new THREE.BoxGeometry(.78, .18, .44),armorDark,"belt",[0,-.25,0]);
  part(chest,new THREE.BoxGeometry(.16,.34,.41),accent,"radio",[.37,.13,.0]);

  const head = new THREE.Group();
  head.name = "head";
  head.position.set(0,1.70,0);
  root.add(head);
  part(head,new THREE.SphereGeometry(.22,16,12),skin,"face",[0,-.02,.01]);
  part(head,new THREE.SphereGeometry(.24,16,10),helmet,"helmet",[0,.08,0]);
  part(head,new THREE.BoxGeometry(.34,.07,.04),visor,"visor",[0,.02,-.205]);

  for (const side of [-1,1]) {
    const sx = side < 0 ? "L" : "R";
    const arm = new THREE.Group();
    arm.name = side < 0 ? "leftarm" : "rightarm";
    arm.position.set(side*.43,1.22,0);
    root.add(arm);
    part(arm,new THREE.CapsuleGeometry(.11,.43,5,8),armorDark,"upperarm_"+sx,[0,-.22,0],[0,0,side*.08]);
    const fore = new THREE.Group();
    fore.name = side < 0 ? "lefthand" : "righthand";
    fore.position.set(0,-.52,-.02);
    arm.add(fore);
    part(fore,new THREE.CapsuleGeometry(.09,.36,5,8),fabric,"forearm_"+sx,[0,-.18,-.01]);
    part(fore,new THREE.SphereGeometry(.105,10,8),skin,"hand_"+sx,[0,-.40,-.05]);
    part(fore,new THREE.BoxGeometry(.16,.08,.18),armorDark,"glove_"+sx,[0,-.40,-.05]);
  }

  for (const side of [-1,1]) {
    const sx = side < 0 ? "L" : "R";
    const leg = new THREE.Group();
    leg.name = side < 0 ? "leftleg" : "rightleg";
    leg.position.set(side*.18,.63,0);
    root.add(leg);
    part(leg,new THREE.CapsuleGeometry(.13,.48,5,8),fabric,"thigh_"+sx,[0,-.22,0]);
    const shin = new THREE.Group();
    shin.name = "shin_"+sx;
    shin.position.set(0,-.55,0);
    leg.add(shin);
    part(shin,new THREE.CapsuleGeometry(.115,.43,5,8),armorDark,"shin_"+sx,[0,-.18,0]);
    part(shin,new THREE.BoxGeometry(.22,.12,.45),boot,"boot_"+sx,[0,-.43,-.11]);
  }

  const backpack = part(root,new THREE.BoxGeometry(.38,.6,.22),armorDark,"backpack",[0,1.0,.25]);
  backpack.rotation.x = -0.04;

  // Invisible gameplay hit zones.
  const bodyHit = new THREE.Mesh(
    new THREE.BoxGeometry(.70,1.32,.52),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  bodyHit.name = "BODY_HITBOX";
  bodyHit.position.set(0,.88,0);
  bodyHit.userData.hitbox = "body";

  const headHit = new THREE.Mesh(
    new THREE.SphereGeometry(.245,12,8),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  headHit.name = "HEAD_HITBOX";
  headHit.position.set(0,1.64,0);
  headHit.userData.hitbox = "head";
  root.add(bodyHit,headHit);

  const animator = createCharacterAnimator(root);
  let lastSpeed = 0;
  let lastAirborne = false;

  return {
    root,
    update(dt, moving, speed=0, airborne=false) {
      lastSpeed += (speed - lastSpeed) * Math.min(1,dt*10);
      lastAirborne = airborne;
      animator.update(dt,moving,lastSpeed,lastAirborne);
    }
  };
}

export function buildMapColliders(root) {
  const colliders = [];
  root?.userData?.colliders?.forEach(c => colliders.push(c));
  return colliders;
}

export function collectMapSolids(root) {
  const solids = [];
  root?.traverse?.(o => { if (o.isMesh) solids.push(o); });
  return solids;
}
