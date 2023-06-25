const { SlashCommandBuilder } = require('discord.js');
const { isTower, allTowers, allUpgradeCrosspathSets, costOfTowerUpgradeSet } = require('../helpers/towers.js');

const INF_BAG_SZ = 1000000;
const XP_CAP = 400000;

builder = new SlashCommandBuilder()
    .setName('adorasac')
    .setDescription('Calculate the optimal ewwww adora sacrifice to advance a certain amount of XP.')
    .addIntegerOption((option) => option.setName('xp').setDescription('target XP to gain').setRequired(true).setMinValue(0).setMaxValue(XP_CAP))
    .addStringOption((option) => option.setName('excluded_towers').setDescription('Comma-separated list of towers to exclude'));

function parseExcludedTowers(excludedTowers) {
    if (!excludedTowers) {
        return []
    }
    let result = []
    let excludedTowersList = excludedTowers.split(/\s*,\s*/);
    for (let excludedTower of excludedTowersList) {
        if (isTower(excludedTower)) {
            throw new RangeError(`${excludedTower} is an invalid tower`);
        }
        result.push(Aliases.getCanonicalForm(excludedTower))
    }
    return result
}

async function execute(interaction) {
    try {
        let excludedTowers = parseExcludedTowers(interaction.options.getString('excluded_towers'));

        // optimization: use money divided by 5 to shrink DP space as all tower/upgrade costs are divisble by 5
        let moneyToSpendDiv5 = Math.ceil(interaction.options.getInteger('xp') / (4 * 5));

        // set up DP arrays
        let bagSize = new Array(Math.ceil(XP_CAP / (4*5))+1);
        bagSize.fill(INF_BAG_SZ);
        bagSize[0] = 0
        let lastItem = new Array(XP_CAP+1);
        lastItem.fill(0);

        const costsDiv5ToUpgrade = new Map();

        for (let tower of allTowers()) {
            if (excludedTowers.indexOf(tower) < 0) {
                for (let xpathSet of allUpgradeCrosspathSets()) {
                    let processedCost = Math.ceil(costOfTowerUpgradeSet(tower, xpathSet, 'hard') / 5);
                    costsDiv5ToUpgrade.set(processedCost, `${tower}#${xpathSet}`);
                }
            }
        }

        for (let i = 1; i <= XP_CAP; ++i) {
            for (let cost of costsDiv5ToUpgrade.keys()) {
                if (i - cost >= 0 && bagSize[i] > bagSize[i - cost] + 1) {
                    bagSize[i] = bagSize[i - cost] + 1;
                    lastItem[i] = cost;
                }
            }
        }

        let result = [];
        for (let i = moneyToSpendDiv5; i <= XP_CAP; ++i) {
            if (bagSize[i] !== INF_BAG_SZ) {
                while (i > 0) {
                    result.push(costsDiv5ToUpgrade.get(lastItem[i]));
                    i -= lastItem[i];
                }
                break;
            }
        }

        return await interaction.reply({
            content: JSON.stringify(result),
            ephemeral: true
        });
    } catch (error) {
        if (error instanceof RangeError) {
            return await interaction.reply({
                content: error.message,
                ephemeral: true
            });
        } else {
            throw error;
        }
    }
}

module.exports = {
    data: builder,
    execute
};

