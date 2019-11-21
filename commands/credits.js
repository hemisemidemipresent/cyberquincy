const { prefix } = require('../config.json');
module.exports = {
	name: 'credits',
	description: 'List all of the people who helped (directly and indirectly)',
	aliases: ['cred','creds','cr'],
	usage: '[command name]',
	cooldown: 5,
	execute(message, args) {
		const data = [];

		if (!args.length) {
			data.push('Here\'s a list of all the people who helped:');
            data.push('\*\*Firstly: NK\*\* for getting me interested into btd. if this didnt happen, i dont think i could reach any of the people who i am about to list below\n\nNext, i would like to thank all the people who were the there early to add this bot to their server, and spread it to their friends. Special thanks goes to Mr. Spicy, for being the first to adverise this bot to many of his friends. even if you do not like Mr. Spicy (or think he is a cheater,etc. im personally not sure about that but it could be true but i havent heard from it much), Mr. Spicy helped me advertise this bot. this is kind of how the bot began to start getting attention.\n\n\*\*i would like to thank all the people who tested this:\*\*\nDark Bloon, KEA HD, davek333, ZeciDeMiiEuro, ZecroZhang, Ｂｅｅ０７, Block100, Flameboy. \nspecial thanks to people who \*\*invited\*\* this bot to their servers (currently highest is 1000+, try and break the record and you\'ll ne featured here) the current record is held by \"BTD BATTLES + BTD6/5\" \`\`so if you can beat that and grave yourself onto this line of code into immortality, go ahead and dm hnngggrrrr on the bot support server.\`\` \n\n\*\*all the people who advertised this server:\*\* Mr. Spicy, zEduard, ZeciDeMiiDeEuro, **GoldenSoldier (advertised it and added it to a 1000+ member server, helped the bot server)**, RandomMATTYT\`\`<you can add your name here for about forever if you can advertise this guy>\`\`. these people helped a lot and they have their names engraved here. \n\n\*\*Lastly, the btd6 factual community\*\* (exephur [provided info for this bot], topper64 [advanced popology good], rmlgaming [provided info for this bot], countless others) for providing valuable info to feed the bot\n\nThank you and those are the credits');
			data.push(`\n~hnngggrrrr\n`);
			data.push('join this server for support and info about this bot as well as when the bot is offline! https://discord.gg/8agRm6c')
			return message.author.send(data, { split: true })
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.reply('I\'ve sent you a DM with the creds');
				})
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					message.reply('it seems like I can\'t DM you!');
				});
		}

		
	},
};