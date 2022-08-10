const Discord = require('discord.js');
const request = require('request');
const dgdata = require('node-dgdata');
module.exports = {
    name: 'daily',
    beta: true,
    execute(message, args) {
        function meat(num) {
            let promise = new Promise((resolve, reject) => {
                let url = 'https://static-api.nkstatic.com/appdocs/11/dailyChallenges/' + num;
                // this website is in bytes, but because you are viewing it in a browser you see weird text. That is what { encoding : null } is for
                request(url, { encoding: null }, (err, res, body) => {
                    if (err) {
                        reject('req');
                    }

                    let g = dgdata.decode(body).toString('utf-8');
                    try {
                        let json = JSON.parse(g);
                        let embed = format(json);
                        resolve(embed);
                    } catch {
                        resolve(new Discord.EmbedBuilder().setTitle('oops something went wrong - use q!daily <number>'));
                    }
                });
            });
            return promise;
        }
        meat(args[0])
            .then((result) => {
                message.channel.send({ embeds: [result] });
            })
            .catch((err) => {
                console.log(err);
            });
    }
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
    }\nContinues: ${object.noContinues}\nInstamonkey Reward: ${!object.noInstaReward}`;

    let startRulesObj = object.startRules;
    let lives = startRulesObj.lives;
    let maxLives = startRulesObj.maxLives;
    let cash = startRulesObj.cash;
    let round = startRulesObj.round;
    let endround = startRulesObj.endRound;

    if (lives == -1) lives = 'default';
    if (maxLives == -1) maxLives = 'default';
    if (cash == -1) cash = 'default';
    if (round == -1) round = 'default';
    if (endround == -1) endround = 'default';

    let startRules = `lives: ${lives}\nmax lives: ${maxLives}\ncash: ${cash}\nrounds: ${round} - ${endround}`;
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
                if (path2 == -1) path2 = 5;
                if (path3 == -1) path3 = 5;
                towers += `${towerObj.tower} (${towerObj.max}) (${path1}-${path2}-${path3})\n`;
            }
        } else if (towerObj.max == -1) {
            towers += `${towerObj.tower}\n`;
        }
    }

    let embed = new Discord.EmbedBuilder()
        .setTitle(object.name)
        .setDescription(`${bloonMods}\n\n${settings}\n\n${startRules}\n\n${towers}`);
    return embed;
}
