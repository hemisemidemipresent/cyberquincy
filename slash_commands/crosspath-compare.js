const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');

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

const UUU = ['3xx', '4xx', '5xx', 'x3x', 'x4x', 'x5x', 'xx3', 'xx4', 'xx5']

const pathOption = new SlashCommandStringOption()
    .setName('tower_path')
    .setDescription('The tower path that you want the information for')
    .setRequired(true)
UUU.forEach(u => {
    pathOption.addChoices({ name: u, value: u })
})

const builder = new SlashCommandBuilder()
    .setName('crosspath_compare')
    .setDescription("Compare crosspaths for a given tower that's T3 or above")
    .addStringOption(towerOption)
    .addStringOption(pathOption);

async function embedBloonology(towerName, upgrade) {
    let link = Towers.JSON_TOWER_NAME_TO_BLOONOLOGY_LINK[towerName];
    let res;
    try {
        res = await axios.get(link);
    } catch {
        return new Discord.MessageEmbed().setColor(red).setTitle('Something went wrong while fetching the data');
    }
    let body = res.data;

    const firstXIndex = upgrade.indexOf('x')
    const lastXIndex = upgrade.lastIndexOf('x')

    const noCrosspathUpgrade = upgrade.replace(/x/g, '0')

    const crosspathUpgrades = [
        upgrade.substring(0, firstXIndex) + '1' + upgrade.substring(firstXIndex + 1, lastXIndex) + '0' + upgrade.substring(lastXIndex + 1),
        upgrade.substring(0, firstXIndex) + '0' + upgrade.substring(firstXIndex + 1, lastXIndex) + '1' + upgrade.substring(lastXIndex + 1),
        upgrade.substring(0, firstXIndex) + '2' + upgrade.substring(firstXIndex + 1, lastXIndex) + '0' + upgrade.substring(lastXIndex + 1),
        upgrade.substring(0, firstXIndex) + '0' + upgrade.substring(firstXIndex + 1, lastXIndex) + '2' + upgrade.substring(lastXIndex + 1),
    ]

    const descriptions = body.split('\r\n\r\n'); // each newline is \r\n\r\n

    const noCrosspathDescription = cleanDescription(
        descriptions.find((description) => description.substr(0, 3) == noCrosspathUpgrade)
            .substr(3)
            .split(/(?:__Changes from Previous Tier__)|(?:Changes from previous tier:)/i)[0]
    );

    const crosspathDescriptions = crosspathUpgrades.map(u => cleanDescription(
        descriptions.find((description) => description.substr(0, 3) == u).substr(3)
    ))

    const crosspathBenefits = crosspathDescriptions.map(desc => 
        desc.split(/(?:__Crosspath Benefits__)|(?:Crosspath Benefits:)/i)[1]
            ?.trim()
            .split('\n').map(n => `• ${n}`).join('\n')
    )

    const title = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, ...Towers.pathTierFromUpgradeSet(noCrosspathUpgrade)) + ' Crosspathing Benefits';

    let embed = new Discord.MessageEmbed()
        .setTitle(title)
        .setFooter({ text: footer })
        .setColor(cyber);

    crosspathUpgrades.forEach((u, idx) => {
        embed.addField(u, crosspathBenefits[idx] || '\u200b', true)
        if (idx % 2 == 1) { // This is the only way to get a 2 column format in discord :eyeroll:
            embed.addField('\u200b', '\u200b', true)
        }
    })

    embed.addField(`${noCrosspathUpgrade} Stats`, noCrosspathDescription)

    return embed;
}

async function execute(interaction) {
    const tower = interaction.options.getString('tower');
    const towerPath = interaction.options.getString('tower_path')

    const embed = await embedBloonology(tower, towerPath);

    return await interaction.reply({ embeds: [embed], ephemeral: false });
}

// background info: there are 2 newlines present in the string: \n and \r. \n is preferred
function cleanDescription(desc) {
    return desc.toString()
        .replace(/\n/g, '') // removes all newlines \n
        .replace(/\r \t/g, '\n') // removes all \r + tab
        .replace(/ \t-/g, '-    ') // removes remaining tabs
        .replace(/\r/g, '\n'); // switches back all remaining \r with \n
}

module.exports = {
    data: builder,
    execute
};
