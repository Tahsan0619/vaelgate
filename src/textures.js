import * as THREE from 'three';

function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}

function speckle(g, w, h, n, cols, a = 0.35) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[(Math.random() * cols.length) | 0];
    g.globalAlpha = Math.random() * a;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  g.globalAlpha = 1;
}

export const grassTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#5c9e45';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 2800, ['#4c8a38', '#6fb553', '#3f7a2e', '#7cc35d'], 0.55);
});

export const dirtTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#8b7355';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 1800, ['#6b5340', '#a08060', '#7a6048'], 0.45);
});

export const asphaltTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4b4e53';
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 4200, ['#35383c', '#6b6e73', '#585b60']);
  g.fillStyle = '#f2c232';
  for (let x = 0; x < w; x += 64) g.fillRect(x + 8, h / 2 - 3, 32, 5);
  g.fillStyle = 'rgba(240,240,236,0.7)';
  g.fillRect(0, 8, w, 3);
  g.fillRect(0, h - 11, w, 3);
});

export const stoneTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9aa4b2';
  g.fillRect(0, 0, w, h);
  const cols = ['#8b95a3', '#a8b0bc', '#7e8794', '#b0b8c4'];
  for (let y = 0; y < h; y += 32) {
    const off = (y / 32) % 2 ? 16 : 0;
    for (let x = -16; x < w; x += 48) {
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      g.fillRect(x + off + 1, y + 1, 46, 30);
      g.strokeStyle = 'rgba(0,0,0,0.18)';
      g.strokeRect(x + off + 1, y + 1, 46, 30);
    }
  }
});

export const tileTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#c5c8ce';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(0,0,0,0.15)';
  g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke();
    g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke();
  }
  speckle(g, w, h, 400, ['#fff', '#888'], 0.12);
});

export const woodTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#8b5a2b';
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) {
    g.fillStyle = y % 32 ? '#7a4a22' : '#9a6a3b';
    g.fillRect(0, y, w, 15);
    g.strokeStyle = 'rgba(0,0,0,0.2)';
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  }
  speckle(g, w, h, 600, ['#5c3a18', '#c4a882'], 0.2);
});

export const plasterTex = (hex = '#e9ecef') => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = hex;
  g.fillRect(0, 0, w, h);
  speckle(g, w, h, 900, ['#000', '#fff'], 0.07);
});

export const brickTex = () => canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#8b4513';
  g.fillRect(0, 0, w, h);
  const bricks = ['#a0522d', '#8b4513', '#cd853f', '#6b3a1f'];
  for (let y = 0; y < h; y += 16) {
    const off = (y / 16) % 2 ? 20 : 0;
    for (let x = -20; x < w; x += 40) {
      g.fillStyle = bricks[(Math.random() * bricks.length) | 0];
      g.fillRect(x + off + 1, y + 1, 38, 14);
    }
  }
});

export const signTex = (text, bg = '#1b263b', fg = '#ffd43b', w = 256, h = 64) => canvasTex(w, h, (g, W, H) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = fg;
  g.lineWidth = 4;
  g.strokeRect(3, 3, W - 6, H - 6);
  g.fillStyle = fg;
  g.font = `bold ${Math.floor(H * 0.42)}px sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2 + 1);
}, false);

export const bannerTex = (bg, fg, accent, label = '') => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = accent;
  g.fillRect(0, 0, w, 18);
  g.fillRect(0, h - 36, w, 36);
  g.fillStyle = fg;
  g.beginPath();
  g.moveTo(0, h - 36); g.lineTo(w / 2, h); g.lineTo(w, h - 36);
  g.fill();
  if (label) {
    g.font = 'bold 28px serif';
    g.textAlign = 'center';
    g.fillStyle = fg;
    g.fillText(label, w / 2, h * 0.42);
  }
  speckle(g, w, h, 200, ['#fff', '#000'], 0.08);
}, false);

export const rankPlaqueTex = (mark, bg = '#1b263b', fg = '#ffd43b') => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = fg;
  g.lineWidth = 6;
  g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg;
  const len = String(mark).length;
  g.font = `bold ${len >= 3 ? 40 : len === 2 ? 52 : 72}px serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(mark, w / 2, h / 2 + 4);
}, false);

export function matMap(tex, color = '#ffffff', repeatX = 1, repeatY = 1) {
  tex.repeat.set(repeatX, repeatY);
  return new THREE.MeshLambertMaterial({ map: tex, color });
}
