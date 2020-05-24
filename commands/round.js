const fetch = require('node-fetch');
const url = 'http://topper64.co.uk/nk/btd6/dat/rounds.json';
const settings = { method: 'Get' };
const round2 = require('../jsons/round2.json');
const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
const r1 = require('../jsons/rounds.json');

module.exports = {
    name: 'round',
    description: 'tells you about the rounds (below 100)',
    aliases: ['r'],
    execute(message, args) {
        if (!args[0] || isNaN(args[0])) {
            let errorEmbed = new Discord.MessageEmbed()
                .setDescription(
                    'use **q!round <round number>**\nFor example: q!round 68'
                )
                .addField('about ABR rounds', 'use q!abr <round> instead')
                .setColor('#ff0000');
            return message.channel.send(errorEmbed);
        }
        function getLength(round, arrayOfRounds) {
            let roundArray = arrayOfRounds[round];
            let longest = 0;
            let end = 0;
            for (i = 0; i < roundArray.length; i++) {
                end = parseInt(roundArray[i][3]);
                if (end > longest) {
                    longest = end;
                }
            }
            return longest / 60; //btd6 is 60fps game
        }
        function getData(round, arrayOfRounds) {
            let roundArray = arrayOfRounds[round];
            let output = '';
            for (i = 0; i < roundArray.length; i++) {
                output += `\n${roundArray[i][1]} ${roundArray[i][0]}`;
            }
            return output;
        }

        let round = parseInt(args[0]);
        if (round < 1) {
            let embed = new Discord.MessageEmbed()
                .setTitle('Please specify a round > 0')
                .setDescription('Quincy has no experience in these rounds')
                .setColor('#ff0000');
            return message.channel.send(embed);
        } else if (round > 100) {
            let embed = new Discord.MessageEmbed()
                .setTitle('Please specify a round <= 100')
                .setDescription(
                    "All rounds above 100 (for most people's sake) are random!"
                )
                .addField(
                    'I hear you cry about 163, 263, 200',
                    '["fixed" sandbox rounds](https://www.reddit.com/r/btd6/comments/9omw65/almost_every_single_special_freeplay_round/?utm_source=amp&utm_medium=&utm_content=post_body)'
                )
                .setColor('#ff0000');
            return message.channel.send(embed);
        }
        let xp = 0;
        let totalxp = 0;
        if (round < 21) {
            xp = 20 * round + 20;
            totalxp = 40 + 50 * (round - 1) + 10 * Math.pow(round - 1, 2);
        } else if (round > 20 && round < 51) {
            xp = 40 * (round - 20) + 420;
            totalxp = 4600 + 440 * (round - 20) + 20 * Math.pow(round - 20, 2);
        } else {
            xp = (round - 50) * 90 + 1620;
            totalxp =
                35800 + 1665 * (round - 50) + 45 * Math.pow(round - 50, 2);
        }
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                let object = json.reg;
                let length = getLength(args[0], object);
                let data = getData(args[0], object);
                let sumOfData = r1[`r${round}`];
                let rbe = round2[round].rbe;
                const roundEmbed = new Discord.MessageEmbed()
                    .setTitle(`round ${round}`)
                    .setDescription(`${sumOfData}\n{${data}\n}`)

                    .addField('round length', `${length}`, true)
                    .addField('RBE', `${rbe}`, true)
                    .addField('xp earned in that round', `${xp}`, true)
                    .addField(
                        'total xp if you started at round 1',
                        `${totalxp}`
                    )
                    .addField(
                        '**if:**',
                        'you are not in freeplay (then divide xp by 10 for value) AND\n2) you are playing beginner maps (intermediate +10%, advanced +20%, expert +30%)'
                    )
                    .setFooter('for more data on money use q!income')
                    .setColor(colour);
                message.channel.send(roundEmbed);
            });
    },
};
