module.exports = {
    name: 'hey',
    execute(message, args, client) {
        if (args[0].toLowerCase().includes('guy')) {
            message.channel.send(
                'https://cdn.discordapp.com/attachments/661812833771847703/705257097423487036/image0.png'
            );
        }
    },
};
