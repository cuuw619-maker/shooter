const THREE = window.THREE;

export const WORLD_SIZE = 80;

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07101a);
  scene.fog = new THREE.Fog(0x07101a, 15, 85);

  scene.add(new THREE.HemisphereLight(0xbdd7ff, 0x273018, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(10, 20, 5);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    new THREE.MeshStandardMaterial({color: 0x26323b, roughness: 0.9})
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(WORLD_SIZE, 40, 0x617080, 0x3b4650);
  grid.position.y = 0.01;
  scene.add(grid);

  const obstacles = [];
  const solids = [];
  let seed = 0;
  for (const ch of window.__ROOM_CODE || "00000") seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 24; i++) {
    const w = 2 + random() * 5;
    const h = 2 + random() * 4;
    let x = 0, z = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
      const tx = (random() - 0.5) * 65;
      const tz = (random() - 0.5) * 65;
      if (Math.hypot(tx + 8, tz) > 7 && Math.hypot(tx - 8, tz) > 7) { x = tx; z = tz; break; }
      x = tx; z = tz;
    }
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w),
      new THREE.MeshStandardMaterial({color: 0x3e4d5b})
    );
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    obstacles.push({x, z, half:w / 2});
    solids.push(mesh);
  }

  return {scene, obstacles, solids};
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  return new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 200);
}

export function createRemote(scene) {
  const group = new THREE.Group();
  const armor = new THREE.MeshStandardMaterial({color:0x263746, metalness:0.35, roughness:0.55});
  const dark = new THREE.MeshStandardMaterial({color:0x11171c, metalness:0.25, roughness:0.75});
  const skin = new THREE.MeshStandardMaterial({color:0xc78663, roughness:0.8});
  const visorMat = new THREE.MeshStandardMaterial({color:0x4fc0d8, metalness:0.2, roughness:0.3, emissive:0x102f39});

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72,0.92,0.40), armor);
  torso.position.y = -0.78;
  torso.userData.hitbox = "body";

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.52,0.42,0.06), dark);
  chest.position.set(0,-0.70,-0.23);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.285,16,12), skin);
  head.position.y = -0.14;
  head.userData.hitbox = "head";

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.305,16,10,0,Math.PI*2,0,Math.PI*0.55), dark);
  helmet.position.y = -0.10;

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.08,0.02), visorMat);
  visor.position.set(0,-0.10,-0.29);

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18,0.82,0.20), armor);
  armL.position.set(-0.48,-0.78,0);
  armL.rotation.z = -0.08;
  armL.userData.hitbox = "body";
  const armR = armL.clone();
  armR.position.x = 0.48;
  armR.rotation.z = 0.08;

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.74,0.12,0.43), dark);
  belt.position.y = -1.17;

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.24,0.90,0.24), dark);
  legL.position.set(-0.19,-1.68,0);
  legL.userData.hitbox = "body";
  const legR = legL.clone();
  legR.position.x = 0.19;

  group.add(torso,chest,head,helmet,visor,armL,armR,belt,legL,legR);
  scene.add(group);
  return group;
}
