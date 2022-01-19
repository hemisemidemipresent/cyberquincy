module.exports = {
    name: 'herolevel',
    aliases: ['hl', 'hero', 'her', 'hlvl'],
    async execute(message) {
        return message.channel.send('Use `/herolevel`')
    },
};