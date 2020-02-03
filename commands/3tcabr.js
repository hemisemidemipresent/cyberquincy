const { colour } = require('../config.json');
const Discord = require('discord.js');
const fs = require('fs');
const t = require('../3tcabr.json');
module.exports = {
	name: '3tcabr',
	description: 'checks 3tcabr',
	execute(message, args, client) {
		if (isNaN(args[0])) {
			if (args[0] == 'check') {
				for (let k = 0; k < t.length; k++) {
					let u = t[k]['Upgrades'].split(',');
					let tower1 = t[k]['Tower 1'];
					let tower2 = t[k]['Tower 2'];
					let tower3 = t[k]['Tower 3'];
					let t1, t2, t3, u1, u2, u3;
					for (i = 1; i < 4; i++) {
						if (tower1 == args[2 * i - 1]) {
							t1 = true;
							break;
						} else {
							t1 = false;
						}
					}
					for (i = 1; i < 4; i++) {
						if (tower2 == args[2 * i - 1]) {
							t2 = true;
							break;
						} else {
							t2 = false;
						}
					}
					for (i = 1; i < 4; i++) {
						if (tower3 == args[2 * i - 1]) {
							t3 = true;
							break;
						} else {
							t3 = false;
						}
					}
					for (i = 1; i < 4; i++) {
						if (u[0] == args[2 * i]) {
							u1 = true;
							break;
						} else {
							u1 = false;
						}
					}
					for (i = 1; i < 4; i++) {
						if (u[1] == args[2 * i]) {
							u2 = true;
							break;
						} else {
							u2 = false;
						}
					}
					for (i = 1; i < 4; i++) {
						if (u[2] == args[2 * i]) {
							u3 = true;
							break;
						} else {
							u3 = false;
						}
					}
					if (t1 && t2 && t3 && u1 && u2 && u3) {
						return message.channel.send('This Combo has been done before!');
					}
				}
				return message.channel.send('not done before!');
			} else {
				return message.channels.send(
					'please specify a valid number to access a particular 3tcabr combo (e.g. q!3tcabr 3 shows 3rd 3tcabr combo). to check if your combo has been done before, use q!3tcabr check <tower 1> <tower 1 path> <tower 2> <tower 2 path> <tower 3> <tower 3 path>'
				);
			}
		}
		let k = args[0];
		if (k > t.length) {
			return message.channel.send(`there is only ${t.length} combos left`);
		}
		let u = t[k]['Upgrades'].split(',');
		let tower1 = t[k]['Tower 1'];
		let tower2 = t[k]['Tower 2'];
		let tower3 = t[k]['Tower 3'];
		let embed = new Discord.RichEmbed()
			.setTitle(`Combo #${args[0]}`)
			.addField(tower1, u[0])
			.addField(tower2, u[1])
			.addField(tower3, u[2])
			.setColor(colour);
		message.channel.send(embed);
	}
};
