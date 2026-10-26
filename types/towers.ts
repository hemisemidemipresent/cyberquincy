import type { Brand } from "./brand";

// Validators (isX() / toX()) live in helpers/towers

/**
 * A base tower, regardless of upgrades, e.g. `dart_monkey` or `boomerang_monkey`.
 * Every value comes from `Towers.allTowers()`.
 */
export type TowerTypeCanonical = Brand<string, "TowerTypeCanonical">;

/**
 * A tower with any valid upgrade set: `{TowerTypeCanonical}#{upgrade set}`, crosspaths included,
 * e.g. `dart_monkey#024`, `wizard_monkey#105`, `dart_monkey#030` or `dart_monkey#000`.
 * Every TowerUpgradeCanonical is also a TowerCrosspathCanonical.
 */
export type TowerCrosspathCanonical = Brand<`${string}#${string}`, "TowerCrosspathCanonical">;

/**
 * A tower with one specific upgrade: `{TowerTypeCanonical}#{upgrade set}`, e.g. `dart_monkey#030`.
 * The upgrade set points to a single upgrade (`100`, `030`, `005`, ...) or is `000` for the base tower.
 * Crosspaths like `024` are not upgrade canonicals (see TowerCrosspathCanonical), since they have no alias group.
 */
export type TowerUpgradeCanonical = Brand<TowerCrosspathCanonical, "TowerUpgradeCanonical">;

/**
 * The display name of a tower upgrade as used by the index, e.g. `Triple Shot` or `Base Dart`.
 * Produced by `Towers.towerUpgradeToIndexNormalForm()`.
 */
export type TowerUpgradeIndexNormalForm = Brand<string, "TowerUpgradeIndexNormalForm">;
