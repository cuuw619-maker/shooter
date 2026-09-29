import {getAssetEntry,loadAssetGLTF,preloadAsset} from "../game/asset-loader.js?v=20260929-1";

const THREE=window.THREE;
const ASSET_IDS=["character","rifle","pistol","sniper","map"];

function makeStatus(){
  const list=document.getElementById("menuAssetList");
  const bar=document.getElementById("menuAssetBar");
  const percent=document.getElementById("menuAssetPercent");
  const label=document.getElementById("menuLoadingText");
  if(!list)return null;

  list.innerHTML="";
  const rows=new Map();

  for(const id of ASSET_IDS){
    const asset=getAssetEntry(id);
    const row=document.createElement("div");
    row.className="asset-row";
    row.dataset.progress="0";
    row.innerHTML="<span>"+asset.label+"</span><b>0%</b>";
    list.appendChild(row);
    rows.set(id,row);
  }

  const refreshTotal=()=>{
    const total=[...rows.values()].reduce(
      (sum,row)=>sum+Number(row.dataset.progress||0),0
    )/Math.max(rows.size,1);

    if(bar)bar.style.width=Math.round(total)+"%";
    if(percent)percent.textContent=Math.round(total)+"%";
    return total;
  };

  return {
    update(id,pct,state){
      const row=rows.get(id);
      if(!row)return;
      const safePct=pct==null?Number(row.dataset.progress||0):Math.max(0,Math.min(100,pct));
      row.dataset.progress=String(safePct);
      row.querySelector("b").textContent=
        state==="ready"?"ГОТОВО":
        state==="error"?"ОШИБКА":
        pct==null?"ЗАГРУЗКА":Math.round(safePct)+"%";
      row.classList.toggle("ready",state==="ready");
      row.classList.toggle("error",state==="error");

      const total=refreshTotal();
      if(label){
        label.textContent=state==="error"
          ?"ЧАСТЬ АССЕТОВ НЕДОСТУПНА — ИСПОЛЬЗУЕТСЯ FALLBACK"
          :total>=100
            ?"ВСЕ ОСНОВНЫЕ АССЕТЫ ГОТОВЫ"
            :"ЗАГРУЗКА 3D-АССЕТОВ";
      }
    }
  };
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
  if(!host||!canvas||!THREE?.GLTFLoader){
    return {start(){},ready:Promise.resolve(false)};
  }

  const renderer=new THREE.WebGLRenderer({
    canvas,
    antialias:true,
    alpha:true,
    powerPreference:"high-performance"
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  if("outputColorSpace" in renderer&&THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
  else renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,.05,20);
  camera.position.set(3.05,1.72,3.75);
  camera.lookAt(0,1.03,0);

  const key=new THREE.DirectionalLight(0xffffff,2.35);
  key.position.set(-2.6,4.8,3.6);
  key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  scene.add(key);

  scene.add(new THREE.HemisphereLight(0xa9c9e8,0x10151b,1.35));

  const rim=new THREE.PointLight(0x4fb9ff,7,8,2);
  rim.position.set(2.4,1.8,-1.2);
  scene.add(rim);

  const floor=new THREE.Mesh(
    new THREE.CircleGeometry(2.8,64),
    new THREE.MeshStandardMaterial({color:0x0e151d,roughness:.82,metalness:.22})
  );
  floor.rotation.x=-Math.PI/2;
  floor.receiveShadow=true;
  scene.add(floor);

  const ring=new THREE.Mesh(
    new THREE.RingGeometry(1.82,1.88,72),
    new THREE.MeshBasicMaterial({color:0x2c83a9,transparent:true,opacity:.46})
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.y=.015;
  scene.add(ring);

  const backGlow=new THREE.Mesh(
    new THREE.CircleGeometry(2.5,64),
    new THREE.MeshBasicMaterial({color:0x102b3a,transparent:true,opacity:.24})
  );
  backGlow.position.set(0,1.55,-1.8);
  backGlow.rotation.x=-Math.PI/2;
  scene.add(backGlow);

  let model=null;
  let mixer=null;
  let readyResolve;
  const ready=new Promise(resolve=>readyResolve=resolve);

  loadAssetGLTF("character").then(gltf=>{
    model=gltf.scene;
    model.traverse(node=>{
      if(!node.isMesh)return;
      node.castShadow=true;
      node.receiveShadow=true;
      const mats=Array.isArray(node.material)?node.material:[node.material];
      for(const m of mats){
        if(m?.roughness!==undefined)m.roughness=Math.max(.34,Math.min(.86,m.roughness));
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
      const action=mixer.clipAction(clip);
      action.reset();
      action.play();
    }
    readyResolve(true);
  }).catch(()=>{
    readyResolve(false);
  });

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
  let previous=performance.now();

  function frame(now){
    if(!running)return;
    const dt=Math.min(.05,(now-previous)/1000);
    previous=now;
    const t=now*.001;

    if(mixer)mixer.update(dt);
    if(model){
      model.rotation.y=Math.sin(t*.25)*.15+Math.PI*.04;
      model.position.x=Math.sin(t*.7)*.012;
    }
    ring.rotation.z=t*.08;
    rim.intensity=6.5+Math.sin(t*1.8)*1.1;
    renderer.render(scene,camera);
    requestAnimationFrame(frame);
  }

  return {
    ready,
    start(){
      if(running)return;
      running=true;
      previous=performance.now();
      requestAnimationFrame(frame);
    },
    resize
  };
}

async function warmAssets(status){
  const foreground=["character","rifle","pistol","sniper"];
  const background=["map"];

  await Promise.all(foreground.map(async id=>{
    const ok=await preloadAsset(id,pct=>status?.update(id,pct,"loading"));
    status?.update(id,ok?100:0,ok?"ready":"error");
    return ok;
  }));

  for(const id of background){
    const ok=await preloadAsset(id,pct=>status?.update(id,pct,"loading"));
    status?.update(id,ok?100:0,ok?"ready":"error");
  }
}

export function initMainMenu(){
  const status=makeStatus();
  const preview=createPreview();
  preview.start();

  const menuStatus=document.getElementById("status");
  preview.ready.then(ok=>{
    if(!menuStatus)return;
    menuStatus.textContent=ok
      ?"Оператор загружен. Создайте или подключитесь к комнате."
      :"Модель оператора недоступна — будет использован резервный режим.";
  });

  if(status){
    warmAssets(status).then(()=>{
      const el=document.getElementById("menuLoadingText");
      if(el){
        const failed=[...document.querySelectorAll(".asset-row.error")].length;
        el.textContent=failed
          ?"ЧАСТЬ АССЕТОВ НЕ ЗАГРУЖЕНА — FALLBACK АКТИВЕН"
          :"ВСЕ ОСНОВНЫЕ АССЕТЫ ГОТОВЫ";
      }
    });
  }

  return {previewReady:preview.ready};
}
