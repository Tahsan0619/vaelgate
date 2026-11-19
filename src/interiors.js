import * as THREE from 'three';
import { buildPerson, upgradePerson } from './people.js';
import { tileTex, woodTex, plasterTex, matMap, stoneTex } from './textures.js';
import {
  add, box, makeBarrel, makeCrate, makeBench, makeShelfGoods, makeWindow, makeBrazier,
} from './props.js';

function roomShell(group, W, D, wallHex, floorKind = 'tile') {
  const floorMat = floorKind === 'wood'
    ? matMap(woodTex(), '#c4a882', 8, 6)
    : floorKind === 'stone'
      ? matMap(stoneTex(), '#ffffff', 6, 5)
      : matMap(tileTex(), '#ffffff', 8, 6);
  const wallMat = new THREE.MeshLambertMaterial({ map: plasterTex(wallHex), color: '#ffffff' });
  add(group, box(W, 0.22, D), floorMat, 0, 0, 0);
  add(group, box(W, 4.6, 0.4), wallMat, 0, 2.3, -D / 2);
  add(group, box(W, 4.6, 0.4), wallMat, 0, 2.3, D / 2);
  add(group, box(0.4, 4.6, D), wallMat, -W / 2, 2.3, 0);
  add(group, box(0.4, 4.6, D), wallMat, W / 2, 2.3, 0);
  add(group, box(W, 0.28, D), '#f1f3f5', 0, 4.7, 0);
  // baseboards
  add(group, box(W, 0.2, 0.12), '#adb5bd', 0, 0.2, -D / 2 + 0.2);
  add(group, box(W, 0.2, 0.12), '#adb5bd', 0, 0.2, D / 2 - 0.2);
  // ceiling beams
  for (let i = -2; i <= 2; i++) {
    add(group, box(W - 0.8, 0.18, 0.22), '#8b5a2b', 0, 4.45, i * 2.2);
  }
  // exit mat
  add(group, box(2.4, 0.06, 1.3), '#2f9e44', 0, 0.14, D / 2 - 1.15);
  // wall windows (fake light)
  makeWindow(group, -W * 0.25, 2.4, -D / 2 + 0.05, true);
  makeWindow(group, W * 0.25, 2.4, -D / 2 + 0.05, true);
  makeWindow(group, -W * 0.25, 2.4, D / 2 - 0.05, false);
  makeWindow(group, W * 0.25, 2.4, D / 2 - 0.05, false);
}

function counter(group, x, z, color, colliders) {
  add(group, box(3.2, 1.1, 1.35), color, x, 0.55, z);
  add(group, box(3.2, 0.1, 1.4), '#fff4e6', x, 1.15, z);
  add(group, box(0.4, 0.35, 0.4), '#c9922a', x + 1.1, 1.35, z);
  colliders.push({ x0: x - 1.7, x1: x + 1.7, z0: z - 0.8, z1: z + 0.8 });
}

function wallShelf(group, x, z, theme, colliders) {
  add(group, box(2.4, 2.6, 0.55), '#fff4e6', x, 1.3, z);
  add(group, box(2.3, 0.08, 0.5), '#8b5a2b', x, 0.7, z + 0.05);
  add(group, box(2.3, 0.08, 0.5), '#8b5a2b', x, 1.3, z + 0.05);
  add(group, box(2.3, 0.08, 0.5), '#8b5a2b', x, 1.9, z + 0.05);
  makeShelfGoods(group, x, 0.95, z + 0.15, theme);
  makeShelfGoods(group, x, 1.55, z + 0.15, theme);
  makeShelfGoods(group, x, 2.15, z + 0.15, theme);
  colliders.push({ x0: x - 1.3, x1: x + 1.3, z0: z - 0.45, z1: z + 0.45 });
}

function hangingLamp(group, x, z) {
  add(group, box(0.06, 0.7, 0.06), '#868e96', x, 4.0, z, false);
  const bulb = add(group, new THREE.SphereGeometry(0.2, 8, 6), '#fff3bf', x, 3.55, z, false);
  bulb.material = new THREE.MeshLambertMaterial({ color: '#fff3bf', emissive: '#fab005', emissiveIntensity: 0.5 });
}

/**
 * Build a shop / service interior. Stations use ids the main loop understands.
 */
export function buildShopInterior(scene, kind) {
  const group = new THREE.Group();
  scene.add(group);
  group.visible = false;

  const conf = {
    market: {
      wall: '#ffe8cc', floor: 'tile', accent: '#e67700', shopId: 'market',
      keeper: { shirt: '#e67700', pants: '#495057', hair: '#3d2314' }, label: 'Merchant',
    },
    hearth: {
      wall: '#fff3bf', floor: 'wood', accent: '#d9480f', shopId: 'hearth',
      keeper: { shirt: '#d9480f', pants: '#343a40', hair: '#1a1a1a' }, label: 'Cook',
    },
    smith: {
      wall: '#adb5bd', floor: 'stone', accent: '#495057', shopId: 'smith',
      keeper: { shirt: '#495057', pants: '#212529', hair: '#d4d4d4', vest: '#868e96' }, label: 'Blacksmith',
    },
    healer: {
      wall: '#e7f5ff', floor: 'tile', accent: '#1c7ed6', shopId: 'healer',
      keeper: { shirt: '#e7f5ff', pants: '#1c7ed6', hair: '#f8f9fa' }, label: 'Healer',
    },
    stage: {
      wall: '#f3d9fa', floor: 'wood', accent: '#9c36b5', shopId: null,
      keeper: { shirt: '#be4bdb', pants: '#343a40', hair: '#4a148c', hairStyle: 'long' },
      label: 'Tailor', stage: true,
    },
  }[kind];

  const W = 18, D = 14;
  roomShell(group, W, D, conf.wall, conf.floor);
  const colliders = [];
  const solid = (x0, x1, z0, z1) => colliders.push({
    x0: Math.min(x0, x1), x1: Math.max(x0, x1),
    z0: Math.min(z0, z1), z1: Math.max(z0, z1),
  });
  solid(-W / 2, W / 2, -D / 2, -D / 2 + 0.4);
  solid(-W / 2, W / 2, D / 2 - 0.4, D / 2);
  solid(-W / 2, -W / 2 + 0.4, -D / 2, D / 2);
  solid(W / 2 - 0.4, W / 2, -D / 2, D / 2);

  counter(group, 0, -3.6, conf.accent, colliders);

  const people = [];
  let keeper = buildPerson({ body: 'm', seed: 40 + kind.length, skin: '#e8b98a', hairStyle: 'short', ...conf.keeper });
  keeper.group.position.set(0, 0, -4.4);
  keeper.group.rotation.y = Math.PI;
  group.add(keeper.group);
  people.push({ get: () => keeper, set: (p) => { keeper = p; } });

  // Side shelves
  wallShelf(group, -6.5, -5.2, kind, colliders);
  wallShelf(group, 6.5, -5.2, kind, colliders);
  wallShelf(group, -6.5, 1.5, kind, colliders);
  wallShelf(group, 6.5, 1.5, kind, colliders);

  hangingLamp(group, -4, 0);
  hangingLamp(group, 4, 0);
  hangingLamp(group, 0, -2);

  // Theme extras
  if (kind === 'market') {
    for (let i = 0; i < 6; i++) makeCrate(group, -5 + i * 1.6, 4.2, colliders, 0.55 + (i % 2) * 0.15);
    makeBarrel(group, -7.2, 3.5, colliders);
    makeBarrel(group, 7.2, 3.5, colliders);
    add(group, box(2.5, 0.08, 1.8), '#c92a2a', -3, 0.9, 3.5); // rug display
    add(group, box(2.5, 0.08, 1.8), '#1c7ed6', 3, 0.9, 3.5);
    // hanging goods
    for (let i = 0; i < 5; i++) {
      add(group, box(0.35, 0.5, 0.1), ['#e67700', '#2f9e44', '#fab005', '#fa5252', '#be4bdb'][i], -2 + i * 1, 2.8, -D / 2 + 0.3);
    }
  }
  if (kind === 'hearth') {
    // oven
    add(group, box(2.8, 2.2, 1.6), '#868e96', -5.5, 1.1, -2);
    add(group, box(1.4, 1.0, 0.2), '#212529', -5.5, 0.8, -1.1);
    const glow = add(group, box(1.2, 0.8, 0.1), '#ff922b', -5.5, 0.8, -1.05, false);
    glow.material = new THREE.MeshLambertMaterial({ color: '#ff922b', emissive: '#e8590c', emissiveIntensity: 0.7 });
    colliders.push({ x0: -7, x1: -4, z0: -3, z1: -1 });
    // tables
    for (const [tx, tz] of [[3, 2], [5.5, 2], [3, 4.2], [5.5, 4.2]]) {
      add(group, box(1.4, 0.7, 1.4), '#8b5a2b', tx, 0.4, tz);
      add(group, box(1.4, 0.08, 1.4), '#fff4e6', tx, 0.78, tz);
      colliders.push({ x0: tx - 0.8, x1: tx + 0.8, z0: tz - 0.8, z1: tz + 0.8 });
    }
    makeBarrel(group, -7, 3, colliders);
    makeBarrel(group, -6, 3.3, colliders);
    // hanging pans
    for (let i = 0; i < 4; i++) {
      add(group, new THREE.CylinderGeometry(0.25, 0.28, 0.08, 10), '#adb5bd', 2 + i * 0.7, 3.0, -D / 2 + 0.35);
    }
  }
  if (kind === 'smith') {
    makeBrazier(group, -5.5, -1.5, colliders);
    makeBrazier(group, 5.5, -1.5, colliders);
    add(group, box(1.6, 0.7, 0.9), '#495057', -5.5, 0.4, 2); // anvil block
    add(group, box(1.0, 0.35, 0.45), '#868e96', -5.5, 0.9, 2);
    colliders.push({ x0: -6.4, x1: -4.6, z0: 1.4, z1: 2.6 });
    // weapon rack
    add(group, box(0.2, 2.4, 2.8), '#6b3f24', 7.5, 1.2, 0);
    for (let i = 0; i < 5; i++) {
      add(group, box(0.08, 1.3, 0.12), '#ced4da', 7.2, 1.4, -1 + i * 0.5);
    }
    colliders.push({ x0: 6.8, x1: 8.2, z0: -1.6, z1: 1.6 });
    for (let i = 0; i < 8; i++) makeCrate(group, -7 + (i % 4) * 1.1, 4 + Math.floor(i / 4) * 1.1, colliders, 0.55);
  }
  if (kind === 'healer') {
    // beds
    for (const bx of [-5, 5]) {
      add(group, box(2.2, 0.45, 3.2), '#fff', bx, 0.35, 2.5);
      add(group, box(2.2, 0.2, 0.6), '#e7f5ff', bx, 0.65, 1.2);
      add(group, box(0.15, 1.2, 3.2), '#adb5bd', bx - 1.2, 0.9, 2.5);
      colliders.push({ x0: bx - 1.3, x1: bx + 1.3, z0: 0.8, z1: 4.2 });
    }
    // herb pots
    for (let i = 0; i < 6; i++) {
      add(group, new THREE.CylinderGeometry(0.22, 0.25, 0.35, 8), '#8b5a2b', -2.5 + i * 0.9, 1.35, -3.2);
      add(group, new THREE.SphereGeometry(0.2, 6, 5), '#2f9e44', -2.5 + i * 0.9, 1.6, -3.2, false);
    }
    add(group, box(2.0, 0.08, 3.0), '#fa5252', 0, 0.14, 3); // red carpet
  }
  if (kind === 'stage') {
    // runway / platform
    add(group, box(6, 0.45, 4), '#be4bdb', 0, 0.25, 2.5);
    add(group, box(6.2, 0.08, 4.2), '#f3d9fa', 0, 0.5, 2.5);
    colliders.push({ x0: -3.2, x1: 3.2, z0: 0.4, z1: 4.6 });
    // mirrors
    for (const mx of [-7, 7]) {
      add(group, box(0.15, 2.8, 1.8), '#adb5bd', mx, 1.8, -2);
      add(group, box(0.08, 2.5, 1.5), '#e7f5ff', mx > 0 ? mx - 0.08 : mx + 0.08, 1.8, -2);
    }
    // mannequins
    for (const mx of [-4, 4]) {
      let man = buildPerson({
        body: 'f', seed: mx < 0 ? 51 : 52,
        skin: '#e9ecef', shirt: mx < 0 ? '#be4bdb' : '#ffd43b', pants: '#343a40',
        hair: '#1a1a1a', hairStyle: 'bun',
      });
      man.group.position.set(mx, 0, -1.5);
      man.group.scale.setScalar(0.95);
      group.add(man.group);
      people.push({ get: () => man, set: (p) => { man = p; } });
    }
    makeBench(group, -5, 5, 0, colliders);
    makeBench(group, 5, 5, 0, colliders);
  }

  // rug toward exit
  add(group, box(2.5, 0.05, 4), conf.accent, 0, 0.13, 1.5);

  const stations = [
    { id: 'keeper', x: 0, z: -2.0, r: 2.0, label: `Talk to ${conf.label}`, shopId: conf.shopId, stage: conf.stage },
    { id: 'exit', x: 0, z: D / 2 - 1.5, r: 1.9, label: 'Exit to the street' },
  ];

  return {
    group, stations, colliders, kind,
    refreshHumans() {
      for (const slot of people) slot.set(upgradePerson(slot.get()));
    },
    nearest(x, z) {
      let best = null, bd = 2.3;
      for (const s of stations) {
        const d = Math.hypot(s.x - x, s.z - z);
        if (d < Math.min(bd, s.r)) { bd = d; best = s; }
      }
      return best;
    },
  };
}

export function buildAllInteriors(scene) {
  return {
    guild: null,
    market: buildShopInterior(scene, 'market'),
    hearth: buildShopInterior(scene, 'hearth'),
    smith: buildShopInterior(scene, 'smith'),
    healer: buildShopInterior(scene, 'healer'),
    stage: buildShopInterior(scene, 'stage'),
  };
}

export function refreshAllInteriorHumans(shops) {
  if (!shops) return;
  for (const s of Object.values(shops)) s?.refreshHumans?.();
}
