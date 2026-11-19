import * as THREE from 'three';
import { createModelInstance, MODEL_PATHS } from './modelLoader.js';

/**
 * Quaternius Modular Men / Women (CC0).
 * Separate male/female meshes; Skin / Hair / cloth materials are tintable.
 * Outfit GLBs ship with no clips — limbs are driven procedurally from bones.
 */

const OUTFIT_BY_CLASS = {
  vanguard: { m: 'human_m_adventurer', f: 'human_f_adventurer' },
  duelist: { m: 'human_m_casual', f: 'human_f_casual' },
  arcanist: { m: 'human_m_suit', f: 'human_f_witch' },
  ranger: { m: 'human_m_worker', f: 'human_f_worker' },
  shadeblade: { m: 'human_m_punk', f: 'human_f_punk' },
  lightbearer: { m: 'human_m_casual2', f: 'human_f_medieval' },
};

const OUTFIT_NPC = {
  m: ['human_m_adventurer', 'human_m_casual', 'human_m_casual2', 'human_m_worker', 'human_m_suit', 'human_m_punk'],
  f: ['human_f_adventurer', 'human_f_casual', 'human_f_medieval', 'human_f_witch', 'human_f_worker', 'human_f_punk'],
};

export const HUMAN_MODEL_PATHS = {
  human_m_adventurer: 'assets/models/humans/male/adventurer.glb',
  human_m_casual: 'assets/models/humans/male/casual.glb',
  human_m_casual2: 'assets/models/humans/male/casual2.glb',
  human_m_worker: 'assets/models/humans/male/worker.glb',
  human_m_punk: 'assets/models/humans/male/punk.glb',
  human_m_suit: 'assets/models/humans/male/suit.glb',
  human_f_adventurer: 'assets/models/humans/female/adventurer.glb',
  human_f_casual: 'assets/models/humans/female/casual.glb',
  human_f_medieval: 'assets/models/humans/female/medieval.glb',
  human_f_witch: 'assets/models/humans/female/witch.glb',
  human_f_worker: 'assets/models/humans/female/worker.glb',
  human_f_punk: 'assets/models/humans/female/punk.glb',
};

Object.assign(MODEL_PATHS, HUMAN_MODEL_PATHS);

// GLTFLoader strips dots from node names: UpperArm.L → UpperArmL
const BONE_NAMES = [
  'Hips', 'Abdomen', 'Torso', 'Chest', 'Neck', 'Head',
  'ShoulderL', 'UpperArmL', 'LowerArmL', 'HandL',
  'ShoulderR', 'UpperArmR', 'LowerArmR', 'HandR',
  'UpperLegL', 'LowerLegL', 'FootL',
  'UpperLegR', 'LowerLegR', 'FootR',
];

function isFemale(look = {}) {
  return look.body === 'f' || look.gender === 'f' || look.sex === 'f';
}

function pickOutfitKey(look = {}) {
  const sex = isFemale(look) ? 'f' : 'm';
  if (look.outfit && MODEL_PATHS[look.outfit]) return look.outfit;
  if (look.classId && OUTFIT_BY_CLASS[look.classId]) {
    return OUTFIT_BY_CLASS[look.classId][sex];
  }
  const pool = OUTFIT_NPC[sex];
  const seed = `${look.shirt || ''}${look.hair || ''}${look.skin || ''}${look.hairStyle || ''}${look.name || ''}`.length
    + (look.seed || 0);
  return pool[Math.abs(seed) % pool.length];
}

/** True hair mats (tint these). Broader set used only for bald-hide. */
function isHairTintMaterial(matName = '', meshName = '') {
  const mat = (matName || '').toLowerCase();
  const mesh = (meshName || '').toLowerCase();
  if (/hair/.test(mat) || /eyebrow|moustache|mustache/.test(mat)) return true;
  // Some female heads name hair DarkBrown / Black (not Hair_*)
  if (/head/.test(mesh) && /^(darkbrown|black|brown2|brown_02)$/.test(mat)) return true;
  return false;
}

function isHairHideMaterial(matName = '', meshName = '') {
  if (isHairTintMaterial(matName, meshName)) return !/eyebrow|moustache|mustache/.test((matName || '').toLowerCase());
  const mat = (matName || '').toLowerCase();
  const mesh = (meshName || '').toLowerCase();
  if (!/head/.test(mesh)) return false;
  if (/skin|eye|gold|metal|earring|white|green|purple|pink|orange|grey|gray|worker|yellow|suit|tie/.test(mat)) return false;
  return /brown|black|blond|blonde|darkbrown|lightbrown|^red$|red_dark/.test(mat);
}

function matBucket(matName = '', meshName = '') {
  const mat = (matName || '').toLowerCase();
  const mesh = (meshName || '').toLowerCase();
  const n = `${mat} ${mesh}`;
  if (/skin/.test(n)) return 'skin';
  if (isHairTintMaterial(matName, meshName)) return 'hair';
  if (/eye(?!b)/.test(n)) return 'eye';
  if (/leg|pant|boot|feet|shoe/.test(n) && !/skin|hair/.test(n)) return 'pants';
  if (/gold|metal|buckle/.test(n)) return 'accent';
  return 'cloth';
}

function tintHuman(root, look = {}) {
  const skin = new THREE.Color(look.skin || '#cead86');
  const hair = new THREE.Color(look.hair || '#3e3429');
  const cloth = new THREE.Color(look.shirt || '#4c6ef5');
  const pants = new THREE.Color(look.pants || look.shirt || '#343a40');
  const accent = look.vest ? new THREE.Color(look.vest) : null;
  const bald = (look.hairStyle || '') === 'bald';

  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const wasArr = Array.isArray(o.material);
    const mats = wasArr ? o.material : [o.material];
    const next = mats.map((m) => {
      if (!m?.color) return m;
      const bucket = matBucket(m.name || '', o.name || '');
      const c = m.clone();
      if (bucket === 'skin') {
        c.color.copy(skin);
      } else if (bucket === 'hair') {
        if (bald && isHairHideMaterial(m.name || '', o.name || '')) {
          c.visible = false;
          c.transparent = true;
          c.opacity = 0;
          c.depthWrite = false;
        } else {
          // Keep baked value so hair doesn't turn into a flat helmet
          c.color.copy(hair);
          c.color.lerp(new THREE.Color(m.color), 0.28);
        }
      } else if (bucket === 'eye') {
        c.color.set('#1a1410');
      } else if (bucket === 'pants') {
        c.color.copy(pants);
        c.color.lerp(new THREE.Color(m.color), 0.2);
      } else if (bucket === 'accent' && accent) {
        c.color.copy(accent);
        c.color.lerp(new THREE.Color(m.color), 0.3);
      } else if (bucket === 'cloth') {
        c.color.copy(cloth);
        c.color.lerp(new THREE.Color(m.color), 0.22);
      }
      return c;
    });
    o.material = wasArr ? next : next[0];
    o.castShadow = true;
    o.receiveShadow = true;
  });
}

const _q = new THREE.Quaternion();
const _e = new THREE.Euler(0, 0, 0, 'XYZ');

function cacheBones(root) {
  const bones = {};
  let skel = null;
  root.traverse((o) => {
    if (o.isSkinnedMesh && o.skeleton) skel = o.skeleton;
  });
  // Prefer skeleton.bones — guaranteed to drive skinning
  const list = skel?.bones?.length
    ? skel.bones
    : (() => { const a = []; root.traverse((o) => { if (o.isBone) a.push(o); }); return a; })();
  for (const bone of list) {
    if (BONE_NAMES.includes(bone.name)) bones[bone.name] = bone;
  }
  const bind = {};
  for (const [k, bone] of Object.entries(bones)) {
    bind[k] = bone.quaternion.clone();
  }
  return { bones, bind };
}

/** Restore bind pose, then apply local XYZ euler delta (radians). */
function setBone(bones, bind, name, dx = 0, dy = 0, dz = 0) {
  const bone = bones?.[name];
  const b = bind?.[name];
  if (!bone || !b) return;
  bone.quaternion.copy(b);
  if (dx !== 0) bone.rotateX(dx);
  if (dy !== 0) bone.rotateY(dy);
  if (dz !== 0) bone.rotateZ(dz);
}

/**
 * Procedural Idle / Walk / Run on Quaternius CharacterArmature.
 * Axes from HandL/FootL bone world deltas after height-normalize:
 *   Arm hang-down = -X (both sides), arm/leg swing fore-aft = Z
 *   Same-sign Z on L/R produces opposite limb phases on this rig.
 */
export function animateHumanBones(p, mode, t, move = 0) {
  const bones = p?.bones;
  const bind = p?.bind;
  if (!bones || !bind || !bones.UpperArmL) return;

  const locomoting = mode === 'walk' || mode === 'run';
  const speed = mode === 'run' ? 10 : 7.2;
  // Keep swing modest — this rig's Z axis moves feet a long way
  const amp = locomoting ? (mode === 'run' ? 0.38 : 0.28) * (0.85 + move * 0.15) : 0;
  const swing = Math.sin(t * speed) * amp;
  const breath = Math.sin(t * 2.2) * 0.025;
  // Natural hang — between wide A-pose and clipped-into-body
  const hang = 1.48;
  const tuck = 0.1;

  setBone(bones, bind, 'Chest', breath * 0.3, 0, 0);
  setBone(bones, bind, 'Torso', breath * 0.15, 0, 0);
  setBone(bones, bind, 'Hips', locomoting ? Math.sin(t * speed) * 0.025 : 0, 0, 0);

  // Legs — Z swing (same sign = opposite phases on this armature)
  setBone(bones, bind, 'UpperLegL', 0, 0, swing);
  setBone(bones, bind, 'UpperLegR', 0, 0, swing);
  setBone(bones, bind, 'LowerLegL', Math.max(0, -swing) * 0.85, 0, 0);
  setBone(bones, bind, 'LowerLegR', Math.max(0, swing) * 0.85, 0, 0);

  // Arms — hang on -X, light inward tuck, swing fore/aft on Z
  const armSwing = locomoting ? -swing * 0.85 : Math.sin(t * 1.7) * 0.04;
  setBone(bones, bind, 'UpperArmL', -hang, 0.02, tuck + armSwing);
  setBone(bones, bind, 'UpperArmR', -hang, -0.02, -tuck + armSwing);
  setBone(bones, bind, 'LowerArmL', 0.32 + Math.max(0, -armSwing) * 0.25, 0, 0);
  setBone(bones, bind, 'LowerArmR', 0.32 + Math.max(0, armSwing) * 0.25, 0, 0);

  if (mode === 'attack') {
    setBone(bones, bind, 'UpperArmR', -0.4 + Math.sin(t * 18) * 0.12, -0.2, -1.0);
    setBone(bones, bind, 'LowerArmR', 0.55, 0, 0);
  } else if (mode === 'cast') {
    setBone(bones, bind, 'UpperArmL', -0.5, 0.15, -1.0);
    setBone(bones, bind, 'UpperArmR', -0.5, -0.15, -1.0);
  } else if (mode === 'guard') {
    setBone(bones, bind, 'UpperArmL', -0.7, 0.25, -0.6);
    setBone(bones, bind, 'UpperArmR', -0.7, -0.25, -0.6);
  } else if (mode === 'dead') {
    setBone(bones, bind, 'Hips', 1.2, 0, 0);
  }

  // Push bone matrices into skinning
  p.group?.traverse?.((o) => {
    if (o.isSkinnedMesh) o.skeleton?.update?.();
  });
}

/**
 * Build a textured modular human. Returns null if models not preloaded.
 */
export function buildTexturedHuman(look = {}) {
  const key = pickOutfitKey(look);
  const inst = createModelInstance(key, { height: isFemale(look) ? 1.78 : 1.85 });
  if (!inst?.group) return null;

  const character = inst.group.children.find((c) => !c.isSprite && c.type !== 'Mesh') || inst.group.children[0];
  const tintRoot = character || inst.group;
  tintHuman(tintRoot, look);

  const { bones, bind } = cacheBones(inst.group);
  // Outfit GLBs have no clips; knight Idle quats don't share bind pose — drive bones procedurally.
  const person = {
    group: inst.group,
    body: inst.group,
    torso: inst.group,
    head: bones.Head || inst.group,
    legs: [],
    arms: [],
    weapon: null,
    shadow: null,
    look,
    bones,
    bind,
    mixer: null,
    animations: [],
    glb: true,
    useClips: false,
    gendered: isFemale(look) ? 'f' : 'm',
    outfit: key,
  };
  animateHumanBones(person, 'idle', 0, 0);
  return person;
}

export function humanOutfitForClass(classId, body = 'm') {
  const sex = body === 'f' ? 'f' : 'm';
  return OUTFIT_BY_CLASS[classId]?.[sex] || (sex === 'f' ? 'human_f_casual' : 'human_m_casual');
}
