const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

// https://github.com/aaditmshah/lexer
const Lexer = require('lex');

const LexicalParser = require('../helpers/calculator/lexical_parser');

const { red, paragon } = require('../jsons/colours.json');

const costs = require('../jsons/costs.json');
const reqs = require('../jsons/power_degree_req.json');

const exprOption = new SlashCommandStringOption()
    .setName('expr')
    .setDescription('Expression; press TAB when done (DO NOT INCLUDE THE ORIGINAL 3 T5s)')
    .setRequired(true);
const popsOption = new SlashCommandStringOption()
    .setName('pops')
    .setDescription('Total pops from all towers; press TAB when done')
    .setRequired(true);
const difficulty = new SlashCommandStringOption()
    .setName('difficulty')
    .setDescription('Game Difficulty')
    .setRequired(false)
    .addChoices(
        { name: 'Easy (Primary only, Deflation)', value: 'easy' },
        { name: 'Medium (Military only, Reverse, Apopalypse)', value: 'medium' },
        { name: 'Hard (Magic only, Double HP MOABs, Half Cash, C.H.I.M.P.S.)', value: 'hard' },
        { name: 'Impoppable', value: 'impoppable' }
    );

builder = new SlashCommandBuilder()
    .setName('degree')
    .setDescription('evaluate paragon degree')
    .addStringOption(exprOption)
    .addStringOption(popsOption)
    .addStringOption(difficulty);

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
            if (c === '<')
                footer =
                    "Did you try to tag another discord user? That's definitely not allowed here.";
            return new Discord.EmbedBuilder()
                .setTitle(`Unexpected character "${c}"`)
                .setDescription(
                    `"${c}" is not a valid character in the expression. Type \`help\` into the \`expr\` for help.`
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
            .setColor(red);
    //.setFooter({ text: 'Enter `q!calc` for help' })
    else if (stack.length > 0)
        return new Discord.EmbedBuilder()
            .setTitle('Error processing expression. Did you leave out an operator?')
            .setDescription(`\`${input}\``)
            .setColor(red);
    //.setFooter({ text: 'Enter `q!calc` for help' })
    return output;
}

async function execute(interaction) {
    // Get the original command arguments string back (other than the command name)
    const expression = interaction.options.getString('expr');
    const difficulty = interaction.options.getString('difficulty') || 'hard';
    const pops = interaction.options.getString('pops');

    if (expression === 'help')
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('HELP')
                    .setDescription(
                        'Paragon degree calculator (in progress)\nNote that **The 3 original tier 5s SHOULD NOT BE TYPED IN**'
                    )
                    .addFields([
                        {
                            name: '`dart#420`, `boomer#500`',
                            value: 'These represent the towers sacrificed'
                        },
                        {
                            name: '`ujugg`, `glord`',
                            value: 'These are shorthands for `dart#500` and `boomer#500` respectively'
                        },
                        {
                            name: '`totem`',
                            value: "Represents a Paragon Power Totem from Geraldo's shop"
                        },
                        {
                            name: 'Examples',
                            value: `\`/test expr: dart#042 + dart#020\` Represents sacrificing a \`042\` dart monkey and a \`020\` dart monkey
                        \`/test expr: dart#042 * 10\` Represents sacrificing 10 \`042\` dart monkeys
                        \`/test expr: dart#025 + totem * 10\` Represents sacrificing an **additional** \`025\` crossbow master and 10 Paragon Power Totems`
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
                throw new UnrecognizedTokenError(
                    'Addition must only be between monkeys/totems and not numbers'
                );
            return a + b;
        },
        // multiplication must only be between a monkey-value and a number (i.e. their types must be different)
        '*': function (a, b) {
            if (typeof a === typeof b)
                throw new UnrecognizedTokenError(
                    'Multiplication must only be between a monkey/totem and a numbers'
                );
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
    if (isNaN(totalMoneySpent))
        return await interaction.reply({ embeds: [totalMoneySpent], ephemeral: true });

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
                name: `**Total power: \`${
                    Number.isInteger(totalPower) ? totalPower : totalPower.toFixed(1)
                }\`**`,
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

// wiz!300 or wiz#300 e.g.
function isTowerUpgradeCrosspath(t) {
    if (!/[a-z]+#\d{3}/.test(t)) return false;

    let [tower, upgrades] = t.split('#');

    return (
        Towers.allTowers().includes(Aliases.getCanonicalForm(tower)) &&
        Towers.isValidUpgradeSet(upgrades)
    );
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
        cost = Towers.totalTowerUpgradeCrosspathCostMult(
            costs,
            jsonTowerName,
            upgrades,
            difficulty
        );
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
    else if (Towers.isTowerUpgrade(Aliases.getCanonicalForm(t)))
        return costOfTowerUpgradeCrosspath(t, difficulty);
    // Catches base tower names/aliases
    else if (Towers.isTower(Aliases.getCanonicalForm(t)))
        return costOfTowerUpgradeCrosspath(`${t}#000`, difficulty);
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
