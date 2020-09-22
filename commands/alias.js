const RegexParser = require('../parser/regex-parser');

module.exports = {
    name: 'alias',

    aliases: ['al', 'aliases'],

    execute(message, args) {
        // search up alias db
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        alias = CommandParser.parse(
            args,
            new RegexParser(/^(.*?)$/) // Match anything
        ).regex;

        if (parsed.hasErorrs) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        aliasSet = Aliases.getAliasSet(alias);
        let aliasStr = '';
        if (aliasSet) {
            aliasStr = aliasSet.join(', ');
        } else {
            aliasStr = 'none';
        }
        // search up command alias db
        let cmdStr = '';
        const newArgs = message.content.slice(2).split(/ +/);
        newArgs.shift();
        let command =
            client.commands.get(newArgs[0]) ||
            client.commands.find(
                (cmd) => cmd.aliases && cmd.aliases.includes(newArgs[0])
            );

        if (command) {
            cmdStr = command.aliases.join(', ');
        } else {
            cmdStr = 'none';
        }
        // actual fn
        return module.exports.aliasMessageArg(
            message,
            newArgs[0],
            aliasStr,
            cmdStr
        );
    },

    aliasMessageArg(message, input, aliasStr, cmdStr) {
        let aliasEmbed = null;

        aliasEmbed = new Discord.MessageEmbed()
            .setTitle(`Aliases for \`${input}\`:`)
            .addField('Arg alias', `${aliasStr}`)
            .addField('Cmd alias', `${cmdStr}`)
            .setColor(colours['cyber'])
            .setFooter(
                'NOTE: FOR q!<tower> AND q!<hero>, THE ARGUMENTS WILL SHOW EVERYTHING THAT TRIGGERS q!<tower> and q!<hero> respectively'
            );

        return message.channel.send(aliasEmbed);
    },

    helpMessage(message) {
        let messageEmbed = new Discord.MessageEmbed()
            .setTitle(`q!alias <command>`)
            .addField(
                'Use',
                'Learn all of the different ways to provide arguments/invoke commands'
            )
            .setColor(colours['cyber']);

        return message.channel.send(messageEmbed);
    },

    errorMessage(message, errorMessages) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Cause(s)', errorMessages.join('\n'))
            .addField('Type `q!alias` for help', '\u200b')
            .setColor(colours['orange']);

        return message.channel.send(errorEmbed);
    },
};
