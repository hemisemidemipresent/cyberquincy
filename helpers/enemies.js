const roundHelper = require('./rounds')
const axios = require('axios')
const cheerio = require('cheerio')

ENEMIES = [
    BLOONS = [
        RED = 'red',
        BLUE = 'blue',
        GREEN = 'green',
        YELLOW = 'yellow',
        PINK = 'pink',
        PURPLE = 'purple',
        WHITE = 'white',
        BLACK = 'black',
        ZEBRA = 'zebra',
        LEAD = 'lead',
        RAINBOW = 'rainbow',
        CERAMIC = 'ceramic',
    ],
    MOABS = [
        MOAB = 'moab',
        BFB = 'bfb',
        ZOMG = 'zomg',
        DDT = 'ddt',
        BAD = 'bad',
    ]
].flat()

SUPER = 'super'
FORTIFIED = 'fortified'

ENEMIES_THAT_CAN_BE_FORTIFIED = [LEAD, CERAMIC] + MOABS
ENEMIES_THAT_CAN_BE_SUPER = [
    PURPLE, WHITE, BLACK, ZEBRA, LEAD, RAINBOW, CERAMIC
]

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
    [BAD]: 0.18,
}

const LAYER_RBES = {
    [`${FORTIFIED}_${LEAD}`]: 4,
    [CERAMIC]: 10,
    [`${SUPER}_${CERAMIC}`]: 60,
    [MOAB]: 200,
    [BFB]: 700,
    [ZOMG]: 4000,
    [DDT]: 400,
    [BAD]: 20000,
}

class Enemy {
    constructor(name, round=80, fortified=false, camo=false, regrow=false) {
        if (!ENEMIES.includes(name)) {
            throw `${name} is not a valid Enemy type; cannot instantiate Enemy`
        }

        if (!roundHelper.isValidRound(round)) {
            throw `${round} is not a valid BTD6 round; cannot instantiate Enemy`
        }

        if (typeof fortified != "boolean") {
            throw `fortified must be true/false; got ${fortified} instead; cannot instantiate Enemy`
        }

        if (typeof camo != "boolean") {
            throw `camo must be true/false; got ${camo} instead; cannot instantiate Enemy`
        }

        if (typeof regrow != "boolean") {
            throw `regrow must be true/false; got ${regrow} instead; cannot instantiate Enemy`
        }

        this.name = name
        this.fortified = fortified
        this.camo = camo
        this.regrow = regrow
        this.round = round
    }

    supr() {
        return this.round > 80 && ENEMIES_THAT_CAN_BE_SUPER.includes(this.name)
    }

    isBloon() {
        return isBloon(this.name)
    }

    isMOAB() {
        return isMOAB(this.name)
    }

    formatName(formalName=false) {
        return formatName(this.name, formalName)
    }

    children() {
        const clump = new EnemyClump(this, 1)
        return clump.children()
    }

    /**
     * @summary copies itself but changes the name/color to specified. It maintains the other important properties, as if the layer were popped.
     * @param {string} name
     * @returns {Enemy} The same enemy as this (fortified, regrow, etc.) but with the specified new name
     */
    shade(name) {
        const newBloon = structuredClone(this)
        newBloon.name = name
        return newBloon
    }

    async thumbnail() {
        const camo = this.camo ? 'Camo' : ''
        const regrow = this.regrow ? 'Regrow' : ''
        const fortified = this.fortified ? 'Fortified' : ''

        let bloonPageLink;
        let searches;
        if (this.isBloon()) {
            bloonPageLink = `https://bloons.fandom.com/wiki/${this.formatName(true).split(' ').join('_')}`
            const searchKey = `${fortified}${camo}${regrow}${this.formatName()}.png`
            searches = [searchKey, `BTD6${searchKey}`]
        } else if (this.isMOAB()) {
            bloonPageLink = `https://bloons.fandom.com/wiki/${this.formatName(true)}`
            const searchKey = `${fortified}${this.formatName()}.png`
            searches = [`BTD63D${searchKey}`, `3D${searchKey}`, `BTD3D${searchKey}`, `BTD6${searchKey}`]
            if (fortified) {
                searches = searches.concat(
                    searches.map(search => search.replace(/Fortified/, 'F'))
                )
            }
        }
        const response = await axios.get(bloonPageLink)
        let $ = cheerio.load(response.data);

        for (const search of searches) {
            let imageTile = $(this.thumbnailImageTileSelector(search))
            if (imageTile.length > 0) {
                return imageTile.attr('data-src')
            }
        }

        return null;
    }

    thumbnailImageTileSelector(search) {
        return `table.article-table img[alt=${search}]`
    }
}

// https://bloons.fandom.com/wiki/Bloons_Wiki?file=BTD63DDDT.png
// https://bloons.fandom.com/wiki/Bloons_Wiki?file=BTD6CamoRegrowRed.png


// Just a group of size N of the same type of enemy
// This prevents the need from instantiating N of the same enemy type during calculation
class EnemyClump {
    constructor(enemy=null, size=1) {
        if (enemy && !(enemy instanceof Enemy)) {
            throw `enemy needs to be of type "Enemy"; got a ${typeof enemy} instead; cannot instantiate EnemyClump`
        }

        if (!Number.isInteger(size) || parseInt(size) < 0) {
            throw `size needs to be a whole number; got ${size} instead; cannot instantiate EnemyClump`
        }

        if (!enemy && size > 0) {
            throw `size must be zero if there is no enemy; cannot instantiate EnemyClump`
        }

        this.enemy = enemy
        this.size = size
    }

    children() {
        switch(this.enemy.name) {
            case RED:
                return []
            case BLUE:
                return [
                    new EnemyClump(
                        this.enemy.shade(RED),
                        this.size
                    )
                ]
            case GREEN:
                return [
                    new EnemyClump(
                        this.enemy.shade(BLUE),
                        this.size
                    )
                ]
            case YELLOW:
                return [
                    new EnemyClump(
                        this.enemy.shade(GREEN),
                        this.size
                    )
                ]
            case PINK:
                return [
                    new EnemyClump(
                        this.enemy.shade(YELLOW),
                        this.size
                    )
                ]
            case PURPLE: {
                const superFactor = this.enemy.supr() ? 1 : 2
                return [
                    new EnemyClump(
                        this.enemy.shade(PINK),
                        this.size * superFactor
                    )
                ]
            }
            case WHITE: {
                const superFactor = this.enemy.supr() ? 1 : 2
                return [
                    new EnemyClump(
                        this.enemy.shade(PINK),
                        this.size * superFactor
                    )
                ]
            }
            case BLACK: {
                const superFactor = this.enemy.supr() ? 1 : 2
                return [
                    new EnemyClump(
                        this.enemy.shade(PINK),
                        this.size * superFactor
                    )
                ]
            }
            case LEAD: {
                const superFactor = this.enemy.supr() ? 1 : 2
                return [
                    new EnemyClump(
                        this.enemy.shade(BLACK),
                        this.size * superFactor
                    )
                ]
            }
            case ZEBRA: {
                let result = [
                    new EnemyClump(
                        this.enemy.shade(BLACK),
                        this.size * superFactor
                    )
                ]
                if (this.enemy.supr()) {
                    result += [
                        new EnemyClump(
                            this.enemy.shade(WHITE),
                            this.size * superFactor
                        )
                    ]
                }
                return result;
            }
            case RAINBOW: {
                const superFactor = this.enemy.supr() ? 1 : 2
                return [
                    new EnemyClump(
                        this.enemy.shade(ZEBRA),
                        this.size * superFactor
                    )
                ]
            }
            case CERAMIC: {
                const superFactor = this.enemy.supr() ? 1 : 2
                return [
                    new EnemyClump(
                        this.enemy.shade(RAINBOW),
                        this.size * superFactor
                    )
                ]
            }
            case MOAB:
                return [
                    new EnemyClump(
                        this.enemy.shade(CERAMIC),
                        this.size * 4
                    )
                ]
            case DDT:
                const child = this.enemy.shade(CERAMIC)
                child.regrow = regrow
                return [
                    new EnemyClump(
                        child,
                        this.size * 4
                    )
                ]
            case BFB:
                return [
                    new EnemyClump(
                        this.enemy.shade(MOAB),
                        this.size * 4
                    )
                ]
            case ZOMG:
                return [
                    new EnemyClump(
                        this.enemy.shade(BFB),
                        this.size * 4
                    )
                ]
            case BAD:
                return [
                    new EnemyClump(
                        this.enemy.shade(ZOMG),
                        this.size * 2
                    ),
                    new EnemyClump(
                        this.enemy.shade(DDT),
                        this.size * 3
                    ),
                ]
            default:
                throw `\`children()\` doesn't account for ${this.enemy.name}`
        }
    }
}

function formatName(enemyName, formalName=false) {
    if (isBloon(enemyName)) {
        let name = Aliases.toIndexNormalForm(enemyName)
        if (formalName) name += " Bloon"
        return name
    } else if (isMOAB(enemyName)) {
        let name = enemyName.toUpperCase()
        if (formalName) name = name.split('').join('.') + '.'
        return name
    }
}

function isBloon(enemyName) {
    return BLOONS.includes(enemyName)
}

function isMOAB(enemyName) {
    return MOABS.includes(enemyName)
}

function getHealthRamping(r) {
    if (r <= 80) return 1;
    else if (r <= 100) return (r - 30) / 50;
    else if (r <= 124) return (r - 72) / 20;
    else if (r <= 150) return (3 * r - 320) / 20;
    else if (r <= 250) return (7 * r - 920) / 20;
    else if (r <= 300) return r - 208.5;
    else if (r <= 400) return (3 * r - 717) / 2;
    else if (r <= 500) return (5 * r - 1517) / 2;
    else return 5 * r - 2008.5;
}

function getSpeedRamping(r) {
    if (r <= 80) return 1;
    else if (r <= 100) return 1 + (r - 80) * 0.02;
    else if (r <= 150) return 1.6 + (r - 101) * 0.02;
    else if (r <= 200) return 3.0 + (r - 151) * 0.02;
    else if (r <= 250) return 4.5 + (r - 201) * 0.02;
    else return 6.0 + (r - 252) * 0.02;
}

module.exports = {
    BASE_RED_BLOON_SECONDS_PER_SECOND,

    ENEMIES, BLOONS, MOABS,

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
     getSpeedRamping,
}