/** Tunable data for Vaelgate. Keep numbers here, not scattered in gameplay code. */

export const SAVE_KEY = 'vaelgate-save-v1';
export const GAME = {
  name: 'Vaelgate',
  tagline: 'Every gate has a rank. Every rank has a price.',
  city: 'Aurelmere',
  walkSpeed: 4.2,
  sprintSpeed: 6.4,
  camDist: 7.5,
  startGold: 200,
  invSlots: 30,
};

export const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
export const RANK_NAME = {
  F: 'Novice', E: 'Apprentice', D: 'Journeyman', C: 'Veteran',
  B: 'Elite', A: 'Master', S: 'Champion', SS: 'Legend', SSS: 'Mythic',
};
export const rankIndex = (r) => RANKS.indexOf(r);
export const nextRank = (r) => RANKS[Math.min(RANKS.length - 1, rankIndex(r) + 1)];

export const SKIN_TONES = ['#f5d0b0', '#e8b98a', '#c68642', '#8d5524', '#f1c27d', '#ffdbac', '#d4a574', '#6b3f24'];
export const HAIR_COLORS = ['#1a1a1a', '#3d2314', '#6b4423', '#8b5a2b', '#c9a227', '#d4d4d4', '#4a148c', '#0b7285', '#c92a2a', '#1864ab', '#2b8a3e', '#e8590c'];
export const HAIR_STYLES = ['short', 'messy', 'long', 'bun', 'spiky', 'bald', 'ponytail', 'fringe'];

export const CLASSES = {
  vanguard: {
    id: 'vanguard', name: 'Vanguard', icon: 'shield', role: 'Tank',
    blurb: 'Front-line tank. Absorbs hits, taunts foes, protects allies.',
    adv: 'Highest HP and defense. Taunt. Best solo survivability early.',
    dis: 'Slow. Low damage. No ranged option. Blocking drains stamina.',
    color: '#4c6ef5',
    stats: { hp: 140, sta: 100, mana: 20, atk: 8, mag: 2, def: 14, spd: 6, crit: 0.03 },
    skills: [
      { id: 'bash', name: 'Shield Bash', icon: 'shield', cost: { sta: 16 }, cd: 2.6, range: 2.6, dmg: 1.6, type: 'blunt', stun: 1.15, aoe: 2.4, tip: 'Cleave stun — stop packs mid-swing.' },
      { id: 'taunt', name: 'War Cry', icon: 'horn', cost: { sta: 12 }, cd: 7, range: 8, dmg: 0.65, type: 'blunt', aoe: 7.5, taunt: 6, interrupt: true, vulnerable: 5, tip: 'Shockwave: interrupt, pull fire, mark foes frail.' },
      { id: 'guard', name: 'Iron Guard', icon: 'brick', cost: { sta: 8 }, cd: 8, range: 0, dmg: 0, type: 'buff', guard: 6, guardHeal: 6, tip: '65% less damage + heal while braced.' },
    ],
    look: { shirt: '#4c6ef5', pants: '#343a40', vest: '#adb5bd', weapon: 'shield' },
  },
  duelist: {
    id: 'duelist', name: 'Duelist', icon: 'sword', role: 'Melee DPS',
    blurb: 'Balanced sword fighter. Rewards timing with parry and riposte.',
    adv: 'Good damage and defense. Parry counters. Best beginner class.',
    dis: 'No area damage. Needs melee range. Weak vs swarms.',
    color: '#e03131',
    stats: { hp: 110, sta: 110, mana: 30, atk: 12, mag: 3, def: 9, spd: 9, crit: 0.06 },
    skills: [
      { id: 'slash', name: 'Quick Slash', icon: 'sword', cost: { sta: 10 }, cd: 1.8, range: 2.6, dmg: 1.45, type: 'slash', tip: 'Fast opener — low cost pressure.' },
      { id: 'parry', name: 'Parry', icon: 'hand', cost: { sta: 10 }, cd: 5.5, range: 0, dmg: 0, type: 'buff', parry: 1.8, tip: 'Negate the next hit completely.' },
      { id: 'riposte', name: 'Riposte', icon: 'dagger', cost: { sta: 16 }, cd: 4.5, range: 2.8, dmg: 2.25, type: 'slash', critBonus: 0.3, tip: 'Heavy punish — high crit chance.' },
    ],
    look: { shirt: '#fa5252', pants: '#212529', weapon: 'sword' },
  },
  arcanist: {
    id: 'arcanist', name: 'Arcanist', icon: 'staff', role: 'Ranged DPS',
    blurb: 'Ranged mage. Strong vs groups and elemental weaknesses.',
    adv: 'Highest area damage. Exploits weaknesses. Mana skills.',
    dis: 'Lowest HP. Slow casts. Mana hungry.',
    color: '#7048e8',
    stats: { hp: 80, sta: 80, mana: 120, atk: 4, mag: 14, def: 4, spd: 7, crit: 0.05 },
    skills: [
      { id: 'fire', name: 'Fire Bolt', icon: 'fire', cost: { mana: 14 }, cd: 2.0, range: 10, dmg: 1.55, type: 'fire', projectile: true, tip: 'Single-target fire — poke weaknesses.' },
      { id: 'frost', name: 'Frost Shard', icon: 'ice', cost: { mana: 16 }, cd: 3.0, range: 9, dmg: 1.25, type: 'ice', projectile: true, slow: 3.0, tip: 'Damage + long slow for kiting.' },
      { id: 'spark', name: 'Arc Spark', icon: 'bolt', cost: { mana: 26 }, cd: 6.5, range: 8, dmg: 1.2, type: 'lightning', aoe: 4.5, tip: 'Burst AoE — clear waves fast.' },
    ],
    look: { shirt: '#7950f2', pants: '#364fc7', weapon: 'staff' },
  },
  ranger: {
    id: 'ranger', name: 'Ranger', icon: 'bow', role: 'Ranged DPS',
    blurb: 'Bow and traps. Kites enemies and scouts boss secrets.',
    adv: 'Safe ranged damage. Fastest DPS. Scout reveals a hidden boss tip.',
    dis: 'Low defense. Weak when surrounded.',
    color: '#2f9e44',
    stats: { hp: 90, sta: 110, mana: 40, atk: 11, mag: 3, def: 6, spd: 10, crit: 0.08 },
    skills: [
      { id: 'shot', name: 'Power Shot', icon: 'bow', cost: { sta: 14 }, cd: 1.9, range: 11, dmg: 1.5, type: 'pierce', projectile: true, tip: 'Long-range poke.' },
      { id: 'snare', name: 'Snare Trap', icon: 'trap', cost: { sta: 16 }, cd: 7, range: 3.5, dmg: 0.7, type: 'trap', snare: 4.0, aoe: 3.2, tip: 'Root anyone in the ring — then shoot.' },
      { id: 'scout', name: 'Scout', icon: 'scout', cost: { mana: 10 }, cd: 18, range: 0, dmg: 0, type: 'scout', atkBuff: [0.2, 10], tip: 'Boss tip + 20% damage for 10s.' },
    ],
    look: { shirt: '#37b24d', pants: '#2b8a3e', hood: '#2b8a3e', weapon: 'bow' },
  },
  shadeblade: {
    id: 'shadeblade', name: 'Shadeblade', icon: 'dagger', role: 'Melee DPS',
    blurb: 'Rogue. Stealth, dodge, backstabs, critical hits.',
    adv: 'Highest burst and crit. Best dodge. Bonus from behind.',
    dis: 'Fragile. Cooldown skills. Mistakes are deadly.',
    color: '#212529',
    stats: { hp: 85, sta: 120, mana: 40, atk: 14, mag: 4, def: 5, spd: 11, crit: 0.15 },
    skills: [
      { id: 'backstab', name: 'Backstab', icon: 'dagger', cost: { sta: 16 }, cd: 3.5, range: 2.3, dmg: 1.9, type: 'pierce', backBonus: 1.0, tip: 'Huge bonus from behind.' },
      { id: 'step', name: 'Shadow Step', icon: 'moon', cost: { sta: 18 }, cd: 7.5, range: 0, dmg: 0, type: 'dash', dash: 6.0, tip: 'Blink behind packs / out of AoE.' },
      { id: 'poison', name: 'Poison Edge', icon: 'poison', cost: { mana: 12 }, cd: 6, range: 2.5, dmg: 1.15, type: 'poison', dot: [7, 5], tip: 'Hit + DoT — melt elites.' },
    ],
    look: { shirt: '#343a40', pants: '#212529', hood: '#212529', weapon: 'daggers' },
  },
  lightbearer: {
    id: 'lightbearer', name: 'Lightbearer', icon: 'sparkle', role: 'Support',
    blurb: 'Healer and support. Buffs, cleanses, and self-heal for solo.',
    adv: 'Only revive class. Strong buffs. Counters poison and curse.',
    dis: 'Weakest damage. Slow solo clears.',
    color: '#f59f00',
    stats: { hp: 100, sta: 90, mana: 110, atk: 5, mag: 10, def: 8, spd: 7, crit: 0.03 },
    skills: [
      { id: 'mend', name: 'Mend', icon: 'heal', cost: { mana: 16 }, cd: 2.8, range: 8, dmg: 0, type: 'heal', heal: 38, tip: 'Main heal — keep yourself up.' },
      { id: 'bless', name: 'Blessing', icon: 'sparkle', cost: { mana: 20 }, cd: 10, range: 0, dmg: 0, type: 'buff', atkBuff: [0.22, 16], tip: '+22% damage for 16s.' },
      { id: 'purify', name: 'Purify', icon: 'purify', cost: { mana: 12 }, cd: 5.5, range: 0, dmg: 0, type: 'cleanse', heal: 18, tip: 'Cleanse poison/curse + small heal.' },
    ],
    look: { shirt: '#fff3bf', pants: '#e67700', weapon: 'mace' },
  },
};

export const APTITUDE = [
  {
    q: 'A monster charges you. What do you do?',
    opts: [
      { t: 'Hold the line and block', c: 'vanguard' },
      { t: 'Dodge aside and strike', c: 'duelist' },
      { t: 'Attack from range', c: 'ranger' },
      { t: 'Cast a spell', c: 'arcanist' },
      { t: 'Protect an ally first', c: 'lightbearer' },
      { t: 'Vanish and strike from behind', c: 'shadeblade' },
    ],
  },
  {
    q: 'Your party needs someone. Which job feels right?',
    opts: [
      { t: 'Keep everyone safe up front', c: 'vanguard' },
      { t: 'Finish fights with clean sword work', c: 'duelist' },
      { t: 'Burn down packs of foes', c: 'arcanist' },
      { t: 'Scout and pick them off', c: 'ranger' },
      { t: 'Heal and cleanse', c: 'lightbearer' },
      { t: 'Delete the biggest threat fast', c: 'shadeblade' },
    ],
  },
  {
    q: 'In the city, what do you notice first?',
    opts: [
      { t: 'Gates and walls that need guarding', c: 'vanguard' },
      { t: 'A sparring yard', c: 'duelist' },
      { t: 'Glowing runes and books', c: 'arcanist' },
      { t: 'Rooftops and trails', c: 'ranger' },
      { t: 'People who look hurt', c: 'lightbearer' },
      { t: 'Shadows between stalls', c: 'shadeblade' },
    ],
  },
  {
    q: 'A boss shows a weakness. How do you use it?',
    opts: [
      { t: 'Hold aggro so others can hit it', c: 'vanguard' },
      { t: 'Time a perfect counter', c: 'duelist' },
      { t: 'Spam the matching element', c: 'arcanist' },
      { t: 'Scout first, then open fire', c: 'ranger' },
      { t: 'Keep the party alive through the phase', c: 'lightbearer' },
      { t: 'Burst during the opening', c: 'shadeblade' },
    ],
  },
  {
    q: 'What failure would sting the most?',
    opts: [
      { t: 'Letting an ally fall while I still stand', c: 'vanguard' },
      { t: 'Missing a parry by a heartbeat', c: 'duelist' },
      { t: 'Running dry of mana mid-fight', c: 'arcanist' },
      { t: 'Getting cornered with no room to kite', c: 'ranger' },
      { t: 'Watching a friend die when I could have healed', c: 'lightbearer' },
      { t: 'Being seen before the backstab lands', c: 'shadeblade' },
    ],
  },
];

/** City distances are compressed (~1/10 of GDD) for a web vertical slice, but labels show the lore distance. */
export const PLACES = [
  { id: 'guild', name: 'Guild Center', icon: 'guild', x: 0, z: 0, loreM: 0, kind: 'guild', district: 'Guild Plaza' },
  { id: 'market', name: 'Market Square', icon: 'market', x: -22, z: 10, loreM: 180, kind: 'shop', district: 'Market Loop' },
  { id: 'healer', name: "Healer's Court", icon: 'healer', x: 14, z: -26, loreM: 300, kind: 'healer', district: 'North Court' },
  { id: 'hearth', name: 'Restaurant Row', icon: 'food', x: -32, z: -20, loreM: 360, kind: 'food', district: 'North Court' },
  { id: 'smithy', name: 'Smithy & Armory', icon: 'smith', x: 28, z: 18, loreM: 420, kind: 'smith', district: 'Market Loop' },
  { id: 'stage', name: 'The Stage', icon: 'stage', x: -40, z: 24, loreM: 540, kind: 'cosmetic', district: 'West Arts' },
  { id: 'train', name: 'Training Ground', icon: 'fist', x: -8, z: 36, loreM: 280, kind: 'train', district: 'South Yard' },
  { id: 'park', name: 'Plaza Gardens', icon: 'leaf', x: 8, z: 18, loreM: 120, kind: 'landmark', district: 'Guild Plaza' },
  { id: 'f1', name: 'F-1 Gate: Mossroot Burrow', icon: 'mushroom', x: 42, z: -8, loreM: 480, kind: 'gate', dungeon: 'mossroot', district: 'East Gates' },
  { id: 'f2', name: 'F-2 Gate: Rustpick Tunnels', icon: 'pickaxe', x: 58, z: 28, loreM: 720, kind: 'gate', dungeon: 'rustpick', district: 'East Gates' },
  { id: 'e1', name: 'E Gate: Whispering Crypt', icon: 'skull', x: 88, z: -20, loreM: 1200, kind: 'gate', dungeon: 'crypt', district: 'East Gates' },
  { id: 'd1', name: 'D Gate: Emberfang Hollow', icon: 'fire', x: 120, z: 10, loreM: 1800, kind: 'gate', dungeon: 'ember', district: 'East Gates' },
  { id: 'c1', name: 'C Gate: Drowned Sanctum', icon: 'wave', x: 150, z: -30, loreM: 2400, kind: 'gate', dungeon: 'drowned', district: 'East Gates' },
  { id: 'b1', name: 'B Gate: Ironclad Bastion', icon: 'castle', x: 180, z: 20, loreM: 3000, kind: 'gate', dungeon: 'bastion', district: 'East Gates' },
  { id: 'a1', name: 'A Gate: Stormspire', icon: 'storm', x: 210, z: -10, loreM: 3800, kind: 'gate', dungeon: 'storm', district: 'East Gates' },
  { id: 's1', name: 'S Gate: Eclipse Sanctum', icon: 'moon', x: 245, z: 18, loreM: 4800, kind: 'gate', dungeon: 'eclipse', district: 'East Gates' },
  { id: 'ss1', name: 'SS Gate: Astral Foundry', icon: 'star', x: 280, z: -22, loreM: 5600, kind: 'gate', dungeon: 'astral', district: 'East Gates' },
  { id: 'sss1', name: 'SSS Gate: Mythic Crown', icon: 'sparkle', x: 315, z: 8, loreM: 6400, kind: 'gate', dungeon: 'crown', district: 'East Gates' },
];

export const DIFFICULTY = {
  easy: { id: 'easy', name: 'Easy', hp: 0.75, dmg: 0.7, def: 0.8, reward: 0.7, revives: 5, grade: 'Common', blurb: 'Longer telegraphs. Gentler on new adventurers.' },
  normal: { id: 'normal', name: 'Normal', hp: 1, dmg: 1, def: 1, reward: 1, revives: 3, grade: 'Standard', blurb: 'Baseline. All stats as written for the dungeon.' },
  hard: { id: 'hard', name: 'Hard', hp: 1.5, dmg: 1.4, def: 1.25, reward: 1.4, revives: 2, grade: 'Fine', blurb: 'Elites appear more often. Fewer revives.' },
  nightmare: { id: 'nightmare', name: 'Nightmare', hp: 2, dmg: 1.8, def: 1.5, reward: 2, revives: 1, grade: 'Exquisite', blurb: 'Unique rule change. Not just bigger numbers.' },
};

export const DUNGEONS = {
  mossroot: {
    id: 'mossroot', name: 'Mossroot Burrow', rank: 'F', icon: 'mushroom',
    theme: 'Nature / Poison', levels: [1, 5], color: '#2f9e44', floorColor: '#5c7c46', wallColor: '#3b5b2e',
    enemies: ['slime', 'rat', 'sprout', 'goblin', 'sporeling'],
    hazard: { id: 'spore', name: 'Poison spores', every: 18, dmg: 4, type: 'poison' },
    seal: { kind: 'clear', pct: 0.7 },
    guardians: { 2: 'rootbrute', 4: 'gobcap' },
    boss: 'gloomcap',
    flow: 'waves',
    floorBosses: ['sporebrute', 'ratking', 'thornmatron', 'gobwarcap', 'gloomcap'],
    nightmare: 'Spore Bloom: poison clouds spread each minute and never fully fade.',
    rewards: ['Slime Gel', 'Mossroot Fiber'],
    set: 'Mossveil',
  },
  rustpick: {
    id: 'rustpick', name: 'Rustpick Tunnels', rank: 'F', icon: 'pickaxe',
    theme: 'Earth / Metal', levels: [4, 8], color: '#868e96', floorColor: '#6c757d', wallColor: '#495057',
    enemies: ['kobold', 'crawler', 'bat', 'pickskel', 'rustslinger'],
    hazard: { id: 'rocks', name: 'Falling rocks', every: 22, dmg: 12, type: 'blunt' },
    seal: { kind: 'guardian' },
    guardians: { 2: 'foreman', 4: 'twincrawler' },
    boss: 'grubnok',
    flow: 'waves',
    floorBosses: ['scrapsentinel', 'veincrawler', 'batmatron', 'pickwraith', 'grubnok'],
    nightmare: 'Unstable Mine: random cave-ins on every floor.',
    rewards: ['Iron Scrap', 'Rusty Gear'],
    set: 'Rustplate',
  },
  crypt: {
    id: 'crypt', name: 'Whispering Crypt', rank: 'E', icon: 'skull',
    theme: 'Undead / Dark', levels: [8, 14], color: '#495057', floorColor: '#343a40', wallColor: '#212529',
    enemies: ['skel', 'ghost', 'gravecrawler', 'bonearcher'],
    hazard: { id: 'curse', name: 'Curse tiles', every: 20, dmg: 6, type: 'dark' },
    seal: { kind: 'pillars', count: 3 },
    guardians: { 2: 'cryptknight', 4: 'necro' },
    boss: 'vorren',
    nightmare: 'Haunting: killed enemies leave chasing ghosts.',
    rewards: ['Bone Dust', 'Ectoplasm'],
    set: 'Hollow Knight',
  },
  ember: {
    id: 'ember', name: 'Emberfang Hollow', rank: 'D', icon: 'fire',
    theme: 'Fire / Beast', levels: [14, 20], color: '#e03131', floorColor: '#7c2d12', wallColor: '#5c1a0a',
    enemies: ['cinderwolf', 'fireimp', 'magmaslug', 'ashhound'],
    hazard: { id: 'heat', name: 'Heat vents', every: 14, dmg: 8, type: 'fire' },
    seal: { kind: 'clear', pct: 0.7 },
    guardians: { 2: 'alphawolf', 4: 'imppyro' },
    boss: 'cinderjaw',
    nightmare: 'Wildfire: standing still ignites the ground. Enrage timer is brutal.',
    rewards: ['Ember Core', 'Wolf Pelt'],
    set: 'Ashen',
  },
  drowned: {
    id: 'drowned', name: 'Drowned Sanctum', rank: 'C', icon: 'wave',
    theme: 'Water / Poison / Lightning', levels: [20, 28], color: '#1c7ed6', floorColor: '#1864ab', wallColor: '#0b3d66',
    enemies: ['lizard', 'husk', 'eel', 'siren'],
    hazard: { id: 'tide', name: 'Rising tide', every: 16, dmg: 7, type: 'water' },
    seal: { kind: 'guardian' },
    guardians: { 2: 'lizardcap', 4: 'sirenmatron' },
    boss: 'nerisha',
    nightmare: 'Rising Tide never stops. Lightning chains through water.',
    rewards: ['Tide Scale', 'Siren Pearl'],
    set: 'Tideborn',
  },
  bastion: {
    id: 'bastion', name: 'Ironclad Bastion', rank: 'B', icon: 'castle',
    theme: 'Construct / Armor', levels: [28, 36], color: '#adb5bd', floorColor: '#868e96', wallColor: '#495057',
    enemies: ['sentinel', 'geargolem', 'turret', 'steamspider'],
    hazard: { id: 'steam', name: 'Steam vents', every: 15, dmg: 9, type: 'blunt' },
    seal: { kind: 'pillars', count: 3 },
    guardians: { 2: 'siegeram', 4: 'twinsent' },
    boss: 'gravenhelm',
    nightmare: 'Overclock Protocol: machines copy themselves if left alive.',
    rewards: ['Steel Plate', 'Clockwork Core'],
    set: 'Bastion',
  },
  storm: {
    id: 'storm', name: 'Stormspire', rank: 'A', icon: 'storm',
    theme: 'Wind / Lightning', levels: [36, 44], color: '#7048e8', floorColor: '#5c7cfa', wallColor: '#364fc7',
    enemies: ['stormwisp', 'galehawk', 'thunderling', 'cloudgolem'],
    hazard: { id: 'gale', name: 'Gale corridors', every: 12, dmg: 8, type: 'wind' },
    seal: { kind: 'clear', pct: 0.75 },
    guardians: { 2: 'galeknight', 4: 'thunderlord' },
    boss: 'skyrend',
    nightmare: 'Eye of the Storm: constant wind shove and chain lightning.',
    rewards: ['Storm Shard', 'Gale Feather'],
    set: 'Stormspire',
  },
  eclipse: {
    id: 'eclipse', name: 'Eclipse Sanctum', rank: 'S', icon: 'moon',
    theme: 'Dark / Holy', levels: [44, 52], color: '#212529', floorColor: '#343a40', wallColor: '#1b263b',
    enemies: ['umbrawisp', 'solaracolyte', 'nightstalker', 'eclipseling'],
    hazard: { id: 'void', name: 'Void pools', every: 11, dmg: 10, type: 'dark' },
    seal: { kind: 'pillars', count: 3 },
    guardians: { 2: 'duskwarden', 4: 'dawnherald' },
    boss: 'nyxara',
    nightmare: 'Total Eclipse: arena flips every 20 seconds with no safe margin.',
    rewards: ['Eclipse Shard', 'Solar Dust'],
    set: 'Eclipse',
  },
  astral: {
    id: 'astral', name: 'Astral Foundry', rank: 'SS', icon: 'star',
    theme: 'Cosmic / Forge', levels: [52, 60], color: '#fab005', floorColor: '#e67700', wallColor: '#5c3b0a',
    enemies: ['starspark', 'forgewight', 'meteorite', 'anvilkin'],
    hazard: { id: 'slag', name: 'Molten slag', every: 10, dmg: 11, type: 'fire' },
    seal: { kind: 'guardian' },
    guardians: { 2: 'starforger', 4: 'meteorlord' },
    boss: 'vorth',
    nightmare: 'Starfall never stops. Floor slag expands every minute.',
    rewards: ['Astral Ore', 'Foundry Ember'],
    set: 'Astral',
  },
  crown: {
    id: 'crown', name: 'Mythic Crown', rank: 'SSS', icon: 'sparkle',
    theme: 'Prismatic / Mythic', levels: [60, 70], color: '#ffd43b', floorColor: '#f3d9fa', wallColor: '#862e9c',
    enemies: ['prismling', 'mythicshade', 'crownward', 'aurora'],
    hazard: { id: 'prism', name: 'Prism scars', every: 9, dmg: 12, type: 'magic' },
    seal: { kind: 'clear', pct: 0.8 },
    guardians: { 2: 'prismknight', 4: 'crownbearer' },
    boss: 'vael',
    nightmare: 'Gatebreaker Protocol: clones and beams fire without cooldown.',
    rewards: ['Mythic Prism', 'Crown Filament'],
    set: 'Mythic',
  },
};

export const BOSSES = {
  // Mossroot floor bosses (1-4 limited, 5 full)
  sporebrute: {
    id: 'sporebrute', name: 'Spore Brute', icon: 'mushroom',
    brief: 'Floor 1 enforcer. Poison puddles only.',
    style: 'Melee', party: 'solo', weak: ['fire'], strong: ['blunt'], immune: ['poison'],
    hp: 220, atk: 9, def: 4, spd: 4.2, kit: ['chase', 'puddle'], fullPower: false,
    hidden: [{ id: 'puddle', text: 'Drops a poison puddle under your feet.' }],
    phases: [1],
  },
  ratking: {
    id: 'ratking', name: 'Burrow Rat King', icon: 'skull',
    brief: 'Floor 2. Burrow dashes through the pit.',
    style: 'Melee dash', party: 'solo', weak: ['blunt'], strong: [], immune: [],
    hp: 260, atk: 10, def: 4, spd: 5.5, kit: ['chase', 'burrow'], fullPower: false,
    hidden: [{ id: 'burrow', text: 'Burrows and dashes to your last spot.' }],
    phases: [1],
  },
  thornmatron: {
    id: 'thornmatron', name: 'Thorn Matron', icon: 'leaf',
    brief: 'Floor 3. Roots you in place if you stand in the snare.',
    style: 'Control', party: 'solo', weak: ['fire'], strong: ['pierce'], immune: [],
    hp: 300, atk: 11, def: 5, spd: 4, kit: ['chase', 'root'], fullPower: false,
    hidden: [{ id: 'root', text: 'Telegraphs a root snare that slows hard.' }],
    phases: [1],
  },
  gobwarcap: {
    id: 'gobwarcap', name: 'Goblin Warcap', icon: 'sword',
    brief: 'Floor 4. Calls two goblins once, then fights alone again.',
    style: 'Summon once', party: 'solo', weak: [], strong: [], immune: [],
    hp: 340, atk: 12, def: 5, spd: 4.5, kit: ['chase', 'call'], fullPower: false,
    hidden: [{ id: 'call', text: 'Calls two goblins at half health.' }],
    phases: [1, 0.5],
  },
  gloomcap: {
    id: 'gloomcap', name: 'Gloomcap, the Spore Sovereign', icon: 'mushroom',
    portrait: 'assets/bosses/gloomcap.jpg',
    brief: 'A fungal sovereign that blankets Mossroot in poison spores. Keep moving when the caps bloom.',
    style: 'Melee summoner', party: '1 to 3 · any role',
    weak: ['fire'], strong: ['blunt'], immune: ['poison'],
    hp: 720, atk: 14, def: 6, spd: 5.2,
    kit: ['chase', 'spore', 'wall', 'split'], fullPower: true,
    hidden: [
      { id: 'split', text: 'Splits into three Mini-Gloomcaps at 50% HP.' },
      { id: 'sporeburst', text: 'Burning the spawned spores causes a small explosion.' },
      { id: 'wall', text: 'Spore wall pushes you away from the cap.' },
    ],
    phases: [1, 0.5],
  },
  // Rustpick floor bosses
  scrapsentinel: {
    id: 'scrapsentinel', name: 'Scrap Sentinel', icon: 'shield',
    brief: 'Floor 1. Shield bash only.',
    style: 'Melee', party: 'solo', weak: ['lightning'], strong: ['slash'], immune: [],
    hp: 240, atk: 10, def: 7, spd: 3.8, kit: ['chase', 'bash'], fullPower: false,
    hidden: [{ id: 'bash', text: 'Shield bash staggers if you stay close.' }],
    phases: [1],
  },
  veincrawler: {
    id: 'veincrawler', name: 'Vein Crawler', icon: 'pickaxe',
    brief: 'Floor 2. Acid spit puddles.',
    style: 'Ranged puddle', party: 'solo', weak: ['magic'], strong: [], immune: [],
    hp: 280, atk: 11, def: 6, spd: 4.2, kit: ['chase', 'acid'], fullPower: false,
    hidden: [{ id: 'acid', text: 'Spits an acid puddle at your feet.' }],
    phases: [1],
  },
  batmatron: {
    id: 'batmatron', name: 'Rust Bat Matron', icon: 'moon',
    brief: 'Floor 3. Screech stun telegraph.',
    style: 'Mobile', party: 'solo', weak: ['pierce'], strong: [], immune: [],
    hp: 300, atk: 12, def: 4, spd: 5.8, kit: ['chase', 'screech'], fullPower: false,
    hidden: [{ id: 'screech', text: 'Screech ring stuns if you stay inside.' }],
    phases: [1],
  },
  pickwraith: {
    id: 'pickwraith', name: 'Pickaxe Wraith', icon: 'skull',
    brief: 'Floor 4. Line charge across the pit.',
    style: 'Charge', party: 'solo', weak: ['blunt', 'holy'], strong: ['pierce'], immune: ['poison'],
    hp: 360, atk: 13, def: 6, spd: 4.8, kit: ['chase', 'line'], fullPower: false,
    hidden: [{ id: 'line', text: 'Charges in a straight red line.' }],
    phases: [1],
  },
  grubnok: {
    id: 'grubnok', name: 'Grubnok, the Kobold Foreman', icon: 'pickaxe',
    portrait: 'assets/bosses/grubnok.jpg',
    brief: 'Mine boss who collapses the ceiling on command. Shelter under marked supports when the cave-in starts.',
    style: 'Melee / arena control', party: '1 to 3 · tank or mobile DPS',
    weak: ['magic', 'lightning'], strong: ['slash'], immune: [],
    hp: 900, atk: 16, def: 10, spd: 4.6,
    kit: ['chase', 'slam', 'cavein', 'charge', 'rock'], fullPower: true,
    hidden: [
      { id: 'cavein', text: 'Calls a cave-in at 60% HP. Shelter under marked supports.' },
      { id: 'stun', text: 'Becomes vulnerable after slamming the ground.' },
      { id: 'charge', text: 'Charges with a red line telegraph.' },
    ],
    phases: [1, 0.6],
  },
  vorren: {
    id: 'vorren', name: 'Vorren, the Bone Warden', icon: 'skull',
    portrait: 'assets/bosses/vorren.jpg',
    brief: 'Crypt warden of chained bone. Holy finishers stop his reassemble, or he rises once more.',
    style: 'Melee summoner', party: '2 to 4 · holy / blunt recommended',
    weak: ['holy', 'fire', 'blunt'], strong: ['pierce', 'slash'], immune: ['poison'],
    hp: 1100, atk: 18, def: 12, spd: 5,
    hidden: [
      { id: 'reassemble', text: 'Reassembles once after dying unless a Holy hit lands during the death animation.' },
      { id: 'chains', text: 'Summons spectral chains that pull players together.' },
    ],
    phases: [1, 0.3],
  },
  cinderjaw: {
    id: 'cinderjaw', name: 'Cinderjaw, the Ashen Direwolf', icon: 'fire',
    portrait: 'assets/bosses/cinderjaw.jpg',
    brief: 'Ashen direwolf that howls for packs and enrages if the fight drags. Ice and water cut deepest.',
    style: 'Melee / time pressure', party: '2 to 4 · Ice or Water recommended',
    weak: ['ice', 'water'], strong: ['fire'], immune: [],
    hp: 1400, atk: 22, def: 10, spd: 7,
    hidden: [
      { id: 'enrage', text: 'Enrages after about 4 minutes: faster bites and burning ground.' },
      { id: 'howl', text: 'Howls for Cinder Wolf adds every 25% HP lost.' },
    ],
    phases: [1, 0.75, 0.5, 0.25],
  },
  nerisha: {
    id: 'nerisha', name: 'Nerisha, the Tidecaller', icon: 'wave',
    portrait: 'assets/bosses/nerisha.jpg',
    brief: 'Tidecaller who floods the sanctum. Stand on raised pads during floods or she heals.',
    style: 'Arena control / poison', party: '2 to 4 · Lightning careful',
    weak: ['lightning'], strong: ['water', 'fire'], immune: [],
    hp: 1700, atk: 20, def: 12, spd: 5,
    hidden: [
      { id: 'flood', text: 'Floods the arena at 70% and 35% HP. Stay on raised pads or she heals.' },
      { id: 'poison', text: 'Her hits apply poison. Bring antidotes.' },
    ],
    phases: [1, 0.7, 0.35],
  },
  gravenhelm: {
    id: 'gravenhelm', name: 'Warden Gravenhelm', icon: 'castle',
    portrait: 'assets/bosses/gravenhelm.jpg',
    brief: 'Ironclad warden with a frontal shield wall. Circle behind or break it with blunt and lightning.',
    style: 'Armored duelist', party: '2 to 4 · Blunt / Lightning',
    weak: ['lightning', 'blunt'], strong: ['pierce', 'slash'], immune: ['poison'],
    hp: 2100, atk: 24, def: 18, spd: 4,
    hidden: [
      { id: 'shieldwall', text: 'Raises a frontal Shield Wall. Circle behind or break with blunt.' },
      { id: 'overclock', text: 'Final phase overclocks: faster swings, exposed back.' },
    ],
    phases: [1, 0.4],
  },
  skyrend: {
    id: 'skyrend', name: 'Skyrend, Stormspire Sovereign', icon: 'storm',
    portrait: 'assets/bosses/skyrend.jpg',
    brief: 'Storm sovereign of wind and bolt. Brace near pillars for gale bursts, then dodge lightning marks.',
    style: 'Arena control / summons', party: '2 to 4 · Earth or Ice recommended',
    weak: ['earth', 'ice'], strong: ['lightning', 'wind'], immune: [],
    hp: 2600, atk: 28, def: 16, spd: 6,
    hidden: [
      { id: 'gale', text: 'Gale Burst shoves you across the arena. Brace near pillars.' },
      { id: 'bolt', text: 'Marks the ground with lightning. Leave the circle before it lands.' },
      { id: 'pack', text: 'Calls elite gale packs at 66% and 33% HP.' },
      { id: 'fury', text: 'Below 25% HP enters Storm Fury: faster bolts and constant wind.' },
    ],
    phases: [1, 0.66, 0.33, 0.25],
  },
  nyxara: {
    id: 'nyxara', name: 'Nyxara, the Eclipse Twin', icon: 'moon',
    portrait: 'assets/bosses/nyxara.jpg',
    brief: 'Eclipse twin who flips from night void to day flare at half health. Learn both rhythms.',
    style: 'Dual-phase raid', party: '3 to 4 · Holy and Dark both useful',
    weak: ['holy', 'fire'], strong: ['dark', 'pierce'], immune: [],
    hp: 3200, atk: 30, def: 18, spd: 6,
    hidden: [
      { id: 'flip', text: 'At 50% HP flips from Night to Day. Damage type of her strikes changes.' },
      { id: 'void', text: 'Night phase paints void pools. Step out or take curse damage.' },
      { id: 'flare', text: 'Day phase flares holy rings. Leave the bright circles.' },
    ],
    phases: [1, 0.5],
  },
  vorth: {
    id: 'vorth', name: 'Forgemaster Vorth', icon: 'star',
    portrait: 'assets/bosses/vorth.jpg',
    brief: 'Astral forgemaster raining meteors and expanding slag. Keep moving and stay outside the heat ring.',
    style: 'Arena control / meteors', party: '3 to 4 · Water or Ice recommended',
    weak: ['water', 'ice'], strong: ['fire', 'blunt'], immune: ['poison'],
    hp: 3800, atk: 32, def: 20, spd: 5,
    hidden: [
      { id: 'meteor', text: 'Calls meteor rain at 70% and 40% HP. Keep moving.' },
      { id: 'anvil', text: 'Anvil Slam stuns if you stand in the ring.' },
      { id: 'slag', text: 'Forge heat expands a slag ring from the center. Stay outside it.' },
    ],
    phases: [1, 0.7, 0.4],
  },
  vael: {
    id: 'vael', name: 'Vael, the Gatebreaker', icon: 'sparkle',
    portrait: 'assets/bosses/vael.jpg',
    brief: 'Mythic finale. Mirror clones, prism beams, then Ascension. Contribution matters here.',
    style: 'Multi-phase raid', party: '3 to 4 · any coordinated role',
    weak: ['blunt', 'holy'], strong: ['magic', 'slash'], immune: [],
    hp: 4600, atk: 34, def: 22, spd: 6,
    hidden: [
      { id: 'mirror', text: 'At 60% HP summons a mirror clone that copies basic strikes.' },
      { id: 'prism', text: 'Prism beams telegraph across the floor. Dodge sideways.' },
      { id: 'ascend', text: 'Below 30% HP Ascends: faster cast, summons Crown Wards.' },
    ],
    phases: [1, 0.6, 0.3],
  },
};

export const ENEMIES = {
  // Mossroot — mix of melee / skirmish / ranged / support
  slime: { name: 'Mushroom Slime', hp: 70, atk: 7, def: 3, spd: 3, xp: 10, gold: [2, 5], weak: ['fire'], type: 'blunt', color: '#82c91e', scale: 0.9, role: 'melee' },
  rat: { name: 'Burrow Rat', hp: 55, atk: 8, def: 2, spd: 7, xp: 9, gold: [1, 4], weak: [], type: 'pierce', color: '#868e96', scale: 0.75, role: 'skirmish' },
  sprout: { name: 'Thorn Sprout', hp: 65, atk: 7, def: 4, spd: 4, xp: 10, gold: [2, 4], weak: ['fire'], type: 'pierce', color: '#2f9e44', scale: 0.85, role: 'ranged', ranged: true },
  goblin: { name: 'Goblin Scout', hp: 90, atk: 10, def: 4, spd: 6, xp: 14, gold: [4, 9], weak: [], type: 'slash', color: '#37b24d', scale: 1, role: 'melee' },
  sporeling: { name: 'Sporeling', hp: 60, atk: 9, def: 2, spd: 4, xp: 12, gold: [2, 6], weak: ['fire'], type: 'poison', color: '#94d82d', scale: 0.8, role: 'support', ranged: true },
  rootbrute: { name: 'Root Brute', hp: 280, atk: 15, def: 8, spd: 3, xp: 48, gold: [15, 28], weak: ['fire'], type: 'blunt', color: '#5c7c46', scale: 1.35, elite: true, role: 'melee' },
  gobcap: { name: 'Goblin Captain', hp: 320, atk: 17, def: 7, spd: 5, xp: 58, gold: [20, 35], weak: [], type: 'slash', color: '#2b8a3e', scale: 1.25, elite: true, role: 'melee' },
  // Rustpick
  kobold: { name: 'Kobold Miner', hp: 85, atk: 9, def: 5, spd: 5, xp: 12, gold: [3, 7], weak: ['lightning'], type: 'blunt', color: '#e67700', scale: 0.95, role: 'melee' },
  crawler: { name: 'Rock Crawler', hp: 100, atk: 10, def: 8, spd: 4, xp: 14, gold: [4, 8], weak: ['magic'], type: 'pierce', color: '#868e96', scale: 1, role: 'melee' },
  bat: { name: 'Rust Bat', hp: 58, atk: 8, def: 2, spd: 8, xp: 11, gold: [2, 5], weak: ['pierce'], type: 'pierce', color: '#495057', scale: 0.7, role: 'skirmish' },
  pickskel: { name: 'Pickaxe Skeleton', hp: 110, atk: 11, def: 6, spd: 4, xp: 16, gold: [5, 10], weak: ['blunt', 'holy'], type: 'pierce', color: '#f8f9fa', scale: 1.05, role: 'melee' },
  rustslinger: { name: 'Rust Slinger', hp: 75, atk: 10, def: 3, spd: 5, xp: 13, gold: [3, 8], weak: ['blunt'], type: 'pierce', color: '#fab005', scale: 0.95, role: 'ranged', ranged: true },
  foreman: { name: 'Kobold Foreman', hp: 340, atk: 16, def: 9, spd: 4, xp: 62, gold: [22, 40], weak: ['lightning'], type: 'blunt', color: '#d9480f', scale: 1.3, elite: true, role: 'melee' },
  twincrawler: { name: 'Twin Crawler', hp: 300, atk: 15, def: 10, spd: 5, xp: 55, gold: [18, 32], weak: ['magic'], type: 'pierce', color: '#adb5bd', scale: 1.2, elite: true, role: 'melee' },
  skel: { name: 'Skeleton Soldier', hp: 140, atk: 13, def: 8, spd: 5, xp: 22, gold: [8, 14], weak: ['blunt', 'holy'], type: 'slash', color: '#f1f3f5', scale: 1.05 },
  ghost: { name: 'Wailing Ghost', hp: 110, atk: 12, def: 3, spd: 7, xp: 20, gold: [6, 12], weak: ['holy', 'fire'], type: 'dark', color: '#a5d8ff', scale: 1 },
  gravecrawler: { name: 'Grave Crawler', hp: 130, atk: 12, def: 7, spd: 4, xp: 18, gold: [7, 12], weak: ['fire'], type: 'pierce', color: '#495057', scale: 0.95 },
  bonearcher: { name: 'Bone Archer', hp: 120, atk: 14, def: 4, spd: 5, xp: 20, gold: [8, 13], weak: ['blunt'], type: 'pierce', color: '#dee2e6', scale: 1, ranged: true },
  cryptknight: { name: 'Crypt Knight', hp: 450, atk: 19, def: 14, spd: 4, xp: 80, gold: [30, 50], weak: ['holy', 'blunt'], type: 'slash', color: '#868e96', scale: 1.4, elite: true },
  necro: { name: 'Necro Acolyte', hp: 380, atk: 17, def: 8, spd: 5, xp: 75, gold: [28, 48], weak: ['holy', 'fire'], type: 'dark', color: '#7048e8', scale: 1.2, elite: true },
  // D Emberfang
  cinderwolf: { name: 'Cinder Wolf', hp: 160, atk: 16, def: 6, spd: 7, xp: 28, gold: [10, 18], weak: ['ice', 'water'], type: 'slash', color: '#e03131', scale: 1.05 },
  fireimp: { name: 'Fire Imp', hp: 130, atk: 15, def: 4, spd: 6, xp: 24, gold: [8, 15], weak: ['ice'], type: 'fire', color: '#ff922b', scale: 0.85, ranged: true },
  magmaslug: { name: 'Magma Slug', hp: 200, atk: 14, def: 10, spd: 3, xp: 30, gold: [12, 20], weak: ['water', 'ice'], type: 'blunt', color: '#c92a2a', scale: 1.1 },
  ashhound: { name: 'Ash Hound', hp: 150, atk: 17, def: 5, spd: 8, xp: 26, gold: [9, 16], weak: ['water'], type: 'pierce', color: '#868e96', scale: 0.95 },
  alphawolf: { name: 'Alpha Cinder Wolf', hp: 520, atk: 22, def: 9, spd: 6, xp: 90, gold: [35, 55], weak: ['ice', 'water'], type: 'slash', color: '#fa5252', scale: 1.45, elite: true },
  imppyro: { name: 'Imp Pyromancer', hp: 480, atk: 24, def: 7, spd: 5, xp: 85, gold: [32, 52], weak: ['ice'], type: 'fire', color: '#e8590c', scale: 1.25, elite: true, ranged: true },
  // C Drowned
  lizard: { name: 'Lizardman Spearman', hp: 200, atk: 18, def: 9, spd: 5, xp: 34, gold: [14, 22], weak: ['lightning'], type: 'pierce', color: '#2b8a3e', scale: 1.1 },
  husk: { name: 'Drowned Husk', hp: 220, atk: 17, def: 8, spd: 4, xp: 32, gold: [12, 20], weak: ['lightning', 'holy'], type: 'blunt', color: '#495057', scale: 1.05 },
  eel: { name: 'Electric Eel', hp: 160, atk: 19, def: 5, spd: 7, xp: 30, gold: [11, 18], weak: [], type: 'lightning', color: '#74c0fc', scale: 0.9 },
  siren: { name: 'Siren Mage', hp: 180, atk: 20, def: 6, spd: 5, xp: 36, gold: [15, 24], weak: ['lightning'], type: 'magic', color: '#be4bdb', scale: 1, ranged: true },
  lizardcap: { name: 'Lizard Captain', hp: 600, atk: 24, def: 12, spd: 5, xp: 100, gold: [40, 65], weak: ['lightning'], type: 'pierce', color: '#37b24d', scale: 1.4, elite: true },
  sirenmatron: { name: 'Siren Matron', hp: 560, atk: 26, def: 9, spd: 5, xp: 95, gold: [38, 60], weak: ['lightning'], type: 'magic', color: '#9c36b5', scale: 1.3, elite: true, ranged: true },
  // B Bastion
  sentinel: { name: 'Armor Sentinel', hp: 260, atk: 22, def: 16, spd: 3, xp: 42, gold: [18, 28], weak: ['lightning', 'blunt'], type: 'slash', color: '#adb5bd', scale: 1.15 },
  geargolem: { name: 'Gear Golem', hp: 300, atk: 20, def: 18, spd: 3, xp: 46, gold: [20, 30], weak: ['lightning', 'blunt'], type: 'blunt', color: '#868e96', scale: 1.25 },
  turret: { name: 'Crossbow Turret', hp: 180, atk: 24, def: 12, spd: 1, xp: 38, gold: [16, 25], weak: ['blunt'], type: 'pierce', color: '#495057', scale: 0.9, ranged: true },
  steamspider: { name: 'Steam Spider', hp: 200, atk: 21, def: 10, spd: 7, xp: 40, gold: [17, 26], weak: ['water'], type: 'pierce', color: '#fab005', scale: 0.95 },
  siegeram: { name: 'Siege Ram', hp: 720, atk: 28, def: 20, spd: 3, xp: 120, gold: [50, 75], weak: ['lightning', 'blunt'], type: 'blunt', color: '#343a40', scale: 1.5, elite: true },
  twinsent: { name: 'Twin Sentinel', hp: 650, atk: 26, def: 18, spd: 4, xp: 110, gold: [45, 70], weak: ['lightning', 'blunt'], type: 'slash', color: '#ced4da', scale: 1.4, elite: true },
  // A Stormspire
  stormwisp: { name: 'Storm Wisp', hp: 240, atk: 24, def: 8, spd: 8, xp: 48, gold: [20, 32], weak: ['earth'], type: 'lightning', color: '#9775fa', scale: 0.85, ranged: true },
  galehawk: { name: 'Gale Hawk', hp: 280, atk: 26, def: 10, spd: 9, xp: 52, gold: [22, 34], weak: ['pierce', 'ice'], type: 'slash', color: '#748ffc', scale: 1.0 },
  thunderling: { name: 'Thunderling', hp: 300, atk: 25, def: 12, spd: 6, xp: 54, gold: [24, 36], weak: ['earth'], type: 'lightning', color: '#ffd43b', scale: 1.05 },
  cloudgolem: { name: 'Cloud Golem', hp: 360, atk: 23, def: 16, spd: 3, xp: 58, gold: [26, 40], weak: ['ice'], type: 'blunt', color: '#ced4da', scale: 1.3 },
  galeknight: { name: 'Gale Knight', hp: 820, atk: 30, def: 16, spd: 6, xp: 140, gold: [55, 85], weak: ['earth', 'ice'], type: 'slash', color: '#5c7cfa', scale: 1.45, elite: true },
  thunderlord: { name: 'Thunder Lord', hp: 780, atk: 32, def: 14, spd: 5, xp: 135, gold: [52, 80], weak: ['earth'], type: 'lightning', color: '#fab005', scale: 1.4, elite: true, ranged: true },
  // S Eclipse
  umbrawisp: { name: 'Umbra Wisp', hp: 300, atk: 28, def: 10, spd: 7, xp: 62, gold: [28, 42], weak: ['holy'], type: 'dark', color: '#343a40', scale: 0.9, ranged: true },
  solaracolyte: { name: 'Solar Acolyte', hp: 320, atk: 27, def: 12, spd: 5, xp: 64, gold: [30, 44], weak: ['dark'], type: 'holy', color: '#ffd43b', scale: 1.05, ranged: true },
  nightstalker: { name: 'Night Stalker', hp: 340, atk: 30, def: 11, spd: 8, xp: 68, gold: [32, 46], weak: ['holy', 'fire'], type: 'slash', color: '#212529', scale: 1.1 },
  eclipseling: { name: 'Eclipseling', hp: 360, atk: 26, def: 14, spd: 5, xp: 70, gold: [34, 48], weak: ['holy'], type: 'dark', color: '#862e9c', scale: 1.15 },
  duskwarden: { name: 'Dusk Warden', hp: 920, atk: 34, def: 18, spd: 5, xp: 160, gold: [65, 95], weak: ['holy'], type: 'dark', color: '#495057', scale: 1.5, elite: true },
  dawnherald: { name: 'Dawn Herald', hp: 880, atk: 36, def: 16, spd: 6, xp: 155, gold: [62, 90], weak: ['dark'], type: 'holy', color: '#fcc419', scale: 1.45, elite: true, ranged: true },
  // SS Astral
  starspark: { name: 'Star Spark', hp: 340, atk: 30, def: 10, spd: 8, xp: 72, gold: [34, 50], weak: ['water'], type: 'fire', color: '#ffd43b', scale: 0.85, ranged: true },
  forgewight: { name: 'Forge Wight', hp: 380, atk: 31, def: 16, spd: 4, xp: 76, gold: [36, 52], weak: ['water', 'ice'], type: 'blunt', color: '#e67700', scale: 1.2 },
  meteorite: { name: 'Meteorite', hp: 360, atk: 33, def: 14, spd: 5, xp: 74, gold: [35, 51], weak: ['ice'], type: 'blunt', color: '#fa5252', scale: 1.1 },
  anvilkin: { name: 'Anvil Kin', hp: 400, atk: 29, def: 18, spd: 3, xp: 78, gold: [38, 54], weak: ['lightning'], type: 'blunt', color: '#868e96', scale: 1.25 },
  starforger: { name: 'Star Forger', hp: 1000, atk: 36, def: 20, spd: 4, xp: 180, gold: [75, 110], weak: ['water', 'ice'], type: 'fire', color: '#fab005', scale: 1.55, elite: true },
  meteorlord: { name: 'Meteor Lord', hp: 960, atk: 38, def: 18, spd: 5, xp: 175, gold: [72, 105], weak: ['ice'], type: 'blunt', color: '#c92a2a', scale: 1.5, elite: true, ranged: true },
  // SSS Crown
  prismling: { name: 'Prismling', hp: 380, atk: 32, def: 12, spd: 7, xp: 82, gold: [40, 58], weak: ['blunt'], type: 'magic', color: '#be4bdb', scale: 0.95, ranged: true },
  mythicshade: { name: 'Mythic Shade', hp: 400, atk: 34, def: 14, spd: 7, xp: 86, gold: [42, 60], weak: ['holy'], type: 'dark', color: '#9c36b5', scale: 1.1 },
  crownward: { name: 'Crown Ward', hp: 420, atk: 33, def: 18, spd: 4, xp: 88, gold: [44, 62], weak: ['blunt', 'lightning'], type: 'slash', color: '#ffd43b', scale: 1.2 },
  aurora: { name: 'Aurora Spirit', hp: 360, atk: 35, def: 11, spd: 8, xp: 84, gold: [41, 59], weak: ['pierce'], type: 'magic', color: '#74c0fc', scale: 1.0, ranged: true },
  prismknight: { name: 'Prism Knight', hp: 1100, atk: 40, def: 22, spd: 5, xp: 200, gold: [85, 120], weak: ['blunt'], type: 'slash', color: '#da77f2', scale: 1.55, elite: true },
  crownbearer: { name: 'Crown Bearer', hp: 1050, atk: 42, def: 20, spd: 6, xp: 195, gold: [82, 115], weak: ['holy'], type: 'magic', color: '#fcc419', scale: 1.5, elite: true, ranged: true },
};

export const ITEMS = {
  bread: { id: 'bread', name: 'Bread', icon: 'bread', kind: 'food', rank: 'F', price: 5, hunger: 15, stack: 20 },
  meat: { id: 'meat', name: 'Dried Meat', icon: 'meat', kind: 'food', rank: 'F', price: 12, hunger: 25, buff: { staRegen: 0.03 }, stack: 20 },
  stew: { id: 'stew', name: 'Vegetable Stew', icon: 'food', kind: 'food', rank: 'E', price: 35, hunger: 35, buff: { maxHp: 0.05 }, stack: 10 },
  roast: { id: 'roast', name: 'Roast Boar', icon: 'meat', kind: 'food', rank: 'E', price: 45, hunger: 45, buff: { atk: 0.05 }, stack: 10 },
  potion: { id: 'potion', name: 'Minor Healing Potion', icon: 'potion', kind: 'consumable', rank: 'F', price: 15, heal: 40, stack: 20 },
  antidote: { id: 'antidote', name: 'Antidote', icon: 'antidote', kind: 'consumable', rank: 'F', price: 12, cleanse: true, stack: 20 },
  torch: { id: 'torch', name: 'Torch', icon: 'torch', kind: 'consumable', rank: 'E', price: 20, stack: 10 },
  slime_gel: { id: 'slime_gel', name: 'Slime Gel', icon: 'gem', kind: 'mat', rank: 'F', price: 8, stack: 99 },
  moss_fiber: { id: 'moss_fiber', name: 'Mossroot Fiber', icon: 'leaf', kind: 'mat', rank: 'F', price: 6, stack: 99 },
  iron_scrap: { id: 'iron_scrap', name: 'Iron Scrap', icon: 'gear', kind: 'mat', rank: 'F', price: 10, stack: 99 },
  rusty_gear: { id: 'rusty_gear', name: 'Rusty Gear', icon: 'wrench', kind: 'mat', rank: 'F', price: 9, stack: 99 },
  bone_dust: { id: 'bone_dust', name: 'Bone Dust', icon: 'bone', kind: 'mat', rank: 'E', price: 18, stack: 99 },
  ectoplasm: { id: 'ectoplasm', name: 'Ectoplasm', icon: 'ghost', kind: 'mat', rank: 'E', price: 22, stack: 99 },
  f_sword: { id: 'f_sword', name: 'Novice Blade', icon: 'sword', kind: 'gear', slot: 'weapon', rank: 'F', price: 80, stats: { atk: 6 }, type: 'slash' },
  f_staff: { id: 'f_staff', name: 'Novice Staff', icon: 'staff', kind: 'gear', slot: 'weapon', rank: 'F', price: 80, stats: { mag: 7 }, type: 'magic' },
  f_bow: { id: 'f_bow', name: 'Novice Bow', icon: 'bow', kind: 'gear', slot: 'weapon', rank: 'F', price: 80, stats: { atk: 6 }, type: 'pierce' },
  f_shield: { id: 'f_shield', name: 'Novice Shield', icon: 'shield', kind: 'gear', slot: 'offhand', rank: 'F', price: 60, stats: { def: 5 } },
  f_chest: { id: 'f_chest', name: 'Cloth Vest', icon: 'vest', kind: 'gear', slot: 'chest', rank: 'F', price: 50, stats: { def: 3, hp: 10 } },
  f_boots: { id: 'f_boots', name: 'Travel Boots', icon: 'boot', kind: 'gear', slot: 'boots', rank: 'F', price: 40, stats: { spd: 1, def: 1 } },
  e_mace: { id: 'e_mace', name: 'Apprentice Mace', icon: 'smith', kind: 'gear', slot: 'weapon', rank: 'E', price: 240, stats: { atk: 11 }, type: 'blunt', cross: true },
  e_helm: { id: 'e_helm', name: 'Apprentice Helm', icon: 'helm', kind: 'gear', slot: 'helm', rank: 'E', price: 150, stats: { def: 6, hp: 20 }, cross: true },
  moss_blade: { id: 'moss_blade', name: 'Mossveil Blade', icon: 'dagger', kind: 'gear', slot: 'weapon', rank: 'F', price: 120, stats: { atk: 9 }, type: 'slash', set: 'Mossveil' },
  rust_plate: { id: 'rust_plate', name: 'Rustplate Chest', icon: 'vest', kind: 'gear', slot: 'chest', rank: 'F', price: 110, stats: { def: 8, hp: 25 }, set: 'Rustplate' },
  hollow_blade: { id: 'hollow_blade', name: 'Hollow Knight Blade', icon: 'sword', kind: 'gear', slot: 'weapon', rank: 'E', price: 280, stats: { atk: 14 }, type: 'slash', set: 'Hollow Knight' },
  ember_core: { id: 'ember_core', name: 'Ember Core', icon: 'fire', kind: 'mat', rank: 'D', price: 40, stack: 99 },
  wolf_pelt: { id: 'wolf_pelt', name: 'Wolf Pelt', icon: 'vest', kind: 'mat', rank: 'D', price: 35, stack: 99 },
  ashen_blade: { id: 'ashen_blade', name: 'Ashen Fang', icon: 'dagger', kind: 'gear', slot: 'weapon', rank: 'D', price: 420, stats: { atk: 18 }, type: 'slash', set: 'Ashen' },
  tide_scale: { id: 'tide_scale', name: 'Tide Scale', icon: 'wave', kind: 'mat', rank: 'C', price: 55, stack: 99 },
  siren_pearl: { id: 'siren_pearl', name: 'Siren Pearl', icon: 'gem', kind: 'mat', rank: 'C', price: 60, stack: 99 },
  tide_staff: { id: 'tide_staff', name: 'Tideborn Staff', icon: 'staff', kind: 'gear', slot: 'weapon', rank: 'C', price: 560, stats: { mag: 22 }, type: 'magic', set: 'Tideborn' },
  steel_plate: { id: 'steel_plate', name: 'Steel Plate', icon: 'vest', kind: 'mat', rank: 'B', price: 70, stack: 99 },
  clockwork_core: { id: 'clockwork_core', name: 'Clockwork Core', icon: 'gear', kind: 'mat', rank: 'B', price: 75, stack: 99 },
  bastion_shield: { id: 'bastion_shield', name: 'Bastion Wall', icon: 'shield', kind: 'gear', slot: 'offhand', rank: 'B', price: 720, stats: { def: 18, hp: 40 }, set: 'Bastion' },
  storm_shard: { id: 'storm_shard', name: 'Storm Shard', icon: 'storm', kind: 'mat', rank: 'A', price: 90, stack: 99 },
  gale_feather: { id: 'gale_feather', name: 'Gale Feather', icon: 'leaf', kind: 'mat', rank: 'A', price: 85, stack: 99 },
  storm_lance: { id: 'storm_lance', name: 'Stormspire Lance', icon: 'sword', kind: 'gear', slot: 'weapon', rank: 'A', price: 980, stats: { atk: 28, spd: 1 }, type: 'pierce', set: 'Stormspire' },
  eclipse_shard: { id: 'eclipse_shard', name: 'Eclipse Shard', icon: 'moon', kind: 'mat', rank: 'S', price: 110, stack: 99 },
  solar_dust: { id: 'solar_dust', name: 'Solar Dust', icon: 'sparkle', kind: 'mat', rank: 'S', price: 105, stack: 99 },
  eclipse_blade: { id: 'eclipse_blade', name: 'Eclipse Twinblade', icon: 'dagger', kind: 'gear', slot: 'weapon', rank: 'S', price: 1400, stats: { atk: 34, crit: 0.03 }, type: 'slash', set: 'Eclipse' },
  astral_ore: { id: 'astral_ore', name: 'Astral Ore', icon: 'star', kind: 'mat', rank: 'SS', price: 140, stack: 99 },
  foundry_ember: { id: 'foundry_ember', name: 'Foundry Ember', icon: 'fire', kind: 'mat', rank: 'SS', price: 135, stack: 99 },
  astral_hammer: { id: 'astral_hammer', name: 'Astral Foundry Hammer', icon: 'mace', kind: 'gear', slot: 'weapon', rank: 'SS', price: 1800, stats: { atk: 40, def: 4 }, type: 'blunt', set: 'Astral' },
  mythic_prism: { id: 'mythic_prism', name: 'Mythic Prism', icon: 'gem', kind: 'mat', rank: 'SSS', price: 180, stack: 99 },
  crown_filament: { id: 'crown_filament', name: 'Crown Filament', icon: 'sparkle', kind: 'mat', rank: 'SSS', price: 175, stack: 99 },
  mythic_scepter: { id: 'mythic_scepter', name: 'Mythic Scepter', icon: 'staff', kind: 'gear', slot: 'weapon', rank: 'SSS', price: 2400, stats: { mag: 48, atk: 12 }, type: 'magic', set: 'Mythic' },
  cos_eclipse_cloak: { id: 'cos_eclipse_cloak', name: 'Eclipse Cloak', icon: 'moon', kind: 'cosmetic', rank: 'S', price: 0, title: 'Eclipse Walker', stack: 1 },
  cos_astral_sigil: { id: 'cos_astral_sigil', name: 'Astral Sigil', icon: 'star', kind: 'cosmetic', rank: 'SS', price: 0, title: 'Starforged', stack: 1 },
  cos_mythic_crown: { id: 'cos_mythic_crown', name: 'Mythic Crown', icon: 'sparkle', kind: 'cosmetic', rank: 'SSS', price: 0, title: 'Gatebreaker', stack: 1 },
};

export const STARTER_WEAPON = {
  vanguard: 'f_sword', duelist: 'f_sword', arcanist: 'f_staff',
  ranger: 'f_bow', shadeblade: 'f_sword', lightbearer: 'f_sword',
};

export const SHOPS = {
  market: {
    name: 'Market Square',
    buy: ['bread', 'meat', 'potion', 'antidote', 'f_chest', 'f_boots', 'torch'],
    sell: true,
  },
  hearth: {
    name: 'The Hearth',
    buy: ['bread', 'meat', 'stew', 'roast'],
    sell: false,
    eatIn: true,
  },
  smith: {
    name: 'Smithy & Armory',
    buy: ['f_sword', 'f_staff', 'f_bow', 'f_shield', 'f_chest', 'f_boots', 'e_mace', 'e_helm'],
    sell: true,
    repair: true,
  },
  healer: {
    name: "Healer's Court",
    buy: ['potion', 'antidote'],
    healFull: 40,
  },
};

export const HUNGER = {
  idle: 180, walk: 90, sprint: 30, combat: 30,
  states: [
    { min: 80, id: 'well', label: 'Well-Fed', staRegen: 1.05, dmg: 1 },
    { min: 40, id: 'normal', label: 'Normal', staRegen: 1, dmg: 1 },
    { min: 15, id: 'hungry', label: 'Hungry', staRegen: 0.9, dmg: 0.95 },
    { min: 1, id: 'starving', label: 'Starving', staRegen: 0.75, dmg: 0.85 },
    { min: 0, id: 'famished', label: 'Famished', staRegen: 0.6, dmg: 0.75 },
  ],
};

export const THRESHOLDS = {
  unlock_f2: {
    label: 'Unlock F-2 Rustpick Tunnels',
    needs: [
      { id: 'f1_clear', text: 'Clear Mossroot Burrow on Normal+', dungeon: 'mossroot', clears: 1, minDiff: 'normal', minCr: 30 },
      { id: 'f1_weak', text: 'Defeat Gloomcap using its Fire weakness', flag: 'obj_gloomcap_fire' },
    ],
  },
  promote_e: {
    label: 'Promote to E-rank',
    needs: [
      { id: 'f1_clear', text: 'Clear Mossroot Burrow on Normal+', dungeon: 'mossroot', clears: 1, minDiff: 'normal', minCr: 40 },
      { id: 'f2_clear', text: 'Clear Rustpick Tunnels on Normal+', dungeon: 'rustpick', clears: 1, minDiff: 'normal', minCr: 40 },
      { id: 'f2_cave', text: 'Defeat Grubnok after surviving the cave-in', flag: 'obj_grubnok_cavein' },
    ],
  },
  promote_d: {
    label: 'Promote to D-rank',
    needs: [
      { id: 'e1_clear', text: 'Clear Whispering Crypt on Normal+', dungeon: 'crypt', clears: 1, minDiff: 'normal', minCr: 40 },
      { id: 'e1_codex', text: 'Reveal a Vorren Codex entry (reassemble or chains)', flag: 'obj_vorren_holy' },
    ],
  },
  promote_c: {
    label: 'Promote to C-rank',
    needs: [
      { id: 'd1_clear', text: 'Clear Emberfang Hollow on Normal+', dungeon: 'ember', clears: 1, minDiff: 'normal', minCr: 40 },
      { id: 'd1_howl', text: 'Trigger Cinderjaw howl adds (or finish below 75% HP)', flag: 'obj_cinderjaw_howl' },
    ],
  },
  promote_b: {
    label: 'Promote to B-rank',
    needs: [
      { id: 'c1_clear', text: 'Clear Drowned Sanctum on Normal+', dungeon: 'drowned', clears: 1, minDiff: 'normal', minCr: 40 },
      { id: 'c1_flood', text: 'Survive a Nerisha flood phase', flag: 'obj_nerisha_flood' },
    ],
  },
  promote_a: {
    label: 'Promote to A-rank',
    needs: [
      { id: 'b1_clear', text: 'Clear Ironclad Bastion on Normal+', dungeon: 'bastion', clears: 1, minDiff: 'normal', minCr: 40 },
      { id: 'b1_shield', text: 'Break or outflank Gravenhelm Shield Wall', flag: 'obj_gravenhelm_shield' },
    ],
  },
  promote_s: {
    label: 'Promote to S-rank',
    needs: [
      { id: 'a1_clear', text: 'Clear Stormspire on Normal+', dungeon: 'storm', clears: 1, minDiff: 'normal', minCr: 50 },
      { id: 'a1_pack', text: 'Survive a Skyrend elite pack phase', flag: 'obj_skyrend_pack' },
    ],
  },
  promote_ss: {
    label: 'Promote to SS-rank',
    needs: [
      { id: 's1_clear', text: 'Clear Eclipse Sanctum on Normal+', dungeon: 'eclipse', clears: 1, minDiff: 'normal', minCr: 60 },
      { id: 's1_flip', text: 'Witness Nyxara flip Night to Day', flag: 'obj_nyxara_flip' },
    ],
  },
  promote_sss: {
    label: 'Promote to SSS-rank',
    needs: [
      { id: 'ss1_clear', text: 'Clear Astral Foundry on Normal+', dungeon: 'astral', clears: 1, minDiff: 'normal', minCr: 70 },
      { id: 'ss1_meteor', text: 'Survive a Vorth meteor rain', flag: 'obj_vorth_meteor' },
    ],
  },
};

export const GOALS = [
  { id: 'register', text: 'Register at the Guild Center', hint: 'Walk through the hall to the registration desk.', near: 'guild' },
  { id: 'supplies', text: 'Buy food and a potion at the Market', hint: 'Carry bread. Hunger drains while you roam.', near: 'market', after: 'register' },
  { id: 'f1', text: 'Clear Mossroot Burrow', hint: 'Open the F-1 gate east of the Guild.', near: 'f1', after: 'supplies' },
  { id: 'f2', text: 'Clear Rustpick Tunnels', hint: 'Unlock F-2 by beating Gloomcap with fire.', near: 'f2', after: 'f1' },
  { id: 'promote', text: 'Take the E-rank exam', hint: 'Return to the Rank Examiner in the Guild.', near: 'guild', after: 'f2' },
  { id: 'crypt', text: 'Challenge the Whispering Crypt', hint: 'E-rank gates open after your promotion.', near: 'e1', after: 'promote' },
  { id: 'promote_d', text: 'Take the D-rank exam', hint: 'Clear Crypt, then see the Rank Examiner.', near: 'guild', after: 'crypt' },
  { id: 'ember', text: 'Clear Emberfang Hollow', hint: 'D-rank gate far east along the road.', near: 'd1', after: 'promote_d' },
  { id: 'promote_c', text: 'Take the C-rank exam', hint: 'Return to the Rank Examiner after Emberfang.', near: 'guild', after: 'ember' },
  { id: 'drowned', text: 'Clear Drowned Sanctum', hint: 'C-rank gate beyond Emberfang.', near: 'c1', after: 'promote_c' },
  { id: 'promote_b', text: 'Take the B-rank exam', hint: 'Return to the Rank Examiner after the Sanctum.', near: 'guild', after: 'drowned' },
  { id: 'bastion', text: 'Clear Ironclad Bastion', hint: 'B-rank fortress gate at the far east.', near: 'b1', after: 'promote_b' },
  { id: 'promote_a', text: 'Take the A-rank exam', hint: 'Return to the Rank Examiner after Bastion.', near: 'guild', after: 'bastion' },
  { id: 'storm', text: 'Clear Stormspire', hint: 'A-rank spire at the far eastern road.', near: 'a1', after: 'promote_a' },
  { id: 'promote_s', text: 'Take the S-rank exam', hint: 'Return to the Rank Examiner after Stormspire.', near: 'guild', after: 'storm' },
  { id: 'eclipse', text: 'Clear Eclipse Sanctum', hint: 'S-rank gate beyond Stormspire.', near: 's1', after: 'promote_s' },
  { id: 'promote_ss', text: 'Take the SS-rank exam', hint: 'Return to the Rank Examiner after Eclipse.', near: 'guild', after: 'eclipse' },
  { id: 'astral', text: 'Clear Astral Foundry', hint: 'SS-rank forge gate on the far east road.', near: 'ss1', after: 'promote_ss' },
  { id: 'promote_sss', text: 'Take the SSS-rank exam', hint: 'Return to the Rank Examiner after the Foundry.', near: 'guild', after: 'astral' },
  { id: 'crown', text: 'Clear Mythic Crown', hint: 'SSS-rank finale at the end of the road.', near: 'sss1', after: 'promote_sss' },
];

export const XP_CURVE = (lv) => 40 + lv * 35;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const ri = (a, b) => (a + Math.floor(Math.random() * (b - a + 1)));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const gold = (n) => `${Math.round(n).toLocaleString('en-US')} G`;
export const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
export const walkTime = (meters) => Math.max(1, Math.round(meters / GAME.walkSpeed / 60 * 10) / 10);

export function shopPrice(base, itemRank, playerRank) {
  const d = rankIndex(itemRank) - rankIndex(playerRank);
  if (d > 1) return null;
  if (d === 1) return Math.round(base * 1.25);
  return base;
}

export function sellPrice(item) {
  const base = ITEMS[item.id]?.price || 0;
  return Math.round(base * (ITEMS[item.id]?.kind === 'mat' ? 0.5 : 0.35) * (item.qty || 1));
}
