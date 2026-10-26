// Canonical forms of alias kinds whose alias file uses the canonicals as its keys.
// Each type is the exact set of keys in its file, so it updates automatically when the file changes.
// See types/towers.ts for towers and tower upgrades, whose canonicals are computed instead.
import type heroesJson from "../aliases/heroes.json";
import type geraldosShopJson from "../aliases/geraldos_shop.json";
import type beginnerMapsJson from "../aliases/maps/beginner-maps.json";
import type intermediateMapsJson from "../aliases/maps/intermediate-maps.json";
import type advancedMapsJson from "../aliases/maps/advanced-maps.json";
import type expertMapsJson from "../aliases/maps/expert-maps.json";
import type mapDifficultiesJson from "../aliases/map-difficulties.json";
import type difficultiesJson from "../aliases/difficulties.json";
import type gameModesJson from "../aliases/gamemodes.json";
import type bloonsJson from "../aliases/enemies/bloons.json";
import type moabsJson from "../aliases/enemies/moabs.json";
import type pathsJson from "../aliases/paths.json";

/** e.g. `adora`, `benjamin` */
export type HeroCanonical = keyof typeof heroesJson;

/** e.g. `shooty_turret`, `paragon_power_totem` */
export type GeraldoShopItemCanonical = keyof typeof geraldosShopJson;

/** e.g. `logs`, `dark_dungeons`; every map across all map difficulties */
export type MapCanonical =
    | keyof typeof beginnerMapsJson
    | keyof typeof intermediateMapsJson
    | keyof typeof advancedMapsJson
    | keyof typeof expertMapsJson;

/** `beginner`, `intermediate`, `advanced` or `expert` */
export type MapDifficultyCanonical = keyof typeof mapDifficultiesJson;

/** `easy`, `medium`, `hard` or `impoppable` */
export type DifficultyCanonical = keyof typeof difficultiesJson;

/** e.g. `standard`, `chimps`, `abr` */
export type GameModeCanonical = keyof typeof gameModesJson;

/**
 * e.g. `red`, `ceramic`.
 * `super_ceramic` is only an alias entry: helpers/enemies treats "super" as a property of a ceramic, not a separate bloon.
 */
export type BloonCanonical = Exclude<keyof typeof bloonsJson, "super_ceramic">;

/** `moab`, `bfb`, `zomg`, `ddt` or `bad` */
export type MoabCanonical = keyof typeof moabsJson;

/** Every enemy type helpers/enemies can model, i.e. its `ENEMIES` list */
export type EnemyCanonical = BloonCanonical | MoabCanonical;

/** `top_path`, `middle_path` or `bottom_path` */
export type PathCanonical = keyof typeof pathsJson;
