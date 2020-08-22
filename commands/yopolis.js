const Discord = require('discord.js');
const { cyber } = require('../jsons/colours.json');
module.exports = {
    name: 'monkeyopolis',
    aliases: ['mp', 'yopolis'],
    execute(message, args) {
        if (!args) {
            return message.channel.send(
                '# The usage is:\nq!mp <total farm cost> <total farm amount>',
                { code: 'md' }
            );
        }
        if (isNaN(args[0])) {
            return message.channel.send(
                'Please Specify a **number** for the cost of the farm'
            );
        }
        let farmcount = 1;
        if (args[1] && !isNaN(args[1])) {
            farmcount = args[1];
        }
        let money = 300 * Math.floor(args[0] / 2000);
        let price = farmcount * 5000;
        let even = Math.ceil(price / money);
        const mpembed = new Discord.MessageEmbed()
            .setTitle('Monkeyopolis Simulator')
            .setColor(cyber)
            .addField('amount sacrificed', `${args[0]}`)
            .addField('farms sacrificed', `${farmcount}`)
            .addField('Money produced in a round', `${money}`, true)
            .addField('cost of upgrade', `${price}`, true)
            .addField('rounds until breaking even', `${even}`, true);
        message.channel.send(mpembed);
    },
};
