const { discord } = require('../aliases/misc.json');
module.exports = {
    name: 'suggest',
    execute(message) {
        if (message.channel.id == 753105261731905536) {
            return message.channel.send('its !suggest not q!suggest');
        }
        return message.channel.send(discord);
    },
};
