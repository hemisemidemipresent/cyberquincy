// God tier reference: https://www.reddit.com/r/btd6/comments/eh47t8/how_hero_xp_works_in_game_v20/

import * as gHelper from './general';
import bHelper from './bloons-general.js';
import Aliases from '../aliases';
import heroesJson from '../jsons/heroes.json';
import gerrysShopJson from '../jsons/geraldos_shop.json';

import type { DifficultyCanonical, GeraldoShopItemCanonical, HeroCanonical, MapDifficultyCanonical } from '../types/aliases';

// Typed so tsc fails if the stats files miss a hero or item that has aliases
const heroes: Record<HeroCanonical, { cost: number; levelModifier: number }> = heroesJson;
const gerrysShop: Record<GeraldoShopItemCanonical, number> = gerrysShopJson;

const HERO_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
type HeroLevel = (typeof HERO_LEVELS)[number];

// XP needed to go from the previous level to this one, before the hero's own multiplier
const BASE_XP_TO_GET_LEVEL: Record<HeroLevel, number> = {
    1: 0,
    2: 180,
    3: 460,
    4: 1000,
    5: 1860,
    6: 3280,
    7: 5180,
    8: 8320,
    9: 9380,
    10: 13620,
    11: 16380,
    12: 14400,
    13: 16650,
    14: 14940,
    15: 16380,
    16: 17820,
    17: 19260,
    18: 20700,
    19: 16470,
    20: 17280,
};

const LEVELING_MAP_DIFFICULTY_MODIFIERS: Record<MapDifficultyCanonical, number> = {
    beginner: 1,
    intermediate: 1.1,
    advanced: 1.2,
    expert: 1.3,
};

/**
 * Returns how much xp a hero has accumulated as of each round:
 * returned_arr[r - 1] is the xp as of round r, which is 0 up to and including the placement round
 */
function accumulatedXpCurve(
    startingRound: number,
    mapDifficulty: MapDifficultyCanonical,
    energizerAcquiredRound: number,
    mk: boolean
): number[] {
    const mapSpecificLevelingMultiplier = LEVELING_MAP_DIFFICULTY_MODIFIERS[mapDifficulty];

    const accumulatedXp: number[] = [];
    let acc = 0;
    let baseXpGainGain = 0;
    for (let round = 0; round < 100; round++) {
        if (round == 0) {
            baseXpGainGain = 0;
        } else if (round == 1) {
            baseXpGainGain += 40;
        } else if (round <= 20) {
            baseXpGainGain += 20;
        } else if (round <= 50) {
            baseXpGainGain += 40;
        } else {
            baseXpGainGain += 90;
        }

        const energizerFactor = round >= energizerAcquiredRound ? 1.5 : 1;
        const mkFactor = mk ? 1.1 * 1.05 * 1.08 : 1;

        if (round >= startingRound) {
            acc += baseXpGainGain * mapSpecificLevelingMultiplier * energizerFactor * mkFactor;
        }
        accumulatedXp.push(acc);
    }
    return accumulatedXp;
}

/**
 * Returns how much xp a hero must get (cumulatively) to reach each level
 * e.g. { 1: 0, 2: 180, 3: 640, 4: 1640, ... }
 */
function heroLevelXpRequirements(hero: HeroCanonical): Record<HeroLevel, number> {
    const heroSpecificLevelingMultiplier = heroes[hero]?.levelModifier;
    if (!heroSpecificLevelingMultiplier) throw `${hero} does not have "levelModifier" entry in heroes.json`;
    const requirements = {} as Record<HeroLevel, number>;
    let acc = 0;
    for (const level of HERO_LEVELS) {
        acc += Math.round(BASE_XP_TO_GET_LEVEL[level] * heroSpecificLevelingMultiplier);
        //acc += Math.ceil(BASE_XP_TO_GET_LEVEL[level] * heroSpecificLevelingMultiplier);
        requirements[level] = acc;
    }
    return requirements;
}

/**
 * Returns how much more xp the hero still needs to reach `level` as of `goalRound` (no energizer).
 * 0 or negative means the level has already been reached
 */
function xpNeededForLevel(
    hero: HeroCanonical,
    level: HeroLevel,
    startingRound: number,
    goalRound: number,
    mapDifficulty: MapDifficultyCanonical,
    mk: boolean
): number {
    const accumulatedXp = accumulatedXpCurve(
        startingRound,
        mapDifficulty,
        Infinity, // no energizer
        mk
    );
    return heroLevelXpRequirements(hero)[level] - accumulatedXp[goalRound - 1];
}

/**
 * Returns the round a hero will reach each level
 * e.g. { 1: 7, 2: 9, 3: 11, 4: 14, 5: 19, ... }
 * A level that isn't reached by round 100 holds the remaining xp as a string instead, e.g. "$1,234"
 */
function levelingCurve(
    hero: HeroCanonical,
    startingRound: number,
    mapDifficulty: MapDifficultyCanonical,
    energizerAcquiredRound = Infinity,
    mk = false
): Record<HeroLevel, number | string> {
    const accumulatedXp = accumulatedXpCurve(
        startingRound,
        mapDifficulty,
        energizerAcquiredRound,
        mk
    );
    const requirements = heroLevelXpRequirements(hero);

    const curve = {} as Record<HeroLevel, number | string>;
    for (const level of HERO_LEVELS) {
        const txp = requirements[level];
        // Counting starts at the placement round, so that level 1 is reached on placement
        const acquiredRound = accumulatedXp.findIndex((axp, i) => i >= startingRound - 1 && axp - txp >= 0) + 1;

        // findIndex returns -1 if not found, so +1 is 0, which is falsy
        curve[level] = acquiredRound
            ? acquiredRound
            : gHelper.numberAsCost(txp - accumulatedXp[99]);
    }
    return curve;
}

function costOfHero(hero: HeroCanonical, difficulty: DifficultyCanonical, numDiscounts: number, mk: boolean): number {
    const mediumCost = heroes[hero]?.cost;
    if (!mediumCost) throw `${hero} does not have an entry in heroes.json`;
    return bHelper.heroDifficultyDiscountPriceMult(mediumCost, difficulty, numDiscounts, mk);
}

function costOfGerryShopItem(item: GeraldoShopItemCanonical, difficulty: DifficultyCanonical): number {
    const mediumCost = gerrysShop[item];
    if (!mediumCost) throw `${item} does not have an entry in geraldos_shop.json`;
    return bHelper.specialRound(bHelper.rawDifficultyMult(mediumCost, difficulty));
}

// Case-insensitive, so not a type guard: `Adora` passes but isn't a HeroCanonical
function isHero(candidate: unknown): boolean {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return (allHeroes() as string[]).includes((candidate as string).toLowerCase());
}

function allHeroes(): HeroCanonical[] {
    return Aliases.canonicalsOfKind('hero');
}

// Case-insensitive, like isHero
function isGerrysShopItem(candidate: unknown): boolean {
    if (!candidate || !gHelper.is_str(candidate)) return false;
    return (allGerrysShopItems() as string[]).includes((candidate as string).toLowerCase());
}

function allGerrysShopItems(): GeraldoShopItemCanonical[] {
    return Aliases.canonicalsOfKind('geraldo_item');
}

export type { HeroLevel };

export {
    HERO_LEVELS,
    levelingCurve,
    xpNeededForLevel,
    costOfHero,
    costOfGerryShopItem,
    isHero,
    allHeroes,
    allGerrysShopItems,
    isGerrysShopItem,
};
