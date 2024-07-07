const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

const { HERO_NAME_TO_BLOONOLOGY_LINK, heroNameToBloonologyList } = require('../helpers/bloonology');

const { footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colors.json');

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
    let sentences;
    try {
        sentences = await heroNameToBloonologyList(heroName);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    const desc = level ? sentences[level - 1] : sentences[sentences.length - 1].trim();
    if (typeof desc != 'string') {
        return new Discord.EmbedBuilder().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    const title = level
        ? `${Aliases.toIndexNormalForm(heroName)} (Level-${level})`
        : `${Aliases.toIndexNormalForm(heroName)} (All Levels)`;

    // overflow
    // TODO: Check for total chars > 6000
    let fields = [];
    let descForDescription = '';
    if (desc.length > 4096) {
        const descLines = desc.split('\n');
        descLines.forEach((line) => {
            // add to description until char limit is reached
            if (descForDescription.length + line.length < 4096)
                return descForDescription += line + '\n';

            // (assuming fields array is not empty) add to value of latest field
            if (fields[0] && fields[fields.length - 1].value.length + line.length < 1024)
                return fields[fields.length - 1].value += line + '\n';

            fields.push({ name: '\u200b', value: line + '\n' });
        });
    } else {
        descForDescription = desc;
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(descForDescription)
        .addFields(fields)
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

    return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};