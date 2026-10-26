const Aliases = require('../aliases');

const gHelper = require('../helpers/general.js');
const { genCompletionLink } = require('../helpers/index.js');

const { red, paleyellow } = require('../jsons/colors.json');

const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(true);

builder = new SlashCommandBuilder()
    .setName('lcc')
    .setDescription('Search and Browse Completed LCC Index Combos')
    .addStringOption(mapOption);

async function execute(interaction) {
    const map = Aliases.lookup(interaction.options.getString('map'), 'map');
    if (!map) {
        return await interaction.reply('Map provided not valid');
    }

    await interaction.deferReply();

    let embeds = await lcc(Aliases.toIndexNormalForm(map));
    return await interaction.editReply({ embeds: embeds });

}

async function lcc(map) {

    const searchParams = new URLSearchParams({ map, count: 100 });

    let { results } = await fetchlcc(searchParams);

    let result = results[0];

    if (!result) return [new Discord.EmbedBuilder().setTitle('Error!').setDescription(`No LCC found for ${map}`).setColor(red)];

    let challengeEmbed = new Discord.EmbedBuilder().setTitle(`${map} LCC (Latest Version)`).setColor(paleyellow);

    let link = genCompletionLink(result);
    challengeEmbed.addFields([
        { name: 'Cost', value: gHelper.numberAsCost(result.money), inline: true },
        { name: 'Version', value: result.version, inline: true },
        { name: 'Date', value: result.date, inline: true },
        { name: 'Person', value: result.person, inline: true },
        { name: 'Link', value: link, inline: true }
    ]);

    results = results.sort((a, b) => a.money - b.money);

    // cheapest and latest version are the same
    if (result.filekey == results[0].filekey) {
        challengeEmbed.setFooter({ text: 'This is the cheapest combo' });
        return [challengeEmbed];
    }

    result = results[0];

    let challengeEmbed2 = new Discord.EmbedBuilder().setTitle(`${map} LCC (Cheapest)`).setColor(paleyellow);

    link = genCompletionLink(result);
    challengeEmbed2.addFields([
        { name: 'Cost', value: gHelper.numberAsCost(result.money), inline: true },
        { name: 'Version', value: result.version, inline: true },
        { name: 'Date', value: result.date, inline: true },
        { name: 'Person', value: result.person, inline: true },
        { name: 'Link', value: link, inline: true }
    ]);

    return [challengeEmbed, challengeEmbed2];
}

async function fetchlcc(searchParams) {
    let res = await fetch('https://btd6index.win/fetch-lcc?' + searchParams);
    let resJson = await res.json();
    if ('error' in resJson)
        throw new Error(resJson.error);
    return resJson;
}


module.exports = {
    data: builder,
    execute
};
