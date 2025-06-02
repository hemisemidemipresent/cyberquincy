const { SlashCommandBuilder } = require('discord.js');
const { isValidTempleSet } = require('../helpers/towers');
const { templeBloonology } = require('../helpers/bloonology');

const { yellow } = require('../jsons/colors.json');

builder = new SlashCommandBuilder()
    .setName('temple')
    .setDescription('Show temple stats')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('by_category')
            .setDescription('Input the amount of money you sacrificed to the temple (you can get this with `/calc`)')
            .addIntegerOption((option) =>
                option.setName('primary').setDescription('Total amount of money in PRIMARY towers sacrificed')
            )
            .addIntegerOption((option) =>
                option.setName('military').setDescription('Total amount of money in MILITARY towers sacrificed')
            )
            .addIntegerOption((option) =>
                option.setName('magic').setDescription('Total amount of money in MAGIC towers sacrificed')
            )
            .addIntegerOption((option) =>
                option.setName('support').setDescription('Total amount of money in SUPPORT towers sacrificed')
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('max_temple')
            .setDescription('Input "max" temple (e.g. 1110, 2212)')
            .addStringOption((option) =>
                option
                    .setName('temple_set')
                    .setDescription(
                        'Temple with 3 level-9 sacrifices is 1110 if support was skipped, 1101 if magic was skipped, etc'
                    )
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName('temple_upgrade')
                    .setDescription('The temple upgrade for the base stats')
                    .addChoices(
                        { name: '400', value: '400' },
                        { name: '410', value: '410' },
                        { name: '420', value: '420' },
                        { name: '401', value: '401' },
                        { name: '402', value: '402' },
                        { name: '500', value: '500' },
                        { name: '510', value: '510' },
                        { name: '520', value: '520' },
                        { name: '501', value: '501' },
                        { name: '502', value: '502' }
                    )
            )
            .addBooleanOption((option) =>
                option
                    .setName('vtsg')
                    .setDescription('Use the stats of a Vengeful True Sun God?')
            )
    );

async function execute(interaction) {
    if (interaction.options.getSubcommand() == 'by_category') await by_category(interaction);
    else await max_temple(interaction);
}

async function by_category(interaction) {
    let primary = interaction.options.getInteger('primary') || 0;
    let military = interaction.options.getInteger('military') || 0;
    let magic = interaction.options.getInteger('magic') || 0;
    let support = interaction.options.getInteger('support') || 0;

    let embed = new Discord.EmbedBuilder();
    embed.setColor(yellow);

    let desc = templeBloonology('400', primary, military, magic, support);
    if (desc === '') {
        embed.setDescription(
            'No changes from the base temple due to insufficient sacrifices to meet the threshold'
        );
    } else {
        embed.setDescription(desc + '\n\nThis command only tells you the **changes** from the base temple due to sacrifices. For the base temple stats, please use `/tower`');
    }
    embed.setFooter({ text: 'Cash thresholds for levels are: 300, 1001, 2001, 4001, 7501, 10001, 15001, 25001, 50001' });

    return await interaction.reply({ embeds: [embed] });
}

async function max_temple(interaction) {
    let temple_set = interaction.options.getString('temple_set');
    let temple_upgrade = interaction.options.getString('temple_upgrade');
    let is_vtsg = interaction.options.getBoolean('vtsg') || false;

    if (!isValidTempleSet(temple_set)) {
        return await interaction.reply(
            `Please enter a valid temple set!
            
            This command is for the statistics of a **maxed temple sacrifice**, i.e. the sacrifices **exceed** $50,000.
            The **temple set** follows a format of \`<primary>/<military>/<magic>/<support>\`. So for example if you have max sacrifices for only primary and magic, your temple set will be \`1/0/1/0\` (this is usually shortened by removing the slashes to \`1010\`)

            Although this command accepts the temple set of \`1/1/1/1\` or \`1111\`, when sacrificing towers to a Sun Temple, only three categories count. If four categories are sacrificed then the cheapest is ignored.

            The True Sun God, however, can accept sacrifices from all four categories. 
            So for example if you had a \`1101\` temple that u max-sacrificed on all 4 categories, you would get \`1101\` + \`1111\` = \`2212\`
            `
        );
    }

    let templeSet = temple_set
        .replace(/\/+/g, '')
        .split('')
        .map((x) => parseInt(x));
    let sacrifices;
    if (templeSet.includes(2)) {
        temple_upgrade = temple_upgrade || '500';
        sacrifices = [...templeSet.map(x => x === 2 ? 50001 : 0), ...templeSet.map(x => x >= 1 ? 50001 : 0)];
    } else {
        temple_upgrade = temple_upgrade || '400';
        sacrifices = templeSet.map(x => x === 1 ? 50001 : 0);
    }

    let desc = templeBloonology(temple_upgrade, ...sacrifices, vtsg = is_vtsg);
    let embed = new Discord.EmbedBuilder().setColor(yellow);
    embed.setTitle(temple_set);
    embed.setDescription(desc + '\n\nThis command only tells you the **changes** from the base temple due to sacrifices. For the base temple stats, please use `/tower`');
    await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};