const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

// https://github.com/aaditmshah/lexer
const Lexer = require('lex');
const gHelper = require('../helpers/general.js');
const bHelper = require('../helpers/bloons-general');

const LexicalParser = require('../helpers/calculator/lexical_parser');
const chimps = require('../jsons/round2.json');
const RoundParser = require('../parser/round-parser');

const { red } = require('../jsons/colors.json');

const costs = require('../jsons/costs.json');
const heroes = require('../jsons/heroes.json');

const exprOption = new SlashCommandStringOption()
    .setName('expr')
    .setDescription('Expression (press TAB when done)')
    .setRequired(true);

const difficulty = new SlashCommandStringOption()
    .setName('difficulty')
    .setDescription('Game Difficulty')
    .setRequired(false)
    .addChoices(
        { name: 'Easy (Primary only, Deflation)', value: 'easy' },
        { name: 'Medium (Military only, Reverse, Apopalypse)', value: 'medium' },
        { name: 'Impoppable', value: 'impoppable' }
    );

builder = new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Evaluate an expression to get a final cost')
    .addStringOption(exprOption)
    .addStringOption(difficulty);

async function calc(interaction) {
    // Use a "lexer" to parse the operator/operand tokens
    var lexer = new Lexer();

    lexer.addRule(/\s+/, function () {
        // skip whitespace
    });

    lexer.addRule(/[a-zA-Z#!0-9\.]+/, function (lexeme) {
        return lexeme; // symbols
    });

    lexer.addRule(/[\(\+\-\*\/%\^\)']/, function (lexeme) {
        return lexeme; // punctuation and operators
    });

    // Set up operators and operator precedence to interpret the parsed tree
    var power = {
        precedence: 3,
    };

    var factor = {
        precedence: 2,
    };

    var term = {
        precedence: 1,
    };

    var parser = new LexicalParser({
        '+': term,
        '-': term,
        '*': factor,
        '/': factor,
        '%': factor,
        '^': power
    });

    // Execute the interpretation of the parsed lexical stack
    function parse(input) {
        lexer.setInput(input);
        var tokens = [],
            token;
        while ((token = lexer.lex())) tokens.push(token);
        return parser.parse(tokens);
    }

    // Get the original command arguments string back (other than the command name)
    const expression = interaction.options.getString('expr');
    const difficulty = interaction.options.getString('difficulty') || 'hard';

    if (expression === 'help') {
        let helpEmbed = new Discord.EmbedBuilder()
            .setTitle('`/calc` HELP')
            .setDescription('**Cash Calculator**')
            .addFields([
                { name: '`r52`,`R100`', value: 'Cumulative cash earned after specified round (6-100)' },
                { name: '`33.21`, `69.4201`', value: 'Literally just numbers work' },
                {
                    name: '`wiz!420`, `super!100`, `dart` (same as `dart!000`), `wlp` (same as `wiz!050`)',
                    value: 'INDIVIDUAL COST of tower!upgradeSet'
                },
                { name: '`wiz#420`, `super#000`', value: 'TOTAL COST of tower#upgradeSet' },
                { name: '`adora`, `brick`', value: 'Base cost of hero (no leveling cost calculations included)' },
                { name: 'Operators', value: '`+`, `-`, `*`, `/`, `%` (remainder), `^` (raise to power)' },
                {
                    name: 'Examples',
                    value: `\`/calc expr:r99 - wiz#025 - super#052\` (2tc test)
                            \`/calc expr:ninja#502 + ninja#030 * 20 * 0.85\` (GMN + single-discounted shinobi army)
                            \`/calc expr:vil#002 + (vill#302 + vill#020)*0.85 + vill!400\` (camo-mentoring double discount village setup)`
                },
                {
                    name: 'Notes',
                    value: ` • For ambiguous tokens like \`wiz!220\` and \`super!101\` (there is no path/crosspath), the upgrade is assumed to be the leftmost non-zero digit
                             • You can use this calculator for non-cash-related calculations as well. Just ignore the dollar sign in the result.`
                }
            ])
            .setColor(colours['black']);
        return await interaction.reply({ embeds: [helpEmbed] });
    }

    try {
        parsed = parse(expression);
    } catch (e) {
        // Catches bad character inputs
        c = e.message.match(/Unexpected character at index \d+: (.)/)?.[1];
        if (c) {
            footer = '';
            if (c === '<') footer = "Did you try to tag another discord user? That's definitely not allowed here.";
            return await interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(`Unexpected character "${c}"`)
                        .setDescription(`"${c}" is not a valid character in the \`/calc\` expression.`)
                        .setColor(red)
                        .setFooter({ text: footer })
                ],
                components: []
            });
        } else throw e
    }

    var stack = [];

    // Evaluate the interpreted expression
    var operator = {
        '+': function (a, b) {
            return a + b;
        },
        '-': function (a, b) {
            return a - b;
        },
        '*': function (a, b) {
            return a * b;
        },
        '/': function (a, b) {
            return a / b;
        },
        '%': function (a, b) {
            return a % b;
        },
        '^': function (a, b) {
            return a ** b;
        }
    };

    try {
        i = 0;
        parsed.forEach(function (c) {
            i++;
            switch (c) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                case '^':
                    var b = +stack.pop();
                    var a = +stack.pop();
                    stack.push(operator[c](a, b));
                    break;
                default:
                    // Convert symbolic terms to bloons-ingame-monetary values
                    stack.push(parseAndValueToken(c, i, difficulty));
            }
        });
    } catch (e) {
        if (e instanceof UnrecognizedTokenError) {
            // Catches nonsensical tokens
            return await interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(e.message)
                        .setColor(red)
                        .setFooter({ text: 'due to manipulation, your full input will not be shown' })
                ]
            });
        } else console.log(e);
    }

    // The single item left in the stack is the evaluated result
    var output = stack.pop();

    if (isNaN(output)) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Error processing expression. Did you add an extra operator?')
                    .setDescription(`\`${expression}\``)
                    .setColor(red)
            ]
        });
    } else if (stack.length > 0) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Error processing expression. Did you leave out an operator?')
                    .setDescription(`\`${expression}\``)
                    .setColor(red)
            ]
        });
    } else {
        // G2g!
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle(gHelper.numberAsCost(Number.isInteger(output) ? output : output.toFixed(1))) // At MOST 1 decimal place
                    .setDescription(`\`${expression}\``)
                    .setColor(colours['cyber'])
            ]
        });
    }
}

// wiz!300 or wiz#300 e.g.
function isTowerUpgradeCrosspath(t) {
    if (!/[a-z]+[#!]\d{3}/.test(t)) return false;

    let [tower, upgrades] = t.split(/[!#]/);

    return Towers.allTowers().includes(Aliases.getCanonicalForm(tower)) && Towers.isValidUpgradeSet(upgrades);
}

function costOfTowerUpgradeCrosspath(t, difficulty, numDiscounts) {
    // Checking for tower aliases of the form wlp, gz, etc.
    if (!['!', '#'].some((sep) => t.includes(sep))) {
        // Alias tokens like wlp as wiz!050
        t = Aliases.getCanonicalForm(t).replace('#', '!');
    }

    let [tower, upgrades] = t.split(/[!#]/);

    jsonTowerName = Aliases.getCanonicalForm(tower).replace(/_/, '-');
    if (jsonTowerName === 'druid-monkey') jsonTowerName = 'druid';
    if (jsonTowerName === 'engineer') jsonTowerName = 'engineer-monkey';

    let cost = 0;
    if (t.includes('#') || upgrades == '000') {
        // Total cost
        cost = Towers.totalTowerUpgradeCrosspathCostMult(costs, jsonTowerName, upgrades, difficulty, numDiscounts);
    } else if (t.includes('!')) {
        // Individual upgrade cost
        let [path, tier] = Towers.pathTierFromUpgradeSet(upgrades);
        const mediumCost = costs[jsonTowerName].upgrades[`${path}`][tier - 1];
        cost = bHelper.difficultyPriceMult(mediumCost, difficulty);
        if (tier <= 3) {
            cost = bHelper.discountPriceMult(cost, numDiscounts)
        }
    } else {
        throw 'No # or ! found in tower cost calc';
    }
    return cost;
}

// TODO: Use hero json
function costOfHero(hero, difficulty, numDiscounts) {
    const mediumCost = heroes[hero]['cost'];
    if (!mediumCost) throw `${hero} does not have entry in heroes.json`;
    return bHelper.discountPriceMult(
        bHelper.difficultyPriceMult(mediumCost, difficulty),
        numDiscounts
    );
}

// Decipher what type of operand it is, and convert to cost accordingly
function parseAndValueToken(t, i, difficulty) {
    const undiscountedToken = t.replace(/'*$/, '')
    const numDiscounts = t.match(/'*$/)?.[0]?.length
    if (!isNaN(undiscountedToken)) return Number(t);
    else if ((round = CommandParser.parse([undiscountedToken], new RoundParser('PREDET_CHIMPS')).round)) {
        return chimps[round].cumulativeCash - chimps[5].cumulativeCash + 650;
    } else if (isTowerUpgradeCrosspath(undiscountedToken)) {
        // Catches tower upgrades with crosspaths like wiz#401
        return costOfTowerUpgradeCrosspath(t, difficulty, numDiscounts);
    } else if (Towers.isTowerUpgrade(Aliases.getCanonicalForm(undiscountedToken))) {
        // Catches all other tower ugprades
        return costOfTowerUpgradeCrosspath(t, difficulty, numDiscounts);
    } else if (Towers.isTower(Aliases.getCanonicalForm(undiscountedToken))) {
        // Catches base tower names/aliases
        return costOfTowerUpgradeCrosspath(`${t}#000`, difficulty, numDiscounts);
    } else if (Aliases.isHero(Aliases.getCanonicalForm(undiscountedToken))) {
        return costOfHero(Aliases.getCanonicalForm(t), difficulty, numDiscounts);
    } else {
        s = '';
        if (t.length == 1) {
            s = t;
        } else if (t.length == 2) {
            s = t.charAt(0) + t.charAt(1);
        } else {
            s = t.charAt(0) + t.charAt(1) + '...';
        }
        throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${s}" of length ${t.length}`);
    }
}

class UnrecognizedTokenError extends Error {}

async function execute(interaction) {
    await calc(interaction);
}

module.exports = {
    data: builder,
    execute
};
