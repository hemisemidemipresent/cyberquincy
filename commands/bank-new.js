const { cyber } = require('../jsons/colours.json');
const ReactionChain = require('../helpers/reactor/reaction_chain');
const SingleTextParser = require('../helpers/reactor/single_text_parser');
const LimitedStringSetValuesParser = require('../parser/limited-string-set-values-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
module.exports = {
    name: 'bank2',
    execute(message, args) {
        ReactionChain.process(
            message,
            (message, results) => log(message, results),

            new SingleTextParser(
                new NaturalNumberParser(3, 5),
                'second path upgrade (3/4/5)'
            ),
            new SingleTextParser(
                new LimitedStringSetValuesParser(
                    'true/false',
                    ['true', 'false'],
                    ['true', 'false']
                ),
                'whether you have Flat Pack Buildings monkey knowledge (true/false)'
            ),
            new SingleTextParser(
                new LimitedStringSetValuesParser(
                    'true/false',
                    ['true', 'false'],
                    ['true', 'false']
                ),
                'whether you have Bigger Banks monkey knowledge (true/false)'
            ),
            new SingleTextParser(
                new NaturalNumberParser(0, 20),
                'Benjamin level'
            )
        );
    },
};
function tookTooLong(message) {
    return message.channel.send(`You took too long to answer!`);
}
function isValidHack(hackPercent) {
    if (hackPercent == 0 || hackPercent == 5 || hackPercent == 12) {
        return true;
    }
    return false;
}
function log(message, res) {
    console.log(res);
}
function calculate(
    bankTier,
    flatPackBuilding,
    BiggerBanks,
    hackPercent,
    crosspathNum,
    difficultyId
) {
    let maxCapacity = 0;
    if (bankTier == 3) {
        maxCapacity += 7000;
    } else {
        maxCapacity += 10000;
    }
    if (BiggerBanks == true) {
        maxCapacity += 2500;
    }

    let buildingCost = 0;
    let fpb = [20, 25, 25, 30, 25];
    let costs = [
        [4800, 5650, 6105, 6780, 6105],
        [11175, 12650, 14205, 15780, 14205],
        [96175, 112650, 122205, 135780, 122205],
    ];

    let onexx = [425, 500, 540, 625, 540];
    let twoxx = [510, 1100, 1190, 1345, 1190];
    if (flatPackBuilding) {
        buildingCost -= fpb[difficultyId - 1];
    }

    buildingCost += costs[bankTier - 3][difficultyId - 1];
    if (crosspathNum == 1) {
        buildingCost += onexx[difficultyId - 1];
    } else if (crosspathNum == 2) {
        buildingCost += twoxx[difficultyId - 1];
    }
    //time to actually calculate this crap lol
    let incomePerRound =
        (230 + 40 * parseInt(crosspathNum)) * (1 + parseInt(hackPercent));
    let arr = [incomePerRound * (1.15 + hackPercent)];
    for (i = 0; i < 19; i++) {
        arr.push(Math.min((arr[i] + incomePerRound) * 1.15, maxCapacity));
    }
    let round = 1;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == maxCapacity) {
            break;
        } else {
            round++;
        }
    }
    let perRoundFull = maxCapacity / round;
    let perRoundFullBefore = arr[round - 1] / round - 1;
    let optimalIncome = Math.max(perRoundFull, perRoundFullBefore);
    let bestCollect;
    if (optimalIncome == perRoundFull) {
        bestCollect = 'collect when full';
    } else {
        bestCollect = 'collect one round before full';
    }
    let roundsToRepay = buildingCost / optimalIncome;
    let resultArray = [];
    for (let i = 0; i < arr.length; i++) {
        resultArray.push(Math.round(arr[i]));
    }
    let bankEmbed = new Discord.MessageEmbed()
        .setTitle(`x${bankTier}x bank`)
        .setDescription(
            `**additional** cash in the bank for 20 rounds\n${resultArray}`
        )
        .addField('ideal collection', `${bestCollect}`)
        .addField(
            'round when full',
            `${round} (round 1 is the round you place the bank)`
        )
        .addField(
            'income per round (Income before interest, this is how much money the Bank will add during the round)',
            `${incomePerRound}`
        )
        .addField('max capacity', `${maxCapacity}`)
        .addField('Rounds to repay', `${roundsToRepay}`)
        .setColor(cyber);
    return bankEmbed;
}
