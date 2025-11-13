// Player setup using PointerLockControls

export async function createControls(THREE, camera, renderer) {
  const { PointerLockControls } = await import('https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js');
  const controls = new PointerLockControls(camera, renderer.domElement);

  const state = {
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    velocity: new THREE.Vector3(),
    speed: 8.0,
    enabled: false,
  };

  const onKey = (e, down) => {
    switch (e.code) {
      case 'KeyW': case 'KeyZ': case 'ArrowUp': state.moveForward = down; break;
      case 'KeyS': case 'ArrowDown': state.moveBackward = down; break;
      case 'KeyA': case 'KeyQ': case 'ArrowLeft': state.moveLeft = down; break;
      case 'KeyD': case 'ArrowRight': state.moveRight = down; break;
    }
  };
  document.addEventListener('keydown', (e)=>onKey(e,true));
  document.addEventListener('keyup',   (e)=>onKey(e,false));

  const overlay = document.getElementById('overlay');
  overlay.addEventListener('click', () => controls.lock());
  controls.addEventListener('lock', () => state.enabled = true);
  controls.addEventListener('unlock', () => state.enabled = false);

  function update(dt) {
    if (!state.enabled) return;
    state.velocity.set(0,0,0);
    if (state.moveForward) state.velocity.z -= 1;
    if (state.moveBackward) state.velocity.z += 1;
    if (state.moveLeft) state.velocity.x -= 1;
    if (state.moveRight) state.velocity.x += 1;
    if (state.velocity.lengthSq() > 0) {
      state.velocity.normalize().multiplyScalar(state.speed * dt);
      controls.moveRight(state.velocity.x);
      controls.moveForward(state.velocity.z);
    }
  }

  return { controls, update, state };
}

