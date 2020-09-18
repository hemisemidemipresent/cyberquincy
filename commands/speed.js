const Discord = require('discord.js');
const { cyber, red } = require('../jsons/colours.json');
module.exports = {
    name: 'speed',
    aliases: ['s', 'rbs'],
    description: 'calculates the speed of speeds, even in freeplay',
    execute(message, args) {
        if (!args[0]) {
            let errorEmbed = new Discord.MessageEmbed()
                .setTitle(`Please specify a bloon/round`)
                .setDescription('example: q!speed moab 100')
                .setColor(red);
            return message.channel.send(errorEmbed);
        }
        //rounds
        const bln = args[0].toLowerCase(); // short for "bloon"
        const round = args[1];
        if (round < 1 || !isNaN(bln) || isNaN(round)) {
            let errorEmbed = new Discord.MessageEmbed()
                .setTitle(`Please specify a proper bloon/round`)
                .setDescription('example: q!speed moab 100')
                .setColor(red);
            return message.channel.send(errorEmbed);
        }
        let speed = 0;
        if (bln === 'moab' || bln === 'red' || bln == 'lead') {
            speed = 3;
        } else if (bln === 'bfb') {
            speed = 1;
        } else if (bln === 'zomg' || bln === 'bad') {
            speed = 0.5;
        } else if (bln === 'ddt' || bln === 'purple') {
            speed = 9;
        } else if (bln.includes('ceram')) {
            speed = 8;
        } else if (bln === 'rainbow') {
            speed = 7;
        } else if (bln === 'green' || bln === 'zebra' || bln === 'black') {
            speed = 5;
        } else if (bln === 'white') {
            speed = 6;
        } else if (bln === 'yellow') {
            speed = 10;
        } else if (bln === 'pink') {
            speed = 11;
        } else if (bln === 'blue') {
            speed = 2;
        } else {
            let errorEmbed = new Discord.MessageEmbed()
                .setTitle(`Please specify a proper bloon`)
                .setDescription('example: q!speed moab 100')
                .setColor(red);
            return message.channel.send(errorEmbed);
        }
        let incPercent = 0;
        if (round > 80 && round < 101) {
            incPercent = 0.02 * (round - 80) + 1;
        } else if (round > 100 && round < 125) {
            incPercent = 0.05 * (round - 100) + 1.4;
        } else if (round > 124 && round < 152) {
            incPercent = 0.2 * (round - 125) + 2.65;
        } else if (round > 151) {
            incPercent = 0.5 * (round - 152) + 7.05;
        }
        let actualSpeed = Math.trunc(speed * incPercent * 100) / 100; // 2 d.p.
        if (round > 80) {
            let speedEmbed = new Discord.MessageEmbed()
                .setTitle(`${bln}`)
                .addField('speed', `${actualSpeed} units`, true)
                .addField('at round', round, true)
                .setColor(cyber)
                .setFooter('3 units is the speed of a red speed at round one');
            return message.channel.send(speedEmbed);
        } else {
            let speedEmbed = new Discord.MessageEmbed()
                .setTitle(`${bln}`)
                .addField('speed', `${speed} units`, true)
                .addField('at round', round, true)
                .setColor(cyber)
                .setFooter('3 units is the speed of a red at round one');
            return message.channel.send(speedEmbed);
        }
    },
};
