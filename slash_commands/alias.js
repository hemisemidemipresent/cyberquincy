const { SlashCommandBuilder } = require('@discordjs/builders');
const { cyber } = require('../jsons/colours.json')

builder = new SlashCommandBuilder()
    .setName('alias')
    .setDescription('Search and Browse Completed LTC Index Combos')
    .addStringOption(option => 
        option.setName('alias').setDescription('The term of which to view other aliases').setRequired(true)
    )

async function execute(interaction) {
    const alias = interaction.options.getString('alias').replace(/ /g, '_')
    const canonicizedAlias = Aliases.canonicizeArg(alias);
    const aliasSet = Aliases.getAliasSet(canonicizedAlias);
    
    let embed;
    if (aliasSet) {
        const simplifiedAliases = []
        const displayedAliases = []
        aliasSet.forEach(a => {
            const simplifiedAlias = a.replace(/_|-/g, '')
            if (!simplifiedAliases.includes(simplifiedAlias)) {
                simplifiedAliases.push(simplifiedAlias)
                displayedAliases.push(a)
            }
        })

        embed = new Discord.MessageEmbed()
            .setColor(cyber)
            .setTitle(`Aliases of \`${alias}\``)
            .setDescription(displayedAliases.join(', '))
            .addField('Note',
                '• `-` and `_` are interchangeable and can be left out entirely when entering slash commands\n' +
                '• Most slash commands even allow you to replace these separators with spaces, as in `spirit of the forest`'
            )
    } else {
        embed = new Discord.MessageEmbed().setColor(cyber).setTitle(`No Aliases Found for \`${alias}\``)
    }

    return await interaction.reply({ embeds: [embed] })
}

module.exports = {
    data: builder,
    execute
};
    