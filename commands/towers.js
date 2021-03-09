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
    'https://pastebin.com/raw/rTHT0L21',
];

const { red, cyber } = require('../jsons/colours.json');
const request = require('request');
const costs = require('../jsons/costs.json');
const Towers = require('../helpers/towers.js');
const OptionalParser = require('../parser/optional-parser');
const UpgradeSetParser = require('../parser/upgrade-set-parser');
const Discord = require('discord.js');

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
        'bomerrang',
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
    ['dartling-gunner', 'dartling', 'dartl', 'gatling', 'dl'],
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
        'op',
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
        'basetrash',
        'spact',
        'spactory',
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
        'village',
    ],
    [
        'engineer-monkey',
        'engineer',
        'engie',
        'engi',
        'eng',
        'overclock',
        'engie',
    ],
];

module.exports = {
    name: '<tower>',

    aliases: aliases.flat(),

    async execute(message, args, commandName) {
        parsed = CommandParser.parse(args, new UpgradeSetParser());

        if (parsed.hasErrors()) {
            errorMessage(message, parsed.errors);
        }

        process(parsed.upgrade_set, commandName, message);
    },
    errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .addField('**q!<tower> <path>**', 'example: q!bomb 130')

            .setColor(red);

        message.channel.send(errorEmbed);
    },
};
function provideHelpMsg(message, name) {
    let str = `Please use the number in \`\`codeblocks\`\` to specify the upgrade.\nFor example, **q!${name} 030**`;
    const pathsArr = [
        '100',
        '200',
        '300',
        '400',
        '500',
        '010',
        '020',
        '030',
        '040',
        '050',
        '001',
        '002',
        '003',
        '004',
        '005',
    ];
    for (let i = 0; i < 15; i++) {
        let path;
        let tier = 0;
        if (parseInt(pathsArr[i]) % 100 == 0) {
            path = 1;
            tier = parseInt(pathsArr[i]) / 100;
        } else if (parseInt(pathsArr[i]) % 10 == 0) {
            path = 2;
            tier = parseInt(pathsArr[i]) / 10;
        } else {
            path = 3;
            tier = parseInt(pathsArr[i]);
        }
        const object = towerJSON[`${name}`].upgrades[path - 1][tier - 1];
        if (i % 5 == 0) {
            str += '\n';
        } else {
            str += ',   ';
        }
        str += `__${object.name}__   \`\`${pathsArr[i]}\`\``;
    }

    return message.channel.send(str);
}
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

function process(upgrade, commandName, message) {
    let link = findLink(commandName);
    request(link, (err, res, body) => {
        if (err) {
            module.exports.errorMessage(message, ['info could not be fetched']);
        }

        let towerName = findName(commandName);
        let tower = costs[`${towerName}`];
        let [path, tier] = Towers.pathTierFromUpgradeSet(upgrade);
        let cost = tower.upgrades[`${path}`][tier - 1];
        let totalCost = Towers.totalTowerUpgradeCrosspathCostNew(
            costs,
            towerName,
            upgrade
        );

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
                    .setDescription(info)
                    .addField(
                        'cost',
                        `${cost} - medium\n${hard(cost)} - hard`,
                        true
                    )
                    .addField(
                        'total cost',
                        `${totalCost} - medium\n${hard(totalCost)} - hard`,
                        true
                    )
                    .setFooter(
                        'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|q!ap for help and elaboration|data is from extreme bloonology, by The Line'
                    )
                    .setColor(cyber);
                return message.channel.send(embed);
            }
        }
        module.exports.errorMessage(message, [
            'upgrade path could not be found',
        ]);
    });
}
