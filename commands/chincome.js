// Spreadsheets with round income data
const chimps = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');

// Discord client
const Discord = require('discord.js');

// Discord bot sidebar colors
const colors = require('../jsons/colours.json');

// Aliases should eventually end up in a centralized place for all commands to use
MODE_ALIASES = {
    hc: ['half_cash', 'halfcash', 'hcc'],
    chimps: ['chmp', 'chmps', 'chimp'],
    abr: ['alt', 'alternate'],
};

module.exports = {
    name: 'chincome',

    // Main executable function
    execute(message, args) {
        mode_str = null;
        round_str = null;

        // Can be <round> <mode> OR <mode> <round> OR <round> (mode defaults to standard CHIMPS)

        try {
            if (args[0]) {
                if (is_valid_gamemode(args[0])) {
                    mode_str = args[0];
                } else if (is_valid_chimps_round(args[0])) {
                    round_str = args[0];
                } else if (args[0] === 'help') {
                    return module.exports.helpMessage(message);
                } else {
                    throw `First argument provided "${args[0]}" is neither a valid round nor game mode`;
                }
            } else {
                return module.exports.helpMessage(message);
            }

            if (args[1]) {
                if (!mode_str && is_valid_gamemode(args[1])) {
                    mode_str = args[1];
                } else if (!round_str && is_valid_chimps_round(args[1])) {
                    round_str = args[1];
                } else {
                    throw `Second argument provided "${args[1]}" is neither a valid round nor game mode`;
                }
            } else if (!round_str) {
                // If only one arg is provided, it needs to be the round number
                throw `Round must be specified`;
            } else {
                // Default game mode if not provided
                mode_str = 'chimps';
            }

            if (args[2]) {
                // If more than 2 args are provided, the user might not be using the command correctly
                throw `Extra arguments provided: "${args.slice(2).join()}"`;
            }

            mode = mode_str;
            round = get_valid_chimps_round(round_str);

            return message.channel.send(chincomeMessage(mode_str, round));
        } catch (err) {
            try {
                if (typeof err == 'string') {
                    return module.exports.errorMessage(message, err);
                } else {
                    return module.exports.bugMessage(message, err);
                }
            } catch (err) {
                // Juuuust in case an error comes up that fails to process and report properly
                return message.channel.send(
                    new Discord.MessageEmbed()
                        .setTitle('Error Message errored')
                        .addField(
                            'Report the bug',
                            'Report it at the [support server](https://discord.gg/VMX5hZA)'
                        )
                        .setColor(colors.red)
                );
            }
        }
    },

    helpMessage(message) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('HELP')
            .addField(
                '"q!chincome"',
                'Find cash generated during round <round> and also from start of round 6 through end of round <round>'
            )
            .addField('Ex. #1', 'q!chincome <round> | q!chincome 8')
            .addField('Ex. #2', 'q!chincome <mode> <round> | q!chincome abr R8')
            .addField('Ex. #3', 'q!chincome <round> <mode> | q!chincome r8 hc')
            .setColor(colors['cyber']);

        return message.channel.send(errorEmbed);
    },

    errorMessage(message, error_message) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle('ERROR')
            .addField('Cause', error_message)
            .addField('Type `q!chincome` for help', ':)')
            .setColor(colors['orange']);

        return message.channel.send(errorEmbed);
    },

    bugMessage(message, error_obj) {
        let bugEmbed = new Discord.MessageEmbed()
            .setTitle('BUG')
            .addField(
                "What's this?",
                'This is a programming error, alert the maintainers'
            )
            .addField('Error', error_obj)
            .setColor(colors['red']);

        return message.channel.send(bugEmbed);
    },
};

chincomeMessage = function (mode_alias, round) {
    mode = get_gamemode(mode_alias);

    incomes = calculateIncomes(mode, round);

    var mode_str_iden = (function (mode) {
        switch (mode) {
            case 'hc':
                return 'Half Cash';
            case 'chimps':
                return 'Standard';
            default:
                return mode.toUpperCase();
        }
    })(mode);

    return new Discord.MessageEmbed()
        .setTitle(`${mode_str_iden} CHIMPS Income (R${round})`)
        .addField(
            `Total cash gained through the end of round ${round}`,
            `$${numberWithCommas(incomes.chincome)}`
        )
        .addField(
            `Income gained from just round ${round} itself`,
            `$${numberWithCommas(incomes.rincome)}`
        );
};

// rincome = round income
// chincome = cumulative income (CHIMPS with modifier specified by `mode`)
calculateIncomes = function (mode, round) {
    chincome = null;
    rincome = null;

    if (mode == 'abr') {
        index = round - 2;

        chincome = abr[index][1] - abr[3][1] + 650;
        rincome = abr[index][0];
    } else {
        index = round;

        chincome = chimps[index]['cch'] - chimps[5]['cch'] + 650;
        rincome = chimps[index]['csh'];

        if (mode == 'hc') {
            chincome /= 2;
            rincome /= 2;
        }
    }

    return {
        rincome: rincome,
        chincome: chincome,
    };
};

is_valid_gamemode = function (mode_alias) {
    for (var mode_alias_key in MODE_ALIASES) {
        if (
            mode_alias == mode_alias_key ||
            MODE_ALIASES[mode_alias_key].includes(mode_alias)
        ) {
            return true;
        }
    }
    return false;
};

// There are multiple ways to specify the gamemode
get_gamemode = function (mode_alias) {
    for (var mode_alias_key in MODE_ALIASES) {
        if (
            mode_alias == mode_alias_key ||
            MODE_ALIASES[mode_alias_key].includes(mode_alias)
        ) {
            return mode_alias_key;
        }
    }
    return null;
};

is_valid_chimps_round = function (round) {
    return (
        is_between_6_100(round) ||
        (is_str(round) &&
            round[0] == 'r' &&
            is_between_6_100(parseInt(round.substr(1))))
    );
};

get_valid_chimps_round = function (round) {
    if (is_between_6_100(round)) {
        return round;
    } else {
        return parseInt(round.substr(1));
    }
};

is_between_6_100 = function (x) {
    if (!isNaN(x)) {
        if (x >= 6 && x <= 100) {
            return true;
        } else {
            throw `The round you entered, ${x}, is not between 6-100 inclusive`;
        }
    } else {
        return false;
    }
};

is_str = function (s) {
    return typeof s === 'string' || s instanceof String;
};

numberWithCommas = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
