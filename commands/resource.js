module.exports = {
    name: 'resource',

    aliases: ['link'],

    execute(message, args) {
        if (!args[0]) {
            return module.exports.helpMessage(message);
        }
        if (args[2]) {
            return module.exports.errorMessage(
                message,
                'More than one argument was provided'
            );
        }
        resource = RESOURCES[args[0]];
        if (resource) return message.channel.send(resource);
        else {
            return module.exports.errorMessage(
                message,
                `${args[0]} not a valid resource`
            );
        }
    },

    helpMessage(message) {
        let messageEmbed = new Discord.MessageEmbed()
            .setTitle(`q!resource <key>`)
            .addField('Use', 'Get a link with key <key>')
            .addField('Available keys', `${Object.keys(RESOURCES)}`)
            .setColor(colours['cyber']);

        return message.channel.send(messageEmbed);
    },

    errorMessage(message, error_message) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Cause', error_message)
            .addField('Type `q!resource` for help', '\u200b')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};

RESOURCES = {
    vstg:
        'https://cdn.discordapp.com/attachments/454395715834216459/645780538803879936/PicsArt_11-17-10.37.53.jpg',
    hack:
        'https://cdn.discordapp.com/attachments/598768278550085633/713184218598998107/hackedquincy.png',
};
