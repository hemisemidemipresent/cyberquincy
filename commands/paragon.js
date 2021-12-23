const TowerParser = require('../parser/tower-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const OptionalParser = require('../parser/optional-parser');

let paragonStats = require('../jsons/paragon.json');
const { red, paragon } = require('../jsons/colours.json');
const pHelp = require('../helpers/paragon');
module.exports = {
    name: 'paragon',
    aliases: ['para'],

    async execute(message, args) {
        let footer =
            'd:dmg • md:moab dmg • cd:ceram dmg • p:pierce • r:range • s:time btw attacks • j:projectile count • bd: total dmg done to boss bloons • ed - total dmg done to elite boss bloons • q!ap for help and elaboration';

        if (!args.length || args[0] == 'help') {
            return await this.helpMessage(message);
        }

        let parsed = CommandParser.parse(
            args,
            new TowerParser(),
            new OptionalParser(new NaturalNumberParser(1, 100), 1)
        );
        let x = parsed.natural_number; // degree
        if (parsed.hasErrors()) return await this.errorMessage(message, parsed.parsingErrors);

        let desc = '';
        if (parsed.tower == 'dart_monkey') {
            let paragon = paragonStats.dart_monkey;

            let { d: d, md: md, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(paragon, x);

            let cd = paragon.cd;
            let cd_x = pHelp.getDmg(cd, x) + d;

            desc =
                `85r` +
                `\n**juggernaut** - 3j, ${d}d, ${cd_x}cd, ${bd}bd, ${ed}ed, ${p}p, ${s}s, normal, camo` +
                `\n• splits into 2 mini juggernauts` +
                `\n• The juggernaut projectiles bounce off objects` +
                `\n• explodes into mini juggernauts when it hits edge of screen` +
                `\n• projectiles can rehit target` +
                `\n**mini juggernaut** - identical to **juggernaut**`;
        } else if (parsed.tower == 'boomerang_monkey') {
            let paragon = paragonStats.boomerang_monkey;
            let main = paragon.main;
            let mainDot = paragon.mainDot;
            let orbit = paragon.orbit;
            let press = paragon.press;
            let explosion = paragon.pressExplosion;
            let burn = paragon.burn;

            // forgive me lord for I have sinned by using var
            var { d: d, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(main, x);

            desc =
                `**glaive(main)** - 75r, ${d}d, ${bd}bd, ${ed}ed,  ${p}p, ${s}s, normal, camo\n` +
                `• can jump to a nearby target after hitting\n`;

            var { d: d, bd: bd, ed: ed } = pHelp.getDamagesObj(mainDot, x, true);

            desc += `• first hit applies **shred** effect- (${d}d, ${bd}bd, ${ed}ed)/s, 15s duration\n`;

            var { d: d, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(orbit, x);
            let cd = pHelp.getDmg(orbit.cd, x) + d;
            let fd = pHelp.getDmg(orbit.fd, x);

            desc +=
                `**orbitalglaive** - 40r, ${d}d, ${cd}cd, ${md}md, +${fd}fd, ${bd}bd, ${ed}ed, ${p}p, ${s}s, normal, camo\n` +
                `• zone, 40r\n`;
            var { d: d, md: md, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(press, x);

            desc +=
                `**heavykylie** - ${d}d, ${md}md, ${bd}bd, ${ed}ed, ${p}p, ${s}s, normal, camo\n` +
                `• 100r\n` +
                `• only targets blimps\n` +
                `• creates **explosion** instead of returning\n`;

            var { d: d, bd: bd, ed: ed, p: p } = pHelp.getDamagesObj(explosion, x);

            desc += `**explosion** -  ${d}d, ${bd}bd, ${ed}ed, ${p}p, normal, camo\n`;

            var { d: d, bd: bd, ed: ed } = pHelp.getDamagesObj(burn, x, true);

            desc +=
                `• applies **burn** status- (${d}d, ${bd}bd, ${ed}ed)/s, 4s duration\n` +
                `• can rehit after 1st frame and every 0.1s after\n` +
                `• pierce is used on each rehit\n` +
                `• 0.25s stun after each rehit\n` +
                `• knocks back moabs 3 units, bfbs 1.5 units, ddts and zomgs 0.75 units`;
        } else if (parsed.tower == 'ninja_monkey') {
            let ninja = paragonStats.ninja_monkey;
            let shuriken = ninja.shuriken;
            let fbomb = ninja.fbomb;
            let blues = ninja.blues;
            let sbomb = ninja.sbomb;
            let splash = ninja.sbombsplash;

            var { d: d, md: md, bd: bd, ed: ed, s: s, p: p } = pHelp.getDamagesObj(shuriken, x);

            desc =
                `All Bloons on screen (excluding BADs and Bosses) are permanently slowed to 50%  speed.\n` +
                `**main shuriken** - ${d}d, ${bd}bd, ${ed}ed, ${p}p, 8j, ${s}s, 70r\n` +
                `• 15% chance to distract, decamos\n`;

            var { d: d, bd: bd, ed: ed, s: s, p: p } = pHelp.getDamagesObj(fbomb, x);

            desc += `**flash bomb** - ${d}d, ${bd}bd, ${ed}ed, 5j, ${s}s, ${p}p, 70r, emits **blue shuriken**s on impact\n`;

            var { d: d, bd: bd, ed: ed, p: p } = pHelp.getDamagesObj(blues, x);

            desc +=
                `**blue shuriken** - ${d}d, ${bd}bd, ${ed}ed, ${p}p, 3j\n` +
                `• 15% chance to distract, decamos\n`;

            var { d: d, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(sbomb, x);

            desc +=
                `**sticky bomb** - 3?s to detonate, ∞r, ${s}s\n` +
                `• damage can soak through moab layers\n` +
                `• main target: ${d}d, ${bd}bd, ${ed}ed, ${p}p\n`;

            var { d: d, bd: bd, ed: ed, p: p } = pHelp.getDamagesObj(splash, x);

            desc += `• area of effect: ${d}d, ${bd}bd, ${ed}ed, ${p}p`;
        } else if (parsed.tower == 'monkey_buccaneer') {
            let bucc = paragonStats.monkey_buccaneer;
            let plasmaDarts = bucc.plasmaDarts;
            let cannonball = bucc.cannonball;
            let darts = bucc.darts;
            let antiMOAB = bucc.antiMOAB;

            var { d: d, md: md, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(plasmaDarts, x);

            desc =
                `**Activated Ability** - Hook the strongest target on screen, works on BADs and generates 2x normal cash. 20s cooldown, maxes at 2 uses per round. [degree independent]\n` +
                `**Rapid Fire Hooks** - Has 10 hooks “stored”, MOABs, BFBs, and DDTs use 1 hook while ZOMGs use 2 hooks, 1s between each pull, generates 2x normal cash, 10s to replenish [cooldown _might_ be shorter with higher degree]\n` +
                `\n**Main ship:**\n` +
                `**plasma dart**? - ${d}d, ${md}md, ${bd}bd, ${ed}ed, ${p}p, ${s}s, 10j (per set of 3 cannons, so effectively 30j per side)\n`;

            var { d: d, md: md, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(cannonball, x);

            desc +=
                `**cannonball** - ${d}d, ${md}md, ${bd}bd, ${ed}ed, ${p}p, ${s}s, 3j (per set of 3 cannons, effectively 9j each side)\n` +
                `\n**Fighter Planes:**\n`;

            var { d: d, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(darts, x);

            desc += `**dart** - ${d}d,  ${bd}bd, ${ed}ed, ${p}p, ${s}s\n`;

            var { d: d, bd: bd, ed: ed, p: p, s: s } = pHelp.getDamagesObj(antiMOAB, x);

            desc +=
                `**anti-MOAB missile** - ${d}md,  ${bd}bd, ${ed}ed, ${p}p, ${s}s\n` +
                '\n**buffs**\n[degree independent]\n• Generates $3200 per round, provides +10d, +10cd, +10md to Merchants instead\n• 85%s to other water towers and Aces\n• +10% sellback value to towers in range\n\n• Side note: money generated from Merchants count towards degree at a 4x more favorable rate than pops at $180 generated -> 4 power, both pops and money are for the same category so those combined still max at 90,000 power';
        }
        if (desc) {
            let messageEmbed = new Discord.MessageEmbed()
                .setTitle(`\`${parsed.tower}\` paragon - level ${x}`)
                .setDescription(desc)
                .setFooter(footer)
                .setColor(paragon);
            return await message.channel.send({ embeds: [messageEmbed] });
        }
        return await message.channel.send('only dart, boomer, ninja and boat so far');
    },
    async errorMessage(message, parsingErrors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .setDescription('`q!paragon <tower> <level>`\ne.g. q!paragon dart 100')
            .addField('Likely Cause(s)', parsingErrors.map((msg) => ` • ${msg}`).join('\n'))
            .setColor(red);

        return await message.channel.send({ embeds: [errorEmbed] });
    },
    async helpMessage(message) {
        let embed = new Discord.MessageEmbed()
            .setTitle('q!paragon')
            .setDescription('`q!paragon <tower> <level>`\ne.g. q!paragon dart 100')
            .setColor(paragon);

        return await message.channel.send({ embeds: [embed] });
    }
};
