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
        .setDescription('Hero/Tower/Path/Upgrade')
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
const TowerPathParser = require('../parser/tower-path-parser.js');
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const PersonParser = require('../parser/person-parser.js');
const EmptyParser = require('../parser/empty-parser.js');
const Parsed = require('../parser/parsed.js');

function validateInput(interaction) {
    parsedEntity = parseEntity(interaction)
    if (parsedEntity?.hasErrors())
        return `Entity ${entity} didn't match tower/path/upgrade/hero, including aliases`

    parsedMap = parseMap(interaction)
    if (parsedMap?.hasErrors())
        return `Map/Difficulty ${map} didn't match, including aliases`
}

function parseEntity(interaction) {
    entityParser = new OrParser(
        new TowerParser(),
        new TowerPathParser(),
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
