const RoundParser = require('../parser/round-parser');

async function execute(message) {
    await message.channel.send('React with the hero you want to choose!')
    hero = await collectReaction(msg, 'heroes');
    await message.channel.send('Please type the starting round in the chat')
    round = await collectRound();
    await message.channel.send('Please react with the map difficulty')
    mapDifficulty = await collectReaction(msg, 'map_difficulties');

    finalArr = calculateHeroLevels(hero, round, mapDifficulty)

    const embed = new Discord.MessageEmbed()
    .setTitle(heroname)
    .setDescription(
        'This shows which round the hero will reach which level'
    )
    .addField('level 1', `r${finalArr[0]}`, true)
    .addField('level 2', `r${finalArr[1]}`, true)
    .addField('level 3', `r${finalArr[2]}`, true)
    .addField('level 4', `r${finalArr[3]}`, true)
    .addField('level 5', `r${finalArr[4]}`, true)
    .addField('level 6', `r${finalArr[5]}`, true)
    .addField('level 7', `r${finalArr[6]}`, true)
    .addField('level 8', `r${finalArr[7]}`, true)
    .addField('level 9', `r${finalArr[8]}`, true)
    .addField('level 10', `r${finalArr[9]}`, true)
    .addField('level 11', `r${finalArr[10]}`, true)
    .addField('level 12', `r${finalArr[11]}`, true)
    .addField('level 13', `r${finalArr[12]}`, true)
    .addField('level 14', `r${finalArr[13]}`, true)
    .addField('level 15', `r${finalArr[14]}`, true)
    .addField('level 16', `r${finalArr[15]}`, true)
    .addField('level 17', `r${finalArr[16]}`, true)
    .addField('level 18', `r${finalArr[17]}`, true)
    .addField('level 19', `r${finalArr[18]}`, true)
    .addField('level 20', `r${finalArr[19]}`, true)
    .setColor(cyber);
return embed;
}

async function collectReaction(msg, emojis) {
    emojis = emojis[Guilds.WHAT_IS_THIS_SERVER][emojis]
    for (const hero in emojis) {
        msg.react(
            client.guilds.cache
                .get(Guilds.WHAT_IS_THIS_SERVER) // this is the server with the emojis the bot uses
                .emojis.cache.get(emojis[hero])
        );
    }
    let collector = msg
        .createReactionCollector(
            (reaction, user) =>
                user.id === message.author.id && 
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
    /*
    these caluclations are emulations of the BTD6 Index levelling sheet: https://docs.google.com/spreadsheets/d/1tkDPEpX51MosjKCAwduviJ94xoyeYGCLKq5U5UkNJcU/edit#gid=0
    I had to expose everything from it using this: https://docs.google.com/spreadsheets/d/1p5OXpBQATUnQNw4MouUjyfE0dxGDWEkWBrxFTAS2uSk/edit#gid=0
    */
    let processedRound;
    if (round <= 21) {
        processedRound = 10 * round * round + 10 * round - 20;
    } else if (round <= 51) {
        processedRound = 20 * round * round - 400 * round + 4180;
    } else {
        processedRound = 45 * round * round - 2925 * round + 67930;
    }

    heroSpecificLevelingMultiplier = Constants.HERO_LEVELING_MODIFIERS[hero.toUpperCase()]
    
    const heroXpToGetLevel = Constants.BASE_HERO_XP_TO_GET_LEVEL.map((baseXp) =>
        Math.ceil(
            baseXp * heroSpecificLevelingMultiplier
        )
    );
    totalXpAtLevel = 0;
    const heroXpAtLevel = heroXpToGetLevel.map(xpToGetLevel =>
        totalXpAtLevel = totalXpAtLevel + xpToGetLevel
    )
    
    let roundArr = [
        0,
        Math.floor(processedRound * diffMultiplier),
        Math.floor(processedRound * diffMultiplier) -
            40 * diffMultiplier,
    ];
    for (i = 3; i < 22; i++) {
        roundArr.push(
            roundArr[i - 1] * 2 - roundArr[i - 2] - 20 * diffMultiplier
        );
    }
    for (i = 22; i < 52; i++) {
        roundArr.push(
            roundArr[i - 1] -
                ((roundArr[i - 2] - roundArr[i - 1]) / diffMultiplier +
                    40) *
                    diffMultiplier
        );
    }
    for (i = 52; i < 102; i++) {
        //might be broken
        roundArr.push(
            roundArr[i - 1] -
                ((roundArr[i - 2] - roundArr[i - 1]) / diffMultiplier +
                    90) *
                    diffMultiplier
        );
    }
    let finalArr = []; // the round where the hero reaches level 1 is the round it gets placed
    for (level = 1; level < 21; level++) {
        let heroCost = 1; //cost of levelling up
        let levelUpRound = round; //round used for calulcations, -1 because the increment is after while loop
        while (heroCost > 0) {
            heroCost = sumOftempArr[level] + roundArr[levelUpRound];
            levelUpRound++;
        }
        if (levelUpRound > 101) {
            // if the hero wont level up until round 100
            finalArr.push('>100');
        } else {
            finalArr.push(levelUpRound - 1);
        }
    }
    return finalArr;
}

module.exports = {
    name: 'herolevel',
    aliases: ['hl', 'hero', 'her', 'hlvl'],
    execute,
};
