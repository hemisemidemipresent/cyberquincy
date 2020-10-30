const Emojis = require('../jsons/emojis.json')

const AnyOrderParser = require('../parser/any-order-parser.js');
const OptionalParser = require('../parser/optional-parser.js');

const HeroParser = require('../parser/hero-parser.js');
const RoundParser = require('../parser/round-parser');
const MapDifficultyParser = require('../parser/map-difficulty-parser.js');

function execute(message, args) {
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

    results = {}
    if (parsed.hero) results['hero'] = parsed.hero
    if (parsed.round) results['starting'] = parsed.round
    if (parsed.map_difficulty) results['map_difficulty'] = parsed.map_difficulty

    methodChain = [
        (message, chain, results) => collectReaction(message, chain, results, 'hero'),
        (message, chain, results) => collectRound(message, chain, results, 'starting'),
        (message, chain, results) => collectReaction(message, chain, results, 'map_difficulty'),
        (message, chain, results) => displayHeroLevels(message, results),
    ]

    // Remove first function from array, call method, include new shortened array as call argument
    methodChain.shift()(message, methodChain, results)
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

async function collectReaction(message, chain, results, emojiGroup) {
    // Continue to the next interaction if this one has been satisfied through command arguments
    if (results[emojiGroup]) {
        chain.shift()(message, chain, results)
        return
    }

    reactMessage = await message.channel.send(`React with the ${emojiGroup.split('_').join(' ')} you want to choose!`)
    emojis = Emojis[Guilds.EMOJIS_SERVER.toString()][emojiGroup]
    for (const hero in emojis) {
        reactMessage.react(
            client.guilds.cache
                .get(Guilds.EMOJIS_SERVER) // this is the server with the emojis the bot uses
                .emojis.cache.get(emojis[hero])
        );
    }
    let collector = reactMessage
        .createReactionCollector(
            (reaction, user) =>
                user.id === message.author.id && 
                Object.values(emojis).includes(reaction.emoji.id),
            { time: 20000 } // might turn into function to check later
        )
    
    collector.once('collect', (reaction) => {
            collectedEmoji = Object.keys(emojis).find(
                (key) => emojis[key] === reaction.emoji.id
            );
            
            collector.stop();

            results[emojiGroup] = collectedEmoji

            // Invoke first method in chain and remove it from the array
            // Then pass in the new chain with the first element having been removed
            chain.shift()(message, chain, results)
        });
}

async function collectRound(message, chain, results, roundType) {
    // Continue to the next interaction if this one has been satisfied through command arguments
    if (results[roundType]) {
        chain.shift()(message, chain, results)
        return;
    }

    await message.channel.send(`Please type the ${roundType} round in the chat`)
    const sameUserFilter = (msg) =>
        msg.author.id === `${message.author.id}`;

    message.channel
        .awaitMessages(sameUserFilter, {
            max: 1,
            time: 10000,
            errors: ['time'],
        })
        .then((collected) => {
            let round = collected.first().content;
            let parsed = CommandParser.parse(
                [round],
                new RoundParser('ALL'),
            );
            if (parsed.hasErrors()) {
                throw parsed.parsingErrors[0];
            }
            results[roundType] = parsed.round;
            chain.shift()(message, chain, results)
        });
}

function displayHeroLevels(message, results) {
    heroLevels = calculateHeroLevels(results['hero'], results['starting'], results['map_difficulty'])

    const embed = new Discord.MessageEmbed()
        .setTitle(`${h.toTitleCase(results['hero'])} Leveling Chart`)
        .setDescription(`Placed: **R${results['starting']}**\nMaps: **${h.toTitleCase(results['map_difficulty'])}**`)
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
