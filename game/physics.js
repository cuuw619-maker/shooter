const BASE_Y = 1.6;
const GRAVITY = 22;
const JUMP_SPEED = 8.2;

export function updatePlayer(player, state, input, dt, obstacles) {
  if (!player.userData) player.userData = {};
  if (!Number.isFinite(player.userData.verticalVelocity)) player.userData.verticalVelocity = 0;
  if (player.userData.grounded === undefined) player.userData.grounded = true;

  if (player.userData.jumpQueued) {
    if (player.userData.grounded) {
      player.userData.verticalVelocity = JUMP_SPEED;
      player.userData.grounded = false;
    }
    player.userData.jumpQueued = false;
  }

  let sx = input.keyboardX + input.moveX;
  let sz = input.keyboardZ + input.moveY;
  const len = Math.hypot(sx, sz);
  if (len > 1) { sx /= len; sz /= len; }

  const speedUnits = input.sprint && (sx || sz) ? 9.2 : 7.0;
  const speed = speedUnits * dt;
  const yaw = state.yaw;
  const nx = player.position.x + sx * Math.cos(yaw) * speed - sz * Math.sin(yaw) * speed;
  const nz = player.position.z + sx * Math.sin(yaw) * speed + sz * Math.cos(yaw) * speed;

  if (!blocked(nx, player.position.z, 0.42, obstacles)) player.position.x = nx;
  if (!blocked(player.position.x, nz, 0.42, obstacles)) player.position.z = nz;

  player.position.x = Math.max(-38, Math.min(38, player.position.x));
  player.position.z = Math.max(-38, Math.min(38, player.position.z));

  player.userData.verticalVelocity -= GRAVITY * dt;
  player.position.y += player.userData.verticalVelocity * dt;
  if (player.position.y <= BASE_Y) {
    player.position.y = BASE_Y;
    player.userData.verticalVelocity = 0;
    player.userData.grounded = true;
  } else {
    player.userData.grounded = false;
  }
}

function blocked(x, z, radius, obstacles) {
  for (const o of obstacles) {
    const dx = Math.max(Math.abs(x - o.x) - o.half, 0);
    const dz = Math.max(Math.abs(z - o.z) - o.half, 0);
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}
