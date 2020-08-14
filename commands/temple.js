const Discord = require('discord.js');
const { cyber, vtsg, temple } = require('../jsons/colours.json');
const t = require('../jsons/temple.json');
module.exports = {
    name: 'temple',
    aliases: ['t', 'tsg', 'sg', 'monkeygod', 'god', 'totmg', 'vtsg'],
    execute(message, args, client) {
        const newArgs = message.content.slice(1).split(/ +/);

        const commandName = newArgs.shift().toLowerCase();

        /*if (!args[0] || !args[1] || !args[2] || !args[3]) {
      return message.channel.send(
        "the format is q!temple <amount sacrificed in primary> <amount sacrificed in military> <amount sacrificed in magic> <amount sacrificed in support>"
      );
    }*/ if (
            commandName.includes('v')
        ) {
            const VTSGembed = new Discord.MessageEmbed()
                .setDescription(
                    '**There Can Only Be One**\nThe monkey knowledge is triggered by upgrading a Super Monkey to 5xx, with maximum sacrifices at both tier 4 and tier 5, while the other two tier 5 Super Monkeys are also on screen (don\'t sacrifice them!). They combine into a 555 Super Monkey, commonly (but unofficially) called the "Vengeful True Sun God" or VTSG.'
                )
                .addField(
                    '\u200b',
                    'This has the following buffs compared to a TSG:\n```fix\nsunblast buffed: +50d```\n```css\nall other attacks (including subtowers) buffed: ×3d (applied after additive buffs)```'
                )
                .setThumbnail(
                    'https://vignette.wikia.nocookie.net/b__/images/0/00/555-SuperMonkey.png/revision/latest/scale-to-width-down/310?cb=20190522011421&path-prefix=bloons'
                )
                .setColor(vtsg);
            return message.channel.send(VTSGembed);
        }
        if (commandName == 'tsg') {
            const TSGembed = new Discord.MessageEmbed()
                .setDescription(
                    '500 True Sun God has a sunblast attack (15d, 20p, 0.06s, 65r, normal type)\nA True Sun God benefits from sacrifices in almost exactly the same way as a Temple, this time from all four categories. It keeps all attacks and buffs it had as a Temple — it simply gets a second copy of attacks. The TSG versions of an attack therefore have subtle differences to help them be visually distinct'
                )
                .addField(
                    'Primary',
                    '```fix\ngold-blade: blades are equally spaced starting from 22.5° (instead of 0°)``````fix\ngold-glaive: arcs clockwise (instead of anticlockwise)```'
                )
                .addField(
                    'Military',
                    '```fix\nmoab-missile: slightly faster projectile speed``````fix\ngold-spectre-1: figure-infinite flight path``````fix\ngold-spectre-2: figure-eight flight path``````css\nprojectile speed and size buffs do stack, but are capped at +100%```'
                )
                .addField(
                    'Magic',
                    '```fix\narcane-blast: slightly wider spread``````fix\npush: none, a TSG can only have one push attack (if magic is sacrificed both times, the highest level is used)```'
                )
                .addField(
                    'Support',
                    '```fix\nbuff: none, but the buff from TSG sacrifices is considered distinct to the buff from temple sacrifices, and so can stack together (even if it is a separate temple)```'
                )
                .setThumbnail(
                    'https://vignette.wikia.nocookie.net/b__/images/6/67/500-SuperMonkey.png/revision/latest/scale-to-width-down/310?cb=20190522023538&path-prefix=bloons'
                )
                .setColor(temple);
            return message.channel.send(TSGembed);
        }
        const filter = (msg) => msg.author.id === `${message.author.id}`;

        message.channel
            .send(
                'Which category would you like to find out more? Type the number in the chat.\n1. primary\n2. military\n3. magic\n4. support'
            )
            .then(() => {
                message.channel
                    .awaitMessages(filter, {
                        max: 1,
                        time: 10000,
                        errors: ['time'],
                    })
                    .then((collect1) => {
                        let sacrificeNum = collect1.first().content;
                        if (
                            isNaN(sacrificeNum) ||
                            sacrificeNum < 1 ||
                            sacrificeNum > 4
                        ) {
                            return message.channel.send(
                                'Please use a valid number next time! Run the command again'
                            );
                        }
                        message.channel
                            .send(
                                'How much money did you sacrifice? Type the amount in the chat'
                            )
                            .then(() => {
                                message.channel
                                    .awaitMessages(filter, {
                                        max: 1,
                                        time: 10000,
                                        errors: ['time'],
                                    })
                                    .then((collect2) => {
                                        let cash = collect2.first().content;
                                        if (cash < 0 || isNaN(cash)) {
                                            return message.channel.send(
                                                'Please specify a valid amount of cash to spend on towers to sacrifice! Run the command again'
                                            );
                                        }
                                        let difficultyArr = [
                                            'primary',
                                            'military',
                                            'magic',
                                            'support',
                                        ];
                                        let level;
                                        if (cash < 0) {
                                            level = -1;
                                        } else if (cash < 300) {
                                            level = 0;
                                        } else if (cash < 1000) {
                                            level = 1;
                                        } else if (cash < 2000) {
                                            level = 2;
                                        } else if (cash < 4000) {
                                            level = 3;
                                        } else if (cash < 7500) {
                                            level = 4;
                                        } else if (cash < 10000) {
                                            level = 5;
                                        } else if (cash < 15000) {
                                            level = 6;
                                        } else if (cash < 25000) {
                                            level = 7;
                                        } else if (cash < 50000) {
                                            level = 8;
                                        } else {
                                            level = 9;
                                        }
                                        let data =
                                            t[`${sacrificeNum}`][`${level}`];
                                        let embed = new Discord.MessageEmbed()
                                            .setTitle(
                                                `$${cash} of ${
                                                    difficultyArr[
                                                        sacrificeNum - 1
                                                    ]
                                                } towers sacrificed to the temple`
                                            )
                                            .addField(
                                                `${
                                                    difficultyArr[
                                                        sacrificeNum - 1
                                                    ]
                                                } buffs`,
                                                `\`\`\`fix\n${data}\`\`\``
                                            );
                                        message.channel.send(embed);
                                    });
                            });
                    });
            });
    },
};
