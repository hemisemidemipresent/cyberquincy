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

const { red, cyber } = require('../jsons/colours.json');
const axios = require('axios').default;

const costs = require('../jsons/costs.json');
const Towers = require('../helpers/towers.js');
const OptionalParser = require('../parser/optional-parser');
const UpgradeSetParser = require('../parser/upgrade-set-parser');
const Discord = require('discord.js');
const gHelper = require('../helpers/general.js');
const { discord } = require('../aliases/misc.json');

const aliases = [
    ['dart-monkey', 'dart', 'dm'],
    [
        'boomerang-monkey',
        'boomerang',
        'boomer',
        'bm',
        'boom',
        '💥',
        'rang',
        'bomerang',
        'boo',
        'bomer',
        'rangs',
        'bomerrang'
    ],
    ['bomb-shooter', 'bs', 'cannon', 'bomb'],
    ['tack-shooter', 'tac', 'tak', 'ta', 'tacc', 'tack'],
    ['ice-monkey', 'ice', 'im'],
    ['glue-gunner', 'glue', 'gs', 'glu', 'stick'],
    ['sniper-monkey', 'sniper', 'sn', 'snip', 'snooper', 'gun', 'snipermonkey'],
    ['monkey-sub', 'submarine', 'sub', 'sm', 'st'],
    ['monkey-buccaneer', 'boat', 'buc', 'bucc', 'buccaneer'],
    ['monkey-ace', 'ace', 'pilot', 'plane'],
    ['heli-pilot', 'heli', 'helicopter', 'helipilot'],
    ['mortar-monkey', 'mortar', 'mor'],
    ['dartling-gunner', 'dartling', 'gatling', 'dl'],
    ['wizard-monkey', 'wizard', 'apprentice', 'wiz'],
    ['super-monkey', 'super', 'supermonkey'],
    ['ninja-monkey', 'ninja', 'n', 'ninj', 'shuriken'],
    [
        'alchemist',
        'alch',
        'al',
        'alk',
        'alcc',
        'elk',
        'alc',
        'alche',
        'potion',
        'beer',
        'wine',
        'liquor',
        'intoxicant',
        'liquid',
        'op'
    ],
    ['druid', 'drood', 'd'],
    ['banana-farm', 'farm', 'monkeyfarm'],
    [
        'spike-factory',
        'factory',
        'spike',
        'spac',
        'spak',
        'spanc',
        'spikes',
        'spikefactory',
        'spi',
        'sf',
        'spacc',
        'spikeshooter',
        'spact',
        'spactory'
    ],
    [
        'monkey-village',
        'vill',
        'vil',
        'villi',
        'town',
        'house',
        'energy',
        'building',
        'hut',
        'circle',
        'fort',
        'village'
    ],
    ['engineer-monkey', 'engineer', 'engie', 'engi', 'eng', 'overclock', 'engie']
];

module.exports = {
    name: '<tower>',

    aliases: aliases.flat(),

    async execute(message, args, commandName) {
        if (args.includes('paragon') || args.includes('600')) {
            return await message.channel.send('use q!paragon <tower> [degree]');
        }
        parsed = CommandParser.parse(args, new OptionalParser(new UpgradeSetParser()));
        if (commandName == '<tower>') {
            if (!parsed.upgrade_set) {
                let upgrades = [
                    '000',
                    '010',
                    '001',
                    '110',
                    '101',
                    '011',
                    '200',
                    '020',
                    '002',
                    '210',
                    '220',
                    '201',
                    '202',
                    '120',
                    '021',
                    '022',
                    '102',
                    '012',
                    '300',
                    '310',
                    '320',
                    '301',
                    '302',
                    '030',
                    '230',
                    '031',
                    '032',
                    '003',
                    '103',
                    '203',
                    '013',
                    '023',
                    '400',
                    '410',
                    '420',
                    '401',
                    '402',
                    '040',
                    '140',
                    '240',
                    '041',
                    '042',
                    '004',
                    '104',
                    '204',
                    '014',
                    '024',
                    '500',
                    '510',
                    '520',
                    '501',
                    '502',
                    '050',
                    '150',
                    '250',
                    '051',
                    '052',
                    '005',
                    '105',
                    '205',
                    '015',
                    '025'
                ];
                parsed.upgrade_set = upgrades[Math.floor(Math.random() * upgrades.length)];
            }
            commandName = aliases[Math.floor(Math.random() * aliases.length)][0];
        }
        if (parsed.hasErrors()) await module.exports.errorMessage(message, parsed.parsingErrors);
        else await process(parsed.upgrade_set || '000', commandName, message);
    },
    async errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setAuthor(`sent by ${message.author.tag}`)

            .setTitle(`${errors.join('\n')}`)
            .addField('**q!<tower> <path>**', 'example: q!bomb 130')

            .setColor(red);

        await message.channel.send({ embeds: [errorEmbed] });
    }
};

function hard(cost) {
    return Math.round((cost * 1.08) / 5) * 5;
}

function findLink(commandName) {
    for (let i = 0; i < aliases.length; i++) {
        let towerAliasSet = aliases[i];
        for (let j = 0; j < towerAliasSet.length; j++) {
            if (commandName == towerAliasSet[j]) {
                return links[i];
            }
        }
    }
    return;
}
function findName(commandName) {
    for (let i = 0; i < aliases.length; i++) {
        let towerAliasSet = aliases[i];
        for (let j = 0; j < towerAliasSet.length; j++) {
            if (commandName == towerAliasSet[j]) {
                return towerAliasSet[0];
            }
        }
    }
    return;
}

async function process(upgrade, commandName, message) {
    let link = findLink(commandName);
    try {
        let res = await axios.get(link);
        let body = res.data;
        let towerName = findName(commandName);
        let tower = costs[`${towerName}`];
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
                        `${cost} - medium\n${hard(cost)} - hard\n` +
                            `if this is wrong [yell at hemi here](${discord})`,
                        true
                    )
                    .addField('total cost', `${totalCost} - medium\n${hardTotalCost} - hard`, true)
                    .addField('Bug reporting', `report [here](${discord})`, true)

                    .setFooter(
                        'd:dmg • md:moab dmg • cd:ceram dmg • p:pierce • r:range • s:time btw attacks • j:projectile count • q!ap for help and elaboration • data is from extreme bloonology, by The Line, Nitjus, Char, JazzyJonah and TheKNEE'
                    )
                    .setColor(cyber);
                return message.channel.send({ embeds: [embed] });
            }
        }
    } catch {
        await module.exports.errorMessage(message, [
            'something went wrong while fetching the tower stats'
        ]);
    }
}
