import * as THREE from 'three';
import { CLASSES, ITEMS, clamp } from './config.js';
import { effectiveStats } from './state.js';
import { refreshEntityHpBar } from './hpBar.js';

export function createCombat(scene) {
  const fx = new THREE.Group();
  scene.add(fx);
  const telegraphs = [];

  function clearFx() {
    while (fx.children.length) fx.remove(fx.children[0]);
    telegraphs.length = 0;
  }

  function flash(x, z, color = '#fff', s = 1.2, life = 0.25) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.2 * s, 0.7 * s, 16),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.12, z);
    m.userData.life = life;
    fx.add(m);
  }

  function telegraph(x, z, r, life = 1.4, color = '#fa5252') {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(r, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.38, side: THREE.DoubleSide }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.08, z);
    const t = { mesh: m, life, max: life, x, z, r };
    telegraphs.push(t);
    fx.add(m);
    return t;
  }

  function updateFx(dt) {
    for (let i = fx.children.length - 1; i >= 0; i--) {
      const c = fx.children[i];
      if (c.userData.life == null) continue;
      c.userData.life -= dt;
      c.material.opacity = Math.max(0, c.userData.life * 2);
      if (c.userData.life <= 0) fx.remove(c);
    }
    for (let i = telegraphs.length - 1; i >= 0; i--) {
      const t = telegraphs[i];
      t.life -= dt;
      t.mesh.material.opacity = 0.18 + 0.28 * (t.life / t.max);
      t.mesh.scale.setScalar(1 + (1 - t.life / t.max) * 0.08);
      if (t.life <= 0) { fx.remove(t.mesh); telegraphs.splice(i, 1); }
    }
  }

  function applyPlayerHit(S, raw, onHitPlayer) {
    let dmg = raw;
    if (S.buffs.guard) dmg *= 0.35; // Iron Guard: 65% DR
    if (S.buffs.parry > 0) {
      dmg = 0;
      S.buffs.parry = 0;
      S.statsRun.mitigation += Math.max(20, Math.round(raw));
      flash(S._px || 0, S._pz || 0, '#ffd43b', 1.6, 0.35);
    }
    const dealt = dmg <= 0 ? 0 : Math.max(1, Math.round(dmg - effectiveStats(S).def * 0.3));
    if (dealt > 0) {
      S.hp -= dealt;
      S.statsRun.mitigation += Math.round(raw - dealt);
      onHitPlayer?.(dealt);
    } else if (raw > 0) {
      S.statsRun.mitigation += Math.round(raw);
      onHitPlayer?.(0);
    }
    return dealt;
  }

  function playerAttack(S, player, run, skillIndex = -1) {
    const cls = CLASSES[S.classId];
    const stats = effectiveStats(S);
    const skill = skillIndex >= 0 ? cls.skills[skillIndex] : null;
    const basic = !skill;
    const range = basic ? 2.3 : skill.range || 2.3;
    const type = basic
      ? (ITEMS[S.equip.weapon]?.type || 'slash')
      : skill.type;
    let power = basic ? 0.85 : (skill.dmg || 0); // basic slightly softer so trash isn't one-shot
    if (skill?.cost?.sta && S.sta < skill.cost.sta) return { ok: false, why: 'Not enough stamina' };
    if (skill?.cost?.mana && S.mana < skill.cost.mana) return { ok: false, why: 'Not enough mana' };
    if (skill?.cost?.sta) S.sta -= skill.cost.sta;
    if (skill?.cost?.mana) S.mana -= skill.cost.mana;

    if (skill?.type === 'heal') {
      const amt = skill.heal || 25;
      S.hp = clamp(S.hp + amt, 0, S.maxHp);
      S.statsRun.healing += amt;
      flash(player.x, player.z, '#69db7c', 1.4, 0.4);
      return { ok: true, heal: amt, mode: 'cast', tip: skill.tip || `Healed ${amt}` };
    }
    if (skill?.type === 'buff') {
      if (skill.guard) {
        S.buffs.guard = skill.guard;
        S.buffs.guardHeal = skill.guardHeal || 0;
      }
      if (skill.parry) S.buffs.parry = skill.parry;
      if (skill.atkBuff) { S.buffs.atk = skill.atkBuff[0]; S.buffs.atkT = skill.atkBuff[1]; }
      flash(player.x, player.z, skill.guard ? '#4c6ef5' : '#ffd43b', 1.4, 0.4);
      return {
        ok: true, buff: true, mode: skill.guard ? 'guard' : 'cast',
        tip: skill.tip || (skill.guard ? 'Iron Guard up' : skill.parry ? 'Parry ready' : 'Buffed'),
      };
    }
    if (skill?.type === 'cleanse') {
      const had = !!(S.buffs.poison || S.buffs.curse || S.debuffs?.slow);
      delete S.buffs.poison; delete S.buffs.curse;
      if (S.debuffs) delete S.debuffs.slow;
      const amt = skill.heal || (had ? 12 : 8);
      S.hp = clamp(S.hp + amt, 0, S.maxHp);
      S.statsRun.healing += amt;
      S.statsRun.utility += 1;
      flash(player.x, player.z, '#a5d8ff', 1.3, 0.35);
      return { ok: true, cleanse: true, heal: amt, mode: 'cast', tip: skill.tip || `Cleansed · +${amt} HP` };
    }
    if (skill?.type === 'scout') {
      if (skill.atkBuff) { S.buffs.atk = skill.atkBuff[0]; S.buffs.atkT = skill.atkBuff[1]; }
      flash(player.x, player.z, '#82c91e', 1.5, 0.4);
      S.statsRun.utility += 1;
      return { ok: true, scout: true, mode: 'cast', tip: skill.tip || 'Scout ready' };
    }
    if (skill?.type === 'dash') {
      player.x += Math.sin(player.ry) * (skill.dash || 4);
      player.z += Math.cos(player.ry) * (skill.dash || 4);
      flash(player.x, player.z, '#212529', 1, 0.2);
      return { ok: true, dash: true, mode: 'run', tip: skill.tip || 'Shadow Step' };
    }
    if (skill?.taunt) {
      const hits = [];
      const aoe = skill.aoe || 6;
      const targets = [...run.enemies.filter((e) => e.alive)];
      if (run.boss?.alive) targets.push(run.boss);
      for (const e of targets) {
        const d = Math.hypot(e.x - player.x, e.z - player.z);
        if (d > aoe) continue;
        e.target = 'player';
        e.tauntT = skill.taunt;
        if (skill.vulnerable) e.vulnerableT = skill.vulnerable;
        if (skill.interrupt) {
          e.windup = 0;
          e.state = 'chase';
          e.tele = null;
          e.stunned = Math.max(e.stunned || 0, 0.55);
          e.fleeT = 0;
        }
        // Pull skirmishers / ranged in a bit
        if (d > 1.5) {
          const ang = Math.atan2(player.x - e.x, player.z - e.z);
          e.x += Math.sin(ang) * Math.min(1.8, d * 0.35);
          e.z += Math.cos(ang) * Math.min(1.8, d * 0.35);
          if (e.mesh) e.mesh.position.set(e.x, 0, e.z);
        }
        if (skill.dmg) {
          let dmg = Math.max(1, Math.round(stats.atk * skill.dmg - (e.defStat || e.def?.def || 0) * 0.25));
          e.hp -= dmg;
          S.statsRun.damage += dmg;
          refreshEntityHpBar(e);
          hits.push({ e, dmg, crit: false, type: skill.type || 'blunt', weakHit: false });
          flash(e.x, e.z, '#4c6ef5', 1.1, 0.25);
        }
      }
      // Brief self brace so War Cry isn't a paper skill
      S.buffs.guard = Math.max(S.buffs.guard || 0, 2.2);
      S.statsRun.utility += 1;
      flash(player.x, player.z, '#4c6ef5', 2.2, 0.4);
      return { ok: true, hits, taunt: true, mode: 'guard', tip: skill.tip || 'War Cry' };
    }

    const hits = [];
    const targets = [...run.enemies.filter((e) => e.alive)];
    if (run.boss?.alive) targets.push(run.boss);

    const aoe = skill?.aoe || 0;
    for (const e of targets) {
      const d = Math.hypot(e.x - player.x, e.z - player.z);
      const inFront = (() => {
        const ang = Math.atan2(e.x - player.x, e.z - player.z);
        let diff = ang - player.ry;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return Math.abs(diff) < 1.2;
      })();
      if (aoe) {
        if (d > aoe) continue;
      } else if (skill?.projectile) {
        if (d > range || !inFront) continue;
      } else {
        if (d > range || !inFront) continue;
      }

      let dmg = (type === 'fire' || type === 'ice' || type === 'lightning' || type === 'magic' || type === 'holy' || type === 'dark'
        ? stats.mag : stats.atk) * (basic ? 1 : power);
      if (basic) dmg *= power;
      dmg *= stats.dmgMul || 1;

      let crit = Math.random() < (stats.crit + (skill?.critBonus || 0));
      if (crit) dmg *= 1.75;

      if (skill?.backBonus) {
        const toMe = Math.atan2(player.x - e.x, player.z - e.z);
        let facing = (e.ry || 0) - toMe;
        while (facing > Math.PI) facing -= Math.PI * 2;
        while (facing < -Math.PI) facing += Math.PI * 2;
        if (Math.abs(facing) > 2.2) dmg *= 1 + skill.backBonus;
      }

      const W = e.def?.weak || [];
      const St = e.def?.strong || [];
      const Im = e.def?.immune || [];
      if (Im.includes(type)) dmg *= 0.05;
      else if (W.includes(type) || (type === 'magic' && W.includes('magic'))) dmg *= 1.55;
      else if (St.includes(type)) dmg *= 0.55;

      if (e.id === 'gravenhelm' && e.shieldUp) {
        const toBoss = Math.atan2(player.x - e.x, player.z - e.z);
        let facing = (e.ry || 0) - toBoss;
        while (facing > Math.PI) facing -= Math.PI * 2;
        while (facing < -Math.PI) facing += Math.PI * 2;
        const frontal = Math.abs(facing) < 1.3;
        if (frontal && type !== 'blunt' && type !== 'lightning') dmg *= 0.15;
        else {
          if (!frontal || type === 'blunt' || type === 'lightning') run.objectives.shieldBreak = true;
          if (!frontal) dmg *= 1.35;
        }
      }

      if (e.vulnerableT > 0) dmg *= 1.3;
      dmg = Math.max(1, Math.round(dmg - (e.defStat || e.def?.def || 0) * 0.4));
      e.hp -= dmg;
      // interrupt windups on heavy hits
      if (dmg >= 12 && e.windup > 0) e.windup = Math.max(0, e.windup - 0.35);
      S.statsRun.damage += dmg;
      flash(e.x, e.z, crit ? '#ffd43b' : '#fff', 1, 0.2);
      refreshEntityHpBar(e);
      hits.push({ e, dmg, crit, type, weakHit: W.includes(type) });

      if (skill?.dot) e.dot = { dmg: skill.dot[0], t: skill.dot[1] };
      if (skill?.slow) e.slowT = skill.slow;
      if (skill?.stun) e.stunned = skill.stun;
      if (skill?.snare) e.snareT = skill.snare;
    }

    // Snare Trap: always plant a lingering root zone even if nobody was hit yet
    if (skill?.type === 'trap') {
      const tx = player.x + Math.sin(player.ry) * 1.6;
      const tz = player.z + Math.cos(player.ry) * 1.6;
      const zone = telegraph(tx, tz, skill.aoe || 3, skill.snare || 3.5, '#82c91e');
      zone.x = tx; zone.z = tz;
      run.traps = run.traps || [];
      run.traps.push({
        x: tx, z: tz, r: skill.aoe || 3, life: skill.snare || 3.5,
        snare: skill.snare || 3.5, dmg: Math.round(stats.atk * (skill.dmg || 0.5)),
        mesh: zone.mesh,
      });
      flash(tx, tz, '#82c91e', 1.4, 0.45);
    }

    return {
      ok: true, hits, mode: skill?.projectile ? 'cast' : 'attack', type,
      tip: skill?.tip || null,
    };
  }

  function enemyRole(e) {
    return e.def?.role || (e.def?.ranged ? 'ranged' : 'melee');
  }

  function updateEnemies(dt, S, player, run, onHitPlayer) {
    for (const e of run.enemies) {
      if (!e.alive) continue;
      e.t += dt;
      if (e.hitT > 0) e.hitT -= dt;
      if (e.fleeT > 0) e.fleeT -= dt;
      if (e.tauntT > 0) e.tauntT -= dt;
      if (e.vulnerableT > 0) e.vulnerableT -= dt;
      if (e.stunned > 0) {
        e.stunned -= dt;
        e.mesh.position.set(e.x, 0, e.z);
        refreshEntityHpBar(e);
        continue;
      }
      if (e.snareT > 0) e.snareT -= dt;
      if (e.slowT > 0) e.slowT -= dt;
      if (e.dot) {
        e.dot.t -= dt;
        if (Math.floor(e.t) !== Math.floor(e.t - dt)) e.hp -= e.dot.dmg;
        if (e.dot.t <= 0) e.dot = null;
      }

      const role = enemyRole(e);
      const dx = player.x - e.x, dz = player.z - e.z;
      const d = Math.hypot(dx, dz) || 1;
      const spd = e.spd * 0.5 * (e.snareT > 0 ? 0.25 : 1) * (e.slowT > 0 ? 0.45 : 1);
      e.ry = Math.atan2(dx, dz);

      // War Cry forces everyone into melee pressure
      const taunted = e.tauntT > 0;
      const preferMin = taunted ? 0 : (role === 'ranged' || role === 'support' ? 4.0 : role === 'skirmish' ? 1.2 : 0);
      const attackRange = taunted ? 2.0 : (role === 'ranged' || role === 'support' ? 7.2 : role === 'skirmish' ? 2.1 : 1.75);
      const teleR = role === 'ranged' || role === 'support' ? 1.25 : role === 'skirmish' ? 1.55 : 1.9;
      const teleColor = role === 'support' ? '#94d82d' : role === 'ranged' ? '#74c0fc' : (e.elite ? '#ff6b6b' : '#fa5252');
      if (taunted) e.fleeT = 0;

      if (e.state === 'windup') {
        e.windup -= dt;
        if (e.windup <= 0) {
          e.state = 'chase';
          e.hitT = (role === 'ranged' || role === 'support') ? 1.7 : role === 'skirmish' ? 1.05 : 1.25;
          const hitR = (role === 'ranged' || role === 'support') ? 1.35 : 2.05;
          const tx = e.tele?.x ?? player.x;
          const tz = e.tele?.z ?? player.z;
          if (Math.hypot(player.x - tx, player.z - tz) < hitR) {
            let dmg = e.atk * (e.elite ? 1.15 : 1);
            if (role === 'support') {
              // Spore cloud: lighter hit + slow
              dmg *= 0.7;
              player.slowT = Math.max(player.slowT || 0, 1.6);
              S.debuffs = S.debuffs || {};
              S.debuffs.slow = Math.max(S.debuffs.slow || 0, 1.6);
            }
            applyPlayerHit(S, dmg, onHitPlayer);
            flash(player.x, player.z, teleColor, 1.2, 0.25);
          }
          // Support also tops up a nearby ally
          if (role === 'support') {
            let best = null; let bestD = 9;
            for (const a of run.enemies) {
              if (!a.alive || a === e) continue;
              const ad = Math.hypot(a.x - e.x, a.z - e.z);
              if (ad < bestD && a.hp < a.maxHp) { best = a; bestD = ad; }
            }
            if (best) {
              best.hp = Math.min(best.maxHp, best.hp + Math.round(best.maxHp * 0.12));
              flash(best.x, best.z, '#69db7c', 1.1, 0.35);
              refreshEntityHpBar(best);
            }
          }
          if (role === 'skirmish') e.fleeT = 0.85;
          e.tele = null;
        }
        e.mesh.position.set(e.x, 0, e.z);
        e.mesh.rotation.y = e.ry;
        refreshEntityHpBar(e);
        continue;
      }

      // Movement
      if (role === 'skirmish' && e.fleeT > 0) {
        e.x -= (dx / d) * spd * 1.35 * dt;
        e.z -= (dz / d) * spd * 1.35 * dt;
      } else if ((role === 'ranged' || role === 'support') && d < preferMin) {
        e.x -= (dx / d) * spd * 1.1 * dt;
        e.z -= (dz / d) * spd * 1.1 * dt;
      } else if (d > attackRange) {
        e.x += (dx / d) * spd * dt;
        e.z += (dz / d) * spd * dt;
      } else if (e.hitT <= 0) {
        e.state = 'windup';
        e.windup = e.elite ? 0.95 : (role === 'ranged' || role === 'support' ? 0.85 : 0.7);
        const lead = (role === 'ranged' || role === 'support') ? 0.15 : 0.4;
        const aimX = player.x + (dx / d) * lead;
        const aimZ = player.z + (dz / d) * lead;
        e.tele = telegraph(aimX, aimZ, teleR, e.windup, teleColor);
        e.tele.x = aimX; e.tele.z = aimZ;
      }

      e.mesh.position.set(e.x, 0, e.z);
      e.mesh.rotation.y = e.ry;
      refreshEntityHpBar(e);
    }
  }

  function updateBoss(dt, S, player, run, onHitPlayer, reveal) {
    const b = run.boss;
    if (!b?.alive) return;
    b.t += dt;
    refreshEntityHpBar(b);
    if (b.tauntT > 0) b.tauntT -= dt;
    if (b.vulnerableT > 0) b.vulnerableT -= dt;
    if (b.snareT > 0) b.snareT -= dt;
    if (b.stunned > 0) {
      b.stunned -= dt;
      b.mesh.position.set(b.x, 0.15 * Math.sin(b.t * 20), b.z);
      return;
    }
    const dx = player.x - b.x, dz = player.z - b.z;
    const d = Math.hypot(dx, dz) || 1;
    b.ry = Math.atan2(dx, dz);
    const spd = b.spd * 0.78 * (b.snareT > 0 ? 0.35 : 1);
    if (d > 2.2 && !b.pending && !b.burrowing) {
      b.x += (dx / d) * spd * dt;
      b.z += (dz / d) * spd * dt;
    }

    const pct = b.hp / b.maxHp;
    const kit = b.kit || b.def?.kit || [];
    const has = (k) => kit.includes(k);

    // --- Floor / F bosses ---
    if (b.id === 'sporebrute') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('puddle')) {
        b.nextSkill = 2.4;
        b.pending = 'puddle';
        b.windup = 1.0;
        b.atkTele = telegraph(player.x, player.z, 2.0, 1.0, '#82c91e');
        b.atkTele.x = player.x; b.atkTele.z = player.z;
      }
    }

    if (b.id === 'ratking') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('burrow')) {
        b.nextSkill = 3.0;
        b.pending = 'burrow';
        b.windup = 0.85;
        b.atkTele = telegraph(player.x, player.z, 1.8, 0.85, '#868e96');
        b.atkTele.x = player.x; b.atkTele.z = player.z;
        reveal?.('burrow');
      }
    }

    if (b.id === 'thornmatron') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('root')) {
        b.nextSkill = 2.8;
        b.pending = 'root';
        b.windup = 1.2;
        b.atkTele = telegraph(player.x, player.z, 2.2, 1.2, '#fab005');
        b.atkTele.x = player.x; b.atkTele.z = player.z;
        reveal?.('root');
      }
    }

    if (b.id === 'gobwarcap') {
      if (pct <= 0.5 && !b.callDone && has('call')) {
        b.callDone = true;
        reveal?.('call');
        for (let i = 0; i < 2; i++) {
          const ang = (i / 2) * Math.PI * 2;
          run.spawnEnemy('goblin', b.x + Math.cos(ang) * 3, b.z + Math.sin(ang) * 3, false);
        }
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 2.2;
        b.pending = 'bash';
        b.windup = 0.9;
        b.atkTele = telegraph(player.x, player.z, 2.0, 0.9, '#37b24d');
        b.atkTele.x = player.x; b.atkTele.z = player.z;
      }
    }

    if (b.id === 'scrapsentinel') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('bash')) {
        b.nextSkill = 2.3;
        b.pending = 'bash';
        b.windup = 0.95;
        b.atkTele = telegraph(player.x, player.z, 2.1, 0.95, '#adb5bd');
        b.atkTele.x = player.x; b.atkTele.z = player.z;
        reveal?.('bash');
      }
    }

    if (b.id === 'veincrawler') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('acid')) {
        b.nextSkill = 2.5;
        b.pending = 'acid';
        b.windup = 1.1;
        b.atkTele = telegraph(player.x, player.z, 2.2, 1.1, '#e67700');
        b.atkTele.x = player.x; b.atkTele.z = player.z;
        reveal?.('acid');
      }
    }

    if (b.id === 'batmatron') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('screech')) {
        b.nextSkill = 2.7;
        b.pending = 'screech';
        b.windup = 1.15;
        telegraph(b.x, b.z, 4.2, 1.15, '#fa5252');
        reveal?.('screech');
      }
    }

    if (b.id === 'pickwraith') {
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending && has('line')) {
        b.nextSkill = 2.6;
        b.pending = 'line';
        b.windup = 1.0;
        const ang = Math.atan2(player.x - b.x, player.z - b.z);
        b.chargeAng = ang;
        const tx = b.x + Math.sin(ang) * 6;
        const tz = b.z + Math.cos(ang) * 6;
        b.atkTele = telegraph(tx, tz, 1.6, 1.0, '#fa5252');
        b.atkTele.x = tx; b.atkTele.z = tz;
        reveal?.('line');
      }
    }

    // --- Gloomcap (full floor 5) ---
    if (b.id === 'gloomcap') {
      if (pct <= 0.5 && !b.splitDone && has('split')) {
        b.splitDone = true;
        reveal?.('split');
        for (let i = 0; i < 3; i++) {
          const ang = (i / 3) * Math.PI * 2;
          run.spawnEnemy('slime', b.x + Math.cos(ang) * 3.2, b.z + Math.sin(ang) * 3.2, false);
        }
        b.nextSkill = 1.2;
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 2.2 + Math.random();
        if (has('wall') && Math.random() < 0.35) {
          b.pending = 'wall';
          b.windup = 1.0;
          telegraph(b.x, b.z, 3.4, 1.0, '#2f9e44');
          reveal?.('wall');
        } else {
          b.pending = 'spore';
          b.windup = 1.2;
          const tx = player.x, tz = player.z;
          b.atkTele = telegraph(tx, tz, 2.5, 1.2, '#82c91e');
          b.atkTele.x = tx; b.atkTele.z = tz;
        }
      }
    }

    // --- Grubnok (full floor 5) ---
    if (b.id === 'grubnok') {
      if (pct <= 0.6 && !b.caveinDone && has('cavein')) {
        b.caveinDone = true;
        reveal?.('cavein');
        run.objectives.cavein = true;
        for (const s of run.supports) s.mesh.visible = true;
        b.pending = 'cavein';
        b.windup = 2.2;
        telegraph(player.x, player.z, 4.0, 2.2, '#fab005');
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 1.9;
        const roll = Math.random();
        if (has('charge') && roll < 0.33) {
          b.pending = 'charge';
          b.windup = 0.95;
          const ang = Math.atan2(player.x - b.x, player.z - b.z);
          b.chargeAng = ang;
          const tx = b.x + Math.sin(ang) * 7;
          const tz = b.z + Math.cos(ang) * 7;
          b.atkTele = telegraph(tx, tz, 1.7, 0.95, '#fa5252');
          b.atkTele.x = tx; b.atkTele.z = tz;
          reveal?.('charge');
        } else if (has('rock') && roll < 0.66) {
          b.pending = 'rock';
          b.windup = 1.05;
          b.atkTele = telegraph(player.x, player.z, 2.0, 1.05, '#868e96');
          b.atkTele.x = player.x; b.atkTele.z = player.z;
        } else {
          b.pending = 'slam';
          b.windup = 1.0;
          b.atkTele = telegraph(player.x, player.z, 2.3, 1.0, '#ff922b');
          b.atkTele.x = player.x; b.atkTele.z = player.z;
        }
      }
    }

    // --- Vorren ---
    if (b.id === 'vorren') {
      if (pct <= 0.35 && !b.chainDone) {
        b.chainDone = true;
        reveal?.('chains');
        b.pending = 'chains';
        b.windup = 1.5;
        telegraph(b.x, b.z, 5.5, 1.5, '#be4bdb');
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 2.0;
        b.pending = 'bone';
        b.windup = 1.0;
        const tx = player.x, tz = player.z;
        b.atkTele = telegraph(tx, tz, 2.0, 1.0, '#dee2e6');
        b.atkTele.x = tx; b.atkTele.z = tz;
      }
    }

    // --- Cinderjaw ---
    if (b.id === 'cinderjaw') {
      b.fightT = (b.fightT || 0) + dt;
      if (b.fightT > 240 && !b.enraged) {
        b.enraged = true;
        reveal?.('enrage');
        b.spd *= 1.35;
        b.atk *= 1.2;
      }
      const howlAt = [0.75, 0.5, 0.25];
      b.howls = b.howls || 0;
      if (b.howls < howlAt.length && pct <= howlAt[b.howls]) {
        b.howls += 1;
        reveal?.('howl');
        run.objectives.howl = true;
        for (let i = 0; i < 2; i++) {
          const ang = Math.random() * Math.PI * 2;
          run.spawnEnemy('cinderwolf', b.x + Math.cos(ang) * 3.5, b.z + Math.sin(ang) * 3.5, false);
        }
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = b.enraged ? 1.5 : 2.2;
        b.pending = 'bite';
        b.windup = 0.85;
        const tx = player.x, tz = player.z;
        b.atkTele = telegraph(tx, tz, 2.3, 0.85, '#fa5252');
        b.atkTele.x = tx; b.atkTele.z = tz;
      }
    }

    // --- Nerisha ---
    if (b.id === 'nerisha') {
      if ((pct <= 0.7 && !b.flood1) || (pct <= 0.35 && !b.flood2)) {
        if (pct <= 0.7 && !b.flood1) b.flood1 = true;
        if (pct <= 0.35 && !b.flood2) b.flood2 = true;
        reveal?.('flood');
        run.objectives.flood = true;
        b.pending = 'flood';
        b.windup = 1.8;
        telegraph(b.x, b.z, 7, 1.8, '#1c7ed6');
        // mark pads from mid/boss room
        const br = run.bossRoom || { x: b.x, z: b.z };
        b.pads = [[-3, -3], [3, -3], [-3, 3], [3, 3]].map(([ox, oz]) => ({ x: br.x + ox, z: br.z + oz }));
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 2.1;
        b.pending = 'tidehit';
        b.windup = 1.0;
        const tx = player.x, tz = player.z;
        b.atkTele = telegraph(tx, tz, 2.1, 1.0, '#7048e8');
        b.atkTele.x = tx; b.atkTele.z = tz;
      }
    }

    // --- Gravenhelm ---
    if (b.id === 'gravenhelm') {
      if (pct <= 0.4 && !b.overclock) {
        b.overclock = true;
        reveal?.('overclock');
        b.spd *= 1.5;
        b.atk *= 1.15;
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        if (Math.random() < 0.45 && !b.shieldUp) {
          b.shieldUp = true;
          reveal?.('shieldwall');
          run.objectives.shield = true;
          b.pending = 'shield';
          b.windup = 0.6;
          telegraph(b.x, b.z, 2.5, 0.6, '#adb5bd');
        } else {
          b.nextSkill = b.overclock ? 1.4 : 2.0;
          b.pending = 'slamB';
          b.windup = 1.15;
          const tx = player.x, tz = player.z;
          b.atkTele = telegraph(tx, tz, 2.4, 1.15, '#868e96');
          b.atkTele.x = tx; b.atkTele.z = tz;
        }
      }
      // shield facing: reduce frontal damage flag for playerAttack to check
      if (b.shieldUp) b.shieldT = (b.shieldT || 4) - dt;
      if (b.shieldUp && b.shieldT <= 0) { b.shieldUp = false; b.shieldT = 0; b.nextSkill = 1.2; }
    }

    // --- Skyrend ---
    if (b.id === 'skyrend') {
      if (pct <= 0.25 && !b.fury) {
        b.fury = true;
        reveal?.('fury');
        b.spd *= 1.25;
        b.atk *= 1.15;
      }
      b.packs = b.packs || 0;
      const packAt = [0.66, 0.33];
      if (b.packs < packAt.length && pct <= packAt[b.packs]) {
        b.packs += 1;
        reveal?.('pack');
        run.objectives.pack = true;
        for (let i = 0; i < 2; i++) {
          const ang = (i / 2) * Math.PI * 2 + Math.random();
          run.spawnEnemy(i % 2 ? 'galehawk' : 'thunderling', b.x + Math.cos(ang) * 4, b.z + Math.sin(ang) * 4, true);
        }
      }
      // constant wind shove in fury
      if (b.fury) {
        const ang = Math.atan2(player.x - b.x, player.z - b.z);
        player.x += Math.sin(ang) * 2.2 * dt;
        player.z += Math.cos(ang) * 2.2 * dt;
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = b.fury ? 1.35 : 2.0;
        if (Math.random() < 0.42) {
          b.pending = 'gale';
          b.windup = 1.2;
          reveal?.('gale');
          telegraph(b.x, b.z, 6.5, 1.2, '#748ffc');
        } else {
          b.pending = 'bolt';
          b.windup = b.fury ? 0.75 : 1.05;
          reveal?.('bolt');
          const tx = player.x, tz = player.z;
          b.atkTele = telegraph(tx, tz, 2.0, b.windup, '#ffd43b');
          b.atkTele.x = tx; b.atkTele.z = tz;
        }
      }
    }

    // --- Nyxara ---
    if (b.id === 'nyxara') {
      if (pct <= 0.5 && !b.day) {
        b.day = true;
        reveal?.('flip');
        run.objectives.flip = true;
        b.spd *= 1.1;
        flash(b.x, b.z, '#ffd43b', 3, 0.5);
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 1.9;
        if (!b.day) {
          b.pending = 'void';
          b.windup = 1.25;
          reveal?.('void');
          const tx = player.x, tz = player.z;
          b.atkTele = telegraph(tx, tz, 2.3, 1.25, '#212529');
          b.atkTele.x = tx; b.atkTele.z = tz;
        } else {
          b.pending = 'flare';
          b.windup = 1.15;
          reveal?.('flare');
          const tx = player.x, tz = player.z;
          b.atkTele = telegraph(tx, tz, 2.5, 1.15, '#ffd43b');
          b.atkTele.x = tx; b.atkTele.z = tz;
        }
      }
    }

    // --- Vorth ---
    if (b.id === 'vorth') {
      b.meteors = b.meteors || 0;
      const metAt = [0.7, 0.4];
      if (b.meteors < metAt.length && pct <= metAt[b.meteors]) {
        b.meteors += 1;
        reveal?.('meteor');
        run.objectives.meteor = true;
        b.pending = 'meteor';
        b.windup = 1.6;
        for (let i = 0; i < 4; i++) {
          const ang = Math.random() * Math.PI * 2;
          const r = 2 + Math.random() * 5;
          telegraph(b.x + Math.cos(ang) * r, b.z + Math.sin(ang) * r, 1.6, 1.6, '#fa5252');
        }
        telegraph(player.x, player.z, 1.8, 1.6, '#ff922b');
        b.atkTele = { x: player.x, z: player.z };
      }
      // expanding slag ring
      b.slagR = Math.min(7.5, (b.slagR || 1.5) + dt * 0.35);
      if (Math.hypot(player.x - b.x, player.z - b.z) < b.slagR * 0.55) {
        // tick handled lightly via nextSkill pressure
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = 2.0;
        if (Math.random() < 0.4) {
          b.pending = 'anvil';
          b.windup = 1.2;
          reveal?.('anvil');
          const tx = player.x, tz = player.z;
          b.atkTele = telegraph(tx, tz, 2.4, 1.2, '#fab005');
          b.atkTele.x = tx; b.atkTele.z = tz;
        } else {
          b.pending = 'slaghit';
          b.windup = 1.0;
          reveal?.('slag');
          telegraph(b.x, b.z, Math.max(2.5, b.slagR * 0.6), 1.0, '#e67700');
        }
      }
    }

    // --- Vael ---
    if (b.id === 'vael') {
      if (pct <= 0.6 && !b.mirrored) {
        b.mirrored = true;
        reveal?.('mirror');
        run.objectives.mirror = true;
        run.spawnEnemy('mythicshade', b.x + 4, b.z, true);
        run.spawnEnemy('prismling', b.x - 4, b.z, true);
      }
      if (pct <= 0.3 && !b.ascend) {
        b.ascend = true;
        reveal?.('ascend');
        run.objectives.ascend = true;
        b.spd *= 1.3;
        b.atk *= 1.2;
        for (let i = 0; i < 2; i++) {
          const ang = (i / 2) * Math.PI * 2;
          run.spawnEnemy('crownward', b.x + Math.cos(ang) * 4.5, b.z + Math.sin(ang) * 4.5, true);
        }
      }
      b.nextSkill -= dt;
      if (b.nextSkill <= 0 && !b.pending) {
        b.nextSkill = b.ascend ? 1.25 : 1.8;
        b.pending = 'prism';
        b.windup = b.ascend ? 0.8 : 1.1;
        reveal?.('prism');
        const ang = Math.atan2(player.x - b.x, player.z - b.z);
        const tx = b.x + Math.sin(ang) * 4;
        const tz = b.z + Math.cos(ang) * 4;
        b.atkTele = telegraph(tx, tz, 1.8, b.windup, '#be4bdb');
        b.atkTele.x = tx; b.atkTele.z = tz;
        b.beamAng = ang;
      }
    }

    if (b.windup > 0 && b.pending) {
      b.windup -= dt;
      if (b.windup <= 0) {
        const kind = b.pending;
        b.pending = null;
        if (kind === 'cavein') {
          const under = run.supports.some((s) => Math.hypot(s.x - player.x, s.z - player.z) < 1.9);
          if (!under) applyPlayerHit(S, 32 * run.diff.dmg, onHitPlayer);
          else run.objectives.survivedCavein = true;
          b.stunned = 2.6;
          reveal?.('stun');
          for (const s of run.supports) s.mesh.visible = false;
        } else if (kind === 'spore' || kind === 'puddle' || kind === 'acid') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          const r = kind === 'acid' ? 2.3 : 2.5;
          if (Math.hypot(player.x - tx, player.z - tz) < r) {
            applyPlayerHit(S, b.atk * (kind === 'acid' ? 1.05 : 0.9), onHitPlayer);
            S.buffs.poison = { dmg: kind === 'acid' ? 4 : 3, t: 6 };
          }
          flash(tx, tz, kind === 'acid' ? '#e67700' : '#82c91e', 2.2, 0.4);
        } else if (kind === 'wall') {
          const away = Math.atan2(player.x - b.x, player.z - b.z);
          if (Math.hypot(player.x - b.x, player.z - b.z) < 3.6) {
            player.x += Math.sin(away) * 3.2;
            player.z += Math.cos(away) * 3.2;
            applyPlayerHit(S, b.atk * 0.7, onHitPlayer);
          }
          flash(b.x, b.z, '#2f9e44', 3, 0.4);
        } else if (kind === 'burrow') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          b.x = tx; b.z = tz;
          if (Math.hypot(player.x - tx, player.z - tz) < 2.0) {
            applyPlayerHit(S, b.atk * 1.15, onHitPlayer);
          }
          flash(tx, tz, '#868e96', 2, 0.35);
        } else if (kind === 'root') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          if (Math.hypot(player.x - tx, player.z - tz) < 2.3) {
            applyPlayerHit(S, b.atk * 0.85, onHitPlayer);
            player.rooted = 1.4;
          }
          flash(tx, tz, '#fab005', 2.1, 0.35);
        } else if (kind === 'bash' || kind === 'rock') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          if (Math.hypot(player.x - tx, player.z - tz) < 2.2) {
            applyPlayerHit(S, b.atk * (kind === 'bash' ? 1.1 : 1.0), onHitPlayer);
          }
          flash(tx, tz, '#fff', 1.8, 0.3);
        } else if (kind === 'screech') {
          if (Math.hypot(player.x - b.x, player.z - b.z) < 4.3) {
            applyPlayerHit(S, b.atk * 0.8, onHitPlayer);
            player.stunned = 0.7;
          }
          flash(b.x, b.z, '#fa5252', 3.2, 0.4);
        } else if (kind === 'line' || kind === 'charge') {
          const ang = b.chargeAng ?? Math.atan2(player.x - b.x, player.z - b.z);
          b.x += Math.sin(ang) * 6.5;
          b.z += Math.cos(ang) * 6.5;
          // clamp loosely to boss room if present
          if (run.bossRoom) {
            const br = run.bossRoom;
            b.x = Math.max(br.x - br.w / 2 + 1.5, Math.min(br.x + br.w / 2 - 1.5, b.x));
            b.z = Math.max(br.z - br.d / 2 + 1.5, Math.min(br.z + br.d / 2 - 1.5, b.z));
          }
          const dBoss = Math.hypot(player.x - b.x, player.z - b.z);
          const px = b.x - Math.sin(ang) * 3;
          const pz = b.z - Math.cos(ang) * 3;
          const off = Math.hypot(player.x - px, player.z - pz);
          if (off < 1.8 || dBoss < 2.2) {
            applyPlayerHit(S, b.atk * 1.2, onHitPlayer);
          }
          flash(b.x, b.z, '#fa5252', 2.2, 0.35);
        } else if (kind === 'slam' || kind === 'bone') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          const r = kind === 'slam' ? 2.3 : 2.1;
          if (Math.hypot(player.x - tx, player.z - tz) < r) {
            applyPlayerHit(S, b.atk * (kind === 'slam' ? 1.2 : 1.0), onHitPlayer);
          }
          if (kind === 'slam' && b.id === 'grubnok') b.stunned = 1.6;
          flash(tx, tz, '#fff', 1.8, 0.3);
        } else if (kind === 'chains') {
          const pull = 0.55;
          player.x += (b.x - player.x) * pull;
          player.z += (b.z - player.z) * pull;
          if (Math.hypot(player.x - b.x, player.z - b.z) < 3.2) {
            applyPlayerHit(S, b.atk * 1.1, onHitPlayer);
          }
          flash(b.x, b.z, '#be4bdb', 3, 0.45);
        } else if (kind === 'bite' || kind === 'slamB' || kind === 'tidehit') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          const r = kind === 'slamB' ? 2.5 : 2.3;
          if (Math.hypot(player.x - tx, player.z - tz) < r) {
            applyPlayerHit(S, b.atk * (kind === 'slamB' ? 1.25 : 1), onHitPlayer);
            if (kind === 'tidehit' || b.id === 'nerisha') S.buffs.poison = { dmg: 3, t: 5 };
            if (kind === 'bite' && b.enraged) S.buffs.poison = { dmg: 2, t: 4 };
          }
          flash(tx, tz, '#fff', 1.8, 0.3);
        } else if (kind === 'flood') {
          const onPad = (b.pads || []).some((p) => Math.hypot(player.x - p.x, player.z - p.z) < 1.5);
          if (!onPad) {
            applyPlayerHit(S, b.atk * 0.8, onHitPlayer);
            b.hp = Math.min(b.maxHp, b.hp + Math.round(b.maxHp * 0.04));
            flash(player.x, player.z, '#1c7ed6', 1.5, 0.35);
          } else {
            flash(player.x, player.z, '#69db7c', 1.2, 0.3);
          }
        } else if (kind === 'shield') {
          b.shieldT = 5;
          b.nextSkill = 1.5;
          flash(b.x, b.z, '#adb5bd', 2, 0.4);
        } else if (kind === 'gale') {
          const nearPillar = (run.pillars || []).some((p) => Math.hypot(p.x - player.x, p.z - player.z) < 1.8)
            || (run.bossRoom && (() => {
              // brace on arena ring pillars placed by decor
              for (let i = 0; i < 8; i++) {
                const ang = (i / 8) * Math.PI * 2;
                const px = run.bossRoom.x + Math.cos(ang) * 7;
                const pz = run.bossRoom.z + Math.sin(ang) * 5.5;
                if (Math.hypot(player.x - px, player.z - pz) < 1.6) return true;
              }
              return false;
            })());
          const away = Math.atan2(player.x - b.x, player.z - b.z);
          if (!nearPillar) {
            player.x += Math.sin(away) * 5.5;
            player.z += Math.cos(away) * 5.5;
            applyPlayerHit(S, b.atk * 0.85, onHitPlayer);
            flash(player.x, player.z, '#748ffc', 2, 0.35);
          } else {
            run.objectives.galeBrace = true;
            flash(player.x, player.z, '#69db7c', 1.3, 0.3);
          }
        } else if (kind === 'bolt') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          if (Math.hypot(player.x - tx, player.z - tz) < 2.1) {
            applyPlayerHit(S, b.atk * 1.15, onHitPlayer);
          }
          flash(tx, tz, '#ffd43b', 2.2, 0.4);
        } else if (kind === 'void' || kind === 'flare') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          if (Math.hypot(player.x - tx, player.z - tz) < (kind === 'flare' ? 2.6 : 2.4)) {
            applyPlayerHit(S, b.atk * (kind === 'flare' ? 1.1 : 1.0), onHitPlayer);
            if (kind === 'void') S.buffs.poison = { dmg: 3, t: 5 };
          }
          flash(tx, tz, kind === 'flare' ? '#ffd43b' : '#212529', 2.2, 0.4);
        } else if (kind === 'meteor') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          if (Math.hypot(player.x - tx, player.z - tz) < 2.0) {
            applyPlayerHit(S, b.atk * 1.3, onHitPlayer);
          }
          // splash near boss
          if (Math.hypot(player.x - b.x, player.z - b.z) < 5.5 && Math.random() < 0.45) {
            applyPlayerHit(S, b.atk * 0.55, onHitPlayer);
          }
          flash(tx, tz, '#fa5252', 2.5, 0.45);
        } else if (kind === 'anvil' || kind === 'slaghit') {
          if (kind === 'anvil') {
            const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
            if (Math.hypot(player.x - tx, player.z - tz) < 2.5) {
              applyPlayerHit(S, b.atk * 1.25, onHitPlayer);
              player.stunned = 0.6;
            }
            flash(tx, tz, '#fab005', 2.2, 0.35);
          } else {
            const r = Math.max(2.5, (b.slagR || 3) * 0.6);
            if (Math.hypot(player.x - b.x, player.z - b.z) < r) {
              applyPlayerHit(S, b.atk * 0.9, onHitPlayer);
            }
            flash(b.x, b.z, '#e67700', 2.5, 0.35);
          }
        } else if (kind === 'prism') {
          const tx = b.atkTele?.x ?? player.x, tz = b.atkTele?.z ?? player.z;
          // beam corridor check: near line from boss to tele
          const dBoss = Math.hypot(player.x - b.x, player.z - b.z);
          const ang = b.beamAng ?? Math.atan2(tx - b.x, tz - b.z);
          const px = b.x + Math.sin(ang) * dBoss;
          const pz = b.z + Math.cos(ang) * dBoss;
          const off = Math.hypot(player.x - px, player.z - pz);
          if (off < 1.7 && dBoss < 9) {
            applyPlayerHit(S, b.atk * 1.2, onHitPlayer);
          } else if (Math.hypot(player.x - tx, player.z - tz) < 2.0) {
            applyPlayerHit(S, b.atk * 1.05, onHitPlayer);
          }
          flash(tx, tz, '#be4bdb', 2.4, 0.4);
        }
        b.atkTele = null;
      }
      b.mesh.position.set(b.x, 0, b.z);
      b.mesh.rotation.y = b.ry || 0;
      return;
    }

    b.mesh.position.set(b.x, 0, b.z);
    b.mesh.rotation.y = b.ry || 0;
  }

  function updateHazards(dt, S, player, run, onHitPlayer) {
    if (!run?.hazards?.length) return;
    if (run.safe && Math.hypot(player.x - run.safe.x, player.z - run.safe.z) < 4) return;
    run._hazTick = (run._hazTick || 0) + dt;
    if (run._hazTick < 0.45) return;
    run._hazTick = 0;
    for (const h of run.hazards) {
      if (Math.hypot(player.x - h.x, player.z - h.z) <= h.r) {
        applyPlayerHit(S, h.dmg * (run.diff?.dmg || 1) * 0.65, onHitPlayer);
        if (h.type === 'poison') S.buffs.poison = { dmg: 2, t: 4 };
        if (h.type === 'wind') {
          const ang = h.dir ?? Math.atan2(player.x - h.x, player.z - h.z);
          player.x += Math.sin(ang) * 1.4;
          player.z += Math.cos(ang) * 1.4;
        }
        const col = h.type === 'dark' ? '#7048e8'
          : h.type === 'blunt' ? '#fab005'
          : h.type === 'fire' ? '#fa5252'
          : h.type === 'water' ? '#1c7ed6'
          : h.type === 'wind' ? '#748ffc'
          : h.type === 'lightning' ? '#ffd43b'
          : h.type === 'magic' ? '#be4bdb'
          : '#82c91e';
        flash(h.x, h.z, col, 1.2, 0.2);
        break;
      }
    }
  }

  function updateBuffs(S, dt) {
    if (S.buffs.guard) {
      S.buffs.guard -= dt;
      if (S.buffs.guardHeal > 0) {
        const heal = S.buffs.guardHeal * dt;
        const before = S.hp;
        S.hp = Math.min(S.maxHp, S.hp + heal);
        S.statsRun.healing += Math.max(0, S.hp - before);
      }
      if (S.buffs.guard <= 0) { delete S.buffs.guard; delete S.buffs.guardHeal; }
    }
    if (S.buffs.parry) { S.buffs.parry -= dt; if (S.buffs.parry <= 0) delete S.buffs.parry; }
    if (S.buffs.atkT) { S.buffs.atkT -= dt; if (S.buffs.atkT <= 0) { delete S.buffs.atk; delete S.buffs.atkT; } }
    if (S.buffs.poison) {
      S.buffs.poison.t -= dt;
      if (Math.random() < dt * 1.2) S.hp = Math.max(1, S.hp - S.buffs.poison.dmg);
      if (S.buffs.poison.t <= 0) delete S.buffs.poison;
    }
  }

  function updateTraps(dt, S, player, run, onHitPlayer) {
    if (!run.traps?.length) return;
    for (let i = run.traps.length - 1; i >= 0; i--) {
      const tr = run.traps[i];
      tr.life -= dt;
      for (const e of run.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - tr.x, e.z - tr.z) <= tr.r) {
          e.snareT = Math.max(e.snareT || 0, 0.6);
          if (!tr.hit) {
            tr.hit = true;
            e.hp -= tr.dmg || 4;
            refreshEntityHpBar(e);
            flash(e.x, e.z, '#82c91e', 1.1, 0.25);
          }
        }
      }
      if (run.boss?.alive && Math.hypot(run.boss.x - tr.x, run.boss.z - tr.z) <= tr.r) {
        run.boss.snareT = Math.max(run.boss.snareT || 0, 0.5);
      }
      if (tr.life <= 0) {
        if (tr.mesh?.parent) tr.mesh.parent.remove(tr.mesh);
        run.traps.splice(i, 1);
      }
    }
  }

  return { playerAttack, updateEnemies, updateBoss, updateHazards, updateFx, updateBuffs, updateTraps, flash, telegraph, clearFx };
}
