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
    SlashCommandIntegerOption
} = require('@discordjs/builders');

const Towers = require('../helpers/towers');

let entityOption = 
    new SlashCommandStringOption()
        .setName('entity')
        .setDescription('Hero/Tower/Path/Upgrade')
        .setRequired(false);
Aliases.allHeroes().forEach(hero => {
    entityOption.addChoice(
        Aliases.toIndexNormalForm(hero),
        hero
    )
})
// Towers.allTowers().forEach(tower => {
//     entityOption.addChoice(
//         Aliases.toIndexNormalForm(tower),
//         tower
//     )
// })
// Towers.allTowerUpgrades().forEach(upgrade => {
//     entityOption.addChoice(
//         Aliases.towerUpgradeToIndexNormalForm(upgrade),
//         upgrade
//     )
// })
// Towers.allTowerPaths().forEach(path => {
//     entityOption.addChoice(
//         Aliases.towerPathToIndexNormalForm(path),
//         path
//     )
// })

builder = new SlashCommandBuilder()
    .setName('2mp')
    .setDescription('Search and Browse Completed 2MP Index Combos')

for (i = 0; i < 1000; i++) {
    builder = builder.addStringOption(entityOption)
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
