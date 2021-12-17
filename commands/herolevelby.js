const AnyOrderParser = require('../parser/any-order-parser');
const OptionalParser = require('../parser/optional-parser');

const HeroParser = require('../parser/hero-parser');
const RoundParser = require('../parser/round-parser');
const MapDifficultyParser = require('../parser/map-difficulty-parser');
const HeroLevelParser = require('../parser/hero-level-parser');

const ReactionChain = require('../helpers/reactor/reaction_chain');
const SingleTextParser = require('../helpers/reactor/single_text_parser');
const MenuReactor = require('../helpers/reactor/menu_reactor');

const Heroes = require('../helpers/heroes');

const gHelper = require('../helpers/general.js');

const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
} = require('discord.js');

const mapDifficultyMenu = new MessageSelectMenu()
    .setCustomId('map_difficulty')
    .setPlaceholder('Nothing selected')
    .addOptions([
        {
            label: 'Beginner',
            description: '1x levelling',
            value: 'beginner',
        },
        {
            label: 'Intermediate',
            description: '1.1x levelling',
            value: 'intermediate',
        },
        {
            label: 'Advanced',
            description: '1.2x levelling',
            value: 'advanced',
        },
        {
            label: 'Expert',
            description: '1.3x levelling',
            value: 'expert',
        },
    ]);

const heroMenu = new MessageSelectMenu()
    .setCustomId('hero')
    .setPlaceholder('Nothing selected')
    .addOptions([
        {
            label: 'Adora',
            description: 'High priestess',
            value: 'adora',
        },
        {
            label: 'Benjamin',
            description: 'Code Monkey',
            value: 'benjamin',
        },
        {
            label: 'Admiral Brickell',
            description: 'Naval Commander',
            value: 'brickell',
        },
        {
            label: 'Captain Churchill',
            description: 'Tank',
            value: 'churchill',
        },
        {
            label: 'Etienne',
            description: 'Drone Operator',
            value: 'etienne',
        },
        {
            label: 'Ezili',
            description: 'Voodoo Monkey',
            value: 'ezili',
        },
        {
            label: 'Gwendolin',
            description: 'Pyromaniac',
            value: 'gwen',
        },
        {
            label: 'Strike Jones',
            description: 'Artillery Commander',
            value: 'jones',
        },
        {
            label: 'Obyn',
            description: 'Forest Guardian',
            value: 'obyn',
        },
        {
            label: 'Pat Fusty',
            description: 'Giant Monkey',
            value: 'pat',
        },
        {
            label: 'Psi',
            description: 'Psionic Monkey',
            value: 'psi',
        },
        {
            label: 'Quincy',
            description: 'me',
            value: 'quincy',
        },
        {
            label: 'Sauda',
            description: 'Swordmaster',
            value: 'sauda',
        },
    ]);

async function execute(message, args) {
    if (args.length == 1 && args[0] == 'help') {
        return await message.channel.send(
            'Type `q!herolevelby` and follow the instructions (you may also want to try `q!herolevel` or `q!herolevelengergizer`)'
        );
    }

    const parsed = CommandParser.parse(
        args,
        // Make any of the available arguments optional to add in any order in the command args
        // Arguments that aren't entered will be gathered through the react-loop
        new AnyOrderParser(
            new OptionalParser(new HeroParser()),
            new OptionalParser(new RoundParser('IMPOPPABLE')),
            new OptionalParser(new HeroLevelParser()),
            new OptionalParser(new MapDifficultyParser())
        )
    );

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    // Start react loop to collect the data that the user didn't provide at command-time

    ReactionChain.process(
        message,
        (message, results) => displayHeroPlacementRounds(message, results),
        new MenuReactor('hero', heroMenu, parsed.hero),
        new SingleTextParser(
            new RoundParser('IMPOPPABLE'),
            'goal',
            parsed.round
        ),
        new SingleTextParser(
            new HeroLevelParser(),
            'desired',
            parsed.hero_level
        ),
        new MenuReactor(
            'map_difficulty',
            mapDifficultyMenu,
            parsed.map_difficulty
        )
    );
}

async function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!herolevelby help` for help', '\u200b')
        .setColor(colours['orange']);

    return await message.channel.send({ embeds: [errorEmbed] });
}

function displayHeroPlacementRounds(userQueryMessage, results) {
    const heroPlacementRound = calculateHeroPlacementRound(
        results.hero,
        results.goal_round,
        results.desired_hero_level,
        results.map_difficulty
    );

    let startingRounds = [];
    if (heroPlacementRound == -Infinity)
        startingRounds = [6, 10, 13, 21, 30, 40];
    else
        startingRounds = gHelper
            .range(1, 8)
            .map((addend) => heroPlacementRound + addend)
            .filter((r) => r <= results.goal_round);

    async function displayHeroLevels() {
        const laterPlacementRounds = calculateLaterPlacementRounds(
            results.hero,
            startingRounds,
            results.goal_round,
            results.desired_hero_level,
            results.map_difficulty
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
        description += `to reach **lvl-${results.desired_hero_level}** `;
        description += `by **r${results.goal_round}** `;
        description += `on **${results.map_difficulty}** maps.`;

        const embed = new MessageEmbed()
            .setDescription(description)
            .addField('Place on round', rounds.join('\n'), true)
            .addField(`Pay on r${results.goal_round}`, costs.join('\n'), true)
            .setFooter(`Click a button below to see more starting rounds`)
            .setColor(colours['cyber']);

        if (heroPlacementRound == -Infinity) {
            embed.setTitle(
                `Can't place ${gHelper.toTitleCase(results.hero)} early enough`
            );
        } else {
            embed.setTitle(
                `Place ${gHelper.toTitleCase(
                    results.hero
                )} on R${heroPlacementRound}`
            );
        }

        const buttons = new MessageActionRow();

        for (let i = 0; i < 10; i++) {
            if (i < Math.floor(heroPlacementRound / 10)) continue;
            if (i > Math.floor(results.goal_round / 10)) continue;
            if (buttons.components.length >= 5) continue;
            let label = '';
            if (i == 0) label = 'r6—>10';
            else label = `r${10 * i + 1}—>${10 * (i + 1)}`;
            buttons.addComponents(
                new MessageButton()
                    .setLabel(label)
                    .setStyle('PRIMARY')
                    .setCustomId(i.toString())
            );
        }
        if (!module.exports.interaction) {
            module.exports.botMessage = await userQueryMessage.channel.send({
                embeds: [embed],
                components: [buttons],
            });
        } else {
            try {
                await module.exports.interaction.update({
                    embeds: [embed],
                    components: [buttons],
                });
            } catch (E) {
                console.log(E.name);
            }
        }

        const filter = (i) => i.user.id == userQueryMessage.author.id;

        const collector =
            await module.exports.botMessage.createMessageComponentCollector({
                filter,
                time: 20000,
            });
        collector.on('collect', (i) => {
            collector.stop();
            module.exports.interaction = i;
            let tensPlace = parseInt(i.customId);

            let leftRound = tensPlace * 10 + 1;
            if (leftRound < 6) leftRound = 6;
            if (leftRound <= heroPlacementRound)
                leftRound = heroPlacementRound + 1;

            let rightRound = (tensPlace + 1) * 10;
            if (rightRound > results.goal_round)
                rightRound = results.goal_round;
            startingRounds = gHelper.range(leftRound, rightRound);
            displayHeroLevels();
        });
    }

    displayHeroLevels(undefined);
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
        if (startingRounds[i] < goalRound)
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

module.exports = {
    name: 'herolevelby',
    aliases: ['hlby', 'heroby', 'herby', 'hlvlby'],
    execute,
    botMessage: undefined,
    interaction: undefined,
};
