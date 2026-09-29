const THREE=window.THREE;

function findNodes(root,patterns){
  const result=[];
  root.traverse(node=>{
    const name=(node.name||"").toLowerCase();
    if(patterns.some(pattern=>name.includes(pattern))) result.push(node);
  });
  return result;
}

function rememberRotation(node){
  return {x:node.rotation.x,y:node.rotation.y,z:node.rotation.z};
}

function restoreRotation(node,base){
  node.rotation.set(base.x,base.y,base.z);
}

export function createCharacterAnimator(root){
  const bones={
    head:findNodes(root,["head","neck"]).slice(0,2),
    chest:findNodes(root,["spine","chest","upperbody"]).slice(0,3),
    armL:findNodes(root,["leftarm","arm_l","upperarm_l","l_arm"]).slice(0,2),
    armR:findNodes(root,["rightarm","arm_r","upperarm_r","r_arm"]).slice(0,2),
    legL:findNodes(root,["leftleg","thigh_l","leg_l","l_leg"]).slice(0,2),
    legR:findNodes(root,["rightleg","thigh_r","leg_r","r_leg"]).slice(0,2)
  };

  const tracked=[];
  for(const group of Object.values(bones)){
    for(const node of group){
      if(!tracked.some(item=>item.node===node)) tracked.push({node,base:rememberRotation(node)});
    }
  }

  let time=Math.random()*10;
  let weight=0;
  const baseY=root.position.y;

  function update(dt,moving,speed=0,airborne=false){
    time+=dt*(moving?7.6+Math.min(speed,8)*.7:2.0);
    const targetWeight=airborne?.30:1;
    weight+=(targetWeight-weight)*Math.min(1,dt*7);
    for(const {node,base} of tracked) restoreRotation(node,base);

    const walk=moving?Math.min(1,Math.max(speed/5.6,.2)):0;
    const stride=Math.sin(time)*.50*walk*weight;
    const counter=Math.cos(time)*.09*walk*weight;
    const sway=Math.cos(time*.5)*.035*weight;
    const breath=Math.sin(time*.92)*.018*weight;

    for(const node of bones.legL) node.rotation.x+=stride;
    for(const node of bones.legR) node.rotation.x-=stride*.94;
    for(const node of bones.armL) node.rotation.x-=stride*.66;
    for(const node of bones.armR) node.rotation.x+=stride*.66;
    for(const node of bones.chest){
      node.rotation.z+=sway+counter*.10;
      node.rotation.x+=breath;
    }
    for(const node of bones.head){
      node.rotation.y+=Math.sin(time*.42)*.025*weight;
      node.rotation.z+=Math.cos(time*.7)*.018*weight;
    }
    root.position.y=baseY+Math.sin(time*.5)*.012*weight*(moving?1:.5);
  }

  return {update};
}

export function resetCharacterPose(root){
  root.position.y=0;
  root.rotation.set(0,0,0);
}
