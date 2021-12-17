const request = require('request');
const zlib = require('zlib');
const atob = require('atob');
module.exports = {
    name: 'getchallenge',
    aliases: ['dc', 'get'],
    execute(message, args) {
        request(
            `https://static-api.nkstatic.com/appdocs/11/es/challenges/${args[0].toUpperCase()}`,
            { json: true },
            (err, res, body) => {
                if (err) {
                    return console.log(err.message);
                }
                let data = JSON.stringify(body, null, 4);
                let g = base64ToArrayBuffer(data);
                zlib.inflate(g, (err, buffer) => {
                    if (err) {
                        console.log('err happened');
                    }
                    let object = JSON.parse(buffer.toString('utf8'));

                    let embed = format(object);
                    message.channel.send({ embeds: [embed] });
                });
            }
        );
        function base64ToArrayBuffer(base64) {
            let binary_string = atob(base64);
            let len = binary_string.length;
            let bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        }
    },
};
function format(object) {
    let map = object.map;
    if (map == 'Tutorial') {
        map = 'Monkey Meadow';
    }
    let bloonMods = `**Bloon Modifiers**\nBloon speed multiplier: ${object.bloonModifiers.speedMultiplier}\nMOAB speed multiplier: ${object.bloonModifiers.moabSpeedMultiplier}\nBloon health multiplier: ${object.bloonModifiers.healthMultipliers.bloons}\nMOAB health multiplier: ${object.bloonModifiers.healthMultipliers.moabs}`;
    let mode = object.mode;
    if (mode.toLowerCase() == 'clicks') {
        mode = 'CHIMPS';
    }
    let settings = `Difficulty: ${
        object.difficulty
    }\nMode: ${mode}\nMap: ${map}\nMK: ${!object.disableMK}\nSelling: ${!object.disableSelling}\nPowers: ${
        object.disablePowers
    }\nContinues: ${
        object.noContinues
    }\nInstamonkey Reward: ${!object.noInstaReward}`;

    let startRules = `lives: ${object.startRules.lives}\nmax lives: ${object.startRules.maxLives}\ncash: ${object.startRules.cash}\nrounds: ${object.startRules.round} - ${object.startRules.endRound}`;
    let towers = '';
    for (i = 0; i < object.towers.length; i++) {
        towerObj = object.towers[i];
        if (towerObj.max > 0) {
            if (towerObj.isHero) {
                towers += `Hero: ${towerObj.tower}\n`;
            } else {
                let path1 = towerObj.path1NumBlockedTiers;
                let path2 = towerObj.path2NumBlockedTiers;
                let path3 = towerObj.path3NumBlockedTiers;
                if (path1 == -1) path1 = 5;
                if (path2 == -1) path1 = 5;
                if (path3 == -1) path1 = 5;
                towers += `${towerObj.tower} (${towerObj.max}) (${path1}-${path2}-${path3})\n`;
            }
        } else if (towerObj.max == -1) {
            towers += `${towerObj.tower}\n`;
        }
    }

    let embed = new Discord.MessageEmbed()
        .setTitle(object.name)
        .setDescription(
            `${bloonMods}\n\n${settings}\n\n${startRules}\n\n${towers}`
        );
    return embed;
}
