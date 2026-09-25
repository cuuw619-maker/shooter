const THREE = window.THREE;

export const WORLD_SIZE = 80;

function skyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0,0,0,256);
  g.addColorStop(0, "#1a304b");
  g.addColorStop(0.45, "#668aa4");
  g.addColorStop(0.72, "#c0d0d8");
  g.addColorStop(1, "#ded0b7");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,4,256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bb6c8);
  scene.fog = new THREE.Fog(0x9bb6c8, 35, 110);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(95, 32, 20),
    new THREE.MeshBasicMaterial({
      map: skyTexture(),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })
  );
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x334038, 2.25);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d7, 2.8);
  sun.position.set(-18, 32, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -48;
  sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 48;
  sun.shadow.camera.bottom = -48;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  scene.add(sun);

  // The old procedural arena is intentionally gone.
  // Sendstone is the only gameplay map and is attached by game/main.js.
  return {
    scene,
    obstacles: [],
    solids: [],
    proceduralRoot: null
  };
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  return new THREE.PerspectiveCamera(77, innerWidth / innerHeight, 0.05, 220);
}

// Kept only as a compatibility fallback for older callers.
// Gameplay never uses it now because ARCHIE is mandatory for remote players.
export function createRemote(scene) {
  const group = new THREE.Group();
  group.name = "LEGACY_REMOTE";
  scene.add(group);
  return group;
}
