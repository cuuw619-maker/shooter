const THREE = window.THREE;

export const WORLD_SIZE = 84;

function canvasTexture(draw, repeatX=8, repeatY=8) {
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
  return texture;
}

function concreteTexture() {
  return canvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#252a2e";
    ctx.fillRect(0,0,w,h);
    for(let i=0;i<13000;i++){
      const v=29+Math.floor(Math.random()*24);
      ctx.fillStyle=`rgb(${v},${v+2},${v+4})`;
      const s=.35+Math.random()*2.5;
      ctx.fillRect(Math.random()*w,Math.random()*h,s,s);
    }
    ctx.strokeStyle="rgba(155,170,180,.075)";
    ctx.lineWidth=2;
    for(let x=0;x<=w;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<=h;y+=64){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.strokeStyle="rgba(212,162,65,.16)";
    ctx.lineWidth=7;
    ctx.setLineDash([38,34]);
    ctx.beginPath();ctx.moveTo(0,h*.5);ctx.lineTo(w,h*.5);ctx.stroke();
    ctx.setLineDash([]);
  },6,6);
}

function metalTexture() {
  return canvasTexture((ctx,w,h)=>{
    ctx.fillStyle="#353d44";ctx.fillRect(0,0,w,h);
    for(let i=0;i<2400;i++){
      const a=.035+Math.random()*.13;
      ctx.fillStyle=`rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fillRect(Math.random()*w,Math.random()*h,.6+Math.random()*8,.7);
    }
    ctx.strokeStyle="rgba(0,0,0,.16)";
    for(let y=0;y<h;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  },3,3);
}

function mat(color, roughness=.68, metalness=.1, map=null, emissive=0x000000) {
  return new THREE.MeshStandardMaterial({
    color,roughness,metalness,map,emissive,
    emissiveIntensity:emissive?.55:0
  });
}

function addBox(root,solids,colliders,o={}) {
  const {
    x=0,y=0,z=0,sx=1,sy=1,sz=1,rotation=0,material,
    solid=true,cast=true,receive=true,name="prop"
  }=o;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
  mesh.position.set(x,y,z);
  mesh.rotation.y=rotation;
  mesh.name=name;
  mesh.castShadow=cast;
  mesh.receiveShadow=receive;
  root.add(mesh);
  if(solid){
    solids.push(mesh);
    colliders.push({
      x,z,
      halfX:Math.abs(sx)/2,
      halfZ:Math.abs(sz)/2,
      angle:rotation,
      minY:y-sy/2,
      maxY:y+sy/2,
      source:mesh
    });
  }
  return mesh;
}

function addCylinder(root,solids,colliders,o={}) {
  const {x=0,y=0,z=0,radius=.4,height=1,material,solid=true,name="cylinder"}=o;
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*1.05,height,14),material);
  mesh.position.set(x,y,z);
  mesh.name=name;
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  root.add(mesh);
  if(solid){
    solids.push(mesh);
    colliders.push({
      x,z,halfX:radius,halfZ:radius,angle:0,
      minY:y-height/2,maxY:y+height/2,source:mesh
    });
  }
  return mesh;
}

function addWallPanel(root,solids,colliders,x,z,rotation,materials) {
  addBox(root,solids,colliders,{x,y:2.8,z,sx:20,sy:5.6,sz:.52,rotation,material:materials.wall,name:"facility_wall"});
  for(let i=-4;i<=4;i++){
    const px=x+Math.cos(rotation)*i*2.1;
    const pz=z+Math.sin(rotation)*i*2.1;
    addBox(root,[],[],{
      x:px,y:3.1,z:pz,sx:1.5,sy:5.8,sz:.065,rotation,
      material:materials.frame,solid:false,cast:false,name:"wall_rib"
    });
  }
}

function addBuilding(root,solids,colliders,x,z,rotation,materials,doors=1) {
  addBox(root,solids,colliders,{x,y:3.1,z,sx:18,sy:6.2,sz:9,rotation,material:materials.wall,name:"hangar_shell"});
  addWallPanel(root,solids,colliders,x,z-4.55*Math.cos(rotation),rotation,materials);
  const doorCount=Math.max(1,doors);
  for(let d=0;d<doorCount;d++){
    const offset=(d-(doorCount-1)/2)*6;
    const px=x+Math.cos(rotation)*offset;
    const pz=z+Math.sin(rotation)*offset;
    const door=addBox(root,solids,colliders,{
      x:px,y:2.05,z:pz,sx:4.8,sy:4.1,sz:.22,rotation,
      material:materials.door,name:"hangar_door"
    });
    door.userData.baseY=door.position.y;
    door.userData.phase=d*.8;
  }
  for(let i=-3;i<=3;i++){
    const px=x+Math.cos(rotation)*i*2.35;
    const pz=z+Math.sin(rotation)*i*2.35;
    addBox(root,[],[],{
      x:px,y:5.1,z:pz,sx:1.65,sy:.62,sz:.10,rotation,
      material:materials.glass,solid:false,name:"hangar_window"
    });
  }
  addBox(root,[],[],{
    x:x+Math.cos(rotation)*7.6,y:4.9,z:z+Math.sin(rotation)*7.6,
    sx:1.2,sy:.14,sz:1.2,rotation,material:materials.neon,
    solid:false,name:"hangar_light"
  });
}

function addContainer(root,solids,colliders,x,z,rotation,color,materials) {
  const body=addBox(root,solids,colliders,{
    x,y:1.35,z,sx:11.5,sy:2.7,sz:2.55,rotation,
    material:color,name:"cargo_container"
  });
  body.userData.cover=true;
  for(let i=-5;i<=5;i++){
    const px=x+Math.cos(rotation)*i*1.02;
    const pz=z+Math.sin(rotation)*i*1.02;
    addBox(root,[],[],{
      x:px,y:1.35,z:pz,sx:.065,sy:2.42,sz:2.61,rotation,
      material:materials.seam,solid:false,cast:false,name:"container_rib"
    });
  }
  addBox(root,[],[],{
    x:x-Math.cos(rotation)*5.2,y:1.32,z:z-Math.sin(rotation)*5.2,
    sx:.08,sy:2.12,sz:1.9,rotation,material:materials.door,
    solid:false,name:"container_door"
  });
}

function addCrate(root,solids,colliders,x,y,z,rotation,materials) {
  addBox(root,solids,colliders,{x,y,z,sx:1.7,sy:1.05,sz:1.7,rotation,material:materials.crate,name:"cover_crate"});
  addBox(root,[],[],{
    x,y:y+.53,z,sx:1.78,sy:.08,sz:.11,rotation,material:materials.crateEdge,
    solid:false,cast:false,name:"crate_band"
  });
  addBox(root,[],[],{
    x,y:y+.53,z,sx:.11,sy:.08,sz:1.78,rotation:rotation+Math.PI/2,
    material:materials.crateEdge,solid:false,cast:false,name:"crate_band"
  });
}

function addCrateStack(root,solids,colliders,x,z,rotation,materials,height=2) {
  for(let i=0;i<height;i++) addCrate(root,solids,colliders,x,.53+i*1.06,z,rotation+(i%2)*.06,materials);
}

function addFence(root,x,z,length,rotation,materials) {
  for(let i=0;i<=Math.floor(length/2);i++){
    const t=-length/2+i*2;
    addBox(root,[],[],{
      x:x+Math.cos(rotation)*t,y:1.15,z:z+Math.sin(rotation)*t,
      sx:.10,sy:2.3,sz:.10,material:materials.fence,
      solid:false,name:"fence_post"
    });
  }
  addBox(root,[],[],{x,y:1.78,z,sx:length,sy:.09,sz:.09,rotation,material:materials.fence,solid:false,name:"fence_wire"});
  addBox(root,[],[],{x,y:1.07,z,sx:length,sy:.09,sz:.09,rotation,material:materials.fence,solid:false,name:"fence_wire"});
}

function addLamp(root,lights,x,z,phase=0,color=0xffc777) {
  const post=addBox(root,[],[],{x,y:3,z,sx:.16,sy:6,sz:.16,material:lights.post,solid:false,name:"lamp_post"});
  post.castShadow=false;
  addBox(root,[],[],{x,y:5.92,z,sx:.86,sy:.14,sz:.86,material:lights.glow,solid:false,name:"lamp_head"});
  const p=new THREE.PointLight(color,1.45,10,2);
  p.position.set(x,5.35,z);
  root.add(p);
  lights.points.push({light:p,phase});
}

function addPipe(root,x,y,z,sx,sy,sz,rotation,materials) {
  addBox(root,[],[],{
    x,y,z,sx,sy,sz,rotation,material:materials.pipe,
    solid:false,name:"pipe"
  });
}

function makeObjective(root,animations,materials) {
  const hub=new THREE.Group();
  hub.position.set(0,0,0);
  root.add(hub);
  addBox(hub,[],[],{x:0,y:.65,z:0,sx:4.4,sy:1.3,sz:4.4,material:materials.objectiveBase,solid:false,name:"objective_base"});
  for(let i=0;i<4;i++){
    const p=new THREE.Mesh(
      new THREE.CylinderGeometry(.07,.07,2.6,10),
      materials.neon
    );
    const a=i*Math.PI/2;
    p.position.set(Math.cos(a)*1.55,2.0,Math.sin(a)*1.55);
    hub.add(p);
  }
  const ring=new THREE.Mesh(
    new THREE.TorusGeometry(1.35,.065,10,42),
    materials.neon
  );
  ring.rotation.x=Math.PI/2;
  ring.position.y=2.3;
  hub.add(ring);
  const core=new THREE.Mesh(
    new THREE.OctahedronGeometry(.55,1),
    materials.core
  );
  core.position.y=2.3;
  hub.add(core);
  const light=new THREE.PointLight(0x73b9ff,2.5,13,2);
  light.position.set(0,2.5,0);
  hub.add(light);
  animations.push({type:"objective",ring,core,light});
}

function buildMap() {
  const root=new THREE.Group();
  root.name="NIGHTLINE_FACILITY";
  const solids=[],colliders=[],animations=[];
  const lights={points:[]};

  const ground=mat(0x30363b,.94,.04,concreteTexture());
  const wall=mat(0x596168,.8,.12);
  const door=mat(0x20272d,.7,.38,metalTexture());
  const frame=mat(0x171d22,.62,.56,metalTexture());
  const seam=mat(0x11171b,.64,.55);
  const pipe=mat(0x4b5960,.52,.68,metalTexture());
  const glass=mat(0x274656,.12,.55,null,0x0b2634);
  const crate=mat(0x755338,.9,.05);
  const crateEdge=mat(0x9c7249,.75,.06);
  const fence=mat(0x151b20,.58,.72);
  const blue=mat(0x1f577e,.52,.38,metalTexture());
  const red=mat(0x76352e,.6,.32,metalTexture());
  const yellow=mat(0xbf8b2c,.58,.40);
  const black=mat(0x15191d,.72,.45);
  const objectiveBase=mat(0x202830,.64,.5);
  const neon=new THREE.MeshStandardMaterial({
    color:0x71c8ff,emissive:0x2a83c4,emissiveIntensity:2.2,
    roughness:.24,metalness:.15
  });
  const core=new THREE.MeshStandardMaterial({
    color:0xe0f5ff,emissive:0x5bc7ff,emissiveIntensity:3.5,
    roughness:.18,metalness:.22
  });
  const materials={wall,door,frame,seam,pipe,glass,crate,crateEdge,fence,neon,core,objectiveBase};
  const lamps={post:frame,glow:new THREE.MeshStandardMaterial({
    color:0xffdba0,emissive:0xff9d36,emissiveIntensity:4,roughness:.25
  })};

  addBox(root,[],[],{x:0,y:-.16,z:0,sx:82,sy:.32,sz:82,material:ground,solid:false,name:"floor"});
  addBox(root,colliders,colliders,{x:0,y:2.5,z:-41,sx:82,sy:5,sz:.7,material:wall,name:"boundary_n"});
  addBox(root,colliders,colliders,{x:0,y:2.5,z:41,sx:82,sy:5,sz:.7,material:wall,name:"boundary_s"});
  addBox(root,colliders,colliders,{x:-41,y:2.5,z:0,sx:.7,sy:5,sz:82,material:wall,name:"boundary_w"});
  addBox(root,colliders,colliders,{x:41,y:2.5,z:0,sx:.7,sy:5,sz:82,material:wall,name:"boundary_e"});

  addBuilding(root,solids,colliders,-23,-23,0,materials,2);
  addBuilding(root,solids,colliders,23,23,Math.PI,materials,2);

  addContainer(root,solids,colliders,-7,-7,0,blue,materials);
  addContainer(root,solids,colliders,7,7,Math.PI,red,materials);
  addContainer(root,solids,colliders,18,-3,Math.PI/2,yellow,materials);
  addContainer(root,solids,colliders,-18,3,-Math.PI/2,black,materials);

  addCrateStack(root,solids,colliders,-9,12,.10,materials,2);
  addCrateStack(root,solids,colliders,9,-12,-.10,materials,2);
  addCrateStack(root,solids,colliders,27,-9,.28,materials,2);
  addCrateStack(root,solids,colliders,-27,9,-.28,materials,2);

  for(const [x,z,r,c] of [
    [-13,-3,.12,wall],[13,3,-.12,wall],[-12,21,0,yellow],[12,-21,0,yellow],
    [0,-18,0,black],[0,18,0,black],[-23,8,.35,black],[23,-8,-.35,black]
  ]){
    addBox(root,solids,colliders,{x,y:.75,z,sx:4.0,sy:1.5,sz:1.25,rotation:r,material:c,name:"waist_cover"});
  }

  const barrels=[[-2,-15],[2,15],[-30,-2],[30,2],[-16,-30],[16,30],[-20,14],[20,-14],[-31,17],[31,-17]];
  barrels.forEach(([x,z],i)=>{
    const barrel=addCylinder(root,solids,colliders,{x,y:.62,z,radius:.40,height:1.24,material:i%2?blue:red,name:"fuel_barrel"});
    barrel.rotation.z=(i%3===0)?.03:0;
    for(let k=0;k<3;k++){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.41,.018,6,18),materials.frame);
      ring.rotation.x=Math.PI/2;
      ring.position.y=.2+k*.35;
      barrel.add(ring);
    }
  });

  addFence(root,-31,-10,13,Math.PI/2,materials);
  addFence(root,31,10,13,Math.PI/2,materials);
  addFence(root,-10,31,13,0,materials);
  addFence(root,10,-31,13,0,materials);

  addPipe(root,-30,4,-20,7,.12,.12,Math.PI/2,materials);
  addPipe(root,30,4,20,7,.12,.12,Math.PI/2,materials);
  addPipe(root,-20,5,30,.12,.12,7,0,materials);
  addPipe(root,20,5,-30,.12,.12,7,0,materials);

  for(let i=-3;i<=3;i++){
    addBox(root,[],[],{
      x:i*2.3,y:.015,z:0,sx:1.25,sy:.025,sz:6.5,
      material:i%2?yellow:black,solid:false,cast:false,name:"hazard_strip"
    });
  }

  addLamp(root,lights,-14,-14,0);
  addLamp(root,lights,14,14,1.4);
  addLamp(root,lights,-27,18,2.3,0x8bc9ff);
  addLamp(root,lights,27,-18,3.1,0xff8f69);

  const tower=new THREE.Group();
  tower.position.set(30,0,-30);
  root.add(tower);
  addBox(tower,solids,colliders,{x:0,y:2.6,z:0,sx:4.2,sy:5.2,sz:4.2,material:frame,name:"watchtower_base"});
  addBox(tower,[],[],{x:0,y:5.4,z:0,sx:5,sy:.25,sz:5,material:door,solid:false,name:"watchtower_top"});
  for(let i=0;i<4;i++){
    const beam=addBox(tower,[],[],{
      x:0,y:3.9,z:0,sx:.18,sy:4.2,sz:.18,material:pipe,solid:false,name:"tower_leg"
    });
    const a=i*Math.PI/2;
    beam.position.x=Math.cos(a)*1.6;
    beam.position.z=Math.sin(a)*1.6;
  }
  const rotor=new THREE.Group();
  rotor.position.y=5.65;
  tower.add(rotor);
  addBox(rotor,[],[],{x:0,y:0,z:0,sx:4,sy:.08,sz:.18,material:neon,solid:false,name:"antenna_bar"});
  addBox(rotor,[],[],{x:0,y:0,z:0,sx:.18,sy:.08,sz:4,material:neon,solid:false,name:"antenna_bar"});
  animations.push({type:"rotor",rotor});

  const gate=new THREE.Group();
  gate.position.set(0,0,34);
  root.add(gate);
  addBox(gate,solids,colliders,{x:-3.8,y:2.8,z:0,sx:7,sy:5.6,sz:.7,material:frame,name:"gate_side_l"});
  addBox(gate,solids,colliders,{x:3.8,y:2.8,z:0,sx:7,sy:5.6,sz:.7,material:frame,name:"gate_side_r"});
  const gateBar=addBox(gate,[],[],{x:0,y:4,z:0,sx:8.5,sy:1.0,sz:.7,material:neon,solid:false,name:"gate_header"});
  animations.push({type:"pulse",mesh:gateBar});

  makeObjective(root,animations,materials);

  const respawns=[
    {host:[-32,-32],guest:[32,32]},
    {host:[-31,-20],guest:[31,20]},
    {host:[-25,-33],guest:[25,33]}
  ];

  const animate=(dt,now)=>{
    for(const p of root.children){
      if(p.name==="hangar_shell"){}
    }
    root.traverse(o=>{
      if(o.name==="hangar_light"&&o.material?.emissiveIntensity){
        o.material.emissiveIntensity=2.0+Math.sin(now*.004+o.position.x)*.4;
      }
    });
    root.traverse(o=>{
      if(o.name==="hangar_door"&&o.userData.baseY){
        o.position.y=o.userData.baseY+Math.sin(now*.0015+(o.userData.phase||0))*.012;
      }
    });
    for(const item of animations){
      if(item.type==="rotor") item.rotor.rotation.y+=dt*.85;
      if(item.type==="pulse") item.mesh.material.emissiveIntensity=2.1+Math.sin(now*.006)*.7;
      if(item.type==="objective"){
        item.ring.rotation.z+=dt*.9;
        item.core.rotation.y+=dt*1.6;
        item.core.rotation.x+=dt*.65;
        item.light.intensity=2.0+Math.sin(now*.004)*.65;
      }
    }
    for(const item of lights.points){
      item.light.intensity=1.15+Math.sin(now*.002+item.phase)*.32;
    }
  };

  return {root,solids,colliders,animate,spawnPoints:respawns};
}

export function createWorld(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x071018);
  scene.fog=new THREE.Fog(0x071018,44,120);

  const sky=new THREE.Mesh(
    new THREE.SphereGeometry(115,32,20),
    new THREE.MeshBasicMaterial({color:0x0e1a24,side:THREE.BackSide,depthWrite:false,fog:false})
  );
  scene.add(sky);

  const hemi=new THREE.HemisphereLight(0x9ec7e6,0x11130f,1.25);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xbfd7ea,1.75);
  sun.position.set(-28,38,18);
  sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-54;
  sun.shadow.camera.right=54;
  sun.shadow.camera.top=54;
  sun.shadow.camera.bottom=-54;
  sun.shadow.camera.near=1;
  sun.shadow.camera.far=125;
  scene.add(sun);

  const map=buildMap();
  scene.add(map.root);
  return {
    scene,
    obstacles:map.colliders,
    solids:map.solids,
    proceduralRoot:map.root,
    animation:{update:map.animate},
    spawnPoints:map.spawnPoints
  };
}

export function createRenderer(){
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  if("outputColorSpace" in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace=THREE.SRGBColorSpace;
  else renderer.outputEncoding=THREE.sRGBEncoding;
  if("toneMapping" in renderer && THREE.ACESFilmicToneMapping) renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.08;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function createCamera(){
  return new THREE.PerspectiveCamera(77,innerWidth/innerHeight,.05,220);
}
