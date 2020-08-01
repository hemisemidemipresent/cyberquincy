const DiscordUsers = require('../helpers/discord-users.js')

module.exports = {
    name: 'level',
    aliases: ['xp', 'rank'],

    async execute(message, args) {
        return message.channel.send(
            'Sorry! xp has been removed (temporarily) to save processing time and increase uptime.'
        );

        // Everything from here works if the above is commented out
        // but there needs to be an xp curve for it to be useful

        if (!args[0]) {
            const user = DiscordUsers.getDiscordUserFromId(message.author.id);
            return module.exports.displayStats(user, message);
        }

        if (args[0] && DiscordUsers.isMention(args[0])) {
            const user = DiscordUsers.getDiscordUserFromMention(args[0]);
            return module.exports.displayStats(user, message);
        }

        // h, he, hel, help
        if ('help'.startsWith(args[0])) {
            return module.exports.helpMessage(message);
        }

        if ('rewards'.startsWith(args[0])) {
            return module.exports.rewardsMessage(message);
        }
    },

    async displayStats(user, message) {
        whose_xp = user.id === message.author.id ? "Your" : `${user.username}'s`
        let dbUser = await Tags.findOne({ where: 
            { 
                id: user.id 
            } 
        });

        // Create db user if it doesn't already exist
        if (!dbUser) {
            dbUser = await Tags.create({
                id: user.id,
                level: 1,
                xp: 0, 
            });
        }

        // Display level+xp
        const xpEmbed = new Discord.MessageEmbed()
            .setTitle(`${whose_xp} xp`)
            .addField('level', dbUser.level)
            .addField('xp', dbUser.xp)
            .setColor(colours["cyber"])
            .addField(
                'Have a suggestion or found a bug?',
                'Please tell us [here](https://discord.gg/VMX5hZA)!'
            )
            .setFooter('use `q!level rewards` to see role rewards');
        return message.channel.send(xpEmbed);
    },

    helpMessage(message) {
        const hembed = new Discord.MessageEmbed()
                .setTitle("Proprties of xp system")
                .setDescription(
                    '1. You get xp by using commands (cooldowns apply).\n\
                    2. You get a anywhere from 5 to 12 XP for each command.\n\
                    3. XP is gained in dms.\n\
                    4. Role rewards only for those in the discord server.\n\
                    5. XP is universal, it is not confined to 1 server.\n\
                    6. Hidden multipliers exist, you just need to find them.'
                );
        return message.channel.send(hembed);
    },

    RAPID_SHOT_ROLE: `<@&645126928340353036>`,
    STORM_OF_ARROWS_ROLE: `<@&645629187322806272>`,

    rewardsMessage(message) {
        const lvlMebed = new Discord.MessageEmbed()
            .setTitle(`XP Rewards`)
            .addField('Level 3', module.exports.RAPID_SHOT_ROLE)
            .addField('Level 10', module.exports.STORM_OF_ARROWS_ROLE)
            .setColor(colours["cyber"])
            .addField(
                'You only get role rewards in the bot discord server',
                '[Discord Server](https://discord.gg/VMX5hZA)'
            )
            .setFooter(
                `You only get role rewards in the bot discord server`
            );
        return message.channel.send(lvlMebed);
    },
}