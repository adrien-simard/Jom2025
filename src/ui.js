// UI helpers: hotbar and clan panel

export function createHotbar({ onSelect }) {
  const hud = document.getElementById('hud');
  hud.innerHTML = '';
  const slots = [1,2,3,4].map(id => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.dataset.id = String(id);
    div.textContent = String(id);
    div.addEventListener('click', ()=>onSelect(id));
    hud.appendChild(div);
    return div;
  });
  function setSelected(id) {
    for (const s of slots) s.classList.toggle('selected', Number(s.dataset.id) === id);
  }
  setSelected(1);
  return { setSelected };
}

export function createClanPanel({ onCreate, onJoin, onClaim }) {
  const p = document.getElementById('ui-panel');
  p.innerHTML = '';
  const h = document.createElement('h3'); h.textContent = 'Clans (MVP local)'; p.appendChild(h);
  const name = document.createElement('input'); name.type = 'text'; name.placeholder = 'Nom du clan'; p.appendChild(name);
  const color = document.createElement('input'); color.type = 'color'; color.value = '#58a14f'; p.appendChild(color);
  const btnCreate = document.createElement('button'); btnCreate.textContent = 'Créer/Rejoindre (si existe)'; p.appendChild(btnCreate);
  const btnClaim = document.createElement('button'); btnClaim.textContent = 'Définir base ici'; p.appendChild(btnClaim);
  const info = document.createElement('div'); info.style.marginTop = '6px'; info.style.opacity = '.85'; p.appendChild(info);

  btnCreate.addEventListener('click', () => {
    const nm = name.value.trim() || undefined;
    const c = onJoin(nm) || onCreate(nm, color.value);
    info.textContent = `Clan: ${c.name} • Couleur: ${c.color || color.value}`;
  });
  btnClaim.addEventListener('click', () => onClaim());
  return { setInfo(text){ info.textContent = text; } };
}

