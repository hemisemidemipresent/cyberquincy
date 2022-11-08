const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

// https://github.com/aaditmshah/lexer
const Lexer = require('lex');
const LexicalParser = require('../helpers/calculator/lexical_parser');

const { footer } = require('../aliases/misc.json');
const { red, paragon } = require('../jsons/colors.json');

const costs = require('../jsons/costs.json');
const reqs = require('../jsons/power_degree_req.json');
const pHelp = require('../helpers/paragon');
const paragonStats = require('../jsons/paragon.json');

builder = new SlashCommandBuilder()
    .setName('paragon')
    .setDescription('Find out stats for paragons, or calculate the degree of a paragon!')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('stats')
            .setDescription('Find out the stats for paragons of various levels!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('tower')
                    .setDescription('The tower you want to find the paragon for')
                    .setRequired(true)
                    // TODO: consolidate 'dart_monkey', 'boomerang_monkey', 'ninja_monkey' and 'monkey_buccaneer' somewhere,
                    // and populate the StringOption for the slash command with them
                    .addChoices(
                        { name: 'Dart Monkey (Apex Plasma Master)', value: 'dart_monkey' },
                        { name: 'Boomerang Monkey (Glaive Dominus)', value: 'boomerang_monkey' },
                        { name: 'Ninja Monkey (Ascended Shadow)', value: 'ninja_monkey' },
                        { name: 'Monkey Buccaneer (Navarch of the Seas)', value: 'monkey_buccaneer' },
                        { name: 'Engineer Monkey (Master Builder)', value: 'engineer_monkey' },
                        { name: 'Monkey Ace (Goliath Doomship)', value: 'monkey_ace' }
                    )
            )
            .addIntegerOption((option) =>
                option.setName('level').setDescription('The level of the paragon').setRequired(true)
            )
    )
    .addSubcommand((subcommand) =>
        subcommand
            .setName('degree')
            .setDescription('Calculate the degree of a paragon!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('expr')
                    .setDescription('Expression; press TAB when done (DO NOT INCLUDE THE ORIGINAL 3 T5s)')
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('pops')
                    .setDescription('Total pops from all towers; press TAB when done')
                    .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('difficulty')
                    .setDescription('Game Difficulty')
                    .setRequired(false)
                    .addChoices(
                        { name: 'Easy (Primary only, Deflation)', value: 'easy' },
                        { name: 'Medium (Military only, Reverse, Apopalypse)', value: 'medium' },
                        { name: 'Hard (Magic only, Double HP MOABs, Half Cash, C.H.I.M.P.S.)', value: 'hard' },
                        { name: 'Impoppable', value: 'impoppable' }
                    )
            )
    );

function validateInput(interaction) {
    level = interaction.options.getInteger('level');

    if (level < 1 || level > 100) return `Level for paragon must be between 1 and 100 inclusive (inputted: ${level})`;
}

async function execute(interaction) {
    if (interaction.options.getSubcommand() === 'stats') await paragon_stats(interaction);
    else if (interaction.options.getSubcommand() === 'degree') await paragon_degree(interaction);
}

// ----------------------------------------------------------------
// stats subcommand
// ----------------------------------------------------------------

async function paragon_stats(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    // could be more concise in terms of code?
    // btw, level is now x due to 'level' or even 'lvl' being quite unwieldy
    x = interaction.options.getInteger('level');
    tower = interaction.options.getString('tower');

    let desc = '';

    if (tower === 'dart_monkey') {
        let paragon = JSON.parse(JSON.stringify(paragonStats.dart_monkey));

        let { d, cd, bd, ed, p, s } = pHelp.getLevelledObj(paragon, x);

        desc = `85r
                **juggernaut** - 3j, ${d}d, ${cd}cd, ${bd}bd, ${ed}ed, ${p}p, ${s}s, normal, camo
                • splits into 2 mini juggernauts
                • The juggernaut projectiles bounce off objects
                • explodes into mini juggernauts when it hits edge of screen
                • projectiles can rehit target
                **mini juggernaut** - identical to **juggernaut**`;
    } else if (tower === 'boomerang_monkey') {
        let pa = JSON.parse(JSON.stringify(paragonStats.boomerang_monkey));

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
        let pa = JSON.parse(JSON.stringify(paragonStats.ninja_monkey));

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
        let pa = JSON.parse(JSON.stringify(paragonStats.monkey_buccaneer));

        let attacks = Object.keys(pa);
        attacks.forEach((key) => (pa[key] = pHelp.getLevelledObj(pa[key], x)));

        desc = `**Activated Ability** - Hook the strongest target on screen, works on BADs and generates 2x normal cash. ${pa.ability.cooldown}s cooldown, maxes at 2 uses per round.
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
        let pa = JSON.parse(JSON.stringify(paragonStats.engineer_monkey));

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
    } else if (tower === 'monkey_ace') {
        let pa = JSON.parse(JSON.stringify(paragonStats.monkey_ace));
        let attacks = Object.keys(pa);
        attacks.forEach((key) => (pa[key] = pHelp.getLevelledObj(pa[key], x)));
        desc = `**Radial Darts** (purple trail)
        • ${pa.radial.d}d, ${pa.radial.bd}bd, ${pa.radial.ed}ed, ${pa.radial.p}p, 16j, ${pa.radial.s}s
        
        **Seeking Missiles** (green trail)
        • ${pa.seeking.d}d, ${pa.seeking.bd}bd, ${pa.seeking.ed}ed, ${pa.seeking.p}p, 4j, ${pa.seeking.s}s, on last hit: creates explosion
           
        **explosion** - ${pa.explosion.d}d, ${pa.explosion.bd}bd, ${pa.explosion.ed}ed, ${pa.explosion.p}p
        
        **Forward Firing Darts** (no trail)
        • ${pa.forward.d}d, ${pa.forward.bd}bd, ${pa.forward.ed}ed, ${pa.forward.p}p, 2j, ${pa.forward.s}s 
        • only fires when the ace is facing a bloon
        
        Activated Ability - **Carpet Bomb**
        • ${pa.carpet.cooldown}s cooldown
        • ~3s after activation, 8 **carpet-bomb**s are deployed along the selected path
        • **carpet-bomb** - ${pa.carpet.d}d, ${pa.carpet.bd}bd, ${pa.carpet.ed}ed, ${pa.carpet.p}p, 50 blast radius each 
        • if the hit does not pop the bloon: stun for 8s`;
    }
    let messageEmbed = new Discord.EmbedBuilder()
        .setTitle(`\`${tower}\` paragon - level ${level}`)
        .setDescription(desc.replace(/    /g, ''))
        .setFooter({ text: footer })
        .setColor(paragon);
    return await interaction.reply({ embeds: [messageEmbed] });
}

// ----------------------------------------------------------------
// degree subcommand
// ----------------------------------------------------------------

async function paragon_degree(interaction) {
    // Get the original command arguments string back (other than the command name)
    const expression = interaction.options.getString('expr');
    const difficulty = interaction.options.getString('difficulty') || 'hard';
    const pops = interaction.options.getString('pops');

    if (expression === 'help')
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('HELP')
                    .setDescription('Paragon degree calculator\nNote that **The 3 original tier 5s SHOULD NOT BE TYPED IN**')
                    .addFields([
                        { name: '`dart#420`, `boomer#500`', value: 'These represent the towers sacrificed' },
                        {
                            name: '`ujugg`, `glord`',
                            value: 'These are shorthands for `dart#500` and `boomer#500` respectively'
                        },
                        { name: '`totem`', value: "Represents a Paragon Power Totem from Geraldo's shop" },
                        {
                            name: 'Examples',
                            value: `\`/paragon degree expr: dart#042 + dart#020\` Represents sacrificing a \`042\` dart monkey and a \`020\` dart monkey
                                    \`/paragon degree expr: dart#042 * 10\` Represents sacrificing 10 \`042\` dart monkeys
                                    \`/paragon degree expr: dart#025 + totem * 10\` Represents sacrificing an **additional** \`025\` crossbow master and 10 Paragon Power Totems`
                        }
                    ])
            ]
        });

    // there is an issue where if a user just inputs a number (e.g. dart#020 + 3) the output would be gibberish.
    //So parsed numbers will be objects instead
    // The error that gets thrown is a UnrecognizedTokenError despite it being recognised, this can be changed later if necessary.
    const operator = {
        // addition must only be between 2 monkey-values, and raw numbers should be thrown out
        '+': function (a, b) {
            if (typeof a === 'object' || typeof b === 'object')
                throw new UnrecognizedTokenError('Addition must only be between monkeys/totems and not numbers');
            return a + b;
        },
        // multiplication must only be between a monkey-value and a number (i.e. their types must be different)
        '*': function (a, b) {
            if (typeof a === typeof b)
                throw new UnrecognizedTokenError('Multiplication must only be between a monkey/totem and a numbers');
            let res = typeof a === 'object' ? a.value * b : a * b.value;
            return res;
        }
    };

    const pop_operator = {
        '+': function (a, b) {
            return a + b;
        },
        '*': function (a, b) {
            return a * b;
        }
    };

    let totalMoneySpent = lex(expression, operator, valueByCost, difficulty);
    if (isNaN(totalMoneySpent)) return await interaction.reply({ embeds: [totalMoneySpent], ephemeral: true });

    let totalUpgradeCount = lex(expression, operator, valueByUpgrade, difficulty);
    let totalT5 = lex(expression, operator, valueByT5, difficulty);
    let totems = lex(expression, operator, valueByTotem, difficulty);

    let popCount = lex(pops, pop_operator, valueByPop, difficulty);
    if (isNaN(popCount)) return await interaction.reply({ embeds: [popCount], ephemeral: true });

    let powerCost = totalMoneySpent / 25;
    let powerUpgrade = totalUpgradeCount * 100;
    let powerT5 = totalT5 * 10000;
    let powerTotem = totems * 2000;
    let powerPops = popCount / 180;

    if (powerCost > 10000) powerCost = 10000;
    if (powerUpgrade > 10000) powerUpgrade = 10000;
    if (powerT5 > 90000) powerT5 = 90000;
    if (powerPops > 90000) powerPops = 90000;

    let totalPower = powerCost + powerUpgrade + powerT5 + powerTotem + powerPops;

    powerCost = Number.isInteger(powerCost) ? powerCost : powerCost.toFixed(1);
    powerUpgrade = Number.isInteger(powerUpgrade) ? powerUpgrade : powerUpgrade.toFixed(1);
    powerT5 = Number.isInteger(powerT5) ? powerT5 : powerT5.toFixed(1);
    powerTotem = Number.isInteger(powerTotem) ? powerTotem : powerTotem.toFixed(1);
    powerPops = Number.isInteger(powerPops) ? powerPops : powerPops.toFixed(1);

    if (powerCost === 10000) powerCost += ' [MAX]';
    if (powerUpgrade === 10000) powerUpgrade += ' [MAX]';
    if (powerT5 === 90000) powerT5 += ' [MAX]';
    if (powerPops === 90000) powerPops += ' [MAX]';

    // get degree (crude binary search)
    let x = 49; // degree (off by -1)
    let s = 25;
    function validate(x) {
        if (totalPower >= reqs[x + 1]) return 1;
        if (totalPower < reqs[x]) return -1;
        return 0;
    }
    let v = validate(x);
    while (v !== 0) {
        if (v === 1) x += s;
        else if (v === -1) x -= s;
        s = Math.ceil(s / 2);
        v = validate(x);
    }
    if (x === 100) x = 99; // off by one error

    const embed = new Discord.EmbedBuilder()
        .setTitle(`The paragon will be of degree **${x + 1}**`)
        .setDescription(
            `Input: \`expr: ${expression}\tpops: ${pops}\`
                ${
                    totalT5 === 3 || totalT5 === 4
                        ? "Did you include the three original T5s to be sacrificed? You aren't supposed to do that!"
                        : ''
                }
            `
        )
        .addFields([
            {
                name: `**Total power: \`${Number.isInteger(totalPower) ? totalPower : totalPower.toFixed(1)}\`**`,
                value: `Power from money spent: \`${powerCost}\`
                Power from upgrades: \`${powerUpgrade}\`
                Power from T5: \`${powerT5}\`
                Power from totems: \`${powerTotem}\`
                Power from pops: \`${powerPops}\`
                `
            }
        ])
        .setFooter({ text: `Difficulty: ${difficulty.toUpperCase()}` })
        .setColor(paragon);

    if (x !== 100) {
        const powerDiff = reqs[x + 1] - totalPower;
        const to100 = 200000 - totalPower;
        const totemsNeeded = Math.ceil(to100 / 2000);
        embed.addFields([
            {
                name: '\u200b',
                value: `Power to next degree (${x + 2}): \`${
                    Number.isInteger(powerDiff) ? powerDiff : powerDiff.toFixed(1)
                }\`
                Power requirement for next degree: \`${reqs[x]}\`
                Power to degree 100: \`${Number.isInteger(to100) ? to100 : to100.toFixed(1)}\`
                Totems needed for degree 100: \`${totemsNeeded}\``
            }
        ]);
    }

    return await interaction.reply({
        embeds: [embed]
    });
}

function lex(input, operator, value, difficulty) {
    // Use a "lexer" to parse the operator/operand tokens
    let lexer = new Lexer();

    // skip whitespace
    lexer.addRule(/\s+/, () => {});

    // symbols
    lexer.addRule(/[a-zA-Z#!0-9\.]+/, (lexme) => lexme);
    // punctuation and operators
    lexer.addRule(/[\(\+\*\)]/, (lexme) => lexme);

    // Set up operators and operator precedence to interpret the parsed tree
    const factor = {
        precedence: 2,
        associativity: 'left'
    };

    const term = {
        precedence: 1,
        associativity: 'left'
    };

    const parser = new LexicalParser({
        '+': term,
        '*': factor
    });

    try {
        // Execute the interpretation of the parsed lexical stack
        lexer.setInput(input);
        let tokens = [];
        let token;
        while ((token = lexer.lex())) tokens.push(token);
        parsed = parser.parse(tokens);
    } catch (e) {
        // Catches bad character inputs
        c = e.message.match(/Unexpected character at index \d+: (.)/)[1];
        if (c) {
            footer = '';
            if (c === '<') footer = "Did you try to tag another discord user? That's definitely not allowed here.";
            return new Discord.EmbedBuilder()
                .setTitle(`Unexpected character "${c}"`)
                .setDescription(
                    `"${c}" is not a valid character in the expression. Use \`/paragon degree expr: help pops: 0\` for help.`
                )
                .setColor(red)
                .setFooter({ text: footer });
        } else console.log(e);
    }

    let stack = [];

    try {
        i = 0;
        parsed.forEach((c) => {
            i++;
            switch (c) {
                case '+':
                case '*':
                    let b = stack.pop();
                    let a = stack.pop();
                    stack.push(operator[c](a, b));
                    break;
                default:
                    stack.push(value(c, i, difficulty));
            }
        });
    } catch (e) {
        if (e instanceof UnrecognizedTokenError)
            // Catches nonsensical tokens
            return new Discord.EmbedBuilder()
                .setTitle(e.message)
                .setColor(red)
                .setFooter({ text: 'due to manipulation, your full input will not be shown' });
        else console.log(e);
    }

    let output = stack.pop();
    if (isNaN(output))
        return new Discord.EmbedBuilder()
            .setTitle('Error processing expression. Did you add an extra operator?')
            .setDescription(`\`${input}\``)
            .setColor(red)
            .setFooter({ text: 'Enter /paragon degree expr: help pops: 0 for help' });
    else if (stack.length > 0)
        return new Discord.EmbedBuilder()
            .setTitle('Error processing expression. Did you leave out an operator?')
            .setDescription(`\`${input}\``)
            .setColor(red)
            .setFooter({ text: 'Enter /paragon degree expr: help pops: 0 for help' });
    return output;
}
// wiz!300 or wiz#300 e.g.
function isTowerUpgradeCrosspath(t) {
    if (!/[a-z]+#\d{3}/.test(t)) return false;

    let [tower, upgrades] = t.split('#');

    return Towers.allTowers().includes(Aliases.getCanonicalForm(tower)) && Towers.isValidUpgradeSet(upgrades);
}

function costOfTowerUpgradeCrosspath(t, difficulty) {
    // Checking for tower aliases of the form wlp, gz, etc.
    if (!t.includes('#')) t = Aliases.getCanonicalForm(t);

    let [tower, upgrades] = t.split('#');

    jsonTowerName = Aliases.getCanonicalForm(tower).replace(/_/, '-');
    if (jsonTowerName === 'druid-monkey') jsonTowerName = 'druid';
    if (jsonTowerName === 'engineer') jsonTowerName = 'engineer-monkey';

    let cost = 0;
    if (t.includes('#') || upgrades === '000') {
        // Total cost
        cost = Towers.totalTowerUpgradeCrosspathCostMult(costs, jsonTowerName, upgrades, difficulty);
    } else {
        throw 'No # found in tower cost calc';
    }
    return cost;
}

// Decipher what type of operand it is, and convert to cost accordingly
function valueByCost(t, i, difficulty) {
    if (!isNaN(t)) return { value: Number(t), type: 'number' };
    // Catches tower upgrades with crosspaths like wiz#401
    if (isTowerUpgradeCrosspath(t)) return costOfTowerUpgradeCrosspath(t, difficulty);
    // Catches all other tower ugprades
    else if (Towers.isTowerUpgrade(Aliases.getCanonicalForm(t))) return costOfTowerUpgradeCrosspath(t, difficulty);
    // Catches base tower names/aliases
    else if (Towers.isTower(Aliases.getCanonicalForm(t))) return costOfTowerUpgradeCrosspath(`${t}#000`, difficulty);
    else if (t.toLowerCase() === 'totem') return 0; // totem
    else throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
}

// returns number of upgrades
function valueByUpgrade(t, i) {
    if (!isNaN(t)) return { value: Number(t), type: 'number' };
    // Catches tower upgrades with crosspaths like wiz#401 || Catches all other tower ugprades
    if (isTowerUpgradeCrosspath(t) || Towers.isTowerUpgrade(Aliases.getCanonicalForm(t))) {
        if (!t.includes('#')) t = Aliases.getCanonicalForm(t);
        let arr = t
            .split('#')[1]
            .split('')
            .map((e) => parseInt(e));
        if (arr.includes(5)) return 0;
        else return arr.reduce((a, b) => a + b);
    }
    // Catches base tower names/aliases
    else if (Towers.isTower(Aliases.getCanonicalForm(t))) return 0;
    else if (t.toLowerCase() === 'totem') return 0; // totem
}

function valueByT5(t, i) {
    if (!isNaN(t)) return { value: Number(t), type: 'number' };
    // Catches tower upgrades with crosspaths like wiz#401 || Catches all other tower ugprades
    if (isTowerUpgradeCrosspath(t) || Towers.isTowerUpgrade(Aliases.getCanonicalForm(t))) {
        if (!t.includes('#')) t = Aliases.getCanonicalForm(t);
        if (t.includes('5')) return 1;
        else return 0;
    }
    // Catches base tower names/aliases
    else if (Towers.isTower(Aliases.getCanonicalForm(t))) return 0;
    else if (t.toLowerCase() === 'totem') return 0; // totem
}

function valueByTotem(t, i) {
    if (!isNaN(t)) return { value: Number(t), type: 'number' };
    if (t.toLowerCase() === 'totem') return 1;
    return 0;
    // honestly I think the checks should be done by now
}

function valueByPop(t, i) {
    if (!isNaN(t)) return Number(t);
    else throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
}

class UnrecognizedTokenError extends Error {}

module.exports = {
    data: builder,
    execute
};
