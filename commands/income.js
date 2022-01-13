module.exports = {
    name: 'income',
    aliases: ['chincome'],
    async execute(message) {
        return message.channel.send('Use `/income`')
    }
};
