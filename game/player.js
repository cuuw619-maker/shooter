const THREE = window.THREE;

export function createPlayer(camera, isHost) {
  const object = new THREE.Object3D();
  object.position.set(isHost ? -8 : 8, 1.6, 0);
  object.add(camera);
  return object;
}

export function respawn(player, isHost) {
  const fallbackX = isHost ? -8 : 8;
  const spawnX = Number.isFinite(player.userData.spawnX) ? player.userData.spawnX : fallbackX;
  const spawnZ = Number.isFinite(player.userData.spawnZ) ? player.userData.spawnZ : 0;
  player.position.set(spawnX, 1.6, spawnZ);
  player.userData.verticalVelocity = 0;
  player.userData.grounded = true;
  player.userData.jumpQueued = false;
}

export function applyLook(player, camera, state) {
  player.rotation.y = state.yaw;
  camera.rotation.x = state.pitch;
}

export function getState(player, state, score) {
  return {
    t: "state",
    x: player.position.x,
    y: player.position.y,
    z: player.position.z,
    yaw: state.yaw,
    pitch: state.pitch,
    s: score
  };
}
