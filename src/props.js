import * as THREE from 'three';
import { signTex, bannerTex, woodTex } from './textures.js';

const mats = new Map();
export const M = (c) => {
  if (!mats.has(c)) mats.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return mats.get(c);
};
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

export function add(parent, geo, colorOrMat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(geo, typeof colorOrMat === 'string' ? M(colorOrMat) : colorOrMat);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  parent.add(m);
  return m;
}

export function makeTree(parent, x, z, scale = 1, colliders) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  add(g, box(0.32 * scale, 1.6 * scale, 0.32 * scale), '#6b3f24', 0, 0.8 * scale, 0);
  add(g, new THREE.SphereGeometry(1.15 * scale, 8, 6), '#2f9e44', 0, 2.15 * scale, 0);
  add(g, new THREE.SphereGeometry(0.75 * scale, 7, 5), '#37b24d', 0.45 * scale, 2.0 * scale, 0.2 * scale);
  add(g, new THREE.SphereGeometry(0.65 * scale, 7, 5), '#2b8a3e', -0.4 * scale, 1.9 * scale, -0.15 * scale);
  parent.add(g);
  if (colliders) colliders.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45 });
  return g;
}

export function makeLamp(parent, x, z, colliders) {
  add(parent, box(0.2, 2.7, 0.2), '#343a40', x, 1.35, z);
  add(parent, box(0.55, 0.12, 0.55), '#212529', x, 2.72, z);
  const bulb = add(parent, new THREE.SphereGeometry(0.22, 8, 6), '#fff3bf', x, 2.55, z, false);
  bulb.material = new THREE.MeshLambertMaterial({ color: '#fff3bf', emissive: '#fab005', emissiveIntensity: 0.65 });
  if (colliders) colliders.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25 });
}

export function makeCrate(parent, x, z, colliders, s = 0.7) {
  const wood = new THREE.MeshLambertMaterial({ map: woodTex(), color: '#c4a882' });
  add(parent, box(s, s, s), wood, x, s / 2, z);
  if (colliders) colliders.push({ x0: x - s / 2, x1: x + s / 2, z0: z - s / 2, z1: z + s / 2 });
}

export function makeBarrel(parent, x, z, colliders) {
  add(parent, new THREE.CylinderGeometry(0.38, 0.42, 0.9, 10), '#8b5a2b', x, 0.45, z);
  add(parent, new THREE.TorusGeometry(0.4, 0.04, 6, 12), '#adb5bd', x, 0.25, z).rotation.x = Math.PI / 2;
  add(parent, new THREE.TorusGeometry(0.4, 0.04, 6, 12), '#adb5bd', x, 0.65, z).rotation.x = Math.PI / 2;
  if (colliders) colliders.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45 });
}

export function makeBench(parent, x, z, yaw, colliders) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw || 0;
  add(g, box(1.6, 0.12, 0.45), '#8b5a2b', 0, 0.42, 0);
  add(g, box(1.6, 0.45, 0.1), '#6b3f24', 0, 0.7, -0.2);
  add(g, box(0.12, 0.42, 0.4), '#6b3f24', -0.7, 0.21, 0);
  add(g, box(0.12, 0.42, 0.4), '#6b3f24', 0.7, 0.21, 0);
  parent.add(g);
  if (colliders) colliders.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.4, z1: z + 0.4 });
}

export function makeStall(parent, x, z, cloth, colliders) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  add(g, box(2.2, 0.9, 1.3), '#fff4e6', 0, 0.5, 0);
  add(g, box(2.4, 0.08, 1.5), cloth || '#c92a2a', 0, 1.55, 0);
  add(g, box(0.1, 1.5, 0.1), '#6b3f24', -1.05, 0.75, -0.6);
  add(g, box(0.1, 1.5, 0.1), '#6b3f24', 1.05, 0.75, -0.6);
  add(g, box(0.1, 1.5, 0.1), '#6b3f24', -1.05, 0.75, 0.6);
  add(g, box(0.1, 1.5, 0.1), '#6b3f24', 1.05, 0.75, 0.6);
  // goods
  for (let i = 0; i < 4; i++) {
    add(g, box(0.28, 0.22, 0.28), ['#e67700', '#2f9e44', '#1c7ed6', '#fab005'][i], -0.7 + i * 0.45, 1.05, 0.1);
  }
  parent.add(g);
  if (colliders) colliders.push({ x0: x - 1.2, x1: x + 1.2, z0: z - 0.8, z1: z + 0.8 });
}

export function makeCart(parent, x, z, yaw, colliders) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = yaw || 0;
  add(g, box(1.8, 0.55, 1.0), '#8b5a2b', 0, 0.55, 0);
  add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10), '#343a40', -0.7, 0.28, 0.55).rotation.z = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10), '#343a40', 0.7, 0.28, 0.55).rotation.z = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10), '#343a40', -0.7, 0.28, -0.55).rotation.z = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10), '#343a40', 0.7, 0.28, -0.55).rotation.z = Math.PI / 2;
  parent.add(g);
  if (colliders) colliders.push({ x0: x - 1.0, x1: x + 1.0, z0: z - 0.7, z1: z + 0.7 });
}

export function makeFence(parent, x0, z0, x1, z1, colliders) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const n = Math.max(2, Math.floor(len / 1.4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + dx * t, z = z0 + dz * t;
    add(parent, box(0.12, 1.0, 0.12), '#6b3f24', x, 0.5, z);
  }
  const rail = add(parent, box(len, 0.08, 0.08), '#8b5a2b', (x0 + x1) / 2, 0.75, (z0 + z1) / 2);
  rail.rotation.y = Math.atan2(dx, dz);
  if (colliders) {
    const pad = 0.2;
    colliders.push({
      x0: Math.min(x0, x1) - pad, x1: Math.max(x0, x1) + pad,
      z0: Math.min(z0, z1) - pad, z1: Math.max(z0, z1) + pad,
    });
  }
}

export function makeFlowerbed(parent, x, z, w = 2.2, d = 1.0) {
  add(parent, box(w, 0.25, d), '#6b3f24', x, 0.12, z);
  add(parent, box(w - 0.2, 0.12, d - 0.2), '#5c4033', x, 0.28, z);
  const colors = ['#c92a2a', '#e67700', '#fab005', '#be4bdb', '#f783ac'];
  for (let i = 0; i < 8; i++) {
    const fx = x + (Math.random() - 0.5) * (w - 0.4);
    const fz = z + (Math.random() - 0.5) * (d - 0.4);
    add(parent, new THREE.SphereGeometry(0.12, 6, 5), colors[i % colors.length], fx, 0.42, fz, false);
    add(parent, box(0.04, 0.25, 0.04), '#2f9e44', fx, 0.28, fz, false);
  }
}

export function makeFountain(parent, x, z, colliders) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  add(g, new THREE.CylinderGeometry(2.4, 2.6, 0.4, 16), '#adb5bd', 0, 0.2, 0);
  add(g, new THREE.CylinderGeometry(1.8, 1.9, 0.5, 16), '#868e96', 0, 0.55, 0);
  const water = add(g, new THREE.CylinderGeometry(1.55, 1.55, 0.15, 16), '#4dabf7', 0, 0.72, 0, false);
  water.material = new THREE.MeshLambertMaterial({ color: '#4dabf7', transparent: true, opacity: 0.75 });
  add(g, new THREE.CylinderGeometry(0.25, 0.35, 1.4, 8), '#ced4da', 0, 1.3, 0);
  const spray = add(g, new THREE.SphereGeometry(0.35, 8, 6), '#a5d8ff', 0, 2.15, 0, false);
  spray.material = new THREE.MeshLambertMaterial({ color: '#a5d8ff', transparent: true, opacity: 0.55 });
  parent.add(g);
  if (colliders) colliders.push({ x0: x - 2.5, x1: x + 2.5, z0: z - 2.5, z1: z + 2.5 });
}

export function makeNoticeBoard(parent, x, z, title, colliders) {
  add(parent, box(0.15, 2.0, 0.15), '#6b3f24', x - 0.9, 1.0, z);
  add(parent, box(0.15, 2.0, 0.15), '#6b3f24', x + 0.9, 1.0, z);
  add(parent, box(2.0, 1.3, 0.1), '#fff4e6', x, 1.35, z);
  const tex = signTex(title, '#fff4e6', '#1b263b', 256, 128);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(x, 1.4, z + 0.08);
  parent.add(sign);
  if (colliders) colliders.push({ x0: x - 1.1, x1: x + 1.1, z0: z - 0.3, z1: z + 0.3 });
}

export function makeSignpost(parent, x, z, text) {
  add(parent, box(0.18, 2.1, 0.18), '#6b3f24', x, 1.05, z);
  const tex = signTex(text, '#fff4e6', '#1b263b');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.5), new THREE.MeshBasicMaterial({ map: tex }));
  sign.position.set(x, 2.05, z);
  parent.add(sign);
}

export function makeBannerPole(parent, x, z, bg, fg, accent, label, colliders) {
  add(parent, box(0.14, 3.4, 0.14), '#495057', x, 1.7, z);
  const tex = bannerTex(bg, fg, accent, label);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }));
  b.position.set(x + 0.55, 2.0, z);
  parent.add(b);
  if (colliders) colliders.push({ x0: x - 0.2, x1: x + 0.2, z0: z - 0.2, z1: z + 0.2 });
}

export function makeBrazier(parent, x, z, colliders) {
  add(parent, new THREE.CylinderGeometry(0.35, 0.45, 0.7, 8), '#495057', x, 0.35, z);
  const flame = add(parent, new THREE.ConeGeometry(0.28, 0.7, 6), '#ff922b', x, 0.95, z, false);
  flame.material = new THREE.MeshLambertMaterial({ color: '#ff922b', emissive: '#e8590c', emissiveIntensity: 0.8 });
  if (colliders) colliders.push({ x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4 });
}

export function makeWell(parent, x, z, colliders) {
  add(parent, new THREE.CylinderGeometry(1.1, 1.2, 1.0, 12), '#868e96', x, 0.5, z);
  add(parent, new THREE.TorusGeometry(1.05, 0.12, 6, 16), '#adb5bd', x, 1.0, z).rotation.x = Math.PI / 2;
  add(parent, box(0.12, 1.6, 0.12), '#6b3f24', x - 0.9, 1.7, z);
  add(parent, box(0.12, 1.6, 0.12), '#6b3f24', x + 0.9, 1.7, z);
  add(parent, box(2.0, 0.12, 0.12), '#6b3f24', x, 2.5, z);
  if (colliders) colliders.push({ x0: x - 1.3, x1: x + 1.3, z0: z - 1.3, z1: z + 1.3 });
}

export function makeChimney(parent, x, y, z, tall = false) {
  const h = tall ? 2.2 : 1.5;
  add(parent, box(0.75, h, 0.75), '#7b848f', x, y + h / 2, z);
  add(parent, box(0.95, 0.18, 0.95), '#495057', x, y + h + 0.05, z);
  add(parent, box(0.35, 0.45, 0.35), '#343a40', x, y + h + 0.35, z);
}

export function makeAwning(parent, x, y, z, w, depth, color) {
  const cloth = color || '#c92a2a';
  add(parent, box(w, 0.1, depth), cloth, x, y, z);
  // scalloped front edge hint
  for (let i = 0; i < 5; i++) {
    const sx = x - w / 2 + 0.25 + i * ((w - 0.5) / 4);
    add(parent, box(0.28, 0.12, 0.08), cloth, sx, y - 0.08, z + depth / 2 - 0.02, false);
  }
  add(parent, box(0.09, 0.85, 0.09), '#5c3d1e', x - w / 2 + 0.12, y - 0.4, z + depth / 2 - 0.06);
  add(parent, box(0.09, 0.85, 0.09), '#5c3d1e', x + w / 2 - 0.12, y - 0.4, z + depth / 2 - 0.06);
}

export function makeWindow(parent, x, y, z, lit = true, opts = {}) {
  const ww = opts.w || 0.9;
  const wh = opts.h || 1.05;
  add(parent, box(ww + 0.12, wh + 0.12, 0.1), '#3f4650', x, y, z);
  add(parent, box(ww + 0.22, 0.1, 0.14), '#8b5a2b', x, y - wh / 2 - 0.08, z + 0.02); // sill
  const pane = add(parent, box(ww, wh, 0.05), lit ? '#fff3bf' : '#8ecae6', x, y, z + 0.04, false);
  if (lit) {
    pane.material = new THREE.MeshLambertMaterial({ color: '#ffe8a3', emissive: '#e67700', emissiveIntensity: 0.32 });
  } else {
    pane.material = new THREE.MeshLambertMaterial({ color: '#8ecae6', emissive: '#4dabf7', emissiveIntensity: 0.08 });
  }
  add(parent, box(0.06, wh, 0.06), '#ced4da', x, y, z + 0.06, false);
  add(parent, box(ww, 0.06, 0.06), '#ced4da', x, y, z + 0.06, false);
  if (opts.shutters) {
    const sh = opts.shutter || '#5c7cfa';
    add(parent, box(0.28, wh * 0.95, 0.06), sh, x - ww / 2 - 0.18, y, z + 0.02);
    add(parent, box(0.28, wh * 0.95, 0.06), sh, x + ww / 2 + 0.18, y, z + 0.02);
  }
}

export function makeShelfGoods(parent, x, y, z, theme = 'market') {
  const palettes = {
    market: ['#e67700', '#2f9e44', '#fab005', '#c92a2a', '#1c7ed6'],
    hearth: ['#d9480f', '#ffe8cc', '#e67700', '#2f9e44', '#fab005'],
    smith: ['#868e96', '#495057', '#adb5bd', '#c9922a', '#343a40'],
    healer: ['#e7f5ff', '#74c0fc', '#2f9e44', '#fa5252', '#fff'],
    stage: ['#be4bdb', '#f3d9fa', '#ffd43b', '#e64980', '#7950f2'],
  };
  const cols = palettes[theme] || palettes.market;
  for (let i = 0; i < 5; i++) {
    add(parent, box(0.35, 0.3 + (i % 2) * 0.15, 0.35), cols[i % cols.length], x - 0.8 + i * 0.4, y, z);
  }
}

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
