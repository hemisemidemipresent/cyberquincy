const TowerParser = require('../parser/tower-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
let paragonStats = require('../jsons/paragon.json');
module.exports = {
    name: 'paragon',
    aliases: ['para'],

    execute(message, args) {
        let parsed = CommandParser.parse(
            args,
            new TowerParser(),
            new NaturalNumberParser()
        );
        let degree = parsed.natural_number - 1;

        if (parsed.tower == 'dart_monkey') {
            let paragon = paragonStats.dart_monkey;

            let damage = paragon.damage[degree];
            let pierce = paragon.pierce[degree];
            let ceramicDamage = paragon.ceramicDamage[degree];
            let bossDamage = paragon.bossDamage[degree];
            let eliteDamage = paragon.eliteDamage[degree];
            let rate = paragon.rate[degree];

            let messageEmbed = new Discord.MessageEmbed()
                .setDescription(
                    `85r\njuggernaut- 3j, ${damage}d, +${ceramicDamage}cd, +${bossDamage}bd, +${eliteDamage}ed, ${pierce}p, ${rate}s, normal, camo` +
                        `\n-splits into 2 mini juggernauts` +
                        `\nThe juggernaut projectiles bounce off objects` +
                        `\nexplodes into mini juggernauts when it hits edge of screen` +
                        `\nprojectiles can rehit target` +
                        `\nmini juggernaut - identical to juggernaut`
                )
                .setFooter(
                    'bd - additional dmg done to boss bloons|ed - additional dmg done to elite boss bloons (not including base bd)'
                );
            return message.channel.send({ embeds: [messageEmbed] });
        } else if (parsed.tower == 'boomerang_monkey') {
            let paragon = paragonStats.boomerang_monkey;
            let main = paragon.main;
            let orbit = paragon.orbit;
            let press = paragon.press;
            let explosion = paragon.pressExplosion;

            let e =
                `75r\n` +
                `glaive(main) - **${main.damage[degree]}**d, +**${main.bossDamage[degree]}**bd, +**${main.eliteDamage[degree]}**ed,  **${main.pierce[degree]}**p, **${main.rate[degree]}**s, normal, camo\n` +
                `- can jump to a nearby target after hitting\n` +
                `- first hit applies shred effect- 100d/1s, 15s duration\n` +
                `orbitalglaive- 40r, **${orbit.damage[degree]}**d, +**${orbit.ceramicDamage[degree]}**cd, +**${orbit.moabDamage[degree]}**md, +**${orbit.fortifiedDamage[degree]}**fd, +**${orbit.bossDamage[degree]}**bd, +**${orbit.eliteDamage[degree]}**ed, **${orbit.pierce[degree]}**p, **${orbit.rate[degree]}**s, normal, camo\n` +
                `- zone, 40r\n` +
                `heavykylie - **${press.damage[degree]}**d, +**${press.moabDamage[degree]}**md, +**${press.bossDamage[degree]}**bd, +**${press.eliteDamage[degree]}**ed, **${press.pierce[degree]}**p,  **${press.rate[degree]}**s, normal, camo\n` +
                `- 100r\n` +
                `- only targets blimps\n` +
                `- creates explosion instead of returning\n` +
                `    - explosion-  **${explosion.damage[degree]}**d, +**${explosion.bossDamage[degree]}**bd, +**${explosion.eliteDamage[degree]}**ed, **${explosion.pierce[degree]}**p, normal, camo\n` +
                `        - applies burn status- 50d/1s, 4s duration\n` +
                `- can rehit after 1st frame and every 0.1s after\n` +
                `    - pierce is used on each rehit\n` +
                `    - 0.25s stun after each rehit\n` +
                `- knocks back moabs 3 units, bfbs 1.5 units, ddts and zomgs 0.75 units`;

            let messageEmbed = new Discord.MessageEmbed()
                .setDescription(e)
                .setFooter(
                    'bd - additional dmg done to boss bloons|ed - additional dmg done to elite boss bloons (not including base bd)'
                );
            return message.channel.send({ embeds: [messageEmbed] });
        }
        return message.channel.send('only dart and boomer so far');
    },
};
