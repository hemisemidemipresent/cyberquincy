const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
module.exports = {
    name: 'herolevel',
    aliases: ['hero', 'hl', 'level', 'herr', 'her'],
    execute(message, args, client) {
        let xp_per_level = [
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
        const hero_xp_curves = [1, 1, 1, 1, 1.425, 1.5, 1.8, 1.425, 1.8, 1.425];
        function level_cal(round, xp_slope, diffMultiplier, heroname) {
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
                tempArr.push(Math.ceil(xp_per_level[i] * xp_slope));
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
            //console.log(xp_slope, processedRound, diffMultiplier);
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
        const filter = (msg) => msg.author.id === `${message.author.id}`;
        if (!args[0] && !args[1] && !args[2]) {
            message.channel.send(
                'Please select hero and type the number into chat\n1 - quincy\n2 - gwen\n3 - obyn\n4 - jones\n5 - ezili\n6 - ben\n7 - churchill\n8 - pat\n9 - adora\n10 - brickell'
            );
            message.channel
                .awaitMessages(filter, {
                    max: 1,
                    time: 10000,
                    errors: ['time'],
                })

                .then((collected0) => {
                    const heroID = collected0.first().content;
                    if (isNaN(heroID) || heroID < 1 || heroID > 10) {
                        return message.channel.send(
                            'sorry, please specify a valid hero number next time. run the command again'
                        );
                    }
                    const xp_slope = hero_xp_curves[heroID - 1];
                    const heroname = heroes[heroID - 1];
                    message.channel
                        .send('Please type the starting round in the chat')
                        .then(() => {
                            message.channel
                                .awaitMessages(filter, {
                                    max: 1,
                                    time: 10000,
                                    errors: ['time'],
                                })
                                .then((collected1) => {
                                    let round = collected1.first().content;

                                    if (
                                        isNaN(round) ||
                                        round < 1 ||
                                        round > 100
                                    ) {
                                        return message.channel.send(
                                            'sorry, please specify a valid round next time. run the commands again'
                                        );
                                    }

                                    message.channel.send(
                                        'Please select map difficulty and type the number into the chat\n1 - beginner\n2 - intermediate\n3 - advanced\n4 - expert'
                                    );
                                    message.channel
                                        .awaitMessages(filter, {
                                            max: 1,
                                            time: 10000,
                                            errors: ['time'],
                                        })
                                        .then((collected2) => {
                                            let difficultyID = collected2.first()
                                                .content;
                                            if (
                                                isNaN(difficultyID) ||
                                                difficultyID < 1 ||
                                                difficultyID > 4
                                            ) {
                                                return message.channel.send(
                                                    'sorry, please specify a valid difficulty next time. run the command again'
                                                );
                                            }
                                            let diffMultiplier =
                                                0.1 * difficultyID + 0.9;
                                            let embed = level_cal(
                                                round,
                                                xp_slope,
                                                diffMultiplier,
                                                heroname
                                            );
                                            message.channel.send(embed);
                                        });
                                })
                                .catch((collectt) => {
                                    message.channel.send(
                                        `You took too long to answer!`
                                    );
                                });
                        })
                        .catch((collect) => {
                            message.channel.send(
                                `You took too long to answer!`
                            );
                        });
                })
                .catch((collected) => {
                    message.channel.send(`You took too long to answer!`);
                });
        } else {
            if (args[0].includes('qui')) {
                var xp_slope = 1;
                var heroname = args[0];
            } else if (args[0].includes('gw')) {
                var xp_slope = 1;
                var heroname = args[0];
            } else if (args[0].includes('ob')) {
                var xp_slope = 1;
                var heroname = args[0];
            } else if (args[0].includes('str') || args[0].includes('jo')) {
                var xp_slope = 1;
                var heroname = args[0];
            } else if (args[0].includes('ez')) {
                var xp_slope = 1.425;
                var heroname = args[0];
            } else if (args[0].includes('be')) {
                var xp_slope = 1.5;
                var heroname = args[0];
            } else if (args[0].includes('ch')) {
                var xp_slope = 1.8;
                var heroname = args[0];
            } else if (args[0].includes('pa')) {
                var xp_slope = 1.425;
                var heroname = args[0];
            } else if (args[0].includes('ad')) {
                var xp_slope = 1.8;
                var heroname = args[0];
            } else {
                return message.channel.send(
                    'Please specify a valid hero name! If you dont know the shortcut, just run ``q!herolevel``\n(shortcut is q!herolevel <heroname> <startround> <difficultyname>'
                );
            }
            if (isNaN(args[1]) || args[1] < 1 || args[1] > 100) {
                return message.channel.send(
                    'Please provide a valid start round number from 1 to 100! If you dont know the shortcut, just run ``q!herolevel``\n(shortcut is q!herolevel <heroname> <startround> <difficultyname>'
                );
            }
            let g = args[1];
            if (g <= 21) {
                var B9 = 10 * g * g + 10 * g - 20;
            } else if (g <= 51) {
                var B9 = 20 * g * g - 400 * g + 4180;
            } else {
                g -= 51;
                var B9 = 5 * (9 * g * g + 351 * g + 7502);
            }
            if (
                args[2].includes('eas') ||
                args[2].includes('beg') ||
                args[2] == 1
            ) {
                var h = 1;
            } else if (
                args[2].includes('int') ||
                args[2].includes('med') ||
                args[2] == 2
            ) {
                var h = 2;
            } else if (
                args[2].includes('adv') ||
                args[2].includes('har') ||
                args[2] == 3
            ) {
                var h = 3;
            } else if (
                args[2].includes('exp') ||
                args[2].includes('ext') ||
                args[2] == 4
            ) {
                var h = 4;
            }
            let diffMultiplier = 0.1 * h + 0.9;
            let embed = level_cal(B9, xp_slope, diffMultiplier, heroname);
            message.channel.send(embed).then((msg) => {
                msg.react('❌');
                let filter = (reaction, user) => {
                    return (
                        reaction.emoji.name === '❌' &&
                        user.id === message.author.id
                    );
                };
                const collector = msg.createReactionCollector(filter, {
                    time: 20000,
                });

                collector.on('collect', (reaction, reactionCollector) => {
                    msg.delete();
                });
            });
        }
    },
};
