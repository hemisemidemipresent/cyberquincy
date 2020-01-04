const t = require('../tier.json');
const { colour } = require('../config.json');
const Discord = require('discord.js');
module.exports = {
	name: 'tier',
	description: 'shows tier list',
	aliases: [ 'tl' ],
	usage: 'q!tier <version>',
	execute(message, args, client) {
		if (!args[0]) {
			return message.channel.send(`${t.t[3]}\nyou can use q!tier <version>`)
		}
		let v = parseInt(args[0]) - 11;
		if (!v){
			return message.channel.send('Please specify a proper version! not every version has a tier list!');
		}
    let cont = t.t[v]
    if(!cont){
      return message.channel.send('Please specify a proper version! not every version has a tier list!');
    }
		return message.channel.send(`${cont}`);
	}
};
