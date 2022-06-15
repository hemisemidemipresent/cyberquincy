const {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
    SlashCommandBooleanOption
} = require('@discordjs/builders');

const gHelper = require('../helpers/general.js');
const Heroes = require('../helpers/heroes');

const heroOption = new SlashCommandStringOption().setName('hero').setDescription('Hero').setRequired(true);
Aliases.allHeroes().forEach((hero) => {
    heroOption.addChoices({ name: gHelper.toTitleCase(hero), value: hero });
});

const heroLevelOption = new SlashCommandIntegerOption()
    .setName('placement_round')
    .setDescription('Round Hero is Placed')
    .setRequired(true);

const mapDifficultyOption = new SlashCommandStringOption()
    .setName('map_difficulty')
    .setDescription('Map Difficulty')
    .setRequired(true);
Aliases.allMapDifficulties().forEach((difficulty) => {
    mapDifficultyOption.addChoices({ name: gHelper.toTitleCase(difficulty), value: difficulty });
});

const energizerRoundOption = new SlashCommandIntegerOption()
    .setName('energizer_placement_round')
    .setDescription('Optional Round Energizer was Placed')
    .setRequired(false);

const ephemeralOption = new SlashCommandBooleanOption()
    .setName('ephemeral')
    .setDescription('Whether you want this to be viewed only by you or by everyone')
    .setRequired(false);

builder = new SlashCommandBuilder()
    .setName('herolevel')
    .setDescription('See how heroes level based on your inputted parameters (optionally with energizer)')
    .addStringOption(heroOption)
    .addIntegerOption(heroLevelOption)
    .addStringOption(mapDifficultyOption)
    .addIntegerOption(energizerRoundOption);
//    .addBooleanOption(ephemeralOption);

function generateHeroLevels(interaction) {
    hero = interaction.options.getString('hero');
    placementRound = interaction.options.getInteger('placement_round');
    mapDifficulty = interaction.options.getString('map_difficulty');
    energizerRound = interaction.options.getInteger('energizer_placement_round');

    heroLevels = Heroes.levelingCurve(hero, placementRound, mapDifficulty, energizerRound || Infinity);
    let res = table(gHelper.range(1, 20), heroLevels.slice(1));
    const embed = new Discord.MessageEmbed()
        .setTitle(`${gHelper.toTitleCase(hero)} Leveling Chart`)
        .setDescription(description(placementRound, mapDifficulty, energizerRound))
        .addField('\u200b', `${res}`)
        .setColor(colours['cyber']);
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
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    return await interaction.reply({
        embeds: [generateHeroLevels(interaction)]
    });
}

module.exports = {
    data: builder,
    execute
};
