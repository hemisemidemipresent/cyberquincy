const { SlashCommandBuilder } = require('discord.js');
const income = require('../jsons/round_sets/regular.json');
const abrincome = require('../jsons/round_sets/abr.json');
const gHelper = require('../helpers/general.js');
const { cyber, orange } = require('../jsons/colors.json');
const thriveHelper = require('../helpers/thrive.js');

builder = new SlashCommandBuilder()
    .setName('cash')
    .setDescription('Find out when you can get a certain amount of cash if you start saving up at a certain round')

    .addIntegerOption((option) => option.setName('cash_needed').setDescription('How much cash you need').setRequired(true))
    .addIntegerOption((option) => option.setName('round').setDescription('The round you start saving up').setRequired(true))
    .addIntegerOption((option) => option.setName('extra_round_income').setDescription('Any additional income per round, NOT affected by thrive').setRequired(false))
    .addIntegerOption((option) => option.setName('thrives').setDescription('Number of thrives').setRequired(false))
    .addStringOption((option) =>
        option
            .setName('game_mode')
            .setDescription('CHIMPS/ABR/HALFCASH')
            .setRequired(false)
            .addChoices(
                { name: 'CHIMPS', value: 'chimps' },
                { name: 'ABR', value: 'abr' },
                { name: 'Half Cash', value: 'halfcash' }
            )
    );

function validateInput(interaction) {
    cashNeeded = interaction.options.getInteger('cash_needed');
    mode = interaction.options.getString('game_mode') || 'chimps';
    round = interaction.options.getInteger('round');
    extraIncome = interaction.options.getInteger('extra_round_income') || 0;
    thrives = interaction.options.getInteger('thrives') || 0;

    // Validations
    if (cashNeeded < 1) return `Must enter positive number for cash_needed (${cashNeeded})`;

    if (round < 1) return `Must enter positive number for round (${round})`;
    if (round > 140) return `R${round} is random (not predetermined); therefore the calculation won't be consistent`;

    if (extraIncome < 0) return `Must enter non-negative number for extra_round_income (${extraIncome})`;

    if (thrives < 0) return `Must enter non-negative number for thrives (${thrives})`;

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
    extraEor = interaction.options.getInteger('extra_round_income') || 0;
    thrives = interaction.options.getInteger('thrives') || 0;

    let embed = calculate(cashNeeded, round, mode, extraEor, thrives);

    await interaction.reply({ embeds: [embed] });
}

function calculate(cashNeeded, round, mode, extraEor, thrives) {
    let r; // "r" is the roundset array
    let incomeMultiplier = 1;
    let roundLimit = 140;
    switch (mode) {
        case 'chimps':
            r = income;
            break;
        case 'abr':
            r = abrincome;
            break;
        case 'halfcash':
            r = income;
            incomeMultiplier = 0.5;
            break;
    }

    let cashSoFar = 0;
    let originalRound = round;
    let rounds = [];
    let thriveRounds = [];

    while (Math.round(cashSoFar) < cashNeeded) {
        if (round > roundLimit) {
            if (thrives) break;
            return new Discord.EmbedBuilder()
                .setTitle(
                    `If you start popping at ${originalRound}, you can't get ${gHelper.numberAsCost(
                        cashNeeded
                    )} from popping bloons before random freeplay`
                )
                .setFooter({ text: 'freeplay rounds are random, hence cash is random' })
                .setColor(orange);
        }

        addToTotal = parseInt(r[round].cashThisRound) + extraEor;
        cashSoFar += addToTotal * incomeMultiplier;
        rounds.push(cashSoFar);
        addToTotal = 0;
        round++;
    }

    if (thrives) {
        thrives = Math.min(thrives, Math.ceil((round - originalRound) / 2));
        thriveRounds = thriveHelper.getOptimalThrives(originalRound, round - 1, thrives, mode);
        round = originalRound;
        cashSoFar = 0;
        while (Math.round(cashSoFar) < cashNeeded) {
            if (round > roundLimit)
                return new Discord.EmbedBuilder()
                    .setTitle(
                        `If you start popping at ${originalRound}, you can't get ${gHelper.numberAsCost(
                            cashNeeded
                        )} from popping bloons before random freeplay`
                    )
                    .setFooter({ text: 'freeplay rounds are random, hence cash is random' })
                    .setColor(orange);

            cashSoFar = rounds[round - originalRound];
            cashSoFar += thriveRounds[round - originalRound][0] * incomeMultiplier;
            round++;
        }
        thriveRounds = thriveRounds[round - originalRound - 1][1];

        for (let i of thriveRounds) {
            rounds[i - originalRound] += thriveHelper.getRoundThriveIncome(i) * incomeMultiplier;
            for (let j = i + 1; j < round; j++) {
                rounds[j - originalRound] += thriveHelper.getRoundThriveIncome(i) * incomeMultiplier;
                rounds[j - originalRound] += thriveHelper.getRoundThriveIncome(i + 1) * incomeMultiplier;
            }
        }
    }

    round--;
    // list them in a table
    let start = originalRound;
    let end = round;
    let table = '```\nstart | $0\n';
    let ellipsisUsed = false;
    for (let i = start; i <= end; i++) {
        let cumCash = rounds[i - start];
        if (i - start > 2 && end - i > 2) {
            if (thriveRounds.includes(i)) {
                table += `${`r${i}`.padEnd(6)}| $${gHelper.round(cumCash, 1)} (thrive)\n`;
                ellipsisUsed = false;
                continue;
            }
            if (!ellipsisUsed) table += '⋮\n';
            ellipsisUsed = true;
            continue;
        }
        table += `${`r${i}`.padEnd(6)}| $${gHelper.round(cumCash, 1)}` + (thriveRounds.includes(i) ? ' (thrive)\n' : '\n');
    }
    table += '```';

    let embed = new Discord.EmbedBuilder()
        .setTitle(
            `If you start popping (saving up) at round ${originalRound}` +
            (thrives ? ' and thrive at the start of the indicated rounds' : '') +
            `, you should get $${cashNeeded} during round ${round}`
        )
        .setDescription(table)
        .setColor(cyber);
    return embed;
}
module.exports = {
    data: builder,
    execute
};
