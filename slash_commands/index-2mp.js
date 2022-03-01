const GoogleSheetsHelper = require('../helpers/google-sheets.js');

const gHelper = require('../helpers/general.js');

const { orange, paleblue } = require('../jsons/colours.json');
const { MessageActionRow, MessageButton, BaseGuildEmojiManager } = require('discord.js');

const COLS = {
    NUMBER: 'B',
    TOWER: 'C',
    UPGRADES: 'E',
    OG_MAP: 'F',
    VERSION: 'H',
    DATE: 'I',
    PERSON: 'J',
    LINK: 'L',
};

const TOWER_COLS = {
    TOWER: 'O',
    BASE: 'P',
    LAST: 'Y',
};

HEAVY_CHECK_MARK = String.fromCharCode(10004) + String.fromCharCode(65039);
WHITE_HEAVY_CHECK_MARK = String.fromCharCode(9989);
RED_X = String.fromCharCode(10060);

const { 
    SlashCommandBuilder, 
    SlashCommandStringOption,
} = require('@discordjs/builders');

const Towers = require('../helpers/towers');

let entityOption = 
    new SlashCommandStringOption()
        .setName('entity')
        .setDescription('Hero/Tower/Upgrade')
        .setRequired(false);

let mapOption = 
    new SlashCommandStringOption()
        .setName('map')
        .setDescription('Map/Difficulty')
        .setRequired(false);

let userOption =
    new SlashCommandStringOption()
        .setName('person')
        .setDescription('Person')
        .setRequired(false);

builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')
    .addStringOption(entityOption)
    .addStringOption(mapOption)
    .addStringOption(userOption)

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const TowerParser = require('../parser/tower-parser.js')
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const EmptyParser = require('../parser/empty-parser.js');
const Parsed = require('../parser/parsed.js');
const UserCommandError = require('../exceptions/user-command-error.js');

function validateInput(interaction) {
    parsedEntity = parseEntity(interaction)
    if (parsedEntity?.hasErrors())
        return `Entity ${entity} didn't match tower/upgrade/hero, including aliases`

    parsedMap = parseMap(interaction)
    if (parsedMap?.hasErrors())
        return `Map/Difficulty ${map} didn't match, including aliases`
}

function parseEntity(interaction) {
    entityParser = new OrParser(
        new TowerParser(),
        new TowerUpgradeParser(),
        new HeroParser(),
        new EmptyParser(),
    )
    entity = interaction.options.getString('entity')
    if (entity) {
        canonicalEntity = Aliases.getCanonicalForm(entity)
        if (canonicalEntity) {
            return CommandParser.parse([canonicalEntity], entityParser)
        } else {
            parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return null;
}

function parseMap(interaction) {
    mapParser = new OrParser(
        new MapParser(),
        new MapDifficultyParser(),
    )
    map = interaction.options.getString('map')
    if (map) {
        canonicalMap = Aliases.getCanonicalForm(map)
        if (canonicalMap) {
            return CommandParser.parse([canonicalMap], mapParser)
        } else {
            parsed = new Parsed()
            parsed.addError('Canonical not found')
            return parsed;
        }
    } else return null;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({ 
            content: validationFailure, 
            ephemeral: true
        });
    }

    parsedEntity = parseEntity(interaction)
    parsedMap = parseMap(interaction)
    person = interaction.options.getString('person')

    if (parsedEntity?.tower && !parsedMap && !person) {
        const challengeEmbed = await display2MPTowerStatistics(parsedEntity.tower)
        return interaction.reply({
            embeds: [challengeEmbed],
        })
    }

    // Simple displays
    if ((parsedEntity?.tower_upgrade || parsedEntity?.hero) && !person && !parsedMap?.map_difficulty) {
        let challengeEmbed;
        entity = parsedEntity?.hero || Towers.towerUpgradeToIndexNormalForm(parsedEntity?.tower_upgrade)

        if (parsedMap?.map) {
            try {
                challengeEmbed = await display2MPAlt(entity, parsedMap.map)
            } catch(e) {
                challengeEmbed = err(e)
            }
        } else {
            try {
                challengeEmbed = await display2MPOG(entity)
            } catch(e) {
                challengeEmbed = err(e)
            }
        }

        return interaction.reply({
            embeds: [challengeEmbed],
        })
    }
}

function err(e) {
    // TODO: The errors being caught here aren't UserCommandErrors, more like ComboErrors
    if (e instanceof UserCommandError) {
        return new Discord.MessageEmbed()
            .setTitle(e.message)
            .setColor(paleblue);
    } else {
        throw e;
    }
}

// Displays a 2MPC completion on the specified map
async function display2MPAlt(tower, map) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    mapFormatted = gHelper.toTitleCase(map.split('_').join(' '));
    towerFormatted = gHelper.toTitleCase(tower.split('_').join(' '));

    entryRow = await rowFromTower(tower);

    // Load the map cell, the only cell that likely matters
    await sheet.loadCells(
        `${COLS.OG_MAP}${entryRow}:${COLS.OG_MAP}${entryRow}`
    );

    ogMapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    ogMap = ogMapCell.value;

    // Display OG map as if map weren't in the query
    if (mapFormatted == ogMap) {
        return display2MPOG(message, tower);
    }

    notes = parseMapNotes(ogMapCell.note);

    // Tower has been completed on queried map if the map abbreviation can be found in the notes
    if ((altCompletion = notes[Aliases.mapToIndexAbbreviation(map)])) {
        // Embed and send the message
        let challengeEmbed = new Discord.MessageEmbed()
            .setTitle(`${towerFormatted} 2MPC Combo on ${mapFormatted}`)
            .setColor(paleblue)
            .addField('Person', altCompletion.PERSON, true)
            .addField('Link', altCompletion.LINK, true);
        
        return challengeEmbed;
    } else {
        throw new UserCommandError(
            `Tower \`${towerFormatted}\` has not yet been completed on \`${mapFormatted}\``
        );
    }
}

// Displays the OG 2MPC completion
async function display2MPOG(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await rowFromTower(tower);

    // Load the row where the map was found
    await sheet.loadCells(`${COLS.NUMBER}${entryRow}:${COLS.LINK}${entryRow}`);

    // Assign each value to be discord-embedded in a simple default way
    values = {};
    for (key in COLS) {
        values[key] = sheet.getCellByA1(`${COLS[key]}${entryRow}`).value;
    }

    // Special formatting for date (get formattedValue instead)
    dateCell = sheet.getCellByA1(`${COLS.DATE}${entryRow}`);
    values.DATE = dateCell.formattedValue;

    // Special handling for link (use hyperlink to cleverly embed in discord)
    linkCell = sheet.getCellByA1(`${COLS.LINK}${entryRow}`);
    values.LINK = `[${linkCell.value}](${linkCell.hyperlink})`;

    // Embed and send the message
    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`${values.TOWER} 2MPC Combo`)
        .setColor(paleblue);

    for (field in values) {
        challengeEmbed.addField(
            gHelper.toTitleCase(field.replace('_', ' ')),
            values[field],
            true
        );
    }

    challengeEmbed.addField('OG?', 'OG', true);

    mapCell = sheet.getCellByA1(`${COLS.OG_MAP}${entryRow}`);
    altMaps = Object.keys(parseMapNotes(mapCell.note));
    ogMap = Aliases.mapToIndexAbbreviation(
        Aliases.toAliasNormalForm(values.OG_MAP)
    );

    mapGroups = [
        Aliases.beginnerMaps(),
        Aliases.intermediateMaps(),
        Aliases.advancedMaps(),
        Aliases.expertMaps(),
    ];
    if (Towers.isWaterTowerUpgrade(tower)) {
        mapGroups = mapGroups.map((aliases) =>
            aliases.filter((map) => Aliases.allWaterMaps().includes(map))
        );
    }
    mapGroups = mapGroups.map((aliases) =>
        aliases.map((alias) => Aliases.mapToIndexAbbreviation(alias))
    );

    altMapGroups = mapGroups.map((mapGroup) =>
        mapGroup.filter((map) => altMaps.includes(map))
    );
    unCompletedAltMapGroups = mapGroups.map((mapGroup) =>
        mapGroup.filter((map) => !altMaps.concat(ogMap).includes(map))
    );

    wordAllIncluded = false;

    displayedMapGroups = gHelper.range(0, altMapGroups.length - 1).map((i) => {
        mapDifficulty = ['BEG', 'INT', 'ADV', 'EXP'][i];
        waterTowerAsterisk = Towers.isWaterTowerUpgrade(tower) ? '*' : '';
        if (unCompletedAltMapGroups[i] == 0) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk}`;
        } else if (unCompletedAltMapGroups[i].length < 3) {
            wordAllIncluded = true;
            return `All ${mapDifficulty}${waterTowerAsterisk} - {${unCompletedAltMapGroups[
                i
            ].join(', ')}}`;
        } else if (altMapGroups[i].length == 0) {
            return '';
        } else {
            return `{${altMapGroups[i].join(', ')}}`;
        }
    });

    if (altMapGroups.some((group) => group.length > 0)) {
        altMapsString = '';
        altMapsString += `\n${displayedMapGroups[0]}`;
        altMapsString += `\n${displayedMapGroups[1]}`;
        altMapsString += `\n${displayedMapGroups[2]}`;
        altMapsString += `\n${displayedMapGroups[3]}`;
        challengeEmbed.addField('**Alt Maps**', altMapsString);
    } else {
        challengeEmbed.addField('**Alt Maps**', 'None');
    }

    if (Towers.isWaterTowerUpgrade(tower) && wordAllIncluded) {
        challengeEmbed.setFooter('*with water');
    }

    return challengeEmbed;
}

// Gets the row of tower completion stats for the given tower
async function rowFromTower(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    [rowBegin, rowEnd] = await rowBoundaries();

    // Load the column containing the different maps
    await sheet.loadCells(`${COLS.TOWER}${rowBegin}:${COLS.TOWER}${rowEnd}`); // loads all possible cells with tower

    // The row where the queried map is found
    let entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = rowBegin; row <= rowEnd; row++) {
        let towerCandidate = sheet.getCellByA1(`${COLS.TOWER}${row}`).value;

        if (!towerCandidate) continue;

        // input is "in_the_loop" but needs to be compared to "In The Loop"
        if (
            Aliases.toIndexNormalForm(tower) ===
            gHelper.toTitleCase(towerCandidate)
        ) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(
                tower
            )}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

async function rowBoundaries() {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');
    await sheet.loadCells(`${COLS.NUMBER}1:${COLS.NUMBER}${sheet.rowCount}`);

    startRow = null;
    endRow = null;

    for (let row = 1; row <= sheet.rowCount; row++) {
        numberCandidate = sheet.getCellByA1(`${COLS.NUMBER}${row}`).value;

        // If startRow has been found, find the first occurence of a blank cell
        if (startRow && !numberCandidate) {
            endRow = row - 1;
            break;
        } else if (
            numberCandidate &&
            numberCandidate.replace(/ /g, '') === '1st'
        ) {
            startRow = row;
        }
    }

    if (!startRow) {
        throw new DeveloperCommandError(
            `Orientation failed because \`1st\` couldn't be found in the "Number" column.`
        );
    }

    // If there wasn't a trailing blank cell, then the last cell viewed must be the end cell
    if (!endRow) endRow = sheet.rowCount;

    return [startRow, endRow];
}

// Parses the map notes by splitting on comma and colon to get the map+person+link
function parseMapNotes(notes) {
    if (!notes) return {};
    return Object.fromEntries(
        notes
            .trim()
            .split('\n')
            .map((n) => {
                let altmap, altperson, altbitly;
                [altmap, altperson, altbitly] = n
                    .split(/[,:]/)
                    .map((t) => t.replace(/ /g, ''));

                return [
                    altmap,
                    {
                        PERSON: altperson,
                        LINK: `[${altbitly}](http://${altbitly})`,
                    },
                ];
            })
    );
}

// Displays a 3x3 grid completion checkboxes/x'es for each upgrade+tier above base
// Also displays base
async function display2MPTowerStatistics(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    entryRow = await findTowerRow(tower);

    // Load the row where the map was found
    await sheet.loadCells(
        `${TOWER_COLS.TOWER}${entryRow}:${TOWER_COLS.LAST}${entryRow}`
    );

    // Check or X
    baseTowerCompletionMarking = await getCompletionMarking(entryRow, null, 2);

    const towerFormatted = Aliases.toIndexNormalForm(tower);

    let challengeEmbed = new Discord.MessageEmbed()
        .setTitle(`2MPC Completions for ${towerFormatted}`)
        .setColor(paleblue)
        .addField('\u200b', '\u200b', true) // Left column placeholder
        .addField('Base Tower', baseTowerCompletionMarking, true) // Base tower
        .addField('\u200b', '\u200b', true); // Right column placeholder

    for (var tier = 3; tier <= 5; tier++) {
        for (var path = 1; path <= 3; path++) {
            towerUpgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(
                tower,
                path,
                tier
            );
            upgradeCompletionMarking = await getCompletionMarking(
                entryRow,
                path,
                tier
            );
            challengeEmbed.addField(
                towerUpgradeName,
                upgradeCompletionMarking,
                true
            );
        }
    }

    return challengeEmbed;
}

async function findTowerRow(tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    // Load the column containing the different towers
    await sheet.loadCells(
        `${TOWER_COLS.TOWER}1:${TOWER_COLS.TOWER}${sheet.rowCount}`
    );

    entryRow = null;

    // Search for the row in all "possible" rows
    for (let row = 1; row <= sheet.rowCount; row++) {
        let towerCandidate = sheet.getCellByA1(
            `${TOWER_COLS.TOWER}${row}`
        ).value;

        if (!towerCandidate) continue;

        if (Towers.towerUpgradeToIndexNormalForm(tower) == towerCandidate) {
            entryRow = row;
            break;
        }
    }

    if (!entryRow) {
        throw new UserCommandError(
            `Tower \`${Aliases.toIndexNormalForm(
                tower
            )}\` doesn't yet have a 2MP completion`
        );
    }

    return entryRow;
}

// Converts the Index's marking of whether a tower's path/tier has been completed
// to symbols that are recognizable on the discord embed level
async function getCompletionMarking(entryRow, path, tier) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, '2mpc');

    upgradeCol = null;

    if (tier == 2) {
        upgradeCol = TOWER_COLS.BASE;
    } else {
        upgradeCol = String.fromCharCode(
            TOWER_COLS.BASE.charCodeAt(0) + (path - 1) * 3 + tier - 2
        );
    }

    completion = sheet.getCellByA1(`${upgradeCol}${entryRow}`).value.trim();

    if (completion == HEAVY_CHECK_MARK) {
        return WHITE_HEAVY_CHECK_MARK;
    } else {
        return RED_X;
    }
}

module.exports = {
    data: builder,
    execute,
}
