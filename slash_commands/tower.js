const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    MessageFlags,
    SlashCommandBuilder,
    SlashCommandStringOption,
} = require("discord.js");

const FuzzySet = require('fuzzyset.js');

const Towers = require("../helpers/towers.js");
const Bloonology = require("../helpers/bloonology.js");

const pageNames = require("../jsons/tower_pages.json")

const { scrapeCosts } = require("../services/wiki/costs_scraper");
const { scrapePages } = require("../services/wiki/tower_page_scraper.js");

const { discord, footer } = require("../aliases/misc.json");
const { red, cyber } = require("../jsons/colors.json");

const towerOption = new SlashCommandStringOption()
    .setName("tower")
    .setDescription("The tower you are finding information for")
    .setRequired(true)
    .setAutocomplete(true);
// oh my god there are 26 towers but only 25 options in a string input, we need to do autocomplete...
// Towers.allTowers().forEach((tower, index) => {
    // towerOption.addChoices({ name: Aliases.toIndexNormalForm(tower), value: tower });
// });

const reloadOption = new SlashCommandStringOption()
    .setName("reload")
    .setDescription("Do you need to reload prices from the wiki but for a much slower runtime?")
    .setRequired(false)
    .addChoices({ name: "Yes", value: "yes" });

const builder = new SlashCommandBuilder()
    .setName("tower")
    .setDescription("Find information for each tower")
    .addStringOption(towerOption)
    .addStringOption((option) =>
        option
            .setName("tower_path")
            .setDescription("The tower path that you want the information for")
            .setRequired(true),
    )
    .addBooleanOption((option) =>
        option.setName("battles2").setDescription("Is this for battles 2?").setRequired(false),
    )
    .addStringOption(reloadOption);

function validateInput(interaction) {
    let tower = interaction.options.getString("tower");
    tower = Aliases.toAliasNormalForm(tower)
    if (!Towers.allTowers().includes(tower)) {
        return new Discord.EmbedBuilder()
            .setTitle("Invalid tower specified!")
            .setDescription(
                `${tower} is not a valid tower name`,
            )
            .setColor(red);
    }
    const towerPath = parseTowerPath(interaction);
    if (!towerPath || isNaN(towerPath) || !Towers.isValidUpgradeSet(towerPath)) {
        return new Discord.EmbedBuilder()
            .setTitle("Invalid tower path!")
            .setDescription(
                `## What is a tower path?
                - It is a three-digit number like \`010\`, \`052\`, \`014\` or even \`000\`.
                - the first digit represents the number of upgrades applied on the top path
                - the second digit represents the number of upgrades applied on the middle path
                - the third digit represents the number of upgrades on the bottom path
                - So in this image, the tower path would be \`015\`:`,
            )
            .setImage("https://i.imgur.com/ePWcSnu.png")
            .setColor(red);
    }


}

function parseTowerPath(interaction) {
    const tp = interaction.options.getString("tower_path")?.toLowerCase();
    if (tp == "base") return "000";
    else return tp;
}

// the function that creates the embed for bloonology that will get sent
async function embedBloonology(towerName, upgrade, isB2) {
    let upgradeDescription;
    let latestVersion;
    const [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);

    try {
        // encapsulate into its own fn? Towers.wikiPageFromTowerUpgrade
        let pageName = ""
        if (tier == 0) pageName = pageNames[towerName].pageName
        else pageName = pageNames[towerName].upgrades[path][tier]

        upgradeDescription = `## [Bloons Wiki Link](${encodeURI("https://www.bloonswiki.com/" + pageName)})`;

        if (towerName in Bloonology.TOWER_NAME_TO_BLOONOLOGY_LINK) {
            upgradeDescription += `\n-# Bloonology stats:\n${await Bloonology.towerUpgradeToFullBloonology(towerName, upgrade, isB2)}`
            latestVersion = await Bloonology.towerLatestVersion(towerName, isB2);
        }


    } catch (e) {
        console.log(e)
        return new Discord.EmbedBuilder().setColor(red).setTitle("Something went wrong while fetching the data");
    }

    const formattedUpgrade = upgrade.split("").join("-");
    const formattedTowerName = Aliases.toIndexNormalForm(towerName);

    let title;
    if (tier == 0) {
        title = `${formattedTowerName} (${formattedUpgrade})`;
    } else {
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        title = `${upgradeName} (${formattedUpgrade} ${formattedTowerName})`;
    }
    if (isB2) title += " (battles2)";
    if (latestVersion) title += ` (v${latestVersion})`;

    let cost = "";
    let totalCost = "";
    if (!isB2) {
        const easyCost = Towers.costOfTowerUpgrade(towerName, upgrade, "easy");
        const mediumCost = Towers.costOfTowerUpgrade(towerName, upgrade, "medium");
        const hardCost = Towers.costOfTowerUpgrade(towerName, upgrade, "hard");
        const impopCost = Towers.costOfTowerUpgrade(towerName, upgrade, "impoppable");
        cost = `${easyCost} - easy\n${mediumCost} - medium\n${hardCost} - hard\n${impopCost} - impoppable\n`;

        const easyTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, "easy");
        const mediumTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, "medium");
        const hardTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, "hard");
        const impopTotalCost = Towers.costOfTowerUpgradeSet(towerName, upgrade, "impoppable");
        totalCost = `${easyTotalCost} - easy\n${mediumTotalCost} - medium\n${hardTotalCost} - hard\n${impopTotalCost} - impoppable\n`;
    }
    if (isB2) {
        cost = `${Towers.costOfTowerUpgrade(towerName, upgrade, "medium", 0, {}, isB2)} - battles2\n`;
        totalCost = `${Towers.costOfTowerUpgradeSet(towerName, upgrade, "medium", 0, {}, isB2)} - battles2\n`;
    }

    let embed = new Discord.EmbedBuilder()
        .setTitle(title)
        .setDescription(upgradeDescription)
        .addFields([
            {
                name: "cost",
                value: cost,
                inline: true,
            },
            {
                name: "total cost",
                value: totalCost,
                inline: true,
            },
            { name: "Something here is wrong?", value: `please report them [here](${discord})` },
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
        return new Discord.EmbedBuilder().setColor(red).setTitle("Something went wrong while fetching the data");
    }

    const tierUpgrades = [];
    let idx, tier;
    for (tier = 1; tier <= 5; tier++) {
        for (idx = 0; idx < 3; idx++) {
            tierUpgrades.push("000".slice(0, idx) + `${tier}` + "000".slice(idx + 1));
        }
    }

    let pathBenefits;
    try {
        pathBenefits = await Bloonology.towerUpgradesToTierChangeBloonology(towerName, tierUpgrades, isB2, true);
    } catch {
        return new Discord.EmbedBuilder().setColor(red).setTitle("Something went wrong while fetching the data");
    }

    const headers = tierUpgrades.map((u) => {
        const [path, tier] = Towers.pathTierFromUpgradeSet(u);
        const upgradeName = Towers.towerUpgradeFromTowerAndPathAndTier(towerName, path, tier);
        return `${upgradeName} (${u})`;
    });

    const title = Aliases.toIndexNormalForm(towerName) + " Summary";

    const embed = new Discord.EmbedBuilder().setTitle(title).setFooter({ text: footer }).setColor(cyber);

    embed.addFields([
        {
            name: `Base Stats`,
            value: baseDescription,
        },
    ]);

    headers.forEach((header, idx) => embed.addFields([{ name: header, value: pathBenefits[idx], inline: true }]));

    return embed;
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            embeds: [
                validationFailure
            ],
            flags: MessageFlags.Ephemeral,
        });

    let tower = interaction.options.getString("tower");
    tower = Aliases.toAliasNormalForm(tower) // TODO: maybe replace with a towerparser to use aliases? (need to also update validation function)


    const towerPath = parseTowerPath(interaction);
    const isB2 = interaction.options.getBoolean("battles2") || false;

    const forceReload = interaction.options.getString("reload") ? true : false;
    if (forceReload) {
        await interaction.deferReply();
        await scrapeCosts();
        await scrapePages();
    }

    let embed = await embedBloonology(tower, towerPath, isB2);

    const summaryBtn = new ButtonBuilder()
        .setCustomId("summary")
        .setLabel("See summary of all upgrades")
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
        time: 60000,
    });

    collector.on("collect", async (buttonInteraction) => {
        collector.stop();
        buttonInteraction.deferUpdate();

        if (buttonInteraction.customId === "summary") {
            let summaryEmbed = await embedBloonologySummary(tower, isB2);
            await interaction.editReply({
                embeds: [summaryEmbed],
                components: [],
                flags: MessageFlags.Ephemeral,
            });
        }
    });

    collector.on("end", async (collected) => {
        if (collected.size === 0)
            await interaction.editReply({
                embeds: [embed],
                components: [],
            });
    });
}

async function onAutocomplete(interaction) {
    const hoistedOptions = interaction.options._hoistedOptions; // array of the previous thing, each for each autocomplete field
    const tower_partial = hoistedOptions.find((option) => option.name == 'tower'); // { name: 'option_name', type: 'STRING', value: '<value the user put in>', focused: true }
    const value = tower_partial.value;

    let allTowers = Towers.allTowers()
    let allTowerNames = allTowers.map(towerName => Aliases.toIndexNormalForm(towerName));

    let fs = FuzzySet(allTowerNames);
    let values = fs.get(value, null, 0.2);

    responseArr = [];
    if (value == "" || !values)
        responseArr = allTowerNames
            .slice(0, 25) // discord only allows 25 options at a time
            .map((towerName) => {
                const index = allTowerNames.indexOf(towerName)
                return { name: towerName, value: allTowers[index] }; // cant inline because we are returning an object :(
            });
    else
        values.forEach((value, i) => {
            if (i >= 25) return
            const towerName = value[1]
            const index = allTowerNames.indexOf(towerName)
            responseArr.push({ name: towerName, value: allTowers[index] });
        });

    await interaction.respond(responseArr);
}

module.exports = {
    data: builder,
    execute,
    onAutocomplete,
};

