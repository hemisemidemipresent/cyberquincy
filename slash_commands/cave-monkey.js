const { SlashCommandBuilder } = require('@discordjs/builders');

const { footer } = require('../aliases/misc.json');
const { cyber } = require('../jsons/colours.json');

builder = new SlashCommandBuilder().setName('cave_monkey').setDescription('Cave Monkey Info/Stats');

async function execute(interaction) {
    const stats = new Discord.MessageEmbed()
        .setTitle('Cave Monkey')
        .setFooter({ text: footer })
        .setColor(cyber)
        .setDescription(
            `24r
            _bonk_- 1d, 5p, 1.1s, normal
            - stuns bloons for 1s
            - stuns moabs for 0.25s
            
            Frozen Over map only
            requires 30 mortar shots (no matter the damage) to be freed from the ice
            receives tier 0 overclock benefits`
        )

    return await interaction.reply({ embeds: [stats] });
}

module.exports = {
    data: builder,
    execute
};