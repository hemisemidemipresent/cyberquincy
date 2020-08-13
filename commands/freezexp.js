module.exports = {
    name: 'freezexp',

    aliases: ['freeze', 'stopxp'],

    execute(message, args) {
        if (
            ![DiscordUsers.HEMI, DiscordUsers.RMLGAMING].includes(
                message.author.id
            )
        ) {
            return message.channel.send(
                'Must have contributor role to run this command'
            );
        }

        xpEnabled = false;

        return message.channel.send('XP gains are frozen all around');
    },
};
