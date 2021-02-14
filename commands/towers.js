const { cyber } = require('../jsons/colours.json');

const OptionalParser = require('../parser/optional-parser');
const UpgradeSetParser = require('../parser/upgrade-set-parser');

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

const links = [
    'https://sites.google.com/view/bloonology/cq/dart-monkey-cq?authuser=0',
    'https://sites.google.com/view/bloonology/cq/boomerang-monkey-cq?authuser=0',
    'https://sites.google.com/view/bloonology/cq/bomb-shooter-cq?authuser=0',
];
module.exports = {
    name: '<tower>',
    dependencies: ['towerJSON'],

    aliases: aliases.flat(),

    execute(message, args, commandName) {
        message.channel.send('this command will be under construction');

        let name = findName(commandName);

        parsed = CommandParser.parse(
            args,
            new OptionalParser(new UpgradeSetParser(), '000')
        );

        if (parsed.hasErrors()) {
            return provideHelpMsg(message, name);
        }

        if (parsed.upgrade_set == '000') {
            let embed = baseTower(name);
            return message.channel.send(embed);
        }
        JSON.stringify(parsed, null, 1);

        return message.channel.send(embed);
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

function findName(commandName) {
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
