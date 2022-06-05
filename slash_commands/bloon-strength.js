const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { 
    Enemy,
    ENEMIES,
    RED_BLOON_SECONDS_PER_SECOND,
    formatName,
    getSpeedRamping,
 } = require('../helpers/enemies')
const { cyber } = require('../jsons/colours.json')

const enemyOption = new SlashCommandStringOption()
    .setName('bloon_type')
    .setDescription('The type of bloon you for which you want to find the health and speed')
    .setRequired(true)
ENEMIES.forEach(enemyName => {
    enemyOption.addChoice(
        formatName(enemyName),
        enemyName
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

    const enemyName = interaction.options.getString('bloon_type');
    const round = interaction.options.getInteger('round') || 80; // any round <=80 is default

    const r80BloonSpeed = RED_BLOON_SECONDS_PER_SECOND[enemyName]
    const speedRamping = getSpeedRamping(round)
    const actualBloonSpeed = r80BloonSpeed * speedRamping

    const enemy = new Enemy(enemyName, round)

    embed = new Discord.MessageEmbed()
        .setTitle(`Stats for a R${round} ${enemy.format(true)}`)
        .setColor(cyber)
        // Speed
        .addField('Speed (RBS/s)', `${actualBloonSpeed}`, true)
        .addField('Speed Factor (R80 x ?)', `${speedRamping}`)
        // Health
        .addField('Layer Health (RBE)', `TBD`)

    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
