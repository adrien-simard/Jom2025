import { VoxelWorld, Block } from './world.js';
import { createControls } from './player.js';
import { ClanManager } from './clans.js';
import { createHotbar, createClanPanel } from './ui.js';

const THREE_NS = window.THREE; // global from CDN

const renderer = new THREE_NS.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

const scene = new THREE_NS.Scene();
scene.background = new THREE_NS.Color(0x0b0f14);
const camera = new THREE_NS.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(32, 18, 32);

// Lights
const hemi = new THREE_NS.HemisphereLight(0xffffff, 0x334466, 0.75); scene.add(hemi);
const dir = new THREE_NS.DirectionalLight(0xffffff, 0.8); dir.position.set(40,60,20); scene.add(dir);

// World
const world = new VoxelWorld({ width: 64, depth: 64, height: 32 });
world.generateTerrain();
let worldMesh = world.buildMesh(THREE_NS);
scene.add(worldMesh);

// Controls
const { controls, update: updateControls } = await createControls(THREE_NS, camera, renderer);
scene.add(controls.getObject());

// UI
let currentBlock = Block.Grass; // 1-4
const hotbar = createHotbar({ onSelect(id) { currentBlock = id; hotbar.setSelected(id); } });
hotbar.setSelected(1);
const clans = new ClanManager();
createClanPanel({
  onCreate: (name, color) => clans.createClan(name, color),
  onJoin: (name) => clans.joinClan(name),
  onClaim: () => {
    const pos = controls.getObject().position;
    clans.claimBaseAt(Math.floor(pos.x), Math.floor(pos.z));
    document.getElementById('status').textContent = 'Base du clan définie';
  },
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Raycast helpers
function getCameraRay() {
  const origin = controls.getObject().position.clone();
  const direction = new THREE_NS.Vector3(0,0,-1).applyQuaternion(controls.getObject().quaternion).normalize();
  return { origin, direction };
}

function rebuildWorldMesh() {
  scene.remove(worldMesh);
  worldMesh.traverse?.(o=>{ if (o.isMesh) o.geometry.dispose(); });
  worldMesh = world.buildMesh(THREE_NS);
  scene.add(worldMesh);
}

// Mouse actions
window.addEventListener('mousedown', (e) => {
  // 0: left -> break, 2: right -> place
  const { origin, direction } = getCameraRay();
  const hit = world.pickVoxel(origin, direction, 6);
  if (e.button === 0) {
    if (hit.hit) {
      const { x, y, z } = hit.pos;
      if (clans.canEdit(x, y, z)) { world.set(x,y,z, Block.Air); rebuildWorldMesh(); }
      else { document.getElementById('status').textContent = 'Zone protégée'; }
    }
  } else if (e.button === 2) {
    e.preventDefault();
    const placeAt = hit.hit ? hit.prev : null;
    if (placeAt) {
      const { x, y, z } = placeAt;
      if (clans.canEdit(x, y, z)) { world.set(x,y,z, currentBlock); rebuildWorldMesh(); }
      else { document.getElementById('status').textContent = 'Zone protégée'; }
    }
  }
});
window.addEventListener('contextmenu', (e)=>e.preventDefault());

// Keys 1-4 to select block
window.addEventListener('keydown', (e) => {
  if (e.code.startsWith('Digit')) {
    const n = Number(e.code.slice(5));
    if (n>=1 && n<=4) { currentBlock = n; hotbar.setSelected(n); }
  }
});

// Animate
const clock = new THREE_NS.Clock();
function loop() {
  const dt = clock.getDelta();
  updateControls(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
loop();

