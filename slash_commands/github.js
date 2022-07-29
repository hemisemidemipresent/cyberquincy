const { SlashCommandBuilder } = require('discord.js');

builder = new SlashCommandBuilder().setName('github').setDescription('Links the cyberquincy github repository');

async function execute(interaction) {
    let embed = new Discord.EmbedBuilder().setDescription(
        'https://github.com/hemisemidemipresent/cyberquincy (please star it)'
    );
    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
