const { SlashCommandBuilder } = require('discord.js');
const r = require('../jsons/round2.json');
const abr = require('../jsons/round2-abr.json');

const gHelper = require('../helpers/general.js');
const { red, magenta, yellow } = require('../jsons/colours.json');

builder = new SlashCommandBuilder()
    .setName('rbe')
    .setDescription('Calculate rbe for rounds')

    .addIntegerOption((option) => option.setName('start_round').setDescription('Only/Starting Round').setRequired(true))
    .addIntegerOption((option) => option.setName('end_round').setDescription('End Round').setRequired(false))
    .addStringOption((option) =>
        option
            .setName('game_mode')
            .setDescription('The game mode that you are playing on')
            .setRequired(false)
            .addChoices({ name: 'Normal', value: 'chimps' }, { name: 'ABR', value: 'abr' })
    );

function validateInput(interaction) {
    mode = interaction.options.getString('game_mode') || 'chimps';
    startround = interaction.options.getInteger('start_round');
    endround = interaction.options.getInteger('end_round') || startround;

    // Validations
    if (startround < 1 || endround < 1) {
        return `Must enter positive numbers for rounds (${endround < startround ? endround : startround})`;
    }
    if (endround < startround) {
        return `You entered a lower end round than start round`;
    }
    if (startround > 140 || endround > 140) {
        return `R${
            endround > startround ? endround : startround
        } is not predetermined; therefore the calculation won't be consistent`;
    }
    if (mode == 'abr') {
        if (startround < 3 || endround < 3) {
            return 'There is no support for rounds 1 and 2 abr calculation';
        }
        if (startround > 100 || endround > 100) {
            return `R${
                endround > startround ? endround : startround
            } is not predetermined in ABR; therefore the calculation won't be consistent`;
        }
    }
    return null;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    mode = interaction.options.getString('game_mode') || 'chimps';
    startround = interaction.options.getInteger('start_round');
    endround = interaction.options.getInteger('end_round') || startround;

    data = mode == 'chimps' ? r : abr;

    let totalpopcount = data[endround].cumulativeRBE - data[startround - 1].cumulativeRBE;
    const dataEmbed = new Discord.EmbedBuilder()
        .setTitle(`<:PopIcon:755016023333404743>${totalpopcount}`)
        .setDescription(`from round ${startround} to ${endround}`)
        .setFooter({ text: 'note: towers may count pops differently due to bugs' })
        .setColor(magenta);
    await interaction.reply({ embeds: [dataEmbed] });
}

module.exports = {
    data: builder,
    execute
};
