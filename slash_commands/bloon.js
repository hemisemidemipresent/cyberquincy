const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const {
    Enemy,
    ENEMIES,
    ENEMIES_THAT_CAN_BE_SUPER,
    formatName,
    getSpeedRamping,
    getHealthRamping
} = require('../helpers/enemies');
const roundHelper = require('../helpers/rounds');
const { cyber } = require('../jsons/colors.json');

const enemyOption = new SlashCommandStringOption()
    .setName('bloon')
    .setDescription('The type of bloon you for which you want to find the health and speed')
    .setRequired(true);
ENEMIES.forEach((enemyName) => {
    enemyOption.addChoices({ name: formatName(enemyName), value: enemyName });
});

builder = new SlashCommandBuilder()
    .setName('bloon')
    .setDescription('See the stats and info for a given bloon')
    .addStringOption(enemyOption)
    .addStringOption((option) =>
        option
            .setName('fortified')
            .setDescription('Is the bloon fortified')
            .setRequired(false)
            .addChoices({ name: 'yes', value: 'Yes' })
    )
    .addStringOption((option) =>
        option
            .setName('camo')
            .setDescription('Is the bloon camo')
            .setRequired(false)
            .addChoices({ name: 'yes', value: 'Yes' })
    )
    .addStringOption((option) =>
        option
            .setName('regrow')
            .setDescription('Is the bloon regrow')
            .setRequired(false)
            .addChoices({ name: 'yes', value: 'Yes' })
    )
    .addIntegerOption((option) => option.setName('round').setDescription('Round the bloon is on').setRequired(false));

function validateInput(interaction) {
    const round = interaction.options.getInteger('round');

    if (round && !roundHelper.isValidRound(round)) {
        return `Must enter positive numbers for rounds less than ${roundHelper.ALL_ROUNDS[1]} (after which no bloons spawn)`;
    }
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const enemyName = interaction.options.getString('bloon');
    const round = interaction.options.getInteger('round') || 1;
    const fortified = !!interaction.options.getString('fortified');
    const camo = !!interaction.options.getString('camo');
    const regrow = !!interaction.options.getString('regrow');

    const enemy = new Enemy(enemyName, round, fortified, camo, regrow);

    const speedRamping = getSpeedRamping(round);
    const healthRamping = getHealthRamping(round);
    const healthRampingText = enemy.isMOAB() ? `${healthRamping} (x r80)` : "Doesn't scale";

    const ignoringSuper = ENEMIES_THAT_CAN_BE_SUPER.includes(enemy.name) ? ' (super and not)' : '';

    embed = new Discord.EmbedBuilder()
        .setTitle(`${enemy.description()} (r${round})`)
        .setThumbnail(await enemy.thumbnail())
        .setColor(cyber)
        .addFields([
            { name: 'Speed', value: `${enemy.speed(true)} rbs/s`, inline: true },
            { name: 'Layer Health', value: `${enemy.layerRBE(true)} rbe`, inline: true },
            { name: 'Total Health', value: `${enemy.totalRBE(true)} rbe`, inline: true },
            { name: 'Vertical Health', value: `${enemy.verticalRBE(true)} rbe`, inline: true },
            { name: 'Speed Factor', value: `${speedRamping} (x r80)`, inline: true },
            { name: 'Health Factor', value: `${healthRampingText}`, inline: true },
            { name: 'Direct Children', value: `${enemy.children(true)}`, inline: true },
            { name: 'Cash Earned', value: `${enemy.cash(true)}`, inline: true },
            { name: 'Cash Factor', value: `${roundHelper.cashFactorForRound(round)}`, inline: true },
            { name: `Normal Round Appearances${ignoringSuper}`, value: `${enemy.roundAppearances('r', true)}` },
            { name: `ABR Round Appearances${ignoringSuper}`, value: `${enemy.roundAppearances('ar', true)}` }
        ])
        .setFooter({ text: 'vertical health is the amount of damage required to one-shot the bloon' });

    const notes = enemy.notes();
    if (notes.length > 0) embed.addFields([{ name: 'Notes', value: `${notes.map((n) => ` • ${n}`).join('\n')}` }]);

    return await interaction.reply({
        embeds: [embed]
    });
}

module.exports = {
    data: builder,
    execute
};
