module.exports = {
    name: 'setting',
    aliases: ['set', 'settings', 'options', 'o'],

    async execute(message, args) {
        user = message.author;

        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });
        let embed = new Discord.MessageEmbed()
            .setTitle(`Settings for ${user.username}#${user.discriminator}`)
            .addField('Advertisments', tag.showAds)
            .addField('Level Up Messages', tag.showLevelUpMsg);
        message.channel.send(embed);
    },
};
