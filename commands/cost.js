const Discord = require('discord.js');
const t = require('../towers.json')
let to = ['dart', 'boomer', 'tack', 'glue', 'ice', 'bomb', 'sniper', 'heli', 'ace', 'sub', 'boat', 'mortar', 'ninja', 'super', 'wizard', 'alch', 'druid', 'engi', 'farm', 'spac', 'village']
module.exports = {
	name: 'cost',
	aliases: ['price', 'convert'],
	execute(message, args, client) {
		const filter = msg => msg.author.id === `${message.author.id}`;
		message.channel.send('Type the option number in chat:\n1. convert cost from a mode to another mode\n2. find the cost of a tower')
		message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] }).then(a => {
			let option = a.first().content;
			//convert monays
			if (option == 1) {
				message.channel.send('what is the mode of the cash that you are converting from?\n1.easy\n2.normal\n3.hard\n4.impoppable')
				message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] }).then(b => {
					let mode = b.first().content;
					message.channel.send('Please type the cash you want to convert in chat')
					message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] }).then(c => {
						let money = c.first().content;

						if (mode == 1) n = money / 0.85 / 5
						else if (mode == 2) n = money / 5
						else if (mode == 2) n = money / 1.08 / 5
						else if (mode == 2) n = money / 1.2 / 5
						let easy = n * 0.85
						let norm = n
						let hard = n * 1.08
						let impo = n * 1.2
						let arr = []
						arr.push(Math.round(easy) * 5)
						arr.push(Math.round(norm) * 5)
						arr.push(Math.round(hard) * 5)
						arr.push(Math.round(impo) * 5)
						const embed = new Discord.RichEmbed()
							.addField('easy', `${arr[0]}`, true)
							.addField('normal', `${arr[1]}`, true)
							.addField('hard', `${arr[1]}`, true)
							.addField('impoppable', `${arr[3]}`, true);
						message.channel.send(embed)
					})
				})
			} else if (option == 2) {
				let fembed = new Discord.RichEmbed()
					.setDescription('please type the tower **number** you want to find the cost of:')
				for (i = 0; i < to.length; i++) {
					fembed.addField(i, to[i], true)
				}
				message.channel.send(fembed)
				message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] }).then(tt => {
					let tu = tt.first().content
					let tower = t[`${to[tu]}`]
					if (isNaN(tu) || tu < 0 || tu > 20) return message.channel.send('invalid input')
					message.channel.send('please specify the path; e.g. 003')
					message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: ["time"] }).then(p => {
						let path = p.first().content
						let p1 = Math.floor(path / 100)
						path = path % 100
						let p2 = Math.floor(path / 10)
						path = path % 10
						let p3 = path

						if (p1 > 5 || p1 < 0 || p2 > 5 || p2 < 0 || p3 > 5 || p3 < 0) {
							return message.channel.send('please specify a proper path.')
						}
						let to1, to2, to3 = 0
						let cos;
						if (p1 !== 0) {
							for (i = 1; i < p1 + 1; i++) {
								cos = parseInt(tower[`s1${i}`].cost)
								to1 += cos
							}
						} if (p1 == 0) {
							to1 = 0
						}
						if (p2 !== 0) {
							for (i = 1; i < p2 + 1; i++) {
								cos = parseInt(tower[`s2${i}`].cost)
								to2 += cos
							}
						} if (p2 == 0) {
							to2 = 0
						}
						if (p3 !== 0) {
							for (i = 1; i < p3 + 1; i++) {
								cos = parseInt(tower[`s3${i}`].cost)
								to3 += cos
							}
						} if (p3 == 0) {
							to3 = 0
						}
						message.channel.send(`${parseInt(to1) + parseInt(to2) + parseInt(to3) + parseInt(tower.base.cost)} (in medium)`)
					})
				})
			}
		})
	}
};
