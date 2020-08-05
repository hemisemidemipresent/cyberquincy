const Discord = require('discord.js');
const { colour } = require('../1/config.json');
module.exports = {
    name: 'herolevel',
    aliases: ['hl', 'hero', 'her', 'hlvl'],
    execute(message) {
        const xp_per_level = [
            0,
            0,
            180,
            460,
            1000,
            1860,
            3280,
            5180,
            8320,
            9380,
            13620,
            16380,
            14400,
            16650,
            14940,
            16380,
            17820,
            19260,
            20700,
            16470,
            17280,
        ];
        const heroes = [
            'Quincy',
            'Gwen',
            'Obyn',
            'Striker',
            'Ezili',
            'Ben',
            'Churchill',
            'Pat',
            'Adora',
            'Brickell',
        ];
        const xpSlopeArr = [1, 1, 1, 1, 1.425, 1.5, 1.8, 1.425, 1.8, 1.425];
        function level_cal(round, xpCurve, diffMultiplier, heroname) {
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
            let tempArr = [0, 0];
            for (i = 2; i <= 20; i++) {
                tempArr.push(Math.ceil(xp_per_level[i] * xpCurve));
            }
            let justPlacedCostArr = [
                0,
                Math.floor(processedRound * diffMultiplier),
            ]; // the total cost of upgrading to a level when placed
            for (level = 2; level <= 20; level++) {
                justPlacedCostArr.push(
                    justPlacedCostArr[level - 1] + tempArr[level]
                );
            }
            let sumOftempArr = [0, 0]; // we need an array where each index is the sum of all prev. coreeesponding indexes of tempArr
            for (i = 2; i <= 20; i++) {
                let tempSum = 0;
                for (j = 0; j <= i; j++) {
                    tempSum += tempArr[j];
                }
                sumOftempArr.push(tempSum);
            }
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
            //console.log(xpCurve, processedRound, diffMultiplier);
            //console.log(roundArr)
            let finalArr = []; // the round where the hero reaches level 1 is the round it gets placed
            for (level = 1; level < 21; level++) {
                let heroCost = 1; //cost of levelling up
                let levelUpRound = round; //round used for calulcations, -1 because the increment is after while loop
                while (heroCost > 0) {
                    heroCost = sumOftempArr[level] + roundArr[levelUpRound];
                    //console.log(heroCost);
                    levelUpRound++;
                }
                if (levelUpRound > 100) {
                    // if the hero wont level up until round 100
                    finalArr.push('>100');
                } else {
                    finalArr.push(levelUpRound - 1);
                }
            }
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
                .setColor(colour);
            return embed;
        }
        const heroEmojiIDs = [
            '734951814016794645',
            '734953281830387882',
            '734953281205436456',
            '734953662446567554',
            '734953631048138851',
            '734954248105623633',
            '734953812762034278',
            '734955619697688587',
            '734953700551950427',
            '734953612924420107',
        ];
        const difficultyEmojiIDs = [
            '734966523487322202',
            '734966523352973362',
            '734966523575140423',
            '734966523575140423',
            '734966521822183475',
        ];
        message.channel
            .send('react with the hero you want to choose!')
            .then((msg) => {
                for (i = 0; i < heroEmojiIDs.length; i++) {
                    msg.react(
                        client.guilds.cache
                            .get('614111055890612225') // this is the server with the emojis the bot uses
                            .emojis.cache.get(heroEmojiIDs[i])
                    );
                }
                let collector = msg
                    .createReactionCollector(
                        (reaction, user) =>
                            user.id === message.author.id &&
                            (reaction.emoji.name === 'Quincy' ||
                                reaction.emoji.name === 'Gwen' ||
                                reaction.emoji.name === 'Obyn' ||
                                reaction.emoji.name === 'StrikerJones' ||
                                reaction.emoji.name === 'PatFusty' ||
                                reaction.emoji.name === 'Adora' ||
                                reaction.emoji.name === 'Churchill' ||
                                reaction.emoji.name === 'Brickell' ||
                                reaction.emoji.name === 'Benjamin' ||
                                reaction.emoji.name === 'Ezili'),
                        { time: 20000 } // might turn into function to check later
                    )
                    .once('collect', (reaction) => {
                        const chosen = reaction.emoji.name;
                        let heroID = 0;
                        if (chosen === 'Quincy') {
                            heroID = 0;
                        } else if (chosen === 'Gwen') {
                            heroID = 1;
                        } else if (chosen === 'Obyn') {
                            heroID = 2;
                        } else if (chosen === 'StrikerJones') {
                            heroID = 3;
                        } else if (chosen === 'PatFusty') {
                            heroID = 4;
                        } else if (chosen === 'Adora') {
                            heroID = 5;
                        } else if (chosen === 'Churchill') {
                            heroID = 6;
                        } else if (chosen === 'Brickell') {
                            heroID = 7;
                        } else if (chosen === 'Benjamin') {
                            heroID = 8;
                        } else if (chosen === 'Ezili') {
                            heroID = 9;
                        }
                        const heroname = heroes[heroID];
                        const xpCurve = xpSlopeArr[heroID];

                        collector.stop();
                        message.channel
                            .send('Please type the starting round in the chat')
                            .then(() => {
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
                                        if (
                                            isNaN(round) ||
                                            round < 1 ||
                                            round > 100
                                        ) {
                                            return message.channel.send(
                                                'Sorry, please specify a valid round next time. Run the commands again'
                                            );
                                        }

                                        message.channel
                                            .send(
                                                'Please react with the map difficulty'
                                            )
                                            .then((msg) => {
                                                for (
                                                    i = 0;
                                                    i <
                                                    difficultyEmojiIDs.length;
                                                    i++
                                                ) {
                                                    msg.react(
                                                        client.guilds.cache
                                                            .get(
                                                                '614111055890612225'
                                                            ) // this is the server with the emojis the bot uses
                                                            .emojis.cache.get(
                                                                difficultyEmojiIDs[
                                                                    i
                                                                ]
                                                            )
                                                    );
                                                }
                                                let collector = msg
                                                    .createReactionCollector(
                                                        (reaction, user) =>
                                                            user.id ===
                                                                message.author
                                                                    .id &&
                                                            (reaction.emoji
                                                                .name ===
                                                                'Beginner' ||
                                                                reaction.emoji
                                                                    .name ===
                                                                    'Intermediate' ||
                                                                reaction.emoji
                                                                    .name ===
                                                                    'Advanced' ||
                                                                reaction.emoji
                                                                    .name ===
                                                                    'Expert'),
                                                        { time: 20000 }
                                                    )
                                                    .once(
                                                        'collect',
                                                        (reaction) => {
                                                            const chosen =
                                                                reaction.emoji
                                                                    .name;
                                                            let difficultyID = 0;
                                                            if (
                                                                chosen ===
                                                                'Beginner'
                                                            ) {
                                                                difficultyID = 1;
                                                            } else if (
                                                                chosen ===
                                                                'Intermediate'
                                                            ) {
                                                                difficultyID = 2;
                                                            } else if (
                                                                chosen ===
                                                                'Advanced'
                                                            ) {
                                                                difficultyID = 3;
                                                            } else if (
                                                                chosen ===
                                                                'Expert'
                                                            ) {
                                                                difficultyID = 4;
                                                            }
                                                            collector.stop();

                                                            let diffMultiplier =
                                                                0.1 *
                                                                    difficultyID +
                                                                0.9;
                                                            message.channel.send(
                                                                `${round},${xpCurve},${diffMultiplier},${heroname}`
                                                            );
                                                            let embed = level_cal(
                                                                round,
                                                                xpCurve,
                                                                diffMultiplier,
                                                                heroname
                                                            );
                                                            message.channel.send(
                                                                embed
                                                            );
                                                        }
                                                    );
                                            });
                                    });
                            });
                    });
            });
    },
};
