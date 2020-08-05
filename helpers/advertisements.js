module.exports = {
    WHEEL_SIZE: 50,

    async spin(message) {
        user = message.author;

        let tag = await Tags.findOne({
            where: {
                name: user.id,
            },
        });
        if (!tag.showAds || tag.showAds == false) {
            return;
        }
        advertisingWheel = [
            module.exports.botOffline,
            module.exports.ownServer,
            module.exports.ownServer,
            module.exports.bugReport,
        ];

        const wheelSpin = Math.floor(Math.random() * module.exports.WHEEL_SIZE);

        advertisement = advertisingWheel[wheelSpin];
        if (advertisement) advertisement(message);
    },

    botOffline(message) {
        const serverEmbed = new Discord.MessageEmbed()
            .setTitle('Are you tired of the bot being offline?')
            .addField(
                'Join the discord server!',
                'Get notifications for new updates and bot status at [https://discord.gg/VMX5hZA](https://discord.gg/VMX5hZA)'
            )
            .setColor(colours['blurple']);

        message.channel.send(serverEmbed);
    },

    ownServer(message) {
        const inviteEmbed = new Discord.MessageEmbed()
            .setTitle('Want to invite the bot to your own server?')
            .addField(
                'Please spread the word around!',
                'Click [here](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881) or use the link https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot&permissions=537250881'
            )
            .setColor(colours['turq']);

        message.channel.send(inviteEmbed);
    },

    bugReport(message) {
        const bugEmbed = new Discord.MessageEmbed()
            .setTitle(
                'Want to suggest a new feature? Fix a typo? Report a bug?'
            )
            .addField(
                'join the discord server!',
                'suggest a new feature and report a bug at [https://discord.gg/VMX5hZA](https://discord.gg/VMX5hZA)'
            )
            .setColor(colours['turq']);

        message.channel.send(bugEmbed);
    },
};
