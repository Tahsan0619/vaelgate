import * as THREE from 'three';
import { createEnemyModel, playModelClip } from './modelLoader.js';
import { buildTexturedHuman, animateHumanBones } from './humanBuilder.js';

const mats = new Map();
const mat = (color) => {
  if (!mats.has(color)) mats.set(color, new THREE.MeshLambertMaterial({ color }));
  return mats.get(color);
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const add = (p, g, m, x, y, z) => {
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  p.add(mesh);
  return mesh;
};

export function buildPerson(look = {}) {
  // Prefer Quaternius modular male/female (editable Skin/Hair/cloth tints).
  // Falls back to procedural blocks if GLBs are not loaded yet.
  if (!look.forceProcedural) {
    const textured = buildTexturedHuman(look);
    if (textured) return textured;
  }

  const group = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 0.95;
  group.add(body);

  const skin = mat(look.skin || '#e8b98a');
  const shirt = mat(look.shirt || '#4c6ef5');
  const pants = mat(look.pants || '#343a40');
  const hairM = mat(look.hair || '#1a1a1a');
  const dark = mat('#1a1a1a');
  const boot = mat('#2b2118');
  const lithe = look.body === 'f';
  const tw = lithe ? 0.4 : 0.48;
  const td = lithe ? 0.24 : 0.28;
  // Stronger female silhouette on procedural fallback
  const chestW = lithe ? tw + 0.06 : tw;
  const hipW = lithe ? tw + 0.08 : tw * 0.95;

  const legs = [];
  for (const side of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (lithe ? 0.1 : 0.12), 0, 0);
    body.add(pivot);
    add(pivot, box(lithe ? 0.14 : 0.17, 0.72, 0.18), pants, 0, -0.36, 0);
    add(pivot, box(lithe ? 0.15 : 0.18, 0.12, 0.28), boot, 0, -0.78, 0.04);
    legs.push(pivot);
  }

  const torso = new THREE.Group();
  body.add(torso);
  // hips
  add(torso, box(hipW, 0.16, td * 0.95), pants, 0, 0.02, 0);
  // torso / chest
  add(torso, box(chestW, 0.52, td), shirt, 0, 0.34, 0);
  if (lithe) add(torso, box(chestW + 0.04, 0.16, td + 0.06), shirt, 0, 0.42, 0.02);
  // shoulders
  add(torso, box(tw + (lithe ? 0.1 : 0.14), 0.16, td + 0.02), shirt, 0, 0.56, 0);
  if (look.vest) add(torso, box(tw + 0.04, 0.42, td + 0.04), mat(look.vest), 0, 0.36, 0.01);
  if (look.hood) add(torso, box(0.36, 0.12, 0.16), mat(look.hood), 0, 0.62, -0.1);
  // belt + buckle
  add(torso, box(tw + 0.04, 0.07, td + 0.04), mat('#212529'), 0, 0.1, 0);
  add(torso, box(0.1, 0.08, 0.06), mat('#c9922a'), 0, 0.1, td / 2 + 0.02);

  const arms = [];
  for (const side of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * (tw / 2 + 0.08), 0.52, 0);
    torso.add(pivot);
    add(pivot, box(0.12, 0.48, 0.14), shirt, 0, -0.2, 0);
    add(pivot, box(0.11, 0.11, 0.12), skin, 0, -0.46, 0);
    arms.push(pivot);
  }

  const head = new THREE.Group();
  head.position.y = 0.68;
  torso.add(head);
  add(head, box(0.28, 0.3, 0.28), skin, 0, 0.16, 0);
  add(head, box(0.12, 0.08, 0.12), skin, 0, -0.01, 0);
  // nose
  add(head, box(0.05, 0.06, 0.05), skin, 0, 0.14, 0.15);
  // eyes
  add(head, box(0.05, 0.04, 0.02), dark, 0.07, 0.18, 0.145);
  add(head, box(0.05, 0.04, 0.02), dark, -0.07, 0.18, 0.145);
  add(head, box(0.02, 0.02, 0.01), mat('#f8f9fa'), 0.08, 0.19, 0.15);
  add(head, box(0.02, 0.02, 0.01), mat('#f8f9fa'), -0.06, 0.19, 0.15);
  // brows
  add(head, box(0.08, 0.02, 0.02), hairM, 0.07, 0.24, 0.14);
  add(head, box(0.08, 0.02, 0.02), hairM, -0.07, 0.24, 0.14);

  const style = look.hairStyle || 'short';
  if (style !== 'bald') {
    add(head, box(0.3, 0.12, 0.3), hairM, 0, 0.34, -0.01);
    if (style === 'long' || style === 'ponytail') add(head, box(0.26, 0.38, 0.1), hairM, 0, 0.02, -0.17);
    if (style === 'bun' || style === 'ponytail') add(head, box(0.15, 0.14, 0.15), hairM, 0, 0.44, -0.1);
    if (style === 'spiky') {
      add(head, box(0.07, 0.2, 0.07), hairM, 0.08, 0.44, 0);
      add(head, box(0.07, 0.24, 0.07), hairM, -0.05, 0.46, 0);
      add(head, box(0.06, 0.16, 0.06), hairM, 0.02, 0.42, 0.05);
    }
    if (style === 'messy') add(head, box(0.32, 0.1, 0.26), hairM, 0.02, 0.3, 0.02);
    if (style === 'fringe') add(head, box(0.26, 0.07, 0.1), hairM, 0, 0.27, 0.14);
  }

  const weapon = new THREE.Group();
  weapon.position.set(0.34, 0.06, 0.06);
  torso.add(weapon);
  const w = look.weapon;
  if (w === 'sword' || w === 'daggers') {
    add(weapon, box(0.05, 0.72, 0.08), mat('#ced4da'), 0, -0.12, 0);
    add(weapon, box(0.16, 0.05, 0.11), mat('#c9922a'), 0, 0.2, 0);
  } else if (w === 'staff') {
    add(weapon, box(0.05, 1.15, 0.05), mat('#8b5a2b'), 0, -0.15, 0);
    add(weapon, new THREE.SphereGeometry(0.12, 8, 6), mat('#7950f2'), 0, 0.5, 0);
  } else if (w === 'bow') {
    add(weapon, box(0.04, 0.75, 0.04), mat('#8b5a2b'), 0, 0, 0);
    add(weapon, box(0.03, 0.55, 0.03), mat('#dee2e6'), 0.09, 0, 0);
  } else if (w === 'shield') {
    add(weapon, box(0.07, 0.55, 0.4), mat('#adb5bd'), -0.68, 0.12, 0);
    add(weapon, box(0.05, 0.7, 0.08), mat('#ced4da'), 0, -0.1, 0);
  } else if (w === 'mace') {
    add(weapon, box(0.05, 0.66, 0.05), mat('#868e96'), 0, -0.1, 0);
    add(weapon, box(0.18, 0.18, 0.18), mat('#c9922a'), 0, 0.28, 0);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.38, 16),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  return { group, body, torso, head, legs, arms, weapon, shadow, look };
}

export function buildEnemyMesh(def) {
  // Prefer CC0 Quaternius GLBs when preloaded
  const loaded = createEnemyModel(def.id || def.modelKey, def);
  if (loaded?.group) {
    loaded.group.userData.mixer = loaded.mixer;
    return loaded.group;
  }

  const g = new THREE.Group();
  const baseCol = def.color || '#82c91e';
  const col = new THREE.MeshLambertMaterial({
    color: baseCol,
    emissive: baseCol,
    emissiveIntensity: 0.35,
  });
  const s = def.scale || 1;
  if (def.name?.includes('Slime')) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55 * s, 12, 10), col);
    body.position.y = 0.55 * s;
    body.scale.y = 0.9;
    body.castShadow = true;
    g.add(body);
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * s, 6, 5),
      new THREE.MeshBasicMaterial({ color: '#111' }),
    );
    eye.position.set(0.18 * s, 0.7 * s, 0.42 * s);
    g.add(eye);
    const eye2 = eye.clone();
    eye2.position.x = -0.18 * s;
    g.add(eye2);
  } else if (def.name?.includes('Bat') || def.name?.includes('Ghost')) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.38 * s, 8, 6), col);
    body.position.y = 1.25;
    body.castShadow = true;
    g.add(body);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(box(0.7 * s, 0.1, 0.35 * s), col);
      wing.position.set(side * 0.45, 1.25, 0);
      wing.castShadow = true;
      g.add(wing);
    }
  } else if (def.name?.includes('Rat') || def.name?.includes('Crawler')) {
    const body = new THREE.Mesh(box(0.95 * s, 0.45 * s, 0.55 * s), col);
    body.position.y = 0.4 * s;
    body.castShadow = true;
    g.add(body);
    const head = new THREE.Mesh(box(0.38 * s, 0.32 * s, 0.38 * s), col);
    head.position.set(0.55 * s, 0.45 * s, 0);
    head.castShadow = true;
    g.add(head);
  } else {
    const p = buildPerson({
      skin: '#e9ecef',
      shirt: def.color || '#37b24d',
      pants: '#343a40',
      hair: '#1a1a1a',
      hairStyle: 'messy',
      weapon: def.ranged ? 'bow' : 'sword',
    });
    p.group.scale.setScalar(s);
    return p.group;
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.4 * s, 12),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);
  return g;
}

/** Replace a procedural person with a textured GLB once models are loaded. */
export function upgradePerson(p) {
  if (!p?.group || p.glb) return p;
  const next = buildTexturedHuman(p.look || {});
  if (!next?.group) return p;
  const g = p.group;
  const parent = g.parent;
  next.group.position.copy(g.position);
  next.group.rotation.copy(g.rotation);
  next.group.scale.copy(g.scale);
  if (parent) {
    parent.add(next.group);
    parent.remove(g);
  }
  return next;
}

export function animatePerson(p, mode, t, dt, move = 0) {
  if (p?.glb) {
    if (p.useClips && p.mixer) {
      const names = mode === 'run' ? ['Run', 'Walking', 'Idle']
        : mode === 'walk' ? ['Walking', 'Run', 'Idle']
        : mode === 'dead' ? ['Death', 'Idle']
        : ['Idle', 'Idle_swordRight', 'Walking'];
      playModelClip(p, names, 0.18);
      p.mixer.update(dt);
    } else {
      animateHumanBones(p, mode, t, move);
      if (p.mixer) p.mixer.update(dt);
    }
    return;
  }
  if (!p?.legs) return;
  const swing = mode === 'walk' || mode === 'run' ? Math.sin(t * (mode === 'run' ? 12 : 9)) * (0.5 + move * 0.2) : 0;
  p.legs[0].rotation.x = swing;
  p.legs[1].rotation.x = -swing;
  p.arms[0].rotation.x = -swing * 0.75;
  p.arms[1].rotation.x = swing * 0.75;
  if (mode === 'attack') p.arms[1].rotation.x = -1.25 + Math.sin(t * 20) * 0.15;
  if (mode === 'cast') { p.arms[0].rotation.x = -1.35; p.arms[1].rotation.x = -1.05; }
  if (mode === 'guard') { p.arms[0].rotation.x = -0.85; p.arms[1].rotation.x = -0.85; }
  if (mode === 'dead') {
    p.body.rotation.x = -Math.PI / 2;
    p.body.position.y = 0.28;
  } else {
    p.body.rotation.x = 0;
    p.body.position.y = 0.95;
  }
}
