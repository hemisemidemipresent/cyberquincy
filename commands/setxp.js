const DiscordUsers = require('../helpers/discord-users.js')

module.exports = {
    name: 'setxp',
    aliases: ['sxp'],

    async execute(message, args) {
        user = message.author;
        
        if (![DiscordUsers.RMLGAMING, DiscordUsers.HMMM].includes(user.id.toString())) {
            return message.channel.send('Must be a contributor to use this command. It is for testing.');
        }

        if (!args[0] || isNaN(args[0]) || args[1] || "help".startsWith(args[0])) {
            return module.exports.helpMessage(message);
        }

        if (args[0] < 0) return message.channel.send("`<xp>` must be above 0. Type `q!setxp` for more info");

        user = message.author;

        let tag = await Tags.findOne({ where: 
            { 
                id: user.id 
            } 
        });

        // No db record found
        if (!tag) {
            return message.channel.send("Your xp was already 0");
        }
        
        Tags.update({ xp: args[0] }, { where: { id: user.id } });

        // Pull from db just to make sure..
        tag = await Tags.findOne({ where: 
            { 
                id: user.id 
            } 
        });

        return message.channel.send(`Your xp is now ${tag.xp} making you level ${Xp.xpToLevel(tag.xp)}`);
    },

    helpMessage(message) {
        const hembed = new Discord.MessageEmbed()
                .setTitle("`q!setxp <xp>` Help")
                .setDescription(
                    "Can only be used by maintainers\nXp must be >0"
                )
        return message.channel.send(hembed);
    },
}