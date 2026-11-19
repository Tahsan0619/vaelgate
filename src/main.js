import * as THREE from 'three';
import {
  GAME, CLASSES, APTITUDE, SKIN_TONES, HAIR_COLORS, HAIR_STYLES, PLACES, DUNGEONS, BOSSES,
  ITEMS, gold, clamp, walkTime,
} from './config.js';
import {
  newState, load, save, effectiveStats, addItem, removeItem, gainXp, recordClear,
  contributionRating, drainHunger, currentGoal, canEnterDungeon,
} from './state.js';
import { Input } from './input.js';
import { audio } from './audio.js';
import { buildPerson, animatePerson } from './people.js';
import { createSky, buildCity, buildGuildInterior } from './city.js';
import { buildAllInteriors, refreshAllInteriorHumans } from './interiors.js';
import { createDungeonRun } from './dungeon.js';
import { createCombat } from './combat.js';
import { createHud } from './hud.js';
import { createPanels } from './panels.js';
import { icon } from './icons.js';
import { preloadModels } from './modelLoader.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 220);
const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
let camYaw = 0, camYawT = 0, camPitch = 0.42;

const sky = createSky(scene);
const city = buildCity(scene);
const guild = buildGuildInterior(scene);
const shops = buildAllInteriors(scene);
const combat = createCombat(scene);
const hud = createHud();
const input = new Input();

// City/guild/shops are built before GLBs exist — upgrade everyone once humans load.
preloadModels().then(() => {
  city.refreshHumans?.();
  guild.refreshHumans?.();
  refreshAllInteriorHumans(shops);
}).catch(() => {});

let S = null;
let mode = 'title'; // title | creator | play | pause
let where = null; // null city, 'guild', shop id, or dungeon
let player = null;
let activeInterior = null;
let run = null;
let waypoint = null;
let cds = [0, 0, 0];
let atkCd = 0;
let indoorLook = false;

function setIndoorLook(on) {
  indoorLook = !!on;
  if (on) {
    // Never tint fog/background to wall color — that erased the whole arena.
    scene.background = new THREE.Color('#0e141c');
    scene.fog = new THREE.Fog('#1a2330', 32, 85);
    if (sky?.hemi) {
      sky.hemi.color.set('#d9e6f5');
      sky.hemi.groundColor.set('#3d4a3a');
      sky.hemi.intensity = 0.95;
    }
    if (sky?.sun) {
      sky.sun.color.set('#fff1d6');
      sky.sun.intensity = 1.15;
      sky.sun.position.set(8, 22, 10);
    }
    if (sky?.fill) sky.fill.intensity = 0.55;
    camera.fov = 55;
    camera.far = 120;
    camera.updateProjectionMatrix();
  } else {
    scene.background = new THREE.Color('#9fd3ff');
    scene.fog = new THREE.Fog('#b6d8ef', 55, 190);
    if (sky?.hemi) {
      sky.hemi.color.set('#dbeeff');
      sky.hemi.groundColor.set('#5b6b3a');
      sky.hemi.intensity = 0.95;
    }
    if (sky?.sun) {
      sky.sun.color.set('#fff4e0');
      sky.sun.intensity = 1.55;
      sky.sun.position.set(48, 70, 28);
    }
    if (sky?.fill) sky.fill.intensity = 0.25;
    camera.fov = 55;
    camera.far = 220;
    camera.updateProjectionMatrix();
  }
}
let iFrames = 0;
let animMode = 'idle';
let animT = 0;
let pendingLoot = null;
let labels = [];

const $ = (id) => document.getElementById(id);
const fade = (on) => $('fade').classList.toggle('on', on);

// Static HUD icons (no emoji)
for (const [id, name] of [['icoMap', 'map'], ['icoCard', 'card'], ['icoRank', 'clipboard'], ['icoMenu', 'pause'], ['icoUse', 'use'], ['icoBag', 'bag']]) {
  const el = $(id);
  if (el) el.innerHTML = icon(name);
}

const G = {
  S: () => S,
  toast: (...a) => hud.toast(...a),
  changed() { hud.sync(S); save(S); },
  inventory() { panels.inventory(); },
  setWaypoint(id) { waypoint = PLACES.find((p) => p.id === id) || null; },
  enterDungeon(diff) { startDungeon(G._gateDungeon, diff); },
  nextFloor() { descend(); },
  claimChest() { openBossChest(); },
  leaveDungeon(victory) { endDungeon(victory); },
  refreshShop: null,
  _gateDungeon: null,
  _restEat: false,
  _eatBuy: false,
};
const panels = createPanels(G);

function openHudPanel(act) {
  if (act === 'pause') {
    if (mode === 'pause') { $('pause').classList.add('hidden'); mode = 'play'; }
    else if (mode === 'play' || mode === 'pause') { mode = 'pause'; $('pause').classList.remove('hidden'); }
    return;
  }
  if (!S || (mode !== 'play' && mode !== 'pause')) return;
  if (mode === 'pause') { $('pause').classList.add('hidden'); mode = 'play'; }
  if (act === 'map') panels.map();
  if (act === 'card') panels.card();
  if (act === 'progress') panels.progress();
}

// Top-right nav: click only (no data-act queue fight)
[['btnMap', 'map'], ['btnCard', 'card'], ['btnRank', 'progress'], ['btnMenu', 'pause']].forEach(([id, act]) => {
  const el = $(id);
  if (!el) return;
  el.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openHudPanel(act);
  });
});

// ----- Title / Creator -----
function showTitle() {
  mode = 'title';
  disposeCreatorPreview();
  hud.show(false);
  $('title').classList.remove('hidden');
  $('creator').classList.add('hidden');
  $('continueBtn').classList.toggle('hidden', !load());
  city.group.visible = true;
  guild.group.visible = false;
}

$('newBtn').onclick = () => openCreator();
$('continueBtn').onclick = () => {
  S = load();
  if (!S) return;
  startPlay();
};
$('cBack').onclick = () => showTitle();

let aptAnswers = [];
let aptStep = 0;
let chosenClass = 'duelist';
let creatorPrev = null;

function disposeCreatorPreview() {
  if (!creatorPrev) return;
  if (creatorPrev.person?.group) creatorPrev.scene.remove(creatorPrev.person.group);
  creatorPrev.renderer.dispose();
  creatorPrev.canvas.remove();
  creatorPrev = null;
}

function ensureCreatorPreview() {
  const box = $('creatorPreview');
  if (creatorPrev) return creatorPrev;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Character preview');
  box.innerHTML = '';
  box.appendChild(canvas);
  const prevRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  prevRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  prevRenderer.setClearColor(0x000000, 0);
  const prevScene = new THREE.Scene();
  const prevCam = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  prevCam.position.set(0, 1.55, 4.2);
  prevCam.lookAt(0, 1.05, 0);
  prevScene.add(new THREE.HemisphereLight('#eef6ff', '#6b7a4a', 1.05));
  const key = new THREE.DirectionalLight('#fff4e0', 1.15);
  key.position.set(2.5, 5, 3);
  prevScene.add(key);
  const fill = new THREE.DirectionalLight('#a5d8ff', 0.35);
  fill.position.set(-3, 2, -2);
  prevScene.add(fill);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(1.4, 32),
    new THREE.MeshLambertMaterial({ color: '#2c3e50', transparent: true, opacity: 0.35 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  prevScene.add(floor);
  creatorPrev = {
    canvas, renderer: prevRenderer, scene: prevScene, camera: prevCam,
    person: null, t: 0,
  };
  resizeCreatorPreview();
  return creatorPrev;
}

function resizeCreatorPreview() {
  if (!creatorPrev) return;
  const box = $('creatorPreview');
  const w = Math.max(1, box.clientWidth);
  const h = Math.max(1, box.clientHeight);
  creatorPrev.renderer.setSize(w, h, false);
  creatorPrev.camera.aspect = w / h;
  creatorPrev.camera.updateProjectionMatrix();
}

function openCreator() {
  mode = 'creator';
  $('title').classList.add('hidden');
  $('creator').classList.remove('hidden');
  aptAnswers = []; aptStep = 0; chosenClass = 'duelist';
  const skin = $('cSkin'); skin.innerHTML = SKIN_TONES.map((c, i) => `<option value="${c}">Tone ${i + 1}</option>`).join('');
  const hair = $('cHair'); hair.innerHTML = HAIR_STYLES.map((h) => `<option value="${h}">${h}</option>`).join('');
  const hc = $('cHairColor'); hc.innerHTML = HAIR_COLORS.map((c, i) => `<option value="${c}">Color ${i + 1}</option>`).join('');
  ensureCreatorPreview();
  renderApt();
  renderClasses();
  previewCreator();
  ['cBody', 'cSkin', 'cHair', 'cHairColor'].forEach((id) => { $(id).onchange = previewCreator; });
  preloadModels().then(() => previewCreator()).catch(() => {});
  requestAnimationFrame(() => { resizeCreatorPreview(); previewCreator(); });
}

function renderApt() {
  if (aptStep >= APTITUDE.length) {
    const scores = {};
    for (const c of aptAnswers) scores[c] = (scores[c] || 0) + 1;
    chosenClass = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'duelist';
    $('aptQ').textContent = 'Recommendation ready. Accept it or pick any class.';
    $('aptOpts').innerHTML = '';
    $('aptRec').innerHTML = `Recommended: ${icon(CLASSES[chosenClass].icon)} ${CLASSES[chosenClass].name}`;
    renderClasses();
    previewCreator();
    return;
  }
  const q = APTITUDE[aptStep];
  $('aptQ').textContent = `Q${aptStep + 1}. ${q.q}`;
  $('aptOpts').innerHTML = q.opts.map((o, i) => `<button class="btn" data-i="${i}">${o.t}</button>`).join('');
  $('aptOpts').querySelectorAll('button').forEach((b) => {
    b.onclick = () => {
      aptAnswers.push(q.opts[+b.dataset.i].c);
      aptStep += 1;
      renderApt();
    };
  });
}

function renderClasses() {
  $('classGrid').innerHTML = Object.values(CLASSES).map((c) => `
    <button class="class-card ${c.id === chosenClass ? 'on' : ''}" data-c="${c.id}">
      <b>${icon(c.icon)} ${c.name}</b>
      <small>${c.role}</small>
      <small>${c.blurb}</small>
    </button>`).join('');
  $('classGrid').querySelectorAll('.class-card').forEach((b) => {
    b.onclick = () => { chosenClass = b.dataset.c; renderClasses(); previewCreator(); };
  });
}

function creatorLook() {
  const cls = CLASSES[chosenClass];
  return {
    ...cls.look,
    classId: chosenClass,
    body: $('cBody').value,
    skin: $('cSkin').value,
    hair: $('cHairColor').value,
    hairStyle: $('cHair').value,
  };
}

function previewCreator() {
  const prev = ensureCreatorPreview();
  const cls = CLASSES[chosenClass];
  const look = creatorLook();
  if (prev.person?.group) prev.scene.remove(prev.person.group);
  prev.person = buildPerson(look);
  prev.person.group.rotation.y = Math.PI * 0.12;
  prev.scene.add(prev.person.group);
  resizeCreatorPreview();
  prev.renderer.render(prev.scene, prev.camera);

  const info = $('creatorClassInfo');
  info.innerHTML = `
    <div class="cci-head">${icon(cls.icon)}<h3>${cls.name}</h3></div>
    <p class="cci-role">${cls.role}</p>
    <p style="margin:0 0 4px;font-size:13px;color:var(--muted)">${cls.blurb}</p>
    <div class="cci-row pro"><b>Advantage</b><span>${cls.adv}</span></div>
    <div class="cci-row con"><b>Disadvantage</b><span>${cls.dis}</span></div>`;
  $('creatorPreview').style.background =
    `radial-gradient(circle at 50% 28%, ${cls.color}aa 0%, #3d5a80 48%, #1b263b 100%)`;
}

$('cConfirm').onclick = () => {
  const name = ($('cName').value || '').trim();
  if (name.length < 3 || name.length > 16 || !/^[a-zA-Z0-9]+$/.test(name)) {
    hud.toast('Name must be 3 to 16 letters or numbers.', 'bad');
    return;
  }
  S = newState({ name, classId: chosenClass, look: creatorLook() });
  save(S);
  startPlay();
};

function startPlay() {
  disposeCreatorPreview();
  $('title').classList.add('hidden');
  $('creator').classList.add('hidden');
  mode = 'play';
  where = null;
  hideAllInteriors();
  if (player?.m) scene.remove(player.m.group);
  const look = {
    ...S.look,
    body: S.look.body || 'm',
    classId: S.classId,
    weapon: CLASSES[S.classId].look.weapon,
  };
  player = { x: S.x || 2, z: S.z || 12, y: 0, ry: S.ry || Math.PI, t: 0, m: buildPerson(look) };
  scene.add(player.m.group);
  placePlayer();
  city.group.visible = true;
  hud.show(true);
  hud.sync(S);
  preloadModels().then(() => {
    // Swap player + every city/NPC human once GLBs finish loading
    if (player?.m && !player.m.glb && mode === 'play') {
      const pos = { x: player.x, z: player.z, ry: player.ry };
      scene.remove(player.m.group);
      player.m = buildPerson(look);
      scene.add(player.m.group);
      player.x = pos.x; player.z = pos.z; player.ry = pos.ry;
      placePlayer();
    }
    city.refreshHumans?.();
    guild.refreshHumans?.();
    refreshAllInteriorHumans(shops);
    if ($('creator') && !$('creator').classList.contains('hidden')) previewCreator();
  }).catch(() => {});
  audio.unlock();
  if (!S.flags.seenTutorial) showTutorial();
  else hud.toast(`Welcome to ${GAME.city}, ${S.name}.`, 'info');
}

function placePlayer() {
  player.m.group.position.set(player.x, player.y, player.z);
  player.m.group.rotation.y = player.ry;
}

function hideAllInteriors() {
  guild.group.visible = false;
  for (const s of Object.values(shops)) if (s?.group) s.group.visible = false;
  activeInterior = null;
}

function collide(p, list, r) {
  if (!list) return;
  for (const c of list) {
    const cx = clamp(p.x, c.x0, c.x1), cz = clamp(p.z, c.z0, c.z1);
    const dx = p.x - cx, dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * r;
      p.z = cz + (dz / d) * r;
    } else {
      p.z = c.z1 + r;
    }
  }
}

function showTutorial() {
  const cls = CLASSES[S.classId];
  const skills = cls.skills.map((sk, i) => `<div><kbd>${i + 1}</kbd> ${sk.name}</div>`).join('');
  const sheet = $('sheet');
  sheet.classList.remove('hidden');
  sheet.innerHTML = `<header><h2>Welcome, ${S.name}</h2><p>${cls.name} · ${cls.role}</p></header>
    <p><b>Advantage:</b> ${cls.adv}</p>
    <p><b>Disadvantage:</b> ${cls.dis}</p>
    <div class="hr"></div>
    <h3>Controls</h3>
    <div class="tut-keys">
      <div><kbd>W A S D</kbd> Move</div>
      <div><kbd>Shift</kbd> Sprint</div>
      <div><kbd>Mouse drag</kbd> Camera</div>
      <div><kbd>J</kbd> Basic attack</div>
      <div><kbd>L</kbd> Dodge</div>
      <div><kbd>E</kbd> Enter / talk / use</div>
      <div><kbd>I</kbd> Inventory</div>
      <div><kbd>M</kbd> Map</div>
      <div><kbd>C</kbd> Adventurer Card</div>
      <div><kbd>P</kbd> Pause menu</div>
    </div>
    <h3>Your skills</h3>
    <div class="tut-keys">${skills}<div><kbd>E</kbd> Use / talk at doors</div></div>
    <p class="muted">When a prompt appears near a door or person, press <b>E</b> (or click Use). Walk to a building door and press E to go inside. Talk to the keeper inside to open shops. Walls block you.</p>
    <footer><button class="btn primary" id="tutOk">Begin</button></footer>`;
  $('tutOk').onclick = () => {
    S.flags.seenTutorial = true;
    save(S);
    panels.close();
    hud.toast('Follow the GOAL marker to the Guild Center door.', 'info', 5000);
  };
}

// ----- Building entry (door only) -----
function enterBuilding(id, quiet) {
  fade(true);
  setTimeout(() => {
    city.group.visible = false;
    hideAllInteriors();
    setIndoorLook(true);
    if (id === 'guild') {
      where = 'guild';
      activeInterior = guild;
      guild.group.visible = true;
      player.x = 0; player.z = 6; player.ry = Math.PI;
      if (!quiet) hud.toast('Guild Center. Walk to the desks and press E to talk.', 'info', 4000);
    } else {
      const interior = shops[id];
      if (!interior) { city.group.visible = true; setIndoorLook(false); fade(false); return; }
      where = id;
      activeInterior = interior;
      interior.group.visible = true;
      player.x = 0; player.z = 2.5; player.ry = Math.PI;
      if (!quiet) hud.toast('Inside. Walk to the keeper and press E.', 'info', 3500);
    }
    placePlayer();
    fade(false);
    audio.door();
  }, 280);
}

function leaveBuilding() {
  const left = where;
  fade(true);
  setTimeout(() => {
    hideAllInteriors();
    where = null;
    setIndoorLook(false);
    city.group.visible = true;
    const door = city.doors.find((d) => d.id === left || d.interior === left) || city.doors.find((d) => d.id === 'guild');
    player.x = door.x; player.z = door.z + 1.2; player.ry = 0;
    placePlayer();
    fade(false);
    audio.door();
  }, 280);
}

function useTarget() {
  if (run) return useDungeon();
  if (where === 'guild') {
    const st = guild.nearest(player.x, player.z);
    if (!st) return;
    if (st.id === 'exit') leaveBuilding();
    else if (st.id === 'register') panels.register();
    else if (st.id === 'examiner') panels.examiner();
    else if (st.id === 'quests') panels.quests();
    else if (st.id === 'party') panels.party();
    else if (st.id === 'vault') panels.vault();
    else if (st.id === 'info') panels.info();
    return;
  }
  if (activeInterior && where && where !== 'dungeon') {
    const st = activeInterior.nearest(player.x, player.z);
    if (!st) return;
    if (st.id === 'exit') leaveBuilding();
    else if (st.id === 'keeper') {
      if (st.stage) panels.stage();
      else if (st.shopId) panels.shop(st.shopId);
    }
    return;
  }
  const door = city.nearestDoor(player.x, player.z);
  if (!door) return;
  const p = door.place;
  if (p.kind === 'gate') { panels.gate(p); return; }
  if (p.kind === 'train' || door.train) { panels.train(); return; }
  if (p.kind === 'landmark') {
    hud.toast(`${p.name}. A quiet place to breathe before the gates.`, 'info');
    return;
  }
  // Enter through the door into an interior
  const interiorId = door.interior || (p.kind === 'guild' ? 'guild' : null);
  if (interiorId) enterBuilding(interiorId);
}

function useDungeon() {
  if (!run) return;
  if (run.waveLoot && !run.waveLoot.claimed && Math.hypot(run.waveLoot.x - player.x, run.waveLoot.z - player.z) < 2.2) {
    const loot = run.claimWaveLoot();
    if (loot) {
      applyLoot(loot);
      hud.toast('Wave clear loot claimed. Boss gate open. Enter alone.', 'good', 4200);
      audio.coin();
      G.changed();
    }
    return;
  }
  // pillars
  for (let i = 0; i < run.pillars.length; i++) {
    const p = run.pillars[i];
    if (!p.on && Math.hypot(p.x - player.x, p.z - player.z) < 1.8) {
      if (run.activatePillar(i)) hud.toast('Seal broken. Stairs unlocked.', 'good', 4000);
      S.statsRun.utility += 1;
      audio.click();
      hud.toast(`Rune pillar ${run.seals.pillars}/${run.seals.needPillars}`, 'good');
      return;
    }
  }
  if (run.stair?.open && Math.hypot(run.stair.x - player.x, run.stair.z - player.z) < 2.2) {
    panels.stair();
    return;
  }
  if (run.chest && !run.chest.opened && Math.hypot(run.chest.x - player.x, run.chest.z - player.z) < 2) {
    panels.chest();
    return;
  }
  if (run.portal && Math.hypot(run.portal.x - player.x, run.portal.z - player.z) < 2.2) {
    endDungeon(true);
  }
  if (run.safe && Math.hypot(run.safe.x - player.x, run.safe.z - player.z) < 2.5) {
    S.hp = Math.min(S.maxHp, S.hp + 25);
    audio.heal();
    hud.toast('Safe room. HP restored a little. Checkpoint set.', 'good');
  }
}

// ----- Dungeon flow -----
function startDungeon(id, difficulty) {
  const def = DUNGEONS[id];
  const access = canEnterDungeon(S, def);
  if (!access.ok) { hud.toast(access.why, 'bad'); return; }
  fade(true);
  hud.toast('Loading dungeon models…', 'info', 1600);
  preloadModels().finally(() => {
    setTimeout(() => {
      city.group.visible = false;
      hideAllInteriors();
      setIndoorLook(true);
      if (run) run.dispose();
      run = createDungeonRun(scene, id, difficulty);
      where = 'dungeon';
      S.statsRun = { damage: 0, kills: 0, healing: 0, mitigation: 0, utility: 0, deaths: 0 };
      player.x = run.spawn.spawnX; player.z = run.spawn.spawnZ; player.ry = Math.PI / 2;
      placePlayer();
      run.updateRoomVisibility?.(player.x, player.z);
      S.waystones[id] = true;
      combat.clearFx();
      fade(false);
      audio.door();
      hud.toast(`${def.name} · ${difficulty.toUpperCase()}`, 'info');
      if (access.warn) hud.toast(access.why, 'bad', 4500);
      hud.sync(S, { cds, atkCd });
    }, 200);
  });
}

function descend() {
  fade(true);
  setTimeout(() => {
    const next = run.floor + 1;
    const spawn = run.buildFloor(next);
    player.x = spawn.spawnX; player.z = spawn.spawnZ;
    placePlayer();
    run.updateRoomVisibility?.(player.x, player.z);
    fade(false);
    audio.door();
    hud.toast(`Floor ${next}`, 'info');
  }, 300);
}

function revealBoss(key) {
  if (!run?.boss) return;
  const id = run.boss.id;
  S.bossCodex[id] = S.bossCodex[id] || {};
  S.bossCodex[id][key] = true;
  // also stamp dungeon gate boss codex for floor-5 reveals
  if (run.def?.boss) {
    S.bossCodex[run.def.boss] = S.bossCodex[run.def.boss] || {};
    S.bossCodex[run.def.boss][key] = true;
  }
  const h = (BOSSES[id]?.hidden || []).find((x) => x.id === key)
    || (BOSSES[run.def?.boss]?.hidden || []).find((x) => x.id === key);
  if (h) hud.toast(`Boss Codex: ${h.text}`, 'info', 5000);
}

function applyFloorBossDefeat(loot) {
  if (!loot || loot.reassembled) return;
  if (loot.floorClear) {
    applyLoot(loot);
    hud.toast(`Floor ${run.floor} boss down. Stairs open.`, 'good', 4500);
    audio.fanfare();
    G.changed();
    return;
  }
  pendingLoot = loot;
  if (run.chest) run.chest.opened = false;
  hud.toast('Boss down! Open the Dungeon Clear Chest.', 'good', 5000);
  audio.fanfare();
}

function openBossChest() {
  if (!run?.chest || run.chest.opened) return;
  run.chest.opened = true;
  let loot = pendingLoot;
  if (!loot && run.boss?.alive) {
    loot = run.defeatBoss({ S, holyFinisher: false, reveal: revealBoss });
    if (loot?.reassembled) {
      hud.toast('Vorren reassembles! Holy damage during the death blow prevents this.', 'bad', 5000);
      revealBoss('reassemble');
      run.chest.opened = false;
      return;
    }
  }
  if (!loot) {
    hud.toast('The chest is empty.', 'bad');
    return;
  }
  pendingLoot = null;
  applyLoot(loot);
  // objectives
  const objs = {};
  const bid = run.boss?.id || run.def?.boss;
  if (bid === 'gloomcap' && S.flags._lastWeakFire) objs.obj_gloomcap_fire = true;
  if (bid === 'grubnok' && run.objectives.survivedCavein) objs.obj_grubnok_cavein = true;
  if (bid === 'vorren' && (S.flags._lastWeakHoly || S.bossCodex?.vorren?.reassemble || S.bossCodex?.vorren?.chains)) {
    objs.obj_vorren_holy = true;
  }
  if (bid === 'cinderjaw' && (run.objectives.howl || run.boss?.howls > 0)) objs.obj_cinderjaw_howl = true;
  if (bid === 'nerisha' && (run.objectives.flood || run.boss?.flood1)) objs.obj_nerisha_flood = true;
  if (bid === 'gravenhelm' && (run.objectives.shieldBreak || run.objectives.shield || run.boss?.shieldUp != null)) {
    objs.obj_gravenhelm_shield = true;
  }
  if (bid === 'skyrend' && (run.objectives.pack || run.boss?.packs > 0 || run.objectives.galeBrace)) {
    objs.obj_skyrend_pack = true;
  }
  if (bid === 'nyxara' && (run.objectives.flip || run.boss?.day)) objs.obj_nyxara_flip = true;
  if (bid === 'vorth' && (run.objectives.meteor || run.boss?.meteors > 0)) objs.obj_vorth_meteor = true;
  if (bid === 'vael' && (run.objectives.mirror || run.objectives.ascend || run.boss?.mirrored)) {
    objs.obj_vael_mirror = true;
  }
  Object.assign(S.flags, objs);
  const cr = contributionRating(S, CLASSES[S.classId].role);
  if (cr >= 15) recordClear(S, run.id, run.difficulty, cr, objs);
  panels.result({
    name: run.def.name,
    diff: run.difficulty,
    gold: loot.gold,
    xp: loot.xp,
    bc: loot.bc,
    cr,
    drops: loot.drops,
  });
  G.changed();
}

function applyLoot(loot) {
  if (!loot) return;
  S.gold += loot.gold || 0;
  S.bc = (S.bc || 0) + (loot.bc || 0);
  const lv = gainXp(S, loot.xp || 0);
  for (const d of loot.drops || []) {
    addItem(S, d.id, d.qty || 1);
    if (d.cross) S.flags['cross_' + d.id] = true;
  }
  if (lv) { audio.level(); hud.toast(`Level up! Now Lv ${S.level}`, 'good'); }
  else audio.coin();
}

function endDungeon(victory) {
  fade(true);
  setTimeout(() => {
    if (run) { run.dispose(); run = null; }
    combat.clearFx();
    where = null;
    setIndoorLook(false);
    city.group.visible = true;
    const gate = city.doors.find((d) => d.place.dungeon === G._gateDungeon) || city.doors.find((d) => d.id === 'f1');
    player.x = gate.x; player.z = gate.z + 3;
    placePlayer();
    fade(false);
    hud.boss(false);
    hud.floor(false);
    if (victory) audio.fanfare();
    else {
      S.gold = Math.max(0, Math.floor(S.gold * 0.95));
      S.hp = Math.max(1, Math.floor(S.maxHp * 0.5));
      hud.toast('Run failed. Returned to the gate. Lost 5% carried gold.', 'bad');
    }
    G.changed();
  }, 350);
}

function applyEnemyDeath(e) {
  const res = run.onEnemyDied(e, { S });
  S.statsRun.kills += 1;
  const loot = res?.loot || res;
  if (loot?.gold != null) {
    S.gold += loot.gold;
    gainXp(S, loot.xp);
    for (const d of loot.drops || []) addItem(S, d.id, d.qty || 1);
  }
  if (res?.opened) hud.toast('Seal broken. Stairs unlocked.', 'good', 4000);
  if (res?.waveLootReady) hud.toast('Wave 3 cleared. Claim the crate, then face the floor boss alone.', 'info', 4500);
}

// ----- Combat helpers -----
function hitTrainingDummy() {
  if (atkCd > 0 || panels.isOpen() || run || where) return false;
  const dummies = city.trainDummies || [];
  let best = null, bestD = 2.4;
  for (const d of dummies) {
    const dist = Math.hypot(d.x - player.x, d.z - player.z);
    if (dist < bestD) { best = d; bestD = dist; }
  }
  if (!best) return false;
  atkCd = 0.4;
  best.hp = Math.max(0, best.hp - 12);
  animMode = 'attack'; animT = 0.3;
  audio.swing();
  audio.hit();
  hud.float(innerWidth / 2, innerHeight / 2 - 30, '12', '');
  if (best.hp <= 0) {
    best.hp = best.maxHp;
    hud.toast('Dummy reset. Nice form. No loot here, only practice.', 'good', 2800);
  }
  return true;
}

function tryAttack(skillIndex = -1) {
  if (panels.isOpen()) return;
  if (!run) {
    if (skillIndex < 0) hitTrainingDummy();
    return;
  }
  const order = S.skillOrder || [0, 1, 2];
  const realIndex = skillIndex >= 0 ? (order[skillIndex] ?? skillIndex) : -1;
  if (realIndex >= 0) {
    const sk = CLASSES[S.classId].skills[realIndex];
    if (!sk) return;
    if (cds[skillIndex] > 0) return;
  }
  if (skillIndex < 0 && atkCd > 0) return;
  const res = combat.playerAttack(S, player, run, realIndex);
  if (!res.ok) { hud.toast(res.why, 'bad'); audio.warn(); return; }
  animMode = res.mode || 'attack';
  animT = 0.35;
  if (skillIndex >= 0) {
    const sk = CLASSES[S.classId].skills[realIndex];
    cds[skillIndex] = sk?.cd || 2;
    if (res.scout) {
      const hid = (run.boss ? BOSSES[run.boss.id] : BOSSES[run.def.boss])?.hidden?.[0];
      if (hid) {
        S.bossCodex[run.def.boss] = S.bossCodex[run.def.boss] || {};
        hud.toast(`Scout: ${hid.text.slice(0, 48)}…`, 'info', 5000);
      } else {
        hud.toast(res.tip || 'Scout — damage buffed', 'good', 2800);
      }
    } else if (res.tip) {
      hud.toast(res.tip, res.heal || res.buff || res.taunt ? 'good' : 'info', 2400);
    }
    audio.spell();
  } else {
    atkCd = 0.45;
    audio.swing();
  }
  for (const h of res.hits || []) {
    const rect = canvas.getBoundingClientRect();
    // approximate screen float at center-ish
    hud.float(innerWidth / 2 + (h.e.x - player.x) * 18, innerHeight / 2 - 40, (h.crit ? 'CRIT ' : '') + h.dmg, h.crit ? 'crit' : '');
    audio.hit();
    if (h.weakHit && h.type === 'fire') S.flags._lastWeakFire = true;
    if (h.type === 'holy') S.flags._lastWeakHoly = true;
    if (h.e.hp <= 0) {
      if (h.e === run.boss) {
        if (!run.chest) {
          const loot = run.defeatBoss({ S, holyFinisher: h.type === 'holy', reveal: revealBoss });
          if (loot?.reassembled) hud.toast('Vorren rises again!', 'bad');
          else applyFloorBossDefeat(loot);
        }
      } else {
        applyEnemyDeath(h.e);
      }
    }
  }
  hud.sync(S, { cds, atkCd });
}

function onHitPlayer(dmg) {
  if (iFrames > 0) { S.hp += dmg; return; } // undo
  iFrames = 0.4;
  audio.hurt();
  hud.float(innerWidth / 2, innerHeight / 2, `-${dmg}`, '');
  if (S.hp <= 0) {
    S.statsRun.deaths += 1;
    S.hp = 0;
    endDungeon(false);
  }
}

// ----- Pause -----
document.querySelectorAll('[data-pause]').forEach((b) => {
  b.onclick = () => {
    const a = b.dataset.pause;
    if (a === 'resume') { $('pause').classList.add('hidden'); mode = 'play'; }
    if (a === 'save') { save(S); hud.toast('Progress saved.', 'good'); }
    if (a === 'title') {
      save(S); $('pause').classList.add('hidden');
      if (run) { run.dispose(); run = null; }
      showTitle();
    }
  };
});

// ----- Frame loop -----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (mode === 'title' || mode === 'creator') {
    camYawT += dt * 0.15;
    camPos.set(Math.sin(camYawT) * 28, 18, 34);
    camLook.set(10, 2, 0);
    camera.position.lerp(camPos, 0.04);
    camera.lookAt(camLook);
    renderer.render(scene, camera);
    if (mode === 'creator' && creatorPrev?.person) {
      creatorPrev.t += dt;
      creatorPrev.person.group.rotation.y = Math.PI * 0.12 + Math.sin(creatorPrev.t * 0.7) * 0.35;
      animatePerson(creatorPrev.person, 'idle', creatorPrev.t, dt, 0);
      creatorPrev.renderer.render(creatorPrev.scene, creatorPrev.camera);
    }
    requestAnimationFrame(frame);
    return;
  }

  if (mode === 'play' && S && player) {
    for (const a of input.take()) {
      if (a === 'pause') { mode = 'pause'; $('pause').classList.remove('hidden'); continue; }
      if (panels.isOpen()) {
        if (a === 'use' || a === 'pause') panels.close();
        continue;
      }
      if (a === 'use') useTarget();
      if (a === 'inv') panels.inventory();
      if (a === 'skills') panels.skills();
      if (a === 'map') panels.map();
      if (a === 'card') panels.card();
      if (a === 'progress') panels.progress();
      if (a === 'attack') tryAttack(-1);
      if (a === 'dodge') {
        if (S.sta >= 12) {
          S.sta -= 12;
          player.x += Math.sin(player.ry) * 2.4;
          player.z += Math.cos(player.ry) * 2.4;
          iFrames = 0.35;
          animMode = 'run'; animT = 0.3;
        }
      }
      if (a.startsWith('skill')) tryAttack(+a.slice(5));
    }

    if (!panels.isOpen() && mode === 'play') {
      const ax = input.axis();
      camYawT += input.takeDrag();
      camYaw += (camYawT - camYaw) * (1 - Math.exp(-dt * 14));

      if (player.rooted > 0) player.rooted -= dt;
      if (player.stunned > 0) player.stunned -= dt;
      const locked = (player.rooted > 0) || (player.stunned > 0);
      const moving = !locked && Math.hypot(ax.x, ax.y) > 0.05;
      let hungMode = 'idle';
      if (moving) {
        const sprint = ax.sprint && S.sta > 0;
        let spd = (sprint ? GAME.sprintSpeed : GAME.walkSpeed) * (effectiveStats(S).spd / 8);
        if (player.rooted > -0.01 && player.rooted <= 0) { /* ok */ }
        if (sprint) S.sta = Math.max(0, S.sta - dt * 18);
        const mx = Math.sin(camYaw) * ax.y + Math.cos(camYaw) * ax.x;
        const mz = Math.cos(camYaw) * ax.y - Math.sin(camYaw) * ax.x;
        player.x += mx * spd * dt;
        player.z += mz * spd * dt;
        player.ry = Math.atan2(mx, mz);
        animMode = sprint ? 'run' : 'walk';
        hungMode = sprint ? 'sprint' : 'walk';
      } else if (animT <= 0) animMode = S.buffs.guard ? 'guard' : 'idle';

      // bounds + building / dungeon collision
      if (!run) {
        player.x = clamp(player.x, -70, 340);
        player.z = clamp(player.z, -55, 55);
        if (!where) collide(player, city.colliders, 0.38);
        else if (where === 'guild') collide(player, guild.colliders, 0.35);
        else if (activeInterior?.colliders) collide(player, activeInterior.colliders, 0.35);
      } else {
        hungMode = 'combat';
        collide(player, run.colliders, 0.4);
        run.updateRoomVisibility?.(player.x, player.z);
      }

      // regen
      const st = effectiveStats(S);
      if (!moving) S.sta = Math.min(S.maxSta, S.sta + dt * 12 * (st.staRegen || 1));
      S.mana = Math.min(S.maxMana, S.mana + dt * 6);
      drainHunger(S, dt, hungMode);
      if (iFrames > 0) iFrames -= dt;
      for (let i = 0; i < cds.length; i++) if (cds[i] > 0) cds[i] -= dt;
      if (atkCd > 0) atkCd -= dt;
      if (animT > 0) animT -= dt;

      combat.updateBuffs(S, dt);
      if (run) {
        run.tickWaves?.(dt);
        combat.updateEnemies(dt, S, player, run, onHitPlayer);
        combat.updateBoss(dt, S, player, run, onHitPlayer, revealBoss);
        combat.updateHazards(dt, S, player, run, onHitPlayer);
        combat.updateTraps?.(dt, S, player, run, onHitPlayer);
        combat.updateFx(dt);
        // global timed hazard pulse
        run.hazardT += dt;
        if (run.def.hazard && run.hazardT > run.def.hazard.every) {
          run.hazardT = 0;
          if (run.floor !== 3 || !run.safe || Math.hypot(player.x - run.safe.x, player.z - run.safe.z) > 4) {
            S.hp = Math.max(1, S.hp - run.def.hazard.dmg * run.diff.dmg);
            if (run.def.hazard.type === 'poison') S.buffs.poison = { dmg: 2, t: 5 };
            if (run.def.hazard.type === 'dark') S.buffs.poison = { dmg: 3, t: 4 };
            hud.toast(run.def.hazard.name + ' · move or cleanse', 'bad', 1800);
          }
        }
        // kill check for enemies already handled in attack; also dots
        for (const e of run.enemies) {
          if (e.alive && e.hp <= 0) applyEnemyDeath(e);
        }
      } else if (!where) {
        city.update(dt, player, animatePerson);
      }

      placePlayer();
      animatePerson(player.m, animMode, player.t += dt, dt, moving ? 1 : 0);

      // persist pos
      S.x = player.x; S.z = player.z; S.ry = player.ry; S.where = where === 'dungeon' ? null : where;

      // camera behind player (closer indoors / dungeon)
      const dist = indoorLook ? (run?.mode === 'waves' ? 6.4 : 5.6) : GAME.camDist;
      const pitch = indoorLook ? (run?.mode === 'waves' ? 0.42 : 0.48) : camPitch;
      const hd = dist * Math.cos(pitch);
      const vd = dist * Math.sin(pitch);
      camPos.set(player.x + Math.sin(camYaw) * hd, player.y + 1.35 + vd, player.z + Math.cos(camYaw) * hd);
      camLook.set(player.x, player.y + 1.15, player.z);
      camera.position.lerp(camPos, 1 - Math.exp(-dt * 10));
      camera.lookAt(camLook);

      // HUD prompts
      updatePrompt();
      updateGuide();
      if (run) {
        let seal;
        if (run.mode === 'waves') {
          if (run.wavePhase === 'boss' && run.boss?.alive) {
            seal = run.boss.fullPower ? 'Final boss · full power' : `Floor boss · ${run.boss.def.name}`;
          } else if (run.wavePhase === 'loot') seal = 'Claim wave crate · then boss gate';
          else if (run.wavePhase === 'stairs') seal = 'Staircase open';
          else if (run.wavePhase === 'pause') seal = `Wave ${run.pendingWave}/3 incoming`;
          else if (run.wavePhase === 'done') seal = 'Open the clear chest';
          else seal = `Wave ${run.wave}/3 · left ${run.enemies.filter((e) => e.alive).length}`;
        } else {
          seal = run.seals.open ? 'Staircase open' : (
            run.def.seal.kind === 'clear' ? `Clear ${Math.floor(run.seals.killed / Math.max(1, run.seals.total) * 100)}%` :
            run.def.seal.kind === 'guardian' ? (run.seals.guardianDown ? 'Guardian down' : 'Defeat the Floor Guardian') :
            `Pillars ${run.seals.pillars}/${run.seals.needPillars}`
          );
        }
        hud.floor(true, run.def.name, run.floor, seal);
        hud.loc(run.mode === 'waves'
          ? `${run.def.name} · Floor ${run.floor}/5 · Wave ${Math.min(run.wave || 1, 3)}/3`
          : `${run.def.name} · Floor ${run.floor}`);
        if (run.boss?.alive) hud.boss(true, run.boss.def.name, run.boss.hp / run.boss.maxHp);
        else hud.boss(false);
      } else {
        hud.floor(false); hud.boss(false);
        const locName = where === 'guild' ? 'Guild Center'
          : where === 'market' ? 'Market Square'
          : where === 'hearth' ? 'Restaurant Row'
          : where === 'smith' || where === 'smithy' ? 'Smithy'
          : where === 'healer' ? "Healer's Court"
          : where === 'stage' ? 'The Stage'
          : where === 'train' ? 'Training Ground'
          : GAME.city;
        hud.loc(locName);
      }
      hud.sync(S, { cds, atkCd });
      updateBubbles();
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function updatePrompt() {
  if (panels.isOpen()) { hud.prompt(null); return; }
  if (run) {
    for (let i = 0; i < run.pillars.length; i++) {
      const p = run.pillars[i];
      if (!p.on && Math.hypot(p.x - player.x, p.z - player.z) < 1.8) { hud.prompt('Activate rune pillar'); return; }
    }
    if (run.waveLoot && !run.waveLoot.claimed && Math.hypot(run.waveLoot.x - player.x, run.waveLoot.z - player.z) < 2.2) {
      hud.prompt('Claim wave loot', 'Then face the floor boss alone');
      return;
    }
    if (run.stair?.open && Math.hypot(run.stair.x - player.x, run.stair.z - player.z) < 2.2) { hud.prompt('Descend staircase', 'One way. No return.'); return; }
    if (run.chest && !run.chest.opened && Math.hypot(run.chest.x - player.x, run.chest.z - player.z) < 2) {
      hud.prompt(run.chest.main ? 'Open Dungeon Clear Chest' : 'Open Reward Chest');
      return;
    }
    if (run.portal && Math.hypot(run.portal.x - player.x, run.portal.z - player.z) < 2.2) { hud.prompt('Exit portal', 'Return to Aurelmere'); return; }
    if (run.safe && Math.hypot(run.safe.x - player.x, run.safe.z - player.z) < 2.5) { hud.prompt('Rest in safe room'); return; }
    hud.prompt(null);
    return;
  }
  if (where === 'guild') {
    const st = guild.nearest(player.x, player.z);
    if (st) { hud.prompt(st.label); return; }
  } else if (activeInterior && where) {
    const st = activeInterior.nearest(player.x, player.z);
    if (st) { hud.prompt(st.label); return; }
  } else {
    const door = city.nearestDoor(player.x, player.z);
    if (door) {
      const p = door.place;
      const action = p.kind === 'gate' ? `Open ${p.name}`
        : p.kind === 'train' ? `Practice at ${p.name}`
        : p.kind === 'landmark' ? `Look around ${p.name}`
        : `Enter ${p.name}`;
      hud.prompt(action, 'Press E');
      return;
    }
  }
  hud.prompt(null);
}

function updateGuide() {
  const g = currentGoal(S);
  const place = PLACES.find((p) => p.id === g.near);
  if (!place || run || where) { hud.goalNav(false); return; }
  const dx = place.x - player.x, dz = place.z - player.z;
  const dist = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz) - camYaw;
  hud.goalNav(true, dist, ang);
}

function updateBubbles() {
  const root = document.getElementById('labels');
  root.innerHTML = '';
  if (where || run) return;
  for (const n of city.npcs) {
    if (!n.bubbleUntil || performance.now() > n.bubbleUntil) continue;
    const v = n.m.group.position.clone(); v.y += 2.2;
    v.project(camera);
    if (v.z > 1) continue;
    const el = document.createElement('div');
    el.className = 'bubble';
    el.textContent = n.lineNow || n.line;
    el.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
    root.appendChild(el);
  }
}

window.addEventListener('resize', () => {
  if (mode === 'creator') resizeCreatorPreview();
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

showTitle();
requestAnimationFrame(frame);
