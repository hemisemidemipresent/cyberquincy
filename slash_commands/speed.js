const { SlashCommandBuilder } = require('@discordjs/builders');
const gHelper = require('../helpers/general.js');
const { red, magenta, yellow } = require('../jsons/colours.json');

builder = new SlashCommandBuilder()
    .setName('speed')
    .setDescription('Calculate bloon speed based on the round')
    .addStringOption((option) =>
        option
            .setName('bloon_type')
            .setDescription('The type of bloon you want to find the speed for')
            .setRequired(true)
            .addChoice('Red', 'RED')
            .addChoice('Blue', 'BLUE')
            .addChoice('Green', 'GREEN')
            .addChoice('Yellow', 'YELLOW')
            .addChoice('Pink', 'PINK')
            .addChoice('Black', 'BLACK')
            .addChoice('White', 'WHITE')
            .addChoice('Purple', 'PURPLE')
            .addChoice('Lead', 'LEAD')
            .addChoice('Zebra', 'ZEBRA')
            .addChoice('Rainbow', 'RAINBOW')
            .addChoice('Ceramic', 'CERAMIC')
            .addChoice('MOAB', 'MOAB')
            .addChoice('BFB', 'BFB')
            .addChoice('ZOMG', 'ZOMG')
            .addChoice('DDT', 'DDT')
            .addChoice('BAD', 'BAD')
    )
    .addIntegerOption((option) => option.setName('round').setDescription('Round the bloon is on').setRequired(false));

function validateInput(interaction) {
    bloon_type = interaction.options.getString('bloon_type');
    round = interaction.options.getInteger('round');

    // Validation(s)
    if (!round && round < 1) return `Must enter positive numbers for rounds (${round} inputted)`;

    return null;
}

function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    bloon_type = interaction.options.getString('bloon_type');
    round = interaction.options.getInteger('round') || 40; // any round below 80 is default
    let baseBloonSpeed;
    switch (bloon_type) {
        case 'RED':
            baseBloonSpeed = 25;
            break;
        case 'BLUE':
            baseBloonSpeed = 35;
            break;
        case 'GREEN':
            baseBloonSpeed = 45;
            break;
        case 'YELLOW':
            baseBloonSpeed = 80;
            break;
        case 'PINK':
            baseBloonSpeed = 87.5;
            break;
        case 'BLACK':
            baseBloonSpeed = 45;
            break;
        case 'WHITE':
            baseBloonSpeed = 50;
            break;
        case 'PURPLE':
            baseBloonSpeed = 75;
            break;
        case 'LEAD':
            baseBloonSpeed = 25;
            break;
        case 'ZEBRA':
            baseBloonSpeed = 45;
            break;
        case 'RAINBOW':
            baseBloonSpeed = 45;
            break;
        case 'CERAMIC':
            baseBloonSpeed = 62.5;
            break;
        case 'MOAB':
            baseBloonSpeed = 25;
            break;
        case 'BFB':
            baseBloonSpeed = 6.25;
            break;
        case 'ZOMG':
            baseBloonSpeed = 4.5;
            break;
        case 'DDT':
            baseBloonSpeed = 68.75;
            break;
        case 'BAD':
            baseBloonSpeed = 4.5;
            break;
    }
    let actualBloonSpeed = baseBloonSpeed;
    if (round <= 80) actualBloonSpeed = baseBloonSpeed;
    else if (round <= 100) actualBloonSpeed *= 1 + (round - 80) * 0.02;
    else if (round <= 150) actualBloonSpeed *= 1.6 + (round - 101) * 0.02;
    else if (round <= 100) actualBloonSpeed *= 3.0 + (round - 151) * 0.02;
    else if (round <= 100) actualBloonSpeed *= 4.5 + (round - 201) * 0.02;
    else if (round > 251) actualBloonSpeed *= 6.0 + (round - 252) * 0.02;

    return interaction.reply({
        content: `The bloon speed for \`${bloon_type}\` on r${round} is ${actualBloonSpeed} (arbitrary units)`,
        ephemeral: true
    });
}

module.exports = {
    data: builder,
    execute
};
