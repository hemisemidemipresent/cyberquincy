const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

const axios = require('axios');
const costs = require('../jsons/costs.json');
const Towers = require('../helpers/towers.js');
const { discord, footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colours.json');

const towerOption = new SlashCommandStringOption()
    .setName('tower')
    .setDescription('The tower you are finding information for')
    .setRequired(true);
Object.keys(Towers.JSON_TOWER_NAME_TO_BLOONOLOGY_LINK).forEach((tower) => {
    towerOption.addChoices({ name: Aliases.toIndexNormalForm(tower, '-'), value: tower });
});

const builder = new SlashCommandBuilder()
    .setName('tower')
    .setDescription('Find information for each tower')
    .addStringOption(towerOption)
    .addStringOption((option) =>
        option.setName('tower_path').setDescription('The tower path that you want the information for').setRequired(true)
    );

function validateInput(interaction) {
    const towerPath = parseTowerPath(interaction);
    if (isNaN(towerPath)) return "Tower path provided isn't `base` and contains non-numerical characters";
    if (!Towers.isValidUpgradeSet(towerPath)) return 'Invalid tower path provided!';
}

function parseTowerPath(interaction) {
    const tp = interaction.options.getString('tower_path').toLowerCase();
    if (tp == 'base') return '000';
    else return tp;
}

async function embedBloonology(towerName, upgrade) {
    let link = Towers.JSON_TOWER_NAME_TO_BLOONOLOGY_LINK[towerName];
    let res;
    try {
        res = await axios.get(link);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }
    let body = res.data;

    const tower = costs[towerName];
    const [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
    const totalCost = Towers.totalTowerUpgradeCrosspathCost(costs, towerName, upgrade);
    const hardTotalCost = Towers.totalTowerUpgradeCrosspathCostHard(costs, towerName, upgrade);
    const cost = upgrade == '000' ? totalCost : tower.upgrades[`${path}`][tier - 1];
    const upgradeFullDescription = body.split('\r\n\r\n'); // each newline is \r\n\r\n

    fullDescription = upgradeFullDescription.find((fullDescription) => fullDescription.substr(0, 3) == upgrade).substr(3);

    // background info: there are 2 newlines present in the string: \n and \r. \n is preferred
    let info = fullDescription
        .toString()
        .replace(/\n/g, '') // removes all newlines \n
        .replace(/\r \t/g, '\n') // removes all \r + tab
        .replace(/ \t-/g, '-    ') // removes remaining tabs
        .replace(/\r/g, '\n'); // switches back all remaining \r with \n

    const formattedUpgrade = upgrade.split('').join('-');
    const formattedTowerName = Aliases.toIndexNormalForm(towerName, '-');

    let title;
    if (tier <= 2) {
        title = `${formattedTowerName} (${formattedUpgrade})`;
    } else {
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        title = `${upgradeName} (${formattedUpgrade} ${formattedTowerName})`;
    }

    let embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(info)
        .addFields([
            {
                name: 'cost',
                value:
                    `${cost} - medium\n${Towers.hard(cost)} - hard\n` + `if this is wrong [yell at hemi here](${discord})`,
                inline: true
            },
            { name: 'total cost', value: `${totalCost} - medium\n${hardTotalCost} - hard`, inline: true },
            { name: 'Bug reporting', value: `report [here](${discord})`, inline: true }
        ])
        .setFooter({ text: footer })
        .setColor(cyber);
    return embed;
}
async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    const tower = interaction.options.getString('tower');
    const towerPath = parseTowerPath(interaction);

    const embed = await embedBloonology(tower, towerPath);

    return await interaction.reply({ embeds: [embed], ephemeral: false });
}

module.exports = {
    data: builder,
    execute
};
