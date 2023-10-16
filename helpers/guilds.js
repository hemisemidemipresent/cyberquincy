const CYBER_SUPPORT = '598768024761139240';
const BTD6_INDEX = '661812833771847700';
const { cyber } = require('../jsons/colors.json');

const { discord } = require('../aliases/misc.json');
async function enterGuild(guild) {
    let channeltosend = guild.channels.cache.find((channel) => channel.name.includes('general') === true);
    if (channeltosend) {
        let helpEmbed = new Discord.EmbedBuilder()
            .setColor(cyber)
            .setDescription(`Hi! I am Cyber Quincy. I am a BTD6 discord bot.`)
            .addFields([
                { name: 'General Info', value: `[List of commands](https://cq.netlify.com)\n[Discord server](${discord})` },
                {
                    name: 'You should know...',
                    value: `The most popular commands by far are those that describe towers, \`/tower\` (tower path format: \`010\`, \`420\`, etc)`
                }
            ])
            .setFooter({ text: `Use \`/help\` for more information` });

        await channeltosend.send({ embeds: [helpEmbed] });
    }
}

module.exports = {
    enterGuild,
    CYBER_SUPPORT,
    BTD6_INDEX
};
