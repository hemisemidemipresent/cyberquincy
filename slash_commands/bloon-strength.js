const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const EnemyHelper = require('../helpers/enemies')

const enemyOption = new SlashCommandStringOption()
    .setName('bloon_type')
    .setDescription('The type of bloon you for which you want to find the health and speed')
    .setRequired(true)
EnemyHelper.allBloons().forEach(bloon => {
    enemyOption.addChoice(
        Aliases.toIndexNormalForm(bloon),
        bloon
    )
})
EnemyHelper.allMOABs().forEach(moab => {
    enemyOption.addChoice(
        moab.toUpperCase(),
        moab,
    )
})

builder = new SlashCommandBuilder()
    .setName('speed')
    .setDescription('Calculate bloon speed and health based on the round')
    .addStringOption(enemyOption)
    .addIntegerOption((option) => 
        option.setName('round')
            .setDescription('Round the bloon is on')
            .setRequired(false)
    );

function validateInput(interaction) {
    const round = interaction.options.getInteger('round');

    if ((round || round == 0) && round < 1) {
        return `Must enter positive numbers for rounds (${round} inputted)`;
    }
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const bloonType = interaction.options.getString('bloon_type');
    const round = interaction.options.getInteger('round') || 80; // any round <=80 is default

    const r80BloonSpeed = EnemyHelper.RED_BLOON_SECONDS_PER_SECOND[bloonType]
    const speedRamping = EnemyHelper.getSpeedRamping(round)
    const actualBloonSpeed = r80BloonSpeed * speedRamping

    return await interaction.reply({
    });
}

module.exports = {
    data: builder,
    execute
};
