module.exports = {
    name: 'feet',

    aliases: ['foot'],

    execute(message) {
        console.log('foot');
        if (message.author.id == 386828593260658688) {
            return message.channel.send(
                'https://www.youtube.com/watch?v=gSF0z44_eJk'
            );
        } else {
            return message.channel.send(
                'https://media.discordapp.net/attachments/770094137713885204/811138845693313084/Screenshot_20210216_075349.png'
            );
        }
    },
};
