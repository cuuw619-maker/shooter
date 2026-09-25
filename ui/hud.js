export function createHud() {
  const status = document.getElementById("status");
  const wait = document.getElementById("wait");
  const room = document.getElementById("room");
  const score = document.getElementById("score");
  const roundStatus = document.getElementById("roundStatus");
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
    score(a,b) { score.textContent = a + " : " + b; },
    rounds(round,a,b) { score.textContent = "ROUND " + round + "  •  " + a + " : " + b; },
    roundStatus(text) { if (roundStatus) roundStatus.textContent = text; },
    health(value) {
      const v = Math.max(0, Math.min(100, value));
      hp.style.width = v + "%";
      if (healthText) healthText.textContent = Math.round(v);
    },
    ammo(current,mag,reserve,reloading) {
      if (ammo) ammo.textContent = reloading
        ? current + " • ПЕРЕЗАРЯДКА"
        : current + "  " + mag + " / " + reserve;
    },
    weapon(current) { if (weapon) weapon.textContent = current; },
    hit(headshot=false) {
      if (!hitmarker) return;
      hitmarker.textContent = headshot ? "✦" : "×";
      hitmarker.classList.remove("show");
      void hitmarker.offsetWidth;
      hitmarker.classList.add("show");
    },
    roundWin(local) {
      if (!killfeed) return;
      killfeed.textContent = local ? "РАУНД ВЫИГРАН" : "РАУНД ПРОИГРАН";
      killfeed.classList.remove("show");
      void killfeed.offsetWidth;
      killfeed.classList.add("show");
    },
    kill() {
      if (!killfeed) return;
      killfeed.textContent = "ELIMINATION";
      killfeed.classList.remove("show");
      void killfeed.offsetWidth;
      killfeed.classList.add("show");
    },
    match(local) {
      if (!killfeed) return;
      killfeed.textContent = local ? "ПОБЕДА В МАТЧЕ" : "ПОРАЖЕНИЕ В МАТЧЕ";
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
      document.getElementById("fullscreen").textContent = document.fullscreenElement ? "↙" : "⛶";
    }
  };
}

export function setupFullscreen(hud) {
  const button = document.getElementById("fullscreen");
  if (!button) return;
  button.addEventListener("pointerdown", e => e.stopPropagation());
  button.addEventListener("click", async e => {
    e.preventDefault();
    e.stopPropagation();
    const el = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        const fn = el.requestFullscreen || el.webkitRequestFullscreen;
        if (fn) await fn.call(el);
      } else {
        const fn = document.exitFullscreen || document.webkitExitFullscreen;
        if (fn) await fn.call(document);
      }
    } catch (_) {}
    hud.setFullScreenButton();
  });
  document.addEventListener("fullscreenchange", () => hud.setFullScreenButton());
}
