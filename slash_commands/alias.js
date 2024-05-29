const { SlashCommandBuilder } = require('discord.js');
const { cyber } = require('../jsons/colors.json');
const { discord } = require('../aliases/misc.json');

builder = new SlashCommandBuilder()
    .setName('alias')
    .setDescription('Look up aliases of a given term to use in slash commands')
    .addStringOption((option) =>
        option.setName('alias').setDescription('The term of which to view other aliases').setRequired(true)
    );

async function execute(interaction) {
    const alias = interaction.options.getString('alias').replace(/ /g, '_');
    const canonicizedAlias = Aliases.canonicizeArg(alias);
    const aliasSet = Aliases.getAliasSet(canonicizedAlias);

    let embed;
    if (aliasSet) {
        // Don't show all separator variations of every alias; just show the variation entered in the file
        const simplifiedAliases = [];
        const displayedAliases = [];
        aliasSet.forEach((a) => {
            const simplifiedAlias = a.replace(/_|-/g, '');
            if (!simplifiedAliases.includes(simplifiedAlias)) {
                simplifiedAliases.push(simplifiedAlias);
                displayedAliases.push(a);
            }
        });

        embed = new Discord.EmbedBuilder()
            .setColor(cyber)
            .setTitle(`Aliases of \`${alias}\``)
            .setDescription(displayedAliases.join(', '))
            .addFields([
                {
                    name: 'Note',
                    value:
                        '• `-` and `_` are interchangeable and can be left out entirely when entering slash commands\n' +
                        '• Most slash commands even allow you to replace these separators with spaces, as in `spirit of the forest`'
                }
            ]);
    } else {
        embed = new Discord.EmbedBuilder().setColor(cyber).setTitle(`No Aliases Found for \`${alias}\``);
    }

    embed.addFields([{ name: 'Want a new alias?', value: `suggest them [here](${discord})` }]);

    return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};
