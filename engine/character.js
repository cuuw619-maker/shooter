const THREE = window.THREE;

function findNodes(root, patterns) {
  const result = [];
  root.traverse(node => {
    const name = (node.name || "").toLowerCase();
    if (patterns.some(pattern => name.includes(pattern))) result.push(node);
  });
  return result;
}

function rememberRotation(node) {
  return {
    x: node.rotation.x,
    y: node.rotation.y,
    z: node.rotation.z
  };
}

function restoreRotation(node, base) {
  node.rotation.set(base.x, base.y, base.z);
}

export function createCharacterAnimator(root) {
  const bones = {
    head: findNodes(root, ["head", "neck"]).slice(0, 2),
    chest: findNodes(root, ["spine", "chest", "upperbody"]).slice(0, 3),
    armL: findNodes(root, ["leftarm", "arm_l", "upperarm_l", "l_arm"]).slice(0, 2),
    armR: findNodes(root, ["rightarm", "arm_r", "upperarm_r", "r_arm"]).slice(0, 2),
    handL: findNodes(root, ["lefthand", "hand_l", "l_hand"]).slice(0, 1),
    handR: findNodes(root, ["righthand", "hand_r", "r_hand"]).slice(0, 1),
    legL: findNodes(root, ["leftleg", "thigh_l", "leg_l", "l_leg"]).slice(0, 2),
    legR: findNodes(root, ["rightleg", "thigh_r", "leg_r", "r_leg"]).slice(0, 2)
  };

  const tracked = [];
  for (const group of Object.values(bones)) {
    for (const node of group) {
      if (!tracked.some(item => item.node === node)) tracked.push({node, base: rememberRotation(node)});
    }
  }

  let time = Math.random() * 10;
  let weight = 0;
  const baseY = root.position.y;

  function update(dt, moving, speed = 0, airborne = false) {
    time += dt * (moving ? 7.5 + Math.min(speed, 8) * 0.75 : 2.2);
    const targetWeight = airborne ? 0.25 : 1;
    weight += (targetWeight - weight) * Math.min(1, dt * 7);

    for (const {node, base} of tracked) restoreRotation(node, base);

    const walk = moving ? Math.min(1, Math.max(speed / 5.6, 0.25)) : 0;
    const stride = Math.sin(time) * 0.5 * walk * weight;
    const sway = Math.cos(time * 0.5) * 0.035 * weight;
    const idleBreath = Math.sin(time * 0.9) * 0.018 * weight;

    for (const node of bones.legL) node.rotation.x += stride;
    for (const node of bones.legR) node.rotation.x -= stride * 0.94;

    for (const node of bones.armL) node.rotation.x -= stride * 0.68;
    for (const node of bones.armR) node.rotation.x += stride * 0.68;

    for (const node of bones.chest) {
      node.rotation.z += sway;
      node.rotation.x += idleBreath;
    }

    for (const node of bones.head) {
      node.rotation.y += Math.sin(time * 0.42) * 0.025 * weight;
      node.rotation.z += Math.cos(time * 0.7) * 0.018 * weight;
    }

    root.position.y = baseY + Math.sin(time * 0.5) * 0.012 * weight * (moving ? 1 : 0.5);
  }

  return {update};
}

export function resetCharacterPose(root) {
  root.position.y = 0;
  root.rotation.set(0, 0, 0);
}
