const { SlashCommandBuilder } = require('@discordjs/builders');

const FBG = require('../jsons/freeplay.json');
const json = require('../jsons/rounds_topper.json');
const roundContents = require('../jsons/round_contents.json');
const rounds2 = require('../jsons/round2.json');
const cashAbr = require('../jsons/income-abr.json');

const roundHelper = require('../helpers/rounds');
const enemyHelper = require('../helpers/enemies');
const gHelper = require('../helpers/general');

const { cyber } = require('../jsons/colours.json');

builder = new SlashCommandBuilder()
    .setName('round')
    .setDescription('Gets information for a round')
    .addIntegerOption((option) =>
        option.setName('round').setDescription('The round you want information for').setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('game_mode')
            .setDescription('the game mode')
            .setRequired(false)
            .addChoices({ name: 'normal', value: 'chimps' }, { name: 'Alternate Bloon Rounds (ABR)', value: 'abr' })
    );

function validateInput(interaction) {
    const round = interaction.options.getInteger('round');

    // Validations
    if (round < 1) return `Must enter positive numbers for round ${round}`;
    if (round > roundHelper.ALL_ROUNDS)
        return `Rounds are meaningless past ${roundHelper.ALL_ROUNDS[1]} since no bloons spawn`;
    return;
}

function freeplay(round, isAbr) {
    [xp, totalxp] = calculateXps(round);

    let hRamping = enemyHelper.getHealthRamping(round);
    let sRamping = enemyHelper.getSpeedRamping(round);
    let bloonSets = getBloonSets(round);
    const roundEmbed = new Discord.EmbedBuilder()
        .setTitle(`R${round}` + (isAbr ? ' ABR' : ''))
        .setDescription(`all **POSSIBLE** bloon sets\n${bloonSets.join('\n')}`)

        .addFields([
            { name: 'ramping', value: `health: ${hRamping}x\nspeed: ${Math.round(sRamping * 100) / 100}` },
            {
                name: `XP Earned on R${round}`,
                value: `${gHelper.numberWithCommas(xp * 0.1)} (note this takes into the account freeplay xp reduction)`,
                inline: true
            },
            {
                name: 'Total XP if You Started on R1',
                value: `${gHelper.numberWithCommas(totalxp * 0.1)} (note this takes into the account freeplay xp reduction)`,
                inline: true
            },
            {
                name: '**Note:**',
                value: ' • Map difficulty xp multipliers are {beginner: 1, intermediate 1.1, advanced 1.2, expert 1.3}'
            }
        ])
        .setColor(cyber);
    return roundEmbed;
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

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });
    }

    const round = interaction.options.getInteger('round');
    game_mode = interaction.options.getString('game_mode');

    let isAbr = game_mode == 'abr';

    if (round > 140 || (isAbr && round > 100)) {
        let ramp = freeplay(round, isAbr);
        return await interaction.reply({ embeds: [ramp] });
    }

    [xp, totalxp] = calculateXps(round);
    let roundInfo = isAbr ? json.alt : json.reg;
    let roundLength = getLength(round, roundInfo);
    let roundContent = roundContents[`${isAbr ? 'a' : ''}r${round}`].split(',').join('\n');
    let roundRBE = isAbr ? cashAbr[round].rbe : rounds2[round].rbe;
    let roundCash = rounds2[round].cashThisRound;
    if (isAbr) {
        if (round > 2) {
            roundCash = cashAbr[round].cashThisRound;
        } else {
            roundCash = 'ABR cash data not available for R1/R2';
        }
    }
    const roundEmbed = new Discord.EmbedBuilder()
        .setTitle(`R${round}` + (isAbr ? ' ABR' : ''))
        .setDescription(`${roundContent}`)
        .addFields([
            { name: 'Round Length (seconds)', value: roundLength.toString(), inline: true },
            { name: 'RBE', value: `${gHelper.numberWithCommas(roundRBE)}`, inline: true },
            { name: `XP Earned on R${round}`, value: `${gHelper.numberWithCommas(xp)}`, inline: true },
            { name: `Cash Earned from R${round}`, value: `${gHelper.numberAsCost(roundCash)}`, inline: true },
            { name: 'Total XP if You Started on R1', value: `${gHelper.numberWithCommas(totalxp)}` },
            {
                name: '**Note:**',
                value:
                    ' • If you are in freeplay (e.g. round 41 on easy mode), the xp value is 0.3 of what is displayed\n' +
                    ' • Map difficulty xp multipliers are {beginner: 1, intermediate 1.1, advanced 1.2, expert 1.3}'
            }
        ])
        .setFooter({ text: `For more data on round incomes use \`q!income${isAbr ? ' abr' : ''} <round>\`` })
        .setColor(colours['cyber']);
    if (round > 80) {
        let hRamping = enemyHelper.getHealthRamping(round);
        let sRamping = enemyHelper.getSpeedRamping(round);
        roundEmbed.addFields([{ name: 'ramping', value: `health: ${hRamping}x\nspeed: ${sRamping}x` }]);
    }
    return await interaction.reply({ embeds: [roundEmbed] });
}

module.exports = {
    data: builder,
    execute
};
