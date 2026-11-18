import Aliases from '../aliases';

import gHelper from '../helpers/general.js';
import { genCompletionLink, fetchIndex, orUnknown } from '../helpers/index';
import Colors from '../helpers/colors';

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

const { red, paleyellow } = Colors;

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(true);

const builder = new SlashCommandBuilder()
    .setName('lcc')
    .setDescription('Search and Browse Completed LCC Index Combos')
    .addStringOption(mapOption);

async function execute(interaction: ChatInputCommandInteraction) {
    const map = Aliases.lookup(interaction.options.getString('map'), 'map');
    if (!map) {
        return await interaction.reply('Map provided not valid');
    }

    await interaction.deferReply();

    let embeds = await lcc(Aliases.toIndexNormalForm(map));
    return await interaction.editReply({ embeds: embeds });

}

// `map` is the map's index name, e.g. `Dark Castle`
async function lcc(map: string): Promise<EmbedBuilder[]> {

    const searchParams = new URLSearchParams({ map, count: '100' });

    let { results } = await fetchlcc(searchParams);

    let result = results[0];

    if (!result) return [new EmbedBuilder().setTitle('Error!').setDescription(`No LCC found for ${map}`).setColor(red)];

    let challengeEmbed = new EmbedBuilder().setTitle(`${map} LCC (Latest Version)`).setColor(paleyellow);

    let link = genCompletionLink(result);
    challengeEmbed.addFields([
        { name: 'Cost', value: gHelper.numberAsCost(result.money), inline: true },
        { name: 'Version', value: orUnknown(result.version), inline: true },
        { name: 'Date', value: orUnknown(result.date), inline: true },
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

    let challengeEmbed2 = new EmbedBuilder().setTitle(`${map} LCC (Cheapest)`).setColor(paleyellow);

    link = genCompletionLink(result);
    challengeEmbed2.addFields([
        { name: 'Cost', value: gHelper.numberAsCost(result.money), inline: true },
        { name: 'Version', value: orUnknown(result.version), inline: true },
        { name: 'Date', value: orUnknown(result.date), inline: true },
        { name: 'Person', value: result.person, inline: true },
        { name: 'Link', value: link, inline: true }
    ]);

    return [challengeEmbed, challengeEmbed2];
}

async function fetchlcc(searchParams: URLSearchParams) {
    return await fetchIndex('lcc', searchParams);
}


export { builder as data, execute };
