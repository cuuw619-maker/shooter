const THREE = window.THREE;

export function createEngine({renderer, scene, camera, clock}) {
  const systems = [];
  const fixedSystems = [];
  const effects = [];
  const collision = createCollisionWorld({
    cellSize: 4,
    maxResolveIterations: 6
  });

  const fixedStep = 1 / 60;
  let accumulator = 0;
  let timeScale = 1;
  let frame = 0;
  let smoothedFrameMs = 16.7;

  function use(system) {
    if (system && typeof system.update === "function") systems.push(system);
    if (system && typeof system.fixedUpdate === "function") fixedSystems.push(system);
    return system;
  }

  function addEffect(effect) {
    if (effect) effects.push(effect);
    return effect;
  }

  function update(dt, now) {
    const clampedDt = Math.min(Math.max(Number(dt) || 0, 0), 0.05);
    const scaledDt = clampedDt * timeScale;
    accumulator = Math.min(accumulator + scaledDt, fixedStep * 5);

    let fixedTicks = 0;
    while (accumulator >= fixedStep && fixedTicks < 5) {
      for (const system of fixedSystems) system.fixedUpdate(fixedStep, now);
      accumulator -= fixedStep;
      fixedTicks++;
    }

    for (const system of systems) system.update(clampedDt, now);

    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      if (effect.update(clampedDt, now) === false) effects.splice(i, 1);
    }

    smoothedFrameMs += ((clampedDt * 1000) - smoothedFrameMs) * 0.08;
    frame++;
  }

  function setTimeScale(value) {
    timeScale = Math.max(0, Math.min(2, Number(value) || 0));
    return timeScale;
  }

  function getPerformance() {
    return {
      frame,
      frameMs: smoothedFrameMs,
      fps: 1000 / Math.max(1, smoothedFrameMs),
      fixedAccumulator: accumulator,
      fixedStep,
      timeScale
    };
  }

  return {
    THREE,
    renderer,
    scene,
    camera,
    clock,
    collision,
    use,
    addEffect,
    update,
    setTimeScale,
    getPerformance,
    now: () => performance.now()
  };
}

export function damp(current, target, smoothing, dt) {
  if (THREE.MathUtils?.damp) return THREE.MathUtils.damp(current, target, smoothing, dt);
  const alpha = 1 - Math.exp(-Math.max(0, smoothing) * Math.max(0, dt));
  return current + (target - current) * alpha;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
