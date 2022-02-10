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
        'all'
    ],
    cooldown: 5,
    async execute(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('Need help?')
            .setDescription(`discord server: ${discord} stay up-to-date and talk to the devs`)
            .addField(
                '**Documentation/Tutorial**',
                '[What is Cyber Quincy](https://docs-cq.netlify.com/docs/intro)\n[Getting started](https://docs-cq.netlify.app/docs/Introduction/getting-started)\n[FAQ](https://docs-cq.netlify.app/docs/Introduction/faq)'
            )
            .addField(
                'Invite the bot',
                '[invite link](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617)'
            )
            .addField(
                'Upvote the bot',
                '[top.gg](https://top.gg/bot/591922988832653313)\n[discordbotlist](https://discordbotlist.com/bots/cyber-quincy)'
            );

        await message.reply({ embeds: [embed] });
    }
};
