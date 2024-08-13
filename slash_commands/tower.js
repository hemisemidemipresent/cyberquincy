const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    SlashCommandBuilder,
    SlashCommandStringOption
} = require('discord.js');

const Towers = require('../helpers/towers.js');
const Bloonology = require('../helpers/bloonology.js');

const { discord, footer } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colors.json');

const towerOption = new SlashCommandStringOption()
    .setName('tower')
    .setDescription('The tower you are finding information for')
    .setRequired(true);
Object.keys(Bloonology.TOWER_NAME_TO_BLOONOLOGY_LINK).forEach((tower) => {
    towerOption.addChoices({ name: Aliases.toIndexNormalForm(tower), value: tower });
});

const builder = new SlashCommandBuilder()
    .setName('tower')
    .setDescription('Find information for each tower')
    .addStringOption(towerOption)
    .addStringOption((option) =>
        option.setName('tower_path').setDescription('The tower path that you want the information for').setRequired(true)
    )
    .addBooleanOption((option) => option.setName('battles2').setDescription('Is this for battles 2?').setRequired(false));

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
async function embedBloonology(towerName, upgrade, isB2) {
    let upgradeDescription;
    let latestVersion;
    try {
        upgradeDescription = await Bloonology.towerUpgradeToFullBloonology(towerName, upgrade, isB2);
        latestVersion = await Bloonology.towerLatestVersion(towerName, isB2);
    } catch (e) {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }
    const [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);

    const formattedUpgrade = upgrade.split('').join('-');
    const formattedTowerName = Aliases.toIndexNormalForm(towerName);

    let title;
    if (tier == 0) {
        title = `${formattedTowerName} (${formattedUpgrade})`;
    } else {
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        title = `${upgradeName} (${formattedUpgrade} ${formattedTowerName})`;
    }
    if (isB2) title += ' (battles2)';
    if (latestVersion !== null) title += ` (v${latestVersion})`;

    let cost = '';
    let totalCost = '';
    if (!isB2) {
        const easyCost = Towers.costOfTowerUpgrade(towerName, upgrade, 'easy');
        const mediumCost = Towers.costOfTowerUpgrade(towerName, upgrade, 'medium');
        const hardCost = Towers.costOfTowerUpgrade(towerName, upgrade, 'hard');
        const impopCost = Towers.costOfTowerUpgrade(towerName, upgrade, 'impoppable');
        cost = `${easyCost} - easy\n${mediumCost} - medium\n${hardCost} - hard\n${impopCost} - impoppable\n`;

        const easyTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, 'easy');
        const mediumTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, 'medium');
        const hardTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, 'hard');
        const impopTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, 'impoppable');
        totalCost = `${easyTotalCost} - easy\n${mediumTotalCost} - medium\n${hardTotalCost} - hard\n${impopTotalCost} - impoppable\n`;
    }
    if (isB2) {
        cost = `${Towers.costOfTowerUpgrade(towerName, upgrade, 'medium', 0, {}, isB2)} - battles2\n`;
        totalCost = `${Towers.costOfTowerUpgradeSet(towerName, upgrade, 'medium', 0, {}, isB2)} - battles2\n`;
    }

    let embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(upgradeDescription)
        .addFields([
            {
                name: 'cost',
                value: cost,
                inline: true
            },
            {
                name: 'total cost',
                value: totalCost,
                inline: true
            },
            { name: 'Incorrect/out of date information?', value: `please report them [here](${discord})` }
        ])
        .setFooter({ text: footer })
        .setColor(cyber);
    return embed;
}

async function embedBloonologySummary(towerName, isB2) {
    let baseDescription;
    try {
        baseDescription = await Bloonology.towerUpgradeToMainBloonology(towerName, "000", isB2, true);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    const tierUpgrades = [];
    let idx, tier;
    for (tier = 1; tier <= 5; tier++) {
        for (idx = 0; idx < 3; idx++) {
            tierUpgrades.push('000'.slice(0, idx) + `${tier}` + '000'.slice(idx + 1));
        }
    }

    let pathBenefits;
    try {
        pathBenefits = await Bloonology.towerUpgradesToTierChangeBloonology(towerName, tierUpgrades, isB2, true);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle('Something went wrong while fetching the data');
    }

    const headers = tierUpgrades.map((u) => {
        const [path, tier] = Towers.pathTierFromUpgradeSet(u);
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        return `${upgradeName} (${u})`;
    });

    const title = Aliases.toIndexNormalForm(towerName) + ' Summary';

    const embed = new Discord.EmbedBuilder().setTitle(title).setFooter({ text: footer }).setColor(cyber);

    embed.addFields([
        {
            name: `Base Stats`,
            value: baseDescription
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
    const isB2 = interaction.options.getBoolean('battles2') || false;

    let embed = await embedBloonology(tower, towerPath, isB2);

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
            let summaryEmbed = await embedBloonologySummary(tower, isB2);
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
