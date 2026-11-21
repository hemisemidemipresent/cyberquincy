import { EmbedBuilder, type Guild, type GuildBasedChannel } from 'discord.js';

import Colors from './colors';
import { discord } from '../aliases/misc.json';

/** Introduces the bot in the guild's first channel with "general" in its name, if there is one */
async function enterGuild(guild: Guild): Promise<void> {
    const channeltosend = guild.channels.cache.find((channel: GuildBasedChannel) => channel.name.includes('general'));
    if (channeltosend?.isSendable()) {
        const helpEmbed = new EmbedBuilder()
            .setColor(Colors.cyber)
            .setDescription(`Hi! I am Cyber Quincy. I am a BTD6 discord bot.`)
            .addFields([
                { name: 'General Info', value: `[Discord server](${discord})` },
                {
                    name: 'You should know...',
                    value: `The most popular commands by far are those that describe towers, \`/tower\` (tower path format: \`010\`, \`420\`, etc)`
                }
            ])
            .setFooter({ text: `Use /help for more information` });

        await channeltosend.send({ embeds: [helpEmbed] });
    }
}

export { enterGuild };
