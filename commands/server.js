const { discord } = require('../aliases/misc.json');

module.exports = {
    name: 'server',
    aliases: ['sv', 'se'],

    async execute(message) {
        await message.channel.send(
            `Join this discord server to get notifications on bot updates, downtime, report bugs and to suggest features: ${discord}`
        );
    },
};
