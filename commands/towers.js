const { cyber } = require('../jsons/colours.json');

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
    name: '<tower>',
    dependencies: ['towerJSON'],

    aliases: aliases.flat(),

    execute(message, args, commandName) {
        let name = findName(commandName);

        if (!isValidPath(args[0])) {
            return provideHelpMsg(message, name);
        }

        if (!args[0] || args[1]) {
            let embed = baseTower(name);
            return message.channel.send(embed);
        }
        let input = args[0].toString();
        let arr = [
            parseInt(input.charAt(0)),
            parseInt(input.charAt(1)),
            parseInt(input.charAt(2)),
        ];
        let temp = [...arr];
        temp.sort();
        const tier = temp[2];
        let path = 1;
        for (let i = 0; i < 3; i++) {
            if (parseInt(tier) == parseInt(arr[i])) {
                path = i + 1;
            }
        }

        //let object = json[`${name}`].upgrades[path - 1][tier - 1];
        let object = towerJSON[`${name}`].upgrades[path - 1][tier - 1];
        if (!object) {
            const embed = baseTower(name);

            return message.channel.send(embed).then((msg) => {
                msg.react('❌');
                const filter = (reaction, user) => {
                    return (
                        reaction.emoji.name === '❌' &&
                        user.id === message.author.id
                    );
                };
                const collector = msg.createReactionCollector(filter, {
                    time: 20000,
                });

                collector.on('collect', () => {
                    msg.delete();
                });
            });
        } else {
            const embed = anyOtherTower(towerJSON, name, path, tier);
            message.channel.send(embed).then((msg) => {
                msg.react('❌');
                const filter = (reaction, user) => {
                    return (
                        reaction.emoji.name === '❌' &&
                        user.id === message.author.id
                    );
                };
                const collector = msg.createReactionCollector(filter, {
                    time: 20000,
                });

                collector.on('collect', () => {
                    msg.delete();
                });
            });
        }
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
function baseTower(name) {
    let object = towerJSON[`${name}`];
    const embed = new Discord.MessageEmbed()
        .setColor(cyber)
        .setTitle(object.name)
        .addField(
            'cost',
            `${object.cost} (medium), ${hard(parseInt(object.cost))} (hard)`
        )
        .addField('notes', object.notes, true)
        .setFooter(
            'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
        );
    return embed;
}
function anyOtherTower(json, name, path, tier) {
    let object = json[`${name}`].upgrades[path - 1][tier - 1];

    let totalCost = 0;
    let newCost = 0;
    for (i = tier; i > 0; i--) {
        newCost = json[`${name}`].upgrades[path - 1][i - 1].cost;

        totalCost += parseInt(newCost);
    }
    const baseCost = parseInt(json[`${name}`].cost);
    totalCost += baseCost;

    let alternateCase = object.name.replace(/ +/g, ''); // removes all spaces from the upgrade name

    let link = `https://github.com/hemisemidemipresent/cq-imgs/blob/main/tower/${alternateCase}UpgradeIcon.png?raw=true`;
    // note: for identical upgrade names, AAAAAAAAAAAAAAAA (will be excluded in the future)
    const embed = new Discord.MessageEmbed()
        .setColor(cyber)
        .addField('name', object.name, true)
        .addField(
            'cost',
            `${hard(parseInt(object.cost))} (hard), ${object.cost} (medium)`,
            true
        )
        .addField('notes', object.notes)
        .addField('xp needed:', `${object.xp}`, true)
        .addField(
            'total cost',
            `${hard(totalCost)} (hard), ${totalCost} (medium)`,
            true
        )
        .setFooter(
            'd:dmg|md:moab dmg|cd:ceram dmg|p:pierce|r:range|s:time btw attacks|j:projectile count|\nq!ap for help and elaboration'
        )
        .setThumbnail(link);
    return embed;
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
function isValidPath(u) {
    if (!h.is_str(u) || u.length != 3) return false;

    if (isNaN(u)) return false;

    if (!u.includes('0')) return false;

    if (/6|7|8|9/.test(u)) return false;

    d = u.match(/3|4|5/g);
    if (d && d.length > 1) return false;

    return true;
}
