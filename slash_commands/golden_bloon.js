const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('golden').setDescription('Information about the golden bloon');

async function execute(interaction) {
    return await interaction.reply(
        'This bloon does not have a certain HP value, but is popped after a certain number of hits. After each hit, it will enter a grace period, where it gets flown to a spot closer or further from the exit, and it speeds up. It is immune to all attacks during this period.\n' +
            'Golden bloons start spawning on round 21 - 30, and in one round per block of 10 rounds. it always spawns at the start of the round.\n' +
            'Golden bloons cannot spawn after you reach the victory screen. As the rounds get higher, the golden bloon will evolve, gaining more immunities and properties:\n' +
            '```\n' +
            'R21 - 30: Normal\n' +
            'R31 - 40: Camo\n' +
            'R41 - 50: Lead\n' +
            'R51 - 60: Camo Lead\n' +
            'R61 - 70: Camo Lead Fortified\n' +
            'R71 - 80: Camo Lead Purple Fortified\n' +
            'R81 -100: Camo Lead Purple Zebra Fortified\n' +
            '```\n' +
            '\n' +
            'When popped, you gain extra Monkey Money based on the map difficulty:\n' +
            '```\n' +
            '             | normal | fortified\n' +
            '    Beginner |      2 |         4\n' +
            'Intermediate |      3 |         6\n' +
            '    Advanced |      4 |         8\n' +
            '      Expert |      5 |        10' +
            '```\n'
    );
}

module.exports = {
    data: builder,
    execute
};
