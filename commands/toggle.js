SETTING_ALIASES = {
    showAds: ['ad', 'advertisment', 'ads'],
    lvlUpMsg: ['lvl', 'lvlup', 'msg', 'level', 'lvlupmsg'],
}; // will make custom function for this later
module.exports = {
    name: 'toggle',
    aliases: ['tog', 'to', 'switch', 'configure'],

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
                showLevelUpMsg: true,
            });
        }
        if (args[0].includes('ad')) {
            let prevState = tag.showAds;
            if (!prevState || prevState == false) {
                Tags.update({ showAds: true }, { where: { name: user.id } });
            } else {
                Tags.update({ showAds: false }, { where: { name: user.id } });
            }
            return module.exports.confirmationMsg(
                message,
                'Advertisments',
                prevState
            );
        } else if (args[0].includes('level') || args[0].includes('lvl')) {
            let prevState = tag.showLevelUpMsg;
            if (!prevState || prevState == false) {
                Tags.update(
                    { showLevelUpMsg: true },
                    { where: { name: user.id } }
                );
            } else {
                Tags.update(
                    { showLevelUpMsg: false },
                    { where: { name: user.id } }
                );
            }
            return module.exports.confirmationMsg(
                message,
                'LevelUpMessage',
                prevState
            );
        } else {
            return message.channel.send(
                'there are only 2 options to toggle, ``q!toggle ads`` and ``q!toggle lvlupmsg``'
            );
        }
    },
    confirmationMsg(message, setting, prevState) {
        message.channel.send(`${setting} is set to ${!prevState}`);
    },
};
