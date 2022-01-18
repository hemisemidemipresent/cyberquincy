module.exports = {
    name: 'herolevelenergizer',
    aliases: [
        'hle',
        'heroeng',
        'heroengz',
        'herenz',
        'henz',
        'heroenz',
        'herolevelenergiser',
        'energiser',
        'energizer',
    ],
    async execute(message) {
        return message.channel.send('Use `/herolevel` with the optional energizer placement round input')
    },
};