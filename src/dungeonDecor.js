import * as THREE from 'three';
import { plasterTex, stoneTex, woodTex, dirtTex, matMap } from './textures.js';

const mats = new Map();
const M = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c })); return mats.get(c); };
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function add(parent, geo, colorOrMat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(geo, typeof colorOrMat === 'string' ? M(colorOrMat) : colorOrMat);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  parent.add(m);
  return m;
}

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function floorMatFor(def) {
  if (def.id === 'mossroot') return matMap(dirtTex(), '#a8c478', 4, 4);
  if (def.id === 'rustpick') return matMap(stoneTex(), '#c5cad0', 3, 3);
  if (def.id === 'crypt') return matMap(stoneTex(), '#6c757d', 3, 3);
  if (def.id === 'ember') return matMap(dirtTex(), '#a34a28', 4, 4);
  if (def.id === 'drowned') return matMap(stoneTex(), '#4c6ef5', 3, 3);
  if (def.id === 'bastion') return matMap(stoneTex(), '#adb5bd', 3, 3);
  if (def.id === 'storm') return matMap(stoneTex(), '#748ffc', 3, 3);
  if (def.id === 'eclipse') return matMap(stoneTex(), '#495057', 3, 3);
  if (def.id === 'astral') return matMap(stoneTex(), '#e67700', 3, 3);
  if (def.id === 'crown') return matMap(stoneTex(), '#e599f7', 3, 3);
  return M(def.floorColor);
}

export function wallMatFor(def) {
  if (def.id === 'mossroot') return new THREE.MeshLambertMaterial({ map: plasterTex('#5c7c4a'), color: '#d8e8c8' });
  if (def.id === 'rustpick') return new THREE.MeshLambertMaterial({ map: stoneTex(), color: '#e9ecef' });
  if (def.id === 'crypt') return new THREE.MeshLambertMaterial({ map: plasterTex('#212529'), color: '#ffffff' });
  if (def.id === 'ember') return new THREE.MeshLambertMaterial({ map: plasterTex('#5c1a0a'), color: '#ffffff' });
  if (def.id === 'drowned') return new THREE.MeshLambertMaterial({ map: plasterTex('#0b3d66'), color: '#ffffff' });
  if (def.id === 'bastion') return new THREE.MeshLambertMaterial({ map: stoneTex(), color: '#868e96' });
  if (def.id === 'storm') return new THREE.MeshLambertMaterial({ map: plasterTex('#364fc7'), color: '#ffffff' });
  if (def.id === 'eclipse') return new THREE.MeshLambertMaterial({ map: plasterTex('#1b263b'), color: '#ffffff' });
  if (def.id === 'astral') return new THREE.MeshLambertMaterial({ map: plasterTex('#5c3b0a'), color: '#ffffff' });
  if (def.id === 'crown') return new THREE.MeshLambertMaterial({ map: plasterTex('#862e9c'), color: '#ffffff' });
  return M(def.wallColor);
}

/** Scatter 50–100+ themed props into a room. Returns hazard patches {x,z,r,type}. */
export function decorateRoom(group, def, room, floorSeed, hazards) {
  const rnd = seeded((floorSeed * 131 + room.x * 17 + room.z * 31) >>> 0);
  const edge = (pad = 1.2) => ({
    x: room.x + (rnd() - 0.5) * (room.w - pad * 2),
    z: room.z + (rnd() - 0.5) * (room.d - pad * 2),
  });

  // Corner pillars / posts for every room
  for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    const px = room.x + sx * (room.w / 2 - 0.6);
    const pz = room.z + sz * (room.d / 2 - 0.6);
    if (def.id === 'rustpick') {
      add(group, box(0.35, 3.0, 0.35), '#6b3f24', px, 1.5, pz);
      add(group, box(1.2, 0.2, 0.2), '#8b5a2b', px, 2.9, room.z);
    } else if (def.id === 'crypt') {
      add(group, new THREE.CylinderGeometry(0.28, 0.35, 3.0, 8), '#495057', px, 1.5, pz);
      add(group, box(0.7, 0.2, 0.7), '#868e96', px, 3.05, pz);
    } else {
      add(group, new THREE.CylinderGeometry(0.22, 0.3, 2.6, 7), '#5c4033', px, 1.3, pz);
      add(group, new THREE.SphereGeometry(0.45, 7, 5), '#2f9e44', px, 2.7, pz);
    }
  }

  if (def.id === 'mossroot') {
    // mushrooms
    for (let i = 0; i < 14; i++) {
      const p = edge(1.5);
      const h = 0.25 + rnd() * 0.35;
      add(group, new THREE.CylinderGeometry(0.1, 0.14, h, 6), '#f8f9fa', p.x, h / 2, p.z);
      const capCol = ['#e03131', '#fab005', '#be4bdb', '#2f9e44', '#e67700'][(rnd() * 5) | 0];
      add(group, new THREE.SphereGeometry(0.22 + rnd() * 0.25, 8, 6), capCol, p.x, h + 0.15, p.z);
    }
    // root vines on floor
    for (let i = 0; i < 8; i++) {
      const p = edge(2);
      const root = add(group, box(0.2 + rnd() * 1.4, 0.12, 0.25), '#6b4423', p.x, 0.08, p.z);
      root.rotation.y = rnd() * Math.PI;
    }
    // spore hazard patches
    for (let i = 0; i < 3; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.1, 12), '#82c91e', p.x, 0.06, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#82c91e', transparent: true, opacity: 0.35 });
      hazards.push({ x: p.x, z: p.z, r: 1.15, type: 'poison', dmg: 3 });
    }
    // glowing fungus lamps
    for (let i = 0; i < 4; i++) {
      const p = edge(1.8);
      const g = add(group, new THREE.SphereGeometry(0.2, 8, 6), '#c0eb75', p.x, 1.6, p.z, false);
      g.material = new THREE.MeshLambertMaterial({ color: '#c0eb75', emissive: '#5c940d', emissiveIntensity: 0.55 });
      add(group, box(0.08, 1.5, 0.08), '#5c4033', p.x, 0.75, p.z);
    }
  }

  if (def.id === 'rustpick') {
    // ore carts / crates / beams
    for (let i = 0; i < 6; i++) {
      const p = edge(2);
      add(group, box(1.1, 0.7, 0.8), '#8b5a2b', p.x, 0.4, p.z);
      add(group, box(0.9, 0.35, 0.6), '#868e96', p.x, 0.9, p.z);
    }
    for (let i = 0; i < 8; i++) {
      const p = edge(1.5);
      add(group, box(0.55, 0.55, 0.55), '#6b3f24', p.x, 0.3, p.z);
    }
    // ceiling timber hints (as high beams)
    for (let i = 0; i < 3; i++) {
      add(group, box(room.w * 0.7, 0.2, 0.25), '#6b3f24', room.x, 3.0, room.z - room.d / 3 + i * (room.d / 3));
    }
    // lanterns
    for (let i = 0; i < 3; i++) {
      const p = edge(2);
      add(group, box(0.12, 1.4, 0.12), '#343a40', p.x, 1.8, p.z);
      const flame = add(group, new THREE.SphereGeometry(0.18, 6, 5), '#ffd43b', p.x, 2.55, p.z, false);
      flame.material = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#e67700', emissiveIntensity: 0.7 });
    }
    // rockfall hazard marks
    for (let i = 0; i < 2; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.3, 12), '#fab005', p.x, 0.07, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#fab005', transparent: true, opacity: 0.3 });
      hazards.push({ x: p.x, z: p.z, r: 1.35, type: 'blunt', dmg: 8 });
    }
    // rails
    add(group, box(room.w * 0.6, 0.08, 0.12), '#adb5bd', room.x, 0.1, room.z + 1.5);
    add(group, box(room.w * 0.6, 0.08, 0.12), '#adb5bd', room.x, 0.1, room.z - 1.5);
  }

  if (def.id === 'crypt') {
    // sarcophagi / tombs
    for (let i = 0; i < 5; i++) {
      const p = edge(2.2);
      add(group, box(1.1, 0.7, 2.0), '#495057', p.x, 0.4, p.z);
      add(group, box(1.2, 0.15, 2.1), '#868e96', p.x, 0.8, p.z);
      add(group, box(0.35, 0.35, 0.1), '#ffd43b', p.x, 0.95, p.z + 0.7);
    }
    // bone piles
    for (let i = 0; i < 10; i++) {
      const p = edge(1.5);
      add(group, box(0.5, 0.25, 0.3), '#f8f9fa', p.x, 0.15, p.z);
      add(group, box(0.15, 0.45, 0.15), '#f1f3f5', p.x + 0.2, 0.3, p.z);
    }
    // candles
    for (let i = 0; i < 6; i++) {
      const p = edge(1.8);
      add(group, box(0.12, 0.45, 0.12), '#fff4e6', p.x, 0.3, p.z);
      const flame = add(group, new THREE.SphereGeometry(0.1, 6, 5), '#ffa94d', p.x, 0.6, p.z, false);
      flame.material = new THREE.MeshLambertMaterial({ color: '#ffa94d', emissive: '#e8590c', emissiveIntensity: 0.75 });
    }
    // curse tiles
    for (let i = 0; i < 3; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.2, 12), '#7048e8', p.x, 0.06, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#7048e8', transparent: true, opacity: 0.35 });
      hazards.push({ x: p.x, z: p.z, r: 1.2, type: 'dark', dmg: 5 });
    }
    // wall niches
    for (let i = 0; i < 4; i++) {
      const along = (i / 4) - 0.4;
      add(group, box(0.8, 1.0, 0.25), '#343a40', room.x + along * room.w * 0.7, 1.6, room.z - room.d / 2 + 0.25);
    }
  }

  if (def.id === 'ember') {
    for (let i = 0; i < 10; i++) {
      const p = edge(1.8);
      add(group, new THREE.ConeGeometry(0.35 + rnd() * 0.3, 0.8 + rnd() * 0.6, 6), '#e03131', p.x, 0.5, p.z);
      const flame = add(group, new THREE.SphereGeometry(0.2, 6, 5), '#ff922b', p.x, 1.0, p.z, false);
      flame.material = new THREE.MeshLambertMaterial({ color: '#ff922b', emissive: '#e8590c', emissiveIntensity: 0.7 });
    }
    for (let i = 0; i < 6; i++) {
      const p = edge(2);
      add(group, box(0.8, 0.35, 0.8), '#343a40', p.x, 0.2, p.z);
      add(group, box(0.5, 0.9, 0.5), '#495057', p.x, 0.7, p.z);
    }
    for (let i = 0; i < 4; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.3, 12), '#fa5252', p.x, 0.06, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#fa5252', transparent: true, opacity: 0.35 });
      hazards.push({ x: p.x, z: p.z, r: 1.35, type: 'fire', dmg: 7 });
    }
    // lava rivulet
    add(group, box(room.w * 0.55, 0.08, 0.7), '#e03131', room.x, 0.08, room.z + room.d * 0.15);
  }

  if (def.id === 'drowned') {
    for (let i = 0; i < 8; i++) {
      const p = edge(2);
      add(group, new THREE.CylinderGeometry(0.25, 0.35, 1.4 + rnd(), 7), '#2b8a3e', p.x, 0.8, p.z); // coral
      add(group, new THREE.SphereGeometry(0.3, 6, 5), '#74c0fc', p.x, 1.5, p.z, false);
    }
    for (let i = 0; i < 5; i++) {
      const p = edge(2.2);
      add(group, box(0.7, 1.6, 0.5), '#adb5bd', p.x, 0.8, p.z); // ruined statue
      add(group, box(0.5, 0.4, 0.4), '#ced4da', p.x, 1.8, p.z);
    }
    // shallow water sheen
    const water = add(group, box(room.w - 1.5, 0.06, room.d - 1.5), '#1c7ed6', room.x, 0.1, room.z, false);
    water.material = new THREE.MeshLambertMaterial({ color: '#1c7ed6', transparent: true, opacity: 0.35 });
    for (let i = 0; i < 3; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.25, 12), '#7048e8', p.x, 0.12, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#4c6ef5', transparent: true, opacity: 0.4 });
      hazards.push({ x: p.x, z: p.z, r: 1.3, type: 'water', dmg: 6 });
    }
    // raised pads for flood mechanic (marked for boss rooms mainly)
    if (room.boss || room.id === 'mid') {
      for (const [ox, oz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
        add(group, box(1.8, 0.55, 1.8), '#868e96', room.x + ox, 0.35, room.z + oz);
      }
    }
  }

  if (def.id === 'bastion') {
    for (let i = 0; i < 8; i++) {
      const p = edge(2);
      add(group, box(0.9, 1.8, 0.9), '#adb5bd', p.x, 0.9, p.z);
      add(group, new THREE.CylinderGeometry(0.35, 0.35, 0.4, 10), '#868e96', p.x, 2.0, p.z);
    }
    for (let i = 0; i < 10; i++) {
      const p = edge(1.5);
      add(group, box(0.5, 0.5, 0.5), '#495057', p.x, 0.3, p.z);
      add(group, new THREE.TorusGeometry(0.28, 0.06, 6, 10), '#c9922a', p.x, 0.7, p.z).rotation.x = Math.PI / 2;
    }
    // steam vents
    for (let i = 0; i < 3; i++) {
      const p = edge(2.5);
      add(group, new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8), '#343a40', p.x, 0.2, p.z);
      const steam = add(group, new THREE.SphereGeometry(0.45, 8, 6), '#f8f9fa', p.x, 0.7, p.z, false);
      steam.material = new THREE.MeshBasicMaterial({ color: '#f8f9fa', transparent: true, opacity: 0.35 });
      hazards.push({ x: p.x, z: p.z, r: 1.2, type: 'blunt', dmg: 8 });
    }
    // wall banners + gear racks (B polish)
    for (let i = 0; i < 3; i++) {
      add(group, box(0.08, 1.6, 0.9), '#c92a2a', room.x - room.w / 2 + 0.3, 2.0, room.z - 2 + i * 2);
    }
    for (let i = 0; i < 4; i++) {
      const p = edge(2);
      add(group, box(1.2, 0.15, 0.4), '#868e96', p.x, 1.4, p.z);
      add(group, box(0.12, 1.3, 0.12), '#495057', p.x - 0.4, 0.7, p.z);
      add(group, box(0.12, 1.3, 0.12), '#495057', p.x + 0.4, 0.7, p.z);
    }
  }

  if (def.id === 'storm') {
    // floating crystal spires
    for (let i = 0; i < 8; i++) {
      const p = edge(1.8);
      add(group, new THREE.ConeGeometry(0.35, 1.6 + rnd() * 0.8, 5), '#9775fa', p.x, 1.0, p.z);
      const tip = add(group, new THREE.SphereGeometry(0.18, 6, 5), '#ffd43b', p.x, 1.9, p.z, false);
      tip.material = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#fab005', emissiveIntensity: 0.75 });
    }
    // wind vanes / banners
    for (let i = 0; i < 5; i++) {
      const p = edge(2);
      add(group, box(0.1, 2.4, 0.1), '#adb5bd', p.x, 1.2, p.z);
      add(group, box(1.1, 0.55, 0.08), '#5c7cfa', p.x + 0.55, 2.2, p.z);
    }
    // cloud pedestals
    for (let i = 0; i < 4; i++) {
      const p = edge(2.2);
      add(group, new THREE.SphereGeometry(0.7, 8, 6), '#e7f5ff', p.x, 0.5, p.z, false).material =
        new THREE.MeshLambertMaterial({ color: '#e7f5ff', transparent: true, opacity: 0.7 });
      add(group, new THREE.SphereGeometry(0.45, 8, 6), '#dee2e6', p.x + 0.4, 0.55, p.z);
    }
    // gale hazard corridors
    for (let i = 0; i < 4; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.35, 14), '#748ffc', p.x, 0.07, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#748ffc', transparent: true, opacity: 0.38 });
      hazards.push({ x: p.x, z: p.z, r: 1.4, type: 'wind', dmg: 7, dir: rnd() * Math.PI * 2 });
    }
    // lightning scars on floor
    for (let i = 0; i < 3; i++) {
      const p = edge(2);
      const scar = add(group, box(0.2 + rnd() * 1.2, 0.06, 0.15), '#ffd43b', p.x, 0.1, p.z, false);
      scar.rotation.y = rnd() * Math.PI;
      scar.material = new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.65 });
    }
  }

  if (def.id === 'eclipse') {
    for (let i = 0; i < 6; i++) {
      const p = edge(2);
      add(group, new THREE.TorusGeometry(0.7, 0.08, 6, 16), '#ffd43b', p.x, 1.4, p.z).rotation.x = Math.PI / 2;
      add(group, new THREE.SphereGeometry(0.35, 8, 6), '#212529', p.x, 1.4, p.z);
    }
    for (let i = 0; i < 8; i++) {
      const p = edge(1.8);
      add(group, box(0.5, 1.8, 0.5), '#343a40', p.x, 0.9, p.z);
      const orb = add(group, new THREE.SphereGeometry(0.2, 6, 5), i % 2 ? '#ffd43b' : '#7048e8', p.x, 2.0, p.z, false);
      orb.material = new THREE.MeshLambertMaterial({
        color: i % 2 ? '#ffd43b' : '#7048e8',
        emissive: i % 2 ? '#fab005' : '#5f3dc4',
        emissiveIntensity: 0.7,
      });
    }
    for (let i = 0; i < 4; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.3, 14), '#212529', p.x, 0.07, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#212529', transparent: true, opacity: 0.45 });
      hazards.push({ x: p.x, z: p.z, r: 1.35, type: 'dark', dmg: 9 });
    }
  }

  if (def.id === 'astral') {
    for (let i = 0; i < 7; i++) {
      const p = edge(2);
      add(group, box(1.2, 0.5, 1.2), '#868e96', p.x, 0.3, p.z);
      add(group, new THREE.CylinderGeometry(0.35, 0.5, 1.2, 8), '#e67700', p.x, 1.1, p.z);
      const spark = add(group, new THREE.SphereGeometry(0.25, 6, 5), '#ffd43b', p.x, 1.9, p.z, false);
      spark.material = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#e8590c', emissiveIntensity: 0.8 });
    }
    for (let i = 0; i < 10; i++) {
      const p = edge(1.5);
      add(group, box(0.35, 0.35, 0.35), '#fab005', p.x, 0.25, p.z);
    }
    // slag rivers
    add(group, box(room.w * 0.5, 0.08, 0.7), '#fa5252', room.x, 0.08, room.z);
    for (let i = 0; i < 4; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.35, 12), '#e03131', p.x, 0.07, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#e03131', transparent: true, opacity: 0.4 });
      hazards.push({ x: p.x, z: p.z, r: 1.4, type: 'fire', dmg: 10 });
    }
  }

  if (def.id === 'crown') {
    for (let i = 0; i < 8; i++) {
      const p = edge(1.8);
      const cols = ['#ffd43b', '#be4bdb', '#74c0fc', '#fa5252'];
      const c = cols[(rnd() * cols.length) | 0];
      add(group, new THREE.CylinderGeometry(0.15, 0.22, 2.4, 6), '#adb5bd', p.x, 1.2, p.z);
      const gem = add(group, new THREE.OctahedronGeometry(0.35), c, p.x, 2.5, p.z, false);
      gem.material = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.55 });
    }
    for (let i = 0; i < 5; i++) {
      const p = edge(2.2);
      add(group, box(1.0, 0.2, 1.0), '#ffd43b', p.x, 0.15, p.z);
      add(group, new THREE.ConeGeometry(0.4, 0.6, 5), '#fcc419', p.x, 0.55, p.z);
    }
    for (let i = 0; i < 4; i++) {
      const p = edge(2.5);
      const patch = add(group, new THREE.CircleGeometry(1.3, 14), '#be4bdb', p.x, 0.07, p.z, false);
      patch.rotation.x = -Math.PI / 2;
      patch.material = new THREE.MeshBasicMaterial({ color: '#be4bdb', transparent: true, opacity: 0.4 });
      hazards.push({ x: p.x, z: p.z, r: 1.35, type: 'magic', dmg: 11 });
    }
  }

  if (room.safe) {
    add(group, box(room.w - 1.2, 0.06, room.d - 1.2), '#fff3bf', room.x, 0.16, room.z);
    add(group, new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8), '#ffd43b', room.x, 0.7, room.z);
    const gem = add(group, new THREE.SphereGeometry(0.28, 10, 8), '#74c0fc', room.x, 1.5, room.z, false);
    gem.material = new THREE.MeshLambertMaterial({ color: '#74c0fc', emissive: '#1c7ed6', emissiveIntensity: 0.7 });
  }

  if (room.boss) {
    // arena ring
    const ring = add(group, new THREE.RingGeometry(5.5, 6.2, 32), def.color, room.x, 0.08, room.z, false);
    ring.rotation.x = -Math.PI / 2;
    ring.material = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const bx = room.x + Math.cos(ang) * 7;
      const bz = room.z + Math.sin(ang) * 5.5;
      add(group, box(0.5, 2.4, 0.5), def.wallColor, bx, 1.2, bz);
      const torch = add(group, new THREE.SphereGeometry(0.22, 8, 6), '#ff922b', bx, 2.5, bz, false);
      torch.material = new THREE.MeshLambertMaterial({ color: '#ff922b', emissive: '#e8590c', emissiveIntensity: 0.8 });
    }
  }
}

export function decorateCorridor(group, def, x, z, w, d) {
  const mat = floorMatFor(def);
  add(group, box(Math.max(3.2, w), 0.22, Math.max(3.2, d)), mat, x, 0, z);
  if (def.id === 'mossroot') {
    for (let i = 0; i < 4; i++) {
      add(group, new THREE.SphereGeometry(0.25, 6, 5), '#2f9e44', x + (i - 1.5) * 0.8, 0.35, z + ((i % 2) ? 0.6 : -0.6));
    }
  }
  if (def.id === 'rustpick') {
    add(group, box(Math.max(2, w * 0.7), 0.08, 0.1), '#adb5bd', x, 0.12, z + 0.5);
    add(group, box(Math.max(2, w * 0.7), 0.08, 0.1), '#adb5bd', x, 0.12, z - 0.5);
  }
  if (def.id === 'crypt') {
    add(group, box(0.4, 2.2, 0.4), '#495057', x - w * 0.2, 1.1, z);
    add(group, box(0.4, 2.2, 0.4), '#495057', x + w * 0.2, 1.1, z);
  }
  if (def.id === 'ember') {
    add(group, box(Math.max(2, w * 0.5), 0.08, 0.5), '#e03131', x, 0.1, z);
  }
  if (def.id === 'drowned') {
    const wtr = add(group, box(Math.max(2.5, w * 0.7), 0.05, Math.max(2.5, d * 0.7)), '#1c7ed6', x, 0.08, z, false);
    wtr.material = new THREE.MeshLambertMaterial({ color: '#1c7ed6', transparent: true, opacity: 0.3 });
  }
  if (def.id === 'bastion') {
    add(group, box(0.5, 2.4, 0.5), '#868e96', x - w * 0.25, 1.2, z);
    add(group, box(0.5, 2.4, 0.5), '#868e96', x + w * 0.25, 1.2, z);
  }
  if (def.id === 'storm') {
    const spark = add(group, new THREE.SphereGeometry(0.2, 6, 5), '#ffd43b', x, 1.8, z, false);
    spark.material = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#fab005', emissiveIntensity: 0.8 });
    add(group, box(0.08, 1.6, 0.08), '#adb5bd', x, 0.9, z);
  }
  if (def.id === 'eclipse') {
    add(group, new THREE.TorusGeometry(0.45, 0.06, 6, 12), '#ffd43b', x, 1.6, z).rotation.x = Math.PI / 2;
  }
  if (def.id === 'astral') {
    add(group, box(Math.max(2, w * 0.5), 0.08, 0.45), '#fa5252', x, 0.1, z);
  }
  if (def.id === 'crown') {
    const g = add(group, new THREE.OctahedronGeometry(0.28), '#ffd43b', x, 1.7, z, false);
    g.material = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#fab005', emissiveIntensity: 0.7 });
  }
}

export { woodTex, matMap };
