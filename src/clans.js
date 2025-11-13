// Simple local clan system (single-player). Provides basic territory protection.

export class ClanManager {
  constructor() {
    this.clans = []; // { name, color, base: { x, z }, radius }
    this.playerClan = null;
  }

  createClan(name, color) {
    if (!name) name = `Clan-${Math.floor(Math.random()*1000)}`;
    const clan = { name, color, base: null, radius: 8 };
    this.clans.push(clan);
    this.playerClan = clan;
    return clan;
  }

  joinClan(name) {
    const c = this.clans.find(c=>c.name.toLowerCase()===name.toLowerCase());
    if (c) this.playerClan = c;
    return c;
  }

  claimBaseAt(x, z) {
    if (!this.playerClan) return false;
    this.playerClan.base = { x: Math.floor(x), z: Math.floor(z) };
    return true;
  }

  // Check whether an action (break/place) is allowed at x,y,z
  canEdit(x, y, z) {
    // allow everywhere if no bases exist
    const bases = this.clans.filter(c=>!!c.base);
    if (bases.length === 0) return true;
    // If position is inside another clan's base, disallow
    for (const c of bases) {
      const r = c.radius;
      const inside = Math.abs(x - c.base.x) <= r && Math.abs(z - c.base.z) <= r;
      if (inside && c !== this.playerClan) return false;
    }
    return true;
  }
}

