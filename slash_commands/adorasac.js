const { SlashCommandBuilder } = require('discord.js');
const { isTower, allTowers, allUpgradeCrosspathSets, costOfTowerUpgradeSet, isTowerUpgrade } = require('../helpers/towers.js');
const { red, cyber } = require('../jsons/colors.json');

const XP_CAP = 400000;
const XP_CAP_ADJUSTED = Math.ceil(XP_CAP / (4*5));

// deprioritize water towers, illegal towers in CHIMPS, towers that are weird to sac in 2mpc, etc.
const TOWER_PRIORITIES = new Map();
TOWER_PRIORITIES.set('banana_farm', -1000); // illegal in chimps
TOWER_PRIORITIES.set('monkey_sub', -700); // water tower
TOWER_PRIORITIES.set('monkey_buccaneer', -850); // water tower
TOWER_PRIORITIES.set('beast_handler', -620); // water tower in some paths
TOWER_PRIORITIES.set('heli_pilot', -500); // can't be placed on midnight mansion
TOWER_PRIORITIES.set('monkey_ace', -380); // weird in 2mp
TOWER_PRIORITIES.set('sniper_monkey', -250); // weird in 2mp
TOWER_PRIORITIES.set('druid_monkey', -120); // jungle druid is weird in 2mp

builder = new SlashCommandBuilder()
    .setName('adora-sac')
    .setDescription('Calculate the optimal ewwww adora sacrifice to advance a certain amount of XP.')
    .addIntegerOption((option) => option.setName('xp').setDescription('target XP to gain').setRequired(true).setMinValue(0).setMaxValue(XP_CAP))
    .addStringOption((option) => option.setName('excluded_towers').setDescription('Comma-separated list of towers to exclude'));

/**
 * @param {string} excludedTowers raw excluded towers argument from command
 * @returns {Set<string>} excluded tower upgrade ssets
 */
function parseExcludedTowers(excludedTowers) {
    if (!excludedTowers) {
        return new Set();
    }

    let result = new Set();
    let excludedTowersList = excludedTowers.split(/\s*,\s*/);
    const allUpgradeSets = allUpgradeCrosspathSets();

    for (let excludedTower of excludedTowersList) {
        let canonicalForm = Aliases.canonicizeArg(excludedTower);
        if (isTower(canonicalForm)) {
            for (let upgradeSet of allUpgradeSets) {
                result.add(`${canonicalForm}#${upgradeSet}`);
            }
        } else if (isTowerUpgrade(canonicalForm, true)) {
            result.add(canonicalForm);
        } else {
            throw new RangeError(`${excludedTower} is neither a valid tower nor a valid tower upgrade`);
        }
    }
    return result;
}

async function execute(interaction) {
    try {
        let excludedTowers = parseExcludedTowers(interaction.options.getString('excluded_towers'));

        let xp = interaction.options.getInteger('xp');

        if (xp < 0 || xp > XP_CAP) {
            throw new RangeError(`Provided XP value ${xp} should be between 0 and ${XP_CAP} inclusive`);
        }

        // optimization: use money divided by 5 to shrink DP space as all tower/upgrade costs are divisble by 5
        let moneyToSpendDiv5 = Math.ceil(xp / (4 * 5));

        // set up DP arrays
        let bagSize = new Array(XP_CAP_ADJUSTED+1);
        bagSize.fill(Infinity);
        bagSize[0] = 0
        let lastItem = new Array(XP_CAP_ADJUSTED+1);
        lastItem.fill(0);

        const costsDiv5ToUpgrade = new Map();

        let towers = allTowers()
        // sort towers in descending priority order, high priority should be looked at first
        towers.sort((a, b) => (TOWER_PRIORITIES.get(b) || 0) - (TOWER_PRIORITIES.get(a) || 0));

        const allUpgradeSets = allUpgradeCrosspathSets();

        for (let tower of towers) {
            for (let xpathSet of allUpgradeSets) {
                const upgradeSetStr = `${tower}#${xpathSet}`;

                // exclude t5 beast handlers due to merge requirements
                // exclude monkeyopolis
                if (
                    !excludedTowers.has(upgradeSetStr)
                    && (tower !== 'beast_handler' || !xpathSet.includes('5'))
                    && (tower !== 'monkey_village' || xpathSet[2] !== '5')
                ) {
                    let processedCost = Math.ceil(costOfTowerUpgradeSet(tower, xpathSet, 'hard') / 5);
                    // don't overwrite if higher priority present (deprioritize lower priority towers in case of cost tie)
                    if (!costsDiv5ToUpgrade.has(processedCost)) {
                        costsDiv5ToUpgrade.set(processedCost, upgradeSetStr);
                    }
                }
            }
        }

        for (let i = 1; i <= XP_CAP_ADJUSTED; ++i) {
            for (let cost of costsDiv5ToUpgrade.keys()) {
                if (i - cost >= 0 && bagSize[i] > bagSize[i - cost] + 1) {
                    bagSize[i] = bagSize[i - cost] + 1;
                    lastItem[i] = cost;
                }
            }
        }

        let resultCost = 0;
        let result = [];
        for (let i = moneyToSpendDiv5; i <= XP_CAP_ADJUSTED; ++i) {
            if (bagSize[i] !== Infinity) {
                resultCost = i * 5;
                while (i > 0) {
                    result.push(costsDiv5ToUpgrade.get(lastItem[i]));
                    i -= lastItem[i];
                }
                break;
            }
        }

        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                .setColor(cyber)
                .setTitle(`${result.length} tower(s) with cost $${resultCost}`)
                .setDescription(result.join('\n'))
            ]
        });
    } catch (error) {
        if (error instanceof RangeError) {
            return await interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                    .setColor(red)
                    .setTitle(error.message)
                ]
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

