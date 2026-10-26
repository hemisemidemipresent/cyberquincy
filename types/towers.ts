import type { Brand } from "./brand";

// Validators (isX() / toX()) live in helpers/towers

/**
 * A base tower, regardless of upgrades, e.g. `dart_monkey` or `boomerang_monkey`.
 * Every value comes from `Towers.allTowers()`.
 */
export type TowerTypeCanonical = Brand<string, "TowerTypeCanonical">;

/**
 * A tower with one specific upgrade: `{TowerTypeCanonical}#{upgrade set}`, e.g. `dart_monkey#030`.
 * The upgrade set points to a single upgrade (`100`, `030`, `005`, ...) or is `000` for the base tower.
 * Crosspaths like `024` are not canonical, since they have no alias group.
 */
export type TowerUpgradeCanonical = Brand<`${string}#${string}`, "TowerUpgradeCanonical">;

/**
 * The display name of a tower upgrade as used by the index, e.g. `Triple Shot` or `Base Dart`.
 * Produced by `Towers.towerUpgradeToIndexNormalForm()`.
 */
export type TowerUpgradeIndexNormalForm = Brand<string, "TowerUpgradeIndexNormalForm">;
