import Aliases from '../aliases';

import gHelper from '../helpers/general.js';
import { genCompletionLink, fetchIndex, orUnknown } from '../helpers/index';
import Colors from '../helpers/colors';

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';

const { red, paleyellow } = Colors;

let mapOption = new SlashCommandStringOption().setName('map').setDescription('Map').setRequired(true);

const builder = new SlashCommandBuilder()
    .setName('lcd')
    .setDescription('Search and Browse Completed LCD Index Combos')
    .addStringOption(mapOption);

async function execute(interaction: ChatInputCommandInteraction) {
    const map = Aliases.lookup(interaction.options.getString('map'), 'map');
    if (!map) {
        return await interaction.reply('Map provided not valid');
    }

    await interaction.deferReply();

    let challengeEmbed = await lcd(Aliases.toIndexNormalForm(map));
    return await interaction.editReply({ embeds: [challengeEmbed] });
}

// `map` is the map's index name, e.g. `Dark Castle`
async function lcd(map: string): Promise<EmbedBuilder> {
    const searchParams = new URLSearchParams({ map, count: '100' });

    let { results } = await fetchlcd(searchParams);

    const result = results[0];

    if (!result) return new EmbedBuilder().setTitle('Error!').setDescription(`No LCD found for ${map}`).setColor(red);

    let challengeEmbed = new EmbedBuilder().setTitle(`${map} LCD Combo`).setColor(paleyellow);

    let link = genCompletionLink(result);

    challengeEmbed.addFields([
        { name: 'Map', value: result.map, inline: true },
        { name: 'Cost', value: gHelper.numberAsCost(result.money), inline: true },
        { name: 'Version', value: orUnknown(result.version), inline: true },
        { name: 'Date', value: orUnknown(result.date), inline: true },
        { name: 'Person', value: result.person, inline: true },
        { name: 'Link', value: link, inline: true }
    ]);

    return challengeEmbed;
}

async function fetchlcd(searchParams: URLSearchParams) {
    return await fetchIndex('lcd', searchParams);
}

export { builder as data, execute };
