const CYBER_SUPPORT = '598768024761139240';
const BTD6_INDEX = '661812833771847700';
const RACE_SERVER = '543957081183617024';
const EMOJIS_SERVER = '614111055890612225';

const { discord } = require('../aliases/misc.json');
function enterGuild(guild) {
    let channeltosend = guild.channels.cache.find((channel) => channel.name.includes('general') === true);
    if (channeltosend) {
        let helpEmbed = new Discord.EmbedBuilder()
            .setColor(colours['cyber'])
            .setDescription(`Hi! I am Cyber Quincy. I am a BTD6 discord bot.`)
            .addFields([
                { name: 'General Info', value: `[List of commands](https://cq.netlify.com)\n[Discord server](${discord})` },
                {
                    name: 'Note',
                    value: "Quincy son of Quincy is property of Ninja Kiwi. Although they didn't develop this bot, Ninja Kiwi approved of its use and development."
                },
                {
                    name: 'You should know...',
                    value: `The most popular commands by far are those that describe towers, \`/tower\` (tower path format: \`010\`, \`420\`, etc)`
                }
            ])
            .setFooter({ text: `Use \`${prefix}info\` for more information` });

        channeltosend.send({ embeds: [helpEmbed] });
    }
}

module.exports = {
    enterGuild,
    CYBER_SUPPORT,
    BTD6_INDEX,
    RACE_SERVER,
    EMOJIS_SERVER
};
