const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandStringOption
} = require('discord.js');

const Bloonology = require('../helpers/bloonology');

const { discord, footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colors.json');

const heroOption = new SlashCommandStringOption()
    .setName('hero')
    .setDescription('The hero you are finding information for')
    .setRequired(true);
Object.keys(Bloonology.HERO_NAME_TO_BLOONOLOGY_LINK).forEach((hero) => {
    heroOption.addChoices({ name: Aliases.toIndexNormalForm(hero), value: hero });
});
const builder = new SlashCommandBuilder()
    .setName('hero')
    .setDescription('Find information for each hero')
    .addStringOption(heroOption)
    .addIntegerOption((option) =>
        option.setName('hero_lvl').setDescription('The hero level that you want the information for').setRequired(false)
    );

const backButton = new ButtonBuilder()
    .setCustomId('back')
    .setLabel('Previous')
    .setEmoji('⬅️')
    .setStyle(ButtonStyle.Secondary);
const forwardButton = new ButtonBuilder()
    .setCustomId('forward')
    .setLabel('Next')
    .setEmoji('➡️')
    .setStyle(ButtonStyle.Secondary);

function validateInput(interaction) {
    const heroLevel = interaction.options.getInteger('hero_lvl');
    if (heroLevel && (heroLevel > 20 || heroLevel < 1))
        return `Invalid hero level \`${heroLevel}\` provided!\nHero level must be from \`1\` to \`20\` (inclusive)`;
}

async function embedBloonology(heroName, level, page = 0) {
    let sentences;
    let latestVersion;
    let desc;
    try {
        latestVersion = await Bloonology.heroLatestVersion(heroName);
        if (heroName == "corvus" && level >= 5) {
            sentences = await Bloonology.corvusBloonology(level);
            desc = sentences[0] + "\n\n" + sentences[1][page] + "\n\n" + sentences[2];
        } else {
            sentences = await Bloonology.heroNameToBloonologyList(heroName);
            desc = level ? sentences[level - 1] : sentences[sentences.length - 1].trim();
        }
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    if (typeof desc != 'string') {
        return new Discord.EmbedBuilder().setColor(red).setTitle('The bloonology datapiece is missing');
    }

    let title = level
        ? `${Aliases.toIndexNormalForm(heroName)} (Level-${level})`
        : `${Aliases.toIndexNormalForm(heroName)} (All Levels)`;
    if (latestVersion !== null) title += ` (v${latestVersion})`;

    // overflow
    // TODO: Check for total chars > 6000
    let fields = [];
    let descForDescription = '';
    if (desc.length > 4096) {
        const descLines = desc.split('\n');
        let i = 0;
        for (; i < descLines.length; i++) {
            // add to description until char limit is reached
            if (descForDescription.length + descLines[i].length < 4096) {
                descForDescription += descLines[i] + '\n';
            } else {
                break;
            }
        }
        for (; i < descLines.length; i++) {
            // (assuming fields array is not empty) add to value of latest field
            if (fields[0] && fields[fields.length - 1].value.length + descLines[i].length < 1024) {
                fields[fields.length - 1].value += descLines[i] + '\n';
            } else {
                fields.push({ name: '\u200b', value: descLines[i] + '\n' });
            }
        }
    } else {
        descForDescription = desc;
    }

    fields.push({ name: 'Incorrect/out of date information?', value: `please report them [here](${discord})` });

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
            flags: MessageFlags.Ephemeral
        });
    }

    const heroName = interaction.options.getString('hero');
    const heroLevel = interaction.options.getInteger('hero_lvl');
    let pageIndex = 0;

    const embed = await embedBloonology(heroName, heroLevel);
    if (heroName == "corvus" && heroLevel >= 5) {
        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(forwardButton)] });
    } else {
        await interaction.reply({ embeds: [embed] });
    }

    // collector filter
    const filter = (selection) => {
        // Ensure user clicking button is same as the user that started the interaction
        if (selection.user.id !== interaction.user.id) return false;
        // Ensure that the button press corresponds with this interaction and wasn't a button press on the previous interaction
        if (selection.message.interaction.id !== interaction.id) return false;
        return true;
    };

    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 60000
    });

    collector.on('collect', async (buttonInteraction) => {
        buttonInteraction.deferUpdate();
        if (buttonInteraction.customId === 'forward') pageIndex++;
        if (buttonInteraction.customId === 'back') pageIndex--;

        let row = new ActionRowBuilder();
        if (pageIndex > 0) row.addComponents(backButton);
        if (pageIndex < 3) row.addComponents(forwardButton);
        await interaction.editReply({
            embeds: [await embedBloonology(heroName, heroLevel, pageIndex)],
            components: [row]
        });

        await collector.resetTimer();
    });

    collector.on('end', async () => {
        await interaction.editReply({
            components: []
        });
    });
}

module.exports = {
    data: builder,
    execute
};