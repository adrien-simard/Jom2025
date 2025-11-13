import { createGame } from './game.js';

const canvas = document.getElementById('game');
// Assure que le canvas peut recevoir le focus pour capter les flèches
canvas.tabIndex = 1;
canvas.addEventListener('mousedown', () => canvas.focus());
// Donne le focus au démarrage
setTimeout(()=> canvas.focus(), 0);
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

let W = canvas.width;
let H = canvas.height;

const keys = new Set();
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  keys.add(e.key);
  const block = ["ArrowLeft","Left","ArrowRight","Right","ArrowUp","Up","Space"," "];
  if (block.includes(e.code) || block.includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys.delete(e.code); keys.delete(e.key); });

function pressed(...codes) { return codes.some(c => keys.has(c)); }

const game = createGame({ width: W, height: H, onStatus: (t)=> statusEl.textContent = t });

// Peuple le sélecteur de skins de chat
const skinSelect = document.getElementById('catSkin');
if (skinSelect) {
  const skins = game.getSkins();
  skinSelect.innerHTML = '';
  skins.forEach((name, i) => {
    const opt = document.createElement('option');
    opt.value = String(i); opt.textContent = name; if (i===0) opt.selected = true;
    skinSelect.appendChild(opt);
  });
  skinSelect.addEventListener('change', () => {
    const idx = Number(skinSelect.value|0);
    game.setPlayerSkin(idx);
  });
}

function step(dt) {
  const input = {
    // Flèches + AZERTY/QWERTY
    left: pressed('ArrowLeft','Left','KeyA','KeyQ'),
    right: pressed('ArrowRight','Right','KeyD'),
    // Saut: Espace/Flèche haut/W/Z
    jump: pressed('ArrowUp','Up','Space','KeyW','KeyZ'),
    attack: pressed('KeyC','c'),
    reset: pressed('KeyR','r'),
  };
  if (input.reset) game.reset();
  game.update(dt, input);
}

function render() {
  ctx.save();
  ctx.clearRect(0,0,W,H);
  game.render(ctx, W, H);
  ctx.restore();
}

let last = performance.now();
function loop(t) {
  try {
    const dt = Math.min(0.033, (t - last) / 1000);
    last = t;
    step(dt);
    render();
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = 'Erreur: ' + (err && err.message ? err.message : String(err));
  } finally {
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);
