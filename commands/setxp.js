const DiscordUsers = require('../helpers/discord-users.js');
const { isMention } = require('../helpers/discord-users.js');

module.exports = {
    name: 'setxp',
    aliases: ['sxp'],

    async execute(message, args) {
        user = message.author;

        if (
            ![DiscordUsers.RMLGAMING, DiscordUsers.HEMI].includes(
                user.id.toString()
            )
        ) {
            return message.channel.send(
                'Must be a contributor to use this command. It is for testing.'
            );
        }

        if (!args[0] || isNaN(args[0]) || 'help'.startsWith(args[0])) {
            return module.exports.helpMessage(message);
        }

        if (args[0] < 0)
            return message.channel.send(
                '`<xp>` must be above 0. Type `q!setxp` for more info'
            );

        user = message.author;

        if (args[1]) {
            if (DiscordUsers.isMention(args[1])) {
                user = DiscordUsers.getDiscordUserFromMention(args[1]);
            } else {
                return module.exports.helpMessage(message);
            }
        }

        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });

        // No db record found
        if (!tag) {
            Tags.create({
                name: user.id,
                xp: 0,
                showAds: true,
                showLevelUpMsg: true,
            });
        }

        Tags.update({ xp: args[0] }, { where: { name: user.id } });

        // Pull from db just to make sure..
        tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });

        whose_xp =
            user.id === message.author.id ? 'Your' : `${user.username}'s`;
        whom = user.id == message.author.id ? 'you' : 'them;';

        return message.channel.send(
            `${whose_xp} xp is now ${
                tag.xp
            } making ${whom} level ${Xp.xpToLevel(tag.xp)}`
        );
    },

    helpMessage(message) {
        const hembed = new Discord.MessageEmbed()
            .setTitle('`q!setxp <xp> (<mention>)` Help')
            .setDescription('Can only be used by maintainers\nXp must be >0');
        return message.channel.send(hembed);
    },
};
