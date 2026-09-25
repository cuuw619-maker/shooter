const BASE_Y = 1.6;
const GRAVITY = 22;
const JUMP_SPEED = 8.2;
const WALK_SPEED = 7.0;
const SPRINT_SPEED = 9.2;
const ACCELERATION = 55;
const BRAKING = 78;

export function updatePlayer(player, state, input, dt, collisionWorld) {
  if (!player.userData) player.userData = {};
  const data = player.userData;

  if (!Number.isFinite(data.verticalVelocity)) data.verticalVelocity = 0;
  if (data.grounded === undefined) data.grounded = true;
  if (!Number.isFinite(data.velocityX)) data.velocityX = 0;
  if (!Number.isFinite(data.velocityZ)) data.velocityZ = 0;

  if (data.jumpQueued && data.grounded) {
    data.verticalVelocity = JUMP_SPEED;
    data.grounded = false;
  }
  data.jumpQueued = false;

  let localX = input.keyboardX + input.moveX;
  let localForward = -(input.keyboardZ + input.moveY);
  const inputLength = Math.hypot(localX, localForward);

  if (inputLength > 1) {
    localX /= inputLength;
    localForward /= inputLength;
  }

  const yaw = state.yaw;
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);

  const wishX = rightX * localX + forwardX * localForward;
  const wishZ = rightZ * localX + forwardZ * localForward;
  const moving = Math.hypot(wishX, wishZ) > 0.001;

  const targetSpeed = input.sprint && moving ? SPRINT_SPEED : WALK_SPEED;
  const targetVX = wishX * targetSpeed;
  const targetVZ = wishZ * targetSpeed;

  const rate = moving ? ACCELERATION : BRAKING;
  data.velocityX = approach(data.velocityX, targetVX, rate * dt);
  data.velocityZ = approach(data.velocityZ, targetVZ, rate * dt);

  const dx = data.velocityX * dt;
  const dz = data.velocityZ * dt;

  if (collisionWorld?.moveCircle) {
    const moved = collisionWorld.moveCircle(
      player.position.x,
      player.position.z,
      dx,
      dz,
      0.38
    );

    if (moved.collidedX) data.velocityX = 0;
    if (moved.collidedZ) data.velocityZ = 0;

    player.position.x = moved.x;
    player.position.z = moved.z;
  } else {
    player.position.x += dx;
    player.position.z += dz;
  }

  // Only a safety boundary around the Sendstone play space.
  player.position.x = Math.max(-39.5, Math.min(39.5, player.position.x));
  player.position.z = Math.max(-39.5, Math.min(39.5, player.position.z));

  data.verticalVelocity -= GRAVITY * dt;
  player.position.y += data.verticalVelocity * dt;

  if (player.position.y <= BASE_Y) {
    player.position.y = BASE_Y;
    data.verticalVelocity = 0;
    data.grounded = true;
  } else {
    data.grounded = false;
  }
}

export function isBlocked(x, z, radius, collisionWorld) {
  return Boolean(collisionWorld?.blocked?.(x, z, radius));
}

function approach(current, target, delta) {
  if (current < target) return Math.min(target, current + delta);
  if (current > target) return Math.max(target, current - delta);
  return target;
}
