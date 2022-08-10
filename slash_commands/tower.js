const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    SlashCommandBuilder,
    SlashCommandStringOption
} = require('discord.js');

const axios = require('axios');

const costs = require('../jsons/costs.json');
const Towers = require('../helpers/towers.js');

const bHelper = require('../helpers/bloons-general');

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
    if (!towerPath) return;
    if (isNaN(towerPath)) return "Tower path provided isn't `base` and contains non-numerical characters";
    if (!Towers.isValidUpgradeSet(towerPath)) return 'Invalid tower path provided!';
}

function parseTowerPath(interaction) {
    const tp = interaction.options.getString('tower_path')?.toLowerCase();
    if (tp == 'base') return '000';
    else return tp;
}

// the function that creates the embed for bloonology that will get sent
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

    const allUpgradeDescriptions = body.split('\r\n\r\n'); // each newline is \r\n\r\n

    const upgradeDescription = cleanDescription(
        allUpgradeDescriptions.find((fullDescription) => fullDescription.substr(0, 3) == upgrade).substr(3)
    );

    const formattedUpgrade = upgrade.split('').join('-');
    const formattedTowerName = Aliases.toIndexNormalForm(towerName, '-');

    let title;
    if (tier == 0) {
        title = `${formattedTowerName} (${formattedUpgrade})`;
    } else {
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        title = `${upgradeName} (${formattedUpgrade} ${formattedTowerName})`;
    }

    const cost = upgrade == '000' ? totalCost : tower.upgrades[`${path}`][tier - 1];

    const easyTotalCost = Towers.totalTowerUpgradeCrosspathCostMult(costs, towerName, upgrade, 'easy');
    const totalCost = Towers.totalTowerUpgradeCrosspathCost(costs, towerName, upgrade);
    const hardTotalCost = Towers.totalTowerUpgradeCrosspathCostMult(costs, towerName, upgrade, 'hard');
    const impopTotalCost = Towers.totalTowerUpgradeCrosspathCostMult(costs, towerName, upgrade, 'impoppable');

    let embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(upgradeDescription)
        .addFields([
            {
                name: 'cost',
                value:
                    `${bHelper.difficultyPriceMult(cost, 'easy')} - easy\n` +
                    `${cost} - medium\n` +
                    `${bHelper.difficultyPriceMult(cost, 'hard')} - hard\n` +
                    `${bHelper.difficultyPriceMult(cost, 'impoppable')} - impoppable\n` +
                    `if this is wrong [yell at hemi here](${discord})`,
                inline: true
            },
            {
                name: 'total cost',
                value:
                    `${easyTotalCost} - easy\n` +
                    `${totalCost} - medium\n` +
                    `${hardTotalCost} - hard\n` +
                    `${impopTotalCost} - impoppable\n`,
                inline: true
            },
            { name: 'Bug reporting', value: `report [here](${discord})`, inline: true }
        ])
        .setFooter({ text: footer })
        .setColor(cyber);
    return embed;
}

async function embedBloonologySummary(towerName) {
    let link = Towers.JSON_TOWER_NAME_TO_BLOONOLOGY_LINK[towerName];
    let res;
    try {
        res = await axios.get(link);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }
    let body = res.data;

    const descriptions = body.split('\r\n\r\n'); // each newline is \r\n\r\n

    const tierUpgrades = [];
    let idx, tier;
    for (tier = 1; tier <= 5; tier++) {
        for (idx = 0; idx < 3; idx++) {
            tierUpgrades.push('000'.slice(0, idx) + `${tier}` + '000'.slice(idx + 1));
        }
    }

    const pathDescriptions = tierUpgrades.map((u) =>
        cleanDescription(descriptions.find((description) => description.substr(0, 3) == u).substr(3))
    );

    const splitTexts = [
        '__Changes from 0-0-0__',
        'Changes from 000:',
        '__Changes from Previous Tier__',
        'Changes from previous tier:',
        '__Crosspath Benefits__',
        'Crosspath Benefits:'
    ];
    const splitTextsRegexStr = splitTexts.map((st) => `(?:${st})`).join('|');

    const pathBenefits = pathDescriptions.map((desc) => {
        // We're relying on Changes from Previous Tier being the first header after the upgrade details
        const rawBenefits = desc.split(new RegExp(splitTextsRegexStr, 'i'))[1]?.trim();
        return rawBenefits
            .split('\n')
            .map((n) => `⟴ ${n}`)
            .join('\n');
    });

    const headers = tierUpgrades.map((u) => {
        const [path, tier] = Towers.pathTierFromUpgradeSet(u);
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        return `${upgradeName} (${u})`;
    });

    const placedTowerDescription = cleanDescription(
        descriptions.find((description) => description.substr(0, 3) == '000').substr(3)
    );

    const title = Aliases.toIndexNormalForm(towerName, '-') + ' Summary';

    const embed = new Discord.EmbedBuilder().setTitle(title).setFooter({ text: footer }).setColor(cyber);

    embed.addFields([
        {
            name: `Base Stats`,
            value: placedTowerDescription
                .split(/(?:\n|\r)+/)
                .map((s) => s.trim().replace(/\u200E/g, ''))
                .filter((s) => s.length > 0)
                .join(' ♦ ')
        }
    ]);

    headers.forEach((header, idx) => embed.addFields([{ name: header, value: pathBenefits[idx], inline: true }]));

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

    let embed = await embedBloonology(tower, towerPath);

    const summaryBtn = new ButtonBuilder()
        .setCustomId('summary')
        .setLabel('See summary of all upgrades')
        .setStyle(ButtonStyle.Primary);

    await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(summaryBtn)] });

    // collector filter
    const filter = (selection) => {
        // Ensure user clicking button is same as the user that started the interaction
        if (selection.user.id !== interaction.user.id) return false;
        // Ensure that the button press corresponds with this interaction and wasn't a button press on the previous interaction
        if (selection.message.interaction.id !== interaction.id) return false;
        return true;
    };

    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 20000
    });

    collector.on('collect', async (buttonInteraction) => {
        collector.stop();
        buttonInteraction.deferUpdate();

        if (buttonInteraction.customId === 'summary') {
            let summaryEmbed = await embedBloonologySummary(tower);
            await interaction.editReply({
                embeds: [summaryEmbed],
                components: [],
                ephemeral: true
            });
        }
    });

    collector.on('end', async (collected) => {
        if (collected.size === 0)
            await interaction.editReply({
                embeds: [embed],
                components: []
            });
    });
}

module.exports = {
    data: builder,
    execute
};
// background info: there are 2 newlines present in the string: \n and \r. \n is preferred
function cleanDescription(desc) {
    return desc
        .toString()
        .replace(/\n/g, '') // removes all newlines \n
        .replace(/\r \t/g, '\n') // removes all \r + tab
        .replace(/ \t-/g, '-    ') // removes remaining tabs
        .replace(/\r/g, '\n'); // switches back all remaining \r with \n
}
