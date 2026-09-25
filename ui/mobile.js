export function setupMobile(input) {
  const moveStick = document.getElementById("moveStick");
  const lookStick = document.getElementById("lookStick");
  const fire = document.getElementById("fire");
  const jump = document.getElementById("jump");

  bindStick(moveStick, input, "move");
  bindStick(lookStick, input, "look");

  fire.addEventListener("pointerdown", e => {
    e.preventDefault();
    input.fire();
    if (input.startFire) input.startFire();
  });
  fire.addEventListener("pointerup", () => input.stopFire ? input.stopFire() : null);
  fire.addEventListener("pointercancel", () => input.stopFire ? input.stopFire() : null);
  fire.addEventListener("contextmenu", e => e.preventDefault());

  jump.addEventListener("pointerdown", e => {
    e.preventDefault();
    input.jump();
  });
  jump.addEventListener("contextmenu", e => e.preventDefault());
}

function bindStick(el, input, type) {
  let active = null;
  const knob = el.querySelector(".knob");
  const set = (e) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let x = e.clientX - cx;
    let y = e.clientY - cy;
    const max = r.width * 0.32;
    const d = Math.hypot(x, y);
    if (d > max) { x = x / d * max; y = y / d * max; }
    input[type === "move" ? "moveX" : "lookX"] = x / max;
    input[type === "move" ? "moveY" : "lookY"] = y / max;
    knob.style.transform = "translate(" + x + "px," + y + "px)";
  };

  el.addEventListener("pointerdown", e => {
    active = e.pointerId;
    el.setPointerCapture(active);
    set(e);
  });
  el.addEventListener("pointermove", e => { if (e.pointerId === active) set(e); });
  const reset = e => {
    if (e.pointerId === active) {
      active = null;
      if (type === "move") { input.moveX = 0; input.moveY = 0; }
      else { input.lookX = 0; input.lookY = 0; }
      knob.style.transform = "translate(0,0)";
    }
  };
  el.addEventListener("pointerup", reset);
  el.addEventListener("pointercancel", reset);
}
