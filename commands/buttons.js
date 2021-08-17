const {
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
} = require('discord.js');

module.exports = {
    name: 'buttons',
    aliases: ['beta', 'hentai'],
    rawArgs: true,
    execute(message, args) {
        return;
        if (args[0] == 'menu') {
            const row = new MessageActionRow().addComponents(
                new MessageSelectMenu()
                    .setCustomId('hero')
                    .setPlaceholder('Nothing selected')
                    .addOptions([
                        {
                            label: 'Quincy',
                            description: 'this fucker',
                            value: 'quincy',
                        },
                        {
                            label: 'Gwen',
                            description: 'descs bad',
                            value: 'gwen',
                        },
                    ])
            );
            message.reply({
                content: 'gay gay homosexual gay',
                components: [row],
            });
            const filter = (interaction) =>
                interaction.customId === 'hero' &&
                interaction.user.id == message.author.id; //  nothing basically
            const collector = message.channel.createMessageComponentCollector({
                filter,
                time: 20000,
            });
            collector.on('collect', async (i) => {
                if (i.customId == 'hero') {
                    console.log(i);
                    i.update({ content: i.values[0], components: [] });
                }
            });
        } else {
            const button = new MessageButton()
                .setCustomId('primary')
                .setLabel('Primary')
                .setStyle('PRIMARY');
            const row = new MessageActionRow().addComponents(button);
            message.reply({
                content: 'gay gay homosexual gay',
                components: [row],
            });
            const filter = (interaction) =>
                interaction.customId === 'primary' &&
                interaction.user.id == message.author.id; //  nothing basically

            const collector = message.channel.createMessageComponentCollector({
                filter,
                time: 20000,
            });
            collector.on('collect', async (i) => {
                if (i.customId == 'primary') {
                    i.update({ content: 'button clicked' });
                }
            });
        }
    },
};
