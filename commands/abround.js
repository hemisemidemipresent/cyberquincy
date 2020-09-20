const url = 'http://topper64.co.uk/nk/btd6/dat/rounds.json';
const fetch = require('node-fetch');
const settings = { method: 'Get' };
const { cyber, red } = require('../jsons/colours.json');
module.exports = {
    name: 'abround',
    description:
        'tells you about the abr rounds (below 100 cos freeplay abr is the same as normal)',
    aliases: ['abr'],
    execute(message, args) {
        if (!args[0] || isNaN(args[0])) {
            let errorEmbed = new Discord.MessageEmbed()
                .setDescription(
                    'use **q!round <round number>**\nFor example: q!round 68'
                )
                .addField('about ABR rounds', 'use q!abr <round> instead')
                .setColor(red);
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
                .setColor(red);
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
                .setColor(red)
                .setFooter('abr rounds >100 is normal freeplay FYI');
            return message.channel.send(embed);
        }
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                let object = json.alt;
                let length = getLength(args[0], object);
                let data = getData(args[0], object);
                const roundEmbed = new Discord.MessageEmbed()
                    .setTitle(`round ${round}`)
                    .setDescription(`{${data}\n}`)

                    .addField('round length', `${length}`, true)

                    .setFooter('for more data on money use q!income or q!cash')
                    .setColor(cyber);
                message.channel.send(roundEmbed);
            });
    },
};
