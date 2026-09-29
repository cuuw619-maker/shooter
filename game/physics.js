const BASE_Y = 1.6;
const GRAVITY = 22;
const JUMP_SPEED = 8.2;
const WALK_SPEED = 7.8;
const SPRINT_SPEED = 10.6;
const ACCELERATION = 55;
const BRAKING = 78;

export function updatePlayer(player, state, input, dt, collisionWorld) {
  if (!player.userData) player.userData = {};
  const data = player.userData;
  dt=Math.min(Math.max(Number(dt)||0,.0001),.05);

  if (!Number.isFinite(data.verticalVelocity)) data.verticalVelocity = 0;
  if (data.grounded === undefined) data.grounded = true;
  if (!Number.isFinite(data.velocityX)) data.velocityX = 0;
  if (!Number.isFinite(data.velocityZ)) data.velocityZ = 0;
  if (!Number.isFinite(data.jumpBuffer)) data.jumpBuffer = 0;
  if (!Number.isFinite(data.coyoteTimer)) data.coyoteTimer = .10;

  data.jumpBuffer=Math.max(0,data.jumpBuffer-dt);
  if(data.jumpQueued) data.jumpBuffer=.13;
  data.jumpQueued=false;

  if(data.grounded) data.coyoteTimer=.10;
  else data.coyoteTimer=Math.max(0,data.coyoteTimer-dt);

  if(data.jumpBuffer>0 && data.coyoteTimer>0){
    data.verticalVelocity=JUMP_SPEED;
    data.grounded=false;
    data.coyoteTimer=0;
    data.jumpBuffer=0;
  }

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

  const sprinting=input.sprint && moving && localForward>.18;
  const targetSpeed=sprinting?SPRINT_SPEED:WALK_SPEED;
  const airControl=data.grounded?1:.48;
  const targetVX=wishX*targetSpeed*airControl;
  const targetVZ=wishZ*targetSpeed*airControl;
  const rate=data.grounded?(moving?ACCELERATION:BRAKING):18;
  data.velocityX=approach(data.velocityX,targetVX,rate*dt);
  data.velocityZ=approach(data.velocityZ,targetVZ,rate*dt);

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

  player.position.x=Math.max(-69.0,Math.min(69.0,player.position.x));
  player.position.z=Math.max(-69.0,Math.min(69.0,player.position.z));

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
