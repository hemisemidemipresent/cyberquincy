const Discord = require('discord.js');
const { colour } = require('../shh/config.json');
const fetch = require('node-fetch');
const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json';
const settings = { method: 'Get' };
module.exports = {
    name: 'benjamin',
    description: 'benjamin upgrades',
    aliases: [
        'b',
        'dj',
        'ben',
        'benny',
        'boi',
        'best',
        'benjammin',
        "benjammin'",
        'yeet',
        'boy',
    ],
    usage: 'q!benjamin <level>',
    execute(message, args, client) {
        if (!args) {
            return message.channel.send(
                `Please specify a level \`\`e.g.: ${message.content} 4\`\``
            );
        }
        let name = 'benjamin';
        let level = parseInt(args[0]);
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                let object = json[`${name}`].upgrades[level - 1];

                if (!object)
                    return message.channel.send(
                        'Please specify a valid hero level!'
                    );
                hardcost = Math.round((object.cost * 1.08) / 5) * 5;
                const embed = new Discord.RichEmbed()
                    .setTitle(`${name} level ${level}`)
                    .addField("cost/'xp'", `${object.xp}`)
                    .addField('desc', `${object.notes}`)
                    .setColor(colour)
                    .setFooter(
                        'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
                    );
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
            });
    },
};
