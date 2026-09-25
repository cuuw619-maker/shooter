export function updatePlayer(player, state, input, dt, obstacles) {
  let sx = input.keyboardX + input.moveX;
  let sz = input.keyboardZ + input.moveY;
  const len = Math.hypot(sx, sz) || 1;
  sx /= len;
  sz /= len;

  const speed = 7 * dt;
  const yaw = state.yaw;
  let nx = player.position.x + sx * Math.cos(yaw) * speed - sz * Math.sin(yaw) * speed;
  let nz = player.position.z + sx * Math.sin(yaw) * speed + sz * Math.cos(yaw) * speed;

  if (!blocked(nx, player.position.z, 0.42, obstacles)) player.position.x = nx;
  if (!blocked(player.position.x, nz, 0.42, obstacles)) player.position.z = nz;

  player.position.x = Math.max(-38, Math.min(38, player.position.x));
  player.position.z = Math.max(-38, Math.min(38, player.position.z));
  player.position.y += (1.6 - player.position.y) * Math.min(1, dt * 9);
}

function blocked(x, z, radius, obstacles) {
  for (const o of obstacles) {
    const dx = Math.max(Math.abs(x - o.x) - o.half, 0);
    const dz = Math.max(Math.abs(z - o.z) - o.half, 0);
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}
