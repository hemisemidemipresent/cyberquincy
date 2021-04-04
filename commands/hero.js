const { cyber, red } = require('../jsons/colours.json');
const request = require('request');
const aliases = [
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

    [
        'gwendolin',
        'g',
        'gwen',
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
    ['ezili', 'e', 'ez', 'voodo', 'vm', 'ezi', 'ezil', 'voodoo'],
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
        'adora',
        'ad',
        'ador',
        'ado',
        'dora',
        'priestess',
        'high',
        'highpriestess',
    ],
    ['admiral-brickell', 'brick', 'brickell', 'brickel'],
    [
        'etienne',
        'etiene',
        'french',
        'etine',
        'etinne',
        'etenne',
        'et',
        'eti',
        'drone',
    ],
    ['sauda', 'saud', 'sau', '🥛']
];
const links = [
    'https://pastebin.com/raw/ASpHNduS',
    'https://pastebin.com/raw/rZYjbEhX',
    'https://pastebin.com/raw/hrH8q0bd',
    'https://pastebin.com/raw/x2WiKEWi',
    'https://pastebin.com/raw/cqaHnhgB',
    'https://pastebin.com/raw/j6X3mazy',
    'https://pastebin.com/raw/dYu1B9bp',
    'https://pastebin.com/raw/2YRMFjPG',
    'https://pastebin.com/raw/WnsgkWRc',
    'https://pastebin.com/raw/amw39T29',
    'https://pastebin.com/raw/UxN2Wx1F',
    'https://pastebin.com/raw/8E2TSndk',
];
module.exports = {
    name: '<hero>',
    aliases: aliases.flat(),
    async execute(message, args, commandName) {
        if (args.length == 0 || args[0] == 'help') return message.channel.send('`q!<hero> <level>`')
        let name = findName(commandName);
        if (!name) this.errorMessage('invalid hero name');
        if (!args) this.errorMessage('Please specify a level for the hero');
        let link = findLink(commandName);

        let level = parseInt(args[0]);
        request(link, (err, res, body) => {
            if (err)
                this.errorMessage(
                    'something went wrong while fetching the data'
                );

            let cleaned = body.replace(/\t/g, '').replace(/\r/g, '');
            let sentences = cleaned.split(/\n\n/);

            if (args[0] == '-all') {
                let embed = new Discord.MessageEmbed();
                embed
                    .setColor(cyber)
                    .setFooter(
                        'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
                    );
                for (let i = 0; i < 20; i++) {
                    embed.addField(i + 1, sentences[i], true);
                }
                return message.channel.send(embed);
            }

            return message.channel.send(oneUpgrade(sentences, level));
        });
    },
    errorMessage(err) {
        return new Discord.MessageEmbed()
            .setColor(red)
            .addField('error', err)
            .setDescription('*usage*:\n`q!<hero> <level>` - q!quincy 13');
    },
};

function findLink(commandName) {
    for (let i = 0; i < aliases.length; i++) {
        let towerAliasSet = aliases[i];
        for (let j = 0; j < towerAliasSet.length; j++) {
            if (commandName == towerAliasSet[j]) {
                return links[i];
            }
        }
    }
    return;
}
function findName(commandName) {
    for (let i = 0; i < aliases.length; i++) {
        let towerAliasSet = aliases[i];
        for (let j = 0; j < towerAliasSet.length; j++) {
            if (commandName == towerAliasSet[j]) {
                return towerAliasSet[0];
            }
        }
    }
    return;
}

function oneUpgrade(sentences, level) {
    return new Discord.MessageEmbed()
        .setDescription(sentences[level - 1])
        .setColor(cyber)
        .setFooter(
            'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
        );
}
