import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const cache = new Map(); // path -> { scene, animations }
let ready = false;
let readyPromise = null;

/** Enemy / boss / prop / hero keys → CC0 Quaternius GLBs (see ASSETS.md). */
export const MODEL_PATHS = {
  // trash / wave foes
  slime: 'assets/models/enemies/frog.glb',
  rat: 'assets/models/enemies/rat.glb',
  sprout: 'assets/models/enemies/snake.glb',
  goblin: 'assets/models/characters/knight.glb',
  kobold: 'assets/models/enemies/fox.glb',
  crawler: 'assets/models/enemies/spider.glb',
  bat: 'assets/models/enemies/wasp.glb',
  pickskel: 'assets/models/characters/knight.glb',
  blob: 'assets/models/enemies/blob.glb',
  wolf: 'assets/models/enemies/wolf.glb',
  frog: 'assets/models/enemies/frog.glb',
  spider: 'assets/models/enemies/spider.glb',
  snake: 'assets/models/enemies/snake_angry.glb',
  wasp: 'assets/models/enemies/wasp.glb',
  deer: 'assets/models/enemies/deer.glb',
  sporeling: 'assets/models/bosses/mushnub.glb',
  rustslinger: 'assets/models/enemies/fox.glb',
  // floor / named bosses — dedicated Ultimate Monsters GLBs
  sporebrute: 'assets/models/bosses/mushnub_evolved.glb',
  ratking: 'assets/models/bosses/rat_king.glb',
  thornmatron: 'assets/models/bosses/cactoro.glb',
  gobwarcap: 'assets/models/bosses/orc.glb',
  gloomcap: 'assets/models/bosses/mushroom_king.glb',
  scrapsentinel: 'assets/models/bosses/goleling_evolved.glb',
  veincrawler: 'assets/models/bosses/crab.glb',
  batmatron: 'assets/models/bosses/armabee.glb',
  pickwraith: 'assets/models/bosses/ghost_skull.glb',
  grubnok: 'assets/models/bosses/orc_skull.glb',
  mushnub: 'assets/models/bosses/mushnub.glb',
  mushroom_king: 'assets/models/bosses/mushroom_king.glb',
  cactoro: 'assets/models/bosses/cactoro.glb',
  orc: 'assets/models/bosses/orc.glb',
  yeti: 'assets/models/bosses/yeti.glb',
  skeleton_boss: 'assets/models/bosses/skeleton.glb',
  demon: 'assets/models/bosses/demon.glb',
  blue_demon: 'assets/models/bosses/blue_demon.glb',
  hywirl: 'assets/models/bosses/hywirl.glb',
  green_spiky_blob: 'assets/models/bosses/green_spiky_blob.glb',
  // hero refs (city NPCs stay procedural; these unused for player)
  adventurer: 'assets/models/characters/adventurer.glb',
  knight: 'assets/models/characters/knight.glb',
  // props
  chest: 'assets/models/props/chest.glb',
  chest_gold: 'assets/models/props/chest_gold.glb',
  barrel: 'assets/models/props/barrel.glb',
  torch: 'assets/models/props/torch.glb',
  torch_wall: 'assets/models/props/torch_wall.glb',
  column: 'assets/models/props/column.glb',
  column_broken: 'assets/models/props/column_broken.glb',
  candelabrum: 'assets/models/props/candelabrum.glb',
  bones: 'assets/models/props/bones.glb',
  bones2: 'assets/models/props/bones2.glb',
  rock: 'assets/models/props/rock1.glb',
  rock2: 'assets/models/props/rock2.glb',
  rock3: 'assets/models/props/rock3.glb',
  nature_rock: 'assets/models/props/nature_rock.glb',
  rock_moss: 'assets/models/props/rock_moss.glb',
  rock_moss2: 'assets/models/props/rock_moss2.glb',
  bush: 'assets/models/props/bush.glb',
  bush_berries: 'assets/models/props/bush_berries.glb',
  tree: 'assets/models/props/tree.glb',
  tree_dead: 'assets/models/props/tree_dead.glb',
  stump_moss: 'assets/models/props/stump_moss.glb',
  plant1: 'assets/models/props/plant1.glb',
  plant3: 'assets/models/props/plant3.glb',
  grass: 'assets/models/props/grass.glb',
  skull: 'assets/models/props/skull.glb',
  crystal: 'assets/models/props/crystal.glb',
  stairs: 'assets/models/props/stairs.glb',
  cobweb: 'assets/models/props/cobweb.glb',
  crate: 'assets/models/props/crate.glb',
  spikes: 'assets/models/props/spikes.glb',
  woodfire: 'assets/models/props/woodfire.glb',
  vase: 'assets/models/props/vase.glb',
  pedestal: 'assets/models/props/pedestal.glb',
  bag_standing: 'assets/models/props/bag_standing.glb',
};

/**
 * Target world-unit height after normalize.
 * Player procedural mesh is ~1.85 tall — trash < player < floor bosses < named boss.
 */
const TARGET_H = {
  // trash
  slime: 0.95, rat: 0.72, sprout: 0.9, goblin: 1.35, kobold: 0.95,
  crawler: 0.7, bat: 0.7, pickskel: 1.4, blob: 0.9, wolf: 1.05,
  frog: 0.95, spider: 0.75, snake: 0.85, wasp: 0.7, deer: 1.2,
  sporeling: 0.85, rustslinger: 1.05,
  // bosses (taller than player ~1.85, but not giants)
  sporebrute: 2.15, ratking: 1.7, thornmatron: 2.0, gobwarcap: 2.05,
  gloomcap: 2.55, scrapsentinel: 2.15, veincrawler: 1.55, batmatron: 1.6,
  pickwraith: 2.1, grubnok: 2.35,
  mushnub: 1.7, mushroom_king: 2.55, cactoro: 2.0, orc: 2.05, yeti: 2.2,
  skeleton_boss: 2.0, demon: 2.15, blue_demon: 2.25, hywirl: 1.7, green_spiky_blob: 1.5,
  adventurer: 1.85, knight: 1.85,
  human_m_adventurer: 1.85, human_m_casual: 1.85, human_m_casual2: 1.85,
  human_m_worker: 1.85, human_m_punk: 1.85, human_m_suit: 1.85,
  human_f_adventurer: 1.78, human_f_casual: 1.78, human_f_medieval: 1.78,
  human_f_witch: 1.78, human_f_worker: 1.78, human_f_punk: 1.78,
  // props
  chest: 0.85, chest_gold: 0.95, barrel: 0.9, torch: 1.35, torch_wall: 1.2,
  column: 3.4, column_broken: 2.6, candelabrum: 1.35, bones: 0.55, bones2: 0.55,
  rock: 1.15, rock2: 1.05, rock3: 1.1, nature_rock: 1.25,
  rock_moss: 1.2, rock_moss2: 1.15,
  bush: 0.95, bush_berries: 0.95, tree: 3.6, tree_dead: 3.4, stump_moss: 0.85,
  plant1: 0.7, plant3: 0.65, grass: 0.35,
  skull: 0.4, crystal: 1.1, stairs: 1.6,
  cobweb: 1.0, crate: 0.85, spikes: 0.55, woodfire: 0.7, vase: 0.7,
  pedestal: 0.9, bag_standing: 0.75,
};

/** Soft accent only — keep Quaternius materials readable. */
const TINT = {
  slime: { hex: '#82c91e', amount: 0.28 },
  sprout: { hex: '#2f9e44', amount: 0.22 },
  goblin: { hex: '#37b24d', amount: 0.18 },
  pickskel: { hex: '#f1f3f5', amount: 0.2 },
  sporeling: { hex: '#94d82d', amount: 0.2 },
  rustslinger: { hex: '#fab005', amount: 0.22 },
  sporebrute: { hex: '#69db7c', amount: 0.18 },
  ratking: { hex: '#e67700', amount: 0.12 },
  thornmatron: { hex: '#2f9e44', amount: 0.12 },
  gobwarcap: { hex: '#c92a2a', amount: 0.2 },
  gloomcap: { hex: '#2f9e44', amount: 0.16 },
  scrapsentinel: { hex: '#868e96', amount: 0.14 },
  veincrawler: { hex: '#e8590c', amount: 0.12 },
  batmatron: { hex: '#fab005', amount: 0.14 },
  pickwraith: { hex: '#ced4da', amount: 0.16 },
  grubnok: { hex: '#fab005', amount: 0.16 },
};

function loadOne(path) {
  return new Promise((resolve, reject) => {
    loader.load(path, (gltf) => {
      gltf.scene.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) {
              if (!m) continue;
              if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
              m.side = THREE.FrontSide;
            }
          }
        }
      });
      resolve({ scene: gltf.scene, animations: gltf.animations || [] });
    }, undefined, reject);
  });
}

export function preloadModels(keys = Object.keys(MODEL_PATHS)) {
  const uniq = [...new Set(keys.map((k) => MODEL_PATHS[k]).filter(Boolean))];
  const missing = uniq.filter((p) => !cache.has(p));
  if (!missing.length && ready) return Promise.resolve(true);
  const loadMissing = Promise.all(missing.map(async (path) => {
    try {
      const data = await loadOne(path);
      cache.set(path, data);
    } catch (err) {
      console.warn('[Vaelgate] model failed', path, err);
    }
  }));
  readyPromise = (readyPromise || Promise.resolve()).then(() => loadMissing).then(() => {
    ready = true;
    return true;
  });
  return readyPromise;
}

export function modelsReady() {
  return ready;
}

export function getCachedModel(pathOrKey) {
  const path = MODEL_PATHS[pathOrKey] || pathOrKey;
  return cache.get(path) || null;
}

function fitToGround(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  if (!Number.isFinite(box.min.y)) return;
  root.position.y -= box.min.y;
}

/** Scale root so its vertical size matches targetH world units. */
function fitHeight(root, targetH) {
  if (!(targetH > 0)) return 1;
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const h = box.max.y - box.min.y;
  if (!(h > 0.01)) return 1;
  const s = targetH / h;
  root.scale.multiplyScalar(s);
  fitToGround(root);
  return s;
}

function applyTint(root, tint) {
  if (!tint?.hex) return;
  const amount = tint.amount ?? 0.25;
  const color = new THREE.Color(tint.hex);
  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const next = mats.map((m) => {
      if (!m?.color) return m;
      const cloned = m.clone();
      cloned.color.lerp(color, amount);
      return cloned;
    });
    o.material = Array.isArray(o.material) ? next : next[0];
  });
}

/**
 * Clone a prepared model into a Group. Returns null if not loaded.
 * @returns {{ group: THREE.Group, mixer?: THREE.AnimationMixer } | null}
 */
export function createModelInstance(key, opts = {}) {
  const path = MODEL_PATHS[key];
  if (!path || !cache.has(path)) return null;
  const src = cache.get(path);
  const clone = SkeletonUtils.clone(src.scene);
  const group = new THREE.Group();
  group.add(clone);

  // Optional pre-scale, then normalize to target height (prevents oversized Quaternius packs)
  if (opts.preScale) clone.scale.multiplyScalar(opts.preScale);
  const targetH = opts.height ?? TARGET_H[key] ?? 1.2;
  const applied = fitHeight(clone, targetH * (opts.heightMul || 1));
  applyTint(clone, opts.tint ?? TINT[key]);

  const shadowR = Math.max(0.28, Math.min(1.35, targetH * 0.32));
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(shadowR, 20),
    new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.28 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  group.add(shadow);

  let mixer = null;
  if (src.animations?.length) {
    mixer = new THREE.AnimationMixer(clone);
    const clip = src.animations.find((a) => /idle|walk|run|fly/i.test(a.name)) || src.animations[0];
    const action = mixer.clipAction(clip);
    action.play();
  }

  group.userData.modelKey = key;
  group.userData.mixer = mixer;
  group.userData.animations = src.animations;
  group.userData.targetH = targetH;
  group.userData.fitScale = applied;
  return { group, mixer, animations: src.animations };
}

/** Switch mixer clip by name preference list (e.g. walk / idle). */
export function playModelClip(groupOrMixer, names, fade = 0.15) {
  const mixer = groupOrMixer?.isAnimationMixer
    ? groupOrMixer
    : groupOrMixer?.userData?.mixer || groupOrMixer?.mixer;
  const clips = groupOrMixer?.userData?.animations
    || groupOrMixer?.animations
    || [];
  if (!mixer || !clips.length) return null;
  const list = Array.isArray(names) ? names : [names];
  let clip = null;
  for (const n of list) {
    clip = clips.find((c) => new RegExp(n, 'i').test(c.name));
    if (clip) break;
  }
  if (!clip) clip = clips[0];
  const next = mixer.clipAction(clip);
  if (mixer.userData?.currentAction === next) return next;
  const prev = mixer.userData?.currentAction;
  if (prev && prev !== next) prev.fadeOut(fade);
  next.reset().fadeIn(fade).play();
  mixer.userData = mixer.userData || {};
  mixer.userData.currentAction = next;
  return next;
}

export function createEnemyModel(enemyId, def = {}) {
  const key = MODEL_PATHS[enemyId] ? enemyId
    : def.name?.includes('Slime') ? 'slime'
    : def.name?.includes('Rat') ? 'rat'
    : def.name?.includes('Bat') ? 'bat'
    : def.name?.includes('Crawler') ? 'crawler'
    : def.name?.includes('Goblin') || def.name?.includes('Kobold') ? 'goblin'
    : def.name?.includes('Wolf') ? 'wolf'
    : 'blob';
  const mul = def.scale || 1;
  return createModelInstance(key, { heightMul: mul });
}

export function createBossModel(bossId) {
  return createModelInstance(bossId);
}

export function createPropModel(key, scale) {
  // Optional relative mul only (0.6–1.35). Ignore old absolute scale args.
  let heightMul = 1;
  if (scale != null && Number.isFinite(scale) && scale >= 0.5 && scale <= 1.4) {
    heightMul = scale;
  }
  return createModelInstance(key, { heightMul });
}

export function createHeroModel(key = 'knight', heightMul = 1) {
  return createModelInstance(key, { heightMul });
}
