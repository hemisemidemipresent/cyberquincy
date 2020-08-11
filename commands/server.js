module.exports = {
    name: 'server',

    execute (message) {
        return message.channel.send(
            'Join this discord server to get notifications on bot updates, downtime, report bugs and to suggest features: https://discord.gg/VMX5hZA'
        )
    }
}
