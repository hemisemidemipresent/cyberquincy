const roundHelper = require('./rounds');
const gHelper = require('../helpers/general');

const axios = require('axios');
const cheerio = require('cheerio');

const roundContents = require('../jsons/round_sets/round_contents.json');

ENEMIES = [
    (BLOONS = [
        (RED = 'red'),
        (BLUE = 'blue'),
        (GREEN = 'green'),
        (YELLOW = 'yellow'),
        (PINK = 'pink'),
        (PURPLE = 'purple'),
        (WHITE = 'white'),
        (BLACK = 'black'),
        (ZEBRA = 'zebra'),
        (LEAD = 'lead'),
        (RAINBOW = 'rainbow'),
        (CERAMIC = 'ceramic')
    ]),
    (MOABS = [(MOAB = 'moab'), (BFB = 'bfb'), (ZOMG = 'zomg'), (DDT = 'ddt'), (BAD = 'bad')])
].flat();

SUPER = 'super';
FORTIFIED = 'fortified';

ENEMIES_THAT_CAN_BE_FORTIFIED = [LEAD, CERAMIC] + MOABS;

// Super black bloons are black bloons with only 1 pink child (seen after R80)
// i.e. this isn't just limited to "super ceramics"
ENEMIES_THAT_CAN_BE_SUPER = [PURPLE, WHITE, BLACK, ZEBRA, LEAD, RAINBOW, CERAMIC];

// Speeds
const BASE_RED_BLOON_SECONDS_PER_SECOND = {
    [RED]: 1,
    [BLUE]: 1.4,
    [GREEN]: 1.8,
    [YELLOW]: 3.2,
    [PINK]: 3.5,
    [BLACK]: 1.8,
    [WHITE]: 2,
    [PURPLE]: 3,
    [LEAD]: 1,
    [ZEBRA]: 1.8,
    [RAINBOW]: 2.2,
    [CERAMIC]: 2.5,
    [MOAB]: 1,
    [BFB]: 0.25,
    [ZOMG]: 0.18,
    [DDT]: 2.64,
    [BAD]: 0.18
};

const BASE_LAYER_RBES = {
    [CERAMIC]: 10,
    [MOAB]: 200,
    [BFB]: 700,
    [ZOMG]: 4000,
    [DDT]: 400,
    [BAD]: 20000
};

class Enemy {
    constructor(name, round = 80, fortified = false, camo = false, regrow = false) {
        if (!ENEMIES.includes(name)) {
            throw `${name} is not a valid Enemy type; cannot instantiate Enemy`;
        }

        if (!roundHelper.isValidRound(round)) {
            throw `${round} is not a valid BTD6 round; cannot instantiate Enemy`;
        }

        if (typeof fortified != 'boolean') {
            throw `fortified must be true/false; got ${fortified} instead; cannot instantiate Enemy`;
        }

        if (typeof camo != 'boolean') {
            throw `camo must be true/false; got ${camo} instead; cannot instantiate Enemy`;
        }

        if (typeof regrow != 'boolean') {
            throw `regrow must be true/false; got ${regrow} instead; cannot instantiate Enemy`;
        }

        // Sure, DDTs *can* be de-camoed, but let's just do this for simplicity
        // They can never spawn de-camoed for what it's worth
        if (name == DDT) {
            regrow = true;
            camo = true;
        }

        this.name = name;
        this.fortified = fortified;
        this.camo = camo;
        this.regrow = regrow;
        this.round = round;
    }

    // Just the enemy type, not the properties
    formatName(formalName = false) {
        return formatName(this.name, formalName);
    }

    // The bloon's full property/type denotation
    description() {
        const camo = this.camo && this.name != DDT ? 'Camo ' : '';
        const regrow = this.regrow && this.name != DDT ? 'Regrow ' : '';
        const fortified = this.fortified ? 'Fortified ' : '';
        const supr = this.supr() ? 'Super ' : '';
        return `${fortified}${regrow}${camo}${supr}${this.formatName(true)}`;
    }

    /**
     * @returns Regex pattern that matches `round_contents.json`-formatted strings
     * This means a camo ceramic will also match with regrow camo ceramic, and any further fortified ones, but will not match with a normal ceramic
     */
    roundAppearanceDescriptionPattern() {
        const camo = this.camo && this.name != DDT ? 'Camo ' : '(?<camo>Camo )?';
        const regrow = this.regrow && this.name != DDT ? 'Regrow ' : '(?<regrow>Regrow )?';
        const fortified = this.fortified ? 'Fortified ' : '(?<fortified>Fortified )?';
        const name = this.formatName();
        return new RegExp(`(?<number>\\d+) ${fortified}${camo}${regrow}${name}s?(?:,|$)`, 'g');
    }

    isFreeplay() {
        return this.round > 80;
    }

    supr() {
        return this.isFreeplay() && ENEMIES_THAT_CAN_BE_SUPER.includes(this.name);
    }

    isBloon() {
        return isBloon(this.name);
    }

    isMOAB() {
        return isMOAB(this.name);
    }

    // Delegates to EnemyClump
    children(format = false) {
        const children = this.clump().children();
        if (format) {
            return children.map((clump) => clump.description()).join('\n') || 'None';
        } else return children;
    }

    /**
     *
     * @param {string} mode "r" or "ar" for normal/ABR
     * @param {boolean} format receive as object if false; formatted string if true
     * @returns How often this exact bloon (ignoring round) appears in each round for the specific gamemode
     */
    roundAppearances(mode = 'r', format = false) {
        if (!['r', 'ar'].includes(mode)) {
            throw `mode ${mode} is unsupported`;
        }

        const roundAppearances = {};

        const pattern = this.roundAppearanceDescriptionPattern();

        for (const r in roundContents) {
            if (!r.startsWith(mode)) continue;

            const appearances = roundContents[r].matchAll(pattern);

            let appearancesStrs = [];
            for (const appearance of appearances) {
                let number = appearance.groups.number;
                let fortified = appearance.groups.fortified ? 'f' : '';
                let camo = appearance.groups.camo ? 'c' : '';
                let regrow = appearance.groups.regrow ? 'r' : '';
                appearancesStrs.push(
                    `${number}${fortified}${camo}${regrow}`
                );
            }

            if (appearancesStrs.length > 0) {
                roundAppearances[r.replace(mode, 'r')] = appearancesStrs.join('+');
            }
        }

        if (format) {
            if (Object.keys(roundAppearances).length > 0) {
                // Comma-separated key-value pairs of rounds (bolded) to number of bloon appearances
                return Object.entries(roundAppearances)
                    .map((pair) => `**${pair[0]}**: ${pair[1]}`)
                    .join(', ');
            } else {
                return `No natural appearances`;
            }
        } else return roundAppearances;
    }

    speed(format = false) {
        const speed = BASE_RED_BLOON_SECONDS_PER_SECOND[this.name] * getSpeedRamping(this.round);
        const roundedSpeed = gHelper.round(speed, 4);
        if (format) {
            return gHelper.numberWithCommas(roundedSpeed);
        } else return roundedSpeed;
    }

    /**
     * @returns The RBE of the outer layer of the specified enemy on the enemy's specified round
     */
    layerRBE(format = false) {
        let layerRBE = this.baseLayerRBE();

        if (this.isMOAB()) {
            layerRBE *= getHealthRamping(this.round);
        }

        layerRBE = gHelper.round(layerRBE, 0);

        return format ? gHelper.numberWithCommas(layerRBE) : layerRBE;
    }

    /**
     * @returns The RBE of the outer layer of the specified enemy on R80 or before
     */
    baseLayerRBE() {
        let baseLayerRBE = BASE_LAYER_RBES[this.name] || 1;

        if (this.supr() && this.name == CERAMIC) {
            baseLayerRBE = 60;
        }

        if (this.fortified) {
            if (this.name == LEAD) {
                baseLayerRBE = 4;
            } else if (ENEMIES_THAT_CAN_BE_FORTIFIED.includes(this.name)) {
                baseLayerRBE *= 2;
            } else {
                // Non-existent bloons like fortifed red
                baseLayerRBE = 4; // Purely speculative, same as lead
            }
        }

        return baseLayerRBE;
    }

    // Delegates to EnemyClump to deal with N copies of each level of descendant
    totalRBE(format = false) {
        const result = this.clump().totalRBE();
        return format ? gHelper.numberWithCommas(result) : result;
    }

    // Delegates to EnemyClump to deal with N copies of each level of descendant
    verticalRBE(format = false) {
        const result = this.clump().verticalRBE();
        return format ? gHelper.numberWithCommas(result) : result;
    }

    // Delegates to EnemyClump to deal with N copies of each level of descendant
    cash(format = false) {
        const result = gHelper.round(this.clump().cash(), 5);
        return format ? gHelper.numberAsCost(result) : result;
    }

    cashEarnedFromLayer() {
        const cashFactor = roundHelper.cashFactorForRound(this.round);
        if (this.name == CERAMIC && this.isFreeplay()) {
            return 87 * cashFactor;
        } else return cashFactor;
    }

    /**
     *
     * @param {int} size the amount of the clump, defaults to 1
     * @returns An enemy clump of this type of enemy of the specified size
     */
    clump(size = 1) {
        return new EnemyClump(this, size);
    }

    /**
     * @summary copies itself but changes the name/color to specified. It maintains the other important properties, as if the layer were popped.
     * @param {string} name
     * @returns {Enemy} The same enemy as this (regrow, etc.) but with the specified new name
     */
    offspring(name) {
        const newEnemy = this.clone();
        newEnemy.name = name;
        if (!ENEMIES_THAT_CAN_BE_FORTIFIED.includes(newEnemy.name)) {
            // Fortified lead will pop into non-fortified blacks; same with fceram into rainbow
            newEnemy.fortified = false;
        }
        return newEnemy;
    }

    clone() {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }

    /**
     *
     * @summary Goes to the enemy page specified by the type (green, rainbow, bfb, etc.), "scrolls to" the #Variants section, and scrapes the correct image url using axios/cheerio
     * @returns The image URL for the enemy's full description
     */
    async thumbnail() {
        const camo = this.camo ? 'Camo' : '';
        const regrow = this.regrow ? 'Regrow' : '';
        const fortified = this.fortified ? 'Fortified' : '';

        let bloonPageLink;
        let bloonSelectors; // Image alts can be named in multiple different ways, arbitrarily
        if (this.isBloon()) {
            // Green_Bloon, Ceramic_Bloon, etc.
            // https://bloons.fandom.com/wiki/Green_Bloon
            bloonPageLink = `https://bloons.fandom.com/wiki/${this.formatName(true).split(' ').join('_')}`;
            const selectorKey = `${fortified}${camo}${regrow}${this.formatName()}.png`;
            bloonSelectors = [selectorKey, `BTD6${selectorKey}`];
            if (regrow) {
                bloonSelectors = bloonSelectors.concat(bloonSelectors.map((search) => search.replace(/Regrow/, 'Regrowth')));
            }
        } else if (this.isMOAB()) {
            // https://bloons.fandom.com/wiki/M.O.A.B.
            // Separating the letters with dots is the safest way to go to the right page
            // i.e. /MOAB would bring you to a disambiguation
            bloonPageLink = `https://bloons.fandom.com/wiki/${this.formatName(true)}`;
            const selectorKey = `${fortified}${this.formatName()}.png`;
            bloonSelectors = [`BTD63D${selectorKey}`, `3D${selectorKey}`, `BTD3D${selectorKey}`, `BTD6${selectorKey}`];
            if (fortified) {
                bloonSelectors = bloonSelectors.concat(bloonSelectors.map((search) => search.replace(/Fortified/, 'F')));
            }
        }
        const response = await axios.get(bloonPageLink);
        let $ = cheerio.load(response.data);

        for (const search of bloonSelectors) {
            let imageTile = $(this.thumbnailImageTileSelector(search));
            if (imageTile.length > 0) {
                // Return the full image url at the first match for the correct bloon tile
                return imageTile.attr('data-src');
            }
        }

        return null;
    }

    thumbnailImageTileSelector(search) {
        return `table.article-table img[alt=${search}]`;
    }

    actuallyExists() {
        return !this.fortified || ENEMIES_THAT_CAN_BE_FORTIFIED.includes(this.name);
    }

    onlyExistsInChallengeEditor() {
        return this.isMOAB() && this.name != DDT && (this.camo || this.regrow);
    }

    notes() {
        const notes = [];

        if (!this.actuallyExists()) {
            notes.push('This bloon is only theoretical');
        }

        if (this.onlyExistsInChallengeEditor()) {
            notes.push(
                'Non-DDT MOABs can only acquire the camgrow property through challenge editor settings (meaning they release camgrow ceramics)'
            );
        }

        if (this.name == DDT) {
            notes.push('DDTs have the camgrow property by default (meaning they release camgrow ceramics)');
        }

        if (this.name == BAD && this.round < 100) {
            notes.push('Warning! Sandbox B.A.D. layer is minimum-capped at r100-strength');
        }

        if ([BAD, DDT].includes(this.name) && this.round < 90) {
            notes.push('Warning! Sandbox D.D.T. layer is minimum-capped at r90 strength');
        }

        return notes;
    }
}

// Just a group of size N of the same type of enemy
// This prevents the need from instantiating N of the same enemy type during calculation
class EnemyClump {
    constructor(enemy = null, size = 1) {
        if (enemy && !(enemy instanceof Enemy)) {
            throw `enemy needs to be of type "Enemy"; got a ${typeof enemy} instead; cannot instantiate EnemyClump`;
        }

        if (!Number.isInteger(size) || parseInt(size) < 0) {
            throw `size needs to be a whole number; got ${size} instead; cannot instantiate EnemyClump`;
        }

        if (!enemy && size > 0) {
            throw `size must be zero if there is no enemy; cannot instantiate EnemyClump`;
        }

        this.enemy = enemy;
        this.size = size;
    }

    /**
     * @returns a list of EnemyClumps corresponding to the children of this EnemyClump
     * i.e. if this EnemyClump represents 3 BADs, then its children would consist of:
     *   - An EnemyClump of 6 ZOMGs
     *   - An EnemyClump of 9 DDTs
     */
    children() {
        switch (this.enemy.name) {
            case RED:
                return [];
            case BLUE:
                return [new EnemyClump(this.enemy.offspring(RED), this.size)];
            case GREEN:
                return [new EnemyClump(this.enemy.offspring(BLUE), this.size)];
            case YELLOW:
                return [new EnemyClump(this.enemy.offspring(GREEN), this.size)];
            case PINK:
                return [new EnemyClump(this.enemy.offspring(YELLOW), this.size)];
            case PURPLE: {
                const superFactor = this.enemy.supr() ? 1 : 2;
                return [new EnemyClump(this.enemy.offspring(PINK), this.size * superFactor)];
            }
            case WHITE: {
                const superFactor = this.enemy.supr() ? 1 : 2;
                return [new EnemyClump(this.enemy.offspring(PINK), this.size * superFactor)];
            }
            case BLACK: {
                const superFactor = this.enemy.supr() ? 1 : 2;
                return [new EnemyClump(this.enemy.offspring(PINK), this.size * superFactor)];
            }
            case LEAD: {
                const superFactor = this.enemy.supr() ? 1 : 2;
                return [new EnemyClump(this.enemy.offspring(BLACK), this.size * superFactor)];
            }
            case ZEBRA: {
                let result = [new EnemyClump(this.enemy.offspring(BLACK), this.size)];
                if (!this.enemy.supr()) {
                    result.push(new EnemyClump(this.enemy.offspring(WHITE), this.size));
                }
                return result;
            }
            case RAINBOW: {
                const superFactor = this.enemy.supr() ? 1 : 2;
                return [new EnemyClump(this.enemy.offspring(ZEBRA), this.size * superFactor)];
            }
            case CERAMIC: {
                const superFactor = this.enemy.supr() ? 1 : 2;
                return [new EnemyClump(this.enemy.offspring(RAINBOW), this.size * superFactor)];
            }
            case MOAB:
                return [new EnemyClump(this.enemy.offspring(CERAMIC), this.size * 4)];
            case DDT:
                const child = this.enemy.offspring(CERAMIC);
                child.regrow = true;
                return [new EnemyClump(child, this.size * 4)];
            case BFB:
                return [new EnemyClump(this.enemy.offspring(MOAB), this.size * 4)];
            case ZOMG:
                return [new EnemyClump(this.enemy.offspring(BFB), this.size * 4)];
            case BAD:
                return [
                    new EnemyClump(this.enemy.offspring(ZOMG), this.size * 2),
                    new EnemyClump(this.enemy.offspring(DDT), this.size * 3)
                ];
            default:
                throw `\`children()\` doesn't account for ${this.enemy.name}`;
        }
    }

    /**
     * @returns The RBE needed to pop the layer of all enemies combined
     */
    layerRBE() {
        return this.enemy.layerRBE() * this.size;
    }

    /**
     * @returns The RBE needed to eliminate all enemies combined
     * Works recursively by summing the the current enemy's layer RBE to the sum total of all children's total RBE
     * The base case is that an enemy cluster of reds will not have any children and a recursive call will not be made
     */
    totalRBE() {
        let totalRBE = this.layerRBE();
        // Very helpful debug statement:
        // console.log(this.enemy.description(), totalRBE, `(${this.enemy.layerRBE()} * ${this.size})`)
        this.children().forEach((child) => (totalRBE += child.totalRBE()));
        return totalRBE;
    }

    /**
     * @returns The minimum damage that a tsar-bomba type detonation would need to do in order to one-shot the bloon and insides
     * Works recursively by summing the current enemy's layer RBE to the MAXIMUM of every child's vertical RBE
     * Really, the only time there is a discrepancy between children is that the DDTs have much less vertical RBE than the ZOMGs
     * The only other time there are different children types are for zebra bloons, but white and black bloons have the same vertical RBE
     * The base case is that an enemy cluster of reds will not have any children and a recursive call will not be made
     */
    verticalRBE() {
        let layerRBE = this.enemy.layerRBE();
        let childVerticalRBEs = this.children().map((child) => child.verticalRBE());
        // console.log(layerRBE, childVerticalRBEs)
        return layerRBE + Math.max(...childVerticalRBEs, 0);
    }

    /**
     * @returns The total amount of cash earned from this enemy clump
     * Works recursively summing up the cash earned from each layer of the enemy's descendants
     * The base case is that an enemy cluster of reds will not have any children and a recursive call will not be made
     */
    cash() {
        let totalCash = this.cashEarnedFromLayer();
        // Very helpful debug statement:
        // console.log(this.enemy.description(), `$${totalCash}`, `($${this.enemy.cashEarnedFromLayer()} * ${this.size})`)
        this.children().forEach((child) => (totalCash += child.cash()));
        return totalCash;
    }

    cashEarnedFromLayer() {
        return this.enemy.cashEarnedFromLayer() * this.size;
    }

    description() {
        return `${this.size} ${this.enemy.description()}`;
    }
}

function formatName(enemyName, formalName = false) {
    if (isBloon(enemyName)) {
        let name = Aliases.toIndexNormalForm(enemyName);
        if (formalName) name += ' Bloon';
        return name;
    } else if (isMOAB(enemyName)) {
        let name = enemyName.toUpperCase();
        if (formalName) name = name.split('').join('.') + '.';
        return name;
    }
}

function isBloon(enemyName) {
    return BLOONS.includes(enemyName);
}

function isMOAB(enemyName) {
    return MOABS.includes(enemyName);
}

function getHealthRamping(r) {
    let v;
    if (r <= 80) v = 1;
    else if (r <= 100) v = (r - 30) / 50;
    else if (r <= 124) v = (r - 72) / 20;
    else if (r <= 150) v = (3 * r - 320) / 20;
    else if (r <= 250) v = (7 * r - 920) / 20;
    else if (r <= 300) v = r - 208.5;
    else if (r <= 400) v = (3 * r - 717) / 2;
    else if (r <= 500) v = (5 * r - 1517) / 2;
    else v = 5 * r - 2008.5;
    return gHelper.round(v, 2);
}

function getSpeedRamping(r) {
    let v;
    if (r <= 80) v = 1;
    else if (r <= 100) v = 1 + (r - 80) * 0.02;
    else if (r <= 150) v = 1.6 + (r - 101) * 0.02;
    else if (r <= 200) v = 3.0 + (r - 151) * 0.02;
    else if (r <= 251) v = 4.5 + (r - 201) * 0.02;
    else v = 6.0 + (r - 252) * 0.02;
    return gHelper.round(v, 2);
}

module.exports = {
    BASE_RED_BLOON_SECONDS_PER_SECOND,
    ENEMIES_THAT_CAN_BE_SUPER,
    ENEMIES,
    BLOONS,
    MOABS,

    Enemy,

    formatName,

    /**
     * @summary returns back the multiplicative factor for health ramping
     * @param {int} round
     * @returns {int} multiplicative percentage increase
     */
    getHealthRamping,
    /**
     * @summary returns back the multiplicative factor for speed ramping
     * @param {int} round
     * @returns {int} multiplicative percentage increase
     */
    getSpeedRamping
};
