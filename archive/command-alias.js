module.exports = {
    name: 'command-alias',

    aliases: ['calias', 'caliases', 'cmda', 'commanda'],

    execute(message, args) {
        if (!args[0]) {
            return module.exports.helpMessage(message);
        }

        if (args[1]) {
            return module.exports.errorMessage(
                message,
                'More than one argument was provided'
            );
        }

        // The command being queried can either be a command name
        // or a command alias
        let command =
            client.commands.get(args[0]) ||
            client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(args[0])
            );

        if (command) {
            return this.aliasMessage(message, command);
        } else {
            return module.exports.errorMessage(
                message,
                `There are no command-aliases for ${args[0]} because it is not a command.`
            );
        }
    },

    aliasMessage(message, command) {
        let aliasEmbed = null;

        if (
            command.aliases &&
            Array.isArray(command.aliases) &&
            command.aliases.length > 0
        ) {
            aliasEmbed = new Discord.MessageEmbed()
                .setTitle(`Aliases for \`q!${command.name}\`:`)
                .setDescription(`${command.aliases.join(', ')}`)
                .setColor(colours['cyber']);
        } else {
            aliasEmbed = new Discord.MessageEmbed()
                .setTitle(
                    `There are no command-aliases for \`q!${command.name}\``
                )
                .setDescription(
                    'The full list of commands can be found at https://cq.netify.app/docs/#'
                )
                .setColor(colours['cyber']);
        }

        return message.channel.send(aliasEmbed);
    },

    helpMessage(message) {
        let messageEmbed = new Discord.MessageEmbed()
            .setTitle(`q!command-alias <command>`)
            .addField(
                'Use',
                'Learn all of the different ways to invoke a given command'
            )
            .addField(
                'example',
                'q!command-alias help - shows all the aliases for q!help'
            )

            .setFooter("Maybe you're looking for `q!alias` for input aliases")
            .setColor(colours['cyber']);

        return message.channel.send(messageEmbed);
    },

    errorMessage(message, errorMessage) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Cause', errorMessage)
            .addField('Type `q!command-alias` for help', ':)')
            .setFooter(
                "Maybe you're looking for `q!alias` for argument aliases"
            )
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};
