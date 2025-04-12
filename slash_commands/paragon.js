const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption } = require('discord.js');

// https://github.com/aaditmshah/lexer
const Lexer = require('lex');
const { LexicalParser, LexicalParseError } = require('../helpers/calculator/lexical_parser');

const { discord, justStatsFooter } = require('../aliases/misc.json');
const { red, paragon } = require('../jsons/colors.json');

const reqs = require('../jsons/power_degree_req.json');
const pHelp = require('../helpers/paragon');
const paragonStats = require('../jsons/paragon.json');
const bloonology = require('../helpers/bloonology');
// const paragonCosts = require('../jsons/paragon_costs.json');

builder = new SlashCommandBuilder()
    .setName('paragon')
    .setDescription('Find out stats for paragons, or calculate the degree of a paragon!')
    .addSubcommand((subcommand) =>
        subcommand
            .setName('stats')
            .setDescription('Find out the stats for paragons of various degrees!')
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
                        { name: 'Monkey Ace (Goliath Doomship)', value: 'monkey_ace' },
                        { name: 'Wizard Monkey (Magus Perfectus)', value: 'wizard_monkey' },
                        { name: 'Monkey Sub (Nautic Siege Core)', value: 'monkey_sub' },
                        { name: 'Tack Shooter (Crucible of Steel and Flame)', value: 'tack_shooter' },
                        { name: 'Spike Factory (Mega Massive Munitions Factory)', value: 'spike_factory' },
                    )
            )
            .addIntegerOption((option) =>
                option.setName('degree').setDescription('The degree of the paragon').setRequired(true)
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
            .addIntegerOption(
                new SlashCommandIntegerOption()
                    .setName("injected_cash")
                    .setDescription("the amount of cash injected via the Paragon Cash Slider")
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
    level = interaction.options.getInteger('degree');

    if (level < 1 || level > 100) return `Degree for paragon must be between 1 and 100 inclusive (inputted: ${level})`;
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
    x = interaction.options.getInteger('degree');
    tower = interaction.options.getString('tower');

    let desc = '';
    let stats = JSON.parse(JSON.stringify(paragonStats[tower]));
    let attacks = Object.keys(stats);
    attacks.forEach((key) => (stats[key] = pHelp.getLevelledObj(stats[key], x)));

    switch (tower) {
        case 'dart_monkey':
            desc = bloonology.dartParagonBloonology(stats);
            break;
        case 'boomerang_monkey':
            desc = bloonology.boomerParagonBloonology(stats);
            break;
        case 'ninja_monkey':
            desc = bloonology.ninjaParagonBloonology(stats);
            break;
        case 'monkey_buccaneer':
            desc = bloonology.buccParagonBloonology(stats);
            break;
        case 'engineer_monkey':
            desc = bloonology.engiParagonBloonology(stats);
            break;
        case 'monkey_ace':
            desc = bloonology.aceParagonBloonology(stats);
            break;
        case 'wizard_monkey':
            desc = bloonology.wizParagonBloonology(stats);
            break;
        case 'monkey_sub':
            desc = bloonology.subParagonBloonology(stats);
            break;
        case 'tack_shooter':
            desc = bloonology.tackParagonBloonology(stats);
            break;
        case 'spike_factory':
            desc = bloonology.spacParagonBloonology(stats);
            break;
    }

    let messageEmbed = new Discord.EmbedBuilder()
        .setTitle(`\`${tower}\` paragon - level ${level}`)
        .setDescription(desc)
        .setFields([
            { name: 'Incorrect/out of date information?', value: `Go yell at hemi [here](${discord})` }
        ])
        .setFooter({ text: justStatsFooter })
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
                throw new UnrecognizedTokenError('Multiplication must only be between a monkey/totem and a number');
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

    let injectedCash = interaction.options.getInteger('injected_cash');
    if (injectedCash < 0) return await interaction.reply({
        embeds: [
            new Discord.EmbedBuilder()
                .setTitle(`Injected cash is negative`)
                .setDescription(
                    `You can only input a nonegative number into \`injected_cash\`, when ${injectedCash} is a negative number. Use \`/paragon degree expr: help pops: 0 injected_cash: 0\` for help.`
                )
                .setColor(red)
        ], ephemeral: true
    });

    totalMoneySpent += Math.ceil(injectedCash / 1.05);

    let powerCost = totalMoneySpent / 25;
    let powerUpgrade = totalUpgradeCount * 100;
    let powerT5 = totalT5 * 6000;
    let powerTotem = totems * 2000;
    let powerPops = popCount / 180;

    if (powerCost > 60000) powerCost = 60000;
    if (powerUpgrade > 10000) powerUpgrade = 10000;
    if (powerT5 > 50000) powerT5 = 50000;
    if (powerPops > 90000) powerPops = 90000;

    let totalPower = powerCost + powerUpgrade + powerT5 + powerTotem + powerPops;

    powerCost = Number.isInteger(powerCost) ? powerCost : powerCost.toFixed(1);
    powerUpgrade = Number.isInteger(powerUpgrade) ? powerUpgrade : powerUpgrade.toFixed(1);
    powerT5 = Number.isInteger(powerT5) ? powerT5 : powerT5.toFixed(1);
    powerTotem = Number.isInteger(powerTotem) ? powerTotem : powerTotem.toFixed(1);
    powerPops = Number.isInteger(powerPops) ? powerPops : powerPops.toFixed(1);

    if (powerCost === 60000) powerCost += ' [MAX]';
    if (powerUpgrade === 10000) powerUpgrade += ' [MAX]';
    if (powerT5 === 50000) powerT5 += ' [MAX]';
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
            `Input: \`expr: ${expression}\tpops: ${pops}\tinjected_cash: ${injectedCash}\`
                ${totalT5 === 3 || totalT5 === 4 ? "Did you include the three original T5s to be sacrificed? You aren't supposed to do that!" : ''}
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
                value: `Power to next degree (${x + 2}): \`${Number.isInteger(powerDiff) ? powerDiff : powerDiff.toFixed(1)}\`
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
    lexer.addRule(/\s+/, () => { });

    // symbols
    lexer.addRule(/[a-zA-Z#0-9.]+/, (lexme) => lexme);
    // punctuation and operators
    lexer.addRule(/[(+*)]/, (lexme) => lexme);

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

    let parsed;
    try {
        // Execute the interpretation of the parsed lexical stack
        lexer.setInput(input);
        let tokens = [];
        let token;
        while ((token = lexer.lex())) tokens.push(token);
        parsed = parser.parse(tokens);
    } catch (e) {
        // Catches bad character inputs
        c = e.message.match(/Unexpected character at index \d+: (.)/)?.[1];
        if (c) {
            let embed = new Discord.EmbedBuilder()
                .setTitle(`Unexpected character "${c}"`)
                .setDescription(
                    `"${c}" is not a valid character in the expression. Use \`/paragon degree expr: help pops: 0 injected_cash: 0\` for help.`
                )
                .setColor(red);
            if (c === '<')
                embed.setFooter({ text: "Did you try to tag another discord user? That's definitely not allowed here." });
            return embed;
        } else if (e instanceof LexicalParseError) {
            return new Discord.EmbedBuilder().setTitle(e.message).setDescription(`\`${input}\``).setColor(red);
        } else console.log(e);
    }

    let stack = [];

    try {
        let i = 0;
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
            return new Discord.EmbedBuilder().setTitle(e.message).setColor(red);
        else console.log(e);
    }

    let output = stack.pop();
    if (isNaN(output))
        return new Discord.EmbedBuilder()
            .setTitle('Error processing expression. Did you add an extra operator?')
            .setDescription(`\`${input}\``)
            .setColor(red)
            .setFooter({ text: 'Enter /paragon degree expr: help pops: 0 injected_cash: 0 for help' });
    else if (stack.length > 0)
        return new Discord.EmbedBuilder()
            .setTitle('Error processing expression. Did you leave out an operator?')
            .setDescription(`\`${input}\``)
            .setColor(red)
            .setFooter({ text: 'Enter /paragon degree expr: help pops: 0 injected_cash: 0 for help' });
    return output;
}

// Decipher what type of operand it is, and convert to cost accordingly
function valueByCost(t, i, difficulty) {
    const canonicalToken = Aliases.canonicizeArg(t);

    if (Towers.isTower(canonicalToken)) {
        return Towers.costOfTowerUpgrade(canonicalToken, '000', difficulty);
    } else if (Towers.isTowerUpgrade(canonicalToken, true)) {
        let [tower, upgradeSet] = canonicalToken.split('#');
        return Towers.costOfTowerUpgradeSet(tower, upgradeSet, difficulty);
    } else if (t.toLowerCase() === 'totem') {
        return 0; // totem
    } else if (!isNaN(t)) {
        return { value: Number(t), type: 'number' };
    } else {
        throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
    }
}

// returns number of upgrades
function valueByUpgrade(t, i) {
    const canonicalToken = Aliases.canonicizeArg(t);

    if (Towers.isTower(canonicalToken)) {
        return 0;
    } else if (Towers.isTowerUpgrade(canonicalToken, true)) {
        let arr = Towers.towerUpgradeToUpgrade(canonicalToken)
            .split('')
            .map((e) => parseInt(e));
        if (arr.includes(5)) return 0;
        else return arr.reduce((a, b) => a + b);
    } else if (t.toLowerCase() === 'totem') {
        return 0; // totem
    } else if (!isNaN(t)) {
        return { value: Number(t), type: 'number' };
    } else {
        throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
    }
}

function valueByT5(t, i) {
    const canonicalToken = Aliases.canonicizeArg(t);

    if (Towers.isTower(canonicalToken)) {
        return 0;
    } else if (Towers.isTowerUpgrade(canonicalToken, true)) {
        return canonicalToken.includes('5') ? 1 : 0;
    } else if (t.toLowerCase() === 'totem') {
        return 0; // totem
    } else if (!isNaN(t)) {
        return { value: Number(t), type: 'number' };
    } else {
        throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
    }
}

function valueByTotem(t) {
    if (!isNaN(t)) return { value: Number(t), type: 'number' };
    return t.toLowerCase() === 'totem' ? 1 : 0;
}

function valueByPop(t, i) {
    if (!isNaN(t)) return Number(t);
    else throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
}

class UnrecognizedTokenError extends Error { }

module.exports = {
    data: builder,
    execute
};

