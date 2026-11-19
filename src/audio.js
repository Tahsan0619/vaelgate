let ctx, master, muted = false;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'square', vol = 0.3, slide = 0) {
  if (muted) return;
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, c.currentTime + dur);
  g.gain.value = vol;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g); g.connect(master);
  o.start(); o.stop(c.currentTime + dur);
}

export const audio = {
  unlock() { ac(); },
  mute() { muted = !muted; return muted; },
  isMuted() { return muted; },
  click() { tone(520, 0.05, 'triangle', 0.15); },
  coin() { tone(880, 0.08, 'square', 0.18); tone(1180, 0.1, 'square', 0.12); },
  hit() { tone(180, 0.08, 'sawtooth', 0.22, -60); },
  crit() { tone(420, 0.05, 'square', 0.2); tone(720, 0.1, 'square', 0.18); },
  hurt() { tone(140, 0.12, 'sawtooth', 0.25, -40); },
  heal() { tone(520, 0.08, 'sine', 0.15); tone(780, 0.12, 'sine', 0.12); },
  level() { tone(440, 0.1); tone(660, 0.12); tone(880, 0.16); },
  fanfare() { tone(392, 0.12); setTimeout(() => tone(523, 0.12), 100); setTimeout(() => tone(659, 0.2), 200); },
  warn() { tone(220, 0.15, 'square', 0.2, -40); },
  swing() { tone(240, 0.05, 'triangle', 0.1, 80); },
  spell() { tone(600, 0.08, 'sine', 0.14); tone(900, 0.12, 'sine', 0.1); },
  door() { tone(180, 0.1, 'triangle', 0.15); tone(120, 0.14, 'triangle', 0.12); },
  eat() { tone(300, 0.05, 'sine', 0.1); tone(250, 0.08, 'sine', 0.08); },
  stamp() { tone(160, 0.12, 'square', 0.2); tone(280, 0.18, 'triangle', 0.15); },
};
