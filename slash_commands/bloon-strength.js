const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const enemyHelper = require('../helpers/enemies')
const { cyber } = require('../jsons/colours.json')

const enemyOption = new SlashCommandStringOption()
    .setName('bloon_type')
    .setDescription('The type of bloon you for which you want to find the health and speed')
    .setRequired(true)
enemyHelper.allEnemies().forEach(enemy => {
    enemyOption.addChoice(
        enemyHelper.formatEnemy(enemy),
        enemy
    )
})

builder = new SlashCommandBuilder()
    .setName('bloon-strength')
    .setDescription('Calculate bloon speed and health based on the round')
    .addStringOption(enemyOption)
    .addIntegerOption((option) => 
        option.setName('round')
            .setDescription('Round the bloon is on')
            .setRequired(false)
    )
    .addBooleanOption((option) =>
        option.setName('fortified')
            .setDescription('Is the bloon fortified')
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

    const enemy = interaction.options.getString('bloon_type');
    const round = interaction.options.getInteger('round') || 80; // any round <=80 is default

    const r80BloonSpeed = enemyHelper.RED_BLOON_SECONDS_PER_SECOND[enemy]
    const speedRamping = enemyHelper.getSpeedRamping(round)
    const actualBloonSpeed = r80BloonSpeed * speedRamping
    console.log(r80BloonSpeed, speedRamping, actualBloonSpeed)

    embed = new Discord.MessageEmbed()
        .setTitle(`Stats for a R${round} ${enemyHelper.formatEnemy(enemy, true)}`)
        .setColor(cyber)
        // Speed
        .addField('Speed (RBS/s)', `${actualBloonSpeed}`, true)
        .addField('Speed Factor (R80 x ?)', `${speedRamping}`)
        // Health
        .addField('Layer Health (RBE)', `${1}`)

    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
