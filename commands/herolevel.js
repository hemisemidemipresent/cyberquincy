const RoundParser = require('../parser/round-parser');
const Emojis = require('../jsons/emojis.json')

async function execute(message) {
    heroMessage = await message.channel.send('React with the hero you want to choose!')
    hero = await collectReaction(message, heroMessage, 'heroes');
    return;
    await message.channel.send('Please type the starting round in the chat')
    round = await collectRound();
    await message.channel.send('Please react with the map difficulty')
    mapDifficulty = await collectReaction(msg, 'map_difficulties');

    finalArr = calculateHeroLevels(hero, round, mapDifficulty)

    const embed = new Discord.MessageEmbed()
        .setTitle(`${h.toTitleCase(hero)} Leveling Chart`)
        .addField('Level', h.range(1, 20).join("\n"), true)
        .addField('Round', finalArr.slice(1).join("\n"), true)
        .setColor(cyber);

    return embed;
}

async function collectReaction(ogMessage, reactMessage, emojiGroup) {
    emojis = Emojis[Guilds.WHAT_IS_THIS_SERVER.toString()][emojiGroup]
    console.log(client.guilds.cache)
    for (const hero in emojis) {
        reactMessage.react(
            client.guilds.cache
                .get(Guilds.WHAT_IS_THIS_SERVER) // this is the server with the emojis the bot uses
                .emojis.cache.get(emojis[hero])
        );
    }
    let collector = await reactMessage
        .createReactionCollector(
            (reaction, user) =>
                user.id === ogMessage.author.id && 
                emojis.includes(reaction.emoji.id),
            { time: 20000 } // might turn into function to check later
        )
        .once('collect', (reaction) => {
            collectedEmoji = Object.keys(emojis).find(
                (key) => emojis[key] === reaction.emoji.id
            );
            
            collector.stop();

            return collectedEmoji;
        });
}

async function collectRound() {
    const filter = (msg) =>
        msg.author.id === `${message.author.id}`;

    message.channel
        .awaitMessages(filter, {
            max: 1,
            time: 10000,
            errors: ['time'],
        })
        .then((collected) => {
            let round = collected.first().content;
            let parsed = CommandParser.parse(
                round,
                new RoundParser('ALL'),
            );
            if (parsed.hasErrors()) {
                throw parsed.parsingErrors[0];
            }
            return round;
        });
}

function calculateHeroLevels(hero, round, mapDifficulty) {
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
