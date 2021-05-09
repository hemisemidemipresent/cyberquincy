const AnyOrderParser = require('../parser/any-order-parser');
const OptionalParser = require('../parser/optional-parser');

const HeroParser = require('../parser/hero-parser');
const RoundParser = require('../parser/round-parser');
const MapDifficultyParser = require('../parser/map-difficulty-parser');
const HeroLevelParser = require('../parser/hero-level-parser');

const ReactionChain = require('../helpers/reactor/reaction_chain');
const EmojiReactor = require('../helpers/reactor/emoji_reactor');
const SingleTextParser = require('../helpers/reactor/single_text_parser');

const Heroes = require('../helpers/heroes');

const gHelper = require('../helpers/general.js');

function execute(message, args) {
    if (args.length == 1 && args[0] == 'help') {
        return message.channel.send(
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
        new EmojiReactor('hero', Guilds.EMOJIS_SERVER, parsed.hero),
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
        new EmojiReactor(
            'map_difficulty',
            Guilds.EMOJIS_SERVER,
            parsed.map_difficulty
        )
    );
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!herolevelby help` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function displayHeroPlacementRounds(userQueryMessage, results) {
    const heroPlacementRound = calculateHeroPlacementRound(
        results.hero,
        results.goal_round,
        results.desired_hero_level,
        results.map_difficulty
    );

    let startingRounds = []
    if (heroPlacementRound == -Infinity)
        startingRounds = [6, 10, 13, 21, 30, 40];
    else
        startingRounds = gHelper
            .range(1, 8)
            .map((addend) => heroPlacementRound + addend)
            .filter((r) => r <= results.goal_round);

    REACTIONS = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];

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
    
        const embed = new Discord.MessageEmbed()
            .setDescription(description)
            .addField('Place on round', rounds.join('\n'), true)
            .addField(`Pay on r${results.goal_round}`, costs.join('\n'), true)
            .setFooter(`Click an emoji to see more starting rounds: 0=(6—>10), 1=(11—>20), ... , 9=(91—>100)`)
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
    
        let botMessage = await userQueryMessage.channel.send(embed);
        return reactLoop(botMessage);
    }

    function reactLoop(botMessage) {
        // Lays out predefined reactions
        for (var i = 0; i < REACTIONS.length; i++) {
            if (i < Math.floor(heroPlacementRound / 10)) continue;
            botMessage.react(REACTIONS[i]);
        }

        // Read author reaction (time limit specified below in milliseconds)
        // and respond with appropriate action
        botMessage.createReactionCollector(
            (reaction, user) =>
                user.id === userQueryMessage.author.id &&
                REACTIONS.includes(reaction.emoji.name),
            { time: 20000 }
        ).once('collect', (reaction) => {
            if (!REACTIONS.includes(reaction.emoji.name)) return;

            const tensPlace = parseInt(reaction.emoji.name.charAt(0));

            let leftRound = tensPlace * 10 + 1;
            if (leftRound < 6) leftRound = 6;
            if (leftRound <= heroPlacementRound) leftRound = heroPlacementRound + 1;
            let rightRound = (tensPlace + 1) * 10;
            if (rightRound > results.goal_round) rightRound = results.goal_round;
            startingRounds = gHelper.range(leftRound, rightRound);

            displayHeroLevels();
        });
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

module.exports = {
    name: 'herolevelby',
    aliases: ['hlby', 'heroby', 'herby', 'hlvlby'],
    execute,
};
