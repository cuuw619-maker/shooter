const THREE = window.THREE;

export const WEAPONS = {
  rifle:  {name:"RIFLE",  mag:30, reserve:90, damage:24, rate:105, reload:1900, spread:0.018, recoil:0.035, automatic:true},
  pistol: {name:"PISTOL", mag:12, reserve:48, damage:34, rate:260, reload:1300, spread:0.012, recoil:0.055, automatic:false},
  sniper: {name:"SNIPER", mag:5, reserve:20, damage:100, rate:1100, reload:2100, spread:0.002, recoil:0.16, automatic:false}
};

export function createWeaponSystem(camera) {
  const root = new THREE.Group();
  root.position.set(0.42, -0.34, -0.72);
  camera.add(root);

  const state = {};
  for (const id of Object.keys(WEAPONS)) {
    state[id] = {mag: WEAPONS[id].mag, reserve: WEAPONS[id].reserve};
  }

  let current = "rifle";
  let lastShot = 0;
  let reloading = false;
  let reloadTimer = null;
  let recoil = 0;

  function material(color, metal=0.35) {
    return new THREE.MeshStandardMaterial({color, metalness: metal, roughness: 0.45});
  }

  function build(id) {
    const g = new THREE.Group();
    if (id === "rifle") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(.24,.20,.75), material(0x20252b));
      body.position.z = -.15;
      const stock = new THREE.Mesh(new THREE.BoxGeometry(.20,.16,.35), material(0x4a3022,0));
      stock.position.set(0,-.03,.35);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.78,10), material(0x161a1f));
      barrel.rotation.x = Math.PI/2; barrel.position.z = -.82;
      const grip = new THREE.Mesh(new THREE.BoxGeometry(.12,.30,.13), material(0x30343a));
      grip.rotation.x = -.22; grip.position.set(0,-.20,.02);
      g.add(body,stock,barrel,grip);
    } else if (id === "pistol") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(.18,.16,.42), material(0x252a30));
      body.position.z = -.10;
      const slide = new THREE.Mesh(new THREE.BoxGeometry(.20,.10,.34), material(0x3a4149));
      slide.position.set(0,.08,-.13);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.35,10), material(0x15191d));
      barrel.rotation.x = Math.PI/2; barrel.position.z = -.48;
      const grip = new THREE.Mesh(new THREE.BoxGeometry(.13,.28,.14), material(0x24282d));
      grip.rotation.x = -.16; grip.position.set(0,-.19,.06);
      g.add(body,slide,barrel,grip);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(.18,.16,.95), material(0x20242a));
      body.position.z = -.20;
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.38,12), material(0x11151a));
      scope.rotation.x = Math.PI/2; scope.position.set(0,.16,-.35);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,.70,10), material(0x14181c));
      barrel.rotation.x = Math.PI/2; barrel.position.z = -1.02;
      const stock = new THREE.Mesh(new THREE.BoxGeometry(.20,.15,.38), material(0x49301f,0));
      stock.position.z=.38;
      g.add(body,scope,barrel,stock);
    }
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
    if (!WEAPONS[id] || id === current || reloading) return;
    models[current].visible = false;
    current = id;
    models[current].visible = true;
    recoil = 0;
  }

  function reload(now=performance.now()) {
    if (reloading) return false;
    const cfg = WEAPONS[current], ammo = state[current];
    if (ammo.mag >= cfg.mag || ammo.reserve <= 0) return false;
    reloading = true;
    reloadTimer = now + cfg.reload;
    return true;
  }

  function tick(now=performance.now()) {
    if (reloading && now >= reloadTimer) {
      const cfg=WEAPONS[current], ammo=state[current];
      const need=cfg.mag-ammo.mag;
      const take=Math.min(need,ammo.reserve);
      ammo.mag += take; ammo.reserve -= take;
      reloading=false; reloadTimer=null;
    }
    recoil *= 0.84;
    root.position.z = -0.72 + recoil;
    root.rotation.x = recoil * 0.8;
  }

  function fire({now=performance.now(), raycaster, camera, remoteMesh, obstacles=[], triggerPressed=false, onShot, onDry, onHit}) {
    const cfg=WEAPONS[current], ammo=state[current];
    if (!cfg.automatic && !triggerPressed) return false;
    if (reloading || now-lastShot < cfg.rate) return false;
    if (ammo.mag <= 0) { onDry?.(); reload(now); return false; }
    lastShot=now; ammo.mag--; recoil=cfg.recoil;
    const spreadX=(Math.random()-.5)*cfg.spread, spreadY=(Math.random()-.5)*cfg.spread;
    raycaster.setFromCamera({x:spreadX,y:spreadY},camera);
    const targets=remoteMesh ? remoteMesh.children : [];
    const playerHits=targets.length ? raycaster.intersectObjects(targets,true) : [];
    const wallHits=obstacles.length ? raycaster.intersectObjects(obstacles,true) : [];
    const playerDistance=playerHits.length ? playerHits[0].distance : Infinity;
    const wallDistance=wallHits.length ? wallHits[0].distance : Infinity;
    if (playerDistance < wallDistance) onHit?.(cfg.damage,current);
    onShot?.(current,cfg);
    if (ammo.mag===0 && ammo.reserve>0) reload(now);
    return true;
  }

  return {
    equip, reload, tick, fire,
    get current(){return current},
    get reloading(){return reloading},
    ammo(){return {...state[current]}},
    config(){return WEAPONS[current]}
  };
}
