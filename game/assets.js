const THREE = window.THREE;

const MAP_URL = new URL("../sendstone_new(1).glb", import.meta.url).href;
const PLAYER_URL = new URL("../archie__standoff_2.glb", import.meta.url).href;

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

  const controller = {
    root,
    mixer: mixers,
    idleAction: idle && mixers ? mixers.clipAction(idle) : null,
    walkAction: walk && mixers ? mixers.clipAction(walk) : null,
    state: "",
    update(dt, moving) {
      if (!this.mixer) return;
      const action = moving ? this.walkAction : this.idleAction;
      if (action && this.state !== (moving ? "walk" : "idle")) {
        if (this.state) {
          const prev = moving ? this.idleAction : this.walkAction;
          prev?.fadeOut(0.15);
        }
        action.reset().fadeIn(0.15).play();
        this.state = moving ? "walk" : "idle";
      }
      this.mixer.update(dt);
    }
  };
  return controller;
}

export function buildMapColliders(root, limit = 180) {
  const colliders = [];
  const meshes = [];
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh) meshes.push(o); });
  meshes.sort((a,b) => {
    const aa = new THREE.Box3().setFromObject(a).getSize(new THREE.Vector3());
    const bb = new THREE.Box3().setFromObject(b).getSize(new THREE.Vector3());
    return (bb.x * bb.z) - (aa.x * aa.z);
  });
  for (const mesh of meshes.slice(0, limit)) {
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    if (size.y < 0.35 || size.x < 0.35 || size.z < 0.35) continue;
    if (size.x > 20 || size.z > 20) continue;
    if (center.y + size.y * 0.5 < 0.2) continue;
    colliders.push({
      x: center.x,
      z: center.z,
      half: Math.max(size.x, size.z) * 0.5
    });
  }
  return colliders;
}

export function collectMapSolids(root) {
  const solids = [];
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh) solids.push(o); });
  return solids;
}
