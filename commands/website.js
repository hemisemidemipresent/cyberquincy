module.exports = {
    name: 'website',

    aliases: ['web', 'site'],

    execute(message) {
        return message.channel.send(
            'https://cq.netlify.app'
        )
    },
}