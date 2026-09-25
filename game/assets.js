import {createCharacterAnimator} from "../engine/character.js?v=20260925-3";
import {createColliderFromMesh} from "../engine/collision.js?v=20260925-2";
const THREE = window.THREE;

const MAP_URL = new URL("../sendstone_new(1).glb?v=20260925-4", import.meta.url).href;
const PLAYER_URL = new URL("../archie__standoff_2.glb?v=20260925-4", import.meta.url).href;

let mapPromise = null;
let playerPromise = null;

function loader() {
  if (!THREE?.GLTFLoader) {
    throw new Error("GLTFLoader is not available");
  }
  return new THREE.GLTFLoader();
}

function load(url, label) {
  return new Promise((resolve, reject) => {
    try {
      const gltfLoader = loader();
      gltfLoader.setCrossOrigin?.("anonymous");
      gltfLoader.load(
        url,
        resolve,
        event => {
          window.dispatchEvent(new CustomEvent("assetprogress", {
            detail: {label, loaded: event.loaded || 0, total: event.total || 0}
          }));
        },
        error => {
          const reason = error?.message || "неизвестная ошибка загрузки";
          reject(new Error(label + ": " + reason + " [" + url + "]"));
        }
      );
    } catch (error) {
      reject(new Error(label + ": " + (error?.message || String(error)) + " [" + url + "]"));
    }
  });
}

function normalizeModel(root, targetHeight = 1.8) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const height = Math.max(size.y, 0.001);
  const scale = targetHeight / height;
  root.scale.multiplyScalar(scale);
  root.position.x -= center.x * scale;
  root.position.y -= box.min.y * scale;
  root.position.z -= center.z * scale;
  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return root;
}

export function loadMapAsset() {
  if (!mapPromise) mapPromise = load(MAP_URL, "SENDSTONE");
  return mapPromise;
}

export function loadPlayerAsset() {
  if (!playerPromise) playerPromise = load(PLAYER_URL, "ARCHIE");
  return playerPromise;
}

export function normalizeMap(root, targetSize = 74) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const horizontal = Math.max(size.x, size.z, 0.001);
  const scale = targetSize / horizontal;
  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(root);
  const finalCenter = finalBox.getCenter(new THREE.Vector3());
  root.position.x -= finalCenter.x;
  root.position.z -= finalCenter.z;
  root.position.y -= finalBox.min.y;
  root.traverse(o => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return root;
}

export function createPlayerVisual(template) {
  const root = template.scene.clone(true);
  normalizeModel(root, 1.8);
  const mixers = template.animations?.length ? new THREE.AnimationMixer(root) : null;
  const clips = template.animations || [];
  const named = clips.reduce((map, clip) => {
    map[clip.name.toLowerCase()] = clip;
    return map;
  }, {});
  const findClip = words => {
    for (const word of words) {
      const key = Object.keys(named).find(name => name.includes(word));
      if (key) return named[key];
    }
    return clips[0] || null;
  };
  const idle = findClip(["idle","stand"]);
  const walk = findClip(["walk","run","move"]);
  const bodyHit = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 1.24, 0.48),
    new THREE.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false})
  );
  bodyHit.position.set(0,0.78,0);
  bodyHit.userData.hitbox = "body";
  const headHit = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 12, 8),
    new THREE.MeshBasicMaterial({transparent:true, opacity:0, depthWrite:false})
  );
  headHit.position.set(0,1.47,0);
  headHit.userData.hitbox = "head";
  root.add(bodyHit, headHit);

  const animator = createCharacterAnimator(root);
  const controller = {
    root,
    mixer: mixers,
    animator,
    idleAction: idle && mixers ? mixers.clipAction(idle) : null,
    walkAction: walk && mixers ? mixers.clipAction(walk) : null,
    state: "",
    update(dt, moving, speed = 0, airborne = false) {
      const action = moving ? this.walkAction : this.idleAction;
      if (action && this.state !== (moving ? "walk" : "idle")) {
        if (this.state) {
          const prev = moving ? this.idleAction : this.walkAction;
          prev?.fadeOut(0.15);
        }
        action.reset().fadeIn(0.15).play();
        this.state = moving ? "walk" : "idle";
      }
      this.mixer?.update(dt);
      this.animator?.update(dt, moving, speed || (moving ? 5.5 : 0), airborne);
    }
  };
  return controller;
}

export function buildMapColliders(root, limit = 360) {
  const candidates = [];
  root.updateMatrixWorld(true);

  root.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry) return;

    const name = (mesh.name || "").toLowerCase();
    if (/decal|light|lamp|leaf|grass|plant|trim|wire|line|fx|trigger/.test(name)) return;

    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    if (size.y < 0.48) return;
    if (size.x < 0.18 && size.z < 0.18) return;
    if (center.y < 0.08) return;

    // Avoid turning an entire floor/roof or outside shell into a solid box.
    const footprint = size.x * size.z;
    if (footprint > 260) return;
    if (size.x > 30 && size.z > 30) return;

    const collider = createColliderFromMesh(mesh, THREE);
    if (!collider) return;

    // Only geometry intersecting the player's standing volume participates.
    collider.minY = box.min.y;
    collider.maxY = box.max.y;
    if (collider.maxY < 0.08 || collider.minY > 1.95) return;

    if (collider.halfX > 16 || collider.halfZ > 16) return;

    candidates.push(collider);
  });

  // Prefer structural geometry over tiny decorative pieces.
  candidates.sort((a, b) => {
    const aa = a.halfX * a.halfZ;
    const bb = b.halfX * b.halfZ;
    return bb - aa;
  });

  const colliders = [];
  for (const candidate of candidates) {
    const duplicate = colliders.some(existing =>
      Math.abs(existing.x - candidate.x) < 0.10 &&
      Math.abs(existing.z - candidate.z) < 0.10 &&
      Math.abs(existing.halfX - candidate.halfX) < 0.10 &&
      Math.abs(existing.halfZ - candidate.halfZ) < 0.10 &&
      Math.abs(existing.angle - candidate.angle) < 0.08
    );
    if (duplicate) continue;
    colliders.push(candidate);
    if (colliders.length >= limit) break;
  }

  return colliders;
}

export function collectMapSolids(root) {
  const solids = [];
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh) solids.push(o); });
  return solids;
}
