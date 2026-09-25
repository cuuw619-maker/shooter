const EPS = 0.0001;

function cellKey(x, z, cellSize) {
  return Math.floor(x / cellSize) + ":" + Math.floor(z / cellSize);
}

function rotateToLocal(x, z, cx, cz, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dx = x - cx;
  const dz = z - cz;
  return {
    x: dx * c + dz * s,
    z: -dx * s + dz * c
  };
}

function rotateToWorld(x, z, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: x * c - z * s,
    z: x * s + z * c
  };
}

function nearestPointOnObb(x, z, collider) {
  const local = rotateToLocal(x, z, collider.x, collider.z, collider.angle);
  const px = Math.max(-collider.halfX, Math.min(collider.halfX, local.x));
  const pz = Math.max(-collider.halfZ, Math.min(collider.halfZ, local.z));
  const world = rotateToWorld(px, pz, collider.angle);
  return {
    x: collider.x + world.x,
    z: collider.z + world.z,
    localX: local.x,
    localZ: local.z
  };
}

function circleVsObb(x, z, radius, collider) {
  const nearest = nearestPointOnObb(x, z, collider);
  let dx = x - nearest.x;
  let dz = z - nearest.z;
  let distanceSq = dx * dx + dz * dz;

  if (distanceSq > radius * radius + EPS) return null;

  if (distanceSq > EPS) {
    const distance = Math.sqrt(distanceSq);
    return {
      hit: true,
      depth: radius - distance,
      nx: dx / distance,
      nz: dz / distance
    };
  }

  // Circle center is inside the box. Push through the nearest face.
  const local = rotateToLocal(x, z, collider.x, collider.z, collider.angle);
  const toX = collider.halfX - Math.abs(local.x);
  const toZ = collider.halfZ - Math.abs(local.z);

  if (toX < toZ) {
    const sign = local.x >= 0 ? 1 : -1;
    const world = rotateToWorld(sign, 0, collider.angle);
    return {
      hit: true,
      depth: radius + toX,
      nx: world.x,
      nz: world.z
    };
  }

  const sign = local.z >= 0 ? 1 : -1;
  const world = rotateToWorld(0, sign, collider.angle);
  return {
    hit: true,
    depth: radius + toZ,
    nx: world.x,
    nz: world.z
  };
}

export class CollisionWorld {
  constructor({cellSize = 4, maxResolveIterations = 5} = {}) {
    this.cellSize = cellSize;
    this.maxResolveIterations = maxResolveIterations;
    this.colliders = [];
    this.grid = new Map();
  }

  setColliders(colliders = []) {
    this.colliders = Array.isArray(colliders) ? colliders.filter(Boolean) : [];
    this.grid.clear();

    for (let i = 0; i < this.colliders.length; i++) {
      const collider = this.colliders[i];
      const reach = Math.max(collider.halfX, collider.halfZ) + 0.5;
      const minX = Math.floor((collider.x - reach) / this.cellSize);
      const maxX = Math.floor((collider.x + reach) / this.cellSize);
      const minZ = Math.floor((collider.z - reach) / this.cellSize);
      const maxZ = Math.floor((collider.z + reach) / this.cellSize);

      for (let gx = minX; gx <= maxX; gx++) {
        for (let gz = minZ; gz <= maxZ; gz++) {
          const key = gx + ":" + gz;
          let bucket = this.grid.get(key);
          if (!bucket) {
            bucket = [];
            this.grid.set(key, bucket);
          }
          bucket.push(i);
        }
      }
    }
    return this;
  }

  nearby(x, z, radius = 0) {
    const result = [];
    const seen = new Set();
    const reach = radius + 1.5;
    const minX = Math.floor((x - reach) / this.cellSize);
    const maxX = Math.floor((x + reach) / this.cellSize);
    const minZ = Math.floor((z - reach) / this.cellSize);
    const maxZ = Math.floor((z + reach) / this.cellSize);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gz = minZ; gz <= maxZ; gz++) {
        const bucket = this.grid.get(gx + ":" + gz);
        if (!bucket) continue;
        for (const index of bucket) {
          if (seen.has(index)) continue;
          seen.add(index);
          result.push(this.colliders[index]);
        }
      }
    }
    return result;
  }

  blocked(x, z, radius = 0.38) {
    for (const collider of this.nearby(x, z, radius)) {
      if (circleVsObb(x, z, radius, collider)) return true;
    }
    return false;
  }

  resolve(x, z, radius = 0.38) {
    let px = x;
    let pz = z;

    for (let iteration = 0; iteration < this.maxResolveIterations; iteration++) {
      let best = null;

      for (const collider of this.nearby(px, pz, radius)) {
        const hit = circleVsObb(px, pz, radius, collider);
        if (!hit || hit.depth <= 0) continue;
        if (!best || hit.depth > best.depth) best = hit;
      }

      if (!best) break;
      px += best.nx * (best.depth + 0.001);
      pz += best.nz * (best.depth + 0.001);
    }

    return {x: px, z: pz};
  }

  moveCircle(x, z, dx, dz, radius = 0.38) {
    const length = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(length / 0.055));
    const stepX = dx / steps;
    const stepZ = dz / steps;

    let px = x;
    let pz = z;
    let collidedX = false;
    let collidedZ = false;

    for (let i = 0; i < steps; i++) {
      const targetX = px + stepX;
      const targetZ = pz + stepZ;
      const resolved = this.resolve(targetX, targetZ, radius);

      const hitX = Math.abs(resolved.x - targetX) > 0.00001;
      const hitZ = Math.abs(resolved.z - targetZ) > 0.00001;

      if (!hitX && !hitZ) {
        px = targetX;
        pz = targetZ;
        continue;
      }

      collidedX ||= hitX;
      collidedZ ||= hitZ;

      // Apply the resolved point and then try the tangential part of the motion.
      px = resolved.x;
      pz = resolved.z;

      const remainX = stepX - (px - (targetX - stepX));
      const remainZ = stepZ - (pz - (targetZ - stepZ));
      const tangentTryX = remainX * 0.72;
      const tangentTryZ = remainZ * 0.72;
      const tangent = this.resolve(px + tangentTryX, pz + tangentTryZ, radius);
      px = tangent.x;
      pz = tangent.z;
    }

    const final = this.resolve(px, pz, radius);
    return {x: final.x, z: final.z, collidedX, collidedZ};
  }
}

export function createCollisionWorld(options) {
  return new CollisionWorld(options);
}

export function circleBlocked(x, z, radius, colliders = []) {
  for (const collider of colliders) {
    if (circleVsObb(x, z, radius, collider)) return true;
  }
  return false;
}

export function createColliderFromMesh(mesh, THREE) {
  if (!mesh?.geometry) return null;
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();

  const localBox = mesh.geometry.boundingBox;
  if (!localBox) return null;

  const size = new THREE.Vector3();
  localBox.getSize(size);
  if (size.x <= 0 || size.z <= 0) return null;

  const localCenter = localBox.getCenter(new THREE.Vector3());
  const worldCenter = localCenter.applyMatrix4(mesh.matrixWorld);

  const worldScale = new THREE.Vector3();
  mesh.getWorldScale(worldScale);

  const e = mesh.matrixWorld.elements;
  const axisX = new THREE.Vector3(e[0], e[1], e[2]).normalize();
  const axisZ = new THREE.Vector3(e[8], e[9], e[10]).normalize();

  return {
    x: worldCenter.x,
    z: worldCenter.z,
    halfX: Math.max(0.04, size.x * Math.abs(worldScale.x) * 0.5),
    halfZ: Math.max(0.04, size.z * Math.abs(worldScale.z) * 0.5),
    minY: worldCenter.y - size.y * Math.abs(worldScale.y) * 0.5,
    maxY: worldCenter.y + size.y * Math.abs(worldScale.y) * 0.5,
    angle: Math.atan2(axisX.z, axisX.x),
    source: mesh
  };
}
