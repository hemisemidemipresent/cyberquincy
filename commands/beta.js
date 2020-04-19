const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
const fetch = require('node-fetch');
const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json';
const settings = { method: 'Get' };
module.exports = {
    name: 'test',
    aliases: ['te', 'beta', 'hmm', 'mm', 'meadow', 'monkeymeadow'],
    execute(message, args, client) {
        const embed = new Discord.RichEmbed()
            .setTitle('test the new delete reaction thingy')
            .setDescription(
                '🌳🌳🟩🟩🟩🟩🟩🟩🟩🌳🌳🌳\n🌳🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🌳\n🟩🟩🟩🟩🟩🟩🧱🧱🧱🧱🟩🟩\n🟩🟩🟩🟩🟩🟩🧱🟩🟩🧱🟩🟩\n🧱🧱🧱🧱🧱🧱🧱🧱🧱🧱🟩🟩\n🟩🟩🟩🟩🟩🟩🧱🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩🟩🧱🟩🧱🧱🧱🟩\n🟩🟩🟩🧱🧱🧱🧱🧱🧱🟩🧱🟩\n🟩🟩🟩🧱🟩🟩🧱🟩🟩🟩🧱🟩\n🟩🟩🟩🧱🧱🧱🧱🟩🟩🟩🧱🟩\n🌳🟩🟩🟩🟩🟩🟩🟩🟩🟩🧱🌳\n🌳🌳🟩🟩🟩🟩🟩🟩🟩🟩🧱🌳'
            )
            .setColor(colour)
            .setFooter('beta map - monkey meadow');
        message.channel.send(embed).then((msg) => {
            msg.react('❌');
            let filter = (reaction, user) => {
                return (
                    reaction.emoji.name === '❌' &&
                    user.id === message.author.id
                );
            };
            const collector = msg.createReactionCollector(filter, {
                time: 20000,
            });

            collector.on('collect', (reaction, reactionCollector) => {
                msg.delete();
            });
            collector.on('end', (collected) => {
                console.log(`Collected ${collected.size} items`);
            });
        });
    },
};
