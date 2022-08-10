xpCurve = require('../jsons/discord-user-xp.json');
const { discord } = require('../aliases/misc.json');
const gHelper = require('../helpers/general.js');

async function addCommandXp(message) {
    user = message.author;

    let tag = await Tags.findOne({
        where: {
            name: user.id
        }
    });

    // Create db user if it doesn't already exist
    if (!tag) {
        tag = await Tags.create({
            name: user.id,
            xp: 0,
            showAds: true,
            showLevelUpMsg: true,
            quiz: 0
        });
    }

    xpGain = gHelper.randomIntegerFromInclusiveRange(5, 12);

    oldLevel = xpToLevel(tag.xp);

    Tags.update({ xp: tag.xp + xpGain }, { where: { name: user.id } });

    tag = await Tags.findOne({
        where: {
            name: user.id
        }
    });

    newLevel = xpToLevel(tag.xp);

    let showlvlmsg = Tags.showLevelUpMsg;

    if (showlvlmsg == false) return;

    if (newLevel > oldLevel) {
        return levelUpMessage(message, newLevel);
    }
}

function xpToLevel(xp) {
    for (level = 1; level < xpCurve.length; level++) {
        if (xpCurve[level] > xp) return level;
    }
    // If user's leveling calculation made it this far, assign the highest level
    return xpCurve.length;
}

function levelUpMessage(message, newLevel) {
    levelUpRole(user, newLevel);
    user = message.author;

    levelUpEmbed = new Discord.EmbedBuilder()
        .setTitle(`Level Up!`)
        .addField(`Congratulations ${user.username}#${user.discriminator}!`, `You have advanced to level ${newLevel}`)
        .setFooter({ text: 'Type `q!level` for more information' })
        .setColor(colours['green']);

    message.channel.send(levelUpEmbed);
}

async function levelUpRole(user, newLevel) {
    let guildmember = client.guilds.cache
        .get('598768024761139240')
        .members.cache.array()
        .find((m) => m.id === user.id);
    if (!guildmember) {
        if (newLevel == 3 || newLevel == 10) {
            let roleEmbed = new Discord.EmbedBuilder().setTitle(`You can now get a role in the discord server: ${discord}`);
            return message.channel.send(roleEmbed);
        }
    }
    /* nyet
    if (newLevel === 3) {
        // if member is level 3 add role
        await guildmember.roles.add('645126928340353036');
    }
    if (newLevel === 10) {
        // if member is level 10 add role
        await guildmember.roles.add('645629187322806272');
    }*/
}

module.exports = {
    addCommandXp,
    xpToLevel
};
