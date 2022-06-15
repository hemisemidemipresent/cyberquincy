const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');

const axios = require('axios');
const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colours.json');
const heroNameToBloonologyLinkMapping = {
    quincy: 'https://pastebin.com/raw/ASpHNduS',
    gwendolin: 'https://pastebin.com/raw/rZYjbEhX',
    striker_jones: 'https://pastebin.com/raw/hrH8q0bd',
    obyn_greenfoot: 'https://pastebin.com/raw/x2WiKEWi',
    captain_churchill: 'https://pastebin.com/raw/cqaHnhgB',
    benjamin: 'https://pastebin.com/raw/j6X3mazy',
    ezili: 'https://pastebin.com/raw/dYu1B9bp',
    pat_fusty: 'https://pastebin.com/raw/2YRMFjPG',
    adora: 'https://pastebin.com/raw/WnsgkWRc',
    admiral_brickell: 'https://pastebin.com/raw/amw39T29',
    etienne: 'https://pastebin.com/raw/UxN2Wx1F',
    sauda: 'https://pastebin.com/raw/8E2TSndk',
    psi: 'https://pastebin.com/raw/9h9aAPUm',
    geraldo: 'https://pastebin.com/raw/rksZWhTV'
};

const heroOption = new SlashCommandStringOption()
    .setName('hero')
    .setDescription('The hero you are finding information for')
    .setRequired(true);
Object.keys(heroNameToBloonologyLinkMapping).forEach((hero) => {
    heroOption.addChoices({ name: Aliases.toIndexNormalForm(hero), value: hero });
});
const builder = new SlashCommandBuilder()
    .setName('hero')
    .setDescription('Find information for each hero')
    .addStringOption(heroOption)
    .addIntegerOption((option) =>
        option.setName('hero_lvl').setDescription("The hero' level that you want the information for.").setRequired(true)
    );

function validateInput(interaction) {
    const heroLevel = interaction.options.getInteger('hero_lvl');
    if (heroLevel > 20 || heroLevel < 1)
        return `Invalid hero level \`${heroLevel}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function embedBloonology(heroName, level) {
    const link = heroNameToBloonologyLinkMapping[heroName];
    let res = '';

    try {
        res = await axios.get(link);
    } catch {
        return new Discord.MessageEmbed().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    const body = res.data;
    const cleaned = body.replace(/\t/g, '').replace(/\r/g, '');
    const sentences = cleaned.split(/\n\n/);

    const desc = sentences[level - 1];
    const descWithoutLevel = desc.split('\n').slice(1).join('\n');
    if (typeof desc != 'string') {
        return new Discord.MessageEmbed().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    const embed = new Discord.MessageEmbed()
        .setTitle(`${Aliases.toIndexNormalForm(heroName)} (Level-${level})`)
        .setDescription(descWithoutLevel)
        .setColor(cyber)
        .setFooter({ text: footer });
    return embed;
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const heroName = interaction.options.getString('hero');
    const heroLevel = interaction.options.getInteger('hero_lvl');

    const embed = await embedBloonology(heroName, heroLevel);

    return await interaction.reply({ embeds: [embed], ephemeral: false });
}

module.exports = {
    data: builder,
    execute
};
