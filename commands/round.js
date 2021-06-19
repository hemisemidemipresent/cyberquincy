const rounds2 = require('../jsons/round2.json');
const cashAbr = require('../jsons/abrincome.json');
const colours = require('../jsons/colours.json');
const rounds = require('../jsons/rounds.json');
const RoundParser = require('../parser/round-parser');
const OptionalParser = require('../parser/optional-parser');
const ModeParser = require('../parser/mode-parser');
const AnyOrderParser = require('../parser/any-order-parser');
const json = require('../jsons/rounds_topper.json');
const gHelper = require('../helpers/general.js');
const FBG = require('../jsons/freeplay.json');

function execute(message, args, originalCommandName) {
    if (args.length == 0 || args[0] == 'help')
        return module.exports.helpMessage(message);

    let parsed;
    if (originalCommandName.includes('abr')) {
        parsed = CommandParser.parse(args, new RoundParser('ALL'));
        parsed.addField('mode', 'abr');
    } else {
        parsed = CommandParser.parse(
            args,
            new AnyOrderParser(
                new RoundParser('ALL'),
                new OptionalParser(
                    new ModeParser('CHIMPS', 'ABR'),
                    'CHIMPS' // default if not provided
                )
            )
        );
    }
    if (parsed.hasErrors()) {
        return module.exports.errorMessage(message, parsed.parsingErrors);
    }

    isAbr = parsed.mode == 'abr';
    // freeplay has its own serperate shit going on
    if (parsed.round > 140 || (isAbr && parsed.round > 100)) {
        let ramp = freeplay(parsed.round);
        return message.channel.send(ramp);
    }
    [xp, totalxp] = calculateXps(parsed.round);
    let roundInfo = isAbr ? json.alt : json.reg;
    let roundLength = getLength(parsed.round, roundInfo);
    let roundContents = rounds[`${isAbr ? 'a' : ''}r${parsed.round}`]
        .split(',')
        .join('\n');
    let roundRBE = isAbr ? 'Not available in ABR' : rounds2[parsed.round].rbe;
    let roundCash = null;
    if (isAbr) {
        if (parsed.round > 2) {
            roundCash = cashAbr[parsed.round - 2][0];
        } else {
            roundCash = 'ABR cash data not available for R1/R2';
        }
    } else {
        roundCash = rounds2[parsed.round].cashThisRound;
    }
    const roundEmbed = new Discord.MessageEmbed()
        .setTitle(`R${parsed.round}` + (parsed.mode == 'abr' ? ' ABR' : ''))
        .setDescription(`${roundContents}`)
        .addField('Round Length (seconds)', roundLength, true)
        .addField('RBE', `${gHelper.numberWithCommas(roundRBE)}`, true)
        .addField(
            `XP Earned on R${parsed.round}`,
            `${gHelper.numberWithCommas(xp)}`,
            true
        )
        .addField(
            `Cash Earned from R${parsed.round}`,
            `${gHelper.numberAsCost(roundCash)}`,
            true
        )
        .addField(
            'Total XP if You Started on R1',
            `${gHelper.numberWithCommas(totalxp)}`
        )
        .addField(
            '**Note:**',
            ' • If you are in freeplay (e.g. round 41 on easy mode), the xp value is 0.1 of what is displayed\n' +
                ' • Map difficulty xp multipliers are {beginner: 1, intermediate 1.1, advanced 1.2, expert 1.3}'
        )
        .setFooter(
            `For more data on round incomes use \`q!income${
                isAbr ? ' abr' : ''
            } <round>\``
        )
        .setColor(colours['cyber']);
    message.channel.send(roundEmbed);
}

function calculateXps(round) {
    let xp = 0;
    let totalxp = 0;
    if (round < 21) {
        xp = 20 * round + 20;
        totalxp = 40 + 50 * (round - 1) + 10 * Math.pow(round - 1, 2);
    } else if (round > 20 && round < 51) {
        xp = 40 * (round - 20) + 420;
        totalxp = 4600 + 440 * (round - 20) + 20 * Math.pow(round - 20, 2);
    } else {
        xp = (round - 50) * 90 + 1620;
        totalxp = 35800 + 1665 * (round - 50) + 45 * Math.pow(round - 50, 2);
    }
    return [xp, totalxp];
}

function getLength(round, roundInfo) {
    let roundArray = roundInfo[round];
    let longest = 0;
    let end = 0;
    for (i = 0; i < roundArray.length; i++) {
        end = parseInt(roundArray[i][3]);
        if (end > longest) {
            longest = end;
        }
    }
    longest /= 60; //btd6 is 60fps game
    return Math.round(longest * 100) / 100;
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!round` HELP')
        .addField('`q!round <R>`', 'Learn about round R')
        .addField('`q!round <R> abr`', 'Learn about round R in ABR mode')
        .setColor(colours['black']);

    return message.channel.send(helpEmbed);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField('Likely Cause(s)', parsingErrors.join('\n'))
        .setColor(colours['red']);
    return message.channel.send(errorEmbed);
}
function freeplay(round) {
    [xp, totalxp] = calculateXps(parsed.round);

    let ramping = getRamping(round);
    let bloonSets = getBloonSets(round);
    const roundEmbed = new Discord.MessageEmbed()
        .setTitle(`R${parsed.round}` + (parsed.mode == 'abr' ? ' ABR' : ''))
        .addField('health and speed ramping', `+${ramping}%`)
        .setDescription(`all **POSSIBLE** bloon sets\n${bloonSets.join('\n')}`)
        .addField(
            `XP Earned on R${parsed.round}`,
            `${gHelper.numberWithCommas(
                xp * 0.1
            )} (note this takes into the account freeplay xp reduction)`,
            true
        )
        .addField(
            'Total XP if You Started on R1',
            `${gHelper.numberWithCommas(
                totalxp * 0.1
            )} (note this takes into the account freeplay xp reduction)`,
            true
        )
        .addField(
            '**Note:**',

            ' • Map difficulty xp multipliers are {beginner: 1, intermediate 1.1, advanced 1.2, expert 1.3}'
        )

        .setColor(colours['cyber']);
    return roundEmbed;
}
function getRamping(round) {
    let ramp = 40;
    if (round < 125) return (ramp += (round - 100) * 5);
    ramp += 120;
    if (round < 152) return (ramp += (round - 124) * 20);
    ramp += 540;
    return (ramp += (round - 151) * 50);
}
function getBloonSets(round) {
    let bloonSets = [];
    for (let i = 0; i < FBG.length; i++) {
        let bloonGroup = FBG[i];

        for (let i = 0; i < bloonGroup.bounds.length; i++) {
            let bounds = bloonGroup.bounds[i];
            if (bounds[0] <= round && bounds[1] >= round) {
                let res = `${bloonGroup.number} ${bloonGroup.bloon}`;
                bloonSets.push(res);
                break;
            }
        }
    }
    return bloonSets;
}

module.exports = {
    name: 'round',
    description: 'tells you about the rounds (below 100)',
    aliases: ['r', 'abr'],
    execute,
    helpMessage,
    errorMessage,
};
