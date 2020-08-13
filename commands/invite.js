module.exports = {
    name: 'invite',

    aliases: ['add'],

    execute(message) {
        return message.channel.send(
            'https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881'
        )
    },
}