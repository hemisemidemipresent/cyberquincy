const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');

// https://github.com/aaditmshah/lexer
const Lexer = require('lex');
const gHelper = require('../helpers/general.js');
const bHelper = require('../helpers/bloons-general');
const mkDiscounts = require('../jsons/mk/discounts.json');

const { LexicalParser, LexicalParseError } = require('../helpers/calculator/lexical_parser');
const chimps = require('../jsons/round2.json');
const RoundParser = require('../parser/round-parser');

const { red, cyber, black } = require('../jsons/colors.json');

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

const mk = new SlashCommandStringOption()
    .setName('mk')
    .setDescription('Max MK enabled')
    .setRequired(false)
    .addChoices({ name: 'yes', value: 'Yes' });

builder = new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Evaluate an expression to get a final cost')
    .addStringOption(exprOption)
    .addStringOption(difficulty)
    .addStringOption(mk);

async function calc(interaction) {
    // Use a "lexer" to parse the operator/operand tokens
    let lexer = new Lexer();

    lexer.addRule(/\s+/, function () {
        // skip whitespace
    });

    lexer.addRule(/[a-zA-Z#!0-9._]+/, function (lexeme) {
        return lexeme; // symbols
    });

    lexer.addRule(/[(+\-*/%^)'"]/, function (lexeme) {
        return lexeme; // punctuation and operators
    });

    // Set up operators and operator precedence to interpret the parsed tree
    let power = {
        precedence: 3
    };

    let factor = {
        precedence: 2
    };

    let term = {
        precedence: 1
    };

    let parser = new LexicalParser({
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
        let tokens = [],
            token;
        while ((token = lexer.lex())) tokens.push(token);
        return parser.parse(tokens);
    }

    // Get the original command arguments string back (other than the command name)
    const expression = interaction.options.getString('expr').replace(/"/, "''").toLowerCase();
    const difficulty = interaction.options.getString('difficulty') || 'hard';
    const mk = !!interaction.options.getString('mk');

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
                {
                    name: 'Operators',
                    value: "`+`, `-`, `*`, `/`, `%` (remainder), `^` (raise to power), `'` (discount operator)"
                },
                {
                    name: 'Examples',
                    value: `\`/calc expr:r99 - wiz#025 - super#052\` (2tc test)
                            \`/calc expr:ninja#502 + ninja#030' * 20\` (GMN + single-discounted shinobi army)
                            \`/calc expr:vil#002 + (vill#302 + vill#020)' + vill!400\` (camo-mentoring double discount village setup)`
                },
                {
                    name: 'Notes',
                    value: ` • For ambiguous tokens like \`wiz!220\` and \`super!101\` (there is no path/crosspath), the upgrade is assumed to be the leftmost non-zero digit
                             • You can use this calculator for non-cash-related calculations as well. Just ignore the dollar sign in the result.`
                }
            ])
            .setColor(black);
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
                        .setDescription(
                            `"\`${c}\`" is not a valid character in the \`/calc\` expression.\nUse \`/calc expr: help\` to see the help page`
                        )
                        .setColor(red)
                        .setFooter(footer ? { text: footer } : null)
                ],
                components: []
            });
        } else if (e instanceof LexicalParseError) {
            return await interaction.reply({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(e.message)
                        .setDescription(`\`${expression}\`\nUse \`/calc expr: help\` to see the help page`)
                        .setColor(red)
                ]
            });
        } else throw e;
    }

    let stack = [];

    // Evaluate the interpreted expression
    let operator = {
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
        let simpleMkDiscounts = {
            comeOnEverybody: 0,
            discounts: []
        };
        if (mk) {
            simpleMkDiscounts.comeOnEverybody = mkDiscounts.misc_discounts.come_on_everybody;
            simpleMkDiscounts.discounts = JSON.parse(JSON.stringify(mkDiscounts.tower_discounts));
        }


        parsed.forEach(function (c) {
            i++;
            switch (c) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                case '^':
                    let b = +stack.pop();
                    let a = +stack.pop();
                    stack.push(operator[c](a, b));
                    break;
                default:
                    // Convert symbolic terms to bloons-ingame-monetary values
                    stack.push(parseAndValueToken(c, i, difficulty, simpleMkDiscounts));
            }
        });
    } catch (e) {
        if (e instanceof UnrecognizedTokenError) {
            // Catches nonsensical tokens
            return await interaction.reply({
                embeds: [new Discord.EmbedBuilder().setTitle(e.message).setColor(red)]
            });
        } else if (e instanceof bHelper.DiscountError) {
            return await interaction.reply({
                embeds: [new Discord.EmbedBuilder().setTitle(e.message).setColor(red)]
            });
        } else {
            throw e;
        }
    }

    // The single item left in the stack is the evaluated result
    let output = stack.pop();

    if (isNaN(output)) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Error processing expression. Did you add an extra operator?')
                    .setDescription(`\`${expression}\`\nUse \`/calc expr: help\` to see the help page`)
                    .setColor(red)
            ]
        });
    } else if (stack.length > 0) {
        return await interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setTitle('Error processing expression. Did you leave out an operator?')
                    .setDescription(`\`${expression}\`\nUse \`/calc expr: help\` to see the help page`)
                    .setColor(red)
            ]
        });
    } else {
        // G2g!
        const embed = new Discord.EmbedBuilder()
            .setTitle(gHelper.numberAsCost(Number.isInteger(output) ? output : output.toFixed(1))) // At MOST 1 decimal place
            .setDescription(`\`${expression}\``)
            .setColor(cyber);
        if (mk) embed.setFooter({ text: 'Max Monkey Knowledge is enabled (including "free" towers)' });
        return await interaction.reply({
            embeds: [embed]
        });
    }
}

// Decipher what type of operand it is, and convert to cost accordingly
function parseAndValueToken(t, i, difficulty, simpleMkDiscounts) {
    const undiscountedToken = t.replace(/'*$/, '');
    const numDiscounts = t.match(/'*$/)?.[0]?.length;
    const tokenCanonical = Aliases.canonicizeArg(undiscountedToken);

    if (!isNaN(undiscountedToken)) return Number(undiscountedToken);
    else if ((round = CommandParser.parse([undiscountedToken], new RoundParser('PREDET_CHIMPS')).round)) {
        return chimps[round].cumulativeCash - chimps[5].cumulativeCash + 650;
    } else if (Heroes.isGerrysShopItem(tokenCanonical)) {
        return Heroes.costOfGerryShopItem(tokenCanonical, difficulty);
    } else if (Towers.isTowerUpgrade(undiscountedToken, true)) {
        // Catches tower upgrades with crosspaths like wiz#401
        let [tower, upgradeSet] = tokenCanonical.split('#');
        return Towers.costOfTowerUpgradeSet(tower, upgradeSet, difficulty, numDiscounts, simpleMkDiscounts);
    } else if (Towers.isTowerUpgrade(undiscountedToken.replace('!', '#'), true)) {
        // Catches all other tower ugprades
        let [tower, upgradeSet] = Aliases.canonicizeArg(undiscountedToken.replace('!', '#')).split('#');
        let tmp = simpleMkDiscounts.comeOnEverybody;
        simpleMkDiscounts.comeOnEverybody = 0;
        let ret = Towers.costOfTowerUpgrade(tower, upgradeSet, difficulty, numDiscounts, simpleMkDiscounts);
        simpleMkDiscounts.comeOnEverybody = tmp;
        return ret;
    } else if (Towers.isTowerUpgrade(tokenCanonical, true)) {
        // for upgrade names like "sotf" the tokenCanonical contains the upgrade format "druid#050"
        let [tower, upgrade] = tokenCanonical.split('#');
        let tmp = simpleMkDiscounts.comeOnEverybody;
        simpleMkDiscounts.comeOnEverybody = 0;
        let ret = Towers.costOfTowerUpgrade(tower, upgrade, difficulty, numDiscounts, simpleMkDiscounts);
        simpleMkDiscounts.comeOnEverybody = tmp;
        return ret;
    } else if (Towers.isTower(tokenCanonical)) {
        // Catches base tower names/aliases
        simpleMkDiscounts.comeOnEverybody = 0;
        return Towers.costOfTowerUpgrade(tokenCanonical, '000', difficulty, numDiscounts, simpleMkDiscounts);
    } else if (Heroes.isHero(tokenCanonical)) {
        return Heroes.costOfHero(tokenCanonical, difficulty, numDiscounts, !!simpleMkDiscounts.comeOnEverybody);
    } else {
        throw new UnrecognizedTokenError(`at input ${i}: Unrecognized token "${t}"`);
    }
}

class UnrecognizedTokenError extends Error { }

async function execute(interaction) {
    await calc(interaction);
}

module.exports = {
    data: builder,
    execute
};
