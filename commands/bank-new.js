const { cyber } = require('../jsons/colours.json');
const ReactionChain = require('../helpers/reactor/reaction_chain');
const SingleTextParser = require('../helpers/reactor/single_text_parser');
const LimitedStringSetValuesParser = require('../parser/limited-string-set-values-parser');
const NaturalNumberParser = require('../parser/natural-number-parser');
const NumberParser = require('../parser/number-parser');
module.exports = {
    name: 'bank2',
    execute(message, args) {
        ReactionChain.process(
            message,
            (message, results) => main(message, results),

            new SingleTextParser(
                new NumberParser(3, 5),
                'middlePath',
                undefined,
                'Please type the second path upgrade (3/4/5) number in the chat'
            ),
            new SingleTextParser(
                new LimitedStringSetValuesParser(
                    'true/false',
                    ['true', 'false'],
                    ['true', 'false']
                ),
                'flatPackBuildings',
                undefined,
                'Please type the whether you have Flat Pack Buildings monkey knowledge (true/false).'
            ),
            new SingleTextParser(
                new LimitedStringSetValuesParser(
                    'true/false',
                    ['true', 'false'],
                    ['true', 'false']
                ),
                'biggerBanks',
                undefined,
                'Please type the whether you have Bigger Banks monkey knowledge (true/false).'
            ),
            new SingleTextParser(
                new NumberParser(0, 20),
                'benjaminLevel',
                undefined,
                'Please type the Benjamin level number in the chat'
            ),
            new SingleTextParser(
                new NumberParser(0, 2),
                'crosspath',
                undefined,
                'Please select the crosspath by typing the number:\n0 - 03+x farm\n1 - 13+0 farm\n2 - 23+0 farm'
            ),
            new SingleTextParser(
                new NumberParser(1, 5),
                'difficulty',
                undefined,
                'Please type the corresponding number to select the difficulty\n1 - easy\n2 - medium\n3 - hard\n4 - impoppable\n5 - half cash'
            )
        );
    },
};
function tookTooLong(message) {
    return message.channel.send(`You took too long to answer!`);
}

function main(message, res) {
    /**
     example of res:
     {
        middlePath_number: 3,
        flatPackBuildings_limited_string_set_value: 'true',
        biggerBanks_limited_string_set_value: 'true',
        benjaminLevel_number: undefined,
        crosspath_number: undefined,
        difficulty_number: 5
    }
    undefined = 0
     */
    console.log(res);
    let embed = calculate(
        res.middlePath_number,
        parseBool(res.flatPackBuildings_limited_string_set_value),
        parseBool(res.biggerBanks_limited_string_set_value),
        getBenjaminBankHack(res),
        res.crosspath_number,
        res.difficulty_number
    );
    message.channel.send(embed);
}
function parseBool(str) {
    if (str == 'true') return true;
    return false;
}
function getBenjaminBankHack(level) {
    if (!level) return 0;
    if (level < 5) return 0;
    if (level < 9) return 5;
    return 12;
}
function calculate(
    bankTier,
    flatPackBuilding,
    BiggerBanks,
    hackPercent,
    crosspathNum,
    difficultyId
) {
    if (!crosspathNum) crosspathNum = 0;
    hackPercent = hackPercent / 100;
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

    let onexx = [425, 500, 540, 625, 540]; // costs of 1xx farm
    let twoxx = [510, 1100, 1190, 1345, 1190]; // costs of 2xx farm
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
    console.log(230 + 40 * parseInt(crosspathNum), 1 + parseInt(hackPercent));
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
