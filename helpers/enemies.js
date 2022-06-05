const roundHelper = require('./rounds')

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
    WHITE, BLACK, ZEBRA, LEAD, RAINBOW, CERAMIC
]

const RED_BLOON_SECONDS_PER_SECOND = {
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

    format(formalName=false) {
        return formatName(this.name, formalName)
    }

    children() {
        switch(enemy.name) {
            case RED:
                return Array(0)
            case BLUE:
                return Array(1).fill(RED)
            case GREEN:
                return Array(1).fill(BLUE)
            case YELLOW:
                return Array(1).fill(GREEN)
            case PINK:
                return Array(1).fill(YELLOW)
            case PURPLE:
                return Array(2).fill(PINK)
            case WHITE:
                return Array(2).fill(PINK)
            case BLACK:
                return Array(2).fill(PINK)
            case LEAD:
                return Array(2).fill(BLACK)
            case ZEBRA:
                return [BLACK, WHITE]
            case RAINBOW:
                return Array(2).fill(ZEBRA)
            case CERAMIC:
                return Array(2).fill(RAINBOW)
            case `${SUPER}_${PURPLE}`:
                return Array(1).fill(PINK)
            case `${SUPER}_${BLACK}`:
                return Array(1).fill(PINK)
            case `${SUPER}_${LEAD}`:
                return Array(1).fill(BLACK)
            case `${SUPER}_${ZEBRA}`:
                return Array(1).fill(`${SUPER}_${BLACK}`)
            case `${SUPER}_${RAINBOW}`:
                return Array(1).fill(`${SUPER}_${ZEBRA}`)
            case `${SUPER}_${CERAMIC}`:
                return Array(1).fill(RAINBOW)
            case MOAB: // same as ddt
            case DDT: // regrow children, but irrelevant
                if (round <= 80) {
                    return Array(4).fill(CERAMIC)
                } else {
                    return Array(4).fill(`${SUPER}_${CERAMIC}`)
                }
            case BFB:
                return Array(4).fill(MOAB)
            case ZOMG:
                Array(4).fill(BFB)
            case BAD:
                return Array(2).fill(ZOMG) + Array(3).fill(DDT)
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
        if (formalName) name = name.split('').join('.')
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
    RED_BLOON_SECONDS_PER_SECOND,

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