const THREE = window.THREE;

export const WORLD_SIZE = 80;

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071019);
  scene.fog = new THREE.Fog(0x071019, 18, 92);

  const hemi = new THREE.HemisphereLight(0xbdd7ff, 0x18231c, 2.05);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 2.45);
  sun.position.set(12, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    new THREE.MeshStandardMaterial({color:0x202b31, roughness:0.86, metalness:0.08})
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const laneMaterial = new THREE.MeshBasicMaterial({color:0x344953, transparent:true, opacity:0.5});
  for (const x of [-18, 0, 18]) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.012,70), laneMaterial);
    lane.position.set(x,0.012,0);
    scene.add(lane);
  }
  for (const z of [-18, 0, 18]) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(70,0.012,0.18), laneMaterial);
    lane.position.set(0,0.013,z);
    scene.add(lane);
  }

  const grid = new THREE.GridHelper(WORLD_SIZE, 40, 0x53636c, 0x2c3941);
  grid.position.y = 0.018;
  scene.add(grid);

  const obstacles = [];
  const solids = [];
  let seed = 0;
  for (const ch of window.__ROOM_CODE || "00000") seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function safe(x, z, half) {
    return Math.hypot(x + 8, z) > 7 + half && Math.hypot(x - 8, z) > 7 + half &&
      Math.hypot(x, z) > 4 + half;
  }

  function addCover(x, z, w, h, depth=w, color=0x3e4d5b, bevel=0.08, solid=true) {
    const geometry = new THREE.BoxGeometry(w, h, depth);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color, roughness:0.66, metalness:0.12
    }));
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (solid) {
      obstacles.push({x, z, half:Math.max(w, depth) / 2});
      solids.push(mesh);
    }
    if (bevel > 0) {
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({color:0x91a2ad, transparent:true, opacity:0.16})
      );
      edge.position.copy(mesh.position);
      scene.add(edge);
    }
    return mesh;
  }

  // Main geometry: predictable competitive routes around a deterministic center.
  addCover(0, 0, 7.2, 2.2, 2.4, 0x495c67);
  addCover(-13, 0, 3.0, 2.8, 8.0, 0x41515a);
  addCover(13, 0, 3.0, 2.8, 8.0, 0x41515a);
  addCover(0, -14, 8.0, 2.6, 3.0, 0x41515a);
  addCover(0, 14, 8.0, 2.6, 3.0, 0x41515a);

  const preset = [
    [-24,-22,4.6,2.1,3.2], [-24,22,4.6,2.1,3.2],
    [24,-22,4.6,2.1,3.2], [24,22,4.6,2.1,3.2],
    [-28,0,3.0,1.7,5.5], [28,0,3.0,1.7,5.5],
    [-19,-10,5.0,1.5,2.0], [19,-10,5.0,1.5,2.0],
    [-19,10,5.0,1.5,2.0], [19,10,5.0,1.5,2.0]
  ];
  for (const [x,z,w,h,d] of preset) addCover(x,z,w,h,d,0x465863);

  for (let i = 0; i < 10; i++) {
    let x = 0, z = 0;
    for (let attempt = 0; attempt < 18; attempt++) {
      x = Math.round(((random() - 0.5) * 64) / 2) * 2;
      z = Math.round(((random() - 0.5) * 64) / 2) * 2;
      const w = 1.8 + random() * 2.2;
      if (safe(x, z, w / 2)) {
        addCover(x, z, w, 1.25 + random() * 1.45, w, 0x384953);
        break;
      }
    }
  }

  // Decorative rails and low barriers make the arena readable without blocking routes.
  const railMat = new THREE.MeshStandardMaterial({color:0x1e282d, metalness:0.55, roughness:0.42});
  for (const x of [-34,34]) {
    for (let z = -30; z <= 30; z += 6) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,1.25,8), railMat);
      post.position.set(x,0.625,z);
      post.castShadow = true;
      scene.add(post);
    }
  }

  // Colored navigation pylons.
  for (const [x,z] of [[-8,0],[8,0],[0,-8],[0,8]]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.24,.30,.22,10), new THREE.MeshStandardMaterial({color:0x1c252a, metalness:.6, roughness:.34}));
    base.position.set(x,0.11,z);
    scene.add(base);
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.75,10), new THREE.MeshBasicMaterial({color:0x4fc0d8, transparent:true, opacity:.72}));
    glow.position.set(x,0.58,z);
    scene.add(glow);
  }

  // Boundary blocks.
  addCover(0,-39.5,80,2.8,1.0,0x26343b,0,false);
  addCover(0,39.5,80,2.8,1.0,0x26343b,0,false);
  addCover(-39.5,0,1.0,2.8,80,0x26343b,0,false);
  addCover(39.5,0,1.0,2.8,80,0x26343b,0,false);

  return {scene, obstacles, solids};
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(77, innerWidth / innerHeight, 0.05, 200);
  camera.position.set(0,0,0);
  return camera;
}

export function createRemote(scene) {
  const group = new THREE.Group();
  const armor = new THREE.MeshStandardMaterial({color:0x263746, metalness:0.35, roughness:0.55});
  const dark = new THREE.MeshStandardMaterial({color:0x11171c, metalness:0.25, roughness:0.75});
  const skin = new THREE.MeshStandardMaterial({color:0xc78663, roughness:0.8});
  const visorMat = new THREE.MeshStandardMaterial({color:0x4fc0d8, metalness:0.2, roughness:0.3, emissive:0x102f39});

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72,0.92,0.40), armor);
  torso.position.y = -0.78; torso.userData.hitbox = "body";
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.42,0.06), dark);
  chest.position.set(0,-0.70,-0.23);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.285,16,12), skin);
  head.position.y = -0.14; head.userData.hitbox = "head";
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.305,16,10,0,Math.PI*2,0,Math.PI*0.55), dark);
  helmet.position.y = -0.10;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.08,0.02), visorMat);
  visor.position.set(0,-0.10,-0.29);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.82,0.20), armor);
  armL.position.set(-0.48,-0.78,0); armL.rotation.z=-0.08; armL.userData.hitbox="body";
  const armR = armL.clone(); armR.position.x=0.48; armR.rotation.z=0.08;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.74,0.12,0.43), dark); belt.position.y=-1.17;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24,0.90,0.24), dark);
  legL.position.set(-0.19,-1.15,0); legL.userData.hitbox="body";
  const legR = legL.clone(); legR.position.x=0.19;

  for (const mesh of [torso,chest,head,helmet,visor,armL,armR,belt,legL,legR]) {
    mesh.castShadow = true; mesh.receiveShadow = true;
  }
  group.add(torso,chest,head,helmet,visor,armL,armR,belt,legL,legR);
  group.userData.animation = {armL,armR,legL,legR};
  scene.add(group);
  return group;
}
