module.exports = {
    name: 'income',
    aliases: ['chincome'],
    async execute(message) {
        return message.channel.send(
            'Use `/income`\nIf this does not show up on your server please enable slash command permissions for the bot OR if you dont feel like doing that re-add the bot using a new link: https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=2147863617'
        );
    }
};
