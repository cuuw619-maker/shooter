const THREE = window.THREE;

export const WORLD_SIZE = 80;

function textureCanvas(size, mode) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (mode === "floor") {
    ctx.fillStyle = "#27333a";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const n = 28 + Math.random() * 28;
        ctx.fillStyle = "rgb(" + n + "," + (n + 7) + "," + (n + 11) + ")";
        ctx.fillRect(x, y, 4, 4);
      }
    }
    ctx.strokeStyle = "rgba(140,160,170,.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i < size; i += 32) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
    }
  } else {
    ctx.fillStyle = "#465862";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 5) {
      for (let x = 0; x < size; x += 5) {
        const n = 44 + Math.random() * 32;
        ctx.fillStyle = "rgb(" + n + "," + (n + 10) + "," + (n + 15) + ")";
        ctx.fillRect(x, y, 5, 5);
      }
    }
    ctx.strokeStyle = "rgba(210,225,230,.08)";
    ctx.lineWidth = 2;
    for (let i = 0; i < size; i += 20) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function skyTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0,0,0,256);
  g.addColorStop(0, "#1b3554");
  g.addColorStop(0.45, "#6f97b3");
  g.addColorStop(0.72, "#c2d2d9");
  g.addColorStop(1, "#e1d5bd");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,4,256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createWorld() {
  const scene = new THREE.Scene();
  const proceduralRoot = new THREE.Group();
  scene.add(proceduralRoot);
  scene.background = new THREE.Color(0x9bb6c8);
  scene.fog = new THREE.Fog(0x9bb6c8, 24, 105);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(95, 32, 20),
    new THREE.MeshBasicMaterial({map:skyTexture(), side:THREE.BackSide, depthWrite:false, fog:false})
  );
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x334038, 2.2);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d8, 2.7);
  sun.position.set(-15, 26, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 45;
  sun.shadow.camera.bottom = -45;
  scene.add(sun);

  const floorTexture = textureCanvas(256, "floor");
  floorTexture.repeat.set(6, 6);
  const wallTexture = textureCanvas(96, "wall");
  wallTexture.repeat.set(1.2, 1.2);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    new THREE.MeshStandardMaterial({color:0xffffff, map:floorTexture, roughness:0.88, metalness:0.06})
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const laneMaterial = new THREE.MeshBasicMaterial({color:0x58717e, transparent:true, opacity:0.42});
  for (const x of [-18,0,18]) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.16,0.012,70), laneMaterial);
    lane.position.set(x,0.012,0);
    scene.add(lane);
  }
  for (const z of [-18,0,18]) {
    const lane = new THREE.Mesh(new THREE.BoxGeometry(70,0.012,0.16), laneMaterial);
    lane.position.set(0,0.013,z);
    scene.add(lane);
  }

  const grid = new THREE.GridHelper(WORLD_SIZE,40,0x6d8089,0x43545d);
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

  function safe(x,z,half) {
    return Math.hypot(x+8,z) > 7+half && Math.hypot(x-8,z) > 7+half && Math.hypot(x,z) > 4+half;
  }

  function addCover(x,z,w,h,depth=w,color=0xffffff,solid=true) {
    const geometry = new THREE.BoxGeometry(w,h,depth);
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({color, map:wallTexture, roughness:0.63, metalness:0.12})
    );
    mesh.position.set(x,h/2,z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    proceduralRoot.add(mesh);

    if (solid) {
      obstacles.push({x,z,half:Math.max(w,depth)/2});
      solids.push(mesh);
    }

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({color:0xd4e1e6,transparent:true,opacity:0.10})
    );
    edge.position.copy(mesh.position);
    proceduralRoot.add(edge);
    return mesh;
  }

  addCover(0,0,7.2,2.2,2.4,0xc0d0d4);
  addCover(-13,0,3.0,2.8,8.0,0xa5b5ba);
  addCover(13,0,3.0,2.8,8.0,0xa5b5ba);
  addCover(0,-14,8.0,2.6,3.0,0xb0bdc2);
  addCover(0,14,8.0,2.6,3.0,0xb0bdc2);

  const preset = [
    [-24,-22,4.6,2.1,3.2],[-24,22,4.6,2.1,3.2],[24,-22,4.6,2.1,3.2],[24,22,4.6,2.1,3.2],
    [-28,0,3.0,1.7,5.5],[28,0,3.0,1.7,5.5],
    [-19,-10,5.0,1.5,2.0],[19,-10,5.0,1.5,2.0],[-19,10,5.0,1.5,2.0],[19,10,5.0,1.5,2.0]
  ];
  for (const [x,z,w,h,d] of preset) addCover(x,z,w,h,d,0xc4d0d3);

  for (let i=0;i<10;i++) {
    for (let attempt=0;attempt<18;attempt++) {
      const x=Math.round(((random()-0.5)*64)/2)*2;
      const z=Math.round(((random()-0.5)*64)/2)*2;
      const w=1.8+random()*2.2;
      if (safe(x,z,w/2)) {
        addCover(x,z,w,1.25+random()*1.45,w,0xb3c0c4);
        break;
      }
    }
  }

  const railMat = new THREE.MeshStandardMaterial({color:0x263237,metalness:0.55,roughness:0.42});
  for (const x of [-34,34]) {
    for (let z=-30;z<=30;z+=6) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.25,8),railMat);
      post.position.set(x,.625,z);
      post.castShadow=true;
      proceduralRoot.add(post);
    }
  }

  for (const [x,z] of [[-8,0],[8,0],[0,-8],[0,8]]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.24,.30,.22,10),new THREE.MeshStandardMaterial({color:0x243036,metalness:.6,roughness:.34}));
    base.position.set(x,.11,z);
    base.castShadow=true;
    proceduralRoot.add(base);
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.75,10),new THREE.MeshBasicMaterial({color:0x70cee2,transparent:true,opacity:.75}));
    glow.position.set(x,.58,z);
    proceduralRoot.add(glow);
  }

  addCover(0,-39.5,80,2.8,1.0,0x506067,false);
  addCover(0,39.5,80,2.8,1.0,0x506067,false);
  addCover(-39.5,0,1.0,2.8,80,0x506067,false);
  addCover(39.5,0,1.0,2.8,80,0x506067,false);

  return {scene,obstacles,solids,proceduralRoot};
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  return new THREE.PerspectiveCamera(77,innerWidth/innerHeight,0.05,200);
}

export function createRemote(scene) {
  const group = new THREE.Group();
  const armor = new THREE.MeshStandardMaterial({color:0x29404d,metalness:.35,roughness:.55,map:textureCanvas(64,"wall")});
  const dark = new THREE.MeshStandardMaterial({color:0x141b20,metalness:.25,roughness:.75});
  const skin = new THREE.MeshStandardMaterial({color:0xc78663,roughness:.8});
  const visorMat = new THREE.MeshStandardMaterial({color:0x63d5ea,metalness:.2,roughness:.3,emissive:0x153a45});

  const torso = new THREE.Mesh(new THREE.BoxGeometry(.72,.92,.40),armor); torso.position.y=-.78; torso.userData.hitbox="body";
  const chest = new THREE.Mesh(new THREE.BoxGeometry(.52,.42,.06),dark); chest.position.set(0,-.70,-.23);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.285,16,12),skin); head.position.y=-.14; head.userData.hitbox="head";
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.305,16,10,0,Math.PI*2,0,Math.PI*.55),dark); helmet.position.y=-.10;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.28,.08,.02),visorMat); visor.position.set(0,-.10,-.29);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(.18,.82,.20),armor); armL.position.set(-.48,-.78,0); armL.rotation.z=-.08; armL.userData.hitbox="body";
  const armR = armL.clone(); armR.position.x=.48; armR.rotation.z=.08;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(.74,.12,.43),dark); belt.position.y=-1.17;
  const legL = new THREE.Mesh(new THREE.BoxGeometry(.24,.90,.24),dark); legL.position.set(-.19,-1.15,0); legL.userData.hitbox="body";
  const legR = legL.clone(); legR.position.x=.19;

  for (const mesh of [torso,chest,head,helmet,visor,armL,armR,belt,legL,legR]) { mesh.castShadow=true; mesh.receiveShadow=true; }
  group.add(torso,chest,head,helmet,visor,armL,armR,belt,legL,legR);
  group.userData.animation={armL,armR,legL,legR,time:0,lastX:0,lastZ:0};
  scene.add(group);
  return group;
}
