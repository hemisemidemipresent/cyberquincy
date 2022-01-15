const { 
    SlashCommandBuilder, 
    SlashCommandStringOption,
    SlashCommandIntegerOption
} = require('@discordjs/builders');

const gHelper = require('../helpers/general.js');
const Heroes = require('../helpers/heroes');

let heroOption = 
    new SlashCommandStringOption()
        .setName('hero')
        .setDescription('Hero')
        .setRequired(true);
Aliases.allHeroes().forEach(hero => {
    heroOption.addChoice(
        gHelper.toTitleCase(hero),
        hero
    )
})

const heroLevelOption = 
    new SlashCommandIntegerOption()
        .setName('placement_round')
        .setDescription('Round Hero is Placed')
        .setRequired(true)

let mapDifficultyOption = 
    new SlashCommandStringOption()
        .setName('map_difficulty')
        .setDescription('Map Difficulty')
        .setRequired(true);
Aliases.allMapDifficulties().forEach(difficulty => {
    mapDifficultyOption.addChoice(
        gHelper.toTitleCase(difficulty),
        difficulty
    )
})


builder = new SlashCommandBuilder()
    .setName('herolevel')
    .setDescription('See how heroes level based on your inputted parameters')
    .addStringOption(heroOption)
    .addIntegerOption(heroLevelOption)
    .addStringOption(mapDifficultyOption);

function generateHeroLevels(hero, placementRound, mapDifficulty) {
    heroLevels = Heroes.levelingCurve(
        hero,
        placementRound,
        mapDifficulty
    );
    let res = table(gHelper.range(1, 20), heroLevels.slice(1));
    const embed = new Discord.MessageEmbed()
        .setTitle(`${gHelper.toTitleCase(hero)} Leveling Chart`)
        .setDescription(
            `Placed: **R${
                placementRound
            }**\nMaps: **${gHelper.toTitleCase(mapDifficulty)}**`
        )
        .addField('\u200b', `${res}`)
        .setColor(colours['cyber']);
    return embed;
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
        return "Can't enter non-positive numbers for rounds"
    }
    if (placementRound > 100) {
        return "Can't enter starting round > 100"
    }
}

function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({ 
            content: validationFailure, 
            ephemeral: true
        });
    }

    hero = interaction.options.getString('hero');
    placementRound = interaction.options.getInteger('placement_round');
    mapDifficulty = interaction.options.getString('map_difficulty');

    return interaction.reply({
        embeds: [generateHeroLevels(hero, placementRound, mapDifficulty)]
    })
}

module.exports = {
	data: builder,
    execute,
};