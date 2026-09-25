const STORAGE_KEY = "shooter.mobile.controls.v2";

const DEFAULTS = {
  lookSensitivity: 1.0,
  stickSize: 136,
  buttonSize: 88,
  invertY: false,
  swapSticks: false
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {...DEFAULTS, ...saved};
  } catch (_) {
    return {...DEFAULTS};
  }
}

function writeSettings(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
}

export function setupMobile(input) {
  const moveStick = document.getElementById("moveStick");
  const lookStick = document.getElementById("lookStick");
  const fire = document.getElementById("fire");
  const jump = document.getElementById("jump");
  const aim = document.getElementById("aim");
  const settingsButton = document.getElementById("controlsSettings");
  const settingsPanel = document.getElementById("mobileSettings");

  if (!moveStick || !lookStick || !fire || !jump) return;

  const settings = readSettings();
  input.mobileSettings = settings;
  applySettings(settings, input, moveStick, lookStick, fire, jump, aim);

  bindStick(moveStick, input, "move", settings, input);
  bindStick(lookStick, input, "look", settings, input);

  bindButton(fire, () => input.fire?.(), () => input.stopFire?.());

  jump.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    input.jump?.();
  }, {passive:false});

  if (aim) {
    bindButton(aim, () => input.aim?.(true), () => input.aim?.(false));
  }

  window.addEventListener("blur", () => resetInput(input, moveStick, lookStick, fire, aim));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetInput(input, moveStick, lookStick, fire, aim);
  });

  setupSettings(
    settingsButton,
    settingsPanel,
    settings,
    input,
    moveStick,
    lookStick,
    fire,
    jump,
    aim
  );
}

function bindButton(el, down, up) {
  let active = null;

  const release = e => {
    if (active === null || (e && e.pointerId !== active)) return;
    active = null;
    up?.();
  };

  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    if (active !== null) return;
    active = e.pointerId;
    el.setPointerCapture?.(active);
    down?.();
  }, {passive:false});

  el.addEventListener("pointerup", release, {passive:false});
  el.addEventListener("pointercancel", release, {passive:false});
  el.addEventListener("lostpointercapture", () => release());
  el.addEventListener("contextmenu", e => e.preventDefault());
}

function bindStick(el, input, type, settings) {
  let active = null;
  const knob = el.querySelector(".knob");
  const isLook = type === "look";

  const reset = () => {
    active = null;
    if (type === "move") {
      input.moveX = 0;
      input.moveY = 0;
    } else {
      input.lookX = 0;
      input.lookY = 0;
    }
    knob.style.transform = "translate3d(0,0,0)";
  };

  const update = e => {
    if (active === null || e.pointerId !== active) return;

    const r = el.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    const maxDistance = Math.max(24, Math.min(r.width, r.height) * 0.36);

    let x = e.clientX - cx;
    let y = e.clientY - cy;
    const distance = Math.hypot(x, y);
    if (distance > maxDistance && distance > 0) {
      x = x / distance * maxDistance;
      y = y / distance * maxDistance;
    }

    let nx = x / maxDistance;
    let ny = y / maxDistance;
    const magnitude = Math.hypot(nx, ny);
    const deadzone = isLook ? 0.035 : 0.075;

    if (magnitude <= deadzone) {
      nx = 0;
      ny = 0;
    } else {
      const t = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
      const curve = t * t * (3 - 2 * t);
      const scale = curve / Math.max(magnitude, 0.0001);
      nx *= scale;
      ny *= scale;
    }

    if (type === "move") {
      input.moveX = nx;
      input.moveY = ny;
    } else {
      input.lookX = nx * settings.lookSensitivity;
      input.lookY = ny * settings.lookSensitivity * (settings.invertY ? -1 : 1);
    }

    knob.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
  };

  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    if (active !== null) return;
    active = e.pointerId;
    el.setPointerCapture?.(active);
    update(e);
  }, {passive:false});

  el.addEventListener("pointermove", update, {passive:false});
  el.addEventListener("pointerup", e => {
    e.preventDefault();
    if (e.pointerId === active) reset();
  }, {passive:false});
  el.addEventListener("pointercancel", e => {
    e.preventDefault();
    if (e.pointerId === active) reset();
  }, {passive:false});
  el.addEventListener("lostpointercapture", reset);
  el.addEventListener("contextmenu", e => e.preventDefault());

  window.addEventListener("pointerup", e => {
    if (e.pointerId === active) reset();
  }, {passive:true});
  window.addEventListener("pointercancel", e => {
    if (e.pointerId === active) reset();
  }, {passive:true});
}

function applySettings(settings, input, moveStick, lookStick, fire, jump, aim) {
  input.mobileSettings = settings;
  moveStick.style.setProperty("--stick-size", settings.stickSize + "px");
  lookStick.style.setProperty("--stick-size", settings.stickSize + "px");
  fire.style.setProperty("--button-size", settings.buttonSize + "px");
  if (aim) aim.style.setProperty("--button-size", Math.max(64, settings.buttonSize - 8) + "px");
  jump.style.setProperty("--jump-height", Math.round(settings.buttonSize * 0.63) + "px");
  input.lookSensitivity = settings.lookSensitivity;
  input.lookInvertY = settings.invertY;
}

function setupSettings(button, panel, settings, input, moveStick, lookStick, fire, jump, aim) {
  if (!button || !panel) return;

  const close = () => panel.classList.add("hidden");
  const open = () => panel.classList.remove("hidden");

  button.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
  }, {passive:false});

  button.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    panel.classList.toggle("hidden");
  });

  const sensitivity = document.getElementById("lookSensitivity");
  const stickSize = document.getElementById("stickSize");
  const buttonSize = document.getElementById("buttonSize");
  const invertY = document.getElementById("invertY");
  const swapSticks = document.getElementById("swapSticks");
  const closeButton = document.getElementById("closeControls");
  const resetButton = document.getElementById("resetControls");

  if (!sensitivity || !stickSize || !buttonSize || !invertY || !swapSticks) return;

  sensitivity.value = String(settings.lookSensitivity);
  stickSize.value = String(settings.stickSize);
  buttonSize.value = String(settings.buttonSize);
  invertY.checked = settings.invertY;
  swapSticks.checked = settings.swapSticks;
  syncSettingLabels();

  const save = () => {
    settings.lookSensitivity = Number(sensitivity.value);
    settings.stickSize = Number(stickSize.value);
    settings.buttonSize = Number(buttonSize.value);
    settings.invertY = invertY.checked;
    settings.swapSticks = swapSticks.checked;
    writeSettings(settings);
    applySettings(settings, input, moveStick, lookStick, fire, jump, aim);
    applySwap(settings, moveStick, lookStick);
    syncSettingLabels();
  };

  [sensitivity, stickSize, buttonSize].forEach(el => el.addEventListener("input", save));
  invertY.addEventListener("change", save);
  swapSticks.addEventListener("change", save);

  closeButton?.addEventListener("click", e => {
    e.preventDefault();
    close();
  });

  resetButton?.addEventListener("click", e => {
    e.preventDefault();
    Object.assign(settings, DEFAULTS);
    writeSettings(settings);
    sensitivity.value = String(settings.lookSensitivity);
    stickSize.value = String(settings.stickSize);
    buttonSize.value = String(settings.buttonSize);
    invertY.checked = false;
    swapSticks.checked = false;
    applySettings(settings, input, moveStick, lookStick, fire, jump, aim);
    applySwap(settings, moveStick, lookStick);
    syncSettingLabels();
  });

  panel.addEventListener("pointerdown", e => e.stopPropagation());
}

function applySwap(settings, moveStick, lookStick) {
  const moveParent = moveStick.parentElement;
  const lookParent = lookStick.parentElement;
  if (!moveParent || !lookParent || moveParent !== lookParent) return;

  const first = settings.swapSticks ? lookStick : moveStick;
  const second = settings.swapSticks ? moveStick : lookStick;
  moveParent.append(first, second);
}

function syncSettingLabels() {
  const sensitivityValue = document.getElementById("lookSensitivityValue");
  const stickSizeValue = document.getElementById("stickSizeValue");
  const buttonSizeValue = document.getElementById("buttonSizeValue");
  if (sensitivityValue) sensitivityValue.textContent = document.getElementById("lookSensitivity")?.value || "";
  if (stickSizeValue) stickSizeValue.textContent = document.getElementById("stickSize")?.value || "";
  if (buttonSizeValue) buttonSizeValue.textContent = document.getElementById("buttonSize")?.value || "";
}

function resetInput(input, moveStick, lookStick, fire, aim) {
  input.moveX = 0;
  input.moveY = 0;
  input.lookX = 0;
  input.lookY = 0;
  input.stopFire?.();
  input.aim?.(false);
  moveStick.querySelector(".knob").style.transform = "translate3d(0,0,0)";
  lookStick.querySelector(".knob").style.transform = "translate3d(0,0,0)";
}
