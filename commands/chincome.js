// Spreadsheets with round income data
const chimps = require('../jsons/round2.json');
const abr = require('../jsons/abrincome.json');

// Discord client
const Discord = require('discord.js');

// Discord bot sidebar colors
const { red, _, _, _ } = require('../jsons/colours.json');


module.exports = {
    name: 'chincome',

    // Main executable function
    execute(message, args) {
        mode = null;
        round = null;

        // Can be <round> <mode> OR <mode> <round> OR <round> (mode defaults to standard CHIMPS)

        if (args[0]) {
            if (module.exports.is_valid_gamemode(args[0])) {
                mode = args[0]
            } else if(module.exports.is_valid_chimps_round(args[0])) {
                round = args[0]
            } else {
                return module.exports.helpMessage(message);
            }
        } else {
            return module.exports.helpMessage(message);
        }

        if (args[1]) {
            if (!mode && module.exports.is_valid_gamemode(args[1])) {
                mode = args[1]
            } else if(!round && module.exports.is_valid_chimps_round(args[1])) {
                round = args[1]
            } else {
                return module.exports.helpMessage(message);
            }
        } else if (!round) { // If only one arg is provided, it needs to be the round number
            return module.exports.helpMessage(message);
        } else {
            mode = "chimps"
        }

        if (args[2]) { // If more than 2 args are provided, the user might not be using the command correctly
            return module.exports.helpMessage(message);
        }

        return message.channel.send(
            module.exports.chincomeMessage(mode, round)
        );
    },

    helpMessage(message) {
        let errorEmbed = new Discord.MessageEmbed()
                .addField(
                    '"q!chincome"',
                    'A special income command, used to find the cash generated from the start of round 6 to the end of round <round>',
                )
                .addField('Usage #1', 'q!chincome <round> | q!chincome 8')
                .addField('Usage #2', 'q!chincome <mode> <round> | q!chincome abr 8')
                .addField('Usage #3', 'q!chincome <round> <mode> | q!chincome 8 abr')
                .setColor(red);

        return message.channel.send(errorEmbed);
    },

    chincomeMessage(mode_alias, round) {
        mode = module.exports.get_gamemode(mode_alias);

        incomes = calculateIncomes(mode, round)

        var mode_str_iden = (function(mode) {
            switch(mode) {
              case 'hc':
                return "Half Cash";
              case 'chimps':
                return "Standard";
              default:
                return mode.toUpperCase();
            }
          })(mode);

        return new Discord.MessageEmbed()
            .setTitle(`${mode_str_iden} CHIMPS Income`)
            .addField(
                `Total income after round ${round}`,
                `$${incomes.chincome}`
            )
            .addField(
                `Income gained from round ${round}`,
                `$${incomes.rincome}`
            )
    },

    // rincome = round income
    // chincome = cumulative income (CHIMPS with modifier specified by `mode`)
    calculateIncomes(mode, round) {
        chincome = null;
        rincome = null;

        if (mode == 'abr') {
            index = round - 2;

            chincome = abr[index][1] - abr[3][1] + 650;
            rincome = abr[index][0];
        } else {
            index = round;

            chincome = chimps[index]["cch"] - chimps[5]["cch"] + 650;
            rincome = chimps[index]["csh"];

            if (mode == 'hc') {
                chincome /= 2;
                rincome /= 2;
            }
        }

        return {
            rincome: rincome,
            chincome: chincome,
        }
    },

    // Aliases should eventually end up in a centralized place for all commands to use
    MODE_ALIASES: {
        "hc": [
            "half_cash",
            "halfcash",
            "hcc",
        ],
        "chimps": [
            "chmp",
            "chmps",
            "chimp",
        ],
        "abr": [
            "alt",
            "alternate",
        ]
    },

    is_valid_gamemode(mode_alias) {
        for (var mode_alias_key in MODE_ALIASES) {
            if (mode_alias == mode_alias_key ||
                MODE_ALIASES[mode_alias_key].includes(mode_alias)) {
                    return true;
            }
        }
        return false;
    },

    // There are multiple ways to specify the gamemode
    get_gamemode(mode_alias) {
        for (var mode_alias_key in MODE_ALIASES) {
            if (mode_alias == mode_alias_key ||
                MODE_ALIASES[mode_alias_key].includes(mode_alias)) {
                    return mode_alias_key;
            }
        }
        return null;
    },

    is_valid_chimps_round(round) {
        return !isNaN(round) && round >= 6 && round <=100
    },
};
