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
        'quincyh'
    ],
    usage: '[command name]',
    cooldown: 5,
    execute (message, args) {
        message.channel.send(
            'website: https://cq.netlify.com\ninvite link: https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881\ndiscord server: https://discord.gg/VMX5hZA'
        )
    }
}
