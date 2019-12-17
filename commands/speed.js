const Discord = require('discord.js');
const { colour } = require('../config.json');
module.exports = {
	name: 'speed',
	aliases: [ 's', 'rbs' ],
	description: 'calculates the speed of bloons, even in freeplay',
	usage: '!speed <bloon/blimp> <round>',
	execute(message, args) {
		//rounds
		const b = args[0].toUpperCase();
		const btype = b.toLowerCase();
		let round = args[1];
		let round1 = round - 80;
		let round2 = round - 100;
		let round3 = round - 125;
		let round4 = round - 152;
		if (b === 'MOAB' || b === 'RED') {
			var bloon = 3;
		} else if (b === 'BFB') {
			var bloon = 1;
		} else if (b === 'ZOMG' || b === 'BAD') {
			var bloon = 0.5;
		} else if (b === 'DDT' || b === 'PURPLE') {
			var bloon = 9;
		} else if (b.includes('CERAM')) {
			var bloon = 8;
		} else if (b === 'RAINBOW') {
			var bloon = 7;
		} else if (b === 'GREEN' || b === 'ZEBRA' || b === 'BLACK') {
			var bloon = 5;
		} else if (b === 'WHITE') {
			var bloon = 6;
		} else if (b === 'YELLOW') {
			var bloon = 10;
		} else if (b === 'PINK') {
			var bloon = 11;
		} else if (b === 'BLUE') {
			var bloon = 2;
		} else {
			return message.channel.send('please specify a bloon, e.g. ``pink``');
		}
		//multiplier
		let m1 = 0.02 * round1;
		let m2 = 0.05 * round2;
		let m3 = 0.2 * round3;
		let m4 = 0.5 * round4;
		//percentage increase
		if (round > 80 && round < 101) {
			var pi = 1 + m1; //80 to 100
		} else if (round > 100 && round < 125) {
			//100 to 125
			var pi = 1 + m2 + 0.4;
		} else if (round > 124 && round < 152) {
			//125 to 152
			var pi = 1 + m3 + 0.4 + 1.25;
		} else if (round > 151) {
			var pi = 1 + m4 + 0.4 + 1.25 + 5.4;
		}
		var bhealth = Math.floor(bloon * pi);
		if (round > 80) {
			let embed = new Discord.RichEmbed()
				.setTitle(`${btype}`)
				.addField('speed', `${bhealth} RBS`)
				.addField('at round', round)
				.setColor(colour)
				.setFooter('3RBS is the speed of a red bloon at round one');
			return message.channel.send(embed);
		} else if (round < 1) {
			return message.channel.send('quincy has no experience in these rounds');
		} else if (round > 0 && round < 81) {
			let embed = new Discord.RichEmbed()
				.setTitle(`${btype}`)
				.addField('speed', `${bloon} RBS`)
				.addField('at round', round)
				.setColor(colour)
				.setFooter('3RBS is the speed of a red bloon at round one');
			return message.channel.send(embed);
		} else {
			if (b === 'MOAB' || 'BFB' || 'ZOMG' || 'DDT' || 'BAD') {
				let embed = new Discord.RichEmbed()
					.setTitle(`${b}`)
					.addField('speed', `${bloon} RBS`)
					.addField('at round', round)
					.setColor(colour)
					.setFooter('3RBS is the speed of a red bloon at round one');
				return message.channel.send(embed);
			}
		}
	}
};
