const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, ComponentType } = require('discord.js');

const axios = require('axios');
const FuzzySet = require('fuzzyset.js');

const { dark_blue } = require('../jsons/colors.json');

const SCORES_PER_PAGE = 50;

let cachedRaces = [];

builder = new SlashCommandBuilder()
    .setName('race_lb')
    .setDescription('Get the race leaderboard')
    .addStringOption((option) =>
        option
            .setName('race_id')
            .setDescription('The id of the race whose data you want')
            .setAutocomplete(true)
            .setRequired(false)
    )
    .addIntegerOption((option) => option.setName('page').setDescription('Which page of the leaderboard').setRequired(false))
    .addBooleanOption((option) => option.setName('reload').setDescription('Reload list of races').setRequired(false));

async function validateInput(interaction) {
    page = interaction.options.getInteger('page') || 1;
    if (page < 1) return `${page} isn't a valid page number`;
}

async function execute(interaction) {
    const validationFailure = await validateInput(interaction);
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

    const reload = interaction.options.getBoolean('reload') || false;
    if (reload || cachedRaces.length === 0) await updateRaceList();

    const race_name = interaction.options.getString('race_name') || cachedRaces[0].name;
    const event = cachedRaces?.find((r) => r.name == race_name);
    const race_id = event.id;
    let page = interaction.options.getInteger('page') || 1;

    async function reloadNewPage(inter, page = 1) {
        const json = (await axios.get(`https://data.ninjakiwi.com/btd6/races/${race_id}/leaderboard?page=${page}`)).data;
        if (!json.success)
            return await inter.editReply({
                content: `page #${page} does not exist!`,
                embeds: [],
                components: []
            });
        let data = json.body;

        desc = '';
        for (let i = 0; i < data.length; i++) {
            let obj = data[i];
            let name = obj.displayName;
            let ms = obj.score;

            // placement and related padding
            let placement = SCORES_PER_PAGE * (page - 1) + i + 1;
            placement = placement.toString();
            placement = placement.padStart((SCORES_PER_PAGE * page).toString().length, '0'); // find lowest placement in the page, then find its length

            // score processing
            let minutes = Math.floor(ms / 60000);
            let seconds = Math.floor((ms % 60000) / 1000);
            let mseconds = ms % 1000;

            seconds = seconds.toString().padStart(2, '0');
            mseconds = mseconds.toString().padStart(3, '0');
            let time = seconds === '60' ? `${minutes + 1}:00.000` : `${minutes}:${seconds}.${mseconds}`;

            desc += `${placement} ${name.padEnd(20)}${time}\n`;
        }

        const embed = new Discord.EmbedBuilder()
            .setTitle(`Race Event "${race_name}" Page ${page}`)
            .setDescription('```\n' + desc + '```')
            .setColor(dark_blue)
            .setFooter({ text: `Total players: ${event.totalScores}` });

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
async function onAutocomplete(interaction) {
    if (cachedRaces.length === 0) await updateRaceList();

    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const race_name_partial = hoistedOptions.find((option) => option.name == 'race_id'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = race_name_partial?.value;

    let fs = FuzzySet(cachedRaces.map((r) => r.name));
    const values = fs.get(value, null, 0.2);

    let responseArr = [];
    values?.forEach((value, i) => {
        if (i < 25) responseArr.push({ name: value[1], value: value[1] });
    });

    if (responseArr.length !== 0) return await interaction.respond(responseArr);

    // if there are no responses, we take the first 25 races
    cachedRaces.forEach((r, i) => {
        if (i < 25) responseArr.push({ name: r.name, value: r.name });
    });
    return await interaction.respond(responseArr);
}

async function updateRaceList() {
    let res = await axios.get('https://data.ninjakiwi.com/btd6/races');
    cachedRaces = res.data.body;
}
module.exports = {
    data: builder,
    execute,
    onAutocomplete
};
