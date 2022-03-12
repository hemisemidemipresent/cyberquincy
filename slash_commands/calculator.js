const { SlashCommandBuilder, SlashCommandStringOption } = require('@discordjs/builders');

// https://github.com/aaditmshah/lexer
const Lexer = require('lex');
const gHelper = require('../helpers/general.js');
const bHelper = require('../helpers/bloons-general');

const LexicalParser = require('../helpers/calculator/lexical_parser');
const chimps = require('../jsons/round2.json');
const RoundParser = require('../parser/round-parser');

const { red } = require('../jsons/colours.json');

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
    .addChoice('Easy (Primary only, Deflation)', 'easy')
    .addChoice('Medium (Military only, Reverse, Apopalypse)', 'medium')
    .addChoice('Hard (Magic only, Double HP MOABs, Half Cash, C.H.I.M.P.S.)', 'hard')
    .addChoice('Impoppable', 'impoppable');

builder = new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Evaluate an expression to get a final cost')
    .addStringOption(exprOption)
    .addStringOption(difficulty);

async function calc(interaction) {
    // Use a "lexer" to parse the operator/operand tokens
    var lexer = new Lexer();

    lexer.addRule(/\s+/, function () {
        /* skip whitespace */
    });

    lexer.addRule(/[a-zA-Z#!0-9\.]+/, function (lexeme) {
        return lexeme; // symbols
    });

    lexer.addRule(/[\(\+\-\*\/%\^\)]/, function (lexeme) {
        return lexeme; // punctuation and operators
    });

    // Set up operators and operator precedence to interpret the parsed tree
    var power = {
        precedence: 3,
        associativity: 'left'
    };

    var factor = {
        precedence: 2,
        associativity: 'left'
    };

    var term = {
        precedence: 1,
        associativity: 'left'
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
    try {
        parsed = parse(expression);
    } catch (e) {
        // Catches bad character inputs
        c = e.message.match(/Unexpected character at index \d+: (.)/)[1];
        if (c) {
            footer = '';
            if (c === '<') footer = "Did you try to tag another discord user? That's definitely not allowed here.";
            return await interaction.reply({
                embeds: [
                    new Discord.MessageEmbed()
                        .setTitle(`Unexpected character "${c}"`)
                        .setDescription(
                            `"${c}" is not a valid character in the \`q!calc\` expression. Type \`q!calc\` for help.`
                        )
                        .setColor(red)
                        .setFooter(footer)
                ],
                components: []
            });
        } else console.log(e);
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
                    new Discord.MessageEmbed()
                        .setTitle(e.message)
                        .setColor(red)
                        .setFooter('due to manipulation, your full input will not be shown')
                ]
            });
        } else console.log(e);
    }

    // The single item left in the stack is the evaluated result
    var output = stack.pop();

    if (isNaN(output)) {
        return await interaction.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle('Error processing expression. Did you add an extra operator?')
                    .setDescription(`\`${expression}\``)
                    .setColor(red)
                    .setFooter('Enter `q!calc` for help')
            ]
        });
    } else if (stack.length > 0) {
        return await interaction.reply({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle('Error processing expression. Did you leave out an operator?')
                    .setDescription(`\`${expression}\``)
                    .setColor(red)
                    .setFooter('Enter `q!calc` for help')
            ]
        });
    } else {
        // G2g!
        return await interaction.reply({
            embeds: [
                new Discord.MessageEmbed()
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

function costOfTowerUpgradeCrosspath(t, difficulty) {
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
        cost = Towers.totalTowerUpgradeCrosspathCostMult(costs, jsonTowerName, upgrades, difficulty);
    } else if (t.includes('!')) {
        // Individual upgrade cost
        let [path, tier] = Towers.pathTierFromUpgradeSet(upgrades);
        const mediumCost = costs[jsonTowerName].upgrades[`${path}`][tier - 1];
        cost = bHelper.difficultyPriceMult(mediumCost, difficulty);
    } else {
        throw 'No # or ! found in tower cost calc';
    }
    return cost;
}

// TODO: Use hero json
function costOfHero(hero, difficulty) {
    const mediumCost = heroes[hero]['cost'];
    if (!mediumCost) throw `${hero} does not have entry in heroes.json`;
    return bHelper.difficultyPriceMult(mediumCost, difficulty);
}

// Decipher what type of operand it is, and convert to cost accordingly
function parseAndValueToken(t, i, difficulty) {
    if (!isNaN(t)) return Number(t);
    else if ((round = CommandParser.parse([t], new RoundParser('IMPOPPABLE')).round)) {
        return chimps[round].cumulativeCash - chimps[5].cumulativeCash + 650;
    } else if (isTowerUpgradeCrosspath(t)) {
        // Catches tower upgrades with crosspaths like wiz#401
        return costOfTowerUpgradeCrosspath(t, difficulty);
    } else if (Towers.isTowerUpgrade(Aliases.getCanonicalForm(t))) {
        // Catches all other tower ugprades
        return costOfTowerUpgradeCrosspath(t, difficulty);
    } else if (Towers.isTower(Aliases.getCanonicalForm(t))) {
        // Catches base tower names/aliases
        return costOfTowerUpgradeCrosspath(`${t}#000`, difficulty);
    } else if (Aliases.isHero(Aliases.getCanonicalForm(t))) {
        return costOfHero(t, difficulty);
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

function execute(interaction) {
    calc(interaction);
}

module.exports = {
    data: builder,
    execute
};
