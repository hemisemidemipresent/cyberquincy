const axios = require('axios');
const { isValidUpgradeSet } = require('./towers');

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
    druid_monkey: 'https://pastebin.com/raw/4egsjcpa',
    banana_farm: 'https://pastebin.com/raw/Es0nVqt1',
    spike_factory: 'https://pastebin.com/raw/tTHZWiSi',
    monkey_village: 'https://pastebin.com/raw/e2QHaQSD',
    engineer: 'https://pastebin.com/raw/rTHT0L21',
    beast_handler: 'https://pastebin.com/raw/B3VF2rRq'
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
    druid_monkey: 'https://pastebin.com/raw/KNXR24g2',
    banana_farm: 'https://pastebin.com/raw/H2UEFh0E',
    spike_factory: 'https://pastebin.com/raw/pAy8v9Ge',
    monkey_village: 'https://pastebin.com/raw/h28ruxxd',
    engineer: 'https://pastebin.com/raw/NPGKFNEv'
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
    return body.split(/^\s*(?:level\s(?:1?[0-9]|20)|all\slevels)\s*$/im).filter(x => x.length).map(cleanBloonology);
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
        relicMap[relicName] = relicDescription;
    }
    return relicMap;
}

module.exports = {
    TOWER_NAME_TO_BLOONOLOGY_LINK,
    TOWER_NAME_TO_BLOONOLOGY_LINK_B2,
    HERO_NAME_TO_BLOONOLOGY_LINK,
    towerNameToBloonologyLink,
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
    getRelicBloonology
};