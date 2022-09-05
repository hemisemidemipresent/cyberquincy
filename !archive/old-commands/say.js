const { HEMI, RMLGAMING } = require('../helpers/discord-users');
module.exports = {
    name: 'say',
    rawArgs: true,
    casedArgs: true,
    async execute(message, args) {
        if (message.author.id == HEMI || message.author.id == RMLGAMING) {
            await message.channel.send(args.join(' '));
            await message.channel.send(args.join(' '));
            await message.channel.send(args.join(' '));
            await message.channel.send(args.join(' '));
        }
    }
};
