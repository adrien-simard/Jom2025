Jom 2025 — Jeux Web + Python (Voxel, Plateforme, Snake)

Aperçu
- Voxel Clans (Web, Three.js): monde voxel 3D type Minecraft, placement/cassage de blocs, mini‑système de « clans » local avec zones protégées.
- Guerre des Clans type Mario (Web, Canvas 2D): plateformer avec multiples bases/clans à capturer, grottes, mini‑carte, ennemis chats, attaques (épée et shurikens adverses), trésors/boucliers.
- Snake (Python, Tkinter): mini‑jeu sans dépendances.

Prérequis
- Navigateur moderne: Chrome, Edge ou Firefox (récent).
- Python 3.8+ (pour héberger les pages web en local et pour Snake). Vérifier avec `python --version`.
- Réseau local autorisé sur `localhost` (pare‑feu) pour servir les pages.

Installation
- Aucune installation de dépendances requise (utilise des CDN côté web, et Tkinter côté Python).

Démarrage rapide
1) Lancer un serveur HTTP local à la racine du projet
   - Windows PowerShell:
     `python -m http.server 5173`
   - macOS/Linux (bash/zsh):
     `python3 -m http.server 5173`

2) Ouvrir les jeux dans le navigateur
   - Voxel Clans (3D): `http://localhost:5173/`
   - Mario‑Clans (2D): `http://localhost:5173/mario-clans/`

3) Lancer Snake (optionnel)
   - `python snake/main.py`

Commandes et contrôles
- Voxel Clans (3D)
  - Clic pour capturer la souris; regarder: souris
  - Bouger: WASD / ZQSD / Flèches
  - Casser: clic gauche; Placer: clic droit; Sélection blocs: 1–4
  - Clans (panneau à droite): nom/couleur, Créer/Rejoindre, « Définir base ici » (protège la zone)

- Mario‑Clans (2D)
  - Bouger: A/D ou Q/D ou Flèches gauche/droite
  - Sauter: Espace ou Flèche haut
  - Attaquer: C (épée)
  - Recommencer: R
  - Objectif: capturer toutes les bases de clans (certaines sont cachées dans des grottes). Mini‑carte en haut‑droite, flèches vers bases non révélées, légende des clans.
  - Trésors: coffres avec boucliers (halo bleu; chaque charge annule un coup et confère une brève invulnérabilité)

- Snake (Tkinter)
  - Flèches: diriger; P: pause; R: recommencer

Structure du projet
- Racine
  - `index.html`, `src/` → Voxel Clans (Three.js + modules ES chargés via CDN)
  - `mario-clans/` → Plateformer 2D (Canvas + JS sans dépendances)
  - `snake/` → Snake (Python, Tkinter)

Notes d’environnement
- Serveur local requis pour les jeux Web: l’ouverture directe de `index.html` en `file://` peut être bloquée (modules ES et CORS). Utiliser `python -m http.server`.
- Ports: 5173 recommandé, mais vous pouvez en choisir un autre (ex. 8080). Exemple: `python -m http.server 8080` puis `http://localhost:8080/mario-clans/`.
- Pare‑feu Windows: autoriser Python à écouter sur `localhost` si demandé.

Personnalisation (développement)
- Voxel Clans
  - Taille du monde: `src/world.js` (largeur/profondeur/hauteur) et génération du relief.
  - Contrôles FPS: `src/player.js` (vitesse, gestion ZQSD/WASD/flèches).
  - Interactions/place/casse: `src/main.js` (rebuild du mesh; types de blocs 1–4).

- Mario‑Clans
  - Niveau/grottes/plateformes: `mario-clans/src/game.js` (grille, appels `setRect(...)`).
  - Physique et mouvement: constantes `acc`, `maxv`, `fric`, saut `player.vy = -420`.
  - IA ennemis et projectiles: section « Ennemis » et tableau `shurikens`.
  - Clans/bases: tableau `bases` (position, taille, couleur, hidden, locked) et logique de capture (taux `rate`, recul `decay`).
  - Mini‑carte: bloc « Mini‑carte » (révélation, flèches directionnelles, légende).

Déploiement (facultatif)
- GitHub Pages (projet statique):
  - Pousser la branche contenant ce code.
  - Activer Pages (Settings → Pages → Branch: `main`/`root`).
  - Accès: `/` pour Voxel, `/mario-clans/` pour le plateformer.

Dépannage
- Rien ne bouge dans le plateformer:
  - Cliquer dans le canvas (focus clavier), puis utiliser les flèches.
  - Hard refresh (Ctrl+F5 / Ctrl+Shift+R) après mise à jour du code.
- Erreur modules/CORS dans Voxel: lancer un serveur local (voir « Démarrage rapide »).
- Le scroll de page se déclenche avec les flèches/espace: le canvas bloque par défaut ces touches, s’assurer qu’il a le focus.
- Pare‑feu: si la page ne se charge pas, vérifier l’autorisation de Python dans le pare‑feu.

Feuille de route (idées)
- Voxel: chunks + rebuild partiel, textures, persistance et multijoueur WebSocket.
- Mario‑Clans: niveaux multiples, graphismes/sons, IA avancée, modes (parade des shurikens, boss), sauvegarde.
- Snake: meilleurs scores, niveaux de vitesse, thèmes.
