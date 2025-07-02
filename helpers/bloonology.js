const axios = require('axios');
const { isValidUpgradeSet } = require('./towers');
const { round } = require('./general');
const templeStats = require('../jsons/temple.json');

const TOWER_NAME_TO_BLOONOLOGY_LINK = {
    dart_monkey: 'https://pastebin.com/raw/FK4a9ZSi',
    boomerang_monkey: 'https://pastebin.com/raw/W2x9dvPs',
    bomb_shooter: 'https://pastebin.com/raw/XaR4JafN',
    tack_shooter: 'https://pastebin.com/raw/ywGCyWdT',
    ice_monkey: 'https://pastebin.com/raw/3VKx3upE',
    glue_gunner: 'https://pastebin.com/raw/cg8af3pj',
    sniper_monkey: 'https://pastebin.com/raw/8uQuKygM',
    monkey_sub: 'https://pastebin.com/raw/F9i5vPX9',
    monkey_buccaneer: 'https://pastebin.com/raw/EuiGUBWs',
    monkey_ace: 'https://pastebin.com/raw/hACdmBFa',
    heli_pilot: 'https://pastebin.com/raw/dfwcqzDT',
    mortar_monkey: 'https://pastebin.com/raw/64s0RqaZ',
    dartling_gunner: 'https://pastebin.com/raw/DDkmKP6n',
    wizard_monkey: 'https://pastebin.com/raw/4MsYDjFx',
    super_monkey: 'https://pastebin.com/raw/SUxZg6Dk',
    ninja_monkey: 'https://pastebin.com/raw/kPAF2hqw',
    alchemist: 'https://pastebin.com/raw/76m7ATYF',
    druid: 'https://pastebin.com/raw/4egsjcpa',
    banana_farm: 'https://pastebin.com/raw/Es0nVqt1',
    spike_factory: 'https://pastebin.com/raw/tTHZWiSi',
    monkey_village: 'https://pastebin.com/raw/e2QHaQSD',
    engineer_monkey: 'https://pastebin.com/raw/rTHT0L21',
    beast_handler: 'https://pastebin.com/raw/B3VF2rRq',
    mermonkey: 'https://pastebin.com/raw/sS6rm5Bj',
    desperado: 'https://pastebin.com/raw/zc7nhqq0'
};
const TOWER_NAME_TO_BLOONOLOGY_LINK_B2 = {
    dart_monkey: 'https://pastebin.com/raw/E4sjy0RY',
    boomerang_monkey: 'https://pastebin.com/raw/C5ZB2zFf',
    bomb_shooter: 'https://pastebin.com/raw/KnRACEau',
    tack_shooter: 'https://pastebin.com/raw/VLmsXZTc',
    ice_monkey: 'https://pastebin.com/raw/m3dYQm2v',
    glue_gunner: 'https://pastebin.com/raw/5anNnsHm',
    sniper_monkey: 'https://pastebin.com/raw/athJ9mmM',
    monkey_sub: 'https://pastebin.com/raw/4RvDMd4R',
    monkey_buccaneer: 'https://pastebin.com/raw/hxMcDEyv',
    monkey_ace: 'https://pastebin.com/raw/2AqFKp6X',
    heli_pilot: 'https://pastebin.com/raw/VwfCvPdH',
    mortar_monkey: 'https://pastebin.com/raw/htTpLUK1',
    dartling_gunner: 'https://pastebin.com/raw/kZ0S1258',
    wizard_monkey: 'https://pastebin.com/raw/MJ34tpHv',
    super_monkey: 'https://pastebin.com/raw/kJ2NQFJM',
    ninja_monkey: 'https://pastebin.com/raw/AQgwfKvC',
    alchemist: 'https://pastebin.com/raw/w85rRVjV',
    druid: 'https://pastebin.com/raw/KNXR24g2',
    banana_farm: 'https://pastebin.com/raw/H2UEFh0E',
    spike_factory: 'https://pastebin.com/raw/pAy8v9Ge',
    monkey_village: 'https://pastebin.com/raw/h28ruxxd',
    engineer_monkey: 'https://pastebin.com/raw/NPGKFNEv'
};
const HERO_NAME_TO_BLOONOLOGY_LINK = {
    quincy: 'https://pastebin.com/raw/ASpHNduS',
    gwendolin: 'https://pastebin.com/raw/rZYjbEhX',
    striker_jones: 'https://pastebin.com/raw/hrH8q0bd',
    obyn_greenfoot: 'https://pastebin.com/raw/x2WiKEWi',
    captain_churchill: 'https://pastebin.com/raw/cqaHnhgB',
    benjamin: 'https://pastebin.com/raw/j6X3mazy',
    ezili: 'https://pastebin.com/raw/dYu1B9bp',
    pat_fusty: 'https://pastebin.com/raw/2YRMFjPG',
    adora: 'https://pastebin.com/raw/WnsgkWRc',
    admiral_brickell: 'https://pastebin.com/raw/amw39T29',
    etienne: 'https://pastebin.com/raw/UxN2Wx1F',
    sauda: 'https://pastebin.com/raw/8E2TSndk',
    psi: 'https://pastebin.com/raw/9h9aAPUm',
    geraldo: 'https://pastebin.com/raw/rksZWhTV',
    corvus: 'https://pastebin.com/raw/JVnXdsqZ',
    rosalia: 'https://pastebin.com/raw/CbXjwva7'
};
const RELIC_BLOONOLOGY_LINK = 'https://pastebin.com/raw/RMqJQApE';
const BLOONOLOGY_INDENT = 6;
const BLOONOLOGY_BASE_CHANGE_HEADERS = [
    "__changes from 0-0-0__",
    "changes from 000:"
];
const BLOONOLOGY_TIER_CHANGE_HEADERS = [
    "__changes from previous tier__",
    "changes from previous tier:"
];
const BLOONOLOGY_CROSSPATH_CHANGE_HEADERS = [
    "__crosspath changes__",
    "__crosspath benefits__",
    "crosspath benefits:"
];

function towerNameToBloonologyLink(towerName, isB2) {
    let array = isB2 ? TOWER_NAME_TO_BLOONOLOGY_LINK_B2 : TOWER_NAME_TO_BLOONOLOGY_LINK;
    return array[towerName];
}

async function towerNameToBloonologyList(towerName, isB2) {
    let link = towerNameToBloonologyLink(towerName, isB2);
    res = await axios.get(link);
    let body = res.data;
    return body.split(/(?=^\s*[0-5]{3}\s*$)/m).filter(x => isValidUpgradeSet(x.substr(0, 3)));
}

async function towerLatestVersion(towerName, isB2) {
    let link = towerNameToBloonologyLink(towerName, isB2);
    res = await axios.get(link);
    let body = res.data;
    version = body.match(/^Version: ([0-9.]*)$/m);
    return version === null ? null : version[1];
}

async function heroLatestVersion(heroName) {
    let link = HERO_NAME_TO_BLOONOLOGY_LINK[heroName];
    res = await axios.get(link);
    let body = res.data;
    version = body.match(/^Version: ([0-9.]*)$/m);
    return version === null ? null : version[1];
}

function cleanBloonology(description) {
    description = description.trim();
    description = description.replace(/\r?\n|\r/g, "\n"); // Normalize line endings
    description = description.replace(/[\u2000-\u200F\u202A-\u202F]/g, ""); // Remove invisible characters
    description = description.replace(/\t/g, " ".repeat(BLOONOLOGY_INDENT));
    let firstIndent = description.match(/^( +).*$/m);
    let indentSize = BLOONOLOGY_INDENT;
    if (firstIndent) indentSize = firstIndent[1].length;
    return description.split("\n").map((line) => { // Normalize indentation
        line = line.trimEnd();
        let trimmed = line.trim();
        let indent = Math.round((line.length - trimmed.length) / indentSize) * BLOONOLOGY_INDENT;
        if (indent >= BLOONOLOGY_INDENT && !trimmed.startsWith("-")) {
            trimmed = "- " + trimmed;
        }
        trimmed = trimmed.replace(/^-/, "\u200B-");
        return "\u200B ".repeat(indent) + trimmed;
    }).join("\n");
}

async function towerUpgradeToFullBloonology(towerName, upgrade, isB2) {
    let list = await towerNameToBloonologyList(towerName, isB2);
    return cleanBloonology(list.find(x => x.substr(0, 3) === upgrade).substr(3));
}

async function towerUpgradesToFullBloonology(towerName, upgrades, isB2) {
    let list = await towerNameToBloonologyList(towerName, isB2);
    return upgrades.map(upgrade => cleanBloonology(list.find(x => x.substr(0, 3) === upgrade).substr(3)));
}

function splitBloonology(description) {
    let ret = ["", "", "", ""]; // Main, Base, Tier, Crosspath
    let ind = 0;
    for (let line of description.split("\n")) {
        if (BLOONOLOGY_BASE_CHANGE_HEADERS.includes(line.trim().toLowerCase())) {
            ind = 1;
        } else if (BLOONOLOGY_TIER_CHANGE_HEADERS.includes(line.trim().toLowerCase())) {
            ind = 2;
        } else if (BLOONOLOGY_CROSSPATH_CHANGE_HEADERS.includes(line.trim().toLowerCase())) {
            ind = 3;
        } else {
            ret[ind] += line + "\n";
        }
    }
    return ret.map(x => x.trim());
}

async function towerUpgradeToMainBloonology(towerName, upgrade, isB2, summary = false) {
    let description = await towerUpgradeToFullBloonology(towerName, upgrade, isB2);
    description = splitBloonology(description)[0];
    if (summary) {
        return description
            .replace(/\u200B/g, "")
            .split("\n")
            .map(x => x.trim())
            .filter(x => x.length)
            .join(" ♦ ");
    }
    return description;
}

async function towerUpgradesToMainBloonology(towerName, upgrades, isB2, summary = false) {
    let descriptions = await towerUpgradesToFullBloonology(towerName, upgrades, isB2);
    descriptions = descriptions.map(x => splitBloonology(x)[0]);
    if (summary) {
        return descriptions.map(
            description => description
                .replace(/\u200B/g, "")
                .split("\n")
                .map(x => x.trim())
                .filter(x => x.length)
                .join(" ♦ ")
        );
    }
    return descriptions;
}

async function towerUpgradeToBaseChangeBloonology(towerName, upgrade, isB2, summary = false) {
    let description = await towerUpgradeToFullBloonology(towerName, upgrade, isB2);
    description = splitBloonology(description)[1];
    if (summary) {
        return description
            .replace(/\u200B/g, "")
            .split("\n")
            .map(x => "⟴ " + x.trim())
            .join("\n");
    }
    return description;
}

async function towerUpgradesToBaseChangeBloonology(towerName, upgrades, isB2, summary = false) {
    let descriptions = await towerUpgradesToFullBloonology(towerName, upgrades, isB2);
    descriptions = descriptions.map(x => splitBloonology(x)[1]);
    if (summary) {
        return descriptions.map(
            description => description
                .replace(/\u200B/g, "")
                .split("\n")
                .map(x => "⟴ " + x.trim())
                .join("\n")
        );
    }
    return descriptions;
}

async function towerUpgradeToTierChangeBloonology(towerName, upgrade, isB2, summary = false) {
    let description = await towerUpgradeToFullBloonology(towerName, upgrade, isB2);
    description = splitBloonology(description)[["100", "010", "001"].includes(upgrade) ? 1 : 2];

    if (summary) {
        return description
            .replace(/\u200B/g, "")
            .split("\n")
            .map(x => "⟴ " + x.trim())
            .join("\n");
    }
    return description;
}

async function towerUpgradesToTierChangeBloonology(towerName, upgrades, isB2, summary = false) {
    let descriptions = await towerUpgradesToFullBloonology(towerName, upgrades, isB2);
    descriptions = descriptions.map(
        (x, ind) => splitBloonology(x)[["100", "010", "001"].includes(upgrades[ind]) ? 1 : 2]
    );
    if (summary) {
        return descriptions.map(
            description => description
                .replace(/\u200B/g, "")
                .split("\n")
                .map(x => "⟴ " + x.trim())
                .join("\n")
        );
    }
    return descriptions;
}

async function towerUpgradeToCrosspathChangeBloonology(towerName, upgrade, isB2, summary = false) {
    let description = await towerUpgradeToFullBloonology(towerName, upgrade, isB2);
    description = splitBloonology(description)[3];
    if (summary) {
        return description
            .replace(/\u200B/g, "")
            .split("\n")
            .map(x => "• " + x.trim())
            .join("\n");
    }
    return description;
}

async function towerUpgradesToCrosspathChangeBloonology(towerName, upgrades, isB2, summary = false) {
    let descriptions = await towerUpgradesToFullBloonology(towerName, upgrades, isB2);
    descriptions = descriptions.map(x => splitBloonology(x)[3]);
    if (summary) {
        return descriptions.map(
            description => description
                .replace(/\u200B/g, "")
                .split("\n")
                .map(x => "• " + x.trim())
                .join("\n")
        );
    }
    return descriptions;
}

async function heroNameToBloonologyList(heroName) {
    let link = HERO_NAME_TO_BLOONOLOGY_LINK[heroName];
    res = await axios.get(link);
    let body = res.data;
    return body.split(/^\s*(?:level\s(?:1?[0-9]|20)|all\slevels)\s*$/im)
        .filter(x => x.length && x.search(/Version: [0-9.]*/i) === -1)
        .map(cleanBloonology);
}

async function getRelicBloonology() {
    res = await axios.get(RELIC_BLOONOLOGY_LINK);
    let body = res.data;
    let relics = body.replace(/\r?\n|\r/g, "\n").split("\n\n");
    let relicMap = {};
    for (let relic of relics) {
        let lines = relic.split("\n");
        let relicName = lines[0].replace(/\*\*/g, "").trim();
        let relicDescription = lines.slice(1).join("\n").trim();
        relicMap[relicName] = cleanBloonology(relicDescription);
    }
    return relicMap;
}

function damageDescription(stats) {
    let desc = `${stats.d}d, `
        + (stats.cd > 0 ? `+${stats.cd}cd (${stats.tcd}), ` : "")
        + (stats.fd > 0 ? `+${stats.fd}fd (${stats.tfd}), ` : "")
        + (stats.md > 0 ? `+${stats.md}md (${stats.tmd}), ` : "")
        + (stats.cad > 0 ? `+${stats.cad} camo damage (${stats.tcad}), ` : "");
    if (stats.bd > 0) {
        desc += `+${stats.bd}bd` + (stats.bdm > 1 ? ", " : ` (${stats.tbd}), `);
    }
    desc += (stats.bdm > 1 ? `×${stats.bdm}bd (${stats.tbd}), ` : "")
        + (stats.edm > 1 ? `×${stats.edm}ed (${stats.ted}), ` : "");

    return desc.substring(0, desc.length - 2);
}

function attackDescription(stats) {
    let desc = damageDescription(stats) + ", "
        + (stats.p ? `${stats.p}p, ` : "")
        + (stats.s ? `${stats.s}s, ` : "");

    return desc.substring(0, desc.length - 2);
}

function extraDamageDescription(stats) {
    let desc = (stats.sd ? `+${stats.sd}d (${stats.tsd}) to stunned bloons, ` : "")
        + (stats.std ? `+${stats.std}d (${stats.tstd}) to bloons with *sticky* status, ` : "");

    return desc.substring(0, desc.length - 2);
}

function dartParagonBloonology(stats) {
    let { main, mini } = stats;

    let desc = `85r
*juggernaut*- ${attackDescription(main)}, 3j, normal, camo
    - expires when it hits the map border
    - can rebound off walls and rehit bloons after rebound
    - emits 6 *mini-juggernaut*s when 50% or 0 pierce is left
        - emits all remaining sets on expiration
        - *mini-juggernaut*- ${attackDescription(mini)}, normal, camo
            - can rebound off walls and rehit bloons after rebound`;

    return cleanBloonology(desc);
}

function boomerParagonBloonology(stats) {
    let { main, mainDot, orbit, press, pressExplosion, pressDot } = stats;

    let desc = `60r
*glaive*- ${attackDescription(main)}, normal, camo
    - can jump to a nearby target after hitting
        - unlimited jump distance
    - first hit applies *shred* status- (${damageDescription(mainDot)})/1s, normal, 15.1s duration
    - can travel through walls

*orbital-glaive*- ${attackDescription(orbit)}, normal, camo
    - zone, 50r
    - cannot be range-buffed

*press* - ${attackDescription(press)}, normal, camo
    - 100r
    - only targets blimps
    - can attack through walls
    - can rehit bloons every 0.1s
    - creates *explosion* instead of returning
        - *explosion*- ${attackDescription(pressExplosion)}, normal, camo
            - 50 blast radius
            - applies *burn* status- (${damageDescription(pressDot)})/1s, normal, 4s duration
    - applies *stun* for 0.25s
    - applies *pushback* to bloons
        - MOABs move back 1 unit, BFBs 0.5 units, DDTs and ZOMGs 0.25 units

*buff* - all primary towers get 90%s, including paragons`;

    return cleanBloonology(desc);
}

function ninjaParagonBloonology(stats) {
    let { shuriken, fbomb, blues, sbomb, sbombSplash } = stats;

    let desc = `70r
*shuriken*- ${attackDescription(shuriken)}, 8j, normal, camo
    - ${extraDamageDescription(shuriken)}
    - 15% chance to send non-blimps back 100-150 units
        - ceramics are sent back 50-75 units
    - strong seeking

*flash-bomb*- ${attackDescription(fbomb)}, 5j, normal, camo
    - 40 blast radius
    - stuns non-blimps for 3s, blimps for 1s
    - 15% chance to send non-blimps back 10-300 units
    - each emits 3 *blue-shuriken*s on impact
        - *blue-shuriken*- ${attackDescription(blues)}, normal, camo
            - cannot rehit the same bloon
            - 15% chance to send non-blimps back 10-300 units
            - strong seeking

*sticky-bomb*- ${sbomb.s}s, normal, camo
    - ∞r
    - only targets blimps without *sticky* status
    - targets the strongest bloon
    - applies *sticky* status- (${damageDescription(sbomb)})/2.95s, normal, 3s duration
        - damage soaks through blimp layers
        - creates *explosion* after 2.95s
            - *explosion*- ${attackDescription(sbombSplash)}, normal, camo
                - 40 blast radius
                - 15% chance to send non-blimps back 10-300 units

*sabotage*- All bloons move at 50% speed and blimps spawn with 75% health (does not stack with x4+x ninja)
*buff*- all towers get camo detection`;

    return cleanBloonology(desc);
}

function buccParagonBloonology(stats) {
    let { cannonball, plasmaDarts, darts, missile, ability } = stats;

    let desc = `60r
*battery*- 3 sets of *cannonball* (effective 9j) and *plasma-dart* (effective 18j) per side, each with a 180° field of view
    *cannonball*- ${attackDescription(cannonball)}, 3j, normal, camo
        - 40 blast radius
    *plasma-dart*- ${attackDescription(plasmaDarts)}, 6j, normal, camo

*hook*- 1s, hooks and destroys the strongest blimp on-screen using up to 2 hooks, camo
    - has 10 hooks available
    - ZOMGs require the use of 2 hooks
    - once all 10 hooks are used, the attack is disabled for 10s before replenishing the 10 hooks

spawns 3 *aircraft* subtowers
    - ∞r
    - *dart*- ${attackDescription(darts)}, normal, camo
    - *missile*- ${attackDescription(missile)}, 4j, normal, camo
        - only targets blimps
        - 30 blast radius
        - seeking (57.3 turn radius)
        
*income*- $3200 income at the end of each round
*buff*- all water towers and monkey aces get 85%s, including paragons, excluding itself
*trade-deal-buff*- towers in range excluding itself get +10% sellback rate, up to 95%
    - not stackable
*empire-buff*- affects up to 20 xx3+ buccaneers, prioritising xx4 buccaneers
    - gets +10d, +10cd, +10md
    - gets +$20 income for every affected xx4 buccaneer
    - gets +$15 income for every affected xx3 buccaneer
    - does not affect itself
provides two platforms that can each accomodate 1 small or medium footprint land tower

**Mega Hook** ability: ${ability.cooldown}s cooldown, hooks and destroys the strongest blimp on-screen, including BADs, camo
    - initial cooldown of ${round(ability.cooldown / 3, 1)}s
    - can only be used 2 times per round`;

    return cleanBloonology(desc);
}

function engiParagonBloonology(stats) {
    let { nailGuns, megaExplosion, endpoint, beam, modExplosion, modPlasma, plasma, missile, explosion, ability } = stats;

    let desc = `70r
*nail-gun*- ${attackDescription(nailGuns)}, 3j, normal, camo
    - stuns bloons for 5s
    - gets +30% attack speed at the end of each round
        - (this is an attack speed buff, not an attack cooldown buff. To convert to attack cooldown buff, do 1 / (buff))
        - maxes at 0.15s attack cooldown

**Mega Sentry** ability: ${ability.cooldown}s cooldown, cycles between spawning green, red, and blue mega sentries in that order
    - *green-mega-sentry*
        - 70r
        - creates *mega-explosion* on expiration
            - *mega-explosion*- ${attackDescription(megaExplosion)}, plasma, camo
                - 40 blast radius
        - *beam*- ${attackDescription(beam)}, plasma, camo
        - *endpoint*- ${attackDescription(endpoint)} ${beam.s}s, plasma, camo
            - uses the remaining pierce from *beam*
        - *sentry*- 6s, spawns *plasma-sentry* subtower that lasts 19s
            - cannot be rate-buffed

    - *red-mega-sentry*
        - 70r
        - creates *mega-explosion* on expiration
        - *plasma*- ${attackDescription(plasma)}, 4j, plasma, camo
        - *sentry*- 6s, spawns *plasma-sentry* subtower that lasts 19s
            - cannot be rate-buffed

    - *blue-mega-sentry*
        - 70r
        - creates *mega-explosion* on expiration
        - *missile*- ${attackDescription(missile)}, normal, camo
            - each bloon uses 2p
            - creates *explosion* on impact
                - *explosion*- ${attackDescription(explosion)}, normal, camo
                    - 30 blast radius
        - *sentry*- 6s, spawns *plasma-sentry* subtower that lasts 19s
            - cannot be rate-buffed

    - *plasma-sentry*
        - 50r
        - creates *explosion* on expiration
            - *explosion*- ${attackDescription(modExplosion)}, plasma, camo
                - zone, 50r
        - *plasma*- ${attackDescription(modPlasma)}, plasma, camo`;

    return cleanBloonology(desc);
}

function aceParagonBloonology(stats) {
    let { radial, radialExplosion, seeking, seekingExplosion, forward, carpet } = stats;

    let desc = `∞r
    - dummy 22r
*radial-dart*- ${attackDescription(radial)}, 12j, normal, camo
    - creates *dart-explosion* when out of pierce
        - *dart-explosion*- ${attackDescription(radialExplosion)}, normal, camo

*seeking-missile*- ${attackDescription(seeking)}, 1p, 8j, normal, camo
    - only targets blimps
    - cannot be pierce-buffed
    - seeking (53.7 turn radius)
    - creates *explosion* on impact
        - *explosion*- ${attackDescription(seekingExplosion)}, normal, camo

*forward-dart*- ${attackDescription(forward)}, 2j, normal, camo
    - light seeking (222.8 turn radius)
    - has a 60° field of view

**Carpet Bomb** ability: ${carpet.cooldown}s cooldown, drops 8 *bomb*s along the selected path with 0.067s between each bomb
    - *bomb*- ${attackDescription(carpet)}, normal, camo
        - 50 blast radius
        - if a layer is not popped, it is stunned for 8s
        - takes 0.75s to explode
    - the first *bomb* drops after 2.65s to 3.6s depending on the distance of the path start from the screen edge
    - 3.4s to 4.35s total delay until the first *bomb*`;

    return cleanBloonology(desc);
}

function wizParagonBloonology(stats) {
    let { arcane, drain, flamethrower, wof, flame, fireball, metamorphosis, explosion, burn, zomg, bfb } = stats;

    let desc = `80r
*mana-graveyard*- 100,000 mana capacity
    - 50%s on all attacks except *phoenix* when at least 50,000 mana is left

*arcane-blast*- ${attackDescription(arcane)}, normal, camo
    - seeking (31.8 turn radius)
    - uses 50 mana per attack
    - spawns *zombie-bloon* when a bloon is popped
        - *zombie-bloon*- 150d, +150bd, 50p, normal, camo
            - lasts 16s
            - travels at the same speed as a base red bloon
            - uses 250 mana per spawn

*drain-beam*- ${attackDescription(drain)}, 0.05s, normal, camo
    - 120r
    - cannot be rate-buffed
    - gains 250 mana per attack

*phoenix* subtower
    - ∞r
    - *flame*- ${attackDescription(flame)}, normal, camo
        - uses 50 mana per attack
    - *fireball*- ${attackDescription(fireball)}, 8j, normal, camo

**Arcane Metamorphosis** ability: ${metamorphosis.cooldown}s cooldown, activates *flamethrower* and *fire-wall* attacks, disables all other attacks
    - drains 5000 mana per second, ends when 0 mana is left
    - *flamethrower*- ${attackDescription(flamethrower)}, 2j, normal, camo
    - *fire-wall*- ${wof.s}, normal, camo
        - spawns up to 5 *wall-of-fire*s at least 0.1s apart when hitting a bloon
            - *wall-of-fire*- ${damageDescription(wof)}, ${wof.p}p, 0.1s, normal, camo
                - cannot be rate-buffed
                - lasts 9s

**Phoenix Explosion** ability: ${explosion.cooldown}s cooldown, uses all mana and disables *phoenix* for 10s
    - creates *explosion* at the *phoenix* position
        - *explosion*- ∞p, normal, camo
            - 100 blast radius
            - applies *burn* status- (${damageDescription(burn)})/0.5s, fire, 30.05s duration
    - spawns 1 *zombie-zomg* in range per 9000 mana in the graveyard, up to 10 *zombie-zomg*s
        - *zombie-zomg*- ${attackDescription(zomg)}, normal, camo
            - lasts 10s
            - travels at the same speed as a base red bloon
            - spawns 4 *zombie-bfb*s upon expiration or when out of pierce
                - *zombie-bfb*- ${attackDescription(bfb)}, normal, camo
                    - lasts 7s
                    - travels at the same speed as a base red bloon
                    - cannot rehit the same bloon`;

    return cleanBloonology(desc);
}

function subParagonBloonology(stats) {
    let { aura, preemptive, explosion, dart, airburst, strike, aftershock, fallout } = stats;

    let desc = `52r
### SUBMERGED
*radiation*- ${attackDescription(aura)}, 0.28s, normal, removes camo and regrow
    - zone, 52r
    - cannot be rate-buffed
*submerge-buff*- 600%d, 300%p, 130%s, 500% xp per round for heroes in range
    - 130%s makes heroes attack slower
    - 700%d, 300%p for monkey subs in range
        - does not affect x4+x sub's ability
    - 50% ability cooldown for water towers in range excluding paragons
    - 90% ability cooldown for paragons in range
    - 80% ability cooldown for all other towers excluding paragons
### UNSUBMERGED
*dart*- ${damageDescription(dart)}, 1p, ${dart.s}s, normal, camo
    - strong seeking (27.1 turn radius)
    - can attack bloons in the range of other towers
    - creates *airburst* on impact
        - *airburst*- ${attackDescription(airburst)}, 3j, normal, camo
*pre-emptive-missile*- ${attackDescription(preemptive)}, 1p, normal, camo
    - creates *explosion* on impact
        - *explosion*- ${attackDescription(explosion)}, normal, camo

**Final Strike** ability: ${strike.cooldown}s cooldown, disables all attacks for 15s, launches 3 *missile*s that target strong, first, and close
    - *missile*- ${attackDescription(strike)}, normal, camo
        - 60 blast radius
        - creates *aftershock* and 5 *fallout-puddle*s on the track in 60r on impact
            - *aftershock*- ${attackDescription(aftershock)}, normal, camo
                - 180 blast radius
                - if a layer is not popped, it is stunned for 15s
            - *fallout-puddle*- ${attackDescription(fallout)}, 0.1s, normal, camo
                - lasts 36s
                - cannot be rate-buffed
    - the *missile*s strike after 15.65s, 15.7s, and 15.75s respectively`;

    return cleanBloonology(desc);
}

function tackParagonBloonology(stats) {
    let { blade, tack, eruption, meteor, fireball } = stats;

    let desc = `42.3r
*blade*- ${attackDescription(blade)}, 4j, normal
    - emits *tack*s when out of pierce or expired
        - *tack*- ${attackDescription(tack)}, 6j, normal

**Eruption** ability: ${eruption.cooldown}s cooldown, activates *fire-zone* and doubles *blade* and *tack* projectile lifespan for 9.05s
    - initial cooldown of ${round(eruption.cooldown / 3, 1)}s
    - *fire-zone*- ${attackDescription(eruption)}, normal
        - 45r
        
**Meteor Impact** ability: ${meteor.cooldown}s cooldown, launches a *meteor* at a bloon
    - initial cooldown of ${round(meteor.cooldown / 3, 1)}s
    - *meteor*- ${attackDescription(meteor)}, normal
        - emits *fireball*s on impact
            - *fireball*- ${attackDescription(fireball)}, 32j, normal
                - strong seeking
        - 120 blast radius`;

    return cleanBloonology(desc);
}

function spacParagonBloonology(stats) {
    let { mine, mineExplosion, spike, carpet, burst, spikeageddon, spikeExplosion, spikeBall } = stats;

    let desc = `42r
*mine*- ${attackDescription(mine)}, normal, camo
    - creates *mine-explosion* for each pierce used and on expiry
        - *mine-explosion*- ${attackDescription(mineExplosion)}, normal, camo
            - 30 blast radius
    - creates *spikes* on the track in 42r when *mine* runs out of pierce or expires
        - *spikes*- ${attackDescription(spike)}, 10j, normal, camo
            - lasts 2 rounds or 9-11s
    - lasts 5 rounds or 300s
*carpet-of-spikes*- range increases by 16.67 per second until the whole map is covered
    - bloons in range take (${damageDescription(carpet)})/0.5s, ∞p, normal, camo

**Controlled Burst** ability: ${burst.cooldown}s cooldown, applies *buff* to itself for 10s
    - initial cooldown of ${round(burst.cooldown / 3, 1)}s
    - *buff*- attacks get 25%s
        - (${round(mine.s / 4, 4)}s for *mine*)
    - can only be used once per round
        
**Spikeageddon** ability: ${spikeageddon.cooldown}s cooldown, launches *spike-bomb*s onto each track in reverse every 0.6s
    - initial cooldown of ${round(spikeageddon.cooldown / 3, 1)}s
    - if any *spike-bomb*s exist on-screen, they are detonated and no new *spike-bomb*s are launched
    - *spike-bomb*- 1p, normal, camo
        - cannot be pierce-buffed
        - creates *spike-ball*s on the track and *spike-explosion* on contact or expiry
            - *spike-ball*- ${attackDescription(spikeBall)}, 3j, normal, camo
                - lasts 5 rounds or 300s
            - *spike-explosion*- ${attackDescription(spikeExplosion)}, normal, camo
                - 150 blast radius
        - lasts 5 rounds or 400s
    - each *spike-bomb* is launched 60 units apart on average along each track`;

    return cleanBloonology(desc);
}

function sacrificeToLevel(cash) {
    const sacrificeThresholds = [300, 1001, 2001, 4001, 7501, 10001, 15001, 25001, 50001];
    for (let i = 0; i < 9; i++) {
        if (cash < sacrificeThresholds[i]) return i;
    }
    return 9;
}

function primaryTempleBloonology(upgrade, sacrifice1, sacrifice2 = 0, vtsg = false) {
    let level1 = sacrificeToLevel(sacrifice1);
    let level2 = sacrificeToLevel(sacrifice2);
    let dmgMult = vtsg ? 2 : 1;
    let lines = [];
    let { glaive: glaive1, buff: buff1, blade: blade1 } = templeStats.primary[level1];
    let { glaive: glaive2, buff: buff2, blade: blade2 } = templeStats.primary[level2];

    if (level1 > 0 && level2 > 0) {
        lines.push("### Primary Sacrifice");
    } else if (level1 > 0 || level2 > 0) {
        lines.push(`### Primary Sacrifice ($${Math.max(sacrifice1, sacrifice2)} - level ${Math.max(level1, level2)}/9)`);
    }

    if (buff1 || buff2) {
        let rate = (buff1 ? buff1.rate : 1) * (buff2 ? buff2.rate : 1);
        lines.push(`*sun-blast* gets ${round(rate * 100)}%s (${round(templeStats.base[upgrade].rate * rate, 4)}s)`);
    }

    if (glaive1) lines.push(`*glaive1*- ${glaive1.damage * dmgMult}d, 50p, ${glaive1.rate}s, normal
    - can jump to a nearby target after hitting
        - 150 jump distance`);
    if (glaive2) lines.push(`*glaive2*- ${glaive2.damage * dmgMult}d, 50p, ${glaive2.rate}s, normal
    - can jump to a nearby target after hitting
        - 150 jump distance`);

    if (blade1) lines.push(`*blade1*- ${blade1.damage * dmgMult}d, ${blade1.pierce}p, ${blade1.rate}s, 8j, normal`);
    if (blade2) lines.push(`*blade2*- ${blade2.damage * dmgMult}d, ${blade2.pierce}p, ${blade2.rate}s, 8j, normal`);

    return lines;
}

function militaryTempleBloonology(upgrade, sacrifice1, sacrifice2 = 0, vtsg = false) {
    let level1 = sacrificeToLevel(sacrifice1);
    let level2 = sacrificeToLevel(sacrifice2);
    let dmgMult = vtsg ? 2 : 1;
    let lines = [];
    let { missile: missile1, buff: buff1, spectre: spectre1 } = templeStats.military[level1];
    let { missile: missile2, buff: buff2, spectre: spectre2 } = templeStats.military[level2];

    if (level1 > 0 && level2 > 0) {
        lines.push("### Military Sacrifice");
    } else if (level1 > 0 || level2 > 0) {
        lines.push(`### Military Sacrifice ($${Math.max(sacrifice1, sacrifice2)} - level ${Math.max(level1, level2)}/9)`);
    }

    if (buff1 || buff2) {
        let damage = (buff1 ? buff1.damage : 0) + (buff2 ? buff2.damage : 0);
        let projSpeed = (buff1 ? buff1.projSpeed : 1) * (buff2 ? buff2.projSpeed : 1);
        lines.push(`*sun-blast* gets +${damage}d (${(templeStats.base[upgrade].damage + damage) * dmgMult}d), ${round(projSpeed * 100)}% projectile speed`);
    }

    let damage = templeStats.base.missile.damage * dmgMult;
    let md = templeStats.base.missile.md * dmgMult;
    if (missile1) lines.push(`*missile1*- ${damage}d, +${md}md (${damage + md}), 50p, ${missile1.rate}s, normal
    - ∞r
    - only targets blimps
    - moderate seeking (43 turn radius)`);
    if (missile2) lines.push(`*missile2*- ${damage}d, +${md}md (${damage + md}), 50p, ${missile2.rate}s, normal
    - ∞r
    - moderate seeking (55.7 turn radius)`);

    if (spectre1) lines.push(`spawns ${spectre1.planes > 1 ? `${spectre1.planes} *mini-spectre1* subtowers` : "*mini-spectre1* subtower"}
    - ∞r
    - *barrage1*- 0.15s alternates between *dart1* and *bomb1* attacks
        - *dart1*- ${spectre1.dart.damage * dmgMult}d, 50p, sharp
        - *bomb1*- ${spectre1.bomb.damage * dmgMult}d, ${spectre1.bomb.pierce}p, explosive`);
    if (spectre2) lines.push(`spawns ${spectre2.planes > 1 ? `${spectre2.planes} *mini-spectre2* subtowers` : "*mini-spectre2* subtower"}
    - ∞r
    - *barrage2*- 0.15s alternates between *dart2* and *bomb2* attacks
        - *dart2*- ${spectre2.dart.damage * dmgMult}d, 50p, sharp
        - *bomb2*- ${spectre2.bomb.damage * dmgMult}d, ${spectre2.bomb.pierce}p, explosive`);

    return lines;
}

function magicTempleBloonology(upgrade, sacrifice1, sacrifice2 = 0, vtsg = false) {
    let level1 = sacrificeToLevel(sacrifice1);
    let level2 = sacrificeToLevel(sacrifice2);
    let dmgMult = vtsg ? 2 : 1;
    let avatarDamage = templeStats.base.avatar.damage + (vtsg ? 25 : 0);
    let lines = [];
    let { bolt: bolt1, buff: buff1, push: push1 } = templeStats.magic[level1];
    let { bolt: bolt2, buff: buff2, push: push2 } = templeStats.magic[level2];

    if (level1 > 0 && level2 > 0) {
        lines.push("### Magic Sacrifice");
    } else if (level1 > 0 || level2 > 0) {
        lines.push(`### Magic Sacrifice ($${Math.max(sacrifice1, sacrifice2)} - level ${Math.max(level1, level2)}/9)`);
    }

    if (buff1 || buff2) {
        let pierce = (buff1 ? buff1.pierce : 0) + (buff2 ? buff2.pierce : 0);
        let projSize = (buff1 ? buff1.projSize : 1) * (buff2 ? buff2.projSize : 1);
        let wind = (buff1 && buff1.wind ? buff1.wind : 0) + (buff2 && buff2.wind ? buff2.wind : 0);
        lines.push(`*sun-blast* gets +${pierce}p (${templeStats.base[upgrade].pierce + pierce}p), ${round(projSize * 100)}% projectile size`);
        if (wind > 0) lines.push(`*sun-blast* gets ${round(wind * 100)}% chance to blow back non-blimps 33-d units
    - d is the distance of the bloon from the entrance`);
    }

    if (bolt1) lines.push(`*bolt-spray1*- ${bolt1.projectiles} *bolt1* attacks
    - *bolt1*- ${bolt1.damage * dmgMult}d, 15p, ${bolt1.rate}s, normal
        - moderate seeking (37 turn radius)`);
    if (bolt2) lines.push(`*bolt-spray2*- ${bolt2.projectiles} *bolt2* attacks
    - *bolt2*- ${bolt2.damage * dmgMult}d, 15p, ${bolt2.rate}s, normal
        - moderate seeking (37 turn radius)`);

    if (push1) lines.push(`*wind-blast1*- 500p, 5s, normal
    - 65 blast radius
    - blows back ${push1.target} 33-d units
        - d is the distance of the bloon from the entrance
    - removes glue and frozen properties`);
    if (push2) lines.push(`*wind-blast2*- 500p, 5s, normal
    - 65 blast radius
    - blows back ${push2.target} 33-d units
        - d is the distance of the bloon from the entrance
    - removes glue and frozen properties`);

    if (level1 === 9) lines.push(`*avatar1*- 30s, spawns a *mini-avatar* subtower that lasts 65s
    - cannot be rate-buffed`);
    if (level2 === 9) lines.push(`*avatar2*- 30s, spawns a *mini-avatar* subtower that lasts 65s
    - cannot be rate-buffed`);
    if (level1 === 9 || level2 === 9) lines.push(`    - *mini-avatar*
        - 50r
        - *mini-blast*- ${avatarDamage}d, 6p, 0.03s, 3j, plasma`);

    return lines;
}

function supportTempleBloonology(upgrade, sacrifice1, sacrifice2 = 0) {
    let level1 = sacrificeToLevel(sacrifice1);
    let level2 = sacrificeToLevel(sacrifice2);
    let lines = [];
    let { eor: eor1, buff: buff1 } = templeStats.support[level1];
    let { eor: eor2, buff: buff2 } = templeStats.support[level2];

    if (level1 > 0 && level2 > 0) {
        lines.push(`### Support Sacrifice
+10r (${templeStats.base[upgrade].range + 10}r)`);
    } else if (level1 > 0 || level2 > 0) {
        lines.push(`### Support Sacrifice ($${Math.max(sacrifice1, sacrifice2)} - level ${Math.max(level1, level2)}/9)
+5r (${templeStats.base[upgrade].range + 5}r)`);
    }

    if (eor1) lines.push(`*income1*- $${eor1.income} income at the end of each round`);
    if (eor2) lines.push(`*income2*- $${eor2.income} income at the end of each round`);

    if (buff1 || buff2) {
        let income = (buff1 && buff1.income ? buff1.income : 0) + (buff2 && buff2.income ? buff2.income : 0);
        let damage = (buff1 && buff1.damage ? buff1.damage : 0) + (buff2 && buff2.damage ? buff2.damage : 0);
        let pierce = (buff1 && buff1.pierce ? buff1.pierce : 0) + (buff2 && buff2.pierce ? buff2.pierce : 0);
        let rate = (buff1 && buff1.rate ? buff1.rate : 1) * (buff2 && buff2.rate ? buff2.rate : 1);
        let range = (buff1 && buff1.range ? buff1.range : 1) * (buff2 && buff2.range ? buff2.range : 1);

        if (income > 0) lines.push(`*income-buff*- +${round(income * 100)}% income from bloons popped in range`);
        if (buff1) lines.push(`*${buff1.discount === 0.1 ? "minor" : "major"}-discount1*- ${round(buff1.discount * 100)}% discount on all towers and upgrades up to tier 5 in range
    - stacks with *${buff1.discount === 0.1 ? "major" : "minor"}-discount* from another temple`);
        if (buff2) lines.push(`*${buff2.discount === 0.1 ? "minor" : "major"}-discount2*- ${round(buff2.discount * 100)}% discount on all towers and upgrades up to tier 5 in range`);
        if (buff1 && buff2) lines.push(`    - total ${round((buff1.discount + buff2.discount) * 100)}% discount`);

        let line = "*support-buff*- all towers in range get ";
        if (damage > 0) line += `+${damage}d, `;
        if (pierce > 0) line += `+${pierce}p, `;
        if (rate < 1) line += `${round(rate * 100)}%s, `;
        if (range > 1) line += `+${round(range * 100)}%r, `;
        lines.push(line.substring(0, line.length - 2));
        lines.push("    - affects *mini-avatar*s in range and *mini-spectre*s");
    }

    return lines;
}

function templeBloonology(upgrade, primary1, military1, magic1, support1, primary2 = 0, military2 = 0, magic2 = 0, support2 = 0, vtsg = false) {
    return cleanBloonology([
        ...primaryTempleBloonology(upgrade, primary1, primary2, vtsg),
        ...militaryTempleBloonology(upgrade, military1, military2, vtsg),
        ...magicTempleBloonology(upgrade, magic1, magic2, vtsg),
        ...supportTempleBloonology(upgrade, support1, support2)
    ].join("\n"));
}

async function corvusBloonology(level) {
    const spellPages = {
        "spear": 0,
        "aggression": 0,
        "malevolence": 0,
        "storm": 0,
        "repel": 1,
        "echo": 1,
        "haste": 1,
        "trample": 1,
        "frostbound": 2,
        "ember": 2,
        "ancestral might": 2,
        "overload": 2,
        "nourishment": 3,
        "soul barrier": 3,
        "vision": 3,
        "recovery": 3
    };
    let descs = await heroNameToBloonologyList("corvus");
    let desc = descs[level - 1];
    let [header, spellsDesc, footer] = desc.split("\n\n");
    let spells = spellsDesc.split(/^\*\*(.*)\*\*\s*$/m).map(x => x.trim()).slice(1);
    let pages = [
        [],
        [],
        [],
        []
    ];
    for (let i = 0; i < spells.length; i += 2) {
        pages[spellPages[spells[i].toLowerCase()]].push(`**${spells[i]}**\n${spells[i + 1]}`);
    }
    return [header, pages.filter(x => x.length > 0).map(x => x.join("\n")), footer];
}

module.exports = {
    TOWER_NAME_TO_BLOONOLOGY_LINK,
    TOWER_NAME_TO_BLOONOLOGY_LINK_B2,
    HERO_NAME_TO_BLOONOLOGY_LINK,
    towerNameToBloonologyLink,
    towerLatestVersion,
    heroLatestVersion,
    towerUpgradeToFullBloonology,
    towerUpgradesToFullBloonology,
    towerUpgradeToMainBloonology,
    towerUpgradesToMainBloonology,
    towerUpgradeToTierChangeBloonology,
    towerUpgradesToTierChangeBloonology,
    towerUpgradeToCrosspathChangeBloonology,
    towerUpgradesToCrosspathChangeBloonology,
    towerUpgradeToBaseChangeBloonology,
    towerUpgradesToBaseChangeBloonology,
    heroNameToBloonologyList,
    getRelicBloonology,
    dartParagonBloonology,
    boomerParagonBloonology,
    ninjaParagonBloonology,
    buccParagonBloonology,
    engiParagonBloonology,
    aceParagonBloonology,
    wizParagonBloonology,
    subParagonBloonology,
    tackParagonBloonology,
    spacParagonBloonology,
    templeBloonology,
    corvusBloonology
};