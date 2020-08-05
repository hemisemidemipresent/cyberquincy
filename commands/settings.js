module.exports = {
    name: 'setting',
    aliases: ['set', 'config', 'options', 'o'],

    async execute(message, args) {
        user = message.author;

        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });
        message.channel.send(`ads: ${tag.showAds}`);
    },
};
