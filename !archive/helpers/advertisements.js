const WHEEL_SIZE = 50;
const { discord } = require('../aliases/misc.json');
const { blurple, turq } = require('../jsons/colors.json')

async function spin(message) {
    user = message.author;

    let tag = await Tags.findOne({
        where: {
            name: user.id
        }
    });
    if (!tag.showAds || tag.showAds == false) {
        return;
    }
    advertisingWheel = [botOffline, ownServer, upvoteBot, bugReport];

    const wheelSpin = Math.floor(Math.random() * WHEEL_SIZE);

    advertisement = advertisingWheel[wheelSpin];
    if (advertisement) advertisement(message);
}

function botOffline(message) {
    const serverEmbed = new Discord.EmbedBuilder()
        .setTitle('Are you tired of the bot being offline?')
        .addFields([
            { name: 'Join the discord server!', value: `Get notifications for new updates and bot status at ${discord}` }
        ])
        .setColor(blurple)
        .setFooter({ text: 'use q!toggle ad to turn this off | Leaving this on is the least you can do to help' });

    message.channel.send({ embeds: [serverEmbed] });
}

function ownServer(message) {
    const inviteEmbed = new Discord.EmbedBuilder()
        .setTitle('Want to invite the bot to your own server?')
        .addFields([
            {
                name: 'Please spread the word around!',
                value: 'Click [here](https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617) or use the link https://discordapp.com/oauth2/authorize?client_id=591922988832653313&scope=bot%20applications.commands&permissions=2147863617'
            }
        ])
        .setColor(turq)
        .setFooter({ text: 'use q!toggle ad to turn this off | Leaving this on is the least you can do to help' });

    message.channel.send(inviteEmbed);
}

function bugReport(message) {
    const bugEmbed = new Discord.EmbedBuilder()
        .setTitle('Want to suggest a new feature? Fix a typo? Report a bug?')
        .addFields([{ name: 'join the discord server!', value: `suggest a new feature and report a bug at ${discord}` }])
        .setColor(turq)
        .setFooter({ text: 'use q!toggle ad to turn this off | Leaving this on is the least you can do to help' });

    message.channel.send(bugEmbed);
}

function upvoteBot(message) {
    const upvoteEmbed = new Discord.EmbedBuilder()
        .setTitle('Help support the bot!')
        .addFields([
            { name: 'upvote the bot!', value: '[discordbotlist link](https://discordbotlist.com/bots/cyber-quincy)' }
        ]);
}

module.exports = {
    spin
};
