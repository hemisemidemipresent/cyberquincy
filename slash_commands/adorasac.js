const { SlashCommandBuilder } = require('discord.js');
const { isTower } = require('../helpers/towers.js');

builder = new SlashCommandBuilder()
    .setName('adorasac')
    .setDescription('Calculate the optimal ewwww adora sacrifice to advance a certain amount of XP.')
    .addIntegerOption((option) => option.setName('xp').setDescription('XP to gain').setRequired(true).setMinValue(0))
    .addStringOption((option) => option.setName('excluded_towers').setDescription('Comma-separated list of towers to exclude'));


function parseExcludedTowers(excludedTowers) {
    if (!excludedTowers) {
        return []
    }
    let result = []
    let excludedTowersList = excludedTowers.split(/\s*,\s*/);
    for (let excludedTower of excludedTowersList) {
        if (isTower(excludedTower)) {
            throw new RangeError(`${excludedTower} is an invalid tower`);
        }
        result.push(Aliases.getCanonicalForm(excludedTower))
    }
    return result
}

async function execute(interaction) {
    try {
        var excludedTowers = parseExcludedTowers(interaction.options.getString('excluded_towers'));

        //console.log(excludedTowers);

        return await interaction.reply({
            content: JSON.stringify(excludedTowers),
            ephemeral: true
        });
    } catch (error) {
        if (error instanceof RangeError) {
            return await interaction.reply({
                content: error.message,
                ephemeral: true
            });
        } else {
            throw error;
        }
    }
}

module.exports = {
    data: builder,
    execute
};

