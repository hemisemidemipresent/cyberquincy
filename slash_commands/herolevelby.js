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

const desiredLevelOption = 
    new SlashCommandIntegerOption()
        .setName('desired_level')
        .setDescription('Goal Level for Hero')
        .setRequired(true)

const goalRoundOption = 
    new SlashCommandIntegerOption()
        .setName('goal_round')
        .setDescription('Round for Hero Goal Level')
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
    .setName('herolevelby')
    .setDescription('See how late you can place a hero to reach a specified level by a specified round')
    .addStringOption(heroOption)
    .addIntegerOption(desiredLevelOption)
    .addIntegerOption(goalRoundOption)
    .addStringOption(mapDifficultyOption);

function displayHeroPlacementRounds(interaction) {
    hero = interaction.options.getString('hero');
    desiredLevel = interaction.options.getInteger('desired_level');
    goalRound = interaction.options.getInteger('goal_round');
    mapDifficulty = interaction.options.getString('map_difficulty');

    const heroPlacementRound = calculateHeroPlacementRound(
        hero,
        goalRound,
        desiredLevel,
        mapDifficulty
    );

    let startingRounds = [];
    if (heroPlacementRound == -Infinity)
        startingRounds = [6, 10, 13, 21, 30, 40];
    else
        startingRounds = gHelper
            .range(1, 8)
            .map((addend) => heroPlacementRound + addend)
            .filter((r) => r <= goalRound);
    
    activeButtonCollectors = []

    async function displayHeroLevels() {
        const laterPlacementRounds = calculateLaterPlacementRounds(
            hero,
            startingRounds,
            goalRound,
            desiredLevel,
            mapDifficulty
        );

        let rounds = [];
        let costs = [];
        for (const round in laterPlacementRounds) {
            rounds.push(round);
            costs.push(
                gHelper.numberAsCost(Math.ceil(laterPlacementRounds[round]))
            );
        }

        let description = '';
        description += `to reach **lvl-${desiredLevel}** `;
        description += `by **r${goalRound}** `;
        description += `on **${mapDifficulty}** maps.`;

        const embed = new Discord.MessageEmbed()
            .setDescription(description)
            .addField('Place on round', rounds.join('\n'), true)
            .addField(`Pay on r${goalRound}`, costs.join('\n'), true)
            .setFooter(`Click a button below to see more starting rounds`)
            .setColor(colours['cyber']);

        if (heroPlacementRound == -Infinity) {
            embed.setTitle(
                `Can't place ${gHelper.toTitleCase(hero)} early enough`
            );
        } else {
            embed.setTitle(
                `Place ${gHelper.toTitleCase(
                    hero
                )} on R${heroPlacementRound}`
            );
        }

        const buttons = new Discord.MessageActionRow();

        for (let leftRound = 1; leftRound < 100; leftRound += 10) {
            // Show 5 buttons max
            if (buttons.components.length >= 5) break;

            // Don't show the 30s if hero doesn't need to be placed before R42
            if (leftRound < heroPlacementRound - 10) continue;

            // Don't show the 90s if the hero should be leveled up by round 87
            if (leftRound > goalRound) continue;

            const displayedLeftRound = Math.max(
                6, // If placement round is -Infinity or < 6
                heroPlacementRound + 1,
                leftRound
            )
            const displayedRightRound = Math.min(
                leftRound + 9,
                goalRound
            )
            label = `${displayedLeftRound}->${displayedRightRound}`
            buttons.addComponents(
                new Discord.MessageButton()
                    .setLabel(label)
                    .setStyle('PRIMARY')
                    .setCustomId(label)
            );
        }
        if (interaction.replied) {
            await interaction.editReply({
                embeds: [embed],
            })
        } else {
            await interaction.reply({
                embeds: [embed],
                components: [buttons],
            });
            const filter = selection => {
                selection.deferUpdate();
                return selection.user.id === interaction.user.id;
            };
            const collector =
                interaction.channel.createMessageComponentCollector({ 
                    filter,
                    componentType: 'BUTTON', 
                    time: 4000 
                });

            collector.on('collect', selection => {
                const [leftRound, rightRound] = 
                    selection.customId.split(/->/).map(r => parseInt(r));
                startingRounds = gHelper.range(leftRound, rightRound);
                displayHeroLevels();
            });

            collector.on('end', _ => {
                interaction.editReply({ 
                    embeds: [embed.setFooter('')],
                    components: [],
                })
            })
        }
    }

    displayHeroLevels();
}

function calculateHeroPlacementRound(
    hero,
    goalRound,
    desiredHeroLevel,
    mapDifficulty
) {
    // Uses binary-search to find the round that produces the highest non-negative value
    // (implying that the hero has JUST reached the desiredHeroLevel by the specified goalRound)
    roundForLevelUpTo = gHelper.binaryLambdaSearch(
        6, // min possible placement round
        goalRound, // max possible placement round
        (startingRound) => {
            return costToUpgrade(
                hero,
                startingRound,
                goalRound,
                desiredHeroLevel,
                mapDifficulty
            );
        }
    );

    return roundForLevelUpTo;
}

function calculateLaterPlacementRounds(
    hero,
    startingRounds,
    goalRound,
    desiredHeroLevel,
    mapDifficulty
) {
    placementRounds = {};
    for (var i = 0; i < startingRounds.length; i++) {
        placementRounds[startingRounds[i]] = costToUpgrade(
            hero,
            startingRounds[i],
            goalRound,
            desiredHeroLevel,
            mapDifficulty
        );
    }

    return placementRounds;
}

// The cost to upgrade the hero to the given desiredHeroLevel on the goalRound
// If it's 0 or negative, that means the level has been reached naturally
// If it's positive, it means the player needs to pay to get the level
function costToUpgrade(
    hero,
    startingRound,
    goalRound,
    desiredHeroLevel,
    mapDifficulty
) {
    heroLevelingChart = Heroes.levelingChart(
        hero,
        startingRound,
        mapDifficulty
    );
    return heroLevelingChart[goalRound][desiredHeroLevel];
}

function validateInput(interaction) {
    goalRound = interaction.options.getInteger('goal_round');
    if (goalRound < 6 || goalRound > 100) {
        return "Goal Round must be a round in standard CHIMPS mode (6-100)"
    }

    desiredLevel = interaction.options.getInteger('desired_level');
    if (desiredLevel == 1) {
        return `Don't embarrass yourself; the answer is ${goalRound}`
    }
    if (desiredLevel < 2 || desiredLevel > 20) {
        return `Invalid Hero Level "${desiredLevel}"`
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

    displayHeroPlacementRounds(interaction)
}

module.exports = {
	data: builder,
    execute,
};