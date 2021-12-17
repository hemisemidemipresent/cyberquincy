const TowerParser = require('../parser/tower-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
let paragonStats = require('../jsons/paragon.json');
const { red } = require('../jsons/colours.json');
const OptionalParser = require('../parser/optional-parser');
module.exports = {
    name: 'paragon',
    aliases: ['para'],

    async execute(message, args) {
        if (!args || args[0] == 'help') return await this.helpMessage(message);
        let parsed = CommandParser.parse(
            args,
            new TowerParser(),
            new OptionalParser(new NaturalNumberParser(1, 100), 1)
        );
        let degree = parsed.natural_number - 1;
        if (parsed.hasErrors())
            return await this.errorMessage(message, parsed.parsingErrors);

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
            return await message.channel.send({ embeds: [messageEmbed] });
        } else if (parsed.tower == 'boomerang_monkey') {
            let paragon = paragonStats.boomerang_monkey;
            let main = paragon.main;
            let mainDot = paragon.mainDot;
            let orbit = paragon.orbit;
            let press = paragon.press;
            let explosion = paragon.pressExplosion;
            let burn = paragon.burn;

            let e =
                `75r\n` +
                `glaive(main) - **${main.damage[degree]}**d, +**${main.bossDamage[degree]}**bd, +**${main.eliteDamage[degree]}**ed,  **${main.pierce[degree]}**p, **${main.rate[degree]}**s, normal, camo\n` +
                `• can jump to a nearby target after hitting\n` +
                `• first hit applies shred effect- (**${mainDot.damage[degree]}**d, +**${mainDot.bossDamage[degree]}**bd, +**${mainDot.eliteDamage[degree]}**ed)/1s, 15s duration\n` +
                `orbitalglaive- 40r, **${orbit.damage[degree]}**d, +**${orbit.ceramicDamage[degree]}**cd, +**${orbit.moabDamage[degree]}**md, +**${orbit.fortifiedDamage[degree]}**fd, +**${orbit.bossDamage[degree]}**bd, +**${orbit.eliteDamage[degree]}**ed, **${orbit.pierce[degree]}**p, **${orbit.rate[degree]}**s, normal, camo\n` +
                `• zone, 40r\n` +
                `heavykylie - **${press.damage[degree]}**d, +**${press.moabDamage[degree]}**md, +**${press.bossDamage[degree]}**bd, +**${press.eliteDamage[degree]}**ed, **${press.pierce[degree]}**p,  **${press.rate[degree]}**s, normal, camo\n` +
                `• 100r\n` +
                `• only targets blimps\n` +
                `• creates explosion instead of returning\n` +
                `    - explosion-  **${explosion.damage[degree]}**d, +**${explosion.bossDamage[degree]}**bd, +**${explosion.eliteDamage[degree]}**ed, **${explosion.pierce[degree]}**p, normal, camo\n` +
                `        - applies burn status- (**${burn.damage[degree]}**d, +**${burn.bossDamage[degree]}**bd, +**${burn.eliteDamage[degree]}**ed)/1s, 4s duration\n` +
                `• can rehit after 1st frame and every 0.1s after\n` +
                `    - pierce is used on each rehit\n` +
                `    - 0.25s stun after each rehit\n` +
                `• knocks back moabs 3 units, bfbs 1.5 units, ddts and zomgs 0.75 units`;

            let messageEmbed = new Discord.MessageEmbed()
                .setDescription(e)
                .setFooter(
                    'bd - additional dmg done to boss bloons|ed - additional dmg done to elite boss bloons (not including base bd)'
                );
            return await message.channel.send({ embeds: [messageEmbed] });
        } else if (parsed.tower == 'ninja_monkey') {
            let ninja = paragonStats.ninja_monkey;
            let shuriken = ninja.shuriken;
            let fbomb = ninja.fbomb;
            let blues = ninja.blues;
            let sbomb = ninja.sbomb;
            let splash = ninja.sbombsplash;
            let desc =
                `All Bloons on screen (excluding BADs and Bosses) are permanently slowed to 50%  speed.\n` +
                `*main shuriken*: **${shuriken.damage[degree]}**d, +**${shuriken.bossdmg[degree]}**bd, +**${shuriken.elitedmg[degree]}**ed, +**${shuriken.pierce[degree]}**p, 8j, **${shuriken.rate[degree]}**s, 70r\n` +
                `- 15% chance to distract, decamos\n` +
                `*flash bomb*: **${fbomb.damage[degree]}**d, +**${fbomb.bossdmg[degree]}**bd, +**${fbomb.elitedmg[degree]}**ed, 5j, **${fbomb.rate[degree]}**s, **${fbomb.pierce[degree]}**p, 70r, emits *blue shuriken*s on impact\n` +
                `*blue shuriken*: **${blues.damage[degree]}**d, +**${blues.bossdmg[degree]}**bd, +**${blues.elitedmg[degree]}**ed, **${blues.pierce[degree]}**p, 3j\n` +
                `- 15% chance to distract, decamos\n` +
                `*sticky bomb*: 3?s to detonate, ∞r, **${sbomb.rate[degree]}**s\n` +
                `- damage can soak through moab layers\n` +
                `- main target: **${sbomb.damage[degree]}**d, +**${sbomb.bossdmg[degree]}**bd, +**${sbomb.elitedmg[degree]}**ed, **${sbomb.pierce[degree]}**p\n` +
                `- area of effect: **${splash.damage[degree]}**d, +**${splash.bossdmg[degree]}**bd, +**${splash.elitedmg[degree]}**ed, **${splash.pierce[degree]}**p`;
            let messageEmbed = new Discord.MessageEmbed()
                .setDescription(desc)
                .setFooter(
                    'bd - additional dmg done to boss bloons|ed - additional dmg done to elite boss bloons (not including base bd)'
                );
            return await message.channel.send({ embeds: [messageEmbed] });
        }
        return await message.channel.send('only dart, boomer, ninja so far');
    },
    async errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .setDescription(
                '`q!paragon <tower> <level>`\ne.g. q!paragon dart 100'
            )
            .addField(
                'Likely Cause(s)',
                parsingErrors.map((msg) => ` • ${msg}`).join('\n')
            )
            .setColor(red);

        return await message.channel.send({ embeds: [errorEmbed] });
    },
    async helpMessage(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .setDescription(
                '`q!paragon <tower> <level>`\ne.g. q!paragon dart 100'
            )
            .setColor(red);

        return await message.channel.send({ embeds: [embed] });
    },
};
