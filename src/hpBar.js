import * as THREE from 'three';

/** World-space HP sprite that always faces the camera. */
export function createHpBar(opts = {}) {
  const w = opts.width || 128;
  const h = opts.height || 18;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  const worldW = opts.worldW || 1.15;
  sprite.scale.set(worldW, worldW * (h / w), 1);
  sprite.center.set(0.5, 0.5);
  sprite.userData.hpBar = { canvas, ctx, tex, worldW };
  sprite.renderOrder = 10;
  return sprite;
}

export function syncHpBar(sprite, hp, maxHp, y = 2.05) {
  if (!sprite?.userData?.hpBar) return;
  const { canvas, ctx, tex } = sprite.userData.hpBar;
  const pct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // frame
  ctx.fillStyle = 'rgba(10,14,20,0.85)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  // fill
  const fill = pct > 0.55 ? '#51cf66' : pct > 0.28 ? '#fcc419' : '#fa5252';
  ctx.fillStyle = fill;
  const pad = 3;
  ctx.fillRect(pad, pad, (canvas.width - pad * 2) * pct, canvas.height - pad * 2);
  tex.needsUpdate = true;
  sprite.position.y = y;
  sprite.visible = hp > 0;
}

export function attachHpBar(mesh, entity, opts = {}) {
  if (!mesh || mesh.userData.hpBarSprite) return mesh.userData.hpBarSprite;
  const bar = createHpBar(opts);
  const h = opts.y
    ?? mesh.userData?.targetH
    ?? (entity?.def?.scale ? 1.4 * entity.def.scale : 1.8);
  bar.position.y = h + 0.35;
  mesh.add(bar);
  mesh.userData.hpBarSprite = bar;
  mesh.userData.hpBarY = bar.position.y;
  syncHpBar(bar, entity.hp, entity.maxHp, bar.position.y);
  return bar;
}

export function refreshEntityHpBar(entity) {
  const mesh = entity?.mesh;
  const bar = mesh?.userData?.hpBarSprite;
  if (!bar || !entity) return;
  syncHpBar(bar, entity.hp, entity.maxHp, mesh.userData.hpBarY || bar.position.y);
}
