const THREE=window.THREE;

export const ASSET_CATALOG={
  character:{
    label:"ОПЕРАТОР",
    local:"./assets/operator/character.glb",
    remote:"https://raw.githubusercontent.com/Glowin/messager/e8b1fbbe6afc7874f3a4feac66f02519261b11a3/public/models/character.glb"
  },
  rifle:{
    label:"MP5A5",
    local:"./assets/weapons/mp5a5_reloadable.glb",
    remote:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/mp5a5_reloadable.glb"
  },
  pistol:{
    label:"P226",
    local:"./assets/weapons/p226_reloadable.glb",
    remote:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/p226_reloadable.glb"
  },
  sniper:{
    label:"M24",
    local:"./assets/weapons/m24_reloadable.glb",
    remote:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/steel_tide_reloadable_weapons/m24_reloadable.glb"
  },
  map:{
    label:"FALLTIDE ARRAY",
    local:"./assets/maps/falltide_recovery_array.glb",
    remote:"https://raw.githubusercontent.com/AetherRadar/operation-steel-tide/2084aafce812eb75169d68b25eba7290b6c57f70/assets/models/orbital_complex/orbital_complex.glb"
  }
};

const binaryCache=new Map();
const binaryPromises=new Map();

function entryFor(idOrUrl){
  if(ASSET_CATALOG[idOrUrl])return {id:idOrUrl,...ASSET_CATALOG[idOrUrl]};
  return {id:idOrUrl,label:idOrUrl,local:idOrUrl,remote:null};
}

async function fetchBinary(url,onProgress){
  const cached=binaryCache.get(url);
  if(cached)return cached;

  const existing=binaryPromises.get(url);
  if(existing)return existing;

  const promise=(async()=>{
    const response=await fetch(url,{mode:"cors",cache:"force-cache"});
    if(!response.ok)throw new Error("HTTP "+response.status+" for "+url);

    const total=Number(response.headers.get("content-length"))||0;
    let loaded=0;

    if(!response.body){
      const buffer=await response.arrayBuffer();
      binaryCache.set(url,buffer);
      onProgress?.(100);
      return buffer;
    }

    const reader=response.body.getReader();
    const chunks=[];
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      chunks.push(value);
      loaded+=value.byteLength;
      onProgress?.(total?Math.min(99,loaded/total*100):null);
    }

    const buffer=new Uint8Array(loaded);
    let offset=0;
    for(const chunk of chunks){
      buffer.set(chunk,offset);
      offset+=chunk.byteLength;
    }
    const result=buffer.buffer;
    binaryCache.set(url,result);
    onProgress?.(100);
    return result;
  })();

  binaryPromises.set(url,promise);
  try{
    return await promise;
  }finally{
    binaryPromises.delete(url);
  }
}

async function fetchWithFallback(entry,onProgress){
  let localError=null;
  if(entry.local){
    try{
      return {url:entry.local,buffer:await fetchBinary(entry.local,onProgress),local:true};
    }catch(error){
      localError=error;
    }
  }
  if(entry.remote){
    try{
      return {url:entry.remote,buffer:await fetchBinary(entry.remote,onProgress),local:false};
    }catch(error){
      throw new Error("Asset "+entry.id+" unavailable (local: "+(localError?.message||"n/a")+"; remote: "+(error?.message||"n/a")+")");
    }
  }
  throw localError||new Error("No asset URL for "+entry.id);
}

function basePath(url){
  const index=url.lastIndexOf("/");
  return index>=0?url.slice(0,index+1):"";
}

export async function loadAssetGLTF(idOrUrl,onProgress){
  if(!THREE?.GLTFLoader)throw new Error("GLTFLoader is not available");
  const entry=entryFor(idOrUrl);
  const loaded=await fetchWithFallback(entry,onProgress);
  const loader=new THREE.GLTFLoader();
  return await new Promise((resolve,reject)=>{
    loader.parse(
      loaded.buffer,
      basePath(loaded.url),
      gltf=>{
        gltf.userData={...(gltf.userData||{}),assetUrl:loaded.url,usedLocalAsset:loaded.local};
        resolve(gltf);
      },
      reject
    );
  });
}

export async function preloadAsset(id,onProgress){
  try{
    const entry=entryFor(id);
    await fetchWithFallback(entry,onProgress);
    return true;
  }catch(_){
    return false;
  }
}

export function assetURL(id){
  const entry=entryFor(id);
  return entry.local||entry.remote;
}

export function getAssetEntry(id){
  const entry=entryFor(id);
  return {id:entry.id,label:entry.label,local:entry.local,remote:entry.remote};
}

export function clearAssetCaches(){
  binaryCache.clear();
  binaryPromises.clear();
}
