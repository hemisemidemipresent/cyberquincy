const { SlashCommandBuilder } = require('discord.js');
const gHelper = require('../helpers/general');
const { lightgreen } = require('../jsons/colors.json');
const decayMult = [
    1, 1, 1, 1, 1, 1.0514814, 1.1057236, 1.1628803, 1.2231139, 1.2865961, 1.3535084, 1.4240429, 1.4984032, 1.5768039,
    1.6594728, 1.7466506, 1.8385919, 1.9355664, 2.0378594, 2.1457734, 2.2596276, 2.3797607, 2.5065317, 2.6403196, 2.7815268,
    2.930579, 3.087927, 3.2540488, 3.28, 3.31, 3.38, 3.423333333, 3.473333333, 3.523333333, 3.573333333, 3.623333333,
    3.673333333, 3.723333333, 3.773333333, 3.823333333, 3.873333333, 3.923333333, 3.973333333, 4.023333333, 4.073333333,
    4.123333333, 4.173333333, 4.223333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333,
    4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333,
    4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 4.273333333, 0
];
const decay = require('../jsons/decay.json');

builder = new SlashCommandBuilder()
    .setName('decay')
    .setDescription('Calculate score decays')
    .addStringOption((option) => option.setName('score').setDescription('Score of a tile').setRequired(true))
    .addIntegerOption((option) =>
        option.setName('remaining_hours').setDescription('remaining hours left on the tile').setRequired(false)
    );

function validateInput(interaction) {
    score = interaction.options.getString('score');
    remaining_hours = interaction.options.getInteger('remaining_hours');

    if (isNaN(score)) {
        let keys = score.split(':');
        if (keys.length === 1 || keys.length > 3)
            return 'score must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';

        let nans = keys.find((key) => isNaN(key));
        if (nans && nans.length > 0)
            return 'score must be of form `hour:minute:second` e.g. `1:32:15.977` means 1 hour 32 minutes 15.977 seconds';
    }

    if (remaining_hours < 0 || remaining_hours > 72) return 'tiles only last 72 hours vrej';
}
async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure)
        return await interaction.reply({
            content: validationFailure,
            ephemeral: true
        });

    let score = interaction.options.getString('score');
    let remaining_hours = interaction.options.getInteger('remaining_hours') || 72;

    let num_score = !isNaN(score) ? parseFloat(score) : timeToSeconds(score);

    num_score /= decayMult[72 - remaining_hours];

    let table = '```\nhr | score\n';
    let prevScore;
    decay.forEach((obj) => {
        let decayedScore = obj.mult * num_score;
        let formattedDecayedScore = isNaN(score) ? secondsToTime(decayedScore) : Math.round(decayedScore);

        if (formattedDecayedScore !== prevScore) {
            table += `${obj.h < 10 ? '0' + obj.h : obj.h} | ${formattedDecayedScore}\n`;
            prevScore = formattedDecayedScore;
        }
    });
    table += '```';

    const embed = new Discord.EmbedBuilder().setDescription(table).setColor(lightgreen);

    return await interaction.reply({ embeds: [embed] });
}

module.exports = {
    data: builder,
    execute
};

function timeToSeconds(time) {
    // should be hms

    let keys = time
        .split(':')
        .reverse()
        .map((key) => parseFloat(key));
    console.log(keys);
    return keys.reduce((accumulator, value, index) => {
        console.log(accumulator, value, index);
        return accumulator + value * Math.pow(60, index);
    });
}
function secondsToTime(s) {
    let ms = Math.round(s * 1000);
    let milliseconds = ms % 1000;
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 3600)) % 3600);

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 100 ? '0' + milliseconds : milliseconds;

    // does not show minutes or hours if its like 3 seconds
    let string = `${seconds}.${milliseconds}`;
    if (ms * 4.28 > 60000) string = `${minutes}:` + string;
    if (ms * 4.28 > 3600000) string = `${hours}:` + string;
    return string;
}
