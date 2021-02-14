// https://github.com/aaditmshah/lexer
const Lexer = require('lex');

const LexicalParser = require('../helpers/calculator/lexical_parser');
const chimps = require('../jsons/round2.json');
const RoundParser = require('../parser/round-parser');

function calc(message, args, json) {
    if (args.length == 0 || args.includes('help')) {
        return helpMessage(message);
    }

    // Use a "lexer" to parse the operator/operand tokens
    var lexer = new Lexer();

    lexer.addRule(/\s+/, function () {
        /* skip whitespace */
    });

    lexer.addRule(/[a-zA-Z#!0-9\.]+/, function (lexeme) {
        return lexeme; // symbols
    });

    lexer.addRule(/[\(\+\-\*\/%\)]/, function (lexeme) {
        return lexeme; // punctuation (i.e. "(", "+", "-", "*", "/", ")")
    });

    // Set up operators and operator precedence to interpret the parsed tree
    var factor = {
        precedence: 2,
        associativity: 'left',
    };

    var term = {
        precedence: 1,
        associativity: 'left',
    };

    var parser = new LexicalParser({
        "+": term,
        "-": term,
        "*": factor,
        "/": factor,
        "%": factor,
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
    expression = args.join(' ');
    parsed = parse(expression);

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
        "%": function (a, b) { 
            return a % b; 
        },
    };

    try {
        parsed.forEach(function (c) {
            switch (c) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                    var b =+ stack.pop();
                    var a =+ stack.pop();
                    stack.push(operator[c](a, b));
                    break;
                default:
                    // Convert symbolic terms to bloons-ingame-monetary values
                    stack.push(parseAndValueToken(c, json));
            }
        });
    } catch (e) {
        if (e instanceof UnrecognizedTokenError) {
            return message.channel.send(
                new Discord.MessageEmbed()
                    .setTitle(e.message)
                    .setDescription(`\`${expression}\``)
                    .setColor(colours['red'])
            );
        }
    }

    // The single item left in the stack is the evaluated result
    var output = stack.pop();

    return message.channel.send(
        new Discord.MessageEmbed()
            .setTitle(gHelper.numberAsCost(Number.isInteger(output) ? output : output.toFixed(1))) // At MOST 1 decimal place
            .setDescription(`\`${expression}\``)
            .setColor(colours['cyber'])
    );
}

function isTowerUpgradeCrosspath(t) {
    if (!/[a-z]+[#!]\d{3}/.test(t)) return false

    let [tower, upgrades] = t.split(/[!#]/)

    return (
        Towers.allTowers().includes(Aliases.getCanonicalForm(tower)) &&
        Towers.isValidUpgradeSet(upgrades)
    );
}

function costOfTowerUpgradeCrosspath(t, json) {
    let [tower, upgrades] = t.split(/[!#]/)

    jsonTowerName = Aliases.getCanonicalForm(tower).replace(/_/, '-');

    let mediumCost = null
    if (t.includes('#')) {
        mediumCost = Towers.totalTowerUpgradeCrosspathCost(json, jsonTowerName, upgrades)
    } else if (t.includes("!")) {
        let [path, tier] = Towers.pathTierFromUpgradeSet(upgrades);
        mediumCost = json[`${jsonTowerName}`].upgrades[path - 1][tier - 1].cost
    } else {
        throw 'No # or ! found in tower cost calc'
    }
    return hard(mediumCost)
}

function hard(cost) {
    return Math.round((cost * 1.08) / 5) * 5;
}

// Decipher what type of operand it is, and convert to cost accordingly
function parseAndValueToken(t, json) {
    if (!isNaN(t)) return Number(t);
    else if (
        (round = CommandParser.parse([t], new RoundParser('IMPOPPABLE')).round)
    ) {
        return chimps[round].cumulativeCash - chimps[5].cumulativeCash + 650;
    } else if (isTowerUpgradeCrosspath(t)) {
        return costOfTowerUpgradeCrosspath(t, json);
    } else {
        throw new UnrecognizedTokenError(`Unrecognized token \`${t}\``);
    }
}

class UnrecognizedTokenError extends Error {}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!calc` HELP')
        .setDescription('**CHIMPS Cost Calculator**')
        .addField(
            '`r52`,`R100`',
            'Cumulative cash earned after specified round (6-100)'
        )
        .addField('`33.21`, `69.4201`', 'Literally just numbers work')
        .addField('`wiz!420`, `super!100`', 'INDIVIDUAL COST of tower!upgradeSet (can\'t do just `wiz`)')
        .addField('`wiz#420`, `super#000`', 'TOTAL COST of tower#upgradeSet (can\'t do just `wiz`)')
        .addField('Operators', '`+`, `-`, `*`, `/`, `%` (remainder)')
        .addField(
            'Examples', 
            '`q!calc r99 - wiz#025 - super#052` (2tc test)\n' + 
                '`q!calc ninja#502 + ninja#030 * 20 * 0.85` (GMN + single-discounted shinobi army)')
        .addField(
            'Notes',
            'For amgiguous tokens like `wiz!220` and `super!101`, the upgrade is assumed to be the leftmost non-zero digit.'
        )
        .setFooter('No heroes (just plug in the cost yourself), no discounts on towers (apply the cost reduction yourself if possible)')
        .setColor(colours['black'])

    return message.channel.send(helpEmbed);
}

module.exports = {
    name: 'calculator',
    aliases: ['calc', 'cash-calc', 'cc'],
    rawArgs: true,
    dependencies: ['towerJSON'],
    execute(message, args) {
        calc(message, args, towerJSON);
    },
    helpMessage,
};
