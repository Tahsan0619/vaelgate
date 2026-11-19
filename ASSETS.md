# Third-party 3D assets (CC0)

Vaelgate uses free **CC0** low-poly GLB models so dungeon foes, **bosses**, props, and the player read as real meshes — not balls and boxes.

## Quaternius

Source: [quaternius.com](https://quaternius.com/)  
Mirrored / redistributed GLBs via [trebeljahr/quaternius-showcase](https://github.com/trebeljahr/quaternius-showcase) and [poly.pizza](https://poly.pizza/) (models remain Quaternius CC0).

| Pack | Used for |
|------|----------|
| **Ultimate Monsters** | Floor bosses under `assets/models/bosses/` |
| Easy Enemy Pack | Frog, Rat, Snake, Spider, Wasp (wave trash) |
| Ultimate Animated Animal Pack | Wolf, Fox, Deer |
| Animated Knight Pack | Humanoid trash stand-ins |
| **Modular Men + Women** | Player & NPC humans (`assets/models/humans/male|female/`) — tintable Skin/Hair/cloth |
| Modular Dungeon Pack / Modular Dungeon 1 | Chests, torches, barrels, columns, crates, spikes |
| Nature Pack | Bush, tree, moss rock, stump, plants, grass |
| Platformer Game Kit | Blob-style trash |

### Boss → model map (F-rank)

| Boss | File |
|------|------|
| Spore Brute | `bosses/mushnub_evolved.glb` |
| Burrow Rat King | `bosses/rat_king.glb` |
| Thorn Matron | `bosses/cactoro.glb` |
| Goblin Warcap | `bosses/orc.glb` |
| **Gloomcap** | `bosses/mushroom_king.glb` |
| Scrap Sentinel | `bosses/goleling_evolved.glb` |
| Vein Crawler | `bosses/crab.glb` |
| Rust Bat Matron | `bosses/armabee.glb` |
| Pickaxe Wraith | `bosses/ghost_skull.glb` |
| **Grubnok** | `bosses/orc_skull.glb` |

Also kept in `bosses/` for later floors: mushnub, orc, yeti, skeleton, demon, blue_demon, hywirl, green_spiky_blob, green_blob, goleling.

License: **CC0 1.0** — free for personal and commercial use. Attribution not required; supporting Quaternius on Patreon is appreciated.

## Local paths

- Trash / animals / props: `vaelgate/assets/models/{enemies,characters,props}/`
- **Bosses:** `vaelgate/assets/models/bosses/`
- Runtime loader: `src/modelLoader.js` (`GLTFLoader`)
