const { SlashCommandBuilder } = require('@discordjs/builders');
const r = require('../jsons/income-normal.json');
const abr = require('../jsons/income-abr.json');
const gHelper = require('../helpers/general.js');
const { red, magenta, yellow } = require('../jsons/colours.json');

builder = new SlashCommandBuilder()
    .setName('income')
    .setDescription('Calculate round income(s) for different gamemodes')
    .addStringOption(option =>
        option.setName('game_mode')
            .setDescription('CHIMPS/ABR/HALFCASH')
            .setRequired(true)
            .addChoice('CHIMPS', 'chimps')
            .addChoice('ABR', 'abr')
            .addChoice('Half Cash', 'halfcash')
    ).addIntegerOption(option => 
        option.setName('start_round')
            .setDescription('Only/Starting Round')
            .setRequired(true)
    ).addIntegerOption(option => 
        option.setName('end_round')
            .setDescription('End Round')
            .setRequired(false)
    );

function validateInput(interaction) {
    mode = interaction.options.getString('game_mode');
    startround = interaction.options.getInteger('start_round');
    endround = interaction.options.getInteger('end_round') || startround;

    // Validations
    if (startround < 1 || endround < 1) {
        return `Can't enter negative numbers for rounds (${endround < startround ? endround : startround})`
    }
    if (endround < startround) {
        return `You entered a lower end round than start round`
    }
    if (startround > 140 || endround > 140) {
        return `R${endround  > startround ? endround : startround} is not predetermined; therefore the calculation won't be consistent`
    }
    if (mode == 'abr') {
        if (startround < 3 || endround < 3) {
            return "There is no support for rounds 1 and 2 abr income calculation"
        }
        if (startround > 100 || endround > 100) {
            return `R${endround  > startround ? endround : startround} is not predetermined in ABR; therefore the calculation won't be consistent`
        }
    }
    return null;
}

function incomeEmbed(mode, startround, endround) {
    switch (mode) {
        case 'halfcash':
            return halfIncome(startround, endround)
        case 'chimps':
            return normalIncome(startround, endround)
        case 'abr':
            return abrIncome(startround, endround)
    }
}

function normalIncome(startround, endround) {
    let startroundObject = r[startround - 1]; // thats just how it works
    let endroundObject = r[endround];
    let income = endroundObject.cumulativeCash - startroundObject.cumulativeCash;
    return new Discord.MessageEmbed()
        .setTitle(
            `$${
                Math.trunc(income * 100) / 100
            } earned in CHIMPS from rounds ${startround} to ${endround} inclusive`
        )
        .setColor(magenta)
        .setFooter('not including starting cash');
}

function halfIncome(startround, endround) {
    let startroundObject = r[startround - 1]; // thats just how it works
    let endroundObject = r[endround];
    let income = (endroundObject.cumulativeCash - startroundObject.cumulativeCash) / 2;
    return new Discord.MessageEmbed()
        .setTitle(
            `$${
                Math.trunc(income * 100) / 100
            } earned in Half Cash CHIMPS from rounds ${startround} to ${endround} inclusive`
        )
        .setColor(red)
        .setFooter('not including starting cash');
}

function abrIncome(startround, endround) {
    let startroundObject = abr[startround - 1];
    let endroundObject = abr[endround];
    let income = endroundObject.cumulativeCash - startroundObject.cumulativeCash;
    return new Discord.MessageEmbed()
        .setTitle(
            `$${
                Math.trunc(income * 100) / 100
            } earned in ABR CHIMPS from rounds ${startround} to ${endround} inclusive`
        )
        .setColor(yellow)
        .setFooter('not including starting cash');
}

function chincomeEmbed(mode, round) {
    incomes = calculateChincomes(mode, round);

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

    embed = new Discord.MessageEmbed()
        .setTitle(`${modeTitled} CHIMPS Incomes (R${round})`)
        .setColor(embedColour)
        .addField(`R${round}`, `${incomes.rincome}`);

    if (incomes.chincomeExclusive) {
        embed.addField(`Start -> End R${round - 1}`, `${incomes.chincomeExclusive}`);
    }

    embed.addField(`Start -> End R${round}`, `${incomes.chincomeInclusive}`);

    if (round < 100) {
        embed.addField(
            `Start R${round} -> End R100`,
            incomes.lincomeInclusive
        );
    }
    if (round < 99) {
        embed.addField(`Start R${round + 1} -> End R100`, incomes.lincomeExclusive);
    }
    if (round > 100) {
        embed.addField(`Start R101 -> End R${round}`, incomes.superChincomeInclusive);
    }
    if (mode !== 'abr') {
        embed.addField(
            `Start R${round} -> End R140`,
            incomes.superLincomeInclusive
        );
    }
    if (round < 140 && mode !== 'abr') {
        embed.addField(`Start R${round + 1} -> End R140`, incomes.superLincomeExclusive);
    }

    if (round === 6 && mode !== 'abr') {
        embed.setFooter("*Doesn't include starting cash");
    }

    return embed;
}

function calculateChincomes(mode, round) {
    let incomes;
    if (mode == 'abr') {
        incomes = calculateAbrChincomes(round)
    } else {
        incomes = calculateNormalChincomes(round)
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

function calculateAbrChincomes(round) {
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
    incomes.rincome = abr[index].cashThisRound;
    // start is r3
    incomes.chincomeExclusive = abr[index - 1].cumulativeCash;

    incomes.chincomeInclusive = abr[index].cumulativeCash;
    if (round < 100)
        incomes.lincomeInclusive = abr[100].cumulativeCash - abr[index - 1].cumulativeCash;

    if (round < 99)
        incomes.lincomeExclusive = abr[100].cumulativeCash - abr[index].cumulativeCash;

    if (round > 100) incomes.superChincomeInclusive = 'abr past 100 is random'; // these wont actually be shown in the embed since <round> cannot be greater than 100 if mode is abr

    incomes.superLincomeInclusive = 'abr past 100 is random';

    if (round < 140) incomes.superLincomeExclusive = 'abr past 100 is random';

    return incomes;
}

function calculateNormalChincomes(round) {
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

    incomes.rincome = r[index].cashThisRound;
    if (round > 6)
        incomes.chincomeExclusive = r[index - 1].cumulativeCash - r[5].cumulativeCash + 650;

    incomes.chincomeInclusive = r[index].cumulativeCash - r[5].cumulativeCash + 650;
    if (round < 100)
        incomes.lincomeInclusive = r[100].cumulativeCash - r[index - 1].cumulativeCash;

    if (round < 99) incomes.lincomeExclusive = r[100].cumulativeCash - r[index].cumulativeCash;

    if (round > 100)
        incomes.superChincomeInclusive = r[index].cumulativeCash - r[100].cumulativeCash;

    incomes.superLincomeInclusive = r[140].cumulativeCash - r[index - 1].cumulativeCash;
    if (round < 140)
        incomes.superLincomeExclusive = r[140].cumulativeCash - r[index].cumulativeCash;

    return incomes;
}

function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({ 
            content: validationFailure, 
            ephemeral: true
        });
    }
    
    mode = interaction.options.getString('game_mode');
    startround = interaction.options.getInteger('start_round');
    endround = interaction.options.getInteger('end_round') || startround;

    if (startround == endround && startround >= 6) {
        return interaction.reply({
            embeds: [chincomeEmbed(mode, startround)]
        })
    } else {
        return interaction.reply({
            embeds: [incomeEmbed(mode, startround, endround)]
        })
    }
}

module.exports = {
	data: builder,
    execute,
};
