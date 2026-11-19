import * as THREE from 'three';
import { DUNGEONS, ENEMIES, BOSSES, DIFFICULTY, ri, pick, rand } from './config.js';
import { buildEnemyMesh } from './people.js';
import { buildBossMesh } from './bossMesh.js';
import { createPropModel } from './modelLoader.js';
import { floorMatFor, wallMatFor, decorateRoom, decorateCorridor } from './dungeonDecor.js';
import { attachHpBar } from './hpBar.js';

const mats = new Map();
const M = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c })); return mats.get(c); };

function mesh(parent, g, c, x, y, z) {
  const m = new THREE.Mesh(g, typeof c === 'string' ? M(c) : c);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

function roomLayout(floor, seed) {
  const rooms = [
    { id: 'start', x: -18, z: 0, w: 13, d: 13 },
    { id: 'a', x: -4, z: -11, w: 11, d: 11 },
    { id: 'b', x: -4, z: 11, w: 11, d: 11 },
    { id: 'mid', x: 11, z: 0, w: 13, d: 15 },
    { id: 'guard', x: 26, z: floor % 2 ? -9 : 9, w: 12, d: 12 },
    { id: 'stair', x: 40, z: 0, w: 12, d: 12 },
  ];
  if (floor === 3) rooms.push({ id: 'safe', x: 11, z: -18, w: 11, d: 9, safe: true });
  if (floor === 5) {
    return [
      { id: 'start', x: 0, z: 0, w: 11, d: 11 },
      { id: 'boss', x: 20, z: 0, w: 20, d: 18, boss: true },
    ];
  }
  if (seed % 2 === 0) {
    const t = rooms[1]; rooms[1] = rooms[2]; rooms[2] = t;
  }
  return rooms;
}

function openSides(rooms, i) {
  const open = { n: false, s: false, e: false, w: false };
  const r = rooms[i];
  const link = (a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z;
    if (Math.abs(dx) > Math.abs(dz)) {
      if (dx > 0) open.e = true;
      else open.w = true;
    } else if (dz > 0) open.s = true;
    else open.n = true;
  };
  if (i > 0) link(r, rooms[i - 1]);
  if (i < rooms.length - 1) link(r, rooms[i + 1]);
  return open;
}

function wallSegment(parent, wMat, wh, x0, z0, x1, z1, colliders, thick = 0.55) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  let sx = Math.max(thick, Math.abs(x1 - x0));
  let sz = Math.max(thick, Math.abs(z1 - z0));
  // Ensure thin wall axis has real thickness so walls read as architecture
  if (Math.abs(x1 - x0) < 0.01) sx = thick;
  if (Math.abs(z1 - z0) < 0.01) sz = thick;
  mesh(parent, new THREE.BoxGeometry(sx, wh, sz), wMat, cx, wh / 2, cz);
  colliders.push({
    x0: cx - sx / 2 - 0.05, x1: cx + sx / 2 + 0.05,
    z0: cz - sz / 2 - 0.05, z1: cz + sz / 2 + 0.05,
  });
}

function buildRoomWalls(parent, r, open, wMat, wh, colliders) {
  const gap = 2.6;
  const halfW = r.w / 2, halfD = r.d / 2;
  const sides = [
    ['n', r.x - halfW, r.z - halfD, r.x + halfW, r.z - halfD, true],
    ['s', r.x - halfW, r.z + halfD, r.x + halfW, r.z + halfD, true],
    ['w', r.x - halfW, r.z - halfD, r.x - halfW, r.z + halfD, false],
    ['e', r.x + halfW, r.z - halfD, r.x + halfW, r.z + halfD, false],
  ];
  for (const [key, x0, z0, x1, z1, horiz] of sides) {
    if (open[key]) {
      if (horiz) {
        wallSegment(parent, wMat, wh, x0, z0, (x0 + x1) / 2 - gap / 2, z1, colliders);
        wallSegment(parent, wMat, wh, (x0 + x1) / 2 + gap / 2, z0, x1, z1, colliders);
      } else {
        wallSegment(parent, wMat, wh, x0, z0, x1, (z0 + z1) / 2 - gap / 2, colliders);
        wallSegment(parent, wMat, wh, x0, (z0 + z1) / 2 + gap / 2, x1, z1, colliders);
      }
    } else {
      wallSegment(parent, wMat, wh, x0, z0, x1, z1, colliders);
    }
  }
}

function wavePlan(def, floor) {
  const pool = def.enemies || ['slime'];
  const byRole = (role) => pool.filter((id) => (ENEMIES[id]?.role || 'melee') === role);
  const melee = byRole('melee');
  const skirm = byRole('skirmish');
  const ranged = byRole('ranged');
  const support = byRole('support');
  const mix = (lists) => {
    const out = [];
    for (const list of lists) if (list?.length) out.push(...list);
    return out.length ? out : pool;
  };
  const base = 3 + floor;
  // Wave 1: frontline + skirmish. Wave 2: add ranged. Wave 3: full kit + support.
  return [
    { count: base, ids: mix([melee, skirm]).slice(0, 3) || pool.slice(0, 2) },
    { count: base + 1, ids: mix([melee, skirm, ranged]) },
    { count: base + 2, ids: mix([melee, skirm, ranged, support]) },
  ];
}

export function createDungeonRun(scene, dungeonId, difficulty = 'normal') {
  const def = DUNGEONS[dungeonId];
  const diff = DIFFICULTY[difficulty] || DIFFICULTY.normal;
  const group = new THREE.Group();
  scene.add(group);
  const isWaves = def.flow === 'waves';

  const run = {
    id: dungeonId, def, diff, difficulty, group, mode: isWaves ? 'waves' : 'classic',
    floor: 1, rooms: [], roomNodes: [], enemies: [], pillars: [],
    seals: { killed: 0, total: 0, pillars: 0, needPillars: 0, guardianDown: false, open: false },
    stair: null, portal: null, chest: null, boss: null, safe: null,
    hazardT: 0, hazards: [], supports: [], objectives: {},
    colliders: [], activeRoom: null, corridorNodes: [],
    wave: 0, wavePhase: 'idle', spawnPads: [], waveLoot: null, bossGate: null,
    pendingWave: null, wavePause: 0,
    started: performance.now(),
    mixers: [],
    clear() {
      while (group.children.length) group.remove(group.children[0]);
      run.enemies = []; run.pillars = []; run.supports = []; run.hazards = [];
      run.roomNodes = []; run.corridorNodes = []; run.colliders = [];
      run.stair = null; run.portal = null; run.chest = null; run.boss = null; run.safe = null;
      run.activeRoom = null; run.spawnPads = []; run.waveLoot = null; run.bossGate = null;
      run.pendingWave = null; run.wavePause = 0; run.mixers = [];
    },
  };

  function buildFloor(n) {
    run.clear();
    run.floor = n;
    if (isWaves) return buildWaveFloor(n);
    return buildClassicFloor(n);
  }

  function buildWaveFloor(n) {
    run.seals = { killed: 0, total: 0, pillars: 0, needPillars: 0, guardianDown: false, open: false };
    run.wave = 0;
    run.wavePhase = 'fight';
    const fMat = floorMatFor(def);
    const wMat = wallMatFor(def);
    // Tall enough that the follow-cam never sits above the ceiling
    const wh = 9.5;
    const pit = { id: 'pit', x: 0, z: 0, w: 28, d: 22 };
    const bossR = { id: 'boss', x: 22, z: 0, w: 18, d: 16, boss: true };
    run.rooms = [pit, bossR];

    const pitG = new THREE.Group();
    pitG.name = 'room_pit';
    group.add(pitG);
    mesh(pitG, new THREE.BoxGeometry(pit.w, 0.28, pit.d), fMat, pit.x, 0, pit.z);
    // bright center ring + lane marks
    mesh(pitG, new THREE.RingGeometry(3.2, 3.8, 32),
      new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
      pit.x, 0.06, pit.z).rotation.x = -Math.PI / 2;
    mesh(pitG, new THREE.CircleGeometry(2.6, 28),
      new THREE.MeshBasicMaterial({ color: '#fff4bf', transparent: true, opacity: 0.18, side: THREE.DoubleSide }),
      pit.x, 0.05, pit.z).rotation.x = -Math.PI / 2;
    buildRoomWalls(pitG, pit, { e: true, w: false, n: false, s: false }, wMat, wh, run.colliders);
    // contrasting wall baseboards so walls read against the floor
    const trim = def.id === 'rustpick' ? '#fab005' : '#ffd43b';
    for (const [x0, z0, x1, z1] of [
      [pit.x - pit.w / 2, pit.z - pit.d / 2, pit.x + pit.w / 2, pit.z - pit.d / 2],
      [pit.x - pit.w / 2, pit.z + pit.d / 2, pit.x + pit.w / 2, pit.z + pit.d / 2],
      [pit.x - pit.w / 2, pit.z - pit.d / 2, pit.x - pit.w / 2, pit.z + pit.d / 2],
      [pit.x + pit.w / 2, pit.z - pit.d / 2, pit.x + pit.w / 2, pit.z + pit.d / 2],
    ]) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const sx = Math.max(0.35, Math.abs(x1 - x0) || 0.4);
      const sz = Math.max(0.35, Math.abs(z1 - z0) || 0.4);
      mesh(pitG, new THREE.BoxGeometry(sx, 0.35, sz), trim, cx, 0.2, cz);
    }
    mesh(pitG, new THREE.BoxGeometry(pit.w + 0.2, 0.35, pit.d + 0.2), wMat, pit.x, wh + 0.1, pit.z);
    // arena lights — readable combat lighting
    const keyLight = new THREE.PointLight('#fff4e0', 1.6, 36, 1.4);
    keyLight.position.set(0, 5.5, 0);
    pitG.add(keyLight);
    const fillL = new THREE.PointLight('#a5d8ff', 0.7, 30, 1.6);
    fillL.position.set(-8, 4, 6);
    pitG.add(fillL);
    // Skip dense procedural mushrooms (they read as candy balls). Use GLB props instead.
    run.roomNodes.push({
      id: 'pit', room: pit, group: pitG, index: 0,
      x0: pit.x - pit.w / 2, x1: pit.x + pit.w / 2,
      z0: pit.z - pit.d / 2, z1: pit.z + pit.d / 2,
    });

    // Spawn pads (very obvious)
    const pads = [[-9, -7], [9, -7], [-9, 7], [9, 7], [0, -8], [0, 8]];
    run.spawnPads = pads.map(([x, z], i) => {
      const pad = mesh(pitG, new THREE.CylinderGeometry(1.25, 1.25, 0.18, 16),
        new THREE.MeshLambertMaterial({
          color: '#4dabf7', emissive: '#228be6', emissiveIntensity: 1.15, transparent: true, opacity: 0.95,
        }),
        x, 0.1, z);
      mesh(pitG, new THREE.RingGeometry(1.3, 1.7, 24),
        new THREE.MeshBasicMaterial({ color: '#ffd43b', transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
        x, 0.14, z).rotation.x = -Math.PI / 2;
      const beam = mesh(pitG, new THREE.CylinderGeometry(0.15, 0.45, 2.4, 8),
        new THREE.MeshBasicMaterial({ color: '#74c0fc', transparent: true, opacity: 0.35 }),
        x, 1.3, z);
      beam.castShadow = false;
      const pl = new THREE.PointLight('#74c0fc', 0.85, 10, 2);
      pl.position.set(x, 2.2, z);
      pitG.add(pl);
      return { x, z, mesh: pad, i };
    });

    // Boss room
    const bossG = new THREE.Group();
    bossG.name = 'room_boss';
    group.add(bossG);
    mesh(bossG, new THREE.BoxGeometry(bossR.w, 0.28, bossR.d), fMat, bossR.x, 0, bossR.z);
    mesh(bossG, new THREE.CircleGeometry(4.5, 28),
      new THREE.MeshBasicMaterial({ color: '#ff6b6b', transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
      bossR.x, 0.05, bossR.z).rotation.x = -Math.PI / 2;
    buildRoomWalls(bossG, bossR, { w: true, e: false, n: false, s: false }, wMat, wh, run.colliders);
    mesh(bossG, new THREE.BoxGeometry(bossR.w + 0.2, 0.35, bossR.d + 0.2), wMat, bossR.x, wh + 0.1, bossR.z);
    const bossLight = new THREE.PointLight('#ffd8a8', 1.8, 28, 1.3);
    bossLight.position.set(bossR.x, 5.2, bossR.z);
    bossG.add(bossLight);
    // lit rim
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      mesh(bossG, new THREE.CylinderGeometry(0.25, 0.3, 1.5, 6),
        new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#fab005', emissiveIntensity: 0.9 }),
        bossR.x + Math.cos(ang) * 6.5, 0.75, bossR.z + Math.sin(ang) * 5.2);
    }
    dressWaveArena(pitG, bossG, def);
    run.roomNodes.push({
      id: 'boss', room: bossR, group: bossG, index: 1,
      x0: bossR.x - bossR.w / 2, x1: bossR.x + bossR.w / 2,
      z0: bossR.z - bossR.d / 2, z1: bossR.z + bossR.d / 2,
    });
    run.bossRoom = bossR;

    // Corridor + sealed boss gate
    const cg = new THREE.Group();
    group.add(cg);
    decorateCorridor(cg, def, 12, 0, 6, 3.4);
    wallSegment(cg, wMat, wh, 9, -1.7, 15, -1.7, run.colliders);
    wallSegment(cg, wMat, wh, 9, 1.7, 15, 1.7, run.colliders);
    mesh(cg, new THREE.BoxGeometry(6, 0.3, 3.4), wMat, 12, wh + 0.05, 0);
    run.corridorNodes.push({
      group: cg, a: 'pit', b: 'boss',
      x0: 9, x1: 15, z0: -1.7, z1: 1.7,
    });

    const gate = mesh(cg, new THREE.BoxGeometry(0.5, 3.4, 3.2),
      new THREE.MeshLambertMaterial({ color: '#74c0fc', transparent: true, opacity: 0.8, emissive: '#1c7ed6', emissiveIntensity: 0.65 }),
      14.2, 1.7, 0);
    const gateCol = { x0: 13.7, x1: 14.7, z0: -1.6, z1: 1.6, sealLock: true };
    run.colliders.push(gateCol);
    run.bossGate = { mesh: gate, lockCol: gateCol, open: false, x: 14.2, z: 0 };

    // Stairs appear after floor boss (floors 1-4) beside pit west
    if (n < 5) {
      const barrier = mesh(pitG, new THREE.BoxGeometry(3.2, 3.2, 0.45),
        new THREE.MeshLambertMaterial({ color: '#74c0fc', transparent: true, opacity: 0.72, emissive: '#1c7ed6', emissiveIntensity: 0.55 }),
        -11.5, 1.6, 0);
      const steps = mesh(pitG, new THREE.BoxGeometry(2.4, 1.2, 2.4), '#adb5bd', -11.5, 0.6, 0);
      steps.visible = false;
      const lockCol = { x0: -13, x1: -10, z0: -1.2, z1: 1.2, sealLock: true };
      run.colliders.push(lockCol);
      run.stair = { x: -11.5, z: 0, mesh: barrier, steps, open: false, lockCol };
    }

    if (def.id === 'rustpick') {
      for (const [ox, oz] of [[-5, -4], [5, -4], [-5, 4], [5, 4], [0, 0]]) {
        const s = mesh(bossG, new THREE.BoxGeometry(1.5, 3.1, 1.5),
          new THREE.MeshLambertMaterial({ color: '#fab005', transparent: true, opacity: 0.55, emissive: '#e67700', emissiveIntensity: 0.4 }),
          bossR.x + ox, 1.55, bossR.z + oz);
        s.visible = false;
        run.supports.push({ x: bossR.x + ox, z: bossR.z + oz, mesh: s });
      }
    }

    // Keep both rooms visible in wave mode
    for (const node of run.roomNodes) node.group.visible = true;
    for (const c of run.corridorNodes) c.group.visible = true;

    run.activeRoom = 'pit';
    beginWave(1);
    return { spawnX: -6, spawnZ: 0 };
  }

  function placeProp(parent, key, x, z, yaw = 0, scale) {
    const inst = createPropModel(key, scale);
    if (!inst?.group) return null;
    inst.group.position.set(x, 0, z);
    inst.group.rotation.y = yaw;
    parent.add(inst.group);
    return inst.group;
  }

  function dressWaveArena(pitG, bossG, dungeonDef) {
    const moss = dungeonDef.id === 'mossroot';
    // Stone frame
    placeProp(pitG, 'column', -11, -8, 0.2);
    placeProp(pitG, 'column', -11, 8, -0.2);
    placeProp(pitG, 'column', 11, -8, 0.1);
    placeProp(pitG, 'column_broken', 11, 8, -0.35);
    placeProp(pitG, 'barrel', -7, 5, 0.4);
    placeProp(pitG, 'barrel', -5.8, 5.6, -0.3);
    placeProp(pitG, 'crate', -8.2, -5.5, 0.6);
    placeProp(pitG, 'crate', -6.9, -6.1, -0.4);
    placeProp(pitG, 'torch', 6, -9, 0);
    placeProp(pitG, 'torch', 6, 9, Math.PI);
    placeProp(pitG, 'candelabrum', -2, -9, 0.5);
    placeProp(pitG, 'woodfire', -4, 8.5, 0.2);
    placeProp(pitG, 'vase', 3, -8.5, 0.8);
    placeProp(pitG, 'pedestal', -1, 8.2, 0.1);
    placeProp(pitG, 'bag_standing', 4.5, 8, -0.5);
    if (moss) {
      placeProp(pitG, 'bush', -10, -2, 0.7);
      placeProp(pitG, 'bush_berries', -10, 2, -0.4);
      placeProp(pitG, 'rock_moss', 8, 6, 0.2);
      placeProp(pitG, 'rock_moss2', 9.5, -5.5, -0.5);
      placeProp(pitG, 'stump_moss', -9, -6.5, 0.9);
      placeProp(pitG, 'tree_dead', -12, 0, 0.15);
      placeProp(pitG, 'plant1', -5, -8, 0.3);
      placeProp(pitG, 'plant3', 8.5, 2, -0.7);
      placeProp(pitG, 'grass', -3, 4, 0.2);
      placeProp(pitG, 'grass', 2, -3, 1.1);
      placeProp(pitG, 'cobweb', 10.5, -7.5, 0.4);
      placeProp(pitG, 'spikes', 0, -7.5, 0);
    } else {
      placeProp(pitG, 'bones', -10, -2, 0.7);
      placeProp(pitG, 'bones2', -10, 2, -0.4);
      placeProp(pitG, 'skull', -8.5, 7, 0.5);
      placeProp(pitG, 'rock', 8, 6, 0.2);
      placeProp(pitG, 'rock2', 9, -5, -0.3);
      placeProp(pitG, 'rock3', -11.5, 0, 0.2);
      placeProp(pitG, 'spikes', 0, -7.5, 0);
      placeProp(pitG, 'cobweb', 10.5, -7.5, 0.4);
    }
    // Boss chamber
    placeProp(bossG, 'column', 16, -5, 0);
    placeProp(bossG, 'column', 16, 5, 0);
    placeProp(bossG, 'column', 28, -5, 0);
    placeProp(bossG, 'column_broken', 28, 5, 0.4);
    placeProp(bossG, 'torch_wall', 18, -7, 0);
    placeProp(bossG, 'torch_wall', 18, 7, Math.PI);
    placeProp(bossG, 'candelabrum', 22, -6, 0.3);
    placeProp(bossG, 'crate', 20, 5.5, 0.5);
    placeProp(bossG, moss ? 'crystal' : 'bones', 26, 0, 0.8);
    placeProp(bossG, moss ? 'rock_moss' : 'rock2', 24, -4, 0.2);
    placeProp(bossG, moss ? 'plant1' : 'skull', 25, 4.5, -0.6);
  }

  function beginWave(n) {
    run.wave = n;
    run.wavePhase = 'fight';
    clearDeadEnemies();
    const plan = wavePlan(def, run.floor)[n - 1];
    const ids = plan.ids.length ? plan.ids : def.enemies;
    for (let i = 0; i < plan.count; i++) {
      const pad = run.spawnPads[i % run.spawnPads.length];
      const jitter = 0.6;
      spawnEnemy(pick(ids), pad.x + rand(-jitter, jitter), pad.z + rand(-jitter, jitter), false);
      // pulse pad
      if (pad.mesh?.material) pad.mesh.material.emissiveIntensity = 1.2;
    }
    run.seals.total = run.enemies.filter((e) => e.alive).length;
    run.seals.killed = 0;
  }

  function clearDeadEnemies() {
    for (const e of run.enemies) {
      if (!e.alive && e.mesh) {
        e.mesh.parent?.remove(e.mesh);
      }
    }
    run.enemies = run.enemies.filter((e) => e.alive);
  }

  function despawnAllTrash() {
    for (const e of run.enemies) {
      e.alive = false;
      if (e.mesh) e.mesh.parent?.remove(e.mesh);
    }
    run.enemies = [];
  }

  function spawnWaveLoot() {
    run.wavePhase = 'loot';
    const pitG = run.roomNodes.find((n) => n.id === 'pit')?.group || group;
    let crate = placeProp(pitG, 'chest', 0, 0, 0.2);
    if (!crate) {
      crate = mesh(pitG, new THREE.BoxGeometry(1.4, 1.0, 1.4), '#c9922a', 0, 0.55, 0);
      mesh(pitG, new THREE.BoxGeometry(1.5, 0.18, 1.5), '#ffd43b', 0, 1.1, 0);
    }
    run.waveLoot = {
      x: 0, z: 0, mesh: crate, claimed: false,
      loot: {
        gold: Math.round(ri(8, 16) * run.floor * run.diff.reward),
        xp: Math.round(ri(6, 12) * run.floor * run.diff.reward),
        drops: [
          { id: matId(def.rewards[0]), qty: ri(1, 2) },
          ...(Math.random() < 0.45 ? [{ id: matId(def.rewards[1] || def.rewards[0]), qty: 1 }] : []),
          ...(Math.random() < 0.2 ? [{ id: 'potion', qty: 1 }] : []),
        ],
      },
    };
  }

  function claimWaveLoot() {
    if (!run.waveLoot || run.waveLoot.claimed) return null;
    run.waveLoot.claimed = true;
    if (run.waveLoot.mesh) run.waveLoot.mesh.visible = false;
    const loot = run.waveLoot.loot;
    openBossGate();
    return loot;
  }

  function openBossGate() {
    if (!run.bossGate || run.bossGate.open) return;
    run.bossGate.open = true;
    if (run.bossGate.mesh) run.bossGate.mesh.visible = false;
    const i = run.colliders.indexOf(run.bossGate.lockCol);
    if (i >= 0) run.colliders.splice(i, 1);
    despawnAllTrash();
    spawnFloorBoss();
    run.wavePhase = 'boss';
  }

  function spawnFloorBoss() {
    const ids = def.floorBosses || [def.boss];
    const bossId = ids[Math.min(run.floor, ids.length) - 1] || def.boss;
    const bdef = BOSSES[bossId];
    if (!bdef) return;
    const br = run.bossRoom;
    const boss = {
      id: bossId, def: bdef, x: br.x, z: br.z,
      hp: Math.round(bdef.hp * diff.hp), maxHp: Math.round(bdef.hp * diff.hp),
      atk: bdef.atk * diff.dmg, defStat: bdef.def * diff.def, spd: bdef.spd,
      alive: true, phase: 0, t: 0, windup: 0, telegraph: null,
      splitDone: false, caveinDone: false, reassembled: false, stunned: 0,
      mesh: null, adds: [], pending: null, nextSkill: 1.8,
      atkTele: null, chainDone: false, fullPower: !!bdef.fullPower,
      kit: bdef.kit || ['chase'], callDone: false, burrowT: 0,
    };
    const eg = buildBossMesh(bossId, def.color);
    eg.position.set(boss.x, 0, boss.z);
    const bossNode = run.roomNodes.find((n) => n.id === 'boss');
    (bossNode?.group || group).add(eg);
    boss.mesh = eg;
    if (eg.userData?.mixer) {
      run.mixers = run.mixers || [];
      run.mixers.push(eg.userData.mixer);
    }
    attachHpBar(eg, boss, {
      worldW: 1.7,
      y: (eg.userData.targetH || 2.2) + 0.55,
    });
    run.boss = boss;
  }

  function onWaveEnemyDied(e) {
    if (!e.alive) return null;
    e.alive = false;
    if (e.mesh) e.mesh.visible = false;
    run.seals.killed += 1;
    const alive = run.enemies.filter((x) => x.alive).length;
    if (alive === 0 && run.wavePhase === 'fight') {
      if (run.wave < 3) {
        run.wavePause = 1.1;
        run.pendingWave = run.wave + 1;
        run.wavePhase = 'pause';
      } else {
        spawnWaveLoot();
      }
    }
    return { loot: lootFor(e), opened: false, waveLootReady: run.wavePhase === 'loot' };
  }

  function tickWaves(dt) {
    if (run.mixers?.length) {
      for (const m of run.mixers) m.update(dt);
    }
    if (!isWaves) return;
    if (run.wavePhase === 'pause' && run.pendingWave) {
      run.wavePause -= dt;
      if (run.wavePause <= 0) {
        const next = run.pendingWave;
        run.pendingWave = null;
        beginWave(next);
      }
    }
    // dim pads after pulse
    for (const p of run.spawnPads) {
      if (p.mesh?.material?.emissiveIntensity > 0.7) {
        p.mesh.material.emissiveIntensity = Math.max(0.7, p.mesh.material.emissiveIntensity - dt);
      }
    }
  }

  function buildClassicFloor(n) {
    run.seals = { killed: 0, total: 0, pillars: 0, needPillars: 0, guardianDown: false, open: n === 5 };
    const rooms = roomLayout(n, n * 17 + dungeonId.length);
    run.rooms = rooms;
    const fMat = floorMatFor(def);
    const wMat = wallMatFor(def);
    const wh = 3.6;
    const seed = n * 97 + dungeonId.length * 13;

    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      const rg = new THREE.Group();
      rg.name = `room_${r.id}`;
      group.add(rg);
      const open = openSides(rooms, i);
      mesh(rg, new THREE.BoxGeometry(r.w, 0.28, r.d), fMat, r.x, 0, r.z);
      buildRoomWalls(rg, r, open, wMat, wh, run.colliders);
      mesh(rg, new THREE.BoxGeometry(r.w + 0.2, 0.35, r.d + 0.2), wMat, r.x, wh + 0.1, r.z);
      decorateRoom(rg, def, r, seed, run.hazards);
      if (r.safe) run.safe = { x: r.x, z: r.z };
      run.roomNodes.push({
        id: r.id, room: r, group: rg, index: i,
        x0: r.x - r.w / 2, x1: r.x + r.w / 2,
        z0: r.z - r.d / 2, z1: r.z + r.d / 2,
      });
    }

    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i], b = rooms[i + 1];
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      const dx = Math.abs(a.x - b.x), dz = Math.abs(a.z - b.z);
      const cg = new THREE.Group();
      group.add(cg);
      const cw = Math.max(3.2, dx * 0.35 + (dz > dx ? 3.2 : 0));
      const cd = Math.max(3.2, dz * 0.35 + (dx >= dz ? 3.2 : 0));
      decorateCorridor(cg, def, mx, mz, cw, cd);
      if (dx >= dz) {
        wallSegment(cg, wMat, wh, mx - cw / 2, mz - cd / 2, mx + cw / 2, mz - cd / 2, run.colliders);
        wallSegment(cg, wMat, wh, mx - cw / 2, mz + cd / 2, mx + cw / 2, mz + cd / 2, run.colliders);
        mesh(cg, new THREE.BoxGeometry(cw, 0.3, cd), wMat, mx, wh + 0.05, mz);
      } else {
        wallSegment(cg, wMat, wh, mx - cw / 2, mz - cd / 2, mx - cw / 2, mz + cd / 2, run.colliders);
        wallSegment(cg, wMat, wh, mx + cw / 2, mz - cd / 2, mx + cw / 2, mz + cd / 2, run.colliders);
        mesh(cg, new THREE.BoxGeometry(cw, 0.3, cd), wMat, mx, wh + 0.05, mz);
      }
      run.corridorNodes.push({
        group: cg, a: a.id, b: b.id,
        x0: mx - cw / 2, x1: mx + cw / 2, z0: mz - cd / 2, z1: mz + cd / 2,
      });
    }

    if (n < 5) {
      const stairRoom = rooms.find((r) => r.id === 'stair');
      const stairNode = run.roomNodes.find((nn) => nn.id === 'stair');
      const parent = stairNode?.group || group;
      const barrier = mesh(parent, new THREE.BoxGeometry(3.4, 3.2, 0.45),
        new THREE.MeshLambertMaterial({ color: '#74c0fc', transparent: true, opacity: 0.72, emissive: '#1c7ed6', emissiveIntensity: 0.55 }),
        stairRoom.x + 3.2, 1.6, stairRoom.z);
      const steps = mesh(parent, new THREE.BoxGeometry(2.6, 1.3, 2.6), '#adb5bd', stairRoom.x + 3.2, 0.65, stairRoom.z);
      steps.visible = false;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        mesh(parent, new THREE.BoxGeometry(0.35, 0.15, 0.35), '#ffd43b',
          stairRoom.x + 3.2 + Math.cos(ang) * 2.2, 0.2, stairRoom.z + Math.sin(ang) * 2.2);
      }
      const lockCol = {
        x0: stairRoom.x + 3.2 - 1.5, x1: stairRoom.x + 3.2 + 1.5,
        z0: stairRoom.z - 0.5, z1: stairRoom.z + 0.5,
        sealLock: true,
      };
      run.colliders.push(lockCol);
      run.stair = {
        x: stairRoom.x + 3.2, z: stairRoom.z,
        mesh: barrier, steps, open: false, lockCol,
      };

      if (def.seal.kind === 'pillars') {
        run.seals.needPillars = def.seal.count || 3;
        for (let i = 0; i < run.seals.needPillars; i++) {
          const rr = rooms[1 + (i % (rooms.length - 2))];
          const node = run.roomNodes.find((nn) => nn.id === rr.id);
          const px = rr.x + rand(-2.5, 2.5), pz = rr.z + rand(-2.5, 2.5);
          const p = mesh(node?.group || group, new THREE.CylinderGeometry(0.4, 0.5, 2.4, 8), '#dee2e6', px, 1.2, pz);
          mesh(node?.group || group, new THREE.TorusGeometry(0.55, 0.06, 6, 12), '#adb5bd', px, 1.6, pz).rotation.x = Math.PI / 2;
          run.pillars.push({ x: px, z: pz, mesh: p, on: false });
        }
      }

      const count = n === 1 ? 7 : n === 2 ? 9 : n === 3 ? 8 : 11;
      for (let i = 0; i < count; i++) {
        const rr = rooms[1 + (i % (rooms.length - 1))];
        spawnEnemy(pick(def.enemies), rr.x + rand(-3.2, 3.2), rr.z + rand(-3.2, 3.2), false);
      }
      if (['storm', 'eclipse', 'astral', 'crown'].includes(def.id)) {
        const nElite = def.id === 'crown' ? 3 : 2;
        for (let i = 0; i < nElite; i++) {
          const rr = rooms[1 + (i % (rooms.length - 1))];
          spawnEnemy(pick(def.enemies), rr.x + rand(-2.5, 2.5), rr.z + rand(-2.5, 2.5), true);
        }
      }
      run.seals.total = run.enemies.length;

      const gId = def.guardians[n];
      if (gId && ENEMIES[gId]) {
        const gr = rooms.find((r) => r.id === 'guard') || rooms[rooms.length - 2];
        spawnEnemy(gId, gr.x, gr.z, true);
      }
    } else {
      const bossRoom = rooms.find((r) => r.boss);
      makeBossEntity(def.boss, bossRoom);
    }

    run.activeRoom = rooms[0].id;
    updateRoomVisibility(rooms[0].x, rooms[0].z);
    return { spawnX: rooms[0].x, spawnZ: rooms[0].z };
  }

  function makeBossEntity(bossId, bossRoom) {
    const bdef = BOSSES[bossId];
    const boss = {
      id: bossId, def: bdef, x: bossRoom.x, z: bossRoom.z,
      hp: Math.round(bdef.hp * diff.hp), maxHp: Math.round(bdef.hp * diff.hp),
      atk: bdef.atk * diff.dmg, defStat: bdef.def * diff.def, spd: bdef.spd,
      alive: true, phase: 0, t: 0, windup: 0, telegraph: null,
      splitDone: false, caveinDone: false, reassembled: false, stunned: 0,
      mesh: null, adds: [], pending: null, nextSkill: 2.0,
      atkTele: null, chainDone: false, fullPower: !!bdef.fullPower,
      kit: bdef.kit || ['chase'], callDone: false,
    };
    const eg = buildBossMesh(bossId, def.color);
    eg.position.set(boss.x, 0, boss.z);
    const bossNode = run.roomNodes.find((nn) => nn.id === 'boss');
    (bossNode?.group || group).add(eg);
    boss.mesh = eg;
    if (eg.userData?.mixer) {
      run.mixers = run.mixers || [];
      run.mixers.push(eg.userData.mixer);
    }
    attachHpBar(eg, boss, {
      worldW: 1.7,
      y: (eg.userData.targetH || 2.2) + 0.55,
    });
    run.boss = boss;
    run.bossRoom = bossRoom;
  }

  function spawnEnemy(id, x, z, elite = false) {
    const base = ENEMIES[id];
    if (!base) return null;
    const e = {
      id, def: base, x, z, ry: rand(0, Math.PI * 2),
      hp: Math.round(base.hp * run.diff.hp),
      maxHp: Math.round(base.hp * run.diff.hp),
      atk: base.atk * run.diff.dmg,
      defStat: base.def * run.diff.def,
      spd: base.spd,
      alive: true, t: rand(0, 5), hitT: 0, windup: 0, elite: elite || !!base.elite,
      mesh: null, key: elite, state: 'chase', tele: null,
    };
    const m = buildEnemyMesh({ ...base, id, scale: (base.scale || 1) * (isWaves ? 1.15 : 1) });
    m.position.set(x, 0, z);
    if (isWaves) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 0.95, 20),
        new THREE.MeshBasicMaterial({
          color: elite ? '#fa5252' : '#74c0fc', transparent: true, opacity: 0.7, side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.06;
      m.add(ring);
    }
    if (m.userData?.mixer) {
      run.mixers = run.mixers || [];
      run.mixers.push(m.userData.mixer);
    }
    e.mesh = m;
    attachHpBar(m, e, {
      worldW: e.elite ? 1.35 : 1.05,
      y: (m.userData.targetH || 1.4) + 0.4,
    });
    const node = run.roomNodes.find((nn) => x >= nn.x0 && x <= nn.x1 && z >= nn.z0 && z <= nn.z1);
    (node?.group || group).add(m);
    run.enemies.push(e);
    return e;
  }

  function openSeal() {
    if (run.seals.open || !run.stair) return false;
    run.seals.open = true;
    run.stair.open = true;
    if (run.stair.mesh) run.stair.mesh.visible = false;
    if (run.stair.steps) run.stair.steps.visible = true;
    if (run.stair.lockCol) {
      const i = run.colliders.indexOf(run.stair.lockCol);
      if (i >= 0) run.colliders.splice(i, 1);
    }
    return true;
  }

  function checkSeal() {
    if (isWaves || run.seals.open || run.floor === 5) return false;
    const kind = def.seal.kind;
    let ready = false;
    if (kind === 'clear') {
      ready = run.seals.killed / Math.max(1, run.seals.total) >= (def.seal.pct || 0.7);
    } else if (kind === 'guardian') {
      ready = run.seals.guardianDown;
    } else if (kind === 'pillars') {
      ready = run.seals.pillars >= run.seals.needPillars;
    }
    if (ready) return openSeal();
    return false;
  }

  function onEnemyDied(e) {
    if (isWaves) return onWaveEnemyDied(e);
    if (!e.alive) return;
    e.alive = false;
    e.mesh.visible = false;
    run.seals.killed += 1;
    if (e.key || e.elite) run.seals.guardianDown = true;
    const opened = checkSeal();
    return { loot: lootFor(e), opened };
  }

  function lootFor(e) {
    const gold = ri(e.def.gold[0], e.def.gold[1]);
    const drops = [];
    const mats = def.rewards || [];
    if (Math.random() < 0.55) drops.push({ id: matId(mats[0]), qty: ri(1, 2) });
    if (Math.random() < 0.25) drops.push({ id: matId(mats[1] || mats[0]), qty: 1 });
    if (Math.random() < 0.08) drops.push({ id: 'potion', qty: 1 });
    return { gold: Math.round(gold * run.diff.reward), xp: Math.round(e.def.xp * run.diff.reward), drops };
  }

  function matId(name) {
    const map = {
      'Slime Gel': 'slime_gel', 'Mossroot Fiber': 'moss_fiber',
      'Iron Scrap': 'iron_scrap', 'Rusty Gear': 'rusty_gear',
      'Bone Dust': 'bone_dust', 'Ectoplasm': 'ectoplasm',
      'Ember Core': 'ember_core', 'Wolf Pelt': 'wolf_pelt',
      'Tide Scale': 'tide_scale', 'Siren Pearl': 'siren_pearl',
      'Steel Plate': 'steel_plate', 'Clockwork Core': 'clockwork_core',
      'Storm Shard': 'storm_shard', 'Gale Feather': 'gale_feather',
      'Eclipse Shard': 'eclipse_shard', 'Solar Dust': 'solar_dust',
      'Astral Ore': 'astral_ore', 'Foundry Ember': 'foundry_ember',
      'Mythic Prism': 'mythic_prism', 'Crown Filament': 'crown_filament',
    };
    return map[name] || 'slime_gel';
  }

  function defeatBoss(ctx) {
    const b = run.boss;
    if (!b || !b.alive) return null;
    if (b.id === 'vorren' && !b.reassembled && !ctx?.holyFinisher) {
      b.reassembled = true;
      b.hp = Math.round(b.maxHp * 0.35);
      b.phase = 2;
      b.stunned = 0.8;
      ctx?.reveal?.('reassemble');
      return { reassembled: true };
    }
    b.alive = false;
    if (b.mesh) b.mesh.visible = false;
    despawnAllTrash();

    // Wave floors 1-4: open stairs, small bonus, no main chest
    if (isWaves && run.floor < 5) {
      openSeal();
      run.wavePhase = 'stairs';
      return {
        floorClear: true,
        gold: Math.round(ri(12, 22) * run.floor * run.diff.reward),
        xp: Math.round(ri(15, 28) * run.floor * run.diff.reward),
        drops: [{ id: matId(def.rewards[0]), qty: ri(1, 2) }],
      };
    }

    const br = run.bossRoom;
    const bossNode = run.roomNodes.find((nn) => nn.id === 'boss');
    const parent = bossNode?.group || group;
    const portal = mesh(parent, new THREE.CylinderGeometry(1.5, 1.5, 0.35, 16),
      new THREE.MeshLambertMaterial({ color: '#74c0fc', emissive: '#1c7ed6', emissiveIntensity: 0.75 }),
      br.x - 6, 0.2, br.z);
    run.portal = { x: br.x - 6, z: br.z, mesh: portal };
    let chest = placeProp(parent, 'chest_gold', br.x + 5, br.z, 0.35);
    if (!chest) {
      chest = mesh(parent, new THREE.BoxGeometry(1.6, 1.2, 1.2), '#fab005', br.x + 5, 0.6, br.z);
      mesh(parent, new THREE.BoxGeometry(1.7, 0.25, 1.3), '#c9922a', br.x + 5, 1.25, br.z);
    }
    run.chest = { x: br.x + 5, z: br.z, mesh: chest, opened: false, main: true };
    run.wavePhase = 'done';
    return bossLoot(ctx);
  }

  function bossLoot(ctx) {
    const drops = [];
    const mats = def.rewards || [];
    drops.push({ id: matId(mats[0]), qty: ri(2, 4) });
    drops.push({ id: matId(mats[1] || mats[0]), qty: ri(1, 3) });
    if (Math.random() < 0.35 * run.diff.reward) {
      const gearMap = {
        mossroot: 'moss_blade', rustpick: 'rust_plate', crypt: 'hollow_blade',
        ember: 'ashen_blade', drowned: 'tide_staff', bastion: 'bastion_shield',
        storm: 'storm_lance', eclipse: 'eclipse_blade', astral: 'astral_hammer', crown: 'mythic_scepter',
      };
      const gear = gearMap[def.id];
      if (gear) drops.push({ id: gear, qty: 1 });
    }
    const prestige = { eclipse: 'cos_eclipse_cloak', astral: 'cos_astral_sigil', crown: 'cos_mythic_crown' };
    if (prestige[def.id] && Math.random() < 0.55 * run.diff.reward) {
      drops.push({ id: prestige[def.id], qty: 1 });
    }
    if (def.rank === 'F' && Math.random() < 0.01) {
      const cross = pick(['e_mace', 'e_helm']);
      if (!ctx?.S?.flags?.['cross_' + cross]) drops.push({ id: cross, qty: 1, cross: true });
    }
    const rankGold = { F: 50, E: 70, D: 100, C: 140, B: 190, A: 260, S: 340, SS: 440, SSS: 580 };
    const rankXp = { F: 95, E: 130, D: 180, C: 240, B: 320, A: 420, S: 540, SS: 700, SSS: 900 };
    return {
      gold: Math.round(ri((rankGold[def.rank] || 50) * 0.8, (rankGold[def.rank] || 50) * 1.2) * run.diff.reward),
      xp: Math.round((rankXp[def.rank] || 95) * run.diff.reward),
      bc: 1,
      drops,
      mainChest: true,
    };
  }

  function roomAt(x, z) {
    for (const n of run.roomNodes) {
      if (x >= n.x0 - 0.5 && x <= n.x1 + 0.5 && z >= n.z0 - 0.5 && z <= n.z1 + 0.5) return n;
    }
    for (const c of run.corridorNodes) {
      if (x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1) {
        return run.roomNodes.find((n) => n.id === c.a) || run.roomNodes[0];
      }
    }
    return run.roomNodes[0] || null;
  }

  function updateRoomVisibility(px, pz) {
    if (isWaves) {
      for (const n of run.roomNodes) n.group.visible = true;
      for (const c of run.corridorNodes) c.group.visible = true;
      run.activeRoom = roomAt(px, pz)?.id || 'pit';
      return;
    }
    const cur = roomAt(px, pz);
    if (!cur) return;
    run.activeRoom = cur.id;
    const idx = cur.index;
    const visibleIds = new Set([cur.id]);
    if (idx > 0) visibleIds.add(run.rooms[idx - 1].id);
    if (idx < run.rooms.length - 1) visibleIds.add(run.rooms[idx + 1].id);
    for (const n of run.roomNodes) {
      const near = visibleIds.has(n.id);
      n.group.visible = near || Math.abs(n.index - idx) <= 1;
      n.group.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const matsArr = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of matsArr) {
          if (!mat) continue;
          if (near) {
            mat.transparent = !!mat.userData._wasTransparent;
            mat.opacity = mat.userData._baseOpacity ?? 1;
          } else if (Math.abs(n.index - idx) === 2) {
            if (mat.userData._baseOpacity == null) {
              mat.userData._baseOpacity = mat.opacity ?? 1;
              mat.userData._wasTransparent = mat.transparent;
            }
            mat.transparent = true;
            mat.opacity = 0.12;
            n.group.visible = true;
          } else {
            n.group.visible = false;
          }
        }
      });
      if (Math.abs(n.index - idx) > 2) n.group.visible = false;
      if (near) {
        n.group.visible = true;
        n.group.traverse((obj) => {
          if (!obj.isMesh || !obj.material) return;
          const matsArr = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of matsArr) {
            if (!mat || mat.userData._baseOpacity == null) continue;
            mat.transparent = mat.userData._wasTransparent;
            mat.opacity = mat.userData._baseOpacity;
          }
        });
      }
    }
    for (const c of run.corridorNodes) {
      c.group.visible = visibleIds.has(c.a) || visibleIds.has(c.b);
    }
  }

  run.spawn = buildFloor(1);
  run.buildFloor = buildFloor;
  run.openSeal = openSeal;
  run.checkSeal = checkSeal;
  run.onEnemyDied = onEnemyDied;
  run.defeatBoss = defeatBoss;
  run.spawnEnemy = spawnEnemy;
  run.updateRoomVisibility = updateRoomVisibility;
  run.claimWaveLoot = claimWaveLoot;
  run.openBossGate = openBossGate;
  run.tickWaves = tickWaves;
  run.activatePillar = (i) => {
    const p = run.pillars[i];
    if (!p || p.on) return false;
    p.on = true;
    p.mesh.material = new THREE.MeshLambertMaterial({ color: '#ffd43b', emissive: '#fab005', emissiveIntensity: 0.7 });
    run.seals.pillars += 1;
    return checkSeal();
  };
  run.dispose = () => {
    run.clear();
    scene.remove(group);
  };
  return run;
}
