const AnythingParser = require('../parser/anything-parser');

module.exports = {
    name: 'alias',

    aliases: ['al', 'aliases'],

    rawArgs: true,

    execute(message, args) {
        // search up alias db
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        parsed = CommandParser.parse(args, new AnythingParser());

        if (parsed.hasErrors()) {
            return module.exports.errorMessage(message, parsed.parsingErrors);
        }

        alias = parsed.anything;
        canonicizedAlias = Aliases.canonicizeArg(alias);

        aliasSet = Aliases.getAliasSet(canonicizedAlias);
        let aliasStr = '';
        if (aliasSet) {
            aliasStr = aliasSet.join(', ');
        } else {
            aliasStr = 'none';
        }
        // search up command alias db
        let command =
            client.commands.get(alias) || client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(alias));

        if (command && command.aliases) {
            commandAliases = command.aliases;
            cmdStr = null;
            suffix = '';
            // 1024 embedded field character limit
            while ((cmdStr = commandAliases.join(', ')).length > 1016) {
                commandAliases = commandAliases.slice(0, commandAliases.length / 2);
                suffix = ', ...';
            }
            cmdStr += suffix;
        } else {
            cmdStr = 'none';
        }
        // actual fn
        return module.exports.aliasMessageArg(message, alias, aliasStr, cmdStr);
    },

    aliasMessageArg(message, input, aliasStr, cmdStr) {
        let aliasEmbed = null;

        aliasEmbed = new Discord.EmbedBuilder()
            .setTitle(`Aliases for \`${input}\`:`)
            .addFields([
                { name: 'Arg alias', value: `${aliasStr}` },
                { name: 'Cmd alias', value: `${cmdStr}` }
            ])
            .setColor(colours['cyber'])
            .setFooter({
                text: 'NOTE: FOR q!<tower> AND q!<hero>, THE ARGUMENTS WILL SHOW EVERYTHING THAT TRIGGERS q!<tower> and q!<hero> respectively'
            });

        return message.channel.send({ embeds: [aliasEmbed] });
    },

    helpMessage(message) {
        let messageEmbed = new Discord.EmbedBuilder()
            .setTitle(`q!alias <command>`)
            .addFields([
                { name: 'Use', value: 'Learn all of the different ways to provide arguments/invoke commands' },
                {
                    name: 'Clarification',
                    value: 'Some words can be both commands and arguments that you can provide to commands, such as `wizard'
                },
                {
                    name: 'Example: `q!wizard 300`; `q!2mp wizard`',
                    value: 'Command aliases to invoke `q!wizard` might be different than argument aliases to invoke `q!2mp wizard`'
                }
            ])
            .setFooter({ text: '"alias" = "synonym"; "argument" = "input"' })
            .setColor(colours['cyber']);

        return message.channel.send({ embeds: [messageEmbed] });
    },

    errorMessage(message, errorMessages) {
        let errorEmbed = new Discord.EmbedBuilder()
            .setTitle('ERROR')
            .addFields([
                { name: 'Cause(s)', value: errorMessages.join('\n') },
                { name: 'Type `q!alias` for help', value: '\u200b' }
            ])
            .setColor(colours['orange']);

        return message.channel.send({ embeds: [errorEmbed] });
    }
};
