const fetch = require('node-fetch');
const url = 'http://topper64.co.uk/nk/btd6/dat/rounds.json';
const settings = { method: 'Get' };
const Discord = require('discord.js');

module.exports = {
    name: 'roundlength',
    aliases: ['length', 'long', 'time'],
    execute(message, args) {
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
        if (!args[0] || isNaN(args[0])) {
            let errorEmbed = new Discord.MessageEmbed()
                .setDescription(
                    'q!roundlength <start round> <end round> (shows the longest round)'
                )
                .setColor('#ff0000');
            return message.channel.send(errorEmbed);
        }
        let startRound = parseInt(args[0]);
        let endRound = parseInt(args[1]);
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                if (!args[1] || isNaN(args[1])) {
                    return message.channel.send(
                        `${args[0]} is ${getLength(args[0], json.reg)}s`
                    );
                }
                let longestRound = 0; // the round number
                let longestLength = 0; // the round length
                let temp = 0;
                for (i = startRound; i <= endRound; i++) {
                    temp = getLength(i, json.reg);
                    if (temp > longestLength) {
                        longestLength = temp;
                        longestRound = i;
                    }
                }
                message.channel.send(
                    `The longest round from ${startRound} to ${endRound} is ${longestRound} with a length of ${longestLength}s`
                );
            });
    },
};
