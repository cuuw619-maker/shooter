const THREE = window.THREE;

export function createEngine({renderer, scene, camera, clock}) {
  const systems = [];
  const effects = [];

  function use(system) {
    if (system && typeof system.update === "function") systems.push(system);
    return system;
  }

  function addEffect(effect) {
    if (effect) effects.push(effect);
    return effect;
  }

  function update(dt, now) {
    for (const system of systems) system.update(dt, now);
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      if (effect.update(dt, now) === false) effects.splice(i, 1);
    }
  }

  return {
    THREE,
    renderer,
    scene,
    camera,
    clock,
    use,
    addEffect,
    update,
    now: () => performance.now()
  };
}

export function damp(current, target, smoothing, dt) {
  return THREE.MathUtils.damp(current, target, smoothing, dt);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
