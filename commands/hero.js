const Discord = require('discord.js');
const { cyber, red } = require('../jsons/colours.json');
const fetch = require('node-fetch');
const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json';
const settings = { method: 'Get' };
const aliases = [
    [
        'adora',
        'ad',
        'ador',
        'ado',
        'dora',
        'priestess',
        'high',
        'highpriestess',
    ],
    [
        'benjamin',
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
    ['admiral-brickell', 'brick', 'brickell', 'brickel'],
    [
        'captain-churchill',
        'churchill',
        'c',
        'ch',
        'chirch',
        'church',
        'captain',
        'tank',
        'winston',
        'hill',
    ],
    ['ezili', 'e', 'ez', 'voodo', 'vm', 'ezi', 'ezil', 'voodoo'],
    [
        'gwendolin',
        'g',
        'gwendolyn',
        'gwendolyn',
        'scientist',
        'gwendolin',
        'gwend',
        'gwendo',
        'fire',
        'isabgirl',
    ],
    ['striker-jones', 'sj', 'striker', 'bones', 'jones', 'biker', 'who'],
    ['obyn-greenfoot', 'obyn', 'greenfoot', 'o', 'ocyn'],
    [
        'pat-fusty',
        'p',
        'pat',
        'pf',
        'fusty',
        'patfusty',
        'frosty',
        'snowman',
        'fusticator',
        'patfrosty',
        'thicc',
    ],
    [
        'quincy',
        'q',
        'cyberquincy',
        'quincey',
        'quinc',
        'quonc',
        'quonce',
        'quoncy',
        'cyber',
        'furry',
        'cq',
    ],
];
module.exports = {
    name: '<hero>',
    aliases: [
        'adora',
        'ad',
        'ador',
        'ado',
        'dora',
        'priestess',
        'high',
        'highpriestess',
        'benjamin',
        'b',
        'dj',
        'ben',
        'benny',
        'boi',
        'benjammin',
        'beenjammin',
        'yeet',
        'boy',
        'admiral-brickell',
        'brick',
        'brickell',
        'brickel',
        'captain-churchill',
        'churchill',
        'c',
        'ch',
        'chirch',
        'church',
        'captain',
        'tank',
        'winston',
        'hill',
        'ezili',
        'ez',
        'voodo',
        'vm',
        'ezi',
        'ezil',
        'voodoo',
        'gwendolin',
        'gwen',
        'gwendolyn',
        'gwendolyn',
        'scientist',
        'gwendolin',
        'gwend',
        'gwendo',
        'fire',
        'isabgirl',
        'striker-jones',
        'sj',
        'striker',
        'bones',
        'jones',
        'biker',
        'who',
        'obyn-greenfoot',
        'obyn',
        'greenfoot',
        'o',
        'ocyn',
        'pat-fusty',

        'pat',
        'pf',
        'fusty',
        'patfusty',
        'frosty',
        'snowman',
        'fusticator',
        'patfrosty',
        'thicc',
        'quincy',

        'cyberquincy',
        'quincey',
        'quinc',
        'quonc',
        'quonce',
        'quoncy',
        'cyber',
        'furry',
        'cq',
    ],
    execute(message, args) {
        const newArgs = message.content.slice(2).split(/ +/);
        const commandName = newArgs.shift().toLowerCase();
        let name = findName(commandName);
        if (!args) {
            let errorEmbed = new Discord.MessageEmbed()
                .setColor(red)
                .setDescription(
                    `Please specify a level for the hero\ne.g. ${message.content} 20`
                );
            return message.channel.send(errorEmbed);
        }
        let level = parseInt(args[0]);
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                let object = json[`${name}`].upgrades[level - 1];

                if (!object) {
                    let errorEmbed = new Discord.MessageEmbed()
                        .setColor(red)
                        .setDescription(
                            `Please specify a level for the hero\ne.g. q!${name} 20`
                        );
                    return message.channel.send(errorEmbed);
                }
                const embed = new Discord.MessageEmbed()
                    .setTitle(`${name} level ${level}`)
                    .addField("cost/'xp'", `${object.xp}`)
                    .addField('desc', `${object.notes}`)
                    .setColor(cyber)
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

                    collector.on('collect', () => {
                        msg.delete();
                    });
                });
            });
    },
};
function findName(commandName) {
    for (let i = 0; i < aliases.length; i++) {
        let heroAliasSet = aliases[i];
        for (let j = 0; j < heroAliasSet.length; j++) {
            if (commandName == heroAliasSet[j]) {
                return heroAliasSet[0];
            }
        }
    }
    return;
}
