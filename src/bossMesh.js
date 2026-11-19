import * as THREE from 'three';
import { createBossModel } from './modelLoader.js';

const mats = new Map();
const mat = (color, opts = {}) => {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) {
    mats.set(key, new THREE.MeshLambertMaterial({
      color,
      emissive: opts.emissive || '#000000',
      emissiveIntensity: opts.emissiveIntensity || 0,
    }));
  }
  return mats.get(key);
};

function add(p, g, m, x, y, z, cast = true) {
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  p.add(mesh);
  return mesh;
}

function ring(p, r, color) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(r * 0.85, r, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  p.add(m);
  return m;
}

/** Prefer CC0 Quaternius GLB; fall back to block silhouette. */
export function buildBossMesh(bossId, accent = '#2f9e44') {
  const loaded = createBossModel(bossId);
  if (loaded?.group) {
    const wrap = new THREE.Group();
    wrap.add(loaded.group);
    ring(wrap, bossId === 'gloomcap' || bossId === 'grubnok' ? 2.0 : 1.65, accent);
    wrap.userData.mixer = loaded.mixer;
    wrap.userData.animations = loaded.animations;
    wrap.userData.modelKey = bossId;
    wrap.userData.targetH = loaded.group.userData.targetH || 2.2;
    return wrap;
  }

  const g = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.1, 20),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  g.add(shadow);
  ring(g, 1.35, accent);

  if (bossId === 'gloomcap' || bossId === 'sporebrute') {
    const stem = bossId === 'gloomcap' ? '#d8f5a2' : '#a9e34b';
    const cap = bossId === 'gloomcap' ? '#2f9e44' : '#82c91e';
    add(g, new THREE.CylinderGeometry(0.55, 0.75, 1.6, 10), mat(stem), 0, 0.9, 0);
    add(g, new THREE.SphereGeometry(1.35, 12, 10), mat(cap, { emissive: cap, emissiveIntensity: 0.25 }), 0, 2.15, 0);
  } else {
    add(g, new THREE.BoxGeometry(1.0, 1.8, 0.7), mat(accent), 0, 1.2, 0);
    add(g, new THREE.BoxGeometry(0.55, 0.55, 0.55), mat('#e8b98a'), 0, 2.3, 0);
  }
  g.scale.setScalar(bossId === 'gloomcap' || bossId === 'grubnok' ? 1.35 : 1.15);
  return g;
}
