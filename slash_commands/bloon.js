const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { 
    Enemy,
    ENEMIES,
    BASE_RED_BLOON_SECONDS_PER_SECOND,
    formatName,
    getSpeedRamping,
    getHealthRamping,
 } = require('../helpers/enemies')
const { cyber } = require('../jsons/colours.json')

const enemyOption = new SlashCommandStringOption()
    .setName('bloon')
    .setDescription('The type of bloon you for which you want to find the health and speed')
    .setRequired(true)
ENEMIES.forEach(enemyName => {
    enemyOption.addChoice(
        formatName(enemyName),
        enemyName
    )
})

builder = new SlashCommandBuilder()
    .setName('bloon')
    .setDescription('See the stats and info for a given bloon')
    .addStringOption(enemyOption)
    .addStringOption((option) =>
        option.setName('fortified')
            .setDescription('Is the bloon fortified')
            .setRequired(false)
            .addChoice('yes', 'Yes')
    )
    .addStringOption((option) =>
        option.setName('camo')
            .setDescription('Is the bloon camo')
            .setRequired(false)
            .addChoice('yes', 'Yes')
    )
    .addStringOption((option) =>
        option.setName('regrow')
            .setDescription('Is the bloon regrow')
            .setRequired(false)
            .addChoice('yes', 'Yes')
    )
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

    const enemyName = interaction.options.getString('bloon');
    const round = interaction.options.getInteger('round') || 80; // any round <=80 is default
    const fortified = !!interaction.options.getString('fortified')
    const camo = !!interaction.options.getString('camo')
    const regrow = !!interaction.options.getString('regrow')

    const r80BloonSpeed = BASE_RED_BLOON_SECONDS_PER_SECOND[enemyName]
    const speedRamping = getSpeedRamping(round)
    const healthRamping = getHealthRamping(round)
    const actualBloonSpeed = r80BloonSpeed * speedRamping

    const enemy = new Enemy(enemyName, round, fortified, camo, regrow)

    const displayRound = round <= 80 ? "1-80" : round

    embed = new Discord.MessageEmbed()
        .setTitle(`${enemy.description()} (R${displayRound})`)
        .setThumbnail(await enemy.thumbnail())
        .setColor(cyber)
        .addField('Speed', `${actualBloonSpeed} RBS/s`, true)
        .addField('• Layer Health', `${enemy.layerRBE(true)} RBE`, true)
        .addField('⤩ Total Health', `${enemy.totalRBE(true)} RBE`, true)
        .addField('↓ Vertical Health', `${enemy.verticalRBE(true)} RBE`, true)
        .addField('Speed Factor', `${speedRamping} (xR80)`, true)
        .addField('Health Factor', `${healthRamping} (xR80)`, true)

    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
