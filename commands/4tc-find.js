const remainingCombos = require('./4tc-remaining_combos.json');
const hastebin = require('hastebin-gen');

module.exports = {
    name: 'find4tc',
    rawArgs: true,
    casedArgs: true,
    async execute(message, args) {
        if (args.length > 4) {
            return message.channel.send('Too many towers');
        }

        args = convert_names_4tc_to_nk(args);

        const validTowers = [
            'Quincy',
            'Gwendolin',
            'StrikerJones',
            'ObynGreenfoot',
            'CaptainChurchill',
            'Benjamin',
            'Ezili',
            'PatFusty',
            'Adora',
            'AdmiralBrickell',
            'Etienne',
            'DartMonkey',
            'BoomerangMonkey',
            'BombShooter',
            'TackShooter',
            'IceMonkey',
            'GlueGunner',
            'SniperMonkey',
            'MonkeySub',
            'MonkeyAce',
            'HeliPilot',
            'MortarMonkey',
            'DartlingGunner',
            'WizardMonkey',
            'SuperMonkey',
            'NinjaMonkey',
            'Alchemist',
            'Druid',
            'SpikeFactory',
            'MonkeyVillage',
            'EngineerMonkey',
        ];
        if (!is_subset(args, validTowers)) {
            return message.channel.send('There is an invalid tower');
        }

        const response = find4tc(args);
        message.channel.send('Combos found: ' + response.combos);

        if (response.combos == 0) {
            return;
        }

        if (response.found4tcs.length < 2000) {
            return message.channel.send(response.found4tcs);
        }

        message.channel.send(
            'Message too long to display, creating a hastebin link'
        );
        const hastebinLink = await hastebin(response.found4tcs, {
            extension: 'txt',
        });
        return message.channel.send(hastebinLink);
    },
};

// Returns towers consverted to 4tc names
function convert_names_nk_to_4tc(towers) {
    const towerNamesDict = {
        namesNK: [
            'Quincy',
            'Gwendolin',
            'StrikerJones',
            'ObynGreenfoot',
            'CaptainChurchill',
            'Benjamin',
            'Ezili',
            'PatFusty',
            'Adora',
            'AdmiralBrickell',
            'Etienne',
            'DartMonkey',
            'BoomerangMonkey',
            'BombShooter',
            'TackShooter',
            'IceMonkey',
            'GlueGunner',
            'SniperMonkey',
            'MonkeySub',
            'MonkeyBuccaneer',
            'MonkeyAce',
            'HeliPilot',
            'MortarMonkey',
            'DartlingGunner',
            'WizardMonkey',
            'SuperMonkey',
            'NinjaMonkey',
            'Alchemist',
            'Druid',
            'SpikeFactory',
            'MonkeyVillage',
            'EngineerMonkey',
        ],
        names4tc: [
            'Quincy',
            'Gwen',
            'Striker',
            'Obyn',
            'Church',
            'Ben',
            'Ezili',
            'Pat',
            'Adora',
            'Brick',
            'Etienne',
            'Dart',
            'Boomer',
            'Bomb',
            'Tack',
            'Ice',
            'Glue',
            'Sniper',
            'Sub',
            'Bucc',
            'Ace',
            'Heli',
            'Mortar',
            'Dartling',
            'Wizard',
            'Super',
            'Ninja',
            'Alch',
            'Druid',
            'Spac',
            'Village',
            'Engi',
        ],
    };

    const temp = [];
    for (let i = 0; i < towers.length; ++i) {
        for (let tower = 0; tower < towerNamesDict.namesNK.length; ++tower) {
            if (towers[i] == towerNamesDict.namesNK[tower]) {
                temp[i] = towerNamesDict.names4tc[tower];
            }
        }
    }
    return temp;
}

// Returns towers consverted to nk names
function convert_names_4tc_to_nk(towers) {
    const towerNamesDict = {
        namesNK: [
            'Quincy',
            'Gwendolin',
            'StrikerJones',
            'ObynGreenfoot',
            'CaptainChurchill',
            'Benjamin',
            'Ezili',
            'PatFusty',
            'Adora',
            'AdmiralBrickell',
            'Etienne',
            'DartMonkey',
            'BoomerangMonkey',
            'BombShooter',
            'TackShooter',
            'IceMonkey',
            'GlueGunner',
            'SniperMonkey',
            'MonkeySub',
            'MonkeyBuccaneer',
            'MonkeyAce',
            'HeliPilot',
            'MortarMonkey',
            'DartlingGunner',
            'WizardMonkey',
            'SuperMonkey',
            'NinjaMonkey',
            'Alchemist',
            'Druid',
            'SpikeFactory',
            'MonkeyVillage',
            'EngineerMonkey',
        ],
        names4tc: [
            'Quincy',
            'Gwen',
            'Striker',
            'Obyn',
            'Church',
            'Ben',
            'Ezili',
            'Pat',
            'Adora',
            'Brick',
            'Etienne',
            'Dart',
            'Boomer',
            'Bomb',
            'Tack',
            'Ice',
            'Glue',
            'Sniper',
            'Sub',
            'Bucc',
            'Ace',
            'Heli',
            'Mortar',
            'Dartling',
            'Wizard',
            'Super',
            'Ninja',
            'Alch',
            'Druid',
            'Spac',
            'Village',
            'Engi',
        ],
    };

    const temp = [];
    for (let i = 0; i < towers.length; ++i) {
        for (let tower = 0; tower < towerNamesDict.names4tc.length; ++tower) {
            if (towers[i] == towerNamesDict.names4tc[tower]) {
                temp[i] = towerNamesDict.namesNK[tower];
            }
        }
    }
    return temp;
}

// All elements of a are in b
function is_subset(a, b) {
    let containsElement;
    for (let aIndex = 0; aIndex < a.length; ++aIndex) {
        containsElement = false;
        for (let bIndex = 0; bIndex < b.length; ++bIndex) {
            if (a[aIndex] === b[bIndex]) {
                containsElement = true;
                break;
            }
        }

        if (!containsElement) {
            return false;
        }
    }
    return true;
}

// Returns string of subsets of towers in remainingCombos
function find4tc(towers) {
    let found4tcs = '';
    let combos = 0;
    for (let i = 0; i < remainingCombos.length; ++i) {
        if (is_subset(towers, remainingCombos[i])) {
            const temp = convert_names_nk_to_4tc(remainingCombos[i]);
            found4tcs +=
                temp[0] +
                ', ' +
                temp[1] +
                ', ' +
                temp[2] +
                ', ' +
                temp[3] +
                '\n';
            combos += 1;
        }
    }

    const returnObject = {
        combos: combos,
        found4tcs: found4tcs,
    };
    return returnObject;
}
