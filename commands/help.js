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
                `discord server: ${discord} stay up-to-date and talk to the devs`
            )
            .addField(
                'List of commands',
                '[commands page](https://cq.netlify.app/docs/#/)'
            )
            .addField(
                'Invite the bot',
                '[invite link](https://discord.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881%5Cndiscord)'
            )
            .addField(
                'Upvote the bot',
                '[top.gg](https://top.gg/bot/591922988832653313)\n[discordbotlist](https://discordbotlist.com/bots/cyber-quincy)'
            );
        message.channel.send(embed);
    },
};
