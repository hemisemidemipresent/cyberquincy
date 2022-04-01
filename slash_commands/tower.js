const { SlashCommandBuilder } = require('@discordjs/builders');

const axios = require('axios');
const costs = require('../jsons/costs.json');
const gHelper = require('../helpers/general.js');
const Towers = require('../helpers/towers.js');
const { discord } = require('../aliases/misc.json');
const { red, cyber } = require('../jsons/colours.json');
const names = [
    'dart-monkey',
    'boomerang-monkey',
    'bomb-shooter',
    'tack-shooter',
    'ice-monkey',
    'glue-gunner',
    'sniper-monkey',
    'monkey-sub',
    'monkey-buccaneer',
    'monkey-ace',
    'heli-pilot',
    'mortar-monkey',
    'dartling-gunner',
    'wizard-monkey',
    'super-monkey',
    'ninja-monkey',
    'alchemist',
    'druid',
    'banana-farm',
    'spike-factory',
    'monkey-village',
    'engineer-monkey'
];
const links = [
    'https://pastebin.com/raw/FK4a9ZSi',
    'https://pastebin.com/raw/W2x9dvPs',
    'https://pastebin.com/raw/XaR4JafN',
    'https://pastebin.com/raw/ywGCyWdT',
    'https://pastebin.com/raw/3VKx3upE',
    'https://pastebin.com/raw/cg8af3pj',
    'https://pastebin.com/raw/8uQuKygM',
    'https://pastebin.com/raw/F9i5vPX9',
    'https://pastebin.com/raw/EuiGUBWs',
    'https://pastebin.com/raw/hACdmBFa',
    'https://pastebin.com/raw/dfwcqzDT',
    'https://pastebin.com/raw/64s0RqaZ',
    'https://pastebin.com/raw/DDkmKP6n',
    'https://pastebin.com/raw/4MsYDjFx',
    'https://pastebin.com/raw/SUxZg6Dk',
    'https://pastebin.com/raw/kPAF2hqw',
    'https://pastebin.com/raw/76m7ATYF',
    'https://pastebin.com/raw/4egsjcpa',
    'https://pastebin.com/raw/Es0nVqt1',
    'https://pastebin.com/raw/tTHZWiSi',
    'https://pastebin.com/raw/e2QHaQSD',
    'https://pastebin.com/raw/rTHT0L21'
];
builder = new SlashCommandBuilder()
    .setName('tower')
    .setDescription('Find information for each tower')
    .addStringOption((option) =>
        option
            .setName('tower')
            .setDescription('The tower you are finding information for')
            .setRequired(true)
            .addChoice('Dart Monkey', '0')
            .addChoice('Boomerang Monkey', '1')
            .addChoice('Bomb Shooter', '2')
            .addChoice('Tack Shooter', '3')
            .addChoice('Ice Monkey', '4')
            .addChoice('Glue Gunner', '5')
            .addChoice('Sniper Monkey', '6')
            .addChoice('Monkey Sub', '7')
            .addChoice('Monkey Buccaneer', '8')
            .addChoice('Monkey Ace', '9')
            .addChoice('Heli Pilot', '10')
            .addChoice('Mortar Monkey', '11')
            .addChoice('Dartling Gunner', '12')
            .addChoice('Wizard Monkey', '13')
            .addChoice('Super Monkey', '14')
            .addChoice('Ninja Monkey', '15')
            .addChoice('Alchemist', '16')
            .addChoice('Druid', '17')
            .addChoice('Banana Farm', '18')
            .addChoice('Spike Factory', '19')
            .addChoice('Monkey Village', '20')
            .addChoice('Engineer Monkey', '21')
    )
    .addStringOption((option) =>
        option.setName('tower_path').setDescription('The tower path that you want the information for.').setRequired(true)
    );

function validateInput(interaction) {
    tower_path = interaction.options.getString('tower_path').toLowerCase();
    if (tower_path == 'base') return;
    if (isNaN(tower_path)) return "Tower path provided isn't `base` and contains non-numerical characters";
    tower_path = parseInt(tower_path);
    if (Towers.isValidUpgradeSet(tower_path)) return 'Invalid tower path provided!';
}

async function process(upgrade, towerID) {
    let link = links[towerID];
    let res = '';
    try {
        res = await axios.get(link);
    } catch {
        return new Discord.MessageEmbed().setColor(red).setTitle('Something went wrong while fetching the data');
    }
    let body = res.data;

    let towerName = names[towerID];
    let tower = costs[towerName];
    let [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
    let totalCost = Towers.totalTowerUpgradeCrosspathCost(costs, towerName, upgrade);
    let hardTotalCost = Towers.totalTowerUpgradeCrosspathCostHard(costs, towerName, upgrade);
    let cost = upgrade == '000' ? totalCost : tower.upgrades[`${path}`][tier - 1];
    let upgrades = body.split('\r\n\r\n'); // each newline is \r\n\r\n

    for (let i = 0; i < upgrades.length; i++) {
        if (upgrades[i].substr(0, 3) == upgrade) {
            // background info: there are 2 newlines present in the string: \n and \r. \n is preferred
            let info = upgrades[i]
                .toString()
                .replace(/\n/g, '') // removes all newlines \n
                .replace(/\r \t/g, '\n') // removes all \r + tab
                .replace(/ \t-/g, '-    ') // removes remaining tabs
                .replace(/\r/g, '\n'); // switches back all remaining \r with \n

            let embed = new Discord.MessageEmbed()
                .setTitle(gHelper.toTitleCase(towerName))
                .setDescription(info)
                .addField(
                    'cost',
                    `${cost} - medium\n${Towers.hard(cost)} - hard\n` + `if this is wrong [yell at hemi here](${discord})`,
                    true
                )
                .addField('total cost', `${totalCost} - medium\n${hardTotalCost} - hard`, true)
                .addField('Bug reporting', `report [here](${discord})`, true)
                .setFooter({
                    text: 'd:dmg • md:moab dmg • cd:ceram dmg • p:pierce • r:range • s:time btw attacks • j:projectile count • q!ap for help and elaboration • data is from extreme bloonology, by The Line, Nitjus, Char, JazzyJonah and TheKNEE'
                })
                .setColor(cyber);
            return embed;
        }
    }
}
async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    towerID = parseInt(interaction.options.getString('tower'));
    tower_path = interaction.options.getString('tower_path');
    tower_path == 'base' ? '000' : tower_path;

    const embed = await process(tower_path, towerID);

    return await interaction.reply({ embeds: [embed], ephemeral: false });
}

module.exports = {
    data: builder,
    execute
};
