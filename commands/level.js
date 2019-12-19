const Discord = require('discord.js');
module.exports = {
	name: 'herolevel',
	execute(message, args, client) {
		const filter = (msg) => msg.author.id === `${message.author.id}`;
		message.channel
			.send(
				'Please select hero and type the number into chat\n1 - quincy\n2 - gwen\n3 - obyn\n4 - jones\n5 - ezili\n6 - ben\n7 - churchill\n8 - pat\n9 - adora'
			)
			.then(() => {
				message.channel
					.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: [ 'time' ] })
					.then((collected) => {
						let f = collected.first().content;
						if (isNaN(f) || f < 1 || f > 9) {
							return message.channel.send('sorry, please specify a hero');
						}
						if (f > 0 && f < 5) {
							var B15 = 1;
						} else if (f > 4 && f < 7) {
							var B15 = 1.8;
						} else if (f == 6) {
							var B15 = 1.5;
						} else if (f == 5 || f == 8) {
							var B15 = 1.425;
						}
						message.channel.send('Please type the starting round in the chat').then(() => {
							message.channel
								.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: [ 'time' ] })
								.then((collect) => {
									let g = collect.first().content;
									if (isNaN(g) || f < 1 || f > 100) {
										return message.channel.send('sorry, please specify a valid round');
									} else if (g <= 21) {
										var B16 = (10 * g * g) + (10 * g) - 20;
									}else if(g<=51){
                                        var B16 = 20*g*g-400*g+4180
                                    }
                                    message.channel.send('Please select map difficulty and type the number into the chat\n1 - beginner\n2 - intermediate\n3 - advanced\n4 - expert').then(()=>{
                                        message.channel.awaitMessages(filter, { maxMatches: 1, time: 10000, errors: [ 'time' ] })
                                        .then((collectt)=>{
                                            let h = collectt.first().content;
                                            if(isNaN(h)||h<1||h>4){
                                                return message.channel.send('sorry, please specify a valid difficulty');
                                            } let B17 = 0.1*h+0.9;
                                            message.channel.send(`${B15}\n${B16}\n${B17}`)
                                        })
                                    })
								});
						});
					})
					.catch((collected) => {
						message.channel.send(`You took too long!`);
					});
			});
	}
};
