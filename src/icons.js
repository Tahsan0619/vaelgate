/** Flat SVG icons (no emoji). Transparent, scaled via CSS. */

const C = {
  ink: '#1b263b', gold: '#c9922a', red: '#c92a2a', blue: '#1c7ed6',
  green: '#2f9e44', purple: '#7048e8', teal: '#0b7285', orange: '#e67700',
  grey: '#495057', white: '#f8f9fa', brown: '#8b5a2b',
};

function svg(body, view = 24) {
  return `<svg class="ico" viewBox="0 0 ${view} ${view}" width="1em" height="1em" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

const ICONS = {
  sword: () => svg(`<path fill="${C.grey}" d="M13 3l8 8-1.5 1.5-2-2-7.5 7.5H7v-2.5L14.5 8l-2-2L13 3z"/><path fill="${C.gold}" d="M6 16l2 2-3 3H3v-2l3-3z"/>`),
  shield: () => svg(`<path fill="${C.blue}" d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/><path fill="${C.white}" d="M12 5l5 2v4.2c0 3.2-2.2 5.8-5 7.2-2.8-1.4-5-4-5-7.2V7l5-2z"/>`),
  staff: () => svg(`<rect x="11" y="4" width="2" height="16" rx="1" fill="${C.brown}"/><circle cx="12" cy="4" r="3" fill="${C.purple}"/>`),
  bow: () => svg(`<path fill="none" stroke="${C.brown}" stroke-width="2" d="M6 4c6 2 10 6 12 12"/><path fill="none" stroke="${C.grey}" stroke-width="1.5" d="M7 5l10 10"/><circle cx="18" cy="16" r="1.5" fill="${C.gold}"/>`),
  dagger: () => svg(`<path fill="${C.grey}" d="M12 2l2 8H10L12 2z"/><rect x="10" y="10" width="4" height="2" fill="${C.gold}"/><rect x="11" y="12" width="2" height="8" fill="${C.brown}"/>`),
  mace: () => svg(`<rect x="11" y="10" width="2" height="11" fill="${C.grey}"/><rect x="8" y="4" width="8" height="8" rx="1" fill="${C.gold}"/>`),
  fire: () => svg(`<path fill="${C.orange}" d="M12 2s4 5 4 9a4 4 0 11-8 0c0-2 1.5-4 2.5-5.5C11 7 12 2 12 2z"/><path fill="${C.gold}" d="M12 10c1.2 1 2 2.2 2 3.5a2 2 0 11-4 0c0-.8.5-1.6 1-2.2.3.5.7.7 1 .7z"/>`),
  ice: () => svg(`<path stroke="${C.blue}" stroke-width="1.6" fill="none" d="M12 3v18M5 7l14 10M19 7L5 17"/><circle cx="12" cy="12" r="2" fill="${C.blue}"/>`),
  bolt: () => svg(`<path fill="${C.gold}" d="M13 2L6 13h5l-1 9 8-12h-5l0-8z"/>`),
  heal: () => svg(`<circle cx="12" cy="12" r="9" fill="${C.green}"/><path stroke="${C.white}" stroke-width="2.5" d="M12 7v10M7 12h10"/>`),
  sparkle: () => svg(`<path fill="${C.gold}" d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/>`),
  purify: () => svg(`<path fill="${C.teal}" d="M12 3c4 4 6 7 6 10a6 6 0 11-12 0c0-3 2-6 6-10z"/><path fill="${C.white}" d="M12 9c2 2 3 3.5 3 5a3 3 0 11-6 0c0-1.5 1-3 3-5z"/>`),
  fist: () => svg(`<rect x="5" y="9" width="14" height="9" rx="2" fill="${C.ink}"/><rect x="6" y="6" width="3" height="5" rx="1" fill="${C.ink}"/><rect x="10" y="5" width="3" height="6" rx="1" fill="${C.ink}"/><rect x="14" y="6" width="3" height="5" rx="1" fill="${C.ink}"/>`),
  hand: () => svg(`<path fill="${C.ink}" d="M8 11V6a1.5 1.5 0 013 0v4h1V5a1.5 1.5 0 013 0v6h1V7a1.5 1.5 0 013 0v8c0 3-2 5-5 5H11c-3 0-5-2-5-4v-5a1.5 1.5 0 013 0v2"/>`),
  brick: () => svg(`<rect x="3" y="5" width="18" height="14" rx="1" fill="${C.grey}"/><path stroke="${C.white}" stroke-width="1" d="M3 10h18M3 15h18M9 5v5M15 10v5M12 15v4"/>`),
  horn: () => svg(`<path fill="${C.orange}" d="M4 14c0-4 3-8 8-9 2 3 4 6 4 9H4z"/><path fill="${C.gold}" d="M16 8l5-4v6l-5-2z"/>`),
  moon: () => svg(`<path fill="${C.ink}" d="M14 3a9 9 0 108 11A7 7 0 0114 3z"/>`),
  poison: () => svg(`<circle cx="12" cy="13" r="7" fill="${C.purple}"/><path fill="${C.white}" d="M10 11h4v2h-1v3h-2v-3h-1z"/><path fill="${C.green}" d="M11 4h2l1 4h-4z"/>`),
  trap: () => svg(`<path fill="none" stroke="${C.green}" stroke-width="1.5" d="M4 8c4 2 4 6 0 8M20 8c-4 2-4 6 0 8M8 4c2 4 6 4 8 0M8 20c2-4 6-4 8 0"/><circle cx="12" cy="12" r="2" fill="${C.ink}"/>`),
  scout: () => svg(`<circle cx="11" cy="11" r="6" fill="none" stroke="${C.teal}" stroke-width="2"/><path stroke="${C.teal}" stroke-width="2" d="M16 16l5 5"/>`),
  guild: () => svg(`<path fill="${C.red}" d="M4 10l8-6 8 6v10H4V10z"/><rect x="10" y="13" width="4" height="7" fill="${C.gold}"/>`),
  market: () => svg(`<path fill="${C.orange}" d="M3 9l2-5h14l2 5v2H3V9z"/><rect x="4" y="11" width="16" height="9" fill="${C.brown}"/><path fill="${C.gold}" d="M8 14h3v6H8zM13 14h3v6h-3z"/>`),
  healer: () => svg(`<rect x="4" y="4" width="16" height="16" rx="2" fill="${C.white}" stroke="${C.red}" stroke-width="1.5"/><path stroke="${C.red}" stroke-width="2.5" d="M12 7v10M7 12h10"/>`),
  food: () => svg(`<ellipse cx="12" cy="16" rx="8" ry="4" fill="${C.brown}"/><ellipse cx="12" cy="14" rx="7" ry="3" fill="${C.orange}"/><circle cx="9" cy="13" r="1.2" fill="${C.green}"/><circle cx="14" cy="12.5" r="1" fill="${C.red}"/>`),
  smith: () => svg(`<path fill="${C.grey}" d="M6 14l4-4 8 8-4 4-8-8z"/><path fill="${C.brown}" d="M3 18l3 3 2-2-3-3z"/><path fill="${C.gold}" d="M14 4l6 2-2 6-3-3-3 1 2-6z"/>`),
  stage: () => svg(`<path fill="${C.purple}" d="M4 18h16v2H4zM6 10h12v8H6z"/><path fill="${C.gold}" d="M8 6l2 4H8l1 3-3-2-3 2 1-3H2l2-4h2l2-3 2 3z"/>`),
  mushroom: () => svg(`<path fill="${C.red}" d="M5 11a7 7 0 0114 0H5z"/><circle cx="9" cy="8" r="1.2" fill="${C.white}"/><circle cx="14" cy="9" r="1" fill="${C.white}"/><rect x="10" y="11" width="4" height="8" rx="1" fill="${C.white}"/>`),
  pickaxe: () => svg(`<path fill="${C.grey}" d="M4 8l6-4 2 2-4 4L4 8z"/><rect x="11" y="9" width="2.5" height="12" transform="rotate(-35 12 15)" fill="${C.brown}"/>`),
  skull: () => svg(`<circle cx="12" cy="10" r="7" fill="${C.white}"/><circle cx="9" cy="10" r="1.5" fill="${C.ink}"/><circle cx="15" cy="10" r="1.5" fill="${C.ink}"/><path fill="${C.ink}" d="M10 14h4v1.5h-4z"/><path fill="${C.white}" d="M9 17h2v3H9zM13 17h2v3h-2z"/>`),
  gate: () => svg(`<path fill="${C.grey}" d="M5 20V8l7-5 7 5v12H5z"/><path fill="${C.gold}" d="M10 12h4v8h-4z"/>`),
  wave: () => svg(`<path fill="${C.blue}" d="M3 14c2-3 4-3 6 0s4 3 6 0 4-3 6 0v5H3v-5z"/><path fill="${C.teal}" d="M3 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0v2c-2-2-4-2-6 0s-4 3-6 0-4-2-6 0V10z"/>`),
  castle: () => svg(`<path fill="${C.grey}" d="M4 20V9h3v3h3V9h4v3h3V9h3v11H4z"/><path fill="${C.red}" d="M4 9V5h2v2h2V5h2v4H4zM14 9V5h2v2h2V5h2v4h-6z"/>`),
  storm: () => svg(`<path fill="${C.grey}" d="M8 10a5 5 0 019.5 1.5H19a3 3 0 010 6H7a4 4 0 01-.5-8H8z"/><path fill="${C.gold}" d="M13 14l-3 5h3l-1 4 5-6h-3l2-3z"/>`),
  map: () => svg(`<path fill="${C.gold}" d="M4 5l5 2 6-3 5 2v15l-5-2-6 3-5-2V5z"/><path fill="${C.green}" d="M9 7v13l6-3V5L9 7z"/>`),
  card: () => svg(`<rect x="3" y="5" width="18" height="14" rx="2" fill="${C.ink}"/><rect x="5" y="7" width="6" height="6" rx="1" fill="${C.gold}"/><rect x="13" y="8" width="6" height="1.5" fill="${C.white}"/><rect x="13" y="11" width="5" height="1.5" fill="${C.white}"/><rect x="5" y="15" width="14" height="1.5" fill="${C.white}"/>`),
  clipboard: () => svg(`<rect x="5" y="4" width="14" height="17" rx="2" fill="${C.white}" stroke="${C.ink}" stroke-width="1.5"/><rect x="8" y="2" width="8" height="4" rx="1" fill="${C.gold}"/><path stroke="${C.ink}" stroke-width="1.5" d="M8 10h8M8 14h8M8 18h5"/>`),
  pause: () => svg(`<rect x="6" y="5" width="4" height="14" rx="1" fill="${C.ink}"/><rect x="14" y="5" width="4" height="14" rx="1" fill="${C.ink}"/>`),
  bag: () => svg(`<path fill="${C.brown}" d="M6 9h12l1 11H5L6 9z"/><path fill="none" stroke="${C.gold}" stroke-width="1.5" d="M9 9V7a3 3 0 016 0v2"/>`),
  use: () => svg(`<circle cx="12" cy="12" r="9" fill="${C.teal}"/><path fill="${C.white}" d="M11 7h2v6h-2zM10 15h4v2h-4z"/>`),
  attack: () => svg(`<path fill="${C.red}" d="M5 19L12 4l7 15H5z"/><path fill="${C.white}" d="M12 10v5"/>`),
  dodge: () => svg(`<path fill="none" stroke="${C.blue}" stroke-width="2" d="M5 12h10"/><path fill="${C.blue}" d="M14 8l5 4-5 4V8z"/>`),
  bread: () => svg(`<ellipse cx="12" cy="13" rx="8" ry="5" fill="${C.gold}"/><ellipse cx="12" cy="11" rx="7" ry="3.5" fill="${C.orange}"/>`),
  meat: () => svg(`<path fill="${C.red}" d="M7 8c4-4 10-2 12 3s-2 10-7 10S3 14 7 8z"/><circle cx="16" cy="9" r="2" fill="${C.white}"/>`),
  potion: () => svg(`<path fill="${C.red}" d="M9 10h6l1 10H8L9 10z"/><rect x="9" y="5" width="6" height="5" fill="${C.grey}"/><rect x="10" y="3" width="4" height="3" fill="${C.gold}"/>`),
  antidote: () => svg(`<path fill="${C.green}" d="M9 10h6l1 10H8L9 10z"/><rect x="9" y="5" width="6" height="5" fill="${C.grey}"/>`),
  torch: () => svg(`<rect x="11" y="10" width="2" height="11" fill="${C.brown}"/><path fill="${C.orange}" d="M12 2s3 3 3 6a3 3 0 11-6 0c0-3 3-6 3-6z"/>`),
  gem: () => svg(`<path fill="${C.green}" d="M12 3l7 7-7 11L5 10l7-7z"/><path fill="${C.white}" opacity=".4" d="M12 3l3 7H9l3-7z"/>`),
  leaf: () => svg(`<path fill="${C.green}" d="M12 3c6 2 8 8 6 14-4 1-8-1-10-5-2-4 0-8 4-9z"/><path stroke="${C.ink}" stroke-width="1" fill="none" d="M12 5v12"/>`),
  gear: () => svg(`<circle cx="12" cy="12" r="3" fill="${C.grey}"/><path fill="${C.grey}" d="M10 2h4l1 3 3 1 2-2 3 3-2 2 1 3 3 1v4l-3 1-1 3 2 2-3 3-2-2-3 1-1 3h-4l-1-3-3-1-2 2-3-3 2-2-1-3-3-1v-4l3-1 1-3-2-2 3-3 2 2 3-1z"/>`),
  wrench: () => svg(`<path fill="${C.grey}" d="M18 4a4 4 0 00-5 5l-7 7 3 3 7-7a4 4 0 005-5l-3 2-2-2 2-3z"/>`),
  bone: () => svg(`<path fill="${C.white}" stroke="${C.grey}" d="M5 7a2 2 0 113 3l8 8a2 2 0 11-3 3L5 13a2 2 0 010-6z"/>`),
  ghost: () => svg(`<path fill="${C.blue}" d="M12 3a7 7 0 017 7v9l-2.5-2-2.5 2-2.5-2L9 19l-2.5-2L4 19v-9a8 8 0 018-7z"/><circle cx="9.5" cy="11" r="1.2" fill="${C.ink}"/><circle cx="14.5" cy="11" r="1.2" fill="${C.ink}"/>`),
  vest: () => svg(`<path fill="${C.teal}" d="M8 4l4 3 4-3 3 4v13H5V8l3-4z"/><path fill="${C.gold}" d="M10 10h4v8h-4z"/>`),
  boot: () => svg(`<path fill="${C.brown}" d="M8 4h5v10h5v4H6V9c0-2 1-5 2-5z"/>`),
  helm: () => svg(`<path fill="${C.grey}" d="M5 13a7 7 0 0114 0v5H5v-5z"/><path fill="${C.gold}" d="M7 10h10v2H7z"/>`),
  chest: () => svg(`<rect x="4" y="8" width="16" height="11" rx="1" fill="${C.brown}"/><rect x="4" y="8" width="16" height="3" fill="${C.gold}"/><circle cx="12" cy="14" r="1.5" fill="${C.gold}"/>`),
  check: () => svg(`<circle cx="12" cy="12" r="9" fill="${C.green}"/><path stroke="${C.white}" stroke-width="2.5" fill="none" d="M7 12l3 3 7-7"/>`),
  lock: () => svg(`<rect x="6" y="10" width="12" height="10" rx="1" fill="${C.grey}"/><path fill="none" stroke="${C.grey}" stroke-width="2" d="M8 10V8a4 4 0 018 0v2"/><circle cx="12" cy="15" r="1.5" fill="${C.gold}"/>`),
  arrow: () => svg(`<path fill="${C.gold}" d="M12 4l8 8-8 8-1.5-1.5L16 13H4v-2h12l-5.5-5.5z"/>`),
  player: () => svg(`<circle cx="12" cy="8" r="4" fill="${C.ink}"/><path fill="${C.ink}" d="M5 20c1-4 4-6 7-6s6 2 7 6"/>`),
  star: () => svg(`<path fill="${C.gold}" d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2L12 16.5 5.7 20.8 8 13.6 2 9.2h7.6z"/>`),
  coin: () => svg(`<circle cx="12" cy="12" r="9" fill="${C.gold}"/><circle cx="12" cy="12" r="6" fill="none" stroke="${C.orange}" stroke-width="1.5"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="700" fill="${C.brown}">G</text>`),
};

export function icon(name, cls = '') {
  const fn = ICONS[name] || ICONS.star;
  const html = fn();
  return cls ? html.replace('class="ico"', `class="ico ${cls}"`) : html;
}

export function iconNameForItem(id, fallback = 'star') {
  const map = {
    bread: 'bread', meat: 'meat', stew: 'food', roast: 'meat', potion: 'potion', antidote: 'antidote',
    torch: 'torch', slime_gel: 'gem', moss_fiber: 'leaf', iron_scrap: 'gear', rusty_gear: 'wrench',
    bone_dust: 'bone', ectoplasm: 'ghost', f_sword: 'sword', f_staff: 'staff', f_bow: 'bow',
    f_shield: 'shield', f_chest: 'vest', f_boots: 'boot', e_mace: 'mace', e_helm: 'helm',
    moss_blade: 'sword', rust_plate: 'vest', hollow_blade: 'sword',
    ember_core: 'fire', wolf_pelt: 'vest', ashen_blade: 'dagger',
    tide_scale: 'wave', siren_pearl: 'gem', tide_staff: 'staff',
    steel_plate: 'vest', clockwork_core: 'gear', bastion_shield: 'shield',
    storm_shard: 'storm', gale_feather: 'leaf', storm_lance: 'sword',
    eclipse_shard: 'moon', solar_dust: 'sparkle', eclipse_blade: 'dagger',
    astral_ore: 'star', foundry_ember: 'fire', astral_hammer: 'mace',
    mythic_prism: 'gem', crown_filament: 'sparkle', mythic_scepter: 'staff',
    cos_eclipse_cloak: 'moon', cos_astral_sigil: 'star', cos_mythic_crown: 'sparkle',
  };
  return map[id] || fallback;
}

export { ICONS };
