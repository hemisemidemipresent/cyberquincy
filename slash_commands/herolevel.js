const {
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
    SlashCommandBooleanOption
} = require('discord.js');

const gHelper = require('../helpers/general.js');
const Maps = require('../helpers/maps');
const Heroes = require('../helpers/heroes');
const { cyber } = require('../jsons/colors.json');

const heroOption = new SlashCommandStringOption().setName('hero').setDescription('Hero').setRequired(true);
Heroes.allHeroes().forEach((hero) => {
    heroOption.addChoices({ name: Aliases.toIndexNormalForm(hero), value: hero });
});

const heroLevelOption = new SlashCommandIntegerOption()
    .setName('placement_round')
    .setDescription('Round Hero is Placed')
    .setRequired(true);

const mapDifficultyOption = new SlashCommandStringOption()
    .setName('map_difficulty')
    .setDescription('Map Difficulty')
    .setRequired(true);
Maps.allMapDifficulties().forEach((difficulty) => {
    mapDifficultyOption.addChoices({ name: gHelper.toTitleCase(difficulty), value: difficulty });
});

const energizerRoundOption = new SlashCommandIntegerOption()
    .setName('energizer_placement_round')
    .setDescription('Optional Round Energizer was Placed')
    .setRequired(false);

const mkOption = new SlashCommandBooleanOption()
    .setName('monkey_knowledge')
    .setDescription('If monkey knowledge is on or not')
    .setRequired(false);

builder = new SlashCommandBuilder()
    .setName('herolevel')
    .setDescription('See how heroes level based on your inputted parameters (optionally with energizer)')
    .addStringOption(heroOption)
    .addIntegerOption(heroLevelOption)
    .addStringOption(mapDifficultyOption)
    .addIntegerOption(energizerRoundOption)
    .addBooleanOption(mkOption);

function generateHeroLevels(interaction) {
    hero = interaction.options.getString('hero');
    placementRound = interaction.options.getInteger('placement_round');
    mapDifficulty = interaction.options.getString('map_difficulty');
    energizerRound = interaction.options.getInteger('energizer_placement_round');
    mk = interaction.options.getBoolean('monkey_knowledge');

    heroLevels = Heroes.levelingCurve(hero, placementRound, mapDifficulty, energizerRound || Infinity, mk || false);
    let res = table(gHelper.range(1, 20), heroLevels.slice(1));

    let desc = description(placementRound, mapDifficulty, energizerRound);

    if (mk) desc += `\nThis includes the monkey knowledge **Monkey Education** (+8% XP) **Self Taught Heroes** (+10% XP) and **Monkeys Together Strong** (+5% for a single hero) (stacks multiplicatively)`;

    const embed = new Discord.EmbedBuilder()
        .setTitle(`${gHelper.toTitleCase(hero)} Leveling Chart`)
        .setDescription(desc)
        .addFields([{ name: '\u200b', value: `${res}` }])
        .setColor(cyber);
    return embed;
}

function description(placementRound, mapDifficulty, energizerRound) {
    let description = `Placed: **R${placementRound}**`;
    description += `\nMaps: **${gHelper.toTitleCase(mapDifficulty)}**`;
    if (energizerRound) {
        description += `\nEnergizer: **R${energizerRound}**`;
    }
    return description;
}

function addSpaces(str, max) {
    let diff = max - str.toString().length;

    for (i = 0; i < diff; i++) str += ' ';

    return str;
}

function table(lvl, round) {
    let finalRes = '`level`|`round`\n';
    let i = 0;
    while (i < 20) {
        // for loop doesnt work here due to black arcane magic
        res = '';
        res += `\`${addSpaces(lvl[i], 5)}`;
        res += '|';
        res += `${addSpaces(round[i], 5)}\``;
        finalRes += res;
        finalRes += '\n';
        i++;
    }
    return finalRes;
}

function validateInput(interaction) {
    placementRound = interaction.options.getInteger('placement_round');
    if (placementRound < 1) {
        return 'Must enter a positive number for round';
    }
    if (placementRound > 100) {
        return "Can't enter starting round > 100";
    }

    energizerRound = interaction.options.getInteger('energizer_placement_round');
    if (energizerRound) {
        if (energizerRound < 1) {
            return 'Must enter a positive number for energizer round';
        }
        if (energizerRound > 100) {
            return "Can't enter energizer round starting round > 100; just don't enter it since the argument is optional";
        }
    }
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            flags: MessageFlags.Ephemeral
        });

    return await interaction.reply({
        embeds: [generateHeroLevels(interaction)]
    });
}

module.exports = {
    data: builder,
    execute
};
