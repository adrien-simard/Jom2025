// Jeu de plateforme 2D type Mario, avec zones de capture de clans

export function createGame({ width, height, onStatus }) {
  const TS = 24; // taille de tuile
  const SCALE = 2; // zoom de rendu pour lisibilité
  const G = 800; // gravité px/s^2
  const MAX_VY = 900;
  const WORLD_W = 96; // en tuiles (garde en synchro avec W)
  let time = 0; // temps global pour jour/nuit & vent

  // Monde: grille (0 vide, 1 sol, 2 plateforme)
  const W = 160, H = 24;
  const level = new Uint8Array(W * H);
  const idx = (x,y)=> x + y*W;
  function setRect(x0,y0,x1,y1,val){ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) level[idx(x,y)]=val; }

  // Sol de base
  setRect(0, H-3, W-1, H-1, 1);
  // Petites plateformes
  // Plateformes abaissées pour être atteignables plus facilement
  for (let x=8; x<20; x++) level[idx(x, H-6)] = 2;   // était H-8
  for (let x=28; x<35; x++) level[idx(x, H-9)] = 2;  // était H-12
  for (let x=45; x<55; x++) level[idx(x, H-8)] = 2;  // était H-10
  for (let x=65; x<75; x++) level[idx(x, H-5)] = 2;  // était H-7

  // Grottes: cavités cachées sous terre (crée des murs/sols)
  // Grotte centrale
  setRect(48, H-12, 62, H-11, 2); // toit
  setRect(48, H-8, 62, H-7, 2);   // sol
  setRect(48, H-12, 49, H-7, 2);  // mur gauche
  setRect(61, H-12, 62, H-7, 2);  // mur droit
  setRect(49, H-12, 51, H-7, 0);  // entrée élargie
  // Grotte droite
  setRect(94, H-11, 108, H-10, 2);
  setRect(94, H-7, 108, H-6, 2);
  setRect(94, H-11, 95, H-6, 2);
  setRect(107, H-11, 108, H-6, 2);
  setRect(95, H-11, 97, H-6, 0); // entrée élargie

  // Nouvelles grottes
  // Grotte gauche (vers x~24)
  setRect(20, H-11, 32, H-10, 2); // toit
  setRect(20, H-7, 32, H-6, 2);   // sol
  setRect(20, H-11, 21, H-6, 2);  // mur gauche
  setRect(31, H-11, 32, H-6, 2);  // mur droit
  setRect(21, H-11, 23, H-6, 0);  // entrée
  // Grotte lointaine (vers x~140)
  setRect(136, H-12, 152, H-11, 2);
  setRect(136, H-8, 152, H-7, 2);
  setRect(136, H-12, 137, H-7, 2);
  setRect(151, H-12, 152, H-7, 2);
  setRect(137, H-12, 140, H-7, 0);

  // Ouvertures de surface vers les grottes (trous dans l'herbe/sol)
  setRect(50, H-3, 52, H-1, 0);   // accès grotte centrale
  setRect(96, H-3, 98, H-1, 0);   // accès grotte droite
  setRect(22, H-3, 24, H-1, 0);   // accès grotte gauche
  setRect(138, H-3, 140, H-1, 0); // accès grotte lointaine

  // Bases/clans: il faut toutes les capturer pour gagner
  const bases = [
    { x: 2, y: H-6, w: 10, h: 3, color: '#58a14f', name: 'Clan Joueur', progress: 1, locked: true, hidden: false },
    { x: W-12, y: H-6, w: 10, h: 3, color: '#caa574', name: 'Clan Bois', progress: 0, locked: false, hidden: false },
    { x: 54, y: H-9, w: 8, h: 3, color: '#8d99ae', name: 'Clan Souterrain', progress: 0, locked: false, hidden: true },
    { x: 100, y: H-8, w: 8, h: 3, color: '#7a5d3d', name: 'Clan Terre', progress: 0, locked: false, hidden: true },
    { x: 130, y: H-9, w: 8, h: 3, color: '#6cb6ff', name: 'Clan Azur', progress: 0, locked: false, hidden: true },
    // Nouveaux clans
    { x: 24, y: H-9, w: 7, h: 3, color: '#e5534b', name: 'Clan Rubis', progress: 0, locked: false, hidden: true },
    { x: 116, y: H-6, w: 8, h: 3, color: '#b392f0', name: 'Clan Ombre', progress: 0, locked: false, hidden: false },
    { x: 142, y: H-9, w: 7, h: 3, color: '#9be9ff', name: 'Clan Neige', progress: 0, locked: false, hidden: true },
  ];

  // Joueur
  const player = { x: (bases[0].x+bases[0].w/2)*TS, y: (H-4)*TS, w: 18, h: 22,
    vx:0, vy:0, onGround:false, dir:1, lives:3, skin: 0,
    attack: { active:false, time:0, cooldown:0 },
    shield: 0, inv: 0
  };

  // Ennemis simples (marche gauche/droite)
  const enemies = [];
  for (let i=0;i<6;i++) enemies.push(spawnEnemy(30 + i*8, H-4));
  // Projectiles lancés par les ennemis
  const shurikens = [];

  function spawnEnemy(tx, ty){
    return { x: tx*TS, y: ty*TS, w: 20, h: 20, vx: (Math.random()<0.5?-40:40), vy:0, alive:true, skin: (Math.random()*4)|0, atkCd: 0.5 + Math.random()*1.2 };
  }

  function reset(){
    player.x = (bases[0].x+bases[0].w/2)*TS; player.y = (H-4)*TS;
    player.vx = 0; player.vy = 0; player.onGround = false; player.dir = 1; player.lives = 3; player.shield = 0; player.inv = 0;
    enemies.length = 0;
    // Surface: plus de chats
    for (let i=0;i<10;i++) enemies.push(spawnEnemy(20 + i*10, H-4));
    // Ennemis supplémentaires dans les grottes
    enemies.push(spawnEnemy(52, H-9));
    enemies.push(spawnEnemy(58, H-9));
    enemies.push(spawnEnemy(96, H-8));
    enemies.push(spawnEnemy(102, H-8));
    enemies.push(spawnEnemy(24, H-8));
    enemies.push(spawnEnemy(28, H-8));
    enemies.push(spawnEnemy(140, H-10));
    enemies.push(spawnEnemy(146, H-10));
    shurikens.length = 0;
    // réinitialise la progression (sauf base joueur)
    for (let i=0;i<bases.length;i++) bases[i].progress = bases[i].locked ? 1 : 0;
    status('');
  }

  function status(t){ onStatus && onStatus(t); }

  function solidAt(tx, ty){
    if (tx<0||ty<0||tx>=W||ty>=H) return 1; // mur
    const v = level[idx(tx, ty)];
    return v===1 || v===2 ? 1 : 0;
  }

  function aabbVsWorld(ent){
    // déplacement X
    ent.x += ent.vx * dt;
    let x0 = Math.floor((ent.x)/TS), x1 = Math.floor((ent.x+ent.w)/TS);
    let y0 = Math.floor((ent.y)/TS), y1 = Math.floor((ent.y+ent.h)/TS);
    if (ent.vx>0){
      for(let y=y0;y<=y1;y++) if (solidAt(x1, y)) { ent.x = x1*TS - ent.w - 0.01; ent.vx = 0; break; }
    } else if (ent.vx<0){
      for(let y=y0;y<=y1;y++) if (solidAt(x0, y)) { ent.x = (x0+1)*TS + 0.01; ent.vx = 0; break; }
    }
    // déplacement Y
    ent.y += ent.vy * dt;
    x0 = Math.floor((ent.x)/TS); x1 = Math.floor((ent.x+ent.w)/TS);
    y0 = Math.floor((ent.y)/TS); y1 = Math.floor((ent.y+ent.h)/TS);
    ent.onGround = false;
    if (ent.vy>0){
      for(let x=x0;x<=x1;x++) if (solidAt(x, y1)) { ent.y = y1*TS - ent.h - 0.01; ent.vy = 0; ent.onGround = true; break; }
    } else if (ent.vy<0){
      for(let x=x0;x<=x1;x++) if (solidAt(x, y0)) { ent.y = (y0+1)*TS + 0.01; ent.vy = 0; break; }
    }
  }

  function overlaps(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

  let dt = 0.016;

  // -------------------- Décor: Forêt en arrière-plan (parallaxe) --------------------
  const WORLD_PX = W * TS;
  function rng(seed){ let s = seed>>>0; return ()=> ((s = (s*1664525 + 1013904223)>>>0) / 4294967296); }
  const rand = rng(1337);
  // Mini-carte: révélation (brouillard de guerre)
  const revealed = new Uint8Array(W * H);
  const rIdx = (x,y)=> x + y*W;
  // Couche montagnes
  const peaksFar = Array.from({length: 10}, ()=>({ x: Math.floor(rand()*WORLD_PX), w: 240 + Math.floor(rand()*240), h: 120 + Math.floor(rand()*120) }));
  const peaksMid = Array.from({length: 12}, ()=>({ x: Math.floor(rand()*WORLD_PX), w: 200 + Math.floor(rand()*200), h: 140 + Math.floor(rand()*160) }));
  const farTrees = Array.from({length: 110}, ()=>({
    x: Math.floor(rand()*WORLD_PX),
    h: 40 + Math.floor(rand()*60),
    s: 0.7 + rand()*0.6,
  }));
  const midTrees = Array.from({length: 75}, ()=>({
    x: Math.floor(rand()*WORLD_PX),
    h: 60 + Math.floor(rand()*80),
    s: 0.9 + rand()*0.8,
  }));
  // Feuilles (particules)
  const leaves = Array.from({length: 140}, ()=>({
    x: Math.floor(rand()*WORLD_PX),
    y: Math.floor(rand()*H*TS*0.8),
    vy: 18 + rand()*26,
    vx: -10 + rand()*20,
    r: 2 + rand()*2,
    a: 0.5 + rand()*0.5,
  }));

  // Utils couleurs
  const lerp = (a,b,t)=> a+(b-a)*t;
  function hexToRgb(hex){ const n = parseInt(hex.slice(1),16); return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 }; }
  function rgbToHex({r,g,b}){ const v = (r<<16)|(g<<8)|b; return '#'+v.toString(16).padStart(6,'0'); }
  function mixHex(h1,h2,t){ const a=hexToRgb(h1), b=hexToRgb(h2); return rgbToHex({ r:Math.round(lerp(a.r,b.r,t)), g:Math.round(lerp(a.g,b.g,t)), b:Math.round(lerp(a.b,b.b,t)) }); }

  function drawGradientSky(ctx, camX, camY, viewW, viewH){
    // Cycle jour/nuit (~60s)
    const dayT = (Math.sin((time/60) * Math.PI*2) + 1) * 0.5;
    const top = mixHex('#0e1623', '#74a0f2', dayT);
    const mid = mixHex('#0b121c', '#9cc3ff', dayT);
    const bot = mixHex('#0a1018', '#cfe3ff', dayT);
    const g = ctx.createLinearGradient(0, camY, 0, camY + viewH);
    g.addColorStop(0, top);
    g.addColorStop(0.6, mid);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(camX, camY, viewW, viewH);
  }

  function drawTree(ctx, x, baseY, h, colorTrunk, colorLeaves){
    // Tronc
    const tw = Math.max(2, Math.floor(h*0.08));
    ctx.fillStyle = colorTrunk;
    ctx.fillRect(x - tw/2, baseY - h, tw, h);
    // Feuillage (trois cercles)
    ctx.fillStyle = colorLeaves;
    const r1 = h*0.28, r2 = h*0.22, r3 = h*0.18;
    drawCircle(ctx, x, baseY - h*0.75, r1);
    drawCircle(ctx, x - r1*0.45, baseY - h*0.55, r2);
    drawCircle(ctx, x + r1*0.45, baseY - h*0.55, r3);
  }

  function drawCircle(ctx, cx, cy, r){ ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.closePath(); ctx.fill(); }

  function drawParallaxForest(ctx, camX, camY, viewW, viewH){
    // Ciel
    drawGradientSky(ctx, camX, camY, viewW, viewH);
    const groundY = (H-3) * TS; // proche du sol du niveau
    const dayT = (Math.sin((time/60) * Math.PI*2) + 1) * 0.5;

    // Montagnes lointaines
    const pMF = 0.12, pMM = 0.25;
    // Couleurs selon l'heure
    const mFarColor = mixHex('#0e1b24', '#7f8fa6', dayT);
    const mMidColor = mixHex('#132332', '#6e8095', dayT);
    ctx.fillStyle = mFarColor; ctx.globalAlpha = 0.7;
    for (const p of peaksFar){
      const x = p.x + (1 - pMF) * camX;
      drawMountain(ctx, x|0, groundY-40, p.w, p.h);
    }
    ctx.fillStyle = mMidColor; ctx.globalAlpha = 0.85;
    for (const p of peaksMid){
      const x = p.x + (1 - pMM) * camX;
      drawMountain(ctx, x|0, groundY-28, p.w, p.h);
    }
    ctx.globalAlpha = 1.0;

    // Couche lointaine (silhouettes sombres)
    const pFar = 0.20; // parallaxe (plus petit = plus lointain)
    ctx.globalAlpha = 0.35;
    for (const t of farTrees){
      const xw = t.x + (1 - pFar) * camX; // corrige la translation caméra
      const h = t.h * t.s;
      drawTree(ctx, xw|0, groundY - 24, h, '#0a1a12', '#0a2518');
    }
    ctx.globalAlpha = 1.0;

    // Couche moyenne
    const pMid = 0.40;
    ctx.globalAlpha = 0.6;
    for (const t of midTrees){
      const xw = t.x + (1 - pMid) * camX;
      const h = t.h * t.s;
      drawTree(ctx, xw|0, groundY - 8, h, '#13271b', '#1f3f2c');
    }
    ctx.globalAlpha = 1.0;

    // Feuilles tombantes (particules)
    const pLeaf = 0.45;
    const wind = Math.sin(time*0.5) * 30; // vent doux
    for (const leaf of leaves){
      const lx = leaf.x + (1 - pLeaf) * camX;
      ctx.globalAlpha = 0.25 + 0.35*leaf.a;
      ctx.fillStyle = dayT > 0.5 ? '#6abf69' : '#4d9150';
      ctx.fillRect(lx|0, (leaf.y|0), leaf.r, leaf.r);
      ctx.globalAlpha = 1.0;
    }
  }

  function drawMountain(ctx, x, baseY, w, h){
    ctx.beginPath();
    ctx.moveTo(x - w/2, baseY);
    ctx.lineTo(x, baseY - h);
    ctx.lineTo(x + w/2, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function update(_dt, input){
    dt = _dt;
    time += dt;
    if (player.inv > 0) player.inv = Math.max(0, player.inv - dt);
    // Joueur input
    const acc = 900; const maxv = 180; const fric = 900;
    if (input.left) { player.vx -= acc*dt; player.dir = -1; }
    if (input.right){ player.vx += acc*dt; player.dir = 1; }
    if (!input.left && !input.right){
      if (player.vx>0) player.vx = Math.max(0, player.vx - fric*dt);
      if (player.vx<0) player.vx = Math.min(0, player.vx + fric*dt);
    }
    player.vx = Math.max(-maxv, Math.min(maxv, player.vx));
    // Jump
    if (input.jump && player.onGround){ player.vy = -420; player.onGround = false; }

    // Attaque à l'épée (C)
    const atkDur = 0.18; // s affichage et fenêtre de touche
    const atkCooldown = 0.35; // s
    player.attack.cooldown = Math.max(0, player.attack.cooldown - dt);
    if (!player.attack.active && player.attack.cooldown <= 0 && input.attack) {
      player.attack.active = true; player.attack.time = atkDur; player.attack.cooldown = atkCooldown; player.attack.dir = player.dir;
    }
    if (player.attack.active) {
      player.attack.time -= dt;
      if (player.attack.time <= 0) player.attack.active = false;
    }
    // Gravité
    player.vy = Math.min(MAX_VY, player.vy + G*dt);
    aabbVsWorld(player);

    // Coffres: ouverture au contact
    for (const c of chests) {
      if (!c.opened && overlaps(player, c)) {
        c.opened = true;
        if (c.contains === 'shield') {
          player.shield = Math.min(3, player.shield + 1);
          status('Trésor: bouclier obtenu !');
        }
      }
    }

    // Ennemis
    for (const e of enemies){
      if (!e.alive) continue;
      e.vy = Math.min(MAX_VY, e.vy + G*dt);
      // heuristique bord → inversion
      const ahead = { x: e.x + Math.sign(e.vx)*12, y: e.y + e.h + 2 };
      const tx = Math.floor(ahead.x/TS), ty = Math.floor(ahead.y/TS);
      if (!solidAt(tx, ty)) e.vx = -e.vx;
      aabbVsWorld(e);
      // collision mur = inversion
      if (Math.abs(e.vx) < 1) e.vx = (Math.random()<0.5?-1:1)*60;

      // Interaction joueur vs ennemi
      if (overlaps(player, e)){
        const playerBottom = player.y + player.h;
        if (playerBottom < e.y + e.h*0.5 && player.vy>0){
          // saute sur l'ennemi
          e.alive = false; player.vy = -320;
        } else {
          // dommage
          hitPlayer();
        }
      }

      // Épée touche l'ennemi
      if (player.attack.active) {
        const s = getSwordHitbox();
        if (overlaps(s, e)) { e.alive = false; }
      }

      // Lancer de shuriken vers le joueur
      e.atkCd -= dt;
      const dxp = (player.x + player.w/2) - (e.x + e.w/2);
      const dyp = (player.y + player.h/2) - (e.y + e.h/2);
      const dist2 = dxp*dxp + dyp*dyp;
      if (e.atkCd <= 0 && dist2 < (420*420)) {
        const speed = 220;
        const len = Math.max(1e-3, Math.hypot(dxp, dyp));
        const vx = speed * dxp / len;
        const vy = speed * dyp / len;
        shurikens.push({ x: e.x + e.w/2 - 3, y: e.y + e.h/2 - 3, w: 6, h: 6, vx, vy, t: 0, life: 3.0 });
        e.atkCd = 1.2 + Math.random()*1.4;
      }
    }

    // Capture de clans: progresser dans chaque base
    const pTile = { x: player.x/TS, y: player.y/TS };
    const rate = 0.30; // vitesse capture/s
    const decay = 0.05; // recul hors zone
    let showing = false;
    for (const b of bases) {
      const inside = pTile.x >= b.x && pTile.x <= b.x+b.w && pTile.y >= b.y-1 && pTile.y <= b.y+b.h;
      if (inside && !b.locked) {
        b.progress = Math.min(1, b.progress + rate*dt);
        status(`Capture ${b.name}: ${(b.progress*100|0)}%`); showing = true;
      } else if (!b.locked && decay>0) {
        b.progress = Math.max(0, b.progress - decay*dt);
      }
    }
    if (!showing) status('');
    // Victoire si toutes capturées (base 0 = joueur déjà capturée)
    if (bases.every(b => b.progress >= 1)) status('Victoire: tous les clans capturés !');

    // Projectiles: mise à jour, collisions
    for (const s of shurikens){
      s.t += dt; s.life -= dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      // Collision monde
      const sx = Math.floor((s.x + s.w/2)/TS), sy = Math.floor((s.y + s.h/2)/TS);
      if (solidAt(sx, sy)) s.life = 0;
      // Collision joueur
      if (overlaps(player, s)) { s.life = 0; hitPlayer(); }
      // Écran
      if (s.x < 0 || s.y < 0 || s.x > W*TS || s.y > H*TS) s.life = 0;
      // Épée détruit le shuriken
      if (player.attack.active) {
        const hb = getSwordHitbox();
        if (overlaps(hb, s)) s.life = 0;
      }
    }
    for (let i=shurikens.length-1;i>=0;i--) if (shurikens[i].life <= 0) shurikens.splice(i,1);

    // Mini-carte: marquer révélé autour du joueur
    const pr = 6; // rayon en tuiles
    const ptx = Math.floor(player.x/TS), pty = Math.floor(player.y/TS);
    for (let yy = -pr; yy <= pr; yy++) {
      for (let xx = -pr; xx <= pr; xx++) {
        const tx = ptx + xx, ty = pty + yy;
        if (tx>=0 && ty>=0 && tx<W && ty<H) revealed[rIdx(tx,ty)] = 1;
      }
    }

    // Met à jour les feuilles
    const groundY = (H-3) * TS;
    const wind = Math.sin(time*0.5) * 30;
    for (const leaf of leaves){
      leaf.y += leaf.vy * dt;
      leaf.x += (leaf.vx + wind*0.25) * dt;
      if (leaf.y > groundY - 6){
        leaf.y = -10 - Math.random()*80;
        leaf.x = (leaf.x + WORLD_PX) % WORLD_PX;
      }
      if (leaf.x < 0) leaf.x += WORLD_PX;
      if (leaf.x > WORLD_PX) leaf.x -= WORLD_PX;
    }
  }

  function hitPlayer(){
    if (player.inv > 0) return;
    if (player.shield > 0) {
      player.shield -= 1; player.inv = 0.8; status('Bouclier absorbé !');
      return;
    }
    player.lives -= 1; player.inv = 1.0;
    if (player.lives <= 0){
      status('Game Over — R pour recommencer');
      // respawn doux
      player.lives = 3; // on conserve la progression des bases
    }
    player.x = (bases[0].x+bases[0].w/2)*TS; player.y = (H-4)*TS; player.vx = 0; player.vy = 0;
  }

  function render(ctx, Wpx, Hpx){
    // camera centrée sur le joueur
    const viewW = Math.floor(Wpx / SCALE), viewH = Math.floor(Hpx / SCALE);
    const camX = Math.max(0, Math.min(player.x - viewW/2, W*TS - viewW));
    const camY = Math.max(0, Math.min(player.y - viewH/2, H*TS - viewH));
    ctx.imageSmoothingEnabled = false;
    ctx.scale(SCALE, SCALE);
    ctx.translate(-camX, -camY);

    // fond: gradient + forêt en parallaxe
    drawParallaxForest(ctx, camX, camY, viewW, viewH);

    // tuiles
    // RNG déterministe par tuile pour décor
    const rand2 = (x,y)=> {
      let s = x*374761393 + y*668265263; s |= 0;
      s = (s ^ (s>>>13)) * 1274126177; s |= 0;
      s ^= (s>>>16); s >>>= 0; return s/4294967295;
    };
    for (let y=0;y<H;y++){
      for (let x=0;x<W;x++){
        const v = level[idx(x,y)]; if (!v) continue;
        const xpx = x*TS, ypx = y*TS;
        const aboveSolid = solidAt(x, y-1);

        if (v === 1) {
          // Sol: terre
          ctx.fillStyle = '#7a5d3d';
          ctx.fillRect(xpx, ypx, TS, TS);
        } else if (v === 2) {
          // Plateforme: pierre/bois
          ctx.fillStyle = '#3a4d5f';
          ctx.fillRect(xpx, ypx, TS, TS);
        }

        // Couronnement herbe si surface
        if (!aboveSolid && (v===1 || v===2)) {
          const grassH = Math.max(4, Math.floor(TS * 0.3));
          ctx.fillStyle = '#58a14f';
          ctx.fillRect(xpx, ypx, TS, grassH);
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = '#6abd5d';
          ctx.fillRect(xpx, ypx, TS, 2);
          ctx.globalAlpha = 1.0;

          // Décor aléatoire: cailloux / fleurs / touffes
          const r = rand2(x, y);
          if (r < 0.06) {
            // petit caillou
            ctx.fillStyle = '#8d99ae';
            const w = 4 + ((r*100)%3|0), h = 2;
            ctx.fillRect(xpx + 3 + ((r*1000)%6|0), ypx + 2, w, h);
          } else if (r < 0.10) {
            // fleur simple
            const stemX = xpx + 4 + ((r*1000)%10|0);
            ctx.strokeStyle = '#2ea043'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(stemX, ypx + 2); ctx.lineTo(stemX, ypx + 6); ctx.stroke();
            ctx.fillStyle = (r < 0.08) ? '#ffd166' : '#ff7b72';
            ctx.fillRect(stemX-1, ypx + 1, 2, 2);
          } else if (r < 0.16) {
            // touffe d'herbe plus claire
            ctx.fillStyle = '#6abd5d';
            ctx.fillRect(xpx + 2 + ((r*100)%8|0), ypx + 2, 6, 2);
          }
        }
      }
    }

    // bases (affiche toutes, celles en grotte sont naturellement "cachées" dans la cavité)
    for (const b of bases) drawBase(ctx, b);
    // coffres visibles
    for (const c of chests) if (!c.opened) drawChest(ctx, c);

    // ennemis (chats)
    for (const e of enemies){
      if (!e.alive) continue;
      drawCat(ctx, e.x, e.y, e.w, e.h, SKINS[e.skin], e.vx>=0, time);
    }

    // joueur (chat)
    drawCat(ctx, player.x, player.y, player.w, player.h, SKINS[player.skin], player.dir>=0, time);
    // halo de bouclier
    if (player.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.1*Math.sin(time*6);
      ctx.strokeStyle = '#7aa2ff'; ctx.lineWidth = 2;
      const cx = player.x + player.w/2, cy = player.y + player.h/2;
      ctx.beginPath(); ctx.ellipse(cx, cy, player.w*0.7, player.h*0.7, 0, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    // épée
    if (player.attack.active) {
      const s = getSwordHitbox();
      drawSword(ctx, s);
    }

    // shurikens
    for (const s of shurikens) drawShuriken(ctx, s, time);

    // HUD simple (vies)
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(2,2);
    ctx.fillStyle = '#e6edf3';
    ctx.fillText(`Vies: ${player.lives}  Bouclier: ${player.shield}`, 8, 18);
    ctx.setTransform(1,0,0,1,0,0);
    drawMinimap(ctx, Wpx, Hpx);
  }

  function drawBase(ctx, base){
    ctx.save();
    const pct = base.progress ?? 0;
    ctx.globalAlpha = base.hidden ? 0.12 : 0.18;
    ctx.fillStyle = base.color; ctx.fillRect(base.x*TS, base.y*TS, base.w*TS, base.h*TS);
    ctx.globalAlpha = 1.0; ctx.strokeStyle = base.color; ctx.strokeRect(base.x*TS, (base.y-1)*TS, base.w*TS, (base.h+1)*TS);
    // barre de capture au-dessus
    const bw = base.w*TS, bh = 6;
    const x = base.x*TS, y = (base.y-1)*TS - 10;
    ctx.fillStyle = '#22303c'; ctx.fillRect(x, y, bw, bh);
    ctx.fillStyle = base.color; ctx.fillRect(x, y, Math.floor(bw * Math.max(0, Math.min(1,pct))), bh);
    ctx.fillStyle = '#e6edf3'; ctx.fillText(base.name, x, y-6);
    ctx.restore();
  }

  // ---------- Mini-carte ----------
  function drawMinimap(ctx, Wpx, Hpx){
    ctx.save();
    const mmW = 160, mmH = 90; // pixels
    const pad = 8;
    const x0 = Wpx - mmW - pad, y0 = pad;
    // fond
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#0e1623'; ctx.fillRect(x0-2, y0-2, mmW+4, mmH+4);
    ctx.globalAlpha = 1.0; ctx.fillStyle = '#0b121c'; ctx.fillRect(x0, y0, mmW, mmH);
    const sx = mmW / (W*TS), sy = mmH / (H*TS);
    // tuiles révélées
    for (let y=0;y<H;y++){
      for (let x=0;x<W;x++){
        if (!revealed[rIdx(x,y)]) continue;
        const v = level[idx(x,y)]; if (!v) continue;
        ctx.fillStyle = (v===1) ? '#2b3a49' : '#3a4d5f';
        ctx.fillRect(x0 + x*TS*sx, y0 + y*TS*sy, Math.max(1, TS*sx), Math.max(1, TS*sy));
      }
    }
    // bases (montrées si révélées) sinon flèche directionnelle
    for (const b of bases){
      let vis = false;
      for (let yy=b.y-1; yy<=b.y+b.h; yy++){
        for (let xx=b.x; xx<=b.x+b.w; xx++){
          if (xx>=0&&yy>=0&&xx<W&&yy<H && revealed[rIdx(xx,yy)]) { vis = true; break; }
        }
        if (vis) break;
      }
      const bx = x0 + (b.x + b.w*0.5)*TS*sx;
      const by = y0 + (b.y + b.h*0.5)*TS*sy;
      if (vis) {
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = b.color;
        ctx.strokeRect(x0 + b.x*TS*sx, y0 + (b.y-1)*TS*sy, b.w*TS*sx, (b.h+1)*TS*sy);
        const bw = b.w*TS*sx; const bby = y0 + (b.y-1)*TS*sy - 5;
        ctx.fillStyle = '#22303c'; ctx.fillRect(x0 + b.x*TS*sx, bby, bw, 3);
        ctx.fillStyle = b.color; ctx.fillRect(x0 + b.x*TS*sx, bby, Math.max(1, bw * Math.max(0, Math.min(1, b.progress||0))), 3);
        ctx.globalAlpha = 1.0;
      } else {
        // dessine une flèche vers la base (non révélée)
        const px = x0 + player.x*sx, py = y0 + player.y*sy;
        const dx = bx - px, dy = by - py;
        const ang = Math.atan2(dy, dx);
        const r = 8; // marge du bord
        const cx = x0 + mmW/2 + Math.cos(ang) * (mmW/2 - r);
        const cy = y0 + mmH/2 + Math.sin(ang) * (mmH/2 - r);
        drawArrow(ctx, cx, cy, ang, b.color);
      }
    }
    // joueur
    ctx.fillStyle = '#6cb6ff';
    const px = x0 + (player.x)*sx, py = y0 + (player.y)*sy;
    ctx.fillRect(px-1, py-1, 3, 3);
    
    // légende des clans sous la mini-carte
    const lgPad = 6; const rowH = 11; const lgX = x0; let lgY = y0 + mmH + 6;
    const maxRows = Math.min(bases.length, 8);
    const lgH = maxRows * rowH + lgPad;
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#0b121c'; ctx.fillRect(lgX, lgY, mmW, lgH);
    ctx.globalAlpha = 1.0; ctx.font = '8px monospace';
    for (let i=0;i<maxRows;i++){
      const b = bases[i];
      ctx.fillStyle = b.color; ctx.fillRect(lgX + 4, lgY + 2 + i*rowH, 8, 8);
      ctx.fillStyle = '#e6edf3';
      const name = b.name.length>16 ? b.name.slice(0,15)+'…' : b.name;
      ctx.fillText(name, lgX + 16, lgY + 10 + i*rowH);
    }
    ctx.restore();
  }

  // Petit helper pour dessiner une flèche directionnelle (mini-carte)
  function drawArrow(ctx, cx, cy, ang, color){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    // tête (triangle)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-6, -4);
    ctx.closePath();
    ctx.fill();
    // queue
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-12, -1, 10, 2);
    ctx.restore();
  }

  // --------- Épée ---------
  function getSwordHitbox(){
    const dir = player.attack.dir >= 0 ? 1 : -1;
    const swordW = 18, swordH = 8;
    const sx = dir>0 ? (player.x + player.w) : (player.x - swordW);
    const sy = player.y + player.h*0.45 - swordH/2;
    return { x: sx, y: sy, w: swordW, h: swordH };
  }
  function drawSword(ctx, s){
    ctx.save();
    // lame
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(s.x, s.y + 2, s.w - 4, s.h - 4);
    // garde
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(s.x - 2, s.y + s.h/2 - 2, 6, 4);
    // éclat
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x + 2, s.y + 3, s.w/3, 1); ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawShuriken(ctx, s, t){
    ctx.save();
    const cx = s.x + s.w/2, cy = s.y + s.h/2;
    ctx.translate(cx, cy);
    ctx.rotate(t * 10);
    ctx.fillStyle = '#9aa7b2';
    // croix
    ctx.fillRect(-1, -4, 2, 8);
    ctx.fillRect(-4, -1, 8, 2);
    // pointes
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-1, -6, 2, 2);
    ctx.fillRect(-1, 4, 2, 2);
    ctx.fillRect(4, -1, 2, 2);
    ctx.fillRect(-6, -1, 2, 2);
    ctx.restore();
  }

  // ---------- Chats: rendu et skins ----------
  const SKINS = [
    { name: 'Gris', body: '#6b6f76', ear: '#d9c3b6', eye: '#ffe680', pattern: null },
    { name: 'Tigré orange', body: '#d98943', ear: '#f0c9b7', eye: '#9be564', pattern: { type: 'stripes', color: '#c66f2b' } },
    { name: 'Noir', body: '#1a1a1a', ear: '#b89484', eye: '#fdd835', pattern: null },
    { name: 'Siamois', body: '#c9b7a6', ear: '#e8d9cd', eye: '#7bdc65', pattern: { type: 'mask', color: '#6e5a50' } },
  ];

  function drawCat(ctx, x, y, w, h, skin, facingRight, t){
    // Normalise
    const s = h/22;
    const bodyW = Math.max(14*s, w);
    const bodyH = Math.max(10*s, h*0.8);
    const bodyX = x + (w - bodyW)*0.5;
    const bodyY = y + h - bodyH;
    const headR = 6*s;
    const headCX = facingRight ? (bodyX + bodyW - headR - 1) : (bodyX + headR + 1);
    const headCY = bodyY + bodyH - headR - 2*s;

    // Ombre légère
    ctx.globalAlpha = 0.15; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x+w*0.5, y+h+1, w*0.4, 3*s, 0, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;

    // Corps
    ctx.fillStyle = skin.body;
    roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 4*s, true);

    // Queue
    ctx.save();
    const tailBaseX = facingRight ? bodyX + 3*s : bodyX + bodyW - 3*s;
    ctx.translate(tailBaseX, bodyY + bodyH*0.4);
    ctx.rotate((facingRight?-1:1) * 0.25);
    ctx.fillStyle = skin.body;
    roundRect(ctx, 0, -1*s, 10*s, 2*s, 1*s, true);
    ctx.restore();

    // Tête
    ctx.fillStyle = skin.body; ctx.beginPath(); ctx.arc(headCX, headCY, headR, 0, Math.PI*2); ctx.fill();
    // Oreilles
    ctx.fillStyle = skin.body; triangle(ctx, headCX - headR*0.7*(facingRight?1:-1), headCY - headR*0.9, headCX - headR*0.2*(facingRight?1:-1), headCY - headR*1.4, headCX - headR*0.05*(facingRight?1:-1), headCY - headR*0.8);
    ctx.fillStyle = skin.body; triangle(ctx, headCX + headR*0.05*(facingRight?1:-1), headCY - headR*0.8, headCX + headR*0.2*(facingRight?1:-1), headCY - headR*1.4, headCX + headR*0.7*(facingRight?1:-1), headCY - headR*0.9);
    // Intérieur oreille
    ctx.fillStyle = skin.ear; ctx.globalAlpha = 0.7;
    triangle(ctx, headCX - headR*0.6*(facingRight?1:-1), headCY - headR*0.85, headCX - headR*0.25*(facingRight?1:-1), headCY - headR*1.2, headCX - headR*0.1*(facingRight?1:-1), headCY - headR*0.8);
    triangle(ctx, headCX + headR*0.1*(facingRight?1:-1), headCY - headR*0.8, headCX + headR*0.25*(facingRight?1:-1), headCY - headR*1.2, headCX + headR*0.6*(facingRight?1:-1), headCY - headR*0.85);
    ctx.globalAlpha = 1.0;

    // Motifs
    if (skin.pattern && skin.pattern.type === 'stripes'){
      ctx.strokeStyle = skin.pattern.color; ctx.lineWidth = 1.2*s; ctx.globalAlpha = 0.6;
      for (let i=0;i<4;i++){
        const px = bodyX + (i+1)*(bodyW/5);
        ctx.beginPath(); ctx.moveTo(px, bodyY+2*s); ctx.lineTo(px - (facingRight?3*s:-3*s), bodyY+bodyH-2*s); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }
    if (skin.pattern && skin.pattern.type === 'mask'){
      ctx.fillStyle = skin.pattern.color; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(headCX, headCY, headR*0.9, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;
    }

    // Yeux (clignement)
    const blink = (Math.sin(t*3 + headCX*0.1) > 0.9);
    ctx.fillStyle = skin.eye;
    if (!blink){
      const ex = headCX + (facingRight? -headR*0.3 : headR*0.3);
      const ex2 = headCX + (facingRight? -headR*0.7 : headR*0.7);
      ctx.fillRect(ex-1, headCY-1, 2, 2);
      ctx.fillRect(ex2-1, headCY-1, 2, 2);
    } else {
      ctx.strokeStyle = skin.eye; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(headCX - headR*0.3, headCY); ctx.lineTo(headCX - headR*0.1, headCY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(headCX + headR*0.1, headCY); ctx.lineTo(headCX + headR*0.3, headCY); ctx.stroke();
    }

    // Moustaches
    ctx.strokeStyle = '#d8d8d8'; ctx.globalAlpha = 0.6; ctx.lineWidth = 0.8*s;
    const mx = headCX + (facingRight? -headR*0.1 : headR*0.1);
    ctx.beginPath(); ctx.moveTo(mx, headCY+1); ctx.lineTo(mx + (facingRight?-4:4), headCY+2); ctx.moveTo(mx, headCY+1); ctx.lineTo(mx + (facingRight?-4:4), headCY); ctx.moveTo(mx, headCY+1); ctx.lineTo(mx + (facingRight?-4:4), headCY+4); ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  function roundRect(ctx, x, y, w, h, r, fill){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    if (fill) ctx.fill(); else ctx.stroke();
  }
  function triangle(ctx, x1,y1,x2,y2,x3,y3){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); }

  function setPlayerSkin(index){ player.skin = ((index|0) % SKINS.length + SKINS.length) % SKINS.length; }
  function getSkins(){ return SKINS.map(s=>s.name); }

  // ---------- Trésors ----------
  // Coffre caché sur une plateforme à droite
  const chests = [
    { x: (70)*TS, y: (H-6)*TS, w: TS, h: TS, opened: false, contains: 'shield' },
    // Coffre bonus plus profond (grotte centrale)
    { x: (60)*TS, y: (H-10)*TS, w: TS, h: TS, opened: false, contains: 'shield2' },
  ];

  function drawChest(ctx, c){
    ctx.save();
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#a7743c';
    ctx.fillRect(c.x+2, c.y+2, c.w-4, c.h/2-2);
    ctx.fillStyle = '#caa574';
    ctx.fillRect(c.x + c.w/2 - 2, c.y + c.h/2 - 2, 4, 6);
    ctx.restore();
  }

  return { update, render, reset, setPlayerSkin, getSkins };
}
