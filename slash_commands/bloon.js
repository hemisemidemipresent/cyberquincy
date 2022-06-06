const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { 
    Enemy,
    ENEMIES,
    BASE_RED_BLOON_SECONDS_PER_SECOND,
    formatName,
    getSpeedRamping,
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
    .addIntegerOption((option) => 
        option.setName('round')
            .setDescription('Round the bloon is on')
            .setRequired(false)
    )
    .addStringOption((option) =>
        option.setName('fortified')
            .setDescription('Is the bloon fortified')
            .setRequired(false)
            .addChoice('yes', 'Yes')
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

    const r80BloonSpeed = BASE_RED_BLOON_SECONDS_PER_SECOND[enemyName]
    const speedRamping = getSpeedRamping(round)
    const actualBloonSpeed = r80BloonSpeed * speedRamping

    const enemy = new Enemy(enemyName, round)

    console.log(enemy.thumbnail())

    embed = new Discord.MessageEmbed()
        .setTitle(`${enemy.formatName(true)} (R${round})`)
        .setThumbnail(`https://static.wikia.nocookie.net/b__/images/f/f2/BTD6Red.png/revision/latest?cb=20180809060915&path-prefix=bloons`)
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
