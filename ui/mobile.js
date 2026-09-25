export function setupMobile(input) {
  const moveStick = document.getElementById("moveStick");
  const lookStick = document.getElementById("lookStick");
  const fire = document.getElementById("fire");
  const jump = document.getElementById("jump");

  if (!moveStick || !lookStick || !fire || !jump) return;

  bindStick(moveStick, input, "move");
  bindStick(lookStick, input, "look");

  fire.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    input.fire();
  });
  const stopFire = e => {
    e?.preventDefault?.();
    input.stopFire?.();
  };
  fire.addEventListener("pointerup", stopFire);
  fire.addEventListener("pointercancel", stopFire);
  fire.addEventListener("lostpointercapture", stopFire);
  fire.addEventListener("contextmenu", e => e.preventDefault());

  jump.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    input.jump();
  });
  jump.addEventListener("pointerup", e => e.preventDefault());
  jump.addEventListener("contextmenu", e => e.preventDefault());
}

function bindStick(el, input, type) {
  let active = -1;
  const knob = el.querySelector(".knob");
  const isLook = type === "look";
  const max = 42;

  function reset(pointerId = active) {
    if (pointerId !== active) return;
    active = -1;
    if (type === "move") {
      input.moveX = 0;
      input.moveY = 0;
    } else {
      input.lookX = 0;
      input.lookY = 0;
    }
    knob.style.transform = "translate3d(0,0,0)";
  }

  function setFromPointer(e) {
    if (e.pointerId !== active) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    const maxDistance = Math.min(r.width, r.height) * 0.32;
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
    const deadzone = isLook ? 0.045 : 0.08;

    if (magnitude <= deadzone) {
      nx = 0;
      ny = 0;
    } else {
      const normalized = Math.min(1, (magnitude - deadzone) / (1 - deadzone));
      const scale = normalized / magnitude;
      nx *= scale;
      ny *= scale;
    }

    if (type === "move") {
      input.moveX = nx;
      input.moveY = ny;
    } else {
      input.lookX = nx;
      input.lookY = ny;
    }
    knob.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }

  el.addEventListener("pointerdown", e => {
    e.preventDefault();
    e.stopPropagation();
    if (active !== -1) return;
    active = e.pointerId;
    try { el.setPointerCapture(active); } catch (_) {}
    setFromPointer(e);
  }, {passive:false});

  el.addEventListener("pointermove", setFromPointer, {passive:false});
  el.addEventListener("pointerup", e => { e.preventDefault(); reset(e.pointerId); }, {passive:false});
  el.addEventListener("pointercancel", e => { e.preventDefault(); reset(e.pointerId); }, {passive:false});
  el.addEventListener("lostpointercapture", () => reset());
  el.addEventListener("contextmenu", e => e.preventDefault());
}
