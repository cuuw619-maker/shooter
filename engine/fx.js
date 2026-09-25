const THREE = window.THREE;

export function createFx(scene) {
  const items = [];

  function burst(position, normal, kind="hit") {
    const color = kind === "muzzle" ? 0xffd35a : kind === "hit" ? 0xffffff : 0xb7d7ff;
    const count = kind === "muzzle" ? 7 : 10;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(kind === "muzzle" ? 0.018 : 0.025, 5, 5),
        new THREE.MeshBasicMaterial({color, transparent:true})
      );
      mesh.position.copy(position);
      const tangent = new THREE.Vector3(
        normal.y * (Math.random() - 0.5),
        Math.random() - 0.25,
        -normal.x * (Math.random() - 0.5)
      );
      const velocity = normal.clone().multiplyScalar(1.2 + Math.random() * 2.5).add(tangent);
      items.push({mesh, velocity, life: kind === "muzzle" ? 0.055 : 0.12 + Math.random() * 0.10});
      scene.add(mesh);
    }
  }

  function tracer(from, to) {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
    const material = new THREE.LineBasicMaterial({color:0xffdf85, transparent:true, opacity:0.85});
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    items.push({mesh:line, velocity:null, life:0.045});
  }

  function update(dt) {
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      item.life -= dt;
      if (item.velocity) {
        item.velocity.y -= 16 * dt;
        item.mesh.position.addScaledVector(item.velocity, dt);
      }
      if (item.mesh.material && "opacity" in item.mesh.material) {
        item.mesh.material.opacity = Math.max(0, item.life * 8);
      }
      if (item.life <= 0) {
        scene.remove(item.mesh);
        item.mesh.geometry?.dispose();
        item.mesh.material?.dispose();
        items.splice(i, 1);
      }
    }
    return true;
  }

  return {
    burst,
    tracer,
    update
  };
}
