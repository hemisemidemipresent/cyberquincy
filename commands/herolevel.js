const AnyOrderParser = require('../parser/any-order-parser.js');
const OptionalParser = require('../parser/optional-parser.js');

const HeroParser = require('../parser/hero-parser.js');
const RoundParser = require('../parser/round-parser');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');

const ReactionChain = require('../reactor/reaction_chain')
const EmojiReactor = require('../reactor/emoji_reactor')
const SingleTextParser = require('../reactor/single_text_parser')

function execute(message, args) {
    console.log(message)
    if (args.length == 1 && args[0] == 'help') {
        return message.channel.send('Type `q!herolevel` and follow the instructions');
    }

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(
            new OptionalParser(
            new HeroParser()
            ),
            new OptionalParser(
                new RoundParser('ALL')
            ),
            new OptionalParser(
                new MapDifficultyParser()
            )
        )
    );

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors)
    }

    ReactionChain.process(
        message,
        (message, results) => displayHeroLevels(message, results),
        new EmojiReactor('hero', Guilds.EMOJIS_SERVER, parsed.hero),
        new SingleTextParser(new RoundParser('ALL'), 'starting', parsed.round),
        new EmojiReactor('map_difficulty', Guilds.EMOJIS_SERVER, parsed.map_difficulty),
    )
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

function displayHeroLevels(message, results) {
    console.log(results)
    heroLevels = calculateHeroLevels(results.hero, results.starting, results.map_difficulty)

    const embed = new Discord.MessageEmbed()
        .setTitle(`${h.toTitleCase(results.hero)} Leveling Chart`)
        .setDescription(`Placed: **R${results.starting}**\nMaps: **${h.toTitleCase(results.map_difficulty)}**`)
        .addField('Level', h.range(1, 20).map(lvl => `L${lvl}`).join("\n"), true)
        .addField('Round', heroLevels.slice(1).join("\n"), true)
        .setColor(colours['cyber']);

    message.channel.send(embed);
}

function calculateHeroLevels(hero, startingRound, mapDifficulty) {
    heroSpecificLevelingMultiplier = Constants.HERO_LEVELING_MODIFIERS[hero.toUpperCase()]
    mapSpecificLevelingMultiplier = Constants.HERO_LEVELING_MAP_DIFFICULTY_MODIFIERS[mapDifficulty.toUpperCase()]

    roundVsLevelMatrix = [[]] // Level 0 instantiated
    roundVsLevelMatrix.push(
        fillLevel1CostArray(startingRound, mapSpecificLevelingMultiplier)
    )

    for (level = 2; level <= 20; level++) {
        levelCostArray = [Infinity] // round 0
        for (round = 1; round <= 100; round++) {
            totalCostToGetLevel = Constants.BASE_HERO_COST_TO_GET_LEVEL[level] * heroSpecificLevelingMultiplier
            levelCostArray.push(
                totalCostToGetLevel + roundVsLevelMatrix[level - 1][round]
            )
        }
        roundVsLevelMatrix.push(
            levelCostArray
        )
    }

    roundForLevelUpTo = [0, startingRound].concat( // Levels 0 and 1
        // Take the levelCostArray for level 2-20...
        roundVsLevelMatrix.slice(2).map(levelCostArray => {
            // Find the first level at which the cost to level the hero up is 0 or less
            levelOrNotFound = levelCostArray.findIndex(cost => cost <= 0)
            return levelOrNotFound == -1 ? '—' : levelOrNotFound
        })
    )

    return roundForLevelUpTo;
}

function fillLevel1CostArray(startingRound, mapSpecificLevelingMultiplier) {
    baseCost = null;
    if (startingRound <= 21) {
        baseCost = (10 * startingRound * startingRound) + (10 * startingRound) - 20
    } else if (startingRound <= 51) {
        baseCost = (20 * startingRound * startingRound) - (400 * startingRound) + 4180
    } else {
        baseCost = (45 * startingRound * startingRound) - (2925 * startingRound) + 67930
    }
    
    level1CostArray = [Infinity] // round 0
    level1CostArray.push( // round 1
        Math.floor(
            baseCost * mapSpecificLevelingMultiplier
        )
    )
    level1CostArray.push( //round 2
        Math.floor(
            level1CostArray[1] - (2 * 20 * mapSpecificLevelingMultiplier)
        )
    )
    
    level1RoundGroupAddend = null;

    for (round = 3; round <= 100; round++) {
        if (round <= 21) {
            level1RoundGroupAddend = 20
        } else if (round <= 51) {
            level1RoundGroupAddend = 40
        } else {
            level1RoundGroupAddend = 90
        }

        rm1 = level1CostArray[round - 1]
        rm2 = level1CostArray[round - 2]
        mapWeightedDifference = (rm2 - rm1) / mapSpecificLevelingMultiplier

        level1CostArray.push(
            rm1 - ((mapWeightedDifference + level1RoundGroupAddend) * mapSpecificLevelingMultiplier)
        )
    }

    return level1CostArray;
}

module.exports = {
    name: 'herolevel',
    aliases: ['hl', 'hero', 'her', 'hlvl'],
    execute,
};
