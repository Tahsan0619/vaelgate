import { CLASSES, gold, RANK_NAME, ITEMS } from './config.js';
import { currentGoal, hungerState } from './state.js';
import { icon } from './icons.js';

const $ = (id) => document.getElementById(id);

export function createHud() {
  return {
    show(on) { $('hud').classList.toggle('hidden', !on); },
    toast(text, kind = 'info', ms = 3200) {
      const el = document.createElement('div');
      el.className = `toast ${kind}`;
      el.innerHTML = text;
      $('toasts').appendChild(el);
      setTimeout(() => el.remove(), ms);
    },
    prompt(text, sub = '') {
      if (!text) { $('prompt').classList.add('hidden'); return; }
      $('prompt').classList.remove('hidden');
      $('pText').textContent = text;
      $('pSub').textContent = sub || 'Press E to interact';
      const key = $('pKey');
      if (key) key.textContent = 'E';
    },
    sync(S, combatState) {
      const cls = CLASSES[S.classId];
      $('hAvatar').innerHTML = icon(cls.icon, 'ico-lg');
      $('hName').textContent = S.name;
      $('hClass').textContent = S.registered ? `${cls.name} · ${RANK_NAME[S.rank]}` : 'Unregistered';
      $('hRank').textContent = S.rank;
      $('hLevel').textContent = `Lv ${S.level}`;
      $('hGold').textContent = gold(S.gold);
      $('hHp').style.transform = `scaleX(${S.hp / Math.max(1, S.maxHp)})`;
      $('hHpT').textContent = `${Math.ceil(S.hp)}/${Math.ceil(S.maxHp)}`;
      $('hSta').style.transform = `scaleX(${S.sta / Math.max(1, S.maxSta)})`;
      $('hStaT').textContent = `${Math.ceil(S.sta)}/${Math.ceil(S.maxSta)}`;
      $('hMana').style.transform = `scaleX(${S.mana / Math.max(1, S.maxMana)})`;
      $('hManaT').textContent = `${Math.ceil(S.mana)}/${Math.ceil(S.maxMana)}`;
      $('hHunger').style.transform = `scaleX(${S.hunger / 100})`;
      $('hHungerT').textContent = `${Math.ceil(S.hunger)}`;
      const g = currentGoal(S);
      $('gText').textContent = g.text;
      $('gHint').textContent = g.hint;

      const order = S.skillOrder || [0, 1, 2];
      const cds = combatState?.cds || [0, 0, 0];
      const atkCd = combatState?.atkCd || 0;

      const atkSlot = document.querySelector('.slot.atk');
      if (atkSlot) {
        const w = ITEMS[S.equip?.weapon];
        $('skAtk').innerHTML = icon(w?.icon || 'attack');
        atkSlot.classList.toggle('cd', atkCd > 0);
        const cdAtk = $('cdAtk');
        if (cdAtk) cdAtk.textContent = atkCd > 0 ? atkCd.toFixed(1) : '';
      }

      for (let i = 0; i < 3; i++) {
        const real = order[i] ?? i;
        const sk = cls.skills[real];
        const el = document.getElementById('sk' + i);
        const lab = document.getElementById('skLab' + i);
        const cdEl = document.getElementById('cd' + i);
        if (el) el.innerHTML = sk ? icon(sk.icon) : '';
        if (lab) lab.textContent = sk ? sk.name.split(' ')[0] : '';
        const slot = el?.closest('.slot');
        if (slot && sk) {
          slot.title = sk.tip
            ? `${sk.name} (${i + 1}) — ${sk.tip} · CD ${sk.cd}s`
            : `${sk.name} (${i + 1}) · CD ${sk.cd}s`;
          slot.classList.toggle('cd', (cds[i] || 0) > 0);
        }
        if (cdEl) cdEl.textContent = (cds[i] || 0) > 0 ? cds[i].toFixed(1) : '';
      }
      const icoSkills = $('icoSkills');
      if (icoSkills && !icoSkills.dataset.ready) {
        icoSkills.innerHTML = icon('sparkle');
        icoSkills.dataset.ready = '1';
      }
    },
    loc(text) { $('hLoc').textContent = text; },
    goalNav(show, dist, ang) {
      $('gNav').classList.toggle('hidden', !show);
      if (show) {
        $('gDist').textContent = `${Math.round(dist)} m`;
        $('gArrow').style.transform = `rotate(${ang}rad)`;
      }
    },
    floor(show, name, floor, seal) {
      $('floorHud').classList.toggle('hidden', !show);
      if (show) {
        $('fName').textContent = name;
        $('fFloor').textContent = `Floor ${floor} / 5`;
        $('fSeal').textContent = seal;
      }
    },
    boss(show, name, pct) {
      $('bossBar').classList.toggle('hidden', !show);
      if (show) {
        $('bossName').textContent = name;
        $('bossFill').style.transform = `scaleX(${pct})`;
        $('bossPct').textContent = `${Math.ceil(pct * 100)}%`;
      }
    },
    float(x, y, text, kind = '') {
      const el = document.createElement('div');
      el.className = `float ${kind}`;
      el.textContent = text;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      document.getElementById('dmg').appendChild(el);
      setTimeout(() => el.remove(), 900);
    },
    hungerTip(S) {
      return hungerState(S.hunger).label;
    },
  };
}
