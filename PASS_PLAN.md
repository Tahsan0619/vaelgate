# Vaelgate Visual & Content Pass Plan

Keep this file updated so later passes do not lose context.
Graphics bar: match or beat **Shikkha Nagar** / **Dhaka Dash** density (canvas textures, props, architecture). No Apex Rush. No emoji in UI (SVG icons stay).

## Pass 1 — City environment
**Scope:** Aurelmere outdoors + all shop/guild interiors + sky/lighting/ground.
**Do not change:** combat formulas, dungeon floor logic, save schema (except if new flags are additive).
**Goals:**
- Textured grass, stone plaza, asphalt roads, sidewalks, curbs
- Detailed building facades (windows, awnings, trim, chimneys, steps, signs)
- Dense street props: stalls, crates, barrels, benches, lamps, trees, carts, fences, flowerbeds, notice boards, fountain, banners
- Richer dungeon-gate plazas (stairs, braziers, banners, railings) while keeping door interaction IDs
- Shop interiors packed with themed props (market / hearth / smith / healer / stage)
- Guild hall: columns, banners, seating, trophy detail, rugs, lamps
**Done when:** plaza and every major building look busy at a glance; interiors no longer feel empty.

## Pass 2 — F + E dungeons
**Scope:** Mossroot Burrow, Rustpick Tunnels, Whispering Crypt.
**Goals:**
- Theme-specific rooms (roots/mushrooms, mine timber/ore, crypt bones/tombs)
- 50–100+ prop instances per floor; animated hazards that matter
- Combat not one-shot: telegraphs, spacing, seal mechanics feel required
- Boss phases with readable tells (Gloomcap / Grubnok / Vorren)
**Implemented:**
- `dungeonDecor.js` theme props + visible hazard patches
- Textured floors/walls/ceilings; denser corridors; ornate stairs/pillars
- Enemy HP ~2x; bosses higher HP; basic attack softened
- Enemy windup telegraphs before damage (dodgeable)
- Boss skills: Gloomcap spore AoE + split; Grubnok slam + cave-in; Vorren chains + bone wave
- Floor hazard ticks via `updateHazards`

## Pass 3 — D + C + B ranks
**Scope:** Emberfang Hollow, Drowned Sanctum, Ironclad Bastion (+ unlock flow).
**Goals:** Full dungeon defs, unique floors, hazards, bosses, gate plazas, reward tables.
**Note:** B is owned here for content; Pass 4 may polish B further if needed.
**Implemented:**
- Dungeons `ember` / `drowned` / `bastion` with enemies, guardians, bosses, mats, set gear
- Theme decor (lava/coral/steam) + hazard patches
- Boss AI: Cinderjaw howl/enrage, Nerisha flood pads, Gravenhelm shield wall/overclock
- Rank exams D/C/B via Rank Examiner; gates require matching rank
- Goals chain through Crypt → D → Ember → C → Sanctum → B → Bastion

## Pass 4 — A (+ B polish)
**Scope:** Stormspire (A). Optional B visual/mechanic polish after playtest.
**Goals:** Vertical/storm theme, wind hazards, elite packs, A-rank presentation.
**Implemented:**
- Dungeon `storm` unlocked (a1 gate); requires A-rank via promote_a after Bastion
- Enemies: stormwisp / galehawk / thunderling / cloudgolem + elites galeknight / thunderlord
- Boss Skyrend: gale shove, lightning bolts, elite packs at 66%/33%, Storm Fury below 25%
- Theme decor: crystals, wind vanes, cloud pedestals, gale hazard patches
- Rewards: Storm Shard, Gale Feather, Stormspire Lance; A exam + goals chain
- Light B polish: gear racks in bastion rooms; shield-break objective for A exam

## Pass 5 — S / SS / SSS (CURRENT)
**Scope:** Endgame gates (add PLACES + DUNGEONS + bosses when lore ready).
**Goals:** Distinct spectacle, multi-phase raids, contribution thresholds, prestige cosmetics.
**Implemented:**
- Gates `s1` Eclipse Sanctum, `ss1` Astral Foundry, `sss1` Mythic Crown (+ east road)
- Bosses Nyxara (night/day flip), Vorth (meteors/anvil/slag), Vael (mirror/prism/ascend)
- Higher CR exam thresholds (50 / 60 / 70); promote_s / ss / sss fees
- Prestige cosmetics (cloak / sigil / crown) drop + Stage wear + Card title
- Theme decor + elite packs; goals chain through SSS

## Non-negotiables each pass
- Door-only building entry; wall colliders stay correct
- E / F interact; Map/Card/Rank/Menu stay clickable
- `npm run build` green; smoke city + one door + one shop
- Credit: Made by Tahsan → babuntooacademy.com
- No em dashes in player-facing copy

## Status
| Pass | Status | Notes |
|------|--------|-------|
| 1 City | Done | textures.js + props.js + city/interior rewrite; denser plaza/gates/shops |
| 2 F+E | Done | decor + telegraphs + hazard patches + HP/boss rebalance |
| 3 D+C+B | Done | ember/drowned/bastion + exams D→C→B |
| 4 A(+B) | Done | Stormspire + Skyrend + A exam |
| 5 S/SS/SSS | Done | eclipse/astral/crown + exams S→SS→SSS |
