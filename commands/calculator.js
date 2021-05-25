// https://github.com/aaditmshah/lexer
const Lexer = require('lex');
const gHelper = require('../helpers/general.js');

const LexicalParser = require('../helpers/calculator/lexical_parser');
const chimps = require('../jsons/round2.json');
const RoundParser = require('../parser/round-parser');

const costs = require('../jsons/costs.json');

function calc(message, args) {
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
        '+': term,
        '-': term,
        '*': factor,
        '/': factor,
        '%': factor,
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
    try {
        parsed = parse(expression);
    } catch (e) {
        // Catches bad character inputs
        c = e.message.match(/Unexpected character at index \d+: (.)/)[1];
        if (c) {
            footer = '';
            if (c === '<')
                footer =
                    "Did you try to tag another discord user? That's definitely not allowed here.";
            return message.channel.send(
                new Discord.MessageEmbed()
                    .setTitle(`Unexpected character "${c}"`)
                    .setDescription(
                        `"${c}" is not a valid character in the \`q!calc\` expression. Type \`q!calc\` for help.`
                    )
                    .setColor(colours['red'])
                    .setFooter(footer)
            );
        } else throw e;
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
                    var b = +stack.pop();
                    var a = +stack.pop();
                    stack.push(operator[c](a, b));
                    break;
                default:
                    // Convert symbolic terms to bloons-ingame-monetary values
                    stack.push(parseAndValueToken(c, i));
            }
        });
    } catch (e) {
        if (e instanceof UnrecognizedTokenError) {
            // Catches non-sensical tokens
            return message.channel.send(
                new Discord.MessageEmbed()
                    .setTitle(e.message)
                    .setColor(colours['red'])
                    .setFooter(
                        'due to manipulation, your full input will not be shown'
                    )
            );
        } else throw e;
    }

    // The single item left in the stack is the evaluated result
    var output = stack.pop();

    if (isNaN(output)) {
        return message.channel.send(
            new Discord.MessageEmbed()
                .setTitle(
                    'Error processing expression. Did you add an extra operator?'
                )
                .setDescription(`\`${expression}\``)
                .setColor(colours['red'])
                .setFooter('Enter `q!calc` for help')
        );
    } else if (stack.length > 0) {
        return message.channel.send(
            new Discord.MessageEmbed()
                .setTitle(
                    'Error processing expression. Did you leave out an operator?'
                )
                .setDescription(`\`${expression}\``)
                .setColor(colours['red'])
                .setFooter('Enter `q!calc` for help')
        );
    } else {
        // G2g!
        return message.channel.send(
            new Discord.MessageEmbed()
                .setTitle(
                    gHelper.numberAsCost(
                        Number.isInteger(output) ? output : output.toFixed(1)
                    )
                ) // At MOST 1 decimal place
                .setDescription(`\`${expression}\``)
                .setColor(colours['cyber'])
        );
    }
}

// wiz!300 or wiz#300 e.g.
function isTowerUpgradeCrosspath(t) {
    if (!/[a-z]+[#!]\d{3}/.test(t)) return false;

    let [tower, upgrades] = t.split(/[!#]/);

    return (
        Towers.allTowers().includes(Aliases.getCanonicalForm(tower)) &&
        Towers.isValidUpgradeSet(upgrades)
    );
}

function costOfTowerUpgradeCrosspath(t) {
    // Checking for tower aliases of the form wlp, gz, etc.
    if (!['!', '#'].some((sep) => t.includes(sep))) {
        // Alias tokens like wlp as wiz!050
        t = Aliases.getCanonicalForm(t).replace('#', '!');
    }

    let [tower, upgrades] = t.split(/[!#]/);

    jsonTowerName = Aliases.getCanonicalForm(tower).replace(/_/, '-');
    if (jsonTowerName === 'druid-monkey') jsonTowerName = 'druid';
    if (jsonTowerName === 'engineer') jsonTowerName = 'engineer-monkey';

    let hardCost = null;
    if (t.includes('#') || upgrades == '000') {
        // Total cost
        hardCost = Towers.totalTowerUpgradeCrosspathCostNewHard(
            costs,
            jsonTowerName,
            upgrades
        );
    } else if (t.includes('!')) {
        // Individual upgrade cost
        let [path, tier] = Towers.pathTierFromUpgradeSet(upgrades);
        const mediumCost = costs[jsonTowerName].upgrades[`${path}`][tier - 1];
        hardCost = hard(mediumCost);
    } else {
        throw 'No # or ! found in tower cost calc';
    }
    return hardCost;
}

function hard(cost) {
    return Math.round((cost * 1.08) / 5) * 5;
}

// TODO: Use hero json
function costOfHero(hero) {
    switch (Aliases.getCanonicalForm(hero)) {
        case 'adora':
            return 1080;
        case 'benjamin':
            return 1295;
        case 'brickell':
            return 810;
        case 'churchill':
            return 2160;
        case 'etienne':
            return 920;
        case 'ezili':
            return 650;
        case 'gwen':
            return 970;
        case 'jones':
            return 810;
        case 'obyn':
            return 700;
        case 'pat':
            return 865;
        case 'quincy':
            return 585;
        case 'sauda':
            return 650;
    }
}

// Decipher what type of operand it is, and convert to cost accordingly
function parseAndValueToken(t, i) {
    if (!isNaN(t)) return Number(t);
    else if (
        (round = CommandParser.parse([t], new RoundParser('IMPOPPABLE')).round)
    ) {
        return chimps[round].cumulativeCash - chimps[5].cumulativeCash + 650;
    } else if (isTowerUpgradeCrosspath(t)) {
        // Catches tower upgrades with crosspaths like wiz#401
        return costOfTowerUpgradeCrosspath(t);
    } else if (Towers.isTowerUpgrade(Aliases.getCanonicalForm(t))) {
        // Catches all other tower ugprades
        return costOfTowerUpgradeCrosspath(t);
    } else if (Towers.isTower(Aliases.getCanonicalForm(t))) {
        // Catches base tower names/aliases
        return costOfTowerUpgradeCrosspath(`${t}#000`);
    } else if (Aliases.isHero(Aliases.getCanonicalForm(t))) {
        return costOfHero(t);
    } else {
        s = '';
        if (t.length == 1) {
            s = t;
        } else if (t.length == 2) {
            s = t.charAt(0) + t.charAt(1);
        } else {
            s = t.charAt(0) + t.charAt(1) + '...';
        }
        throw new UnrecognizedTokenError(
            `at input ${i}: Unrecognized token "${s}" of length ${t.length}`
        );
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
        .addField(
            '`wiz!420`, `super!100`, `dart` (same as `dart!000`), `wlp` (same as `wiz!050`)',
            'INDIVIDUAL COST of tower!upgradeSet'
        )
        .addField('`wiz#420`, `super#000`', 'TOTAL COST of tower#upgradeSet')
        .addField(
            '`adora`, `brick`',
            'Base cost of hero (no leveling cost calculations included)'
        )
        .addField('Operators', '`+`, `-`, `*`, `/`, `%` (remainder)')
        .addField(
            'Examples',
            '`q!calc r99 - wiz#025 - super#052` (2tc test)\n' +
                '`q!calc ninja#502 + ninja#030 * 20 * 0.85` (GMN + single-discounted shinobi army)\n' +
                '`q!calc vil#002 + (vill#302 + vill#020)*0.85 + vill!400` (camo-mentoring double discount village setup)'
        )
        .addField(
            'Notes',
            ' • For ambiguous tokens like `wiz!220` and `super!101`, the upgrade is assumed to be the leftmost non-zero digit.\n' +
                ' • `q!calc` uses topper prices, which are still stuck on v21. Fix coming at some point.'
        )
        .setColor(colours['black']);

    return message.channel.send(helpEmbed);
}

module.exports = {
    name: 'calculator',
    aliases: ['calc', 'cash-calc', 'cc'],
    rawArgs: true,
    execute(message, args) {
        calc(message, args);
    },
    helpMessage,
};
