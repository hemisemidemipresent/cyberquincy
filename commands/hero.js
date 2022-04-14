const { cyber, red } = require('../jsons/colours.json');
const request = require('request');
const aliases = [
    ['quincy', 'q', 'cyberquincy', 'quincey', 'quinc', 'quonc', 'quonce', 'quoncy', 'cyber', 'furry', 'cq', 'uincy'],
    ['gwendolin', 'g', 'gwen', 'gwendolyn', 'gwendolyn', 'scientist', 'gwendolin', 'gwend', 'gwendo', 'fire'],
    ['striker-jones', 'sj', 'striker', 'bones', 'jones', 'biker', 'who'],
    ['obyn-greenfoot', 'obyn', 'greenfoot', 'o', 'ocyn'],
    ['captain-churchill', 'churchill', 'c', 'ch', 'chirch', 'church', 'captain', 'tank', 'winston', 'hill'],
    ['benjamin', 'b', 'dj', 'ben', 'benny', 'boi', 'best', 'benjammin', "benjammin'", 'yeet', 'boy'],
    ['ezili', 'e', 'ez', 'voodo', 'vm', 'ezi', 'ezil', 'voodoo'],
    ['pat-fusty', 'p', 'pat', 'pf', 'fusty', 'patfusty', 'frosty', 'snowman', 'fusticator', 'patfrosty', 'thicc'],
    ['adora', 'ad', 'ador', 'ado', 'dora', 'priestess', 'high', 'highpriestess'],
    ['admiral-brickell', 'brick', 'brickell', 'brickel'],
    ['etienne', 'etiene', 'french', 'etine', 'etinne', 'etenne', 'et', 'eti', 'drone'],
    ['sauda', 'saud', 'sau', '🥛', 'sawdust', 'isabgirl'],
    ['psi', 'psy', 'Ψ', 'sigh'],
    ['geraldo', 'ger'],
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
    'https://pastebin.com/raw/9h9aAPUm'
];
module.exports = {
    name: '<hero>',
    aliases: aliases.flat(),
    async execute(message, args, commandName) {
        if (args.length == 0 || args[0] == 'help') return await message.channel.send('`q!<hero> <level>`');
        let name = findName(commandName);
        if (name == 'geraldo') return await message.channel.send({ content: 'TBD' })
        if (!name) this.errorMessage('invalid hero name');
        if (!args) this.errorMessage('Please specify a level for the hero');
        let link = findLink(commandName);

        let level = parseInt(args[0]);
        if (level < 1 || level > 20) {
            return await message.channel.send({
                embeds: [this.errorMessage('lvl must be btwn 1-20')]
            });
        }
        await request(link, async (err, res, body) => {
            if (err) {
                let embed = this.errorMessage('something went wrong while fetching the data');
                await message.channel.send({ embeds: [embed] });
            }

            let cleaned = body.replace(/\t/g, '').replace(/\r/g, '');
            let sentences = cleaned.split(/\n\n/);

            if (args[0] == '-all') {
                let embed = new Discord.MessageEmbed();
                embed.setColor(cyber).setFooter({
                    text: 'd:dmg • md:moab dmg • cd:ceram dmg • p:pierce • r:range • s:time btw attacks • j:projectile count • q!ap for help and elaboration • data is from extreme bloonology, by The Line, Nitjus, Char, JazzyJonah and TheKNEE'
                });
                for (let i = 0; i < 20; i++) {
                    embed.addField((i + 1).toString(), sentences[i], true);
                }
                return await message.channel.send({ embeds: [embed] });
            }
            let embed = oneUpgrade(sentences, level);
            return await message.channel.send({ embeds: [embed] });
        });
    },
    errorMessage(err) {
        return new Discord.MessageEmbed()
            .setColor(red)
            .addField('error', err)
            .setDescription('*usage*:\n`q!<hero> <level>` - q!quincy 13');
    }
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
    let desc = sentences[level - 1];
    if (typeof desc != 'string') desc = 'huh';

    return new Discord.MessageEmbed()
        .setDescription(desc)
        .setColor(cyber)
        .setFooter({
            text: 'd:dmg • md:moab dmg • cd:ceram dmg • p:pierce • r:range • s:time btw attacks • j:projectile count • q!ap for help and elaboration • data is from extreme bloonology, by The Line, Nitjus, Char, JazzyJonah and TheKNEE'
        });
}
