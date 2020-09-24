module.exports = {
    name: 'level',
    aliases: ['xp', 'rank', 'getxp'],

    async execute(message, args) {
        if (!args[0]) {
            const user = DiscordUsers.getDiscordUserFromId(message.author.id);
            return module.exports.displayStats(user, message);
        }

        if (DiscordUsers.isMention(args[0])) {
            const user = DiscordUsers.getDiscordUserFromMention(args[0]);
            return module.exports.displayStats(user, message);
        }

        // h, he, hel, help
        if ('help'.startsWith(args[0])) {
            return module.exports.helpMessage(message);
        }

        if ('rewards'.startsWith(args[0])) {
            if (message.guild.id == 598768024761139240) {
                return module.exports.rewardsMessage(message);
            } else {
                return module.exports.showsDiscordServer(message);
            }
        }
        const user = getDiscordUserFromId(args[0]);
        return module.exports.displayStats(user, message);
    },

    async displayStats(user, message) {
        whose_xp =
            user.id === message.author.id ? 'Your' : `${user.username}'s`;
        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });

        // Create db user if it doesn't already exist
        if (!tag) {
            tag = await Tags.create({
                name: user.id,
                xp: 0,
                showAds: true,
                showLevelUpMsg: true,
                quiz: 0,
            });
        }

        // Display level+xp
        const xpEmbed = new Discord.MessageEmbed()
            .setTitle(`${whose_xp} xp`)
            .addField('level', Xp.xpToLevel(tag.xp))
            .addField('xp', tag.xp)
            .setColor(colours['cyber'])
            .addField(
                'Have a suggestion or found a bug?',
                'Please tell us [here](https://discord.gg/VMX5hZA)!'
            )
            .setFooter('use `q!level rewards` to see role rewards');
        return message.channel.send(xpEmbed);
    },

    helpMessage(message) {
        const hembed = new Discord.MessageEmbed()
            .setTitle('Proprties of xp system')
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
        const rewardsEmbed = new Discord.MessageEmbed()
            .setTitle(`XP Rewards`)
            .addField('Level 3', module.exports.RAPID_SHOT_ROLE)
            .addField('Level 10', module.exports.STORM_OF_ARROWS_ROLE)
            .setColor(colours['cyber'])

            .setFooter(`You only get role rewards in the bot discord server`);
        return message.channel.send(rewardsEmbed);
    },
    showsDiscordServer(message) {
        const lvlMebed = new Discord.MessageEmbed()
            .setTitle(`XP Rewards`)
            .setColor(colours['cyber'])
            .setDescription(
                'You only get role rewards in the bot discord server\n[Discord Server](https://discord.gg/VMX5hZA)'
            );
        return message.channel.send(lvlMebed);
    },
};
