// Simple voxel world with heightmap generation and face-culling mesh builder

export const Block = {
  Air: 0,
  Grass: 1,
  Dirt: 2,
  Stone: 3,
  Wood: 4,
};

export function blockColor(id) {
  switch (id) {
    case Block.Grass: return 0x58a14f;
    case Block.Dirt: return 0x7a5d3d;
    case Block.Stone: return 0x8d99ae;
    case Block.Wood: return 0xcaa574;
    default: return 0x000000;
  }
}

export class VoxelWorld {
  constructor({ width = 64, depth = 64, height = 32 } = {}) {
    this.width = width;
    this.depth = depth;
    this.height = height;
    this.data = new Uint8Array(width * depth * height);
  }

  index(x, y, z) { return x + this.width * (z + this.depth * y); }

  inBounds(x, y, z) {
    return x >= 0 && x < this.width && z >= 0 && z < this.depth && y >= 0 && y < this.height;
  }

  get(x, y, z) { return this.inBounds(x, y, z) ? this.data[this.index(x, y, z)] : Block.Air; }

  set(x, y, z, v) { if (this.inBounds(x, y, z)) this.data[this.index(x, y, z)] = v; }

  generateTerrain() {
    for (let z = 0; z < this.depth; z++) {
      for (let x = 0; x < this.width; x++) {
        const h = Math.floor(8 + 3 * Math.sin(x * 0.15) + 2.5 * Math.cos(z * 0.12));
        for (let y = 0; y < this.height; y++) {
          if (y < h - 3) this.set(x, y, z, Block.Stone);
          else if (y < h - 1) this.set(x, y, z, Block.Dirt);
          else if (y < h) this.set(x, y, z, Block.Grass);
          else this.set(x, y, z, Block.Air);
        }
      }
    }
  }

  // Build a THREE.Group with one mesh per block type using simple face culling
  buildMesh(THREE) {
    const group = new THREE.Group();
    const directions = [
      { d: [ 1, 0, 0], n: [ 1, 0, 0] }, // +x
      { d: [-1, 0, 0], n: [-1, 0, 0] }, // -x
      { d: [ 0, 1, 0], n: [ 0, 1, 0] }, // +y
      { d: [ 0,-1, 0], n: [ 0,-1, 0] }, // -y
      { d: [ 0, 0, 1], n: [ 0, 0, 1] }, // +z
      { d: [ 0, 0,-1], n: [ 0, 0,-1] }, // -z
    ];

    const byType = new Map();
    for (let z = 0; z < this.depth; z++) {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const id = this.get(x, y, z);
          if (!id) continue;
          for (const { d, n } of directions) {
            const nx = x + d[0], ny = y + d[1], nz = z + d[2];
            if (this.get(nx, ny, nz) === Block.Air) {
              const arr = byType.get(id) || [];
              arr.push({ x, y, z, n });
              byType.set(id, arr);
            }
          }
        }
      }
    }

    const quad = (ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz, nx, ny, nz) => {
      const pos = [
        ax, ay, az,  bx, by, bz,  cx, cy, cz,
        ax, ay, az,  cx, cy, cz,  dx, dy, dz,
      ];
      const nrm = new Array(6).fill([nx, ny, nz]).flat();
      return { pos, nrm };
    };

    const pushFace = (verts, norms, x, y, z, n) => {
      const s = 1; // block size
      const X = x, Y = y, Z = z;
      const px = X, py = Y, pz = Z;
      const fx = px + 1, fy = py + 1, fz = pz + 1;
      let q;
      if (n[0] === 1) q = quad(fx,py,pz, fx,fy,pz, fx,fy,fz, fx,py,fz, 1,0,0);
      else if (n[0] === -1) q = quad(px,py,fz, px,fy,fz, px,fy,pz, px,py,pz, -1,0,0);
      else if (n[1] === 1) q = quad(px,fy,pz, fx,fy,pz, fx,fy,fz, px,fy,fz, 0,1,0);
      else if (n[1] === -1) q = quad(px,py,fz, fx,py,fz, fx,py,pz, px,py,pz, 0,-1,0);
      else if (n[2] === 1) q = quad(px,py,fz, fx,py,fz, fx,fy,fz, px,fy,fz, 0,0,1);
      else q = quad(fx,py,pz, px,py,pz, px,fy,pz, fx,fy,pz, 0,0,-1);
      verts.push(...q.pos); norms.push(...q.nrm);
    };

    for (const [id, faces] of byType.entries()) {
      const verts = [], norms = [];
      for (const f of faces) pushFace(verts, norms, f.x, f.y, f.z, f.n);
      if (verts.length === 0) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
      geo.computeBoundingSphere();
      const mat = new THREE.MeshStandardMaterial({ color: blockColor(id) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = false; mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }

  // 3D-DDA voxel raycast. Returns { hit, pos:{x,y,z}, normal:{x,y,z}, prev:{x,y,z} }
  pickVoxel(origin, direction, maxDist = 6) {
    let ox = origin.x, oy = origin.y, oz = origin.z;
    let dx = direction.x, dy = direction.y, dz = direction.z;
    const stepX = Math.sign(dx) || 1, stepY = Math.sign(dy) || 1, stepZ = Math.sign(dz) || 1;
    let tMaxX, tMaxY, tMaxZ;
    let tDeltaX = Math.abs(1 / (dx || 1e-8));
    let tDeltaY = Math.abs(1 / (dy || 1e-8));
    let tDeltaZ = Math.abs(1 / (dz || 1e-8));

    let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
    const frac = (v) => v - Math.floor(v);
    tMaxX = ((stepX > 0 ? 1 - frac(ox) : frac(ox)) ) * tDeltaX;
    tMaxY = ((stepY > 0 ? 1 - frac(oy) : frac(oy)) ) * tDeltaY;
    tMaxZ = ((stepZ > 0 ? 1 - frac(oz) : frac(oz)) ) * tDeltaZ;

    let dist = 0;
    let lastAxis = 0; // 1=x,2=y,3=z
    while (dist <= maxDist) {
      if (this.inBounds(x, y, z) && this.get(x, y, z) !== Block.Air) {
        const normal = lastAxis === 1 ? {x: -stepX, y:0, z:0} : lastAxis === 2 ? {x:0,y:-stepY,z:0} : {x:0,y:0,z:-stepZ};
        const prev = lastAxis === 1 ? {x: x - stepX, y, z} : lastAxis === 2 ? {x, y: y - stepY, z} : {x, y, z: z - stepZ};
        return { hit: true, pos: { x, y, z }, normal, prev };
      }
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) { x += stepX; dist = tMaxX; tMaxX += tDeltaX; lastAxis = 1; }
        else { z += stepZ; dist = tMaxZ; tMaxZ += tDeltaZ; lastAxis = 3; }
      } else {
        if (tMaxY < tMaxZ) { y += stepY; dist = tMaxY; tMaxY += tDeltaY; lastAxis = 2; }
        else { z += stepZ; dist = tMaxZ; tMaxZ += tDeltaZ; lastAxis = 3; }
      }
      if (!this.inBounds(x, y, z) && dist > 0) {
        if (dist > maxDist) break;
      }
    }
    return { hit: false };
  }
}

