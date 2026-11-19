import {
  CLASSES, DUNGEONS, BOSSES, DIFFICULTY, PLACES, ITEMS, SHOPS, THRESHOLDS,
  gold, shopPrice, sellPrice, rankIndex, RANK_NAME, walkTime, GAME,
} from './config.js';
import {
  addItem, removeItem, countItem, thresholdDone, needMet, promote, nextPromoteId, canEnterDungeon, effectiveStats,
} from './state.js';
import { audio } from './audio.js';
import { icon, iconNameForItem } from './icons.js';

const $ = (id) => document.getElementById(id);
const I = (name) => icon(name);

export function createPanels(G) {
  const sheet = $('sheet');

  function open(html) {
    sheet.classList.remove('hidden');
    sheet.innerHTML = html;
    sheet.querySelectorAll('[data-close]').forEach((b) => b.onclick = () => close());
    sheet.querySelectorAll('[data-act]').forEach((b) => {
      b.onclick = () => {
        const act = b.dataset.act;
        const arg = b.dataset.arg;
        handlers[act]?.(arg, b);
      };
    });
  }
  function close() { sheet.classList.add('hidden'); sheet.innerHTML = ''; }

  const handlers = {
    register() {
      const S = G.S();
      if (S.registered) { G.toast('You already hold an Adventurer Card.', 'info'); return; }
      S.registered = true;
      S.flags.registered = true;
      addItem(S, 'bread', 0); // welcome already has items; grant map flag
      S.flags.hasMap = true;
      S.gp += 10;
      audio.stamp();
      G.toast('F-rank Adventurer Card issued. Welcome to the Guild.', 'good', 5000);
      G.changed();
      open(cardHtml(S));
    },
    buy(id) {
      const S = G.S();
      const it = ITEMS[id];
      const price = shopPrice(it.price, it.rank, S.rank);
      if (price == null) { G.toast('That item is more than one rank above you.', 'bad'); return; }
      if (S.gold < price) { G.toast('Not enough gold.', 'bad'); audio.warn(); return; }
      if (!addItem(S, id, 1)) { G.toast('Inventory full.', 'bad'); return; }
      S.gold -= price;
      if (id === 'bread' || id === 'potion') S.flags.boughtSupplies = true;
      audio.coin();
      G.toast(`Bought ${it.icon} ${it.name} for ${gold(price)}.`, 'good');
      G.changed();
      G.refreshShop?.();
    },
    sell(id) {
      const S = G.S();
      if (Object.values(S.equip).includes(id) && countItem(S, id) <= 1) {
        G.toast('Unequip it first.', 'bad'); return;
      }
      if (!removeItem(S, id, 1)) return;
      const got = sellPrice({ id, qty: 1 });
      S.gold += got;
      audio.coin();
      G.toast(`Sold for ${gold(got)}.`, 'good');
      G.changed();
      G.refreshShop?.();
    },
    sellmats() {
      const S = G.S();
      let gained = 0;
      for (let i = S.inv.length - 1; i >= 0; i--) {
        const it = S.inv[i];
        if (ITEMS[it.id]?.kind !== 'mat') continue;
        gained += sellPrice(it);
        S.inv.splice(i, 1);
      }
      S.gold += gained;
      audio.coin();
      G.toast(gained ? `Sold materials for ${gold(gained)}.` : 'No materials to sell.', gained ? 'good' : 'info');
      G.changed();
      G.refreshShop?.();
    },
    heal() {
      const S = G.S();
      const cost = 40;
      if (S.gold < cost) { G.toast('Healing costs 40 G.', 'bad'); return; }
      S.gold -= cost;
      S.hp = S.maxHp;
      delete S.buffs.poison; delete S.buffs.curse;
      audio.heal();
      G.toast('Fully restored.', 'good');
      G.changed();
    },
    eat(id) {
      const S = G.S();
      const it = ITEMS[id];
      if (!removeItem(S, id, 1) && !(SHOPS.hearth.buy.includes(id) && S.gold >= (shopPrice(it.price, it.rank, S.rank) || 9999))) {
        // allow buying and eating at restaurant
      }
      let price = shopPrice(it.price, it.rank, S.rank);
      if (countItem(S, id) >= 0 && G._eatBuy) {
        if (S.gold < price) { G.toast('Not enough gold.', 'bad'); return; }
        S.gold -= price;
      } else if (!removeItem(S, id, 1)) {
        if (price != null && S.gold >= price) { S.gold -= price; }
        else { G.toast('You do not have that food.', 'bad'); return; }
      }
      S.hunger = Math.min(100, S.hunger + (it.hunger || 10));
      if (it.buff) {
        if (it.buff.atk) { S.buffs.atk = it.buff.atk; S.buffs.atkT = 1800; }
        if (it.buff.maxHp) S.buffs.maxHp = it.buff.maxHp;
        if (it.buff.staRegen) S.buffs.mealSta = it.buff.staRegen;
      }
      if (G._restEat) S.buffs.rested = 1800;
      audio.eat();
      G.toast(`${it.icon} ${it.name} restored hunger.`, 'good');
      G.changed();
      close();
    },
    openskills() { api.skills(); },
    swapskill(slotStr) {
      const S = G.S();
      const slot = +slotStr;
      const order = S.skillOrder || [0, 1, 2];
      const prev = (slot + 2) % 3;
      const t = order[slot];
      order[slot] = order[prev];
      order[prev] = t;
      S.skillOrder = order;
      G.changed();
      audio.click();
      api.skills();
    },
    useitem(id) {
      const S = G.S();
      const it = ITEMS[id];
      if (!it) return;
      if (it.kind === 'food') { handlers.eat(id); return; }
      if (it.kind === 'consumable') {
        if (!removeItem(S, id, 1)) return;
        if (it.heal) { S.hp = Math.min(S.maxHp, S.hp + it.heal); audio.heal(); }
        if (it.cleanse) { delete S.buffs.poison; delete S.buffs.curse; audio.heal(); }
        G.toast(`Used ${it.name}.`, 'good');
        G.changed();
        G.inventory();
        return;
      }
      if (it.kind === 'gear') {
        const prev = S.equip[it.slot];
        S.equip[it.slot] = id;
        // keep previous in inv (already there)
        audio.click();
        G.toast(`Equipped ${it.name}.`, 'good');
        const st = effectiveStats(S);
        S.maxHp = st.hp; S.hp = Math.min(S.hp, S.maxHp);
        G.changed();
        G.inventory();
      }
      if (it.kind === 'cosmetic') {
        S.flags.prestigeTitle = it.title || it.name;
        S.flags.prestigeCosmetic = id;
        audio.fanfare();
        G.toast(`Prestige title equipped: ${S.flags.prestigeTitle}`, 'good', 4000);
        G.changed();
        G.inventory();
      }
    },
    promote() {
      const r = promote(G.S());
      if (!r.ok) { G.toast(r.why, 'bad'); audio.warn(); return; }
      audio.fanfare();
      const gateHint = {
        E: 'The Whispering Crypt gate will recognize your card.',
        D: 'Emberfang Hollow opens to the east.',
        C: 'Drowned Sanctum waits beyond the fire road.',
        B: 'Ironclad Bastion stands at the far edge of Aurelmere.',
        A: 'Stormspire opens on the far eastern road.',
        S: 'Eclipse Sanctum recognizes your Champion card.',
        SS: 'Astral Foundry accepts Legend credentials.',
        SSS: 'Mythic Crown awaits the Gatebreaker.',
      };
      open(`<header><h2>Promotion</h2></header>
        <p style="font-size:42px;text-align:center;line-height:1">${icon('star', 'ico-lg')}</p>
        <p style="text-align:center">You are now <b>${r.rank}-rank · ${RANK_NAME[r.rank]}</b>.</p>
        <p class="muted" style="text-align:center">${gateHint[r.rank] || 'Higher gates await.'}</p>
        <footer><button class="btn primary" data-close>Onward</button></footer>`);
      G.changed();
    },
    enter(diff) {
      close();
      G.enterDungeon?.(diff);
    },
    claimchest() {
      close();
      G.claimChest?.();
    },
    leaveportal() {
      close();
      G.leaveDungeon?.(true);
    },
    nextfloor() {
      close();
      G.nextFloor?.();
    },
  };

  function cardHtml(S) {
    const cls = CLASSES[S.classId];
    const title = S.flags?.prestigeTitle ? `<p class="muted">Prestige: <b>${S.flags.prestigeTitle}</b></p>` : '';
    return `<header><h2>Adventurer Card</h2><p>${GAME.city} Guild</p></header>
      <div class="item"><span style="font-size:28px">${I(cls.icon)}</span>
        <div><b>${S.name}</b><small>${cls.name} · ${RANK_NAME[S.rank]} · Lv ${S.level}</small></div>
        <span class="rank">${S.rank}</span></div>
      ${title}
      <div class="stats-mini" style="margin-top:12px">
        <div><small>Gold</small><b>${gold(S.gold)}</b></div>
        <div><small>GP</small><b>${S.gp}</b></div>
        <div><small>BC</small><b>${S.bc || 0}</b></div>
        <div><small>Clears</small><b>${Object.values(S.clears).reduce((a, c) => a + (c.runs || 0), 0)}</b></div>
      </div>
      <p class="muted" style="margin-top:12px">Contribution Rating is recorded per dungeon run. Idle carries do not fill thresholds.</p>
      <footer><button class="btn primary" data-close>Close</button></footer>`;
  }

  function shopHtml(shopId) {
    const shop = SHOPS[shopId];
    const S = G.S();
    G.refreshShop = () => open(shopHtml(shopId));
    G._restEat = shop.eatIn;
    G._eatBuy = !!shop.eatIn;
    let buy = (shop.buy || []).map((id) => {
      const it = ITEMS[id];
      const price = shopPrice(it.price, it.rank, S.rank);
      const markup = price != null && price > it.price;
      return `<div class="item">
        <span style="font-size:22px">${I(iconNameForItem(id, it.icon))}</span>
        <div style="flex:1"><b>${it.name}</b><small>${it.rank}-rank · ${it.kind}${markup ? ' · Rank mismatch +25%' : ''}</small></div>
        <button class="btn ${price == null ? 'ghost' : 'primary'}" data-act="${shop.eatIn && it.kind === 'food' ? 'eat' : 'buy'}" data-arg="${id}" ${price == null || S.gold < price ? 'disabled' : ''}>${price == null ? 'Locked' : gold(price)}</button>
      </div>`;
    }).join('');
    let sell = '';
    if (shop.sell) {
      sell = `<div class="hr"></div><div class="row"><b>Your loot</b>
        <button class="btn" data-act="sellmats">Sell All Materials</button></div>
        ${S.inv.map((i) => {
          const it = ITEMS[i.id];
          if (!it || it.kind === 'gear' && Object.values(S.equip).includes(i.id) && countItem(S, i.id) <= 1) return '';
          return `<div class="item"><span>${I(iconNameForItem(i.id, it.icon))}</span><div style="flex:1"><b>${it.name}</b><small>×${i.qty || 1}</small></div>
            <button class="btn" data-act="sell" data-arg="${i.id}">${gold(sellPrice({ id: i.id, qty: 1 }))}</button></div>`;
        }).join('')}`;
    }
    if (shop.healFull) {
      buy += `<div class="item"><span>${I('heal')}</span><div style="flex:1"><b>Full Heal</b><small>Restore HP and cleanse</small></div>
        <button class="btn primary" data-act="heal">${gold(shop.healFull)}</button></div>`;
    }
    return `<header><h2>${shop.name}</h2><p>You have ${gold(S.gold)}</p></header>
      <div class="panel-grid">${buy}${sell}</div>
      <footer><button class="btn" data-close>Leave</button></footer>`;
  }

  const api = {
    close,
    isOpen: () => !sheet.classList.contains('hidden'),
    register() {
      const S = G.S();
      if (S.registered) { open(cardHtml(S)); return; }
      const cls = CLASSES[S.classId];
      open(`<header><h2>Guild Registration</h2><p>Walked the hall. Time to take the oath.</p></header>
        <p>Name: <b>${S.name}</b></p>
        <p>Adventurer type: <b>${I(cls.icon)} ${cls.name}</b> (${cls.role})</p>
        <p class="muted">You will receive an F-rank Adventurer Card, a welcome package, and access to F-rank gates.</p>
        <div class="hr"></div>
        <p><i>"I swear to clear gates by my own strength, never to buy a rank, and never to leave a party mate behind."</i></p>
        <footer>
          <button class="btn ghost" data-close>Not yet</button>
          <button class="btn primary" data-act="register">Swear the Oath</button>
        </footer>`);
    },
    card() { open(cardHtml(G.S())); },
    shop(id) { open(shopHtml(id)); },
    inventory() {
      const S = G.S();
      const cells = S.inv.map((i) => {
        const it = ITEMS[i.id];
        const qty = i.qty > 1 ? `<em>${i.qty}</em>` : '';
        return `<button class="inv-slot" data-act="useitem" data-arg="${i.id}" title="${it.name}">${I(iconNameForItem(i.id, it.icon))}${qty}</button>`;
      }).join('');
      const eq = Object.entries(S.equip).map(([slot, id]) => {
        const it = id && ITEMS[id];
        return `<div class="item"><small>${slot}</small><b>${it ? I(iconNameForItem(id, it.icon)) + ' ' + it.name : 'Empty'}</b></div>`;
      }).join('');
      open(`<header><h2>Inventory</h2><p>${S.inv.length}/30 slots · ${gold(S.gold)}</p></header>
        <h3>Equipped</h3><div class="panel-grid">${eq}</div>
        <div class="hr"></div>
        <div class="inv-grid">${cells || '<p class="muted">Empty</p>'}</div>
        <p class="muted">Tap gear to equip. Tap food or potions to use. Press K for skill order.</p>
        <footer>
          <button class="btn" data-act="openskills">Skills</button>
          <button class="btn primary" data-close>Close</button>
        </footer>`);
    },
    skills() {
      const S = G.S();
      const cls = CLASSES[S.classId];
      S.skillOrder = S.skillOrder || [0, 1, 2];
      const rows = S.skillOrder.map((real, slot) => {
        const sk = cls.skills[real];
        return `<div class="item">
          <span>${I(sk.icon)}</span>
          <div style="flex:1"><b>Slot ${slot + 1}: ${sk.name}</b>
            <small>CD ${sk.cd}s · ${sk.type}${sk.cost?.sta ? ` · ${sk.cost.sta} STA` : ''}${sk.cost?.mana ? ` · ${sk.cost.mana} MP` : ''}</small></div>
          <button class="btn" data-act="swapskill" data-arg="${slot}">Swap ↑</button>
        </div>`;
      }).join('');
      open(`<header><h2>${I(cls.icon)} ${cls.name} Skills</h2>
        <p>Reorder your three class skills on the hotbar. Basic attack stays on J.</p></header>
        ${rows}
        <p class="muted">${cls.adv}</p>
        <footer><button class="btn primary" data-close>Done</button></footer>`);
    },
    gate(place) {
      const d = DUNGEONS[place.dungeon];
      if (!d) return;
      const boss = BOSSES[d.boss];
      const S = G.S();
      const cls = CLASSES[S.classId];
      const access = canEnterDungeon(S, d);
      const known = S.bossCodex[d.boss] || {};
      const weapon = S.equip?.weapon ? ITEMS[S.equip.weapon] : null;
      const hidden = boss.hidden.map((h) => known[h.id]
        ? `<div class="check done"><div class="box">✓</div><div><b>Learned</b><small>${h.text}</small></div></div>`
        : `<div class="check"><div class="box">?</div><div><b>Hidden mechanic</b><small>???</small></div></div>`).join('');
      const diffs = Object.values(DIFFICULTY).map((df) => `
        <button class="diff-card" data-act="enter" data-arg="${df.id}" ${access.ok ? '' : 'disabled'}>
          <b>${df.name}</b>
          <small>HP ×${df.hp} · DMG ×${df.dmg} · DEF ×${df.def}</small>
          <small>Rewards: ${df.grade} · Revives ${df.revives}</small>
          <small>${df.blurb}</small>
          ${df.id === 'nightmare' ? `<small class="tag weak">${d.nightmare}</small>` : ''}
        </button>`).join('');
      const portrait = boss.portrait
        ? `<img class="boss-portrait" src="${boss.portrait}" alt="${boss.name}" width="280" height="280"/>`
        : `<div class="boss-portrait fallback">${I(boss.icon)}</div>`;
      open(`<header><h2>${I(d.icon)} ${d.name}</h2>
        <p><span class="tag ${d.rank.toLowerCase()}">${d.rank}-rank</span> ${d.theme} · Lv ${d.levels[0]}-${d.levels[1]}</p></header>
        <div class="boss-brief">
          ${portrait}
          <div>
            <h3>${boss.name}</h3>
            <p class="muted">${boss.brief || boss.style}</p>
            <p><small>${boss.style} · Party ${boss.party}</small></p>
            <p><b>Weak:</b> ${boss.weak.map((w) => `<span class="tag weak">${w}</span>`).join(' ')}
               <b>Strong:</b> ${boss.strong.map((w) => `<span class="tag strong">${w}</span>`).join(' ')}</p>
          </div>
        </div>
        <div class="party-strip item">
          <span>${I(cls.icon)}</span>
          <div><b>${S.name}</b><small>${cls.name} · ${S.rank}-rank · Lv ${S.level}${weapon ? ` · ${weapon.name}` : ''}</small></div>
          <span class="rank">${S.rank}</span>
        </div>
        <div class="progress-list">${hidden}</div>
        ${access.why ? `<p class="${access.ok ? 'muted' : ''}" style="color:${access.ok ? '' : 'var(--red)'}">${access.why}</p>` : ''}
        <div class="hr"></div><h3>Difficulty</h3>
        <div class="diff-grid">${diffs}</div>
        <footer><button class="btn" data-close>Step away</button></footer>`);
      G._gateDungeon = d.id;
    },
    map() {
      const S = G.S();
      handlers.track = (id) => {
        G.setWaypoint?.(id);
        const p = PLACES.find((x) => x.id === id);
        if (!p) return;
        const m = Math.hypot(p.x - (S.x || 0), p.z - (S.z || 0));
        G.toast(`${p.name}: ${Math.round(m)} m away. Chart distance ${p.loreM} m.`, 'info', 4500);
        close();
      };
      const districts = {};
      for (const p of PLACES) {
        const d = p.district || 'Aurelmere';
        (districts[d] ||= []).push(p);
      }
      const blocks = Object.entries(districts).map(([name, list]) => {
        const rows = list.map((p) => {
          const m = Math.hypot(p.x - (S.x || 0), p.z - (S.z || 0));
          let locked = !!p.locked;
          if (p.dungeon && DUNGEONS[p.dungeon]) {
            const access = canEnterDungeon(S, DUNGEONS[p.dungeon]);
            locked = locked || !access.ok;
          } else if (p.dungeon && !DUNGEONS[p.dungeon]) locked = true;
          return `<button class="map-row ${locked ? 'locked' : ''}" data-act="track" data-arg="${p.id}" ${locked && p.kind === 'gate' ? 'disabled' : ''}>
            <span>${I(p.icon)}</span>
            <div><b>${p.name}</b><small>${p.kind}${locked ? ' · locked' : ''}</small></div>
            <span class="dist">${Math.round(m)} m</span>
          </button>`;
        }).join('');
        return `<h3>${name}</h3><div class="map-list">${rows}</div>`;
      }).join('<div class="hr"></div>');
      open(`<header><h2>${I('map')} World Map · ${GAME.city}</h2><p>Districts of Aurelmere. Select a place to track it.</p></header>
        ${blocks}
        <footer><button class="btn primary" data-close>Close</button></footer>`);
    },
    train() {
      open(`<header><h2>${I('fist')} Training Ground</h2>
        <p>Practice basic attacks on the dummies. No loot. No rank checks.</p></header>
        <p>Walk into the yard and press <kbd>J</kbd> near a wooden dummy. Skills stay locked to real dungeon fights.</p>
        <p class="muted">Use this yard to learn reach and timing before Mossroot.</p>
        <footer><button class="btn primary" data-close>Got it</button></footer>`);
    },
    progress() {
      const S = G.S();
      const blocks = Object.entries(THRESHOLDS).map(([id, t]) => {
        const rows = t.needs.map((n) => {
          const ok = needMet(S, n);
          return `<div class="check ${ok ? 'done' : ''}"><div class="box">${ok ? '✓' : ''}</div><div><b>${n.text}</b></div></div>`;
        }).join('');
        return `<h3>${t.label} ${thresholdDone(S, id) ? I('check') : ''}</h3><div class="progress-list">${rows}</div>`;
      }).join('<div class="hr"></div>');
      open(`<header><h2>${I('clipboard')} Rank Progress</h2><p>Current rank: <b>${S.rank}</b> · ${RANK_NAME[S.rank]}</p></header>
        ${blocks}
        <footer><button class="btn" data-close>Close</button>
        ${(() => {
          const pid = nextPromoteId(S);
          if (!pid || !thresholdDone(S, pid)) return '';
          const label = {
            promote_e: 'E', promote_d: 'D', promote_c: 'C', promote_b: 'B', promote_a: 'A',
            promote_s: 'S', promote_ss: 'SS', promote_sss: 'SSS',
          }[pid];
          return `<button class="btn primary" data-act="promote">Take ${label}-rank Exam</button>`;
        })()}
        </footer>`);
    },
    examiner() {
      const S = G.S();
      const pid = nextPromoteId(S);
      if (!pid) {
        open(`<header><h2>Rank Examiner</h2></header><p>Your rank is <b>${S.rank}</b>. The next exams unlock with later chapters.</p>
          <footer><button class="btn primary" data-close>Understood</button></footer>`);
        return;
      }
      this.progress();
    },
    result(data) {
      const drops = (data.drops || []).map((d) => {
        const it = ITEMS[d.id];
        const cross = d.cross ? ' · Cross-rank!' : '';
        return `<div class="item"><span>${I(iconNameForItem(d.id, it?.icon || 'chest'))}</span><div><b>${it?.name || d.id}</b><small>×${d.qty || 1}${cross}</small></div></div>`;
      }).join('') || '<p class="muted">No item drops this time.</p>';
      const crNote = data.cr < 15 ? 'This run does not count toward thresholds.' : 'Threshold progress updated.';
      open(`<header><h2>Dungeon Cleared</h2><p>${data.name} · ${data.diff}</p></header>
        <div class="stats-mini">
          <div><small>Gold</small><b>+${data.gold}</b></div>
          <div><small>XP</small><b>+${data.xp}</b></div>
          <div><small>CR</small><b>${data.cr}</b></div>
          <div><small>BC</small><b>+${data.bc || 0}</b></div>
        </div>
        <div class="hr"></div>
        <div class="panel-grid">${drops}</div>
        <p class="muted">Contribution Rating ${data.cr}/100. ${crNote}</p>
        <footer><button class="btn primary" data-act="leaveportal">Return to Aurelmere</button></footer>`);
    },
    stair() {
      open(`<header><h2>Staircase Unsealed</h2></header>
        <p>The barrier is gone. Stairs only go down. There is no climbing back.</p>
        <footer><button class="btn ghost" data-close>Stay</button>
        <button class="btn primary" data-act="nextfloor">Descend</button></footer>`);
    },
    chest(preview) {
      open(`<header><h2>${I('chest')} Dungeon Clear Chest</h2></header>
        <p>The main prize for clearing this gate. Claim your rewards.</p>
        <footer><button class="btn primary" data-act="claimchest">Open Clear Chest</button></footer>`);
    },
    info() {
      open(`<header><h2>Information Desk</h2></header>
        <p>F-rank gates: each floor has 3 waves, then a solo floor boss. Floor 5 is the named boss at full power. Claim the clear chest after that fight.</p>
        <p>Boss panels show weaknesses and strengths. Hidden tricks are learned by fighting, then saved in your Boss Codex.</p>
        <p>Hunger drains while you walk and fight. Carry food. Starving adventurers cannot fast travel.</p>
        <p>Merely finishing is not enough. Fill each threshold before the Rank Examiner will promote you.</p>
        <footer><button class="btn primary" data-close>Thanks</button></footer>`);
    },
    quests() {
      open(`<header><h2>Quest Board</h2></header>
        <div class="progress-list">
          <div class="check"><div class="box"></div><div><b>First Clear: Mossroot</b><small>Clear F-1 on any difficulty · 30 G · 15 GP</small></div></div>
          <div class="check"><div class="box"></div><div><b>Fire Discipline</b><small>Defeat Gloomcap with Fire damage · 20 G</small></div></div>
          <div class="check"><div class="box"></div><div><b>Tunnel Rat</b><small>Clear F-2 after surviving Grubnok's cave-in · 40 G · 20 GP</small></div></div>
        </div>
        <p class="muted">Daily quests expand after multiplayer lands. For now, thresholds are your true quests.</p>
        <footer><button class="btn primary" data-close>Close</button></footer>`);
    },
    party() {
      open(`<header><h2>Party Finder</h2></header>
        <p>Parties are optional for F to A. S, SS, and SSS will require a party.</p>
        <p class="muted">Online matchmaking arrives in a later phase. Solo the F and E gates for now, and watch your Contribution Rating.</p>
        <footer><button class="btn primary" data-close>Close</button></footer>`);
    },
    vault() {
      open(`<header><h2>Personal Vault</h2></header>
        <p>30 slots now. Expand later with gold, never real money.</p>
        <p class="muted">Vault storage is coming with the economy polish pass. Keep valuables in your pack for this vertical slice.</p>
        <footer><button class="btn primary" data-close>Close</button></footer>`);
    },
    stage() {
      const S = G.S();
      const prestige = ['cos_eclipse_cloak', 'cos_astral_sigil', 'cos_mythic_crown']
        .map((id) => ({ id, it: ITEMS[id], owned: countItem(S, id) > 0 || S.flags.prestigeCosmetic === id }))
        .filter((x) => x.owned);
      const rows = prestige.length
        ? prestige.map(({ id, it }) => `<div class="item"><span>${I(iconNameForItem(id, it.icon))}</span>
            <div><b>${it.name}</b><small>${it.title} · no combat power</small></div>
            <button class="btn primary" data-act="useitem" data-arg="${id}">Wear</button></div>`).join('')
        : '<p class="muted">Clear S / SS / SSS gates for a chance at prestige cosmetics.</p>';
      open(`<header><h2>The Stage</h2></header>
        <p>Costumes only. No power. Prestige titles show on your Adventurer Card.</p>
        ${rows}
        <footer><button class="btn primary" data-close>Leave</button></footer>`);
    },
  };
  return api;
}
