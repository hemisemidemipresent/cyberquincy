const { SlashCommandBuilder } = require('@discordjs/builders');
const income = require('../jsons/income-normal.json');
const abrincome = require('../jsons/income-abr.json');
const gHelper = require('../helpers/general.js');
const { cyber, orange } = require('../jsons/colours.json');

builder = new SlashCommandBuilder()
    .setName('cash')
    .setDescription('Find out when you can get a certain amount of cash if you start saving up at a certain round')

    .addIntegerOption((option) => option.setName('cash_needed').setDescription('How much cash you need').setRequired(true))
    .addIntegerOption((option) => option.setName('round').setDescription('The round you start saving up').setRequired(true))
    .addStringOption((option) =>
        option
            .setName('game_mode')
            .setDescription('CHIMPS/ABR/HALFCASH')
            .setRequired(false)
            .addChoice('CHIMPS', 'chimps')
            .addChoice('ABR', 'abr')
            .addChoice('Half Cash', 'halfcash')
    );

function validateInput(interaction) {
    cash_needed = interaction.options.get('cash_needed');
    mode = interaction.options.getString('game_mode') || 'chimps';
    round = interaction.options.getInteger('round');

    // Validations
    if (cash_needed < 1) return `Must enter positive numbers for cash_needed (${cash_needed})`;

    if (round < 1) return `Must enter positive numbers for round (${round})`;
    if (round > 140) return `R${round} is random (not predetermined); therefore the calculation won't be consistent`;

    if (mode == 'abr') {
        if (round < 3) return 'There is no support for rounds 1 and 2 abr income calculations';
        if (round > 100)
            return `R${round} is random (not predetermined) in ABR; therefore the calculation won't be consistent`;
    }
    return;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    cashNeeded = interaction.options.getInteger('cash_needed');
    mode = interaction.options.getString('game_mode') || 'chimps';
    round = interaction.options.getInteger('round');

    let embed;
    if (mode === 'chimps') embed = calculate(cashNeeded, round, income, 140, 1);
    else if (mode === 'abr') embed = calculate(cashNeeded, round, abrincome, 100, 1);
    else if (mode === 'halfcash') embed = calculate(cashNeeded, round, income, 140, 0.5);

    interaction.reply({ embeds: [embed] });
}
function calculate(cashNeeded, round, r, roundLimit, incomeMultiplier) {
    let cashSoFar = 0;
    let originalRound = round;

    while (cashSoFar <= cashNeeded) {
        addToTotal = parseInt(r[round].cashThisRound);
        cashSoFar += addToTotal * incomeMultiplier;
        addToTotal = 0;
        round++;

        if (round > roundLimit)
            return new Discord.MessageEmbed()
                .setTitle(
                    `If you start popping at ${originalRound}, you can't get $${cashNeeded} from popping bloons before random freeplay`
                )
                .setFooter({ text: 'freeplay rounds are random, hence cash is random' })
                .setColor(orange);
    }

    let embed = new Discord.MessageEmbed()
        .setTitle(
            `If you start popping (saving up) at round ${originalRound}, you should get $${cashNeeded} DURING round ${--round} (BEFORE round ${++round}).`
        )
        .setColor(cyber);
    return embed;
}
module.exports = {
    data: builder,
    execute
};
