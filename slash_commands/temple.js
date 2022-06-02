const { SlashCommandBuilder } = require('@discordjs/builders');
const { isValidTempleSet } = require('../helpers/towers');

const t = require('../jsons/temple.json');
const { yellow } = require('../jsons/colours.json');

builder = new SlashCommandBuilder()
    .setName('temple')
    .setDescription('Show temple stats')
    .addSubcommand((subcmd) =>
        subcmd
            .setName('by_category')
            .setDescription('Input the amount of money you sacrificed into the temple (you can get this with `/calc`)') //
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
                option.setName('support').setDescription('amt of money in SUPPORT towers sacrificed')
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
                        'temple with 3 level-9 sacrifices is 1110 if support was skipped, 1101 if magic was skipped, etc'
                    )
                    .setRequired(true)
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

    let embed = new Discord.MessageEmbed();
    embed.setTitle('Temple stats');
    embed.setColor(yellow);
    // there is probably a better way
    embed.addField(`Primary sacrifice ($${primary})`, t[0][0] + '\n' + levelToString(cashToLevel(primary), 0));
    embed.addField(`Military sacrifice ($${military})`, t[1][0] + '\n' + levelToString(cashToLevel(military), 1));
    embed.addField(`Magic sacrifice ($${magic})`, t[2][0] + '\n' + levelToString(cashToLevel(magic), 2));
    embed.addField(`Support sacrifice ($${support})`, t[3][0] + '\n' + levelToString(cashToLevel(support), 3));
    return await interaction.reply({ embeds: [embed] });
}

async function max_temple(interaction) {
    let temple_set = interaction.options.getString('temple_set');
    if (!isValidTempleSet(temple_set))
        return await interaction.reply(
            `Please enter a valid temple set!
            
            This command is for the statistics of a **maxed temple sacrifice**, i.e. the sacrifices **exceed** $50000.
            The **temple set** follows a format of \`<primary>/<military>/<magic>/<support>\`. So for example if you have max sacrifices for only primary and magic, your temple set will be \`1/0/1/0\` (this is usually shortened by removing the slashes to \`1010\`)

            Although this command accepts the temple set of \`1/1/1/1\` or \`1111\`, when sacrificing towers to a Sun Temple, only three categories count. If four categories are sacrificed then the cheapest is ignored.

            The True Sun God, however, can accept sacrifices from all four categories. 
            So for example if you had a \`1101\` temple that u max-sacrificed on all 4 categories, you would get \`1101\` + \`1111\` = \`2212\`
            `
        );
    let templeSet = temple_set
        .replace(/\/+/g, '')
        .split('')
        .map((x) => parseInt(x));

    let embed = new Discord.MessageEmbed().setColor(yellow);
    embed.setTitle(temple_set);

    for (let i = 0; i < 4; i++) {
        addSacrificeStats(embed, templeSet[i], i);
    }
    await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};

function addSacrificeStats(embed, num, i) {
    const titles = ['Primary sacrifice', 'Military sacrifice', 'Magic sacrifice', 'Support sacrifice'];

    if (num == 0) return;
    if (num == 1) {
        return embed.addField(titles[i], `${t[i][0]}\n${t[i][9]}`);
    }
    if (num == 2) {
        return embed.addField(titles[i], `${t[i][0]}\n${t[i][9]}\n**TSG**:\n${t2[i]}`);
    }
}

/**
 * input cash, returns a number from 0 - 9 about the temple's sacrifice level.
 * @param {int} cash
 * @returns {int}
 */
function cashToLevel(cash) {
    let sacrifice_levels = [300, 1000, 2000, 4000, 7500, 10000, 15000, 25000, 50000];
    for (let i = 0; i < 9; i++) {
        if (cash < sacrifice_levels[i]) return i;
    }
    return 9;
}
/**
 * given level and tower type, return the string
 * @param {int} level
 * @param {int} towerType
 * @returns
 */
function levelToString(level, towerType) {
    if (level == 0) return '\u200b';
    return t[towerType][level];
}
