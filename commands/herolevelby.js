const AnyOrderParser = require('../parser/any-order-parser');
const OptionalParser = require('../parser/optional-parser');

const HeroParser = require('../parser/hero-parser');
const RoundParser = require('../parser/round-parser');
const MapDifficultyParser = require('../parser/map-difficulty-parser');
const HeroLevelParser = require('../parser/hero-level-parser')

const ReactionChain = require('../reactor/reaction_chain');
const EmojiReactor = require('../reactor/emoji_reactor');
const SingleTextParser = require('../reactor/single_text_parser');

const Heroes = require('../helpers/heroes')

function execute(message, args) {
    if (args.length == 1 && args[0] == 'help') {
        return message.channel.send(
            'Type `q!herolevelby` and follow the instructions (you may also want to try `q!herolevel`)'
        );
    }

    const parsed = CommandParser.parse(
        args,
        // Make any of the available arguments optional to add in any order in the command args
        // Arguments that aren't entered will be gathered through the react-loop
        new AnyOrderParser(
            new OptionalParser(new HeroParser()),
            new OptionalParser(new RoundParser('ALL')),
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
        new SingleTextParser(new RoundParser('ALL'), 'goal', parsed.round),
        new SingleTextParser(new HeroLevelParser(), 'desired', parsed.hero_level),
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
        .addField('Type `q!herolevel help` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function displayHeroPlacementRounds(message, results) {
    heroPlacementRound = calculateHeroPlacementRound(
        results.hero,
        results.goal_round,
        results.desired_hero_level,
        results.map_difficulty
    );

    laterPlacementRounds = calculateLaterPlacementRounds(
        results.hero,
        heroPlacementRound,
        results.goal_round,
        results.desired_hero_level,
        results.map_difficulty,
    )

    rounds = []; costs = [];
    for (const round in laterPlacementRounds) {
        rounds.push(round)
        costs.push(
            h.numberAsCost(
                Math.ceil(laterPlacementRounds[round])
            )
        )
    }

    description = ""
    description += `to reach **lvl-${results.desired_hero_level}** `
    description += `by **r${results.goal_round}** `
    description += `on **${results.map_difficulty}** maps.`

    const embed = new Discord.MessageEmbed()
        .setDescription(description)
        .addField('Place on round', rounds.join("\n"), true)
        .addField(`Pay on r${results.goal_round}`, costs.join("\n"), true)
        .setColor(colours['cyber']);

    if (heroPlacementRound == -Infinity) {
        embed.setTitle(`Can't place ${h.toTitleCase(results.hero)} early enough`)
    } else {
        embed.setTitle(`Place ${h.toTitleCase(results.hero)} on R${heroPlacementRound}`)
    }

    message.channel.send(embed);
}

function calculateHeroPlacementRound(hero, goalRound, desiredHeroLevel, mapDifficulty) {
    // Uses binary-search to find the round that produces the highest non-negative value
    // (implying that the hero has JUST reached the desiredHeroLevel by the specified goalRound)
    roundForLevelUpTo = h.binaryLambdaSearch(
        6, // min possible placement round
        goalRound, // max possible placement round
        startingRound => {
            return costToUpgrade(hero, startingRound, goalRound, desiredHeroLevel, mapDifficulty)
        }
    )

    return roundForLevelUpTo;
}

function calculateLaterPlacementRounds(hero, freePlacementRound, goalRound, desiredHeroLevel, mapDifficulty) {
    if (freePlacementRound == -Infinity) startingRounds = [6, 10, 13, 21, 30, 40]
    else startingRounds = h.range(1, 8).map(addend => freePlacementRound + addend)
                                   .filter(r => r <= goalRound)

    placementRounds = {}
    for (var i = 0; i < startingRounds.length; i++) {
        placementRounds[startingRounds[i]] = 
            costToUpgrade(hero, startingRounds[i], goalRound, desiredHeroLevel, mapDifficulty)
    }

    return placementRounds
}

// The cost to upgrade the hero to the given desiredHeroLevel on the goalRound
// If it's 0 or negative, that means the level has been reached naturally
// If it's positive, it means the player needs to pay to get the level
function costToUpgrade(hero, startingRound, goalRound, desiredHeroLevel, mapDifficulty) {
    heroLevelingChart = Heroes.levelingChart(hero, startingRound, mapDifficulty)
    return heroLevelingChart[desiredHeroLevel][goalRound]
}

module.exports = {
    name: 'herolevelby',
    aliases: ['hlby', 'heroby', 'herby', 'hlvlby'],
    execute,
};
