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
  let seed = 0;
  for (const ch of window.__ROOM_CODE || "00000") seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 24; i++) {
    const w = 2 + random() * 5;
    const h = 2 + random() * 4;
    const x = (random() - 0.5) * 65;
    const z = (random() - 0.5) * 65;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, w),
      new THREE.MeshStandardMaterial({color: 0x3e4d5b})
    );
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    obstacles.push({x, z, half:w / 2});
  }

  return {scene, obstacles};
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
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.4, 0.5),
    new THREE.MeshStandardMaterial({color: 0xc34b4b})
  );
  body.position.y = -0.7;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 8),
    new THREE.MeshStandardMaterial({color: 0xd89b76})
  );
  head.position.y = 0.15;
  group.add(body, head);
  scene.add(group);
  return group;
}
