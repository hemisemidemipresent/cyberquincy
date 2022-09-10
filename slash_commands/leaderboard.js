const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');
const nodefetch = require('node-fetch');
const { black } = require('../jsons/colors.json');
builder = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows the CT Leaderboard! (not copied frmom minecool at all)');

async function execute(interaction) {
    await interaction.reply('Getting Leaderboard...');
    let a = await nodefetch(
        'https://fast-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/ct_l7i90j39_guilds.json'
    );
    body = await a.json();
    let rawData = JSON.parse(body.data).scores.equal;
    let data = rawData.map((obj) => {
        md = obj.metadata.split(/[;|,]/);
        return { name: md[3], score: obj.score };
    });
    const actionRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder().setCustomId('1').setLabel('Page 1').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('2').setLabel('Page 2').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('3').setLabel('Page 3').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('4').setLabel('Page 4').setStyle(ButtonStyle.Secondary)
    ]);
    const filter = (selection) => {
        // Ensure user clicking button is same as the user that started the interaction
        if (selection.user.id !== interaction.user.id) return false;
        // Ensure that the button press corresponds with this interaction and wasn't a button press on the previous interaction
        if (selection.message.interaction.id !== interaction.id) return false;
        return true;
    };

    async function reloadNewPage(page = 1) {
        desc = '```\n';
        for (i = (page - 1) * 25; i < page * 25; i++) {
            obj = data[i];
            desc += `${obj.name.padEnd(25)}${obj.score.toString().padStart(6)}\n`;
        }
        const embed = new Discord.EmbedBuilder()
            .setTitle(`Page ${page}/4`)
            .setDescription(desc + '```')
            .setColor(black);

        await interaction.editReply({ content: '', embeds: [embed], components: [actionRow] });

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 20000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();
            if (isNaN(buttonInteraction.customId)) return;
            let pageID = parseInt(buttonInteraction.customId);
            reloadNewPage(pageID);
        });

        collector.on('end', async (collected) => {
            if (collected.size === 0)
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });
        });
    }

    reloadNewPage(1);
}

module.exports = {
    data: builder,
    execute
};
