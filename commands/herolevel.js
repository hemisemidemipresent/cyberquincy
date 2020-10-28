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
    heroLevels = calculateHeroLevels(results['hero'], results['round'], results['map_difficulty'])

    const embed = new Discord.MessageEmbed()
        .setTitle(`${h.toTitleCase(results['hero'])} Leveling Chart`)
        .setDescription(`Placed: **R${results['starting']}**\nMaps: **${h.toTitleCase(results['map_difficulty'])}**`)
        .addField('Level', h.range(1, 20).join("\n"), true)
        .addField('Round', heroLevels.slice(1).join("\n"), true)
        .setColor(colours['cyber']);

    message.channel.send(embed);
}

function calculateHeroLevels(hero, round, mapDifficulty) {
    return h.range(0, 20)
    heroSpecificLevelingMultiplier = Constants.HERO_LEVELING_MODIFIERS[hero.toUpperCase()]

    /*
    these caluclations are emulations of the BTD6 Index levelling sheet: https://docs.google.com/spreadsheets/d/1tkDPEpX51MosjKCAwduviJ94xoyeYGCLKq5U5UkNJcU/edit#gid=0
    I had to expose everything from it using this: https://docs.google.com/spreadsheets/d/1p5OXpBQATUnQNw4MouUjyfE0dxGDWEkWBrxFTAS2uSk/edit#gid=0
    */    
    const heroXpToGetLevel = Constants.BASE_HERO_XP_TO_GET_LEVEL.map((baseXp) =>
        Math.ceil(
            baseXp * heroSpecificLevelingMultiplier
        )
    );
    totalXpAtLevel = 0;
    const totalHeroXpAtLevel = heroXpToGetLevel.map(xpToGetLevel =>
        totalXpAtLevel = totalXpAtLevel + xpToGetLevel
    )

    let processedRound;
    if (round <= 21) {
        processedRound = 10 * round * round + 10 * round - 20;
    } else if (round <= 51) {
        processedRound = 20 * round * round - 400 * round + 4180;
    } else {
        processedRound = 45 * round * round - 2925 * round + 67930;
    }
    processedRound *= heroSpecificLevelingMultiplier
    processedRound = Math.floor(processedRound)

    let xpGainedOnRound = [
        0,
        processedRound,
        processedRound - 40 * heroSpecificLevelingMultiplier,
    ];

    for (i = 3; i < 22; i++) {
        xpGainedOnRound.push(
            xpGainedOnRound[i - 1] * 2 - xpGainedOnRound[i - 2] - 20 * heroSpecificLevelingMultiplier
        );
    }
    for (i = 22; i < 52; i++) {
        xpGainedOnRound.push(
            xpGainedOnRound[i - 1] -
                ((xpGainedOnRound[i - 2] - xpGainedOnRound[i - 1]) / heroSpecificLevelingMultiplier +
                    40) *
                    heroSpecificLevelingMultiplier
        );
    }
    for (i = 52; i <= 101; i++) {
        //might be broken
        xpGainedOnRound.push(
            xpGainedOnRound[i - 1] -
                ((xpGainedOnRound[i - 2] - xpGainedOnRound[i - 1]) / heroSpecificLevelingMultiplier +
                    90) *
                    heroSpecificLevelingMultiplier
        );
    }

    let roundToAcquireHeroLevelAt = [];
    for (level = 0; level <= 20; level++) {
        let heroCost = 1; // Placeholder to enter the while loop
        let roundOfXpGain = round - 1; //round used for calculating the xp gained on a given round
        while (heroCost > 0) {
            heroCost = totalHeroXpAtLevel[level] + xpGainedOnRound[++roundOfXpGain];
        }
        if (roundOfXpGain > 100) {
            // if the hero wont level up until round 100
            roundToAcquireHeroLevelAt.push('>100');
        } else {
            roundToAcquireHeroLevelAt.push(roundOfXpGain);
        }
    }
    return roundToAcquireHeroLevelAt;
}

module.exports = {
    name: 'herolevel',
    aliases: ['hl', 'hero', 'her', 'hlvl'],
    execute,
};
