import * as THREE from 'three';
import { PLACES } from './config.js';
import { buildPerson, upgradePerson } from './people.js';
import {
  grassTex, asphaltTex, stoneTex, tileTex, plasterTex,
  signTex, rankPlaqueTex, matMap, woodTex,
} from './textures.js';
import {
  add, box, M, makeTree, makeLamp, makeCrate, makeBarrel, makeBench, makeStall,
  makeCart, makeFence, makeFlowerbed, makeFountain, makeNoticeBoard, makeSignpost,
  makeBannerPole, makeBrazier, makeWell, makeChimney, makeAwning, makeWindow, seeded,
} from './props.js';

function pitchedRoof(g, w, d, wallTop, roofMat, wallMat, opts = {}) {
  const over = opts.overhang ?? 0.55;
  const pitch = opts.pitch ?? 0.52;
  const roofH = opts.roofH ?? (1.05 + Math.min(w, d) * 0.06);
  const slabD = d / 2 + over * 0.35;
  const slabW = w + over * 2;
  const y = wallTop + roofH * 0.42;
  const back = add(g, box(slabW, 0.2, slabD), roofMat, 0, y, -d / 4 - over * 0.1);
  back.rotation.x = pitch;
  const front = add(g, box(slabW, 0.2, slabD), roofMat, 0, y, d / 4 + over * 0.1);
  front.rotation.x = -pitch;
  add(g, box(slabW + 0.05, 0.22, 0.28), roofMat, 0, wallTop + roofH * 0.82, 0); // ridge
  // eave fascia
  add(g, box(slabW + 0.1, 0.14, 0.18), '#5c4030', 0, wallTop + 0.12, d / 2 + over * 0.35);
  add(g, box(slabW + 0.1, 0.14, 0.18), '#5c4030', 0, wallTop + 0.12, -d / 2 - over * 0.35);
  // gable triangles as stepped boxes
  const gableH = roofH * 0.75;
  add(g, box(0.22, gableH, d * 0.92), wallMat, -w / 2 + 0.05, wallTop + gableH * 0.45, 0);
  add(g, box(0.22, gableH, d * 0.92), wallMat, w / 2 - 0.05, wallTop + gableH * 0.45, 0);
  add(g, box(0.22, gableH * 0.55, d * 0.55), wallMat, -w / 2 + 0.05, wallTop + gableH * 0.85, 0);
  add(g, box(0.22, gableH * 0.55, d * 0.55), wallMat, w / 2 - 0.05, wallTop + gableH * 0.85, 0);
  // dormers
  if (opts.dormers) {
    for (const sx of opts.dormers) {
      add(g, box(1.15, 0.95, 0.85), wallMat, sx, wallTop + roofH * 0.35, d * 0.18);
      add(g, box(1.35, 0.16, 1.05), roofMat, sx, wallTop + roofH * 0.75, d * 0.18);
      makeWindow(g, sx, wallTop + roofH * 0.32, d * 0.18 + 0.45, true, { w: 0.55, h: 0.6 });
    }
  }
  return roofH;
}

function facadeBuilding(parent, colliders, x, z, w, d, h, wallHex, roofHex, label, opts = {}) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const style = opts.style || 'house';
  const seed = opts.seed || Math.abs((x * 13 + z * 7) | 0);
  const wallMat = new THREE.MeshLambertMaterial({ map: plasterTex(wallHex), color: '#ffffff' });
  const roofMat = M(roofHex);
  const trim = opts.trim || '#8b7355';
  const accent = opts.accent || roofHex;
  const wood = '#6b4423';

  // Main mass + slight rear wing for larger buildings
  add(g, box(w, h, d), wallMat, 0, h / 2, 0);
  if (style === 'guild' || (style === 'civic' && w > 12)) {
    add(g, box(w * 0.55, h * 0.72, d * 0.45), wallMat, 0, h * 0.36, -d * 0.35);
  }

  // Stone plinth
  add(g, box(w + 0.18, 0.55, d + 0.18), '#8b95a3', 0, 0.28, 0);
  add(g, box(w + 0.28, 0.12, d + 0.28), '#6c757d', 0, 0.08, 0);

  // Floor belt lines
  const floors = Math.max(1, Math.floor((h - 0.8) / 2.55));
  for (let f = 1; f <= floors; f++) {
    const by = Math.min(h - 0.35, f * 2.55);
    add(g, box(w + 0.12, 0.12, d + 0.12), trim, 0, by, 0, false);
  }

  // Corner posts
  const postH = h * 0.92;
  for (const [px, pz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    add(g, box(0.22, postH, 0.22), wood, px * (w / 2 - 0.08), postH / 2, pz * (d / 2 - 0.08));
  }

  // Pitched roof (+ dormers on many houses / shops)
  const dormers = (style === 'house' || style === 'shop') && w >= 4.5 && seed % 2 === 0
    ? (w > 7 ? [-w * 0.22, w * 0.22] : [0])
    : null;
  const roofH = pitchedRoof(g, w, d, h, roofMat, wallMat, {
    overhang: style === 'shop' ? 0.7 : style === 'guild' ? 0.65 : 0.5,
    pitch: style === 'guild' ? 0.42 : 0.55,
    roofH: style === 'guild' ? 2.0 : 1.15 + (seed % 5) * 0.08,
    dormers,
  });

  // Steps + porch
  const doorZ = d / 2;
  add(g, box(2.8, 0.16, 1.15), '#adb5bd', 0, 0.1, doorZ + 0.65);
  add(g, box(2.4, 0.14, 0.85), '#ced4da', 0, 0.22, doorZ + 0.45);
  if (style === 'guild' || style === 'civic') {
    add(g, box(4.2, 0.18, 1.6), '#868e96', 0, 0.12, doorZ + 0.9);
    add(g, box(0.28, 2.4, 0.28), '#adb5bd', -1.7, 1.3, doorZ + 0.55);
    add(g, box(0.28, 2.4, 0.28), '#adb5bd', 1.7, 1.3, doorZ + 0.55);
    add(g, box(3.6, 0.2, 0.35), '#adb5bd', 0, 2.55, doorZ + 0.55);
  }

  // Door assembly
  add(g, box(1.85, 2.55, 0.22), '#2b2118', 0, 1.3, doorZ + 0.02);
  add(g, box(1.45, 2.2, 0.12), wood, 0, 1.28, doorZ + 0.12);
  add(g, box(0.08, 2.0, 0.06), '#c9922a', -0.28, 1.28, doorZ + 0.2, false);
  add(g, box(0.08, 2.0, 0.06), '#c9922a', 0.28, 1.28, doorZ + 0.2, false);
  add(g, box(0.14, 0.14, 0.1), '#ffd43b', 0.48, 1.25, doorZ + 0.22);
  // lintel
  add(g, box(2.1, 0.22, 0.28), trim, 0, 2.55, doorZ + 0.08);

  // Front windows
  const shutterCol = opts.shutters || accent;
  for (let f = 0; f < floors; f++) {
    const wy = 1.7 + f * 2.55;
    if (wy + 0.7 > h - 0.25) continue;
    const lit = (seed + f) % 3 !== 0;
    const cols = w > 10 ? [-w * 0.32, -w * 0.12, w * 0.12, w * 0.32] : [-w * 0.28, w * 0.28];
    for (const sx of cols) {
      if (Math.abs(sx) < 1.1 && f === 0) continue; // keep door clear
      makeWindow(g, sx, wy, doorZ + 0.05, lit, {
        shutters: style === 'house' || style === 'shop',
        shutter: shutterCol,
        w: style === 'guild' ? 1.05 : 0.88,
        h: style === 'guild' ? 1.2 : 1.0,
      });
    }
  }

  // Side windows
  for (let f = 0; f < floors; f++) {
    const wy = 1.85 + f * 2.45;
    if (wy > h - 0.45) continue;
    makeWindow(g, -w / 2 - 0.05, wy, d * 0.15, f % 2 === 0, { w: 0.75, h: 0.9 });
    makeWindow(g, w / 2 + 0.05, wy, -d * 0.1, f % 2 === 1, { w: 0.75, h: 0.9 });
  }

  if (opts.awning) {
    makeAwning(g, 0, 2.75, doorZ + 0.7, Math.min(w - 0.6, style === 'shop' ? 8 : 5.5), style === 'shop' ? 1.45 : 1.15, opts.awning);
  }
  if (opts.chimney) makeChimney(g, w * 0.3, h + roofH * 0.35, -d * 0.2, style === 'forge');

  // Shop storefront bay
  if (style === 'shop') {
    add(g, box(Math.min(w - 1.2, 6.2), 1.7, 0.35), '#fff8ef', 0, 1.55, doorZ + 0.18);
    makeWindow(g, -1.55, 1.55, doorZ + 0.38, true, { w: 1.35, h: 1.25, shutters: false });
    makeWindow(g, 1.55, 1.55, doorZ + 0.38, true, { w: 1.35, h: 1.25, shutters: false });
    add(g, box(Math.min(w - 1.0, 6.4), 0.14, 0.45), trim, 0, 2.45, doorZ + 0.2);
  }

  // Style-specific landmarks
  if (style === 'guild') {
    // Twin towers
    for (const sx of [-w * 0.42, w * 0.42]) {
      add(g, box(2.2, h + 2.8, 2.2), wallMat, sx, (h + 2.8) / 2, -d * 0.15);
      add(g, box(2.6, 0.35, 2.6), roofMat, sx, h + 2.85, -d * 0.15);
      add(g, box(1.4, 1.1, 1.4), roofMat, sx, h + 3.5, -d * 0.15);
      makeWindow(g, sx, h + 1.2, -d * 0.15 + 1.15, true, { w: 0.7, h: 0.85 });
    }
    // Crest disc above door
    add(g, box(1.6, 1.6, 0.15), '#1b263b', 0, 3.5, doorZ + 0.15);
    add(g, box(1.1, 1.1, 0.12), '#ffd43b', 0, 3.5, doorZ + 0.22, false);
  }
  if (style === 'forge') {
    add(g, box(2.4, h * 0.9, 2.4), '#6c757d', w * 0.35, h * 0.45, -d * 0.25);
    makeChimney(g, w * 0.35, h * 0.9, -d * 0.25, true);
    add(g, box(w * 0.7, 0.15, 0.5), '#495057', 0, 3.1, doorZ + 0.35);
  }
  if (style === 'clinic') {
    add(g, box(0.9, 0.9, 0.12), '#fff', 0, 3.35, doorZ + 0.18);
    add(g, box(0.55, 0.16, 0.14), '#fa5252', 0, 3.35, doorZ + 0.25, false);
    add(g, box(0.16, 0.55, 0.14), '#fa5252', 0, 3.35, doorZ + 0.25, false);
  }
  if (style === 'atelier') {
    // Display bay window
    add(g, box(2.8, 2.0, 0.7), wallMat, 0, 2.0, doorZ + 0.35);
    makeWindow(g, -0.7, 2.0, doorZ + 0.72, true, { w: 0.85, h: 1.3 });
    makeWindow(g, 0.7, 2.0, doorZ + 0.72, true, { w: 0.85, h: 1.3 });
  }
  if (style === 'house' && seed % 3 === 0) {
    // Balcony rail on upper floor
    const by = Math.min(h - 0.8, 4.2);
    add(g, box(2.2, 0.1, 0.55), wood, 0, by, doorZ + 0.35);
    add(g, box(2.2, 0.45, 0.08), '#adb5bd', 0, by + 0.3, doorZ + 0.55);
  }

  if (label) {
    const tex = signTex(label, '#1b263b', '#ffd43b');
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(3.6, w * 0.58), 0.85),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
    sign.position.set(0, Math.min(h - 0.4, 3.9), doorZ + 0.2);
    g.add(sign);
    add(g, box(0.1, 0.55, 0.1), '#868e96', -Math.min(1.5, w * 0.22), sign.position.y - 0.15, doorZ + 0.1, false);
    add(g, box(0.1, 0.55, 0.1), '#868e96', Math.min(1.5, w * 0.22), sign.position.y - 0.15, doorZ + 0.1, false);
  }

  parent.add(g);
  if (colliders) {
    colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  }
  return { group: g, doorX: x, doorZ: z + d / 2 + 1.25, w, d };
}

export function createSky(scene) {
  scene.background = new THREE.Color('#9fd3ff');
  scene.fog = new THREE.Fog('#b6d8ef', 55, 190);
  const hemi = new THREE.HemisphereLight('#dbeeff', '#5b6b3a', 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e0', 1.55);
  sun.position.set(48, 70, 28);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  const sc = sun.shadow.camera;
  sc.near = 1; sc.far = 220;
  sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90;
  scene.add(sun, sun.target);
  // soft fill
  const fill = new THREE.DirectionalLight('#a5d8ff', 0.25);
  fill.position.set(-30, 20, -40);
  scene.add(fill);
  return { hemi, sun, fill };
}

export function buildCity(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const rnd = seeded(0xae1);
  const doors = [];
  const spots = [];
  const npcs = [];
  const colliders = [];

  // --- Ground layers ---
  const grass = grassTex();
  const grassMat = matMap(grass, '#ffffff', 80, 50);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 320), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(50, -0.02, 0);
  ground.receiveShadow = true;
  group.add(ground);

  const dirt = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), matMap(woodTex(), '#a08060', 8, 5));
  dirt.rotation.x = -Math.PI / 2;
  dirt.position.set(-28, 0.005, -18);
  dirt.receiveShadow = true;
  group.add(dirt);

  // Plaza stone
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(40, 32), matMap(stoneTex(), '#ffffff', 10, 8));
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.02, 0);
  plaza.receiveShadow = true;
  group.add(plaza);
  // plaza ring
  add(group, box(42, 0.18, 0.4), '#868e96', 0, 0.08, -16);
  add(group, box(42, 0.18, 0.4), '#868e96', 0, 0.08, 16);
  add(group, box(0.4, 0.18, 32), '#868e96', -20, 0.08, 0);
  add(group, box(0.4, 0.18, 32), '#868e96', 20, 0.08, 0);

  // Roads + sidewalks
  function road(w, d, x, z) {
    const asphalt = matMap(asphaltTex(), '#ffffff', Math.max(1, w / 8), Math.max(1, d / 8));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), asphalt);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.03, z);
    m.receiveShadow = true;
    group.add(m);
  }
  function sidewalk(w, d, x, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matMap(tileTex(), '#ffffff', w / 2, d / 2));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.04, z);
    m.receiveShadow = true;
    group.add(m);
  }
  // District roads: plaza ring, market loop, north court, south yard, east gate highway
  road(360, 8, 120, 0);
  sidewalk(360, 2.2, 120, 5.2);
  sidewalk(360, 2.2, 120, -5.2);
  road(100, 6, 250, 10);
  road(80, 6, 290, -8);
  road(8, 100, 0, -5);
  sidewalk(2.2, 100, 5.2, -5);
  sidewalk(2.2, 100, -5.2, -5);
  road(70, 6, -20, 24);
  road(90, 6, 20, 24);
  road(6, 50, -22, 20);
  road(6, 55, 42, -10);
  road(70, 6, 90, -8);
  road(80, 6, 150, 10);
  road(50, 6, -10, 36);
  road(6, 40, -8, 28);
  // Market loop oval hint
  road(40, 5, -22, 0);
  road(5, 28, -40, 8);

  function placeBuilding(id, w, d, h, wall, roof, label, opts, extra) {
    const p = PLACES.find((x) => x.id === id);
    const b = facadeBuilding(group, colliders, p.x, p.z, w, d, h, wall, roof, label, opts);
    doors.push({
      id: p.id, x: b.doorX, z: b.doorZ, place: p, r: 2.2,
      interior: id === 'guild' ? 'guild' : id === 'smithy' ? 'smith' : id,
    });
    extra?.(p, b);
  }

  // --- Landmark buildings ---
  placeBuilding('guild', 16, 12, 9.5, '#eef2f6', '#9b2226', 'GUILD CENTER', {
    style: 'guild', chimney: true, trim: '#c9922a', accent: '#9b2226',
  }, (p) => {
    add(group, box(4.5, 0.1, 3.0), '#dee2e6', p.x, 0.14, p.z + 7.0);
    makeBannerPole(group, p.x - 7.2, p.z + 7.5, '#9b2226', '#ffd43b', '#1b263b', 'G', colliders);
    makeBannerPole(group, p.x + 7.2, p.z + 7.5, '#9b2226', '#ffd43b', '#1b263b', 'G', colliders);
    makeFlowerbed(group, p.x - 8.5, p.z + 5.2, 2.8, 1.3);
    makeFlowerbed(group, p.x + 8.5, p.z + 5.2, 2.8, 1.3);
    makeBench(group, p.x - 4.5, p.z + 9.0, 0, colliders);
    makeBench(group, p.x + 4.5, p.z + 9.0, 0, colliders);
    makeLamp(group, p.x - 5.5, p.z + 8.2, colliders);
    makeLamp(group, p.x + 5.5, p.z + 8.2, colliders);
  });

  placeBuilding('market', 11, 8.5, 5.4, '#ffefd6', '#d9480f', 'MARKET', {
    style: 'shop', awning: '#e8590c', chimney: false, trim: '#a0612b', shutters: '#e67700',
  }, (p) => {
    const cloths = ['#c92a2a', '#1c7ed6', '#2f9e44', '#fab005', '#be4bdb'];
    for (let i = 0; i < 5; i++) {
      makeStall(group, p.x - 7.5 + i * 2.7, p.z + 6.8, cloths[i], colliders);
    }
    makeCart(group, p.x + 7.5, p.z + 4.2, 0.4, colliders);
    makeBarrel(group, p.x - 6.5, p.z + 4.4, colliders);
    makeCrate(group, p.x - 5.5, p.z + 4.1, colliders);
    makeCrate(group, p.x - 4.6, p.z + 4.4, colliders, 0.55);
  });

  placeBuilding('healer', 9.5, 7.5, 5.4, '#e3fafc', '#1971c2', 'HEALER', {
    style: 'clinic', awning: '#74c0fc', chimney: true, trim: '#4dabf7', shutters: '#a5d8ff',
  }, (p) => {
    makeFlowerbed(group, p.x - 5.2, p.z + 4.8, 2.2, 1.1);
    makeFlowerbed(group, p.x + 5.2, p.z + 4.8, 2.2, 1.1);
    makeBench(group, p.x, p.z + 5.8, 0, colliders);
    makeBannerPole(group, p.x - 4.2, p.z + 6.0, '#e7f5ff', '#1c7ed6', '#fa5252', '+', colliders);
  });

  placeBuilding('hearth', 11.5, 8.5, 5.6, '#fff4e0', '#c2255c', 'HEARTH', {
    style: 'shop', awning: '#d9480f', chimney: true, trim: '#e8590c', shutters: '#ffa94d',
  }, (p) => {
    add(group, box(1.5, 3.2, 1.5), '#495057', p.x + 5.4, 1.6, p.z - 2.6);
    colliders.push({ x0: p.x + 4.5, x1: p.x + 6.2, z0: p.z - 3.4, z1: p.z - 1.7 });
    makeBarrel(group, p.x - 6.2, p.z + 5.2, colliders);
    makeBarrel(group, p.x - 5.2, p.z + 5.4, colliders);
    makeStall(group, p.x + 1.2, p.z + 6.5, '#fab005', colliders);
  });

  placeBuilding('smithy', 10.5, 8.5, 5.8, '#dee2e6', '#343a40', 'SMITHY', {
    style: 'forge', awning: '#868e96', chimney: true, trim: '#495057', shutters: '#adb5bd',
  }, (p) => {
    makeBrazier(group, p.x - 5.2, p.z + 5.8, colliders);
    makeBrazier(group, p.x + 5.2, p.z + 5.8, colliders);
    makeCrate(group, p.x + 6.2, p.z + 3.6, colliders, 0.8);
    makeCrate(group, p.x + 7.0, p.z + 3.3, colliders, 0.55);
    add(group, box(1.3, 0.95, 0.65), '#868e96', p.x - 5.7, 0.48, p.z + 4.4);
    colliders.push({ x0: p.x - 6.4, x1: p.x - 5.0, z0: p.z + 3.9, z1: p.z + 4.8 });
  });

  placeBuilding('stage', 9.5, 7.5, 5.2, '#f8f0fc', '#862e9c', 'THE STAGE', {
    style: 'atelier', awning: '#be4bdb', trim: '#9c36b5', shutters: '#e599f7',
  }, (p) => {
    makeBannerPole(group, p.x - 5.2, p.z + 5.2, '#be4bdb', '#fff', '#ffd43b', 'S', colliders);
    makeBannerPole(group, p.x + 5.2, p.z + 5.2, '#be4bdb', '#fff', '#ffd43b', 'S', colliders);
    makeFlowerbed(group, p.x, p.z + 6.0, 3.8, 1.1);
  });

  // Training Ground (outdoor yard, no interior)
  {
    const p = PLACES.find((x) => x.id === 'train');
    add(group, box(22, 0.2, 16), '#adb5bd', p.x, 0.08, p.z);
    add(group, box(20, 0.12, 14), '#ced4da', p.x, 0.16, p.z);
    makeFence(group, p.x - 10, p.z - 7, p.x + 10, p.z - 7, colliders);
    // South fence with gate gap
    makeFence(group, p.x - 10, p.z + 7, p.x - 2.2, p.z + 7, colliders);
    makeFence(group, p.x + 2.2, p.z + 7, p.x + 10, p.z + 7, colliders);
    makeFence(group, p.x - 10, p.z - 7, p.x - 10, p.z + 7, colliders);
    makeFence(group, p.x + 10, p.z - 7, p.x + 10, p.z + 7, colliders);
    makeBannerPole(group, p.x - 8, p.z + 6, '#4c6ef5', '#ffd43b', '#1b263b', 'T', colliders);
    makeBannerPole(group, p.x + 8, p.z + 6, '#4c6ef5', '#ffd43b', '#1b263b', 'T', colliders);
    makeSignpost(group, p.x, p.z + 8.5, 'Training');
    const dummies = [];
    for (const [ox, oz] of [[-4, 0], [0, -2], [4, 1]]) {
      const body = add(group, box(0.9, 1.6, 0.55), '#8b5a2b', p.x + ox, 1.0, p.z + oz);
      add(group, new THREE.SphereGeometry(0.4, 8, 6), '#e8b98a', p.x + ox, 2.05, p.z + oz);
      add(group, box(0.2, 1.1, 0.2), '#6b3f24', p.x + ox, 0.55, p.z + oz);
      colliders.push({ x0: p.x + ox - 0.5, x1: p.x + ox + 0.5, z0: p.z + oz - 0.4, z1: p.z + oz + 0.4 });
      dummies.push({ x: p.x + ox, z: p.z + oz, mesh: body, hp: 100, maxHp: 100 });
    }
    doors.push({ id: 'train', x: p.x, z: p.z + 7.2, place: p, r: 2.8, train: true });
    spots.push({ id: 'train_spot', x: p.x, z: p.z, r: 9, train: true });
    group.userData.trainDummies = dummies;
  }

  // Plaza Gardens landmark
  {
    const p = PLACES.find((x) => x.id === 'park');
    makeFlowerbed(group, p.x - 3, p.z, 4, 2.5);
    makeFlowerbed(group, p.x + 3, p.z, 4, 2.5);
    makeTree(group, p.x - 5, p.z + 2, 1, colliders);
    makeTree(group, p.x + 5, p.z - 1, 1, colliders);
    makeBench(group, p.x, p.z + 3, 0, colliders);
    makeSignpost(group, p.x, p.z - 3, 'Gardens');
  }

  // Plaza centerpiece
  makeFountain(group, 0, -2, colliders);
  makeNoticeBoard(group, -10, 10, 'TOWN BOARD', colliders);
  makeWell(group, 14, 10, colliders);
  makeSignpost(group, 16, 3, 'Gates →');
  makeSignpost(group, -14, 4, '← Market');
  makeSignpost(group, 6, -14, 'Healer ↓');
  makeSignpost(group, 30, 8, 'Smithy →');
  makeSignpost(group, -6, 28, 'Training ↑');
  makeNoticeBoard(group, 22, -8, 'GATE ROAD', colliders);
  makeCart(group, -30, 6, 0.2, colliders);
  makeStall(group, -26, 14, '#fa5252', colliders);
  makeStall(group, -23, 14, '#4c6ef5', colliders);
  makeTree(group, 10, 22, 1, colliders);
  makeTree(group, -16, 30, 1, colliders);
  makeLamp(group, -12, 20, colliders);
  makeLamp(group, 18, 20, colliders);

  // Gate plazas
  const gateColors = {
    f1: '#2f9e44', f2: '#868e96', e1: '#343a40', d1: '#e03131',
    c1: '#1c7ed6', b1: '#adb5bd', a1: '#7048e8',
    s1: '#212529', ss1: '#fab005', sss1: '#ffd43b',
  };
  for (const id of ['f1', 'f2', 'e1', 'd1', 'c1', 'b1', 'a1', 's1', 'ss1', 'sss1']) {
    const p = PLACES.find((x) => x.id === id);
    const col = gateColors[id];
    // platform
    add(group, box(12, 0.35, 10), '#495057', p.x, 0.12, p.z);
    add(group, box(10, 0.2, 8), '#868e96', p.x, 0.28, p.z);
    // stairs down to road
    add(group, box(4, 0.25, 1.2), '#adb5bd', p.x, 0.2, p.z + 5.2);
    add(group, box(4.5, 0.18, 1.0), '#ced4da', p.x, 0.12, p.z + 6.1);
    // arch
    add(group, box(1.1, 5.2, 1.3), col, p.x - 3.0, 2.6, p.z);
    add(group, box(1.1, 5.2, 1.3), col, p.x + 3.0, 2.6, p.z);
    add(group, box(7.2, 1.2, 1.4), col, p.x, 5.5, p.z);
    add(group, box(7.6, 0.35, 1.6), '#212529', p.x, 6.2, p.z);
    // portal
    const portal = add(group, box(4.4, 3.8, 0.25), col, p.x, 2.2, p.z);
    portal.material = new THREE.MeshLambertMaterial({
      color: col, emissive: col, emissiveIntensity: p.locked ? 0.04 : 0.4,
      transparent: true, opacity: p.locked ? 0.22 : 0.55,
    });
    // ornaments
    makeBrazier(group, p.x - 4.5, p.z + 3.2, colliders);
    makeBrazier(group, p.x + 4.5, p.z + 3.2, colliders);
    makeBannerPole(group, p.x - 5.2, p.z - 2.5, col, '#ffd43b', '#1b263b', '', colliders);
    makeBannerPole(group, p.x + 5.2, p.z - 2.5, col, '#ffd43b', '#1b263b', '', colliders);
    makeFence(group, p.x - 5.5, p.z + 4.5, p.x - 2.2, p.z + 4.5, colliders);
    makeFence(group, p.x + 2.2, p.z + 4.5, p.x + 5.5, p.z + 4.5, colliders);
    // pillars collide
    colliders.push({ x0: p.x - 3.6, x1: p.x - 2.3, z0: p.z - 0.9, z1: p.z + 0.9 });
    colliders.push({ x0: p.x + 2.3, x1: p.x + 3.6, z0: p.z - 0.9, z1: p.z + 0.9 });
    if (p.locked) {
      add(group, box(4.6, 4.0, 0.35), '#212529', p.x, 2.2, p.z + 0.35);
      colliders.push({ x0: p.x - 2.3, x1: p.x + 2.3, z0: p.z - 0.4, z1: p.z + 0.7 });
      // chain hint
      add(group, box(4.2, 0.12, 0.12), '#adb5bd', p.x, 3.2, p.z + 0.5);
      add(group, box(4.2, 0.12, 0.12), '#adb5bd', p.x, 1.4, p.z + 0.5);
    }
    const rankMark = p.name.startsWith('SSS') ? 'SSS'
      : p.name.startsWith('SS') ? 'SS'
      : p.name.includes('F-') ? 'F'
      : p.name.split(' ')[0];
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(rankMark.length > 1 ? 1.9 : 1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: rankPlaqueTex(rankMark) }),
    );
    plaque.position.set(p.x - 3.9, 2.6, p.z + 0.75);
    group.add(plaque);
    doors.push({ id: p.id, x: p.x, z: p.z + 3.5, place: p, r: 2.6, interior: null });
  }

  // Decor houses along the east road — varied cottages
  const houseColors = [
    ['#f8e8e0', '#a61e4d', '#c2255c'], ['#e8f4fc', '#1864ab', '#4dabf7'],
    ['#fff6e0', '#e67700', '#ffa94d'], ['#eceff3', '#495057', '#868e96'],
    ['#f5e8ff', '#862e9c', '#cc5de8'], ['#e6f6ea', '#2b8a3e', '#51cf66'],
    ['#fff0f6', '#a61e4d', '#f783ac'], ['#e3fafc', '#0b7285', '#66d9e8'],
  ];
  for (let i = 0; i < 22; i++) {
    const x = 12 + i * 9.5;
    const side = i % 2 === 0 ? -15 : 15;
    const [wall, roof, shut] = houseColors[i % houseColors.length];
    const h = 3.8 + (i % 4) * 0.75;
    const w = 4.6 + (i % 3) * 0.9;
    const d = 4.4 + (i % 2) * 0.6;
    facadeBuilding(group, colliders, x, side, w, d, h, wall, roof, null, {
      style: 'house',
      seed: i * 17 + 3,
      awning: i % 3 === 0 ? roof : null,
      chimney: i % 2 === 0,
      shutters: shut,
      trim: '#7a5c3a',
      accent: roof,
    });
    if (i % 4 === 0) makeFlowerbed(group, x, side + (side > 0 ? -3.2 : 3.2), 2.0, 0.9);
    if (i % 5 === 0) makeLamp(group, x + 2.5, side > 0 ? side - 3.5 : side + 3.5, colliders);
  }

  // North filler houses near market & stage
  for (let i = 0; i < 8; i++) {
    const x = -48 + i * 7;
    const z = 32 + (i % 2) * 3;
    const [wall, roof, shut] = houseColors[(i + 2) % houseColors.length];
    facadeBuilding(group, colliders, x, z, 5.2, 4.4, 4.0 + (i % 2) * 0.6, wall, roof, null, {
      style: 'house', seed: 40 + i, chimney: true, shutters: shut, trim: '#6b4423',
    });
  }

  // Trees dense but keep plaza clear
  for (let i = 0; i < 70; i++) {
    const x = -55 + rnd() * 280;
    const z = -42 + rnd() * 90;
    if (Math.hypot(x, z) < 16) continue;
    if (Math.abs(z) < 6 && x > -10 && x < 330) continue; // keep road clear
    makeTree(group, x, z, 0.75 + rnd() * 0.55, colliders);
  }

  // Street lamps along main roads
  for (let i = 0; i < 36; i++) {
    makeLamp(group, -25 + i * 8, 4.6, colliders);
    if (i % 2 === 0) makeLamp(group, -25 + i * 8, -4.6, colliders);
  }
  for (let i = 0; i < 12; i++) {
    makeLamp(group, 4.6, -5 - i * 6, colliders);
    makeLamp(group, -4.6, -5 - i * 6, colliders);
  }

  // Scattered street clutter
  for (let i = 0; i < 28; i++) {
    const x = -30 + rnd() * 100;
    const z = (rnd() > 0.5 ? 1 : -1) * (6.5 + rnd() * 3);
    if (rnd() > 0.5) makeCrate(group, x, z, colliders, 0.5 + rnd() * 0.35);
    else makeBarrel(group, x, z, colliders);
  }
  for (let i = 0; i < 10; i++) {
    makeBench(group, -18 + i * 12, 7.2, 0, colliders);
  }
  makeCart(group, -8, 12, -0.3, colliders);
  makeCart(group, 48, 6, 1.2, colliders);
  makeFence(group, -22, 14, -8, 14, colliders);
  makeFence(group, 8, 14, 18, 14, colliders);

  // Waystone
  add(group, new THREE.CylinderGeometry(0.75, 0.95, 2.3, 8), '#dee2e6', -7, 1.15, 9);
  const gem = add(group, new THREE.SphereGeometry(0.38, 10, 8), '#74c0fc', -7, 2.55, 9);
  gem.material = new THREE.MeshLambertMaterial({ color: '#74c0fc', emissive: '#1c7ed6', emissiveIntensity: 0.7 });
  makeFlowerbed(group, -7, 11.2, 2.4, 1.0);
  spots.push({ id: 'way_guild', x: -7, z: 9, kind: 'waystone', name: 'Guild Waystone' });

  // NPCs — varied male/female looks (swap to textured GLBs after preload)
  const looks = [
    { body: 'm', seed: 1, skin: '#e8b98a', shirt: '#1b263b', pants: '#343a40', hair: '#1a1a1a', hairStyle: 'short' },
    { body: 'f', seed: 2, skin: '#c68642', shirt: '#e67700', pants: '#495057', hair: '#3d2314', hairStyle: 'bun' },
    { body: 'f', seed: 3, skin: '#f5d0b0', shirt: '#2f9e44', pants: '#2b8a3e', hair: '#6b4423', hairStyle: 'long' },
    { body: 'm', seed: 4, skin: '#d4a574', shirt: '#4c6ef5', pants: '#343a40', hair: '#1a1a1a', hairStyle: 'messy', vest: '#adb5bd' },
    { body: 'm', seed: 5, skin: '#e8b98a', shirt: '#c92a2a', pants: '#212529', hair: '#f8f9fa', hairStyle: 'spiky' },
    { body: 'f', seed: 6, skin: '#c68642', shirt: '#9c36b5', pants: '#343a40', hair: '#1a1a1a', hairStyle: 'fringe' },
    { body: 'm', seed: 7, skin: '#8d5524', shirt: '#868e96', pants: '#212529', hair: '#3d2314', hairStyle: 'short' },
    { body: 'f', seed: 8, skin: '#ffdbac', shirt: '#7950f2', pants: '#364fc7', hair: '#c9a227', hairStyle: 'ponytail' },
    { body: 'm', seed: 9, skin: '#f1c27d', shirt: '#37b24d', pants: '#2b8a3e', hair: '#6b4423', hairStyle: 'messy' },
    { body: 'f', seed: 10, skin: '#e8b98a', shirt: '#fa5252', pants: '#343a40', hair: '#c92a2a', hairStyle: 'long' },
  ];
  const lines = [
    'New gates opened east of the plaza.',
    'Carry bread. Hunger sneaks up on you.',
    'F-rank is humble, but everyone starts there.',
    'Read the boss panel before you enter.',
    'The Rank Examiner never takes bribes.',
    'Smithy heat keeps the eastern road warm.',
    'Market stalls close after dusk.',
    'Healer Court smells of mint and liniment.',
  ];
  for (let i = 0; i < 16; i++) {
    const p = buildPerson(looks[i % looks.length]);
    const x = -28 + i * 7 + (i % 3);
    const z = (i % 2 === 0 ? 7 : -7) + (i % 4) * 0.4;
    p.group.position.set(x, 0, z);
    group.add(p.group);
    npcs.push({
      m: p, x, z, dir: i % 2 ? 1 : -1, t: rnd() * 10,
      sayT: 2 + i, line: lines[i % lines.length], bubble: null,
    });
  }

  return {
    group, doors, spots, npcs, colliders, places: PLACES,
    trainDummies: group.userData.trainDummies || [],
    refreshHumans() {
      for (const n of npcs) n.m = upgradePerson(n.m);
    },
    update(dt, player, animatePerson) {
      for (const n of npcs) {
        n.t += dt;
        n.x += n.dir * dt * 1.15;
        if (n.x > 100 || n.x < -45) n.dir *= -1;
        n.m.group.position.set(n.x, 0, n.z);
        n.m.group.rotation.y = n.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        animatePerson(n.m, 'walk', n.t, dt, 0.5);
        n.sayT -= dt;
        if (n.sayT <= 0 && player && Math.hypot(player.x - n.x, player.z - n.z) < 10) {
          n.sayT = 14 + Math.random() * 10;
          n.bubbleUntil = performance.now() + 3200;
          n.lineNow = n.line;
        }
      }
    },
    nearestDoor(x, z, r = 2.6) {
      let best = null, bd = r;
      for (const d of doors) {
        const dd = Math.hypot(d.x - x, d.z - z);
        if (dd < bd) { bd = dd; best = d; }
      }
      return best;
    },
  };
}

export function buildGuildInterior(scene) {
  const group = new THREE.Group();
  scene.add(group);
  group.visible = false;
  const colliders = [];
  const solid = (x0, x1, z0, z1) => colliders.push({
    x0: Math.min(x0, x1), x1: Math.max(x0, x1),
    z0: Math.min(z0, z1), z1: Math.max(z0, z1),
  });

  const W = 24, D = 18;
  // floor + walls
  add(group, box(W, 0.25, D), matMap(tileTex(), '#ffffff', 12, 9), 0, 0, 0);
  add(group, box(W, 5.2, 0.45), '#e9ecef', 0, 2.6, -D / 2);
  add(group, box(W, 5.2, 0.45), '#e9ecef', 0, 2.6, D / 2);
  add(group, box(0.45, 5.2, D), '#e9ecef', -W / 2, 2.6, 0);
  add(group, box(0.45, 5.2, D), '#e9ecef', W / 2, 2.6, 0);
  add(group, box(W, 0.3, D), '#f8f9fa', 0, 5.3, 0);
  solid(-W / 2, W / 2, -D / 2, -D / 2 + 0.45);
  solid(-W / 2, W / 2, D / 2 - 0.45, D / 2);
  solid(-W / 2, -W / 2 + 0.45, -D / 2, D / 2);
  solid(W / 2 - 0.45, W / 2, -D / 2, D / 2);

  // carpet runner + side rugs
  add(group, box(4.2, 0.06, 16), '#c92a2a', 0, 0.14, 0);
  add(group, box(3.6, 0.05, 3.6), '#862e9c', -7, 0.13, -2);
  add(group, box(3.6, 0.05, 3.6), '#e67700', 7, 0.13, -2);

  // columns
  for (const x of [-5, 5]) {
    for (const z of [-5, 0, 5]) {
      add(group, new THREE.CylinderGeometry(0.35, 0.4, 5, 10), '#ced4da', x, 2.5, z);
      add(group, box(0.9, 0.2, 0.9), '#adb5bd', x, 5.05, z);
      solid(x - 0.45, x + 0.45, z - 0.45, z + 0.45);
    }
  }

  // wall lamps
  for (const [x, z] of [[-11, -4], [-11, 4], [11, -4], [11, 4], [-6, -8.5], [6, -8.5]]) {
    const bulb = add(group, new THREE.SphereGeometry(0.18, 8, 6), '#fff3bf', x, 3.2, z, false);
    bulb.material = new THREE.MeshLambertMaterial({ color: '#fff3bf', emissive: '#fab005', emissiveIntensity: 0.55 });
  }

  // hanging banners
  for (const x of [-8, -4, 0, 4, 8]) {
    const tex = rankPlaqueTex(['F', 'E', 'D', 'C', 'B'][(x + 8) / 4] || 'A');
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ map: tex }));
    b.position.set(x, 3.6, -D / 2 + 0.3);
    group.add(b);
  }

  const stations = [];
  function desk(x, z, color, id, label) {
    add(group, box(2.6, 1.15, 1.3), color, x, 0.58, z);
    add(group, box(2.6, 0.1, 1.3), '#fff4e6', x, 1.2, z);
    add(group, box(0.35, 0.25, 0.35), '#c9922a', x + 0.8, 1.35, z);
    add(group, box(0.5, 0.4, 0.35), '#212529', x - 0.7, 1.4, z); // ledger
    solid(x - 1.4, x + 1.4, z - 0.75, z + 0.75);
    stations.push({ id, x, z: z + 1.55, label, r: 1.85 });
    // chair behind
    add(group, box(0.55, 0.5, 0.55), '#6b3f24', x, 0.35, z - 1.1);
  }
  desk(0, -6.2, '#5c7c46', 'register', 'Registration Desk');
  desk(-7.5, -2.2, '#4c6ef5', 'quests', 'Quest Board');
  desk(7.5, -2.2, '#e67700', 'party', 'Party Finder');
  desk(-7.5, 3.2, '#be4bdb', 'examiner', 'Rank Examiner');
  desk(7.5, 3.2, '#868e96', 'vault', 'Personal Vault');
  desk(0, 5.5, '#1c7ed6', 'info', 'Information Desk');

  // waiting benches
  makeBench(group, -3, 1, Math.PI / 2, colliders);
  makeBench(group, 3, 1, -Math.PI / 2, colliders);
  makeCrate(group, -10, 0, colliders, 0.6);
  makeBarrel(group, 10, 6, colliders);

  // trophy wall frames
  for (let i = 0; i < 6; i++) {
    add(group, box(1.4, 1.4, 0.12), '#c9922a', -9 + i * 3.5, 3.4, -D / 2 + 0.28);
    add(group, box(1.1, 1.1, 0.08), '#ffd43b', -9 + i * 3.5, 3.4, -D / 2 + 0.36);
  }

  // side shelves
  for (const x of [-10.5, 10.5]) {
    add(group, box(1.2, 2.8, 3.5), '#fff4e6', x, 1.4, -5);
    solid(x - 0.7, x + 0.7, -6.8, -3.2);
  }

  let clerk = buildPerson({ body: 'm', seed: 21, skin: '#e8b98a', shirt: '#1b263b', pants: '#343a40', hair: '#d4d4d4', hairStyle: 'short', vest: '#adb5bd' });
  clerk.group.position.set(0, 0, -6.6);
  clerk.group.rotation.y = Math.PI;
  group.add(clerk.group);

  let examiner = buildPerson({ body: 'f', seed: 22, skin: '#c68642', shirt: '#862e9c', pants: '#212529', hair: '#1a1a1a', hairStyle: 'long' });
  examiner.group.position.set(-7.5, 0, 2.5);
  examiner.group.rotation.y = Math.PI;
  group.add(examiner.group);

  let greeter = buildPerson({ body: 'f', seed: 23, skin: '#f5d0b0', shirt: '#c92a2a', pants: '#343a40', hair: '#3d2314', hairStyle: 'bun' });
  greeter.group.position.set(4, 0, 7);
  greeter.group.rotation.y = Math.PI;
  group.add(greeter.group);

  stations.push({ id: 'exit', x: 0, z: D / 2 - 1.5, label: 'Exit to plaza', r: 2 });
  add(group, box(2.4, 2.6, 0.25), '#3d2914', 0, 1.3, D / 2 - 0.2);
  add(group, box(2.2, 0.08, 1.4), '#2f9e44', 0, 0.14, D / 2 - 1.3);

  return {
    group, stations, get clerk() { return clerk; }, get examiner() { return examiner; }, colliders,
    refreshHumans() {
      clerk = upgradePerson(clerk);
      examiner = upgradePerson(examiner);
      greeter = upgradePerson(greeter);
    },
    nearest(x, z) {
      let best = null, bd = 2.2;
      for (const s of stations) {
        const d = Math.hypot(s.x - x, s.z - z);
        if (d < Math.min(bd, s.r || 2.2)) { bd = d; best = s; }
      }
      return best;
    },
  };
}
