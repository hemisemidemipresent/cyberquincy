const { discord } = require('../aliases/misc.json');
module.exports = {
    name: 'suggest',
    async execute(message) {
        if (message.channel.id == 753105261731905536) {
            return await message.channel.send('its !suggest not q!suggest');
        }
        await message.channel.send(`suggest stuff at ${discord}`);
    }
};
