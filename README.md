Voxel Clans MVP (Web)

Run
- Open `index.html` in a modern browser (Chrome/Edge/Firefox).
- Click anywhere to lock the mouse.

Controls
- Move: WASD or ZQSD or arrows
- Look: mouse
- Break block: left click
- Place block: right click (places on face you are looking at)
- Select block: 1–4 (Grass/Dirt/Stone/Wood)

Clans (local MVP)
- In the right panel, set a clan name and color.
- Click "Créer/Rejoindre" to create or join by name.
- Click "Définir base ici" to claim a square territory centered at your position.
- You cannot edit blocks inside other clans' territories.

Tech
- Three.js from CDN, ES modules for controls.
- Simple voxel world with heightmap, face-culling mesh, DDA ray picking.
- Single file rebuild on edit for simplicity (fine for small worlds).

Next steps
- Chunked world + partial rebuilds.
- Textures and lighting tweaks.
- Persistence and multiplayer (WebSocket server).

