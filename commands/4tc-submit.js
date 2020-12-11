const fs = require('fs');
const atob = require('atob');
const request = require('request');
const zlib = require('zlib');

module.exports = {
    name: 'submit4tc',
    rawArgs: true,
    casedArgs: true,
    async execute(message, args) {
        if (args.length < 2) {
            return message.channel.send(
                'Use format: q!submit4tc <code> <name>'
            );
        }

        // Handles names that contain spaces since those names will be multiple different args
        let name = '';
        for (let i = 1; i < args.length; ++i) {
            name += args[i] + ' ';
        }

        const submission = {
            code: args[0].toUpperCase(),
            name: name.slice(0, name.length - 1),
        };

        try {
            await submit(submission); // Towers and combos added to submission here
            submission.towers = convert_names_nk_to_4tc(submission.towers);
            const embed = new Discord.MessageEmbed()
                .setTitle('4tc Submission')
                .addField('Towers: ', JSON.stringify(submission.towers))
                .addField('Combos Removed: ', submission.combos);
            return message.channel.send(embed);
        } catch (error) {
            return message.channel.send(error);
        }
    },
};

function string_to_base64_buffer(str) {
    const binary_string = atob(str);
    const length = binary_string.length;
    const base64Bytes = new Uint8Array(length);
    for (let i = 0; i < length; ++i) {
        base64Bytes[i] = binary_string.charCodeAt(i);
    }
    return base64Bytes.buffer;
}

function get_challenge_data(challengeCode) {
    // This url contains challenge data, it is encrypted with zlib than base64
    const url =
        'https://static-api.nkstatic.com/appdocs/11/es/challenges/' +
        challengeCode;

    return new Promise((resolve, reject) => {
        request(url, (useless, response, body) => {
            if (response.statusCode == 200) {
                const base64Buffer = string_to_base64_buffer(body);
                zlib.inflate(base64Buffer, (error, zlibBuffer) => {
                    if (error) {
                        reject('Invalid Code');
                    }
                    const challengeData = JSON.parse(
                        zlibBuffer.toString('utf8')
                    );
                    resolve(challengeData);
                });
            } else {
                reject('Invalid Code');
            }
        });
    });
}

function get_towers(challengeData) {
    const towers = [];
    let towerCount = 0;
    for (let i = 0; i < challengeData.towers.length; ++i) {
        if (challengeData.towers[i].max != 0) {
            towers[towerCount] = challengeData.towers[i].tower;
            towerCount += 1;
        }
    }
    return towers;
}

// Returns approximate verison, works by checking for challenge data changes over time
function get_version(cD) {
    if (cD.bloonModifiers.allCamo === undefined) {
        return 9;
    } // 9.0 - 10.2
    if (cD.numberOfPlayers === undefined) {
        return 11;
    } // 11.0 - 11.2
    if (cD.replaces === undefined) {
        return 12;
    } // 12.0
    if (cD.towers[9].tower != 'Adora') {
        return 12.1;
    } // 12.1 - 13.1
    if (cD.towers[0].path1NumBlockedTiers === undefined) {
        return 14;
    } // 14.0 - 15.2
    if (cD.towers[10].tower != 'AdmiralBrickell') {
        return 16;
    } // 16.0 - 17.1
    if (cD.displayIncludedPowers === undefined) {
        return 18;
    } // 18.0 - 18.1
    if (cD.towers[11].tower != 'Etienne') {
        return 19;
    } // 19.0 - 19.2
    if (cD.uniqueDCId === undefined) {
        return 20;
    } // 20.0 - 20.1
    if (cD.roundSets === undefined) {
        return 21;
    } // 21.0 - 21.1
    return 22; // 22.0 - current
}

// Version -1 represents any version, version needed as sniper starts past 20.0 and obyn started before 11.0
// Technically bomb can make it to 9, but it is well known that it can't start on it's own
function can_beat_6(towers, version) {
    const startTowers = [
        'Quincy',
        'Ezili',
        'DartMonkey',
        'BoomerangMonkey',
        'TackShooter',
        'IceMonkey',
        'SniperMonkey',
        'MonkeySub',
        'MonkeyBuccaneer',
        'WizardMonkey',
        'NinjaMonkey',
        'Alchemist',
        'Druid',
        'EngineerMonkey',
    ];

    for (let i = 0; i < startTowers.length; ++i) {
        if (towers.includes(startTowers[i])) {
            return true;
        }
    }

    if ((version > 20 || version == -1) && towers.includes('Sniper')) {
        return true;
    }

    if (towers.includes('BombShooter')) {
        if (towers.includes('GlueGunner') || towers.includes('SniperMonkey')) {
            return true;
        }
    }

    if ((version < 11 || version == -1) && towers.includes('ObynGreenfoot')) {
        return true;
    }
    return false;
}

function can_beat_24(towers) {
    const camoTowers = [
        'Quincy',
        'Gwendolin',
        'ObynGreenfoot',
        'Etienne',
        'Ezili',
        'DartMonkey',
        'SniperMonkey',
        'MonkeySub',
        'MonkeyBuccaneer',
        'MonkeyAce',
        'HeliPilot',
        'MortarMonkey',
        'DartlingGunner',
        'WizardMonkey',
        'NinjaMonkey',
        'SpikeFactory',
        'EngineerMonkey',
    ];

    for (let i = 0; i < camoTowers.length; ++i) {
        if (towers.includes(camoTowers[i])) {
            return true;
        }
    }

    // Village is expensive so some ice starts and all bomb + glue starts are mathematically impossible, since the money required to beat 20 or 22 makes affording 020 village impossible
    if (towers.includes('MonkeyVillage')) {
        if (
            towers.includes('BoomerangMonkey') ||
            towers.includes('TackShooter') ||
            towers.includes('Alchemist') ||
            towers.includes('Druid')
        ) {
            return true;
        }
        if (
            towers.includes('IceMonkey') &&
            (towers.includes('StrikerJones') || towers.includes('Bomb'))
        ) {
            return true;
        }
    }
    return false;
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

// All combos can mathematically beat 20, 22, 28 and 45, since 2 towers are required for a combo to be submitted
// Mathematically possible test is used to parse out some hacked/bugged 4tc submissions
function mathematically_possible(towers, version) {
    if (!can_beat_6(towers, version) || !can_beat_24(towers)) {
        return false;
    }

    // Check if combo can beat 25
    if (is_subset(towers, ['Ezili', 'Benjamin', 'WizardMonkey', 'Village'])) {
        return false;
    }

    // Check if combo can beat 90
    if (is_subset(towers, ['Quincy', 'BombShooter'])) {
        return false;
    }
    return true;
}

// Checks if the challenge is a chimps game, and contains 2-4 unique towers
function valid_settings(cD, version) {
    // Check for more than 1 of a tower
    let towerCount = 0;
    for (let i = 0; i < cD.towers.length; ++i) {
        let max = cD.towers[i].max;
        if (max) {
            if (max != 1) {
                return false;
            }
            towerCount += 1;
        }
    }

    if (towerCount < 2 || towerCount > 4) {
        return false;
    }

    // Check for selectedHero, can't know what hero was used
    if (cD.towers[0].max) {
        return false;
    }

    // Check for misc settings, mk, powers and continues do nothing when making a chimps challenge
    const bloonSpeed = cD.bloonModifiers.speedMultiplier;
    const moabSpeed = cD.bloonModifiers.moabSpeedMultiplier;
    const bloonHealth = cD.bloonModifiers.healthMultipliers.bloons;
    const moabHealth = cD.bloonModifiers.healthMultipliers.moabs;
    if (
        cD.difficulty != 'Hard' ||
        cD.mode != 'Clicks' ||
        !cD.disableSelling ||
        bloonSpeed != 1 ||
        moabSpeed != 1 ||
        bloonHealth != 1 ||
        moabHealth != 1
    ) {
        return false;
    }

    // Check for starting conditions, -1 represents default
    const lives = cD.startRules.maxLives;
    const cash = cD.startRules.cash;
    const start = cD.startRules.round;
    const end = cD.startRules.endRound;
    if (
        !(lives == 1 || lives == -1) ||
        !(cash == 650 || cash == -1) ||
        !(start == 6 || start == -1) ||
        !(end >= 100 || end == -1)
    ) {
        return false;
    }

    if (version > 22 && cD.bloonModifiers.regrowRateMultiplier != 1) {
        return false;
    }

    // Idk what replaces is but it always seems to be null anyways
    if (version > 12 && cD.replaces !== null) {
        return false;
    }

    // Round Sets shouldn't be possible in a normal challenge but it could parse out a hacked challenge
    if (version > 20 && cD.roundSets !== null) {
        return false;
    }
    return true;
}

// Returns towers if the code is valid, 4tc is not valid if it is already submitted either, this check is done seperately to remove duplicated code
async function check_4tc_validity(challengeCode) {
    try {
        // Parse out obviously invalid codes, before trying to request data
        if (challengeCode.length == 7 || !/[^A-Z]/.test(challengeCode)) {
            const challengeData = await get_challenge_data(challengeCode);
            const towers = get_towers(challengeData);
            const version = get_version(challengeData);

            if (valid_settings(challengeData, version)) {
                if (mathematically_possible(towers, version)) {
                    return towers;
                } else {
                    throw 'not mathematically possible';
                }
            } else {
                throw 'invalid settings';
            }
        } else {
            throw 'code is of an incorrect format';
        }
    } catch (error) {
        throw error;
    }
}

// Adds combos property to submission
function remove_combos(submission) {
    const remainingCombos = require('./4tc-remaining_combos.json');

    submission.combos = 0;
    for (let i = remainingCombos.length - 1; i > 0; --i) {
        if (is_subset(submission.towers, remainingCombos[i])) {
            remainingCombos.splice(i, 1);
            submission.combos += 1;
        }
    }

    if (!submission.combos) {
        throw 'already submitted';
    }

    fs.writeFileSync(
        remainingCombosFilePath,
        JSON.stringify(remainingCombos, null, 4),
        (error, data) => {
            if (error) {
                throw error;
            }
        }
    );
}

function update_leaderboard(submission) {
    const leaderboard = require('./4tc-leaderboard.json');

    let existingName = false;
    for (let i = 0; i < leaderboard.length; ++i) {
        if (leaderboard[i][0] == submission.name) {
            leaderboard[i][1] += submission.combos;
            existingName = true;
            break;
        }
    }

    if (!existingName) {
        leaderboard.push([submission.name, submission.combos]);
    }

    // Sort leaderboard in ascending order of combos completed
    leaderboard.sort((a, b) => {
        return b[1] - a[1];
    });

    fs.writeFileSync(
        leaderboardFilePath,
        JSON.stringify(leaderboard, null, 4),
        (error, data) => {
            if (error) {
                throw error;
            }
        }
    );
}

// Updates submission to have towers and combos removed, co-ordiantes all the error checking and file io for submitting
async function submit(submission) {
    try {
        submission.towers = await check_4tc_validity(submission.code);
        remove_combos(submission); // adds combos
        update_leaderboard(submission);
    } catch (error) {
        throw error;
    }

    const validatedCombos = require('./4tc-submitted_combos.json');

    // Remove combos from submission then add it to the submitted_combos.json
    validatedCombos.push({
        name: submission.name,
        code: submission.code,
        towers: submission.towers,
    });
    fs.writeFileSync(
        submittedCombosFilePath,
        JSON.stringify(validatedCombos, null, 4),
        (error, data) => {
            if (error) {
                throw error;
            }
        }
    );
}

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
