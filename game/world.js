const THREE = window.THREE;

export const WORLD_SIZE = 80;

function makeCanvasTexture(draw, repeatX=8, repeatY=8) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  draw(ctx, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function floorTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#2a3035";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const shade = 36 + Math.floor(Math.random() * 20);
      ctx.fillStyle = "rgb(" + shade + "," + (shade + 2) + "," + (shade + 4) + ")";
      const s = Math.random() * 2.4 + 0.4;
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    ctx.strokeStyle = "rgba(205,215,220,.10)";
    ctx.lineWidth = 2;
    for (let x = 0; x < w; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(232,180,58,.22)";
    ctx.lineWidth = 9;
    ctx.setLineDash([55, 45]);
    ctx.beginPath(); ctx.moveTo(0, h * .5); ctx.lineTo(w, h * .5); ctx.stroke();
    ctx.setLineDash([]);
  }, 6, 6);
}

function metalTexture() {
  return makeCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#46505a";
    ctx.fillRect(0,0,w,h);
    for (let i = 0; i < 1800; i++) {
      const a = .05 + Math.random() * .12;
      ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
      ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*7+1, 1);
    }
  }, 2, 2);
}

function mat(color, roughness=.68, metalness=.12, map=null, emissive=0x000000) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    map,
    emissive,
    emissiveIntensity: emissive ? .55 : 0
  });
}

function addBox(root, solids, colliders, {
  x=0,y=0,z=0, sx=1,sy=1,sz=1, rotation=0,
  material, solid=true, cast=true, receive=true, name="prop"
}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), material);
  mesh.position.set(x,y,z);
  mesh.rotation.y = rotation;
  mesh.name = name;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  root.add(mesh);
  if (solid) {
    solids.push(mesh);
    colliders.push({
      x, z,
      halfX: Math.abs(sx * Math.cos(rotation)) / 2 + Math.abs(sz * Math.sin(rotation)) / 2,
      halfZ: Math.abs(sz * Math.cos(rotation)) / 2 + Math.abs(sx * Math.sin(rotation)) / 2,
      angle: rotation,
      minY: y - sy / 2,
      maxY: y + sy / 2,
      source: mesh
    });
  }
  return mesh;
}

function addCylinder(root, solids, colliders, {
  x=0,y=0,z=0, radius=.35, height=1, material, solid=true, name="cylinder"
}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.05, height, 12), material);
  mesh.position.set(x,y,z);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  if (solid) {
    solids.push(mesh);
    colliders.push({
      x, z, halfX: radius, halfZ: radius, angle: 0,
      minY: y - height / 2, maxY: y + height / 2, source: mesh
    });
  }
  return mesh;
}

function addWarehouse(root, solids, colliders, x, z, rot, materials) {
  addBox(root, solids, colliders, {x, y:3.2, z, sx:17, sy:6.4, sz:7.2, rotation:rot, material:materials.concrete, name:"warehouse_shell"});
  addBox(root, solids, colliders, {x:x-3.8, y:4.0, z:z-3.35, sx:4.4, sy:1.2, sz:.18, rotation:rot, material:materials.trim, name:"warehouse_sign"});
  addBox(root, solids, colliders, {x:x+3.6, y:1.8, z:z-3.35, sx:5.0, sy:3.0, sz:.24, rotation:rot, material:materials.dark, name:"warehouse_door"});
  for (let i=0;i<5;i++) {
    const px = x - 6.2 + i*3.1;
    addBox(root, solids, colliders, {
      x:px, y:4.6, z:z-3.45, sx:2.1, sy:1.35, sz:.12,
      rotation:rot, material:materials.glass, solid:false, name:"warehouse_window"
    });
  }
}

function addContainer(root, solids, colliders, x, z, rot, color, materials) {
  const body = addBox(root, solids, colliders, {
    x,y:1.3,z,sx:11.4,sy:2.6,sz:2.5,rotation:rot,
    material:color,name:"shipping_container"
  });
  for (let i=-4;i<=4;i+=2) {
    addBox(root, solids, colliders, {
      x:x + Math.cos(rot)*i, y:1.33, z:z + Math.sin(rot)*i,
      sx:.055, sy:2.45, sz:2.48, rotation:rot,
      material:materials.seam, solid:false, cast:false, name:"container_seam"
    });
  }
  addBox(root, solids, colliders, {
    x:x - Math.cos(rot)*5.3, y:1.25, z:z - Math.sin(rot)*5.3,
    sx:.08,sy:2.1,sz:1.9,rotation:rot,material:materials.dark,
    solid:false,name:"container_door"
  });
  body.userData.cover = true;
}

function addCrateStack(root, solids, colliders, x, z, rot, materials, height=2) {
  for (let y=0; y<height; y++) {
    addBox(root, solids, colliders, {
      x:x + (y%2)*.04, y:.55 + y*1.05, z:z,
      sx:1.7,sy:1.0,sz:1.7,rotation:rot + (y%2)*.04,
      material:materials.crate,name:"crate"
    });
  }
}

function addLamp(root, lights, x, z, color=0xffd28a) {
  addBox(root, [], [], {x,y:2.65,z,sx:.14,sy:5.3,sz:.14,material:lights.post,solid:false,name:"lamp_post"});
  addBox(root, [], [], {x,y:5.25,z,sx:.72,sy:.16,sz:.72,material:lights.glow,solid:false,name:"lamp_head"});
  const point = new THREE.PointLight(color, 1.4, 9, 2);
  point.position.set(x,5.0,z);
  root.add(point);
  lights.points.push({light:point, phase:Math.random()*Math.PI*2});
}

function addFence(root, x, z, length, rotation, materials) {
  const count = Math.floor(length / 2);
  for (let i=0;i<=count;i++) {
    const t = -length/2 + i*2;
    addBox(root, [], [], {
      x:x + Math.cos(rotation)*t, y:1.05, z:z + Math.sin(rotation)*t,
      sx:.09,sy:2.1,sz:.09,rotation:0,material:materials.fence,
      solid:false,name:"fence_post"
    });
  }
  addBox(root, [], [], {x,y:1.65,z,sx:length,sy:.10,sz:.10,rotation,material:materials.fence,solid:false,name:"fence_wire"});
  addBox(root, [], [], {x,y:.85,z,sx:length,sy:.10,sz:.10,rotation,material:materials.fence,solid:false,name:"fence_wire_low"});
}

function buildMap() {
  const root = new THREE.Group();
  root.name = "TACTICAL_YARD";
  const solids = [];
  const colliders = [];
  const animations = [];
  const lights = {points:[]};

  const concreteMap = mat(0x4b5357,.86,.05,floorTexture());
  const concrete = mat(0x70787b,.8,.08);
  const dark = mat(0x161b20,.74,.35,metalTexture());
  const metal = mat(0x394148,.5,.72,metalTexture());
  const trim = mat(0xb8873d,.56,.48);
  const yellow = mat(0xd7b24a,.52,.42);
  const glass = mat(0x243b4a,.18,.52,null,0x102937);
  const crate = mat(0x7b5b3d,.84,.05);
  const seam = mat(0x1a2126,.65,.55);
  const fence = mat(0x20272b,.58,.62);
  const red = mat(0x6d2b25,.72,.3);
  const blue = mat(0x274c6f,.62,.32);
  const hazard = mat(0xc18d2a,.58,.4);
  const glow = new THREE.MeshStandardMaterial({color:0xffd98b,emissive:0xffb84e,emissiveIntensity:2.2,roughness:.28,metalness:.15});
  const signBlue = new THREE.MeshStandardMaterial({color:0x6eb9ff,emissive:0x214d7b,emissiveIntensity:1.1,roughness:.34});
  const materials={concrete,metal,dark,trim,glass,crate,seam,fence,red,blue,hazard};
  const lampMaterials={post:metal,glow};

  // Ground and outer shell.
  addBox(root, [], [], {x:0,y:-.16,z:0,sx:78,sy:.30,sz:78,material:concreteMap,solid:false,name:"ground"});
  addBox(root, [], colliders, {x:0,y:2.5,z:-39,sx:78,sy:5,sz:.8,material:concrete,name:"outer_wall_north"});
  addBox(root, [], colliders, {x:0,y:2.5,z:39,sx:78,sy:5,sz:.8,material:concrete,name:"outer_wall_south"});
  addBox(root, [], colliders, {x:-39,y:2.5,z:0,sx:.8,sy:5,sz:78,material:concrete,name:"outer_wall_west"});
  addBox(root, [], colliders, {x:39,y:2.5,z:0,sx:.8,sy:5,sz:78,material:concrete,name:"outer_wall_east"});

  // Main buildings.
  addWarehouse(root, solids, colliders, -21, -21, 0, materials);
  addWarehouse(root, solids, colliders, 21, 21, Math.PI, materials);

  // Central lane cover.
  addContainer(root, solids, colliders, -5, -7, 0, blue, materials);
  addContainer(root, solids, colliders, 5, 7, Math.PI, red, materials);
  addContainer(root, solids, colliders, 17, -3, Math.PI/2, trim, materials);
  addContainer(root, solids, colliders, -17, 3, -Math.PI/2, hazard, materials);

  addCrateStack(root, solids, colliders, -7, 12, .12, materials, 2);
  addCrateStack(root, solids, colliders, 7, -12, -.12, materials, 2);
  addCrateStack(root, solids, colliders, 26, -8, .3, materials, 2);
  addCrateStack(root, solids, colliders, -26, 8, -.3, materials, 2);

  // Small cover / hardpoints.
  for (const [x,z,r,c] of [
    [-12,-5,.1,materials.concrete],[12,5,-.1,materials.concrete],
    [-11,20,.0,materials.yellow],[11,-20,.0,materials.yellow],
    [0,-18,.0,materials.dark],[0,18,.0,materials.dark]
  ]) {
    addBox(root, solids, colliders, {x,y:.7,z,sx:3.5,sy:1.4,sz:1.2,rotation:r,material:c,name:"cover_block"});
  }

  // Barrels and industrial props.
  const barrelPlaces = [
    [-2,-15],[2,15],[-29,-2], [29,2],[-15,-28],[15,28],
    [-19,12],[19,-12],[-30,18],[30,-18]
  ];
  barrelPlaces.forEach(([x,z],i)=>addCylinder(root, solids, colliders,{
    x,y:.58,z,radius:.38,height:1.15,material:i%2?blue:red,name:"barrel"
  }));

  addFence(root,-30,-10,12,Math.PI/2,materials);
  addFence(root,30,10,12,Math.PI/2,materials);
  addFence(root,-10,30,12,0,materials);
  addFence(root,10,-30,12,0,materials);

  // Hazard stripes around the center.
  for (let i=-3;i<=3;i++) {
    addBox(root, [], [], {x:i*2.2,y:.015,z:0,sx:1.2,sy:.025,sz:5.5,rotation:.0,material:i%2?yellow:dark,solid:false,cast:false,name:"hazard_strip"});
  }

  // Lamps and animated rotating beacons.
  addLamp(root, lights, -14,-14);
  addLamp(root, lights, 14,14);
  addLamp(root, lights, 0,0,0xaed5ff);
  addLamp(root, lights, -25,15);
  addLamp(root, lights, 25,-15);

  const fanRoot = new THREE.Group();
  fanRoot.position.set(0,5.7,0);
  root.add(fanRoot);
  addBox(fanRoot, [], [], {x:0,y:0,z:0,sx:.16,sy:.16,sz:.16,material:dark,solid:false,name:"fan_hub"});
  for (let i=0;i<4;i++) {
    const blade = addBox(fanRoot, [], [], {
      x:0,y:0,z:1.25,sx:.18,sy:.06,sz:2.6,rotation:i*Math.PI/2,material:metal,
      solid:false,name:"fan_blade"
    });
    animations.push({type:"fan",root:fanRoot,speed:0.85});
  }

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.6,10), glow);
  beacon.position.set(0,4.5,0);
  root.add(beacon);
  animations.push({type:"beacon",mesh:beacon});

  // Site signage.
  addBox(root, [], [], {x:-30,y:4,z:0,sx:.15,sy:2.4,sz:4.7,material:dark,solid:false,name:"sign_a"});
  addBox(root, [], [], {x:30,y:4,z:0,sx:.15,sy:2.4,sz:4.7,material:dark,solid:false,name:"sign_b"});

  const spawnPoints = [
    {host:[-31,-27], guest:[31,27]},
    {host:[-31,-18], guest:[31,18]},
    {host:[-25,-30], guest:[25,30]}
  ];

  const animate = (dt, now) => {
    fanRoot.rotation.y += dt * .85;
    beacon.material.emissiveIntensity = 1.6 + Math.sin(now * .007) * .55;
    for (const item of lights.points) {
      item.light.intensity = 1.05 + Math.sin(now * .002 + item.phase) * .26;
    }
  };

  return {root,solids,colliders,animate,spawnPoints};
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111820);
  scene.fog = new THREE.Fog(0x111820, 48, 108);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(105, 28, 18),
    new THREE.MeshBasicMaterial({
      color: 0x1a2735,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false
    })
  );
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xa6c8dd, 0x20251f, 1.75);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe6bc, 2.35);
  sun.position.set(-22, 36, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536,1536);
  sun.shadow.camera.left = -48;
  sun.shadow.camera.right = 48;
  sun.shadow.camera.top = 48;
  sun.shadow.camera.bottom = -48;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 120;
  scene.add(sun);

  const map = buildMap();
  scene.add(map.root);

  return {
    scene,
    obstacles: map.colliders,
    solids: map.solids,
    proceduralRoot: map.root,
    animation: {update: map.animate},
    spawnPoints: map.spawnPoints
  };
}

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera() {
  return new THREE.PerspectiveCamera(77, innerWidth / innerHeight, 0.05, 220);
}

export function createRemote(scene) {
  const group = new THREE.Group();
  group.name = "LEGACY_REMOTE";
  scene.add(group);
  return group;
}
