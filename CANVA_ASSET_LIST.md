# Vaelgate — Canva Asset Checklist

Use this as your full Canva export list. Make **transparent PNG** unless noted. Keep a consistent art style (fantasy RPG, readable at small size).

**Suggested save root:** `vaelgate/assets/ui/`  
(Boss portraits already use `vaelgate/assets/bosses/`)

**Export tips**
- Icons: **256×256** (or 512×512), transparent background, simple silhouette
- Buttons / slots: export at **2×** the on-screen size
- Portraits: **1024×1024** square (game crops to circle/card)
- Wide banners: **1920×1080** or **1600×600**
- Keep filenames **exact** as listed (lowercase, underscores)

---

## 1. Brand & screens

| # | File to make | Size | Notes |
|---|--------------|------|--------|
| 1 | `ui/brand/logo_vaelgate.png` | 1024×1024 | Main crest / wordmark |
| 2 | `ui/brand/logo_wordmark.png` | 1600×400 | “Vaelgate” title text art |
| 3 | `ui/brand/subtitle_rise.png` | 1200×200 | “Rise of the Guild” |
| 4 | `ui/screens/title_bg.png` | 1920×1080 | Title screen background (city / gate) |
| 5 | `ui/screens/title_card_frame.png` | 1200×900 | Frame behind title text |
| 6 | `ui/screens/creator_bg.png` | 1920×1080 | Character creation backdrop |
| 7 | `ui/screens/pause_frame.png` | 900×700 | Pause menu panel |
| 8 | `ui/screens/sheet_frame.png` | 1100×900 | Generic modal / inventory frame |
| 9 | `ui/screens/fade_vignette.png` | 1920×1080 | Soft black edges for transitions |
| 10 | `ui/brand/favicon.png` | 256×256 | Browser tab icon |

---

## 2. HUD chrome (in-game overlay)

| # | File to make | Size | Notes |
|---|--------------|------|--------|
| 11 | `ui/hud/player_card.png` | 720×360 | Top-left HP/STA/MP/FOOD panel |
| 12 | `ui/hud/avatar_frame.png` | 256×256 | Circle/hex frame for class avatar |
| 13 | `ui/hud/goal_banner.png` | 900×140 | Center “GOAL” strip |
| 14 | `ui/hud/goal_tag.png` | 200×64 | Small “GOAL” pill |
| 15 | `ui/hud/floor_banner.png` | 700×120 | Dungeon floor info box |
| 16 | `ui/hud/boss_bar_frame.png` | 900×100 | Boss HP bar casing |
| 17 | `ui/hud/boss_bar_fill.png` | 800×40 | Stretchable fill (or solid color OK) |
| 18 | `ui/hud/toast_good.png` | 640×96 | Success toast bg |
| 19 | `ui/hud/toast_bad.png` | 640×96 | Danger toast bg |
| 20 | `ui/hud/toast_info.png` | 640×96 | Info toast bg |
| 21 | `ui/hud/prompt_panel.png` | 520×120 | “Press E” interaction prompt |
| 22 | `ui/hud/damage_float.png` | 128×128 | Optional damage number plate |
| 23 | `ui/hud/enemy_hp_frame.png` | 256×48 | Overhead enemy HP bar frame |
| 24 | `ui/hud/compass_arrow.png` | 128×128 | Goal navigation arrow |

### Stat bars (optional if you want custom fills)

| # | File | Size | Notes |
|---|------|------|--------|
| 25 | `ui/hud/bar_hp.png` | 400×24 | HP fill |
| 26 | `ui/hud/bar_sta.png` | 400×24 | Stamina fill |
| 27 | `ui/hud/bar_mp.png` | 400×24 | Mana fill |
| 28 | `ui/hud/bar_food.png` | 400×24 | Hunger fill |
| 29 | `ui/hud/bar_track.png` | 400×24 | Empty bar track under fills |

---

## 3. Hotbar & touch controls (attack buttons etc.)

| # | File to make | Size | Notes |
|---|--------------|------|--------|
| 30 | `ui/hotbar/slot_normal.png` | 256×256 | Default skill slot |
| 31 | `ui/hotbar/slot_attack.png` | 256×256 | Basic Attack (J) slot — highlight border |
| 32 | `ui/hotbar/slot_use.png` | 256×256 | Use / Interact (E) |
| 33 | `ui/hotbar/slot_bag.png` | 256×256 | Inventory (I) |
| 34 | `ui/hotbar/slot_skills.png` | 256×256 | Skills order (K) |
| 35 | `ui/hotbar/slot_cooldown.png` | 256×256 | Greyed / CD overlay |
| 36 | `ui/hotbar/slot_pressed.png` | 256×256 | Pressed state |
| 37 | `ui/hotbar/keycap.png` | 96×96 | Key badge behind J/1/2/3/E |
| 38 | `ui/hotbar/rail.png` | 1200×200 | Optional full hotbar background |
| 39 | `ui/touch/stick_base.png` | 256×256 | Mobile joystick pad |
| 40 | `ui/touch/stick_knob.png` | 128×128 | Joystick knob |
| 41 | `ui/touch/btn_attack.png` | 256×256 | Mobile Attack |
| 42 | `ui/touch/btn_dodge.png` | 256×256 | Mobile Dodge |
| 43 | `ui/touch/btn_use.png` | 256×256 | Mobile Use |

### Top-right round menu buttons

| # | File | Size | Notes |
|---|------|------|--------|
| 44 | `ui/menu/btn_map.png` | 256×256 | Map |
| 45 | `ui/menu/btn_card.png` | 256×256 | Adventurer Card |
| 46 | `ui/menu/btn_rank.png` | 256×256 | Rank progress |
| 47 | `ui/menu/btn_pause.png` | 256×256 | Menu / Pause |
| 48 | `ui/menu/btn_primary.png` | 640×160 | “Create Adventurer” / Resume |
| 49 | `ui/menu/btn_ghost.png` | 640×160 | Secondary / Continue |
| 50 | `ui/menu/btn_danger.png` | 640×160 | Optional destructive actions |

---

## 4. UI icons (replace current SVG set)

Export each as **256×256 transparent PNG**. Folder: `ui/icons/`

### Combat / skills / hotbar

| File | Used for |
|------|----------|
| `attack.png` | Basic attack |
| `dodge.png` | Dodge |
| `use.png` | Interact |
| `bag.png` | Inventory |
| `sword.png` | Sword / Duelist / slash gear |
| `shield.png` | Shield / Vanguard |
| `staff.png` | Staff / Arcanist |
| `bow.png` | Bow / Ranger |
| `dagger.png` | Dagger / Shadeblade |
| `mace.png` | Mace / Lightbearer weapon |
| `fist.png` | Training Ground |
| `hand.png` | Parry |
| `brick.png` | Iron Guard / wall |
| `horn.png` | War Cry / Taunt |
| `fire.png` | Fire Bolt / Ember dungeon |
| `ice.png` | Frost Shard |
| `bolt.png` | Arc Spark / lightning |
| `heal.png` | Mend |
| `sparkle.png` | Blessing / SSS / Lightbearer |
| `purify.png` | Purify / cleanse |
| `moon.png` | Shadow Step / Eclipse |
| `poison.png` | Poison Edge |
| `trap.png` | Snare Trap |
| `scout.png` | Scout skill |

### City / map / panels

| File | Used for |
|------|----------|
| `guild.png` | Guild Center |
| `market.png` | Market Square |
| `healer.png` | Healer’s Court |
| `food.png` | Restaurant / stew |
| `smith.png` | Smithy |
| `stage.png` | The Stage (cosmetics) |
| `map.png` | World map button |
| `card.png` | Adventurer card |
| `clipboard.png` | Rank / quests |
| `pause.png` | Pause |
| `gate.png` | Generic gate |
| `player.png` | Player marker |
| `arrow.png` | Navigation |
| `check.png` | Complete / claim |
| `lock.png` | Locked content |
| `star.png` | SS rank / astral / fallback |
| `coin.png` | Gold |

### Dungeon theme icons

| File | Used for |
|------|----------|
| `mushroom.png` | Mossroot / F-1 |
| `pickaxe.png` | Rustpick / F-2 |
| `skull.png` | Crypt / E |
| `wave.png` | Drowned / C |
| `castle.png` | Bastion / B |
| `storm.png` | Stormspire / A |
| `leaf.png` | Nature / mats |
| `chest.png` | Loot chest UI |

### Items / mats / gear icons

| File | Used for |
|------|----------|
| `bread.png` | Bread |
| `meat.png` | Meat / roast |
| `potion.png` | Healing potion |
| `antidote.png` | Antidote |
| `torch.png` | Torch item |
| `gem.png` | Gels / pearls / prism |
| `gear.png` | Iron scrap / cores |
| `wrench.png` | Rusty gear |
| `bone.png` | Bone dust |
| `ghost.png` | Ectoplasm |
| `vest.png` | Chest armor / pelt |
| `boot.png` | Boots |
| `helm.png` | Helmet |

**Icon total in this section: 62 files**

---

## 5. Class art (6 classes)

Folder: `ui/classes/`

| # | File | Class |
|---|------|--------|
| 51 | `class_vanguard.png` | Vanguard portrait |
| 52 | `class_duelist.png` | Duelist |
| 53 | `class_arcanist.png` | Arcanist |
| 54 | `class_ranger.png` | Ranger |
| 55 | `class_shadeblade.png` | Shadeblade |
| 56 | `class_lightbearer.png` | Lightbearer |
| 57 | `class_vanguard_icon.png` | Small crest (optional, if different from portrait) |
| 58 | `class_duelist_icon.png` | |
| 59 | `class_arcanist_icon.png` | |
| 60 | `class_ranger_icon.png` | |
| 61 | `class_shadeblade_icon.png` | |
| 62 | `class_lightbearer_icon.png` | |

### Per-class skill button art (recommended — makes hotbar unique)

Folder: `ui/skills/` — **256×256** each

| Class | Files |
|-------|--------|
| Vanguard | `skill_bash.png`, `skill_warcry.png`, `skill_iron_guard.png` |
| Duelist | `skill_slash.png`, `skill_parry.png`, `skill_riposte.png` |
| Arcanist | `skill_fire_bolt.png`, `skill_frost_shard.png`, `skill_arc_spark.png` |
| Ranger | `skill_power_shot.png`, `skill_snare.png`, `skill_scout.png` |
| Shadeblade | `skill_backstab.png`, `skill_shadow_step.png`, `skill_poison_edge.png` |
| Lightbearer | `skill_mend.png`, `skill_blessing.png`, `skill_purify.png` |

**Skill art total: 18 files**

---

## 6. Rank badges

Folder: `ui/ranks/` — **256×256** each

| File | Rank |
|------|------|
| `rank_f.png` | F |
| `rank_e.png` | E |
| `rank_d.png` | D |
| `rank_c.png` | C |
| `rank_b.png` | B |
| `rank_a.png` | A |
| `rank_s.png` | S |
| `rank_ss.png` | SS |
| `rank_sss.png` | SSS |
| `rank_frame.png` | Shared badge frame (optional) |

---

## 7. Boss portraits (already partially done)

Folder: `assets/bosses/` — **1024×1024 JPG or PNG**

### Named dungeon bosses (required)

| File | Boss |
|------|------|
| `gloomcap.jpg` | Gloomcap *(exists — remake if you want Canva style)* |
| `grubnok.jpg` | Grubnok |
| `vorren.jpg` | Vorren |
| `cinderjaw.jpg` | Cinderjaw |
| `nerisha.jpg` | Nerisha |
| `gravenhelm.jpg` | Gravenhelm |
| `skyrend.jpg` | Skyrend |
| `nyxara.jpg` | Nyxara |
| `vorth.jpg` | Vorth |
| `vael.jpg` | Vael |

### Floor bosses (recommended — currently icon-only)

| File | Boss |
|------|------|
| `sporebrute.jpg` | Spore Brute |
| `ratking.jpg` | Burrow Rat King |
| `thornmatron.jpg` | Thorn Matron |
| `gobwarcap.jpg` | Goblin Warcap |
| `scrapsentinel.jpg` | Scrap Sentinel |
| `veincrawler.jpg` | Vein Crawler |
| `batmatron.jpg` | Rust Bat Matron |
| `pickwraith.jpg` | Pickaxe Wraith |

---

## 8. Dungeon / gate cards

Folder: `ui/dungeons/` — **1200×675** banner each

| File | Dungeon |
|------|---------|
| `gate_mossroot.png` | Mossroot Burrow |
| `gate_rustpick.png` | Rustpick Tunnels |
| `gate_crypt.png` | Whispering Crypt |
| `gate_ember.png` | Emberfang Hollow |
| `gate_drowned.png` | Drowned Sanctum |
| `gate_bastion.png` | Ironclad Bastion |
| `gate_storm.png` | Stormspire |
| `gate_eclipse.png` | Eclipse Sanctum |
| `gate_astral.png` | Astral Foundry |
| `gate_crown.png` | Mythic Crown |
| `diff_normal.png` | Difficulty badge |
| `diff_hard.png` | |
| `diff_nightmare.png` | |

---

## 9. City POI markers (map / world labels)

Folder: `ui/poi/` — **256×256**

| File | Place |
|------|--------|
| `poi_guild.png` | Guild Center |
| `poi_market.png` | Market |
| `poi_healer.png` | Healer |
| `poi_hearth.png` | Restaurant |
| `poi_smithy.png` | Smithy |
| `poi_stage.png` | Stage |
| `poi_train.png` | Training Ground |
| `poi_park.png` | Plaza Gardens |
| `poi_gate_f.png` | F-rank gates |
| `poi_gate_high.png` | Higher gates |

---

## 10. Inventory / shop / card panels

| # | File | Size | Notes |
|---|------|------|--------|
| 63 | `ui/panels/inv_slot.png` | 128×128 | Empty item slot |
| 64 | `ui/panels/inv_slot_rare.png` | 128×128 | Rare highlight |
| 65 | `ui/panels/equip_frame.png` | 900×500 | Equipment doll frame |
| 66 | `ui/panels/shop_row.png` | 900×120 | Shop list row |
| 67 | `ui/panels/quest_row.png` | 900×120 | Quest / objective row |
| 68 | `ui/panels/adventurer_card.png` | 900×1200 | Full Adventurer Card layout |
| 69 | `ui/panels/rank_progress.png` | 900×500 | Rank ladder panel |
| 70 | `ui/panels/world_map_frame.png` | 1400×900 | Map modal frame |
| 71 | `ui/panels/chest_open.png` | 512×512 | Loot chest popup art |
| 72 | `ui/panels/levelup.png` | 800×400 | Level-up banner |
| 73 | `ui/panels/death.png` | 800×400 | Defeat banner |
| 74 | `ui/panels/clear.png` | 800×400 | Dungeon clear banner |

---

## 11. Status / buff icons (small)

Folder: `ui/buffs/` — **128×128**

| File | Meaning |
|------|---------|
| `buff_guard.png` | Iron Guard active |
| `buff_parry.png` | Parry ready |
| `buff_atk.png` | Attack blessing |
| `buff_poison.png` | Poisoned |
| `buff_slow.png` | Slowed |
| `buff_stun.png` | Stunned (enemy) |
| `buff_vulnerable.png` | War Cry frail mark |
| `buff_snare.png` | Rooted |

---

## 12. Optional marketing / store (if you publish)

| File | Size | Notes |
|------|------|--------|
| `ui/store/cover.png` | 1920×1080 | itch / store cover |
| `ui/store/gif_or_trailer_thumb.png` | 1280×720 | Trailer thumbnail |
| `ui/store/screenshot_frame.png` | 1920×1080 | Frame for screenshots |

---

## Priority order (what to make first)

1. **Hotbar slots** (`slot_attack`, `slot_normal`, cooldown) + Attack / skill icons  
2. **HUD player card + bars + boss bar**  
3. **Title screen** (bg + logo)  
4. **Class portraits** (6)  
5. **All UI icons** (section 4)  
6. **Boss portraits** (named + floor)  
7. **Dungeon gate cards + rank badges**  
8. **Panels** (inventory, card, map, shop)  
9. **Touch controls + buffs + extras**

---

## Quick counts

| Category | Approx. files |
|----------|----------------|
| Brand / screens | 10 |
| HUD chrome + bars | 19 |
| Hotbar / touch / menu buttons | 21 |
| Icons | 62 |
| Classes + skill art | 12 + 18 |
| Ranks | 10 |
| Boss portraits | 18 |
| Dungeon cards | 13 |
| POI markers | 10 |
| Panels | 12 |
| Buffs | 8 |
| Store (optional) | 3 |
| **Grand total** | **~216** |

You do **not** need 3D models from Canva — those already live under `assets/models/`. Canva work is **2D UI, icons, portraits, banners**.

When a batch is ready, drop files into the paths above and say which folder you finished — we can wire them into the game next.
