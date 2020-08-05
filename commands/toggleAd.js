module.exports = {
    name: 'ads',
    aliases: ['ad', 'advertisment', 'togglead', 'tad'],

    async execute(message, args) {
        user = message.author;

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
            });
        }
        let prevAdState = tag.showAds;
        if (!prevAdState || prevAdState == false) {
            Tags.update({ showAds: true }, { where: { name: user.id } });
        } else {
            Tags.update({ showAds: false }, { where: { name: user.id } });
        }
        return module.exports.confirmationMsg(message, prevAdState);
    },
    confirmationMsg(message, prevAdState) {
        message.channel.send(`Advertisments is set to ${!prevAdState}`);
    },
};
