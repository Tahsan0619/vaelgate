const HELD = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
};
const ACTIONS = {
  KeyE: 'use', KeyF: 'use', Enter: 'use',
  KeyI: 'inv', KeyM: 'map', KeyP: 'pause', Escape: 'pause',
  KeyJ: 'attack', Space: 'attack', KeyL: 'dodge', KeyC: 'card', KeyG: 'progress',
  KeyK: 'skills',
  Digit1: 'skill0', Digit2: 'skill1', Digit3: 'skill2',
};

export class Input {
  constructor() {
    this.held = new Set();
    this.queue = [];
    this.stick = { x: 0, y: 0, active: false };
    this.drag = 0;
    this._md = false;
    this._lx = 0;
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const h = HELD[e.code];
      const a = ACTIONS[e.code];
      if (h || a) e.preventDefault();
      if (h) this.held.add(h);
      if (a && !e.repeat) this.queue.push(a);
    });
    window.addEventListener('keyup', (e) => {
      const h = HELD[e.code];
      if (h) this.held.delete(h);
    });
    window.addEventListener('blur', () => this.held.clear());
    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('#hud, .screen, .sheet, button, a, input, select')) return;
      this._md = true; this._lx = e.clientX;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this._md) return;
      this.drag += (e.clientX - this._lx) * 0.005;
      this._lx = e.clientX;
    });
    window.addEventListener('pointerup', () => { this._md = false; });
    this.bindTouch();
  }

  bindTouch() {
    const pad = document.getElementById('stickPad');
    const knob = document.getElementById('stickKnob');
    if (pad) {
      let id = null, cx = 0, cy = 0;
      const R = 52;
      const move = (e) => {
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / R);
        this.stick.x = (dx / d) * k;
        this.stick.y = (dy / d) * k;
        knob.style.transform = `translate(${this.stick.x * R}px, ${this.stick.y * R}px)`;
      };
      pad.addEventListener('pointerdown', (e) => {
        id = e.pointerId; pad.setPointerCapture(id);
        const r = pad.getBoundingClientRect();
        cx = r.left + r.width / 2; cy = r.top + r.height / 2;
        this.stick.active = true; move(e);
      });
      pad.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
      const end = (e) => {
        if (e.pointerId !== id) return;
        id = null; this.stick.x = this.stick.y = 0; this.stick.active = false; knob.style.transform = '';
      };
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
    }
    document.querySelectorAll('[data-act]').forEach((b) => {
      // Skip top HUD nav buttons; those use dedicated click handlers in main.js
      if (b.closest('.top-btns')) return;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.queue.push(b.dataset.act);
      });
    });
    document.querySelectorAll('[data-skill]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.queue.push('skill' + b.dataset.skill);
      });
    });
  }

  axis() {
    let x = (this.held.has('right') ? 1 : 0) - (this.held.has('left') ? 1 : 0);
    let y = (this.held.has('down') ? 1 : 0) - (this.held.has('up') ? 1 : 0);
    if (this.stick.active) { x = this.stick.x; y = this.stick.y; }
    const l = Math.hypot(x, y) || 1;
    if (l > 1) { x /= l; y /= l; }
    return { x, y, sprint: this.held.has('sprint') };
  }

  take() {
    return this.queue.splice(0, this.queue.length);
  }

  takeDrag() {
    const d = this.drag; this.drag = 0; return d;
  }
}
