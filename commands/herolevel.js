const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
module.exports = {
    name: 'herolevel',
    aliases: ['hero', 'hl'],
    execute(message, args, client) {
        function level_cal(B16, xp_slope, diff_mult, heroname) {
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
            ]; //xp per hero level
            let D14 = Math.floor(B16 * diff_mult); //round8, level 1 price
            let D15 = D14 - 2 * 20 * diff_mult; //round9, level 1 price
            let p = [0, 0]; //0s are placeholder numbers to occupy indexing space
            for (i = 2; i < 21; i++) {
                p.push(Math.ceil(xp_per_level[i] * xp_slope)); //xp_slope is the xp "slope", i.e. how much xp needed per level multiplier
            }
            let y = [0, 0]; //y is the sum of all the previosu entries of p
            let sp = 0;
            for (i = 2; i < 21; i++) {
                for (j = 2; j < i + 1; j++) {
                    sp = sp + p[j];
                }
                y.push(sp);
                sp = 0;
            }

            let r = [0, D14, D15]; //r is round xp given to hero
            for (i = 3; i < 22; i++) {
                r.push(
                    r[i - 1] -
                        ((r[i - 2] - r[i - 1]) / diff_mult + 20) * diff_mult
                );
            }
            for (i = 22; i < 52; i++) {
                r.push(
                    r[i - 1] -
                        ((r[i - 2] - r[i - 1]) / diff_mult + 40) * diff_mult
                );
            }
            for (i = 52; i < 102; i++) {
                //might be broken
                r.push(
                    r[i - 1] -
                        ((r[i - 2] - r[i - 1]) / diff_mult + 90) * diff_mult
                );
            }
            let ooo = []; //final result array
            for (yeet = 1; yeet < 21; yeet++) {
                let ix = 1; //ix is the round that the hero gets the level to
                let reee = 1; //reee, and the while loop help by continuously increasing the xp until it can afford the level
                while (reee > 0) {
                    reee = r[ix] + y[yeet]; //yeet is the hero level number
                    ix++;
                }
                if (ix > 100) {
                    ooo.push('>100');
                } else {
                    ooo.push(ix - 1);
                }
            }
            const embed = new Discord.MessageEmbed()
                .setTitle(heroname)
                .setDescription(
                    'This shows which round the hero will reach which level'
                )
                .addField('level 1', `r${ooo[0]}`, true)
                .addField('level 2', `r${ooo[1]}`, true)
                .addField('level 3', `r${ooo[2]}`, true)
                .addField('level 4', `r${ooo[3]}`, true)
                .addField('level 5', `r${ooo[4]}`, true)
                .addField('level 6', `r${ooo[5]}`, true)
                .addField('level 7', `r${ooo[6]}`, true)
                .addField('level 8', `r${ooo[7]}`, true)
                .addField('level 9', `r${ooo[8]}`, true)
                .addField('level 10', `r${ooo[9]}`, true)
                .addField('level 11', `r${ooo[10]}`, true)
                .addField('level 12', `r${ooo[11]}`, true)
                .addField('level 13', `r${ooo[12]}`, true)
                .addField('level 14', `r${ooo[13]}`, true)
                .addField('level 15', `r${ooo[14]}`, true)
                .addField('level 16', `r${ooo[15]}`, true)
                .addField('level 17', `r${ooo[16]}`, true)
                .addField('level 18', `r${ooo[17]}`, true)
                .addField('level 19', `r${ooo[18]}`, true)
                .addField('level 20', `r${ooo[19]}`, true)
                .setColor(colour);
            return embed;
        }
        const filter = (msg) => msg.author.id === `${message.author.id}`;
        if (!args[0] && !args[1] && !args[2]) {
            message.channel
                .send(
                    'Please select hero and type the number into chat\n1 - quincy\n2 - gwen\n3 - obyn\n4 - jones\n5 - ezili\n6 - ben\n7 - churchill\n8 - pat\n9 - adora'
                )
                .then(() => {
                    message.channel
                        .awaitMessages(filter, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time'],
                        })
                        .then((collected) => {
                            let f = collected.first().content;
                            if (isNaN(f) || f < 1 || f > 9) {
                                return message.channel.send(
                                    'sorry, please specify a valid hero number next time. run the command again'
                                );
                            }
                            if (f == 1) {
                                var xp_slope = 1;
                                var heroname = 'Quincy';
                            } else if (f == 2) {
                                var xp_slope = 1;
                                var heroname = 'Gwen';
                            } else if (f == 3) {
                                var xp_slope = 1;
                                var heroname = 'Obyn';
                            } else if (f == 4) {
                                var xp_slope = 1;
                                var heroname = 'Striker Jones';
                            } else if (f == 5) {
                                var xp_slope = 1.425;
                                var heroname = 'Ezili';
                            } else if (f == 6) {
                                var xp_slope = 1.5;
                                var heroname = 'Benjamin';
                            } else if (f == 7) {
                                var xp_slope = 1.8;
                                var heroname = 'Churchill';
                            } else if (f == 8) {
                                var xp_slope = 1.425;
                                var heroname = 'Pat';
                            } else if (f == 9) {
                                var xp_slope = 1.8;
                                var heroname = 'Adora';
                            }

                            message.channel
                                .send(
                                    'Please type the starting round in the chat'
                                )
                                .then(() => {
                                    message.channel
                                        .awaitMessages(filter, {
                                            maxMatches: 1,
                                            time: 10000,
                                            errors: ['time'],
                                        })
                                        .then((collect) => {
                                            let g = collect.first().content;
                                            if (isNaN(g) || g < 1 || g > 100) {
                                                return message.channel.send(
                                                    'sorry, please specify a valid round next time. run the commands again'
                                                );
                                            } else if (g <= 21) {
                                                var B16 =
                                                    10 * g * g + 10 * g - 20;
                                            } else if (g <= 51) {
                                                var B16 =
                                                    20 * g * g - 400 * g + 4180;
                                            } else {
                                                g -= 51;
                                                var B16 =
                                                    5 *
                                                    (9 * g * g +
                                                        351 * g +
                                                        7502);
                                            }

                                            message.channel
                                                .send(
                                                    'Please select map difficulty and type the number into the chat\n1 - beginner\n2 - intermediate\n3 - advanced\n4 - expert'
                                                )
                                                .then(() => {
                                                    message.channel
                                                        .awaitMessages(filter, {
                                                            maxMatches: 1,
                                                            time: 10000,
                                                            errors: ['time'],
                                                        })
                                                        .then((collectt) => {
                                                            let h = collectt.first()
                                                                .content;
                                                            if (
                                                                isNaN(h) ||
                                                                h < 1 ||
                                                                h > 4
                                                            ) {
                                                                return message.channel.send(
                                                                    'sorry, please specify a valid difficulty next time. run the command again'
                                                                );
                                                            }
                                                            let diff_mult =
                                                                0.1 * h + 0.9;
                                                            let embed = level_cal(
                                                                B16,
                                                                xp_slope,
                                                                diff_mult,
                                                                heroname
                                                            );
                                                            message.channel.send(
                                                                embed
                                                            );
                                                        });
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
                            message.channel.send(
                                `You took too long to answer!`
                            );
                        });
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
            } else if (args[0].includs('be')) {
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
                    'Please specify a valid hero name!'
                );
            }
            if (isNaN(args[1]) || args[1] < 1 || args[1] > 100) {
                return message.channel.send(
                    'Please provide a valid start round number from 1 to 100'
                );
            }
            let g = args[1];
            if (g <= 21) {
                var B16 = 10 * g * g + 10 * g - 20;
            } else if (g <= 51) {
                var B16 = 20 * g * g - 400 * g + 4180;
            } else {
                g -= 51;
                var B16 = 5 * (9 * g * g + 351 * g + 7502);
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
            let diff_mult = 0.1 * h + 0.9;
            let embed = level_cal(B16, xp_slope, diff_mult, heroname);
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
                collector.on('end', (collected) => {
                    console.log(`Collected ${collected.size} items`);
                });
            });
        }
    },
};
