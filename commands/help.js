const { discord } = require('../aliases/misc.json');

module.exports = {
    name: 'help',
    description: 'List all of my commands or info about a specific command.',
    aliases: [
        'commands',
        'quincyhelp',
        'qhelp',
        'cyberquincy',
        'chelp',
        'qhelp',
        'h',
        'ch',
        'qh',
        'quincyh',
        'everything',
        'all',
    ],
    cooldown: 5,
    execute(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('Need help?')
            .setDescription(
                `if you want to report a bug, suggest a feature, complain to the dev personally, or flex that you added the bot to some popular discord, feel free to do so in the discord server: ${discord}`
            )
            .addField(
                'List of commands',
                '[commands page](https://cq.netlify.app/docs/#/)'
            )
            .addField(
                'Invite the bot',
                '[invite link](https://discord.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881%5Cndiscord)'
            );
        message.channel.send(embed);
    },
};
