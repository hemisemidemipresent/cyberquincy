const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');
const { 
    Enemy,
    ENEMIES,
    BASE_RED_BLOON_SECONDS_PER_SECOND,
    ENEMIES_THAT_CAN_BE_SUPER,
    formatName,
    getSpeedRamping,
    getHealthRamping,
 } = require('../helpers/enemies')
const roundHelper = require('../helpers/rounds')
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

    if (round && !roundHelper.isValidRound(round)) {
        return `Must enter positive numbers for rounds less than ${roundHelper.ALL_ROUNDS[1]} (after which no bloons spawn)`;
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

    const enemy = new Enemy(enemyName, round, fortified, camo, regrow)

    const r80BloonSpeed = BASE_RED_BLOON_SECONDS_PER_SECOND[enemyName]
    const speedRamping = getSpeedRamping(round)
    const healthRamping = enemy.isMOAB() ? getHealthRamping(round) : "Doesn't scale"
    const actualBloonSpeed = r80BloonSpeed * speedRamping

    const displayRound = round <= 80 ? "1-80" : round

    const ignoringSuper = ENEMIES_THAT_CAN_BE_SUPER.includes(enemy.name) ? ' (super and not)' : ''

    embed = new Discord.MessageEmbed()
        .setTitle(`${enemy.description()} (r${displayRound})`)
        .setThumbnail(await enemy.thumbnail())
        .setColor(cyber)
        .addField('Speed', `${actualBloonSpeed} rbs/s`, true)
        .addField('Layer Health', `${enemy.layerRBE(true)} rbe`, true)
        .addField('Total Health', `${enemy.totalRBE(true)} rbe`, true)
        .addField('Vertical Health', `${enemy.verticalRBE(true)} total layers`, true)
        .addField('Speed Factor', `${speedRamping} (xr80)`, true)
        .addField('Health Factor', `${healthRamping} (xr80)`, true)
        .addField('Direct Children', `${enemy.children(true)}`)
        .addField(`Normal Round Appearances${ignoringSuper}`, `${enemy.roundAppearances('r', true)}`)
        .addField(`ABR Round Appearances${ignoringSuper}`, `${enemy.roundAppearances('ar', true)}`)

    const notes = enemy.notes()
    if (notes.length > 0) {
        embed.addField('Notes', `${notes.map(n => ` • ${n}`).join("\n")}`)
    }

    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
