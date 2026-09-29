const THREE=window.THREE;

const CHARACTER_URL="https://raw.githubusercontent.com/Glowin/messager/e8b1fbbe6afc7874f3a4feac66f02519261b11a3/public/models/character.glb";
const ASSETS=[
  {
    id:"character",
    label:"ОПЕРАТОР",
    url:CHARACTER_URL
  },
  {
    id:"rifle",
    label:"MP5A5",
    url:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/mp5a5_reloadable.glb"
  },
  {
    id:"pistol",
    label:"P226",
    url:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/p226_reloadable.glb"
  },
  {
    id:"sniper",
    label:"M24",
    url:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/m24_reloadable.glb"
  },
  {
    id:"map",
    label:"FALLTIDE ARRAY",
    url:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/orbital_complex/orbital_complex.glb"
  }
];

function makeStatus(){
  const list=document.getElementById("menuAssetList");
  const bar=document.getElementById("menuAssetBar");
  const percent=document.getElementById("menuAssetPercent");
  const label=document.getElementById("menuLoadingText");
  if(!list)return null;

  list.innerHTML="";
  const rows=new Map();
  for(const asset of ASSETS){
    const row=document.createElement("div");
    row.className="asset-row";
    row.innerHTML='<span>'+asset.label+'</span><b>0%</b>';
    list.appendChild(row);
    rows.set(asset.id,row);
  }

  return {
    update(id,pct,state){
      const row=rows.get(id);
      if(row){
        row.querySelector("b").textContent=state==="ready"?"ГОТОВО":state==="error"?"ОШИБКА":Math.round(pct)+"%";
        row.classList.toggle("ready",state==="ready");
        row.classList.toggle("error",state==="error");
      }
      const values=ASSETS.map(a=>a.id===id?pct:(rows.get(a.id)?.dataset?.progress?Number(rows.get(a.id).dataset.progress):0));
      if(row)row.dataset.progress=String(pct);
      const total=Array.from(rows.values()).reduce((sum,item)=>sum+Number(item.dataset.progress||0),0)/ASSETS.length;
      if(bar)bar.style.width=Math.round(total)+"%";
      if(percent)percent.textContent=Math.round(total)+"%";
      if(label)label.textContent=state==="error"?"ЧАСТЬ АССЕТОВ НЕДОСТУПНА — ИГРА ИСПОЛЬЗУЕТ FALLBACK":total>=100?"ВСЕ ОСНОВНЫЕ АССЕТЫ ЗАГРУЖЕНЫ":"ЗАГРУЗКА 3D-АССЕТОВ";
    }
  };
}

async function preload(asset,status){
  try{
    const response=await fetch(asset.url,{mode:"cors",cache:"force-cache"});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const total=Number(response.headers.get("content-length"))||0;
    if(!response.body){
      await response.arrayBuffer();
      status.update(asset.id,100,"ready");
      return true;
    }
    const reader=response.body.getReader();
    let loaded=0;
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      loaded+=value.byteLength;
      const pct=total?Math.min(99,loaded/total*100):50;
      status.update(asset.id,pct,"loading");
    }
    status.update(asset.id,100,"ready");
    return true;
  }catch(error){
    status.update(asset.id,0,"error");
    return false;
  }
}

function chooseIdle(animations){
  for(const clip of animations||[]){
    if(/idle|stand/i.test(clip.name||""))return clip;
  }
  return animations?.[0]||null;
}

function createPreview(){
  const host=document.getElementById("menuCanvasHost");
  const canvas=document.getElementById("menuCanvas");
  if(!host||!canvas||!THREE?.GLTFLoader)return {start(){},ready:Promise.resolve(false)};

  const renderer=new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    alpha:true,
    powerPreference:"high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.setSize(host.clientWidth||480,host.clientHeight||640,false);
  if("outputColorSpace" in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
  else renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,.05,20);
  camera.position.set(3.15,1.72,3.8);
  camera.lookAt(0,1.05,0);

  const key=new THREE.DirectionalLight(0xffffff,2.3);
  key.position.set(-2.5,4.5,3.5);
  key.castShadow=true;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xa9c9e8,0x161b22,1.3));

  const rim=new THREE.PointLight(0x4fb9ff,7,8,2);
  rim.position.set(2.4,1.8,-1.2);
  scene.add(rim);

  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(2.8,48),
    new THREE.MeshStandardMaterial({color:0x0e151d,roughness:.82,metalness:.22})
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.y=0;
  floor.receiveShadow=true;
  scene.add(floor);

  const ring=new THREE.Mesh(
    new THREE.RingGeometry(1.8,1.85,64),
    new THREE.MeshBasicMaterial({color:0x2c83a9,transparent:true,opacity:.42})
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.y=.015;
  scene.add(ring);

  let model=null;
  let mixer=null;
  let action=null;
  let readyResolve;
  const ready=new Promise(resolve=>readyResolve=resolve);
  const loader=new THREE.GLTFLoader();

  loader.load(
    CHARACTER_URL,
    gltf=>{
      model=gltf.scene;
      model.traverse(node=>{
        if(node.isMesh){
          node.castShadow=true;
          node.receiveShadow=true;
          const mats=Array.isArray(node.material)?node.material:[node.material];
          for(const m of mats){
            if(m?.roughness!==undefined)m.roughness=Math.max(.34,Math.min(.86,m.roughness));
          }
        }
      });

      const box=new THREE.Box3().setFromObject(model);
      const size=box.getSize(new THREE.Vector3());
      const center=box.getCenter(new THREE.Vector3());
      const scale=1.92/Math.max(size.y,.001);
      model.scale.setScalar(scale);
      model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
      scene.add(model);

      mixer=new THREE.AnimationMixer(model);
      const clip=chooseIdle(gltf.animations);
      if(clip){
        action=mixer.clipAction(clip);
        action.play();
      }
      readyResolve(true);
    },
    undefined,
    ()=>{
      readyResolve(false);
    }
  );

  function resize(){
    const w=host.clientWidth||480;
    const h=host.clientHeight||640;
    renderer.setSize(w,h,false);
    camera.aspect=w/Math.max(h,1);
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize",resize);
  resize();

  let running=false;
  function frame(now){
    if(!running)return;
    const t=now*.001;
    if(mixer)mixer.update(1/60);
    if(model){
      model.rotation.y=Math.sin(t*.25)*.15+Math.PI*.04;
      model.position.x+=Math.sin(t*.7)*.0004;
    }
    ring.rotation.z=t*.08;
    rim.intensity=6.5+Math.sin(t*1.8)*1.1;
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }

  return {
    ready,
    start(){if(!running){running=true;requestAnimationFrame(frame);}},
    resize
  };
}

export function initMainMenu(){
  const status=makeStatus();
  const preview=createPreview();
  preview.start();

  const menuStatus=document.getElementById("status");
  const launchButtons=[document.getElementById("host"),document.getElementById("join")];
  const previewReady=preview.ready;

  previewReady.then(ok=>{
    if(ok){
      if(menuStatus)menuStatus.textContent="Оператор готов. Создайте или подключитесь к комнате.";
    }else{
      if(menuStatus)menuStatus.textContent="Модель оператора не загрузилась — игра использует резервный режим.";
    }
  });

  if(status){
    Promise.all(ASSETS.map(asset=>preload(asset,status))).then(results=>{
      const loaded=results.filter(Boolean).length;
      const el=document.getElementById("menuLoadingText");
      if(el)el.textContent=loaded===ASSETS.length?"ВСЕ АССЕТЫ ЗАГРУЖЕНЫ":"ДОСТУПНО АССЕТОВ: "+loaded+"/"+ASSETS.length;
    });
  }

  window.addEventListener("beforeunload",()=>preview?.resize?.());
  return {previewReady};
}
