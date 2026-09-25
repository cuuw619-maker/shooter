const THREE = window.THREE;

export const WEAPONS = {
  rifle:  {
    name:"RIFLE", mag:30, reserve:90, damage:24, rate:105,
    reload:1900, spread:0.018, recoil:0.035, automatic:true, adsFov:60
  },
  pistol: {
    name:"PISTOL", mag:12, reserve:48, damage:34, rate:260,
    reload:1300, spread:0.012, recoil:0.055, automatic:false, adsFov:60
  },
  sniper: {
    name:"AWP", mag:5, reserve:20, damage:100, rate:1100,
    reload:2350, spread:0.0014, recoil:0.16, automatic:false, adsFov:28
  }
};

export function createWeaponSystem(camera) {
  const root = new THREE.Group();
  root.position.set(0.42, -0.34, -0.72);
  camera.add(root);

  const state = {};
  for (const id of Object.keys(WEAPONS)) state[id] = {
    mag: WEAPONS[id].mag,
    reserve: WEAPONS[id].reserve
  };

  let current = "rifle";
  let lastShot = -Infinity;
  let reloading = false;
  let reloadTimer = null;
  let recoil = 0;
  let aiming = false;
  let boltTimer = null;

  function material(color, metal=0.35, roughness=0.45) {
    return new THREE.MeshStandardMaterial({color, metalness:metal, roughness});
  }

  function addMuzzle(g, z) {
    const muzzle = new THREE.Object3D();
    muzzle.position.z = z;
    g.add(muzzle);
    g.userData.muzzle = muzzle;
  }

  function addArms(g) {
    const skin = material(0xb77d62, 0, 0.86);
    const glove = material(0x1a1f25, 0.1, 0.8);
    const left = new THREE.Mesh(new THREE.BoxGeometry(.11,.12,.48), skin);
    const right = new THREE.Mesh(new THREE.BoxGeometry(.11,.12,.48), skin);
    left.position.set(-.12,-.15,.20);
    right.position.set(.12,-.15,.20);
    left.rotation.y = .12;
    right.rotation.y = -.12;

    const gloveL = new THREE.Mesh(new THREE.BoxGeometry(.13,.12,.16), glove);
    const gloveR = gloveL.clone();
    gloveL.position.set(-.12,-.15,-.05);
    gloveR.position.set(.12,-.15,-.05);
    g.add(left,right,gloveL,gloveR);
  }

  function build(id) {
    const g = new THREE.Group();

    if (id === "rifle") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(.28,.22,.78), material(0x1b2026));
      body.position.z=-.18;
      const upper = new THREE.Mesh(new THREE.BoxGeometry(.22,.10,.60), material(0x353d46));
      upper.position.set(0,.11,-.20);
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(.19,.16,.55), material(0x252b31));
      handguard.position.set(0,.01,-.62);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.032,.036,.72,12), material(0x11151a,.55,.36));
      barrel.rotation.x=Math.PI/2;
      barrel.position.z=-1.03;
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.10,10), material(0x090b0e,.6,.3));
      muzzle.rotation.x=Math.PI/2;
      muzzle.position.z=-1.38;
      const mag = new THREE.Mesh(new THREE.BoxGeometry(.13,.30,.17), material(0x20252b));
      mag.rotation.x=-.12;
      mag.position.set(0,-.18,-.05);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(.20,.16,.38), material(0x4a3022,0,.7));
      stock.position.z=.38;
      const grip = new THREE.Mesh(new THREE.BoxGeometry(.12,.30,.13), material(0x30343a));
      grip.rotation.x=-.22;
      grip.position.set(0,-.20,.10);
      const sight = new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.22), material(0x11151a,.4,.32));
      sight.position.set(0,.18,-.58);
      g.add(body,upper,handguard,barrel,muzzle,mag,stock,grip,sight);
      addMuzzle(g,-1.46);
    } else if (id === "pistol") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(.20,.17,.45), material(0x20252b));
      body.position.z=-.12;
      const slide = new THREE.Mesh(new THREE.BoxGeometry(.21,.105,.38), material(0x454d57,.55,.38));
      slide.position.set(0,.09,-.15);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.024,.024,.34,10), material(0x12161a,.55,.34));
      barrel.rotation.x=Math.PI/2;
      barrel.position.z=-.55;
      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(.034,.034,.07,10), material(0x090b0e,.6,.3));
      muzzle.rotation.x=Math.PI/2;
      muzzle.position.z=-.72;
      const mag = new THREE.Mesh(new THREE.BoxGeometry(.12,.26,.13), material(0x24292f));
      mag.position.set(0,-.19,.02);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(.14,.29,.15), material(0x24282d));
      grip.rotation.x=-.16;
      grip.position.set(0,-.20,.05);
      const sight = new THREE.Mesh(new THREE.BoxGeometry(.04,.045,.13), material(0x11151a,.4,.32));
      sight.position.set(0,.17,-.30);
      g.add(body,slide,barrel,muzzle,mag,grip,sight);
      addMuzzle(g,-.77);
    } else {
      // Stylized AWP: long receiver + heavy barrel + large optic.
      const body = new THREE.Mesh(new THREE.BoxGeometry(.22,.20,1.08), material(0x171c22,.35,.48));
      body.position.z=-.20;
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(.18,.16,.50), material(0x303740,.65,.34));
      receiver.position.set(0,-.01,-.64);

      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(.065,.075,.55,16), material(0x0b1014,.78,.24));
      scopeTube.rotation.x=Math.PI/2;
      scopeTube.position.set(0,.19,-.50);

      const scopeFront = new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.07,16), material(0x11171d,.8,.22));
      scopeFront.rotation.x=Math.PI/2;
      scopeFront.position.set(0,.19,-.81);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(.061,.061,.028,16),
        new THREE.MeshStandardMaterial({
          color:0x163446, metalness:.35, roughness:.18, emissive:0x06202c, emissiveIntensity:.8
        })
      );
      lens.rotation.x=Math.PI/2;
      lens.position.set(0,.19,-.855);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.034,.040,.84,14), material(0x0d1115,.62,.28));
      barrel.rotation.x=Math.PI/2;
      barrel.position.z=-1.28;

      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.12,12), material(0x080a0c,.7,.22));
      muzzle.rotation.x=Math.PI/2;
      muzzle.position.z=-1.76;

      const stock = new THREE.Mesh(new THREE.BoxGeometry(.20,.18,.46), material(0x3e2a20,.05,.72));
      stock.position.z=.46;
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(.16,.08,.28), material(0x4c3426,.05,.72));
      cheek.position.set(0,.12,.32);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(.12,.30,.14), material(0x242b32));
      grip.rotation.x=-.20;
      grip.position.set(0,-.20,.10);

      g.add(body,receiver,scopeTube,scopeFront,lens,barrel,muzzle,stock,cheek,grip);
      addMuzzle(g,-1.82);
    }

    addArms(g);
    return g;
  }

  const models = {};
  for (const id of Object.keys(WEAPONS)) {
    models[id] = build(id);
    models[id].visible = false;
    root.add(models[id]);
  }
  models[current].visible = true;

  function equip(id) {
    if (!WEAPONS[id] || id === current || reloading) return false;
    models[current].visible = false;
    current = id;
    models[current].visible = true;
    recoil = 0;
    aiming = false;
    return true;
  }

  function setAim(value) {
    const allowed = current === "sniper" && !reloading;
    aiming = Boolean(value && allowed);
  }

  function reload(now=performance.now()) {
    if (reloading) return false;
    const cfg=WEAPONS[current], ammo=state[current];
    if (ammo.mag>=cfg.mag || ammo.reserve<=0) return false;
    reloading=true;
    aiming=false;
    reloadTimer=now+cfg.reload;
    return true;
  }

  function tick(now=performance.now(), events={}) {
    if (reloading && now>=reloadTimer) {
      const cfg=WEAPONS[current], ammo=state[current];
      const need=cfg.mag-ammo.mag;
      const take=Math.min(need,ammo.reserve);
      ammo.mag+=take;
      ammo.reserve-=take;
      reloading=false;
      reloadTimer=null;
      events.onReloadComplete?.(current);
    }

    if (boltTimer && now >= boltTimer) {
      boltTimer = null;
      events.onBolt?.();
    }

    recoil*=0.82;
    const breath = Math.sin(now*0.0028) * 0.002;
    root.position.x=0.42 + (aiming ? -0.15 : 0) + Math.sin(now*0.004)*0.003;
    root.position.y=-0.34 + (aiming ? 0.02 : 0) + Math.abs(Math.cos(now*0.004))*0.001;
    root.position.z=-0.72 + (aiming ? -0.18 : 0) + recoil;
    root.position.y += breath;
    root.rotation.x=recoil*0.8;
  }

  function fire({now=performance.now(), raycaster, camera, remoteMesh, obstacles=[], triggerPressed=false, onShot, onDry, onReload, onHit}) {
    const cfg=WEAPONS[current], ammo=state[current];
    if (!cfg.automatic && !triggerPressed) return false;
    if (reloading || now-lastShot<cfg.rate) return false;

    if (ammo.mag<=0) {
      onDry?.();
      if (reload(now)) onReload?.();
      return false;
    }

    lastShot=now;
    ammo.mag--;
    recoil=cfg.recoil;

    const spreadMultiplier = aiming && current === "sniper" ? 0.18 : 1;
    const spreadX=(Math.random()-.5)*cfg.spread*spreadMultiplier;
    const spreadY=(Math.random()-.5)*cfg.spread*spreadMultiplier;
    raycaster.setFromCamera({x:spreadX,y:spreadY},camera);

    const from=camera.getWorldPosition(new THREE.Vector3());
    const direction=raycaster.ray.direction.clone().normalize();
    const targets=remoteMesh ? remoteMesh.children : [];
    const playerHits=targets.length ? raycaster.intersectObjects(targets,true) : [];
    const wallHits=obstacles.length ? raycaster.intersectObjects(obstacles,true) : [];

    const playerHit=playerHits[0] || null;
    const wallHit=wallHits[0] || null;
    const playerDistance=playerHit ? playerHit.distance : Infinity;
    const wallDistance=wallHit ? wallHit.distance : Infinity;
    const hitPlayer=playerDistance<wallDistance;

    const impact=hitPlayer
      ? playerHit.point.clone()
      : wallHit
        ? wallHit.point.clone()
        : from.clone().add(direction.clone().multiplyScalar(110));

    const muzzle=models[current].userData.muzzle;
    const muzzleWorld=muzzle ? muzzle.getWorldPosition(new THREE.Vector3()) : from.clone();

    onShot?.({
      weapon:current,
      config:cfg,
      from:muzzleWorld,
      to:impact,
      hit:hitPlayer,
      impact,
      direction,
      aiming
    });

    if (hitPlayer) {
      const headshot=playerHit.object?.userData?.hitbox==="head";
      const damage=headshot ? Math.round(cfg.damage*1.65) : cfg.damage;
      onHit?.({
        damage,
        weapon:current,
        headshot,
        point:impact,
        normal:direction.clone().multiplyScalar(-1)
      });
    }

    if (current === "sniper") boltTimer = now + 260;
    if (ammo.mag===0 && ammo.reserve>0) {
      if (reload(now)) onReload?.();
    }
    return true;
  }

  return {
    equip,
    reload,
    tick,
    fire,
    setAim,
    get aiming() { return aiming; },
    get current(){return current;},
    get reloading(){return reloading;},
    ammo(){return {...state[current]};},
    config(){return WEAPONS[current];}
  };
}
