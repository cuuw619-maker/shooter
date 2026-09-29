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

const EXTERNAL_ENV_ASSETS={
  crates:"https://raw.githubusercontent.com/Apomera/AlloFlow/42188dba9a920270b4a88c039bee8d7f2933e996/assets/glb/crates_stacked.glb",
  barrel:"https://raw.githubusercontent.com/Apomera/AlloFlow/42188dba9a920270b4a88c039bee8d7f2933e996/assets/glb/barrel_decorated.glb",
  robot:"https://raw.githubusercontent.com/FrederickPi1969/3d-learn-digital-twins/756ec21e8b910532f311ea8b5726dc3bd621d491/warehouse-sorting-digital-twin/public/assets/kenney/robot-arm-a.glb",
  scanner:"https://raw.githubusercontent.com/FrederickPi1969/3d-learn-digital-twins/756ec21e8b910532f311ea8b5726dc3bd621d491/warehouse-sorting-digital-twin/public/assets/kenney/scanner-high.glb",
  boxLarge:"https://raw.githubusercontent.com/FrederickPi1969/3d-learn-digital-twins/756ec21e8b910532f311ea8b5726dc3bd621d491/warehouse-sorting-digital-twin/public/assets/kenney/box-large.glb"
};

function loadExternalProp(url){
  if(!THREE.GLTFLoader) return Promise.resolve(null);
  return new Promise(resolve=>{
    try{
      const loader=new THREE.GLTFLoader();
      loader.setCrossOrigin?.("anonymous");
      loader.load(url,gltf=>resolve(gltf.scene),undefined,()=>resolve(null));
    }catch(_){resolve(null);}
  });
}

function normalizeProp(model,targetHeight){
  model.traverse(o=>{
    if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}
  });
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model);
  const size=box.getSize(new THREE.Vector3());
  const scale=targetHeight/Math.max(size.y,.001);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const floorBox=new THREE.Box3().setFromObject(model);
  model.position.y-=floorBox.min.y;
  return model;
}

async function addExternalEnvironmentProps(root){
  const [crateAsset,barrelAsset,robotAsset,scannerAsset,boxLargeAsset]=await Promise.all([
    loadExternalProp(EXTERNAL_ENV_ASSETS.crates),
    loadExternalProp(EXTERNAL_ENV_ASSETS.barrel),
    loadExternalProp(EXTERNAL_ENV_ASSETS.robot),
    loadExternalProp(EXTERNAL_ENV_ASSETS.scanner),
    loadExternalProp(EXTERNAL_ENV_ASSETS.boxLarge)
  ]);

  if(crateAsset){
    const model=normalizeProp(crateAsset,1.75);
    for(const [x,y,z,r] of [[-34,0,-5,.15],[-34,0,5,-.12],[34,0,-5,-.15],[34,0,5,.18]]){
      const copy=model.clone(true);
      copy.position.set(x,y,z);
      copy.rotation.y=r;
      copy.name="CC0_KAYKIT_CRATES";
      root.add(copy);
    }
  }

  if(barrelAsset){
    const model=normalizeProp(barrelAsset,1.25);
    for(const [x,y,z,r] of [[-35,0,-15,0],[35,0,15,.2],[-15,0,35,.5],[15,0,-35,-.4]]){
      const copy=model.clone(true);
      copy.position.set(x,y,z);
      copy.rotation.y=r;
      copy.name="CC0_KAYKIT_BARREL";
      root.add(copy);
    }
  }

  if(robotAsset){
    const model=normalizeProp(robotAsset,1.7);
    for(const [x,z,r] of [[-20,-15,0],[-24,-15,Math.PI]]){
      const copy=model.clone(true);
      copy.position.set(x,.05,z);copy.rotation.y=r;copy.name="CC0_KENNEY_ROBOT_ARM";root.add(copy);
    }
  }

  if(scannerAsset){
    const model=normalizeProp(scannerAsset,2.0);
    for(const [x,z] of [[17,4],[27,4]]){
      const copy=model.clone(true);
      copy.position.set(x,.05,z);copy.name="CC0_KENNEY_SCANNER";root.add(copy);
    }
  }

  if(boxLargeAsset){
    const model=normalizeProp(boxLargeAsset,.95);
    for(const [x,z] of [[-29,13],[-31,10],[29,-13]]){
      const copy=model.clone(true);
      copy.position.set(x,.02,z);
      copy.rotation.y=(x+z)*.04;
      copy.name="CC0_KENNEY_FACTORY_BOX";
      root.add(copy);
    }
  }

  return Boolean(crateAsset||barrelAsset||robotAsset||scannerAsset||boxLargeAsset);
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
  addBox(root,[],colliders,{x:0,y:2.5,z:-41,sx:82,sy:5,sz:.7,material:wall,name:"boundary_n"});
  addBox(root,[],colliders,{x:0,y:2.5,z:41,sx:82,sy:5,sz:.7,material:wall,name:"boundary_s"});
  addBox(root,[],colliders,{x:-41,y:2.5,z:0,sx:.7,sy:5,sz:82,material:wall,name:"boundary_w"});
  addBox(root,[],colliders,{x:41,y:2.5,z:0,sx:.7,sy:5,sz:82,material:wall,name:"boundary_e"});

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

  const environmentAssetPromise=addExternalEnvironmentProps(root);

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

  return {root,solids,colliders,animate,spawnPoints:respawns,environmentAssetPromise};
}

const READY_MAP_BASE="https://raw.githubusercontent.com/RAPHCVR/Krunker/0ce0423004c117daac9b2b0a6d94d90ff5ffde5a/apps/client/public/assets/maps/kenney-industrial/";
const READY_MAP_SCALE=1.65;
const READY_MAP_SPECS=[
  ["building-a.glb",-31,0,-24,Math.PI*.5,2.2,0xc4b79a],
  ["building-b.glb",31,0,24,-Math.PI*.5,2.2,0xaebec0],
  ["building-c.glb",-31,0,24,Math.PI*.5,2.2,0xb8b8ad],
  ["building-h.glb",-22,0,-10,Math.PI*.5,3.8,0x5c9a83],
  ["building-e.glb",31,0,-24,-Math.PI*.5,2.2,0x9fb0a4],
  ["building-f.glb",-14,0,-28,0,2.1,0xb5ad9a],
  ["building-g.glb",14,0,28,Math.PI,2.1,0xadb7c1],
  ["building-k.glb",22,0,10,-Math.PI*.5,3.8,0x9b6fbc],
  ["building-d.glb",-20,0,17,0,3.6,0xc7b58f],
  ["building-i.glb",-14,0,28,0,2.1,0xb3b8b0],
  ["building-j.glb",14,0,-28,Math.PI,2.1,0xa9b7bd],
  ["building-p.glb",20,0,-17,Math.PI,3.6,0xd1c4aa],
  ["building-l.glb",-8,0,-13,Math.PI*.5,2.0,0xb0b6a6],
  ["building-m.glb",8,0,13,-Math.PI*.5,2.0,0xbec7cf],
  ["building-o.glb",0,0,0,Math.PI*.25,3.4,0xd1a45b],
  ["building-n.glb",-8,0,13,Math.PI*.5,2.0,0xb4afa0],
  ["building-q.glb",8,0,-13,-Math.PI*.5,2.0,0xabb8b5],
  ["building-r.glb",-25,0,-32,0,1.9,0xc8b282],
  ["building-s.glb",0,0,38,Math.PI,3.1,0x6ca4c7],
  ["building-t.glb",25,0,32,Math.PI,1.9,0xaeb4a0],
  ["chimney-basic.glb",34,0,0,0,2.3,0xb6bdc3],
  ["chimney-large.glb",0,0,-27,0,3.8,0xc8ced0],
  ["chimney-medium.glb",0,0,27,0,2.8,0xbfc7c9],
  ["chimney-small.glb",-34,0,0,0,2.3,0xb7c0c3],
  ["detail-tank.glb",28,0,-27,Math.PI*.5,2.2,0xbdb56f]
];

function tintReadyMaterial(material,tint){
  if(Array.isArray(material)) return material.map(m=>tintReadyMaterial(m,tint));
  const clone=material?.clone?material.clone():material;
  // Preserve the source textures but give each building a clearly readable CS-like palette.
  if(clone?.color?.lerp && tint) clone.color.lerp(new THREE.Color(tint),.18);
  return clone;
}

function addReadyCollider(solids,colliders,{x,y,z,sx,sy,sz,angle=0,name="ready_collision"}){
  const material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
  x*=READY_MAP_SCALE;y*=READY_MAP_SCALE;z*=READY_MAP_SCALE;
  sx*=READY_MAP_SCALE;sy*=READY_MAP_SCALE;sz*=READY_MAP_SCALE;
  mesh.position.set(x,y,z);mesh.rotation.y=angle;mesh.name=name;
  mesh.updateMatrixWorld(true);
  solids.push(mesh);
  colliders.push({
    x,z,halfX:Math.abs(sx)/2,halfZ:Math.abs(sz)/2,angle,
    minY:y-sy/2,maxY:y+sy/2,source:mesh
  });
  return mesh;
}

function addReadyMapColliders(solids,colliders){
  addReadyCollider(solids,colliders,{x:0,y:1.5,z:-42.5,sx:86,sy:3,sz:1,name:"ready_boundary_n"});
  addReadyCollider(solids,colliders,{x:0,y:1.5,z:42.5,sx:86,sy:3,sz:1,name:"ready_boundary_s"});
  addReadyCollider(solids,colliders,{x:-42.5,y:1.5,z:0,sx:1,sy:3,sz:86,name:"ready_boundary_w"});
  addReadyCollider(solids,colliders,{x:42.5,y:1.5,z:0,sx:1,sy:3,sz:86,name:"ready_boundary_e"});
  const coverBoxes=[
    [-0,0.55,-18,8,1.1,3.5,0],[-0,0.55,18,8,1.1,3.5,0],
    [-18,0.55,0,3.5,1.1,8,0],[18,0.55,0,3.5,1.1,8,0],
    [-25,0.9,32,9,1.8,2.6,0],[25,0.9,-32,9,1.8,2.6,0],
    [-6,1.15,-36,11,2.3,2.4,0],[6,1.15,36,11,2.3,2.4,0],
    [-38,1.15,-12,2.4,2.3,8,0],[38,1.15,12,2.4,2.3,8,0],
    [-38,1.15,12,2.4,2.3,8,0],[38,1.15,-12,2.4,2.3,8,0]
  ];
  for(const [x,y,z,sx,sy,sz,angle] of coverBoxes) addReadyCollider(solids,colliders,{x,y,z,sx,sy,sz,angle,name:"ready_cover"});

  const assetColliders=[
    [-31,1.62,-24,2.7,3.2,4.5,Math.PI*.5,"building-a"],
    [31.02,1.62,24,2.7,3.2,4.5,-Math.PI*.5,"building-b"],
    [-30.69,1.38,23.79,4.6,2.7,4.1,Math.PI*.5,"building-c"],
    [-20.94,1.39,-7.79,4.9,2.8,5,Math.PI*.5,"building-h"],
    [30.45,1.81,-24,2.8,3.6,3.7,-Math.PI*.5,"building-e"],
    [-14.95,2.02,-27.47,3.7,4,2.7,0,"building-f"],
    [14,1.34,28,3.5,2.7,2.7,Math.PI,"building-g"],
    [22.03,1.47,10,3.5,2.9,4.9,-Math.PI*.5,"building-k"],
    [-20,2.55,16.68,3.2,5.1,5.1,0,"building-d"],
    [-14.91,.77,28.58,2.1,1.5,2.7,0,"building-i"],
    [14.91,.9,-28.58,2.1,1.8,2.7,Math.PI,"building-j"],
    [20,1.29,-17,6,2.6,3.6,Math.PI,"building-p"],
    [-7.55,1.92,-12.16,3.7,3.8,4.1,Math.PI*.5,"building-l"],
    [8,1.52,13,3.4,3,2.6,-Math.PI*.5,"building-m"],
    [.43,1.56,2.55,5.1,3.1,5.1,Math.PI*.25,"building-o"],
    [-6.88,1.9,13.9,2.8,3.8,2,Math.PI*.5,"building-n"],
    [7.98,.88,-13.46,3.5,1.8,4.3,-Math.PI*.5,"building-q"],
    [-25,1.32,-32,4.7,2.6,2.4,0,"building-r"],
    [.03,1.3,38,6.5,2.6,2.8,Math.PI,"building-s"],
    [25,.96,32,3.3,1.9,2.6,Math.PI,"building-t"],
    [34,1.15,0,.7,2.3,.7,0,"chimney-basic"],
    [0,3.23,-27,3.8,6.4,3.8,0,"chimney-large"],
    [0,2.69,27,1.3,5.4,1.3,0,"chimney-medium"],
    [-34,.86,0,.8,1.7,.8,0,"chimney-small"],
    [28,.46,-27,1.2,.9,1.9,Math.PI*.5,"detail-tank"]
  ];
  for(const [x,y,z,sx,sy,sz,angle,label] of assetColliders){
    addReadyCollider(solids,colliders,{x,y,z,sx,sy,sz,angle,name:"ready_asset_"+label});
  }
}

async function addReadyIndustrialMap(scene,solids,colliders){
  const group=new THREE.Group();
  group.name="READY_CC0_INDUSTRIAL_ASSET_YARD";
  scene.add(group);

  const floor=new THREE.Mesh(
    new THREE.BoxGeometry(84*READY_MAP_SCALE,.24*READY_MAP_SCALE,84*READY_MAP_SCALE),
    new THREE.MeshStandardMaterial({
      color:0x66645a,
      roughness:.82,
      metalness:.045
    })
  );
  floor.position.y=-.12*READY_MAP_SCALE;floor.receiveShadow=true;floor.name="ready_map_floor";group.add(floor);

  addReadyMapColliders(solids,colliders);

  const queue=[...READY_MAP_SPECS];
  let loaded=0,failed=0,next=0;
  const worker=async()=>{
    while(next<queue.length){
      const item=queue[next++];
      const [file,x,y,z,rotation,scale,tint]=item;
      try{
        const source=await loadExternalProp(READY_MAP_BASE+file);
        if(!source){failed++;continue;}
        const object=source.clone(true);
        object.name="READY_"+file.replace(/\\.glb$/i,"").toUpperCase();
        object.position.set(x*READY_MAP_SCALE,y*READY_MAP_SCALE,z*READY_MAP_SCALE);
        object.rotation.y=rotation;
        object.scale.setScalar(scale*READY_MAP_SCALE);
        object.traverse(o=>{
          if(!o.isMesh)return;
          o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true;
          if(o.material)o.material=tintReadyMaterial(o.material,tint);
        });
        object.updateMatrixWorld(true);
        const bounds=new THREE.Box3().setFromObject(object);
        if(Number.isFinite(bounds.min.y)) object.position.y+=y-bounds.min.y;
        group.add(object);
        loaded++;
      }catch(_){failed++;}
    }
  };
  await Promise.all([worker(),worker(),worker(),worker()]);
  group.userData.assetStatus={loaded,failed,total:queue.length};
  return {group,loaded,failed,total:queue.length};
}

export function createWorld(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x182531);
  scene.fog=new THREE.Fog(0x182531,58,190);

  const sky=new THREE.Mesh(
    new THREE.SphereGeometry(115,32,20),
    new THREE.MeshBasicMaterial({color:0x0d1822,side:THREE.BackSide,depthWrite:false,fog:false})
  );
  scene.add(sky);

  const hemi=new THREE.HemisphereLight(0xd6ecff,0x3b3a2d,1.8);
  scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe2b4,2.45);
  sun.position.set(-30,42,22);
  sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-88;sun.shadow.camera.right=88;
  sun.shadow.camera.top=88;sun.shadow.camera.bottom=-88;
  sun.shadow.camera.near=1;sun.shadow.camera.far=140;
  scene.add(sun);

  const solids=[],colliders=[],animations=[];
  const readyMapPromise=addReadyIndustrialMap(scene,solids,colliders);

  const lightRig=new THREE.Group();
  lightRig.name="READY_MAP_LIGHT_RIG";
  scene.add(lightRig);
  const lightColors=[0x52a7ff,0xff9c52,0x5bd38d,0xb983ff,0x5fd8ff,0xff657a];
  for(let i=0;i<8;i++){
    const x=-28+(i%4)*18,z=-30+Math.floor(i/4)*60;
    const p=new THREE.PointLight(lightColors[i%lightColors.length],1.45,24,2);
    p.position.set(x,6,z);lightRig.add(p);
    animations.push({type:"point",light:p,phase:i*.8});
  }

  const objective=new THREE.Group();
  objective.name="READY_OBJECTIVE";
  objective.position.set(0,0,0);
  const objectiveBase=new THREE.Mesh(new THREE.CylinderGeometry(2.4,.0,0.36,20),new THREE.MeshStandardMaterial({color:0x20272c,metalness:.45,roughness:.45}));
  objectiveBase.position.y=.18;objective.add(objectiveBase);
  const objectiveCore=new THREE.Mesh(
    new THREE.OctahedronGeometry(.52,1),
    new THREE.MeshStandardMaterial({color:0xdff7ff,emissive:0x52bfff,emissiveIntensity:3.2,roughness:.16,metalness:.2})
  );
  objectiveCore.position.y=1.55;objective.add(objectiveCore);
  const objectiveRing=new THREE.Mesh(
    new THREE.TorusGeometry(1.25,.055,10,40),
    new THREE.MeshStandardMaterial({color:0x76caff,emissive:0x2f8fd2,emissiveIntensity:2.1,roughness:.25,metalness:.1})
  );
  objectiveRing.rotation.x=Math.PI/2;objectiveRing.position.y=1.55;objective.add(objectiveRing);
  const objectiveLight=new THREE.PointLight(0x55b9ff,2.4,12,2);
  objectiveLight.position.set(0,1.6,0);objective.add(objectiveLight);
  scene.add(objective);
  animations.push({type:"objective",ring:objectiveRing,core:objectiveCore,light:objectiveLight});

  const animate=(dt,now)=>{
    for(const item of animations){
      if(item.type==="objective"){
        item.ring.rotation.z+=dt*.85;
        item.core.rotation.y+=dt*1.5;
        item.core.rotation.x+=dt*.58;
        item.light.intensity=2.0+Math.sin(now*.004)*.55;
      }else if(item.type==="point"){
        item.light.intensity=1.25+Math.sin(now*.002+item.phase)*.28;
      }
    }
  };

  const spawnPoints=[
    {host:[-39*READY_MAP_SCALE,-34*READY_MAP_SCALE],guest:[39*READY_MAP_SCALE,34*READY_MAP_SCALE]},
    {host:[-39*READY_MAP_SCALE,34*READY_MAP_SCALE],guest:[39*READY_MAP_SCALE,-34*READY_MAP_SCALE]},
    {host:[-36*READY_MAP_SCALE,-20*READY_MAP_SCALE],guest:[36*READY_MAP_SCALE,20*READY_MAP_SCALE]},
    {host:[-36*READY_MAP_SCALE,20*READY_MAP_SCALE],guest:[36*READY_MAP_SCALE,-20*READY_MAP_SCALE]}
  ];
  return {
    scene,
    obstacles:colliders,
    solids,
    proceduralRoot:null,
    animation:{update:animate},
    spawnPoints,
    environmentAssetPromise:readyMapPromise
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
