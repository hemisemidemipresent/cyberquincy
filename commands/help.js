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
    ],
    usage: '[command name]',
    cooldown: 5,
    execute(message, args, client) {
        message.channel.send('documentation: https://cq.netlify.com');
    },
};
