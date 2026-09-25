export function createHud() {
  const status = document.getElementById("status");
  const wait = document.getElementById("wait");
  const room = document.getElementById("room");
  const score = document.getElementById("score");
  const hp = document.querySelector(".hp");
  const healthText = document.getElementById("healthText");
  const ammo = document.getElementById("ammo");
  const weapon = document.getElementById("weapon");
  const hitmarker = document.getElementById("hitmarker");
  const killfeed = document.getElementById("killfeed");

  return {
    status(text) { status.textContent = text; },
    room(code) { room.textContent = "ROOM " + code; },
    waiting(connected) {
      wait.textContent = connected
        ? "ВТОРОЙ ИГРОК ПОДКЛЮЧЕН"
        : "РАЗМИНКА • ОЖИДАНИЕ ВТОРОГО ИГРОКА";
    },
    score(a, b) { score.textContent = a + " : " + b; },
    health(value) { const v = Math.max(0, Math.min(100, value)); hp.style.width = v + "%"; if (healthText) healthText.textContent = Math.round(v); },
    ammo(current, mag, reserve, reloading) { if (ammo) ammo.textContent = reloading ? current + " • ПЕРЕЗАРЯДКА" : current + "  " + mag + " / " + reserve; },
    weapon(current) { if (weapon) weapon.textContent = current; },
    hit(headshot=false) {
      if (!hitmarker) return;
      hitmarker.textContent = headshot ? "✦" : "×";
      hitmarker.classList.remove("show");
      void hitmarker.offsetWidth;
      hitmarker.classList.add("show");
    },
    kill() {
      if (!killfeed) return;
      killfeed.textContent = "ELIMINATION";
      killfeed.classList.remove("show");
      void killfeed.offsetWidth;
      killfeed.classList.add("show");
    },
    showGame() {
      document.getElementById("menu").classList.add("hidden");
      document.getElementById("hud").classList.remove("hidden");
      document.getElementById("mobile").classList.remove("hidden");
    },
    setFullScreenButton() {
      document.getElementById("fullscreen").textContent = "⛶";
    }
  };
}

export function setupFullscreen(hud) {
  document.getElementById("fullscreen").addEventListener("click", () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) {
        try {
          const result = fn.call(el);
          if (result && result.catch) result.catch(() => {});
        } catch (_) {}
      }
    } else {
      const fn = document.exitFullscreen || document.webkitExitFullscreen;
      if (fn) {
        try {
          const result = fn.call(document);
          if (result && result.catch) result.catch(() => {});
        } catch (_) {}
      }
    }
  });
  document.addEventListener("fullscreenchange", () => hud.setFullScreenButton());
}
