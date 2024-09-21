const { SlashCommandBuilder } = require('discord.js');
const topperRounds = require('../jsons/round_sets/rounds_topper.json');
const { cyber } = require('../jsons/colors.json');

const GLUE_TRAP_PIERCE = 300;
const GLUE_TRAP_MOAB_PIERCE = 10;
const GLUE_TRAP_BFB_PIERCE = 20;
const GLUE_TRAP_DDT_PIERCE = 20;
const GLUE_TRAP_ZOMG_PIERCE = 50;

builder = new SlashCommandBuilder()
    .setName('gluetrap')
    .setDescription('Find out how long a glue trap lasts when placed on certain rounds')
    .addIntegerOption((option) => option.setName('start_round').setDescription('Round the glue trap(s) are placed').setRequired(true))
    .addIntegerOption((option) => option.setName('end_round').setDescription('Round the glue trap(s) should expire (Overrides start_round)').setRequired(false))
    .addIntegerOption((option) => option.setName('glue_traps').setDescription('Number of glue traps').setRequired(false))
    .addStringOption((option) =>
        option
            .setName('game_mode')
            .setDescription('REGULAR/ABR/REVERSE')
            .setRequired(false)
            .addChoices(
                { name: 'REGULAR', value: 'regular' },
                { name: 'ABR', value: 'abr' },
                { name: 'REVERSE', value: 'reverse' }
            )
    )
    .addBooleanOption((option) => option.setName('mk').setDescription('Max MK enabled').setRequired(false));

function validateInput(interaction) {
    let startRound = interaction.options.getInteger('start_round');
    let endRound = interaction.options.getInteger('end_round');
    let glueTraps = interaction.options.getInteger('glue_traps') || 1;

    // Validations
    if (!endRound) {
        if (startRound < 1) return `Must enter positive number for start_round (${startRound})`;
        if (startRound > 140) return `R${startRound} is random (not predetermined); therefore the calculation won't be consistent`;
    } else {
        if (endRound < 1) return `Must enter positive number for end_round (${endRound})`;
        if (endRound > 140) return `R${endRound} is random (not predetermined); therefore the calculation won't be consistent`;
    }

    if (glueTraps < 1) return `Must enter positive number for glue_traps (${glueTraps})`;

    return;
}

async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    let startRound = interaction.options.getInteger('start_round');
    let endRound = interaction.options.getInteger('end_round');
    if (endRound) startRound = null;
    let glueTraps = interaction.options.getInteger('glue_traps') || 1;
    let gameMode = interaction.options.getString('game_mode') || 'regular';
    let mk = interaction.options.getBoolean('mk') || false;

    let embed = calculate(startRound, endRound, glueTraps, gameMode, mk);

    await interaction.reply({ embeds: [embed] });
}

function getBloonPiercePenalty(bloon, mk) {
    let penalty = 0;
    if (bloon.includes('moab')) penalty = GLUE_TRAP_MOAB_PIERCE * mk;
    else if (bloon.includes('bfb')) penalty = GLUE_TRAP_BFB_PIERCE * mk;
    else if (bloon.includes('ddt')) penalty = GLUE_TRAP_DDT_PIERCE * mk;
    else if (bloon.includes('zomg')) penalty = GLUE_TRAP_ZOMG_PIERCE * mk;
    else if (!bloon.includes('bad')) penalty = 1;
    return penalty;
}

function getTotalGluePierceUsed(roundSets, mk) {
    let result = 0;
    for (let roundSet of roundSets) {
        result += getBloonPiercePenalty(roundSet[0], mk) * roundSet[1];
    }
    return result;
}

function getBloonSpawns(roundSets) {
    let bloons = {};
    for (let roundSet of roundSets) {
        let bloon = roundSet[0];
        let count = roundSet[1];
        if (count === 1) {
            let time = (roundSet[2] + roundSet[3]) / 2;
            if (time in bloons) bloons[time].push(bloon);
            else bloons[time] = [bloon];
        } else {
            for (let i = 0; i < count; i++) {
                let time = roundSet[2] + (roundSet[3] - roundSet[2]) * i / (count - 1);
                if (time in bloons) bloons[time].push(bloon);
                else bloons[time] = [bloon];
            }
        }
    }
    return bloons;
}

function getOrdinalSuffix(number) {
    let ordinalSuffix;
    if (number % 10 === 1 && number % 100 !== 11) ordinalSuffix = 'st';
    else if (number % 10 === 2 && number % 100 !== 12) ordinalSuffix = 'nd';
    else if (number % 10 === 3 && number % 100 !== 13) ordinalSuffix = 'rd';
    else ordinalSuffix = 'th';
    return ordinalSuffix;
}

function getBloonFormattedName(bloon) {
    let bloonPrefix = bloon.includes('-') ? bloon.split('-')[0] : '';
    let bloonSuffix = bloon.includes('-') ? bloon.split('-')[1] : bloon;
    let name = '';

    if (bloonPrefix.includes('f')) name = 'fortified ';
    if (bloonPrefix.includes('c') && !bloonSuffix.includes('ddt')) name += 'camo ';
    if (bloonPrefix.includes('r')) name += 'regrow ';
    if (bloonSuffix.match(/moab|bfb|zomg|ddt|bad/i)) name += bloonSuffix.toUpperCase();
    else name += bloonSuffix;
    return name;
}

function calculate(startRound, endRound, glueTraps, gameMode, mk) {
    let rounds;
    let pierce = GLUE_TRAP_PIERCE * glueTraps;
    switch (gameMode) {
        case 'regular':
            rounds = topperRounds['reg'];
            break;
        case 'abr':
            rounds = topperRounds['abr'];
            break;
        case 'reverse':
            rounds = topperRounds['rev'];
            break;
    }

    if (startRound) {
        let round = startRound;
        let roundSets = rounds[round.toString()];
        let bloons = getTotalGluePierceUsed(roundSets, mk);

        while (pierce >= bloons) {
            pierce -= bloons;
            round++;
            if (round > 140) {
                let embed = new Discord.EmbedBuilder()
                    .setTitle(`If you place ${glueTraps} glue trap${glueTraps > 1 ? 's' : ''}` +
                        ` at the start of round ${startRound}, it should last until random freeplay (141+)`)
                    .setColor(cyber);
                return embed;
            }
            roundSets = rounds[round.toString()];
            bloons = getTotalGluePierceUsed(roundSets, mk);
        }

        if (pierce <= 0) {
            let embed = new Discord.EmbedBuilder()
                .setTitle(`If you place ${glueTraps} glue trap${glueTraps > 1 ? 's' : ''}` +
                    ` at the start of round ${startRound}, it should last until the end of round ${round - 1}`)
                .setColor(cyber);
            return embed;
        }

        let bloonSpawns = getBloonSpawns(roundSets);
        let times = Object.keys(bloonSpawns).sort((a, b) => a - b);
        let bloonTypes = {};

        for (let time of times) {
            let bloons = bloonSpawns[time];
            for (let bloon of bloons) {
                if (bloon in bloonTypes) bloonTypes[bloon]++;
                else bloonTypes[bloon] = 1;

                pierce -= getBloonPiercePenalty(bloon, mk);
                if (pierce <= 0) {
                    let count = bloonTypes[bloon];
                    let ordinalSuffix = getOrdinalSuffix(count);
                    bloon = getBloonFormattedName(bloon);

                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`If you place ${glueTraps} glue trap${glueTraps > 1 ? 's' : ''}` +
                            ` at the start of round ${startRound}, it should last until the ${count}${ordinalSuffix} ${bloon} of round ${round}`)
                        .setColor(cyber);
                    return embed;
                }
            }
        }
    } else {
        let round = endRound;
        let roundSets = rounds[round.toString()];
        let bloons = getTotalGluePierceUsed(roundSets, mk);

        while (pierce >= bloons) {
            pierce -= bloons;
            round--;
            if (round < 1) {
                let embed = new Discord.EmbedBuilder()
                    .setTitle(`If you place ${glueTraps} glue trap${glueTraps > 1 ? 's' : ''}` +
                        ` at the start of round 1, it should last until the end of round ${endRound}`)
                    .setColor(cyber);
                return embed;
            }
            roundSets = rounds[round.toString()];
            bloons = getTotalGluePierceUsed(roundSets, mk);
        }

        if (pierce <= 0) {
            let embed = new Discord.EmbedBuilder()
                .setTitle(`If you place ${glueTraps} glue trap${glueTraps > 1 ? 's' : ''}` +
                    ` at the start of round ${round + 1}, it should last until the end of round ${endRound}`)
                .setColor(cyber);
            return embed;
        }

        let bloonSpawns = getBloonSpawns(roundSets);
        let times = Object.keys(bloonSpawns).sort((a, b) => b - a);
        let bloonTypes = {};
        let backCount, focusBloon;

        for (let [ind, time] of times.entries()) {
            let bloons = bloonSpawns[time];
            for (let bloon of bloons) {
                if (bloon in bloonTypes) bloonTypes[bloon]++;
                else bloonTypes[bloon] = 1;

                pierce -= getBloonPiercePenalty(bloon, mk);
                if (pierce <= 0) {
                    focusBloon = bloonSpawns[times[ind + 1]][0];
                    backCount = bloonTypes[focusBloon] || 0;
                    pierce = Infinity;
                }
            }
        }

        let count = bloonTypes[focusBloon] - backCount;
        let ordinalSuffix = getOrdinalSuffix(count);
        focusBloon = getBloonFormattedName(focusBloon);

        let embed = new Discord.EmbedBuilder()
            .setTitle(`If you place ${glueTraps} glue trap${glueTraps > 1 ? 's' : ''}` +
                ` after the ${count}${ordinalSuffix} ${focusBloon} of round ${round}, it should last until the end of round ${endRound}`)
            .setColor(cyber);
        return embed;
    }
}

module.exports = {
    data: builder,
    execute
};
