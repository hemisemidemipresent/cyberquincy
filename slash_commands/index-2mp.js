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

console.log(builder)

const OrParser = require('../parser/or-parser.js');

const TowerUpgradeParser = require('../parser/tower-upgrade-parser.js');
const HeroParser = require('../parser/hero-parser.js');
const TowerParser = require('../parser/tower-parser.js')
const TowerPathParser = require('../parser/tower-path-parser.js');
const MapParser = require('../parser/map-parser.js');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');
const PersonParser = require('../parser/person-parser.js');

function validateInput(interaction) {
    entity = interaction.options.getString('entity')
    if (entity) {
        entityParser = new OrParser(
            new TowerParser(),
            new TowerPathParser(),
            new TowerUpgradeParser(),
            new HeroParser(),
        )
        parsed = CommandParser.parse([entity], entityParser)
        if (parsed.hasErrors()) {
            return `Entity ${parsed.or} didn't match tower/path/upgrade/hero, including aliases`
        }
    }

    map = interaction.options.getString('map')
    if (map) {
        mapParser = new OrParser(
            new MapParser(),
            new MapDifficultyParser(),
        )
        parsed = CommandParser.parse([map], mapParser)
        if (parsed.hasErrors()) {
            return `Map/Difficulty ${parsed.or} didn't match map/difficulty, including aliases`
        }
    }
}

function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({ 
            content: validationFailure, 
            ephemeral: true
        });
    }
}

module.exports = {
    data: builder,
    execute,
}
