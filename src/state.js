import {
  SAVE_KEY, CLASSES, STARTER_WEAPON, ITEMS, THRESHOLDS, GOALS, DIFFICULTY,
  XP_CURVE, clamp, nextRank, rankIndex, HUNGER,
} from './config.js';

export function newState(opts) {
  const cls = CLASSES[opts.classId];
  const stats = { ...cls.stats };
  const inv = [
    { id: STARTER_WEAPON[opts.classId], qty: 1 },
    { id: 'f_chest', qty: 1 },
    { id: 'f_boots', qty: 1 },
    { id: 'bread', qty: 3 },
    { id: 'potion', qty: 2 },
  ];
  if (opts.classId === 'vanguard') inv.push({ id: 'f_shield', qty: 1 });
  return {
    name: opts.name,
    classId: opts.classId,
    look: opts.look,
    rank: 'F',
    level: 1,
    xp: 0,
    gold: 200,
    gp: 0,
    bc: 0,
    glimmer: 0,
    hunger: 100,
    hp: stats.hp,
    maxHp: stats.hp,
    sta: stats.sta,
    maxSta: stats.sta,
    mana: stats.mana,
    maxMana: stats.mana,
    base: stats,
    inv,
    equip: { weapon: STARTER_WEAPON[opts.classId], offhand: opts.classId === 'vanguard' ? 'f_shield' : null, chest: 'f_chest', boots: 'f_boots', helm: null },
    registered: false,
    flags: {},
    clears: {},
    thresholds: {},
    bossCodex: {},
    waystones: { guild: true },
    statsRun: { damage: 0, kills: 0, healing: 0, mitigation: 0, utility: 0, deaths: 0 },
    goal: 0,
    x: 2, z: 8, ry: Math.PI,
    where: null,
    buffs: {},
    skillOrder: [0, 1, 2],
    created: Date.now(),
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const S = JSON.parse(raw);
    if (!S?.name || !CLASSES[S.classId]) return null;
    S.flags = S.flags || {};
    S.clears = S.clears || {};
    S.bossCodex = S.bossCodex || {};
    S.waystones = S.waystones || { guild: true };
    S.buffs = S.buffs || {};
    S.equip = S.equip || {};
    S.inv = S.inv || [];
    S.skillOrder = Array.isArray(S.skillOrder) && S.skillOrder.length === 3 ? S.skillOrder : [0, 1, 2];
    return S;
  } catch {
    return null;
  }
}

export function save(S) {
  const copy = { ...S, statsRun: { damage: 0, kills: 0, healing: 0, mitigation: 0, utility: 0, deaths: 0 } };
  localStorage.setItem(SAVE_KEY, JSON.stringify(copy));
}

export function effectiveStats(S) {
  const s = { ...S.base };
  for (const slot of Object.keys(S.equip)) {
    const id = S.equip[slot];
    const it = id && ITEMS[id];
    if (!it?.stats) continue;
    for (const [k, v] of Object.entries(it.stats)) s[k] = (s[k] || 0) + v;
  }
  if (S.buffs.atk) s.atk = Math.round(s.atk * (1 + S.buffs.atk));
  if (S.buffs.maxHp) {
    s.hp = Math.round(s.hp * (1 + S.buffs.maxHp));
  }
  const hs = hungerState(S.hunger);
  s.dmgMul = hs.dmg;
  s.staRegen = hs.staRegen;
  s.hungerState = hs;
  return s;
}

export function hungerState(h) {
  for (const st of HUNGER.states) if (h >= st.min) return st;
  return HUNGER.states[HUNGER.states.length - 1];
}

export function addItem(S, id, qty = 1) {
  const def = ITEMS[id];
  if (!def) return false;
  if (def.stack) {
    const stack = S.inv.find((i) => i.id === id && (i.qty || 1) < def.stack);
    if (stack) { stack.qty = (stack.qty || 1) + qty; return true; }
  }
  if (S.inv.length >= 30) return false;
  S.inv.push({ id, qty });
  return true;
}

export function removeItem(S, id, qty = 1) {
  const i = S.inv.findIndex((x) => x.id === id);
  if (i < 0) return false;
  const it = S.inv[i];
  it.qty = (it.qty || 1) - qty;
  if (it.qty <= 0) S.inv.splice(i, 1);
  return true;
}

export function countItem(S, id) {
  return S.inv.filter((i) => i.id === id).reduce((a, i) => a + (i.qty || 1), 0);
}

export function gainXp(S, amount) {
  S.xp += amount;
  let leveled = 0;
  while (S.xp >= XP_CURVE(S.level)) {
    S.xp -= XP_CURVE(S.level);
    S.level += 1;
    leveled += 1;
    S.base.hp += 6;
    S.base.sta += 4;
    S.base.mana += 4;
    S.base.atk += 1;
    S.base.mag += 1;
    S.base.def += 1;
    const st = effectiveStats(S);
    S.maxHp = st.hp || S.base.hp;
    S.maxSta = S.base.sta;
    S.maxMana = S.base.mana;
    S.hp = Math.min(S.maxHp, S.hp + 20);
    S.sta = S.maxSta;
    S.mana = Math.min(S.maxMana, S.mana + 10);
  }
  return leveled;
}

export function recordClear(S, dungeonId, difficulty, cr, objectives = {}) {
  const key = dungeonId;
  const diffI = ['easy', 'normal', 'hard', 'nightmare'].indexOf(difficulty);
  S.clears[key] = S.clears[key] || { runs: 0, bestCr: 0, bestDiff: -1, objs: {} };
  const c = S.clears[key];
  c.runs += 1;
  c.bestCr = Math.max(c.bestCr, cr);
  c.bestDiff = Math.max(c.bestDiff, diffI);
  Object.assign(c.objs, objectives);
  for (const [k, v] of Object.entries(objectives)) if (v) S.flags[k] = true;
}

export function thresholdDone(S, id) {
  const t = THRESHOLDS[id];
  if (!t) return false;
  return t.needs.every((n) => needMet(S, n));
}

export function needMet(S, n) {
  if (n.flag) return !!S.flags[n.flag];
  if (n.dungeon) {
    const c = S.clears[n.dungeon];
    if (!c) return false;
    const minDiff = ['easy', 'normal', 'hard', 'nightmare'].indexOf(n.minDiff || 'easy');
    return c.runs >= (n.clears || 1) && c.bestDiff >= minDiff && c.bestCr >= (n.minCr || 0);
  }
  return false;
}

export function canEnterDungeon(S, dungeon) {
  if (!S.registered) return { ok: false, why: 'Register at the Guild Center first. Gate guards check your Adventurer Card.' };
  const need = rankIndex(dungeon.rank);
  const have = rankIndex(S.rank);
  if (dungeon.id === 'rustpick' && !thresholdDone(S, 'unlock_f2')) {
    return { ok: false, why: 'Clear Mossroot Burrow using Gloomcap\'s Fire weakness to unlock this gate.' };
  }
  if (dungeon.id === 'crypt' && have < rankIndex('E')) {
    return { ok: false, why: 'E-rank required. Take the Rank Exam at the Guild after clearing both F dungeons.' };
  }
  if (dungeon.id === 'ember' && have < rankIndex('D')) {
    return { ok: false, why: 'D-rank required. Clear the Crypt and take the D-rank exam.' };
  }
  if (dungeon.id === 'drowned' && have < rankIndex('C')) {
    return { ok: false, why: 'C-rank required. Clear Emberfang and take the C-rank exam.' };
  }
  if (dungeon.id === 'bastion' && have < rankIndex('B')) {
    return { ok: false, why: 'B-rank required. Clear the Sanctum and take the B-rank exam.' };
  }
  if (dungeon.id === 'storm' && have < rankIndex('A')) {
    return { ok: false, why: 'A-rank required. Clear Bastion and take the A-rank exam.' };
  }
  if (dungeon.id === 'eclipse' && have < rankIndex('S')) {
    return { ok: false, why: 'S-rank required. Clear Stormspire and take the S-rank exam.' };
  }
  if (dungeon.id === 'astral' && have < rankIndex('SS')) {
    return { ok: false, why: 'SS-rank required. Clear Eclipse Sanctum and take the SS-rank exam.' };
  }
  if (dungeon.id === 'crown' && have < rankIndex('SSS')) {
    return { ok: false, why: 'SSS-rank required. Clear Astral Foundry and take the SSS-rank exam.' };
  }
  if (need > have + 1) return { ok: false, why: 'This gate is more than one rank above you.' };
  if (dungeon.locked) return { ok: false, why: 'This gate opens in a later chapter of Vaelgate.' };
  const warn = need === have + 1;
  return { ok: true, warn, why: warn ? 'This dungeon is above your rank. Enemies deal more damage to you.' : null };
}

export function currentGoal(S) {
  for (let i = 0; i < GOALS.length; i++) {
    const g = GOALS[i];
    if (g.after === 'register' && !S.registered) continue;
    if (g.id === 'register' && S.registered) continue;
    if (g.id === 'supplies' && (S.flags.boughtSupplies || countItem(S, 'bread') >= 3 && countItem(S, 'potion') >= 1 && S.registered)) {
      if (!S.flags.boughtSupplies && S.registered) S.flags.boughtSupplies = true;
      continue;
    }
    if (g.id === 'f1' && (S.clears.mossroot?.runs || 0) >= 1) continue;
    if (g.id === 'f2' && (S.clears.rustpick?.runs || 0) >= 1) continue;
    if (g.id === 'promote' && rankIndex(S.rank) >= rankIndex('E')) continue;
    if (g.id === 'crypt' && (S.clears.crypt?.runs || 0) >= 1) continue;
    if (g.id === 'promote_d' && rankIndex(S.rank) >= rankIndex('D')) continue;
    if (g.id === 'ember' && (S.clears.ember?.runs || 0) >= 1) continue;
    if (g.id === 'promote_c' && rankIndex(S.rank) >= rankIndex('C')) continue;
    if (g.id === 'drowned' && (S.clears.drowned?.runs || 0) >= 1) continue;
    if (g.id === 'promote_b' && rankIndex(S.rank) >= rankIndex('B')) continue;
    if (g.id === 'bastion' && (S.clears.bastion?.runs || 0) >= 1) continue;
    if (g.id === 'promote_a' && rankIndex(S.rank) >= rankIndex('A')) continue;
    if (g.id === 'storm' && (S.clears.storm?.runs || 0) >= 1) continue;
    if (g.id === 'promote_s' && rankIndex(S.rank) >= rankIndex('S')) continue;
    if (g.id === 'eclipse' && (S.clears.eclipse?.runs || 0) >= 1) continue;
    if (g.id === 'promote_ss' && rankIndex(S.rank) >= rankIndex('SS')) continue;
    if (g.id === 'astral' && (S.clears.astral?.runs || 0) >= 1) continue;
    if (g.id === 'promote_sss' && rankIndex(S.rank) >= rankIndex('SSS')) continue;
    if (g.id === 'crown' && (S.clears.crown?.runs || 0) >= 1) continue;
    if (g.after === 'f1' && !(S.clears.mossroot?.runs >= 1)) continue;
    if (g.after === 'f2' && !(S.clears.rustpick?.runs >= 1)) continue;
    if (g.after === 'promote' && rankIndex(S.rank) < rankIndex('E')) continue;
    if (g.after === 'crypt' && !(S.clears.crypt?.runs >= 1)) continue;
    if (g.after === 'promote_d' && rankIndex(S.rank) < rankIndex('D')) continue;
    if (g.after === 'ember' && !(S.clears.ember?.runs >= 1)) continue;
    if (g.after === 'promote_c' && rankIndex(S.rank) < rankIndex('C')) continue;
    if (g.after === 'drowned' && !(S.clears.drowned?.runs >= 1)) continue;
    if (g.after === 'promote_b' && rankIndex(S.rank) < rankIndex('B')) continue;
    if (g.after === 'bastion' && !(S.clears.bastion?.runs >= 1)) continue;
    if (g.after === 'promote_a' && rankIndex(S.rank) < rankIndex('A')) continue;
    if (g.after === 'storm' && !(S.clears.storm?.runs >= 1)) continue;
    if (g.after === 'promote_s' && rankIndex(S.rank) < rankIndex('S')) continue;
    if (g.after === 'eclipse' && !(S.clears.eclipse?.runs >= 1)) continue;
    if (g.after === 'promote_ss' && rankIndex(S.rank) < rankIndex('SS')) continue;
    if (g.after === 'astral' && !(S.clears.astral?.runs >= 1)) continue;
    if (g.after === 'promote_sss' && rankIndex(S.rank) < rankIndex('SSS')) continue;
    if (g.after === 'supplies' && !S.registered) continue;
    if (g.id === 'supplies' && !S.registered) continue;
    if (g.id === 'f1' && !S.registered) continue;
    return { ...g, index: i };
  }
  return { id: 'roam', text: 'Roam Aurelmere. You have walked every ranked gate.', hint: 'Wear prestige cosmetics at The Stage.', near: 'stage', index: 99 };
}

/** Next exam available for the player's current rank. */
export function nextPromoteId(S) {
  if (S.rank === 'F') return 'promote_e';
  if (S.rank === 'E') return 'promote_d';
  if (S.rank === 'D') return 'promote_c';
  if (S.rank === 'C') return 'promote_b';
  if (S.rank === 'B') return 'promote_a';
  if (S.rank === 'A') return 'promote_s';
  if (S.rank === 'S') return 'promote_ss';
  if (S.rank === 'SS') return 'promote_sss';
  return null;
}

export function promote(S) {
  const id = nextPromoteId(S);
  if (!id) return { ok: false, why: 'No exam is open for your rank yet.' };
  if (!thresholdDone(S, id)) return { ok: false, why: 'Thresholds incomplete. Check your Rank Progress sheet.' };
  const fees = { promote_e: 25, promote_d: 60, promote_c: 120, promote_b: 220, promote_a: 360, promote_s: 520, promote_ss: 780, promote_sss: 1200 };
  const fee = fees[id] || 50;
  if (S.gold < fee) return { ok: false, why: `Promotion fee is ${fee} G.` };
  S.gold -= fee;
  S.rank = nextRank(S.rank);
  S.gp += 40 + rankIndex(S.rank) * 20;
  S.flags['promoted_' + S.rank.toLowerCase()] = true;
  return { ok: true, rank: S.rank };
}

export function contributionRating(S, role) {
  const r = S.statsRun || {};
  const total = (r.damage || 0) + (r.kills || 0) * 20 + (r.healing || 0) + (r.mitigation || 0) + (r.utility || 0) * 15;
  const deaths = r.deaths || 0;
  let score = clamp(total / 8, 0, 100);
  if (role === 'Tank') score = clamp((r.mitigation || 0) / 4 + (r.utility || 0) * 10 + (r.kills || 0) * 5, 0, 100);
  if (role === 'Support') score = clamp((r.healing || 0) / 3 + (r.utility || 0) * 12, 0, 100);
  score = clamp(score - deaths * 12, 0, 100);
  if (total < 5) score = Math.min(score, 10);
  return Math.round(score);
}

export function drainHunger(S, dt, mode) {
  const rate = HUNGER[mode] || HUNGER.idle;
  S._hungAcc = (S._hungAcc || 0) + dt;
  while (S._hungAcc >= rate) {
    S._hungAcc -= rate;
    S.hunger = clamp(S.hunger - 1, 0, 100);
  }
  if (S.hunger <= 0) {
    S._famAcc = (S._famAcc || 0) + dt;
    if (S._famAcc >= 5) {
      S._famAcc = 0;
      S.hp = Math.max(1, S.hp - Math.ceil(S.maxHp * 0.01));
    }
  }
}
