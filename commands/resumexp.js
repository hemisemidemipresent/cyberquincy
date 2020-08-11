module.exports = {
    name: 'resumexp',

    aliases: ['resume', 'startxp'],

    execute (message, args) {
        if (
            ![DiscordUsers.HEMI, DiscordUsers.RMLGAMING].includes(
                message.author.id
            )
        ) {
            return message.channel.send(
                'Must have contributor role to run this command'
            )
        }

        xpEnabled = true

        return message.channel.send('XP gains are now enabled all around')
    }
}
