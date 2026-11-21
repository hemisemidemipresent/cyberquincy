// conventions: topper conventions, x = degree
import { round } from './general';

/** One paragon attack's stats at degree 1, as in jsons/paragon.json */
interface ParagonAttackStats {
    damage?: number;
    /** additional ceramic damage */
    cd?: number;
    /** additional fortified damage */
    fd?: number;
    /** additional camo damage */
    cad?: number;
    /** additional stunned damage */
    sd?: number;
    /** additional sticky damage */
    std?: number;
    /** additional moab damage */
    md?: number;
    /** additional boss damage */
    bd?: number;
    /** elite boss damage multiplier */
    edm?: number;
    pierce?: number;
    /** seconds per attack */
    rate?: number;
    cooldown?: number;
}

/** One paragon attack's stats at a given degree; each field is present only if its source stat is */
interface LevelledParagonAttackStats {
    d?: number;
    cd?: number;
    /** total ceramic damage */
    tcd?: number;
    fd?: number;
    /** total fortified damage */
    tfd?: number;
    cad?: number;
    /** total camo damage */
    tcad?: number;
    sd?: number;
    /** total stunned damage */
    tsd?: number;
    std?: number;
    /** total sticky damage */
    tstd?: number;
    md?: number;
    /** total moab damage */
    tmd?: number;
    bd?: number;
    /** boss damage multiplier */
    bdm?: number;
    /** total untraited boss damage */
    tbd?: number;
    edm?: number;
    /** total untraited elite boss damage */
    ted?: number;
    p?: number;
    /** seconds per attack */
    s?: number;
    cooldown?: number;
}

/**
 * @param d damage at degree 1
 * @param x degree
 * @returns damage for that degree
 */
function getDmg(d: number, x: number): number {
    if (x === 100) return d * 2 + 10;
    x--;
    return d * (1 + x * 0.01) + Math.floor(x / 10);
}

/**
 * Works for additional damage like cd, md, fd, bd
 * @param d additional damage at degree 1
 * @param x degree
 * @returns additional damage for that degree
 */
function getDmgMod(d: number, x: number): number {
    if (x === 100) return d * 2;
    x--;
    return d * (1 + x * 0.01);
}

/**
 * @param x degree
 * @returns boss damage multiplier for that degree
 */
function getBossDmgMult(x: number): number {
    return 1 + Math.floor(x / 20) * 0.25;
}

/**
 * @param p pierce at degree 1
 * @param x degree
 */
function getPierce(p: number, x: number): number {
    if (x === 100) return p * 2 + 10;
    x--;
    return Math.floor(p * (1 + x * 0.01)) + 0.1 * x;
}

/**
 * @param s attack speed (seconds per attack) at degree 1
 * @param x degree
 */
function getSpeed(s: number, x: number): number {
    x--;
    return s / (1 + round(Math.sqrt(x * 50), 1) * 0.01);
}

/**
 * @param obj an attack's stats at degree 1
 * @param x degree
 */
function getLevelledObj(obj: ParagonAttackStats, x: number): LevelledParagonAttackStats {
    const res: LevelledParagonAttackStats = {};

    if ('damage' in obj) res.d = round(getDmg(obj.damage, x), 1);
    if ('cd' in obj) {
        res.cd = round(getDmgMod(obj.cd, x), 1);
        res.tcd = round(res.d + res.cd);
    }
    if ('fd' in obj) {
        res.fd = round(getDmgMod(obj.fd, x), 1);
        res.tfd = round(res.d + res.fd);
    }
    if ('cad' in obj) {
        res.cad = round(getDmgMod(obj.cad, x), 1);
        res.tcad = round(res.d + res.cad);
    }
    if ('sd' in obj) {
        res.sd = round(getDmgMod(obj.sd, x), 1);
        res.tsd = round(res.d + res.sd);
    }
    if ('std' in obj) {
        res.std = round(getDmgMod(obj.std, x), 1);
        res.tstd = round(res.d + res.std);
    }
    if ('md' in obj) {
        res.md = round(getDmgMod(obj.md, x), 1);
        res.tmd = round(res.d + res.md);
    }
    if ('bd' in obj) {
        res.bd = round(getDmgMod(obj.bd, x), 1);
        res.bdm = getBossDmgMult(x);
        res.tbd = round((res.d + (res.md ? res.md : 0) + res.bd) * res.bdm);
    }
    if ('edm' in obj) {
        res.edm = obj.edm;
        res.ted = round((res.d + (res.md ? res.md : 0) + (res.bd ? res.bd : 0)) * (res.bdm ? res.bdm : 1) * res.edm);
    }

    if ('pierce' in obj) res.p = round(getPierce(obj.pierce, x), 1);
    if ('rate' in obj) res.s = round(getSpeed(obj.rate, x), 4); // seconds between attack needs more precision
    if ('cooldown' in obj) res.cooldown = round(getSpeed(obj.cooldown, x), 1); // cooldown uses the same scaling formula as seconds between attacks

    return res;
}

export { getLevelledObj };
export type { ParagonAttackStats, LevelledParagonAttackStats };
