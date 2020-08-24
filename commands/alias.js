const RegexParser = require("../parser/regex-parser");

module.exports = {
    name: "alias",

    aliases: ["al", "aliases"],

    execute(message, args) {
        if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
            return module.exports.helpMessage(message);
        }

        alias = CommandParser.parse(
            args,
            new RegexParser(/^(.*?)$/) // Match anything
        ).regex;

        if (parsed.hasErorrs) {
            return module.exports.errorMessage(message, parsed.parsingErrors)
        }

        aliasSet = Aliases.getAliasSet(alias)
        if (aliasSet) {
            return module.exports.aliasMessageArg(message, alias, aliasSet);
        }
        return module.exports.errorMessage(
            message,
            [`There are no aliases for ${alias} because it is not in the alias database.`]
        )
    },

    aliasMessageArg(message, aliasMember, aliasSet) {
        let aliasEmbed = null;

        aliasEmbed = new Discord.MessageEmbed()
                .setTitle(`Aliases for \`${aliasMember}\`:`)
                .setDescription(`${aliasSet.join(', ')}`)
                .setColor(colours["cyber"]);
        
        return message.channel.send(aliasEmbed)
    },

    helpMessage(message) {
        let messageEmbed = new Discord.MessageEmbed()
                .setTitle(`q!alias <command>`)
                .addField(
                    'Use',
                    'Learn all of the different ways to provide arguments to commands'
                )
                .setFooter("Maybe you're looking for `q!command-alias` for command aliases")
                .setColor(colours["cyber"]);

        return message.channel.send(messageEmbed);
    },

    errorMessage(message, errorMessages) {
        let errorEmbed = new Discord.MessageEmbed()
                .setTitle("ERROR")
                .addField(
                    "Cause(s)",
                    errorMessages.join('\n'),
                )
                .addField(
                    "Type `q!alias` for help",
                    ":)"
                )
                .setFooter("Maybe you're looking for `q!command-alias` for command aliases")
                .setColor(colours["orange"]);

        return message.channel.send(errorEmbed);    
    },
};