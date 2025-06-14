const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');

const axios = require('axios');

const { lightgreen } = require('../jsons/colors.json');

const SCORES_PER_PAGE = 25;

builder = new SlashCommandBuilder()
    .setName('ct_lb')
    .setDescription('Shows the CT Leaderboard!')
    .addIntegerOption((option) => option.setName('page').setDescription('Which page of the leaderboard').setRequired(false));

function getCurrentCT() {
    // const thirtysixthCT = new Date(1703023200000);
    const fiftysecondCT = new Date(1722981600000);
    const twoWeeks = 1209600000;
    return Math.floor((Date.now() - fiftysecondCT) / twoWeeks) + 52;
}

function validateInput(interaction) {
    page = interaction.options.getInteger('page') || 1;
    if (page < 1) return `${page} isn't a valid page number`;
}
async function execute(interaction) {
    const events = (await axios.get('https://data.ninjakiwi.com/btd6/ct')).data.body;

    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    await interaction.deferReply();

    const filter = (selection) => {
        // Ensure user clicking button is same as the user that started the interaction
        if (selection.user.id !== interaction.user.id) return false;
        // Ensure that the button press corresponds with this interaction and wasn't a button press on another interaction
        if (selection.message.interaction.id !== interaction.id) return false;
        return true;
    };

    const event = events.find((event) => {
        const oneWeek = 604800000;
        return Math.abs(event.end - Date.now()) < oneWeek;
    });
    if (!event) {
        return await inter.editReply({
            content: 'Current CT does not seem to be available in the Ninja Kiwi API',
            embeds: [],
            components: []
        });
    }

    let page = interaction.options.getInteger('page') || 1;

    async function reloadNewPage(inter, page = 1) {
        let json = (await axios.get(`https://data.ninjakiwi.com/btd6/ct/${event.id}/leaderboard/team?page=${page}`)).data;
        if (!json.success)
            return await inter.editReply({
                content: 'That page does not exist!',
                embeds: [],
                components: []
            });

        let data = json.body;

        desc = '';
        for (let i = 0; i < data.length; i++) {
            let obj = data[i];
            let name = obj.displayName;

            // placement and related padding
            let placement = SCORES_PER_PAGE * (page - 1) + i + 1;
            placement = placement.toString();
            placement = placement.padStart((SCORES_PER_PAGE * page).toString().length, '0'); // 50*page is "lowest placement in the page"

            if (name.length > 25) name = name.slice(0, 25);

            desc += `${placement} ${name.padEnd(25)}${obj.score.toString().padStart(6)}\n`;
        }

        
        const embed = new Discord.EmbedBuilder()
            .setTitle(`CT Event #${getCurrentCT()} Page ${page}`)
            .setDescription('```\n' + desc + '```')
            .setColor(lightgreen)
            .setFooter({ text: `Total players: ${event.totalScores_player}, Total teams: ${event.totalScores_team}, id: ${event.id}` });

        let components = [];
        if (json.prev) components.push(new ButtonBuilder().setCustomId('-1').setLabel('⬅️').setStyle(ButtonStyle.Primary));
        if (json.next) components.push(new ButtonBuilder().setCustomId('1').setLabel('➡️').setStyle(ButtonStyle.Primary));

        const actionRow = new ActionRowBuilder().addComponents(components);

        await inter.editReply({ content: '', embeds: [embed], components: [actionRow] });

        const collector = inter.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60000,
            max: 1,
            maxComponents: 1,
            maxUsers: 1
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            await buttonInteraction.deferUpdate();

            if (isNaN(buttonInteraction.customId)) return;

            page += parseInt(buttonInteraction.customId);
            await reloadNewPage(buttonInteraction, page);
        });

        collector.on('end', async (collected) => {
            if (collected.size !== 0) return;
            await interaction.editReply({
                embeds: [embed],
                components: []
            });
        });
    }

    reloadNewPage(interaction, page);
}

module.exports = {
    data: builder,
    execute
};
