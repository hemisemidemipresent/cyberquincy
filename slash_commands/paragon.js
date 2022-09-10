const { SlashCommandBuilder } = require('discord.js');

const { footer } = require('../aliases/misc.json');
const { paragon } = require('../jsons/colors.json');

const pHelp = require('../helpers/paragon');
const paragonStats = require('../jsons/paragon.json');

// TODO: consolidate 'dart_monkey', 'boomerang_monkey', 'ninja_monkey' and 'monkey_buccaneer' somewhere,
// and populate the StringOption for the slash command with them

builder = new SlashCommandBuilder()
    .setName('paragon')
    .setDescription('Find out statistics for paragons')
    .addStringOption((option) =>
        option
            .setName('tower')
            .setDescription('The tower you want to find the paragon for')
            .setRequired(true)
            .addChoices(
                { name: 'Dart Monkey (Apex Plasma Master)', value: 'dart_monkey' },
                { name: 'Boomerang Monkey (Glaive Dominus)', value: 'boomerang_monkey' },
                { name: 'Ninja Monkey (Ascended Shadow)', value: 'ninja_monkey' },
                { name: 'Monkey Buccaneer (Navarch of the Seas)', value: 'monkey_buccaneer' },
                { name: 'Engineer Monkey (Master Builder)', value: 'engineer_monkey' }
            )
    )
    .addIntegerOption((option) => option.setName('level').setDescription('The level of the paragon').setRequired(true));

function validateInput(interaction) {
    level = interaction.options.getInteger('level');

    if (level < 1 || level > 100) return `Level for paragon must be between 1 and 100 inclusive (inputted: ${level})`;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    // could be better?

    // btw, level is now x due to 'level' or even 'lvl' being quite unwieldy
    x = interaction.options.getInteger('level');
    tower = interaction.options.getString('tower');

    let desc = '';

    if (tower === 'dart_monkey') {
        let paragon = paragonStats.dart_monkey;
        let { d, cd, bd, ed, p, s } = pHelp.getLevelledObj(paragon, x);

        desc = `85r
                **juggernaut** - 3j, ${d}d, ${cd}cd, ${bd}bd, ${ed}ed, ${p}p, ${s}s, normal, camo
                • splits into 2 mini juggernauts
                • The juggernaut projectiles bounce off objects
                • explodes into mini juggernauts when it hits edge of screen
                • projectiles can rehit target
                **mini juggernaut** - identical to **juggernaut**`;
    } else if (tower === 'boomerang_monkey') {
        let pa = paragonStats.boomerang_monkey; // short for paragon
        let attacks = Object.keys(pa);
        attacks.forEach((key) => (pa[key] = pHelp.getLevelledObj(pa[key], x))); // apply levelling to all stats

        desc = `**glaive(main)** - 75r, ${pa.main.d}d, ${pa.main.bd}bd, ${pa.main.ed}ed,  ${pa.main.p}p, ${pa.main.s}s, normal, camo
                • can jump to a nearby target after hitting
                • first hit applies **shred** effect- (${pa.mainDot.d}d, ${pa.mainDot.bd}bd, ${pa.mainDot.ed}ed)/s, 15s duration
                **orbitalglaive** - 40r, ${pa.orbit.d}d, ${pa.orbit.cd}cd, ${pa.orbit.md}md, +${pa.orbit.fd}fd, ${pa.orbit.bd}bd, ${pa.orbit.ed}ed, ${pa.orbit.p}p, ${pa.orbit.s}s, normal, camo
                • zone, 40r
                **heavykylie** - ${pa.press.d}d, ${pa.press.md}md, ${pa.press.bd}bd, ${pa.press.ed}ed, ${pa.press.p}p, ${pa.press.s}s, normal, camo
                • 100r
                • only targets blimps
                • creates **explosion** instead of returning
                **explosion** -  ${pa.explosion.d}d, ${pa.explosion.bd}bd, ${pa.explosion.ed}ed, ${pa.explosion.p}p, normal, camo
                • applies **burn** status- (${pa.burn.d}d, ${pa.burn.bd}bd, ${pa.burn.ed}ed)/s, 4s duration
                • can rehit after 1st frame and every 0.1s after
                • pierce is used on each rehit
                • 0.25s stun after each rehit
                • knocks back moabs 3 units, bfbs 1.5 units, ddts and zomgs 0.75 units`;
    } else if (tower === 'ninja_monkey') {
        let pa = paragonStats.ninja_monkey;
        let attacks = Object.keys(pa);
        attacks.forEach((key) => (pa[key] = pHelp.getLevelledObj(pa[key], x)));

        desc = `All Bloons on screen (excluding BADs and Bosses) are permanently slowed to 50%  speed.
                **main shuriken** - ${pa.shuriken.d}d, ${pa.shuriken.bd}bd, ${pa.shuriken.ed}ed, ${pa.shuriken.p}p, 8j, ${pa.shuriken.s}s, 70r
                • 15% chance to distract, decamos
                **blue shuriken** - ${pa.blues.d}d, ${pa.blues.bd}bd, ${pa.blues.ed}ed, ${pa.blues.p}p, 3j
                • 15% chance to distract, decamos
                **sticky bomb** - 3?s to detonate, ∞r, ${pa.sbomb.s}s
                • damage can soak through moab layers
                • main target: ${pa.sbomb.d}d, ${pa.sbomb.bd}bd, ${pa.sbomb.ed}ed, ${pa.sbomb.p}p
                • area of effect: ${pa.sbombsplash.d}d, ${pa.sbombsplash.bd}bd, ${pa.sbombsplash.ed}ed, ${pa.sbombsplash.p}p`;
    } else if (tower == 'monkey_buccaneer') {
        let pa = paragonStats.monkey_buccaneer;
        let attacks = Object.keys(pa);
        attacks.forEach((key) => (pa[key] = pHelp.getLevelledObj(pa[key], x)));

        desc = `**Activated Ability** - Hook the strongest target on screen, works on BADs and generates 2x normal cash. 20s cooldown, maxes at 2 uses per round. [degree independent]
                **Rapid Fire Hooks** - Has 10 hooks “stored”, MOABs, BFBs, and DDTs use 1 hook while ZOMGs use 2 hooks, 1s between each pull, generates 2x normal cash, 10s to replenish [cooldown _might_ be shorter with higher degree]

                **Main ship:**
                **plasma dart**? - ${pa.plasmaDarts.d}d, ${pa.plasmaDarts.md}md, ${pa.plasmaDarts.bd}bd, ${pa.plasmaDarts.ed}ed, ${pa.plasmaDarts.p}p, ${pa.plasmaDarts.s}s, 10j (per set of 3 cannons, so effectively 30j per side)
                **cannonball** - ${pa.cannonball.d}d, ${pa.cannonball.md}md, ${pa.cannonball.bd}bd, ${pa.cannonball.ed}ed, ${pa.cannonball.p}p, ${pa.cannonball.s}s, 3j (per set of 3 cannons, effectively 9j each side)
                
                **Fighter Planes:**
                **dart** - ${pa.darts.d}d,  ${pa.darts.bd}bd, ${pa.darts.ed}ed, ${pa.darts.p}p, ${pa.darts.s}s
                **anti-MOAB missile** - ${pa.antiMOAB.d}md,  ${pa.antiMOAB.bd}bd, ${pa.antiMOAB.ed}ed, ${pa.antiMOAB.p}p, ${pa.antiMOAB.s}s
                
                **buffs**
                [degree independent]
                • Generates $3200 per round, provides +10d, +10cd, +10md to Merchants instead
                • 85%s to other water towers and Aces
                • +10% sellback value to towers in range

                • Side note: money generated from Merchants count towards degree at a 4x more favorable rate than pops at $180 generated -> 4 power, both pops and money are for the same category so those combined still max at 90,000 power`;
    } else if (tower === 'engineer_monkey') {
        let pa = paragonStats.engineer_monkey;
        let attacks = Object.keys(pa);
        attacks.forEach((key) => (pa[key] = pHelp.getLevelledObj(pa[key], x)));

        desc = `__**Main Guns**__
                70r
                **nail-guns** - ${pa.nailGuns.d}d, ${pa.nailGuns.bd}bd, ${pa.nailGuns.ed}ed, ${pa.nailGuns.p}p, ${pa.nailGuns.s}s, 3j (technically all 3 projectiles are separate attacks) 
                • on hit, applies *pinned* status on up to ceramics: bloon can’t move for 0.95s 
                • on hit, applies *stun* status on up to zomgs: bloon can’t move for 0.95s 
                • **nail-guns** attack gets +10% attack speed each round additively, maxes at 0.05s (6x faster) [max speed is degree independent] 
        
                __**Activated Ability**__
                • 20s cooldown, cycles between spawning Green, Red, and Blue Mega Sentries in that order. 
        
                __**Green Mega Sentry**__
                70r
                **endpoint** - ${pa.endpoint.d}d, ${pa.endpoint.bd}bd, ${pa.endpoint.ed}ed, ${pa.endpoint.p}p, ${pa.endpoint.s}s
                **beam** - ${pa.beam.d}d, ${pa.beam.bd}bd, ${pa.beam.ed}ed, ${pa.beam.p}p, ${pa.beam.s}s (this works exactly like plasma accelerator) 
        
                __**Red Mega Sentry**__
                70r
                **plasma** - ${pa.plasma.d}d, ${pa.plasma.bd}bd, ${pa.plasma.ed}ed, ${pa.plasma.p}p, ${pa.plasma.s}s, 4j
        
                __**Blue Mega Sentry**__
                70r
                **missile** - ${pa.missile.d}d, ${pa.missile.md}md, ${pa.missile.bd}bd, ${pa.missile.ed}ed, ${pa.missile.p}p, each bloon uses 2p, ${pa.missile.s}s, creates **explosion** on each hit
                • **explosion** - ${pa.explosion.d}d, ${pa.explosion.md}md, ${pa.explosion.bd}bd, ${pa.explosion.ed}ed, ${pa.explosion.p}p, 30r blast 
        
                When all Mega Sentries are sold or replaced, they do ${pa.sell.d}d, ${pa.sell.bd}bd, ${pa.sell.ed}ed to ${pa.sell.p} bloons within 50r
        
                __**Modified Paragon Sentry**__ 
                50r
                **plasma** - ${pa.mod_plasma.d}d, ${pa.mod_plasma.bd}bd, ${pa.mod_plasma.ed}ed, ${pa.mod_plasma.p}p, ${pa.mod_plasma.s}s, plasma type, lasts for 19s 
                • spawned every 6 seconds by each Mega Sentry
                • ignores camo bloons (targets them but passes right through) 
        
                When expired: ${pa.mod_sell.d}d, ${pa.mod_sell.p}p within a 50r blast 
                `;
    }
    let messageEmbed = new Discord.EmbedBuilder()
        .setTitle(`\`${tower}\` paragon - level ${level}`)
        .setDescription(desc)
        .setFooter({ text: footer })
        .setColor(paragon);
    return await interaction.reply({ embeds: [messageEmbed] });
}

module.exports = {
    data: builder,
    execute
};
