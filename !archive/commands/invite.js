module.exports = {
    name: 'invite',
    async execute(message) {
        return await message.channel.send(
            'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617'
        );
    }
};
