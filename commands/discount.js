const fetch = require('node-fetch');
const url = 'http://topper64.co.uk/nk/btd6/dat/towers.json';
const settings = { method: 'Get' };
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
module.exports = {
    name: 'discount',
    aliases: ['002village'],
    rawargs: true,
    usages: ['q!discount <tower> <path>'],
    examples: ['q!discount dart 502'],
    execute(message, args) {
        // all this is a bit sketch

        let name = findName(args[0]);
        if (!b.isValidUpgrade(args[1])) {
            return message.channel.send('not valid path');
        }
        fetch(url, settings)
            .then((res) => res.json())
            .then((json) => {
                let object = json[`${name}`];
                let input = args[1].toString();
                // find tier and path
                let arr = [
                    parseInt(input.charAt(0)),
                    parseInt(input.charAt(1)),
                    parseInt(input.charAt(2)),
                ];
                let primaryCost = 0;
                let remainingCost = 0;
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < arr[i]; j++) {
                        cost = findcost(object, i + 1, j + 1);
                        if (j < 3) {
                            primaryCost += cost;
                        } else {
                            remainingCost += cost;
                        }
                    }
                }
                const baseCost = parseInt(json[`${name}`].cost);
                primaryCost += baseCost;
                primaryCost = hard(primaryCost);
                remainingCost = hard(remainingCost);

                let embed = findBest(primaryCost, primaryCost + remainingCost);
                return message.channel.send(embed);
            });
    },
};

function hard(cost) {
    return Math.round((cost * 1.08) / 5) * 5;
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

function findcost(object, path, tier) {
    let newCost = object.upgrades[path - 1][tier - 1].cost;
    return newCost;
}
const matrix = [
    [0, 0, 'Discount villages are a waste'],
    [1835, 0.1, '001 village is the best'],
    [2375, 0.15, 'one 002 village is the best'],
    [4037, 0.2, 'two 002 villages are the best'],
    [5937, 0.25, 'three 002 villages are the best'],
];
function findBest(cost, total) {
    let arr = [];
    for (i = 0; i < 5; i++) {
        costsaved = total + matrix[i][0] - matrix[i][1] * cost;

        arr.push(costsaved);
    }
    let index = indexOfMax(arr);
    let embed = new Discord.MessageEmbed()
        .setTitle(`${matrix[index][2]}`)
        .addField(
            'amount of money spent (hard costs)',
            `original : ${arr[0]}\n001 village : ${arr[1]}\n002 village : ${arr[2]}\n2 002 villages : ${arr[3]}\n3 002 villages: ${arr[4]}`
        );
    return embed;
}
function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    let max = arr[0];
    let maxIndex = 0;

    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}
