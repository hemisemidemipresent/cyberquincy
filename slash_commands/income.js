const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const r = require('../jsons/round_sets/regular.json');
const abr = require('../jsons/round_sets/abr.json');
const gHelper = require('../helpers/general.js');
const { red, magenta, yellow } = require('../jsons/colors.json');
const thriveHelper = require('../helpers/thrive.js');

builder = new SlashCommandBuilder()
    .setName('income')
    .setDescription('Calculate round income(s) for different gamemodes')

    .addIntegerOption((option) => option.setName('start_round').setDescription('Only/Starting Round').setRequired(true))
    .addIntegerOption((option) => option.setName('end_round').setDescription('End Round').setRequired(false))
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
    mode = interaction.options.getString('game_mode') || 'chimps';
    startRound = interaction.options.getInteger('start_round');
    endRound = interaction.options.getInteger('end_round') || startRound;
    extraIncome = interaction.options.getInteger('extra_round_income') || 0;
    thrives = interaction.options.getInteger('thrives') || 0;

    // Validations
    if (startRound < 1 || endRound < 1) {
        return `Must enter positive number for rounds (${endRound < startRound ? endRound : startRound})`;
    }
    if (endRound < startRound) {
        return `Must enter a higher end round than start round`;
    }
    if (startRound > 140 || endRound > 140) {
        return `R${endRound > startRound ? endRound : startRound} is not predetermined;` +
            ' therefore the calculation won\'t be consistent';
    }

    if (extraIncome < 0) {
        return `Must enter non-negative number for extra_round_income (${extraIncome})`;
    }
    if (thrives < 0) {
        return `Must enter non-negative number for thrives (${thrives})`;
    }
    if (startRound == endRound && thrives) {
        return 'Thrives are not supported for single round calculations';
    }

    return null;
}

function incomeEmbed(mode, start, end, extraEor = 0, thrives = 0) {
    let roundset = r;
    let multiplier = 1;
    let modeName = 'CHIMPS';
    switch (mode) {
        case 'halfcash':
            multiplier = 0.5;
            modeName = 'Half Cash CHIMPS';
            break;
        case 'abr':
            roundset = abr;
            modeName = 'ABR CHIMPS';
            break;
        case 'chimps':
            break;
    }

    // single-round data
    if (start === end) {
        let cashThisRound = roundset[start].cashThisRound * multiplier;
        return new Discord.EmbedBuilder()
            .setTitle(`You earn $${gHelper.round(cashThisRound)} in ${modeName} on round ${start}`)
            .setColor(magenta);
    }

    let thriveRounds = [];
    let cumulativeExtraIncome = new Array(end - start + 1).fill(0);

    if (extraEor) {
        for (let i = start; i <= end; i++) {
            cumulativeExtraIncome[i - start] = (i - start + 1) * extraEor;
        }
    }

    if (thrives) {
        thrives = Math.min(thrives, Math.ceil((end - start + 1) / 2));
        thriveRounds = thriveHelper.getOptimalThrives(start, end, thrives, mode);
        thriveRounds = thriveRounds[end - start][1];

        for (let i of thriveRounds) {
            cumulativeExtraIncome[i - start] += thriveHelper.getRoundThriveIncome(i);
            for (let j = i + 1; j <= end; j++) {
                cumulativeExtraIncome[j - start] += thriveHelper.getRoundThriveIncome(i);
                cumulativeExtraIncome[j - start] += thriveHelper.getRoundThriveIncome(i + 1);
            }
        }
    }


    // multiple-round data
    // list them all out in a table
    let table = '```\nstart | $0\n';
    let ellipsisUsed = false;
    for (let i = start; i <= end; i++) {
        let cumCash = roundset[i].cumulativeCash - roundset[start - 1].cumulativeCash;
        cumCash += cumulativeExtraIncome[i - start];
        cumCash *= multiplier;
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

    // form embed
    let income = roundset[end].cumulativeCash - roundset[start - 1].cumulativeCash;
    income += cumulativeExtraIncome[end - start];
    income *= multiplier;
    return new Discord.EmbedBuilder()
        .setTitle(`You will earn $${gHelper.round(income)} in ${modeName} from r${start}-r${end}` +
            (thrives ? ' if you thrive at the start of the indicated rounds' : ''))
        .setDescription(table)
        .setColor(magenta);
}

function chincomeEmbed(mode, round, extraEor = 0) {
    incomes = calculateChincomes(mode, round, extraEor);

    const modeTitled = (function (mode) {
        switch (mode) {
            case 'halfcash':
                return 'Half Cash';
            case 'chimps':
                return 'Standard';
            default:
                return mode.toUpperCase();
        }
    })(mode);

    const embedColour = (function (mode) {
        switch (mode) {
            case 'halfcash':
                return red;
            case 'chimps':
                return magenta;
            case 'abr':
                return yellow;
        }
    })(mode);

    embed = new Discord.EmbedBuilder()
        .setTitle(`${modeTitled} CHIMPS Incomes (R${round})`)
        .setColor(embedColour)
        .addFields([{ name: `R${round}`, value: `${incomes.rincome}` }]);

    if (incomes.chincomeExclusive) {
        embed.addFields([{ name: `Start -> End R${round - 1}`, value: `${incomes.chincomeExclusive}` }]);
    }

    embed.addFields([{ name: `Start -> End R${round}`, value: `${incomes.chincomeInclusive}` }]);

    if (round < 100) {
        embed.addFields([{ name: `Start R${round} -> End R100`, value: incomes.lincomeInclusive }]);
    }
    if (round < 99) {
        embed.addFields([{ name: `Start R${round + 1} -> End R100`, value: incomes.lincomeExclusive }]);
    }
    if (round > 100) {
        embed.addFields([{ name: `Start R101 -> End R${round}`, value: incomes.superChincomeInclusive }]);
    }
    embed.addFields([{ name: `Start R${round} -> End R140`, value: incomes.superLincomeInclusive }]);
    if (round < 140) {
        embed.addFields([{ name: `Start R${round + 1} -> End R140`, value: incomes.superLincomeExclusive }]);
    }

    if (round === 6 && mode !== 'abr') {
        embed.setFooter({ text: "Doesn't include starting cash" });
    }

    return embed;
}

function calculateChincomes(mode, round, extraEor = 0) {
    let incomes;
    if (mode == 'abr') {
        incomes = calculateAbrChincomes(round, extraEor);
    } else {
        incomes = calculateNormalChincomes(round, extraEor);
        if (mode == 'halfcash') {
            for (incomeType in incomes) {
                incomes[incomeType] /= 2;
            }
        }
    }
    for (incomeType in incomes) {
        if (incomes[incomeType] && typeof incomes[incomeType] == 'number') {
            incomes[incomeType] = gHelper.numberAsCost(incomes[incomeType].toFixed(1));
        }
    }
    return incomes;
}

function calculateAbrChincomes(round, extraEor = 0) {
    let incomes = {
        rincome: null,
        chincomeExclusive: null,
        chincomeInclusive: null,
        lincomeExclusive: null,
        lincomeInclusive: null,
        superChincomeInclusive: null,
        superLincomeInclusive: null,
        superLincomeExclusive: null
    };

    index = round;
    incomes.rincome = abr[index].cashThisRound + extraEor;
    // start is r3
    incomes.chincomeExclusive = abr[index - 1].cumulativeCash - abr[1].cashThisRound - abr[2].cashThisRound + (index - 3) * extraEor;

    incomes.chincomeInclusive = abr[index].cumulativeCash - abr[1].cashThisRound - abr[2].cashThisRound + (index - 2) * extraEor;
    if (round < 100) incomes.lincomeInclusive = abr[100].cumulativeCash - abr[index - 1].cumulativeCash + (101 - index) * extraEor;

    if (round < 99) incomes.lincomeExclusive = abr[100].cumulativeCash - abr[index].cumulativeCash + (100 - index) * extraEor;

    if (round > 100) incomes.superChincomeInclusive = abr[index].cumulativeCash - abr[100].cumulativeCash + (index - 100) * extraEor;

    incomes.superLincomeInclusive = abr[140].cumulativeCash - abr[index - 1].cumulativeCash + (141 - index) * extraEor;
    if (round < 140) incomes.superLincomeExclusive = abr[140].cumulativeCash - abr[index].cumulativeCash + (140 - index) * extraEor;

    return incomes;
}

function calculateNormalChincomes(round, extraEor = 0) {
    let incomes = {
        rincome: null,
        chincomeExclusive: null,
        chincomeInclusive: null,
        lincomeExclusive: null,
        lincomeInclusive: null,
        superChincomeInclusive: null,
        superLincomeInclusive: null,
        superLincomeExclusive: null
    };

    index = round;

    incomes.rincome = r[index].cashThisRound + extraEor;
    if (round > 6) incomes.chincomeExclusive = r[index - 1].cumulativeCash - r[5].cumulativeCash + 650 + (index - 6) * extraEor;

    incomes.chincomeInclusive = r[index].cumulativeCash - r[5].cumulativeCash + 650 + (index - 5) * extraEor;
    if (round < 100) incomes.lincomeInclusive = r[100].cumulativeCash - r[index - 1].cumulativeCash + (101 - index) * extraEor;

    if (round < 99) incomes.lincomeExclusive = r[100].cumulativeCash - r[index].cumulativeCash + (100 - index) * extraEor;

    if (round > 100) incomes.superChincomeInclusive = r[index].cumulativeCash - r[100].cumulativeCash + (index - 100) * extraEor;

    incomes.superLincomeInclusive = r[140].cumulativeCash - r[index - 1].cumulativeCash + (141 - index) * extraEor;
    if (round < 140) incomes.superLincomeExclusive = r[140].cumulativeCash - r[index].cumulativeCash + (140 - index) * extraEor;

    return incomes;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            flags: MessageFlags.Ephemeral
        });
    }

    mode = interaction.options.getString('game_mode') || 'chimps';
    startround = interaction.options.getInteger('start_round');
    endround = interaction.options.getInteger('end_round') || startround;
    extraEor = interaction.options.getInteger('extra_round_income') || 0;
    thrives = interaction.options.getInteger('thrives') || 0;

    if (startround == endround && startround >= 6) {
        return await interaction.reply({
            embeds: [chincomeEmbed(mode, startround, extraEor)]
        });
    } else {
        return await interaction.reply({
            embeds: [incomeEmbed(mode, startround, endround, extraEor, thrives)]
        });
    }
}

module.exports = {
    data: builder,
    execute
};
