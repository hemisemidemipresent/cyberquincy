const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

const { HERO_NAME_TO_BLOONOLOGY_LINK } = require('../helpers/heroes');

const axios = require('axios');
const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colours.json');

const heroOption = new SlashCommandStringOption()
    .setName('hero')
    .setDescription('The hero you are finding information for')
    .setRequired(true);
Object.keys(HERO_NAME_TO_BLOONOLOGY_LINK).forEach((hero) => {
    heroOption.addChoices({ name: Aliases.toIndexNormalForm(hero), value: hero });
});
const builder = new SlashCommandBuilder()
    .setName('hero')
    .setDescription('Find information for each hero')
    .addStringOption(heroOption)
    .addIntegerOption((option) =>
        option.setName('hero_lvl').setDescription('The hero level that you want the information for').setRequired(false)
    );

function validateInput(interaction) {
    const heroLevel = interaction.options.getInteger('hero_lvl');
    if (heroLevel && (heroLevel > 20 || heroLevel < 1))
        return `Invalid hero level \`${heroLevel}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function embedBloonology(heroName, level) {
    const link = HERO_NAME_TO_BLOONOLOGY_LINK[heroName];
    let res = '';

    try {
        res = await axios.get(link);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    const body = res.data;
    const cleaned = body.replace(/\t/g, '').replace(/\r/g, '').trim();
    const sentences = cleaned.split(/\n\n/);

    const desc = level ? sentences[level - 1] : sentences[sentences.length - 1].trim();
    const descWithoutLevel = desc.split('\n').slice(1).join('\n');
    if (typeof desc != 'string') {
        return new Discord.EmbedBuilder().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    const title = level
        ? `${Aliases.toIndexNormalForm(heroName)} (Level-${level})`
        : `${Aliases.toIndexNormalForm(heroName)} (All Levels)`;

    const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(descWithoutLevel)
        .setColor(cyber)
        .setFooter({ text: footer });
    return embed;
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
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
