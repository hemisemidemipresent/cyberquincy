const { cyber } = require('../jsons/colours.json');
module.exports = {
    name: 'bank',
    aliases: ['b', 'ba'],
    execute(message, args) {
        const filter = (msg) => msg.author.id === `${message.author.id}`;
        const options = {
            max: 1,
            time: 10000,
            errors: ['time']
        };
        const selectBankMsg = 'Please select which bank you are using\n3 - x3x bank\n4 - x4x bank\n5 - x5x bank';
        const errorBankMsg = 'Sorry, please specify a bank type number from 3 to 5 next time. Run the command again';
        const selectMKMsg =
            'Type the number to select which Monkey Knowledge you are using\n0 - none\n1 - Flat Pack Buildings\n2 - Flat pack buildings + Bigger Banks';
        const errorMKMsg = 'Sorry, please specify a valid option next time (0-2). Run the commands again';
        const selectBenjaminMsg =
            'Please select bank hack %:\n0 - no ben / ben is below lvl 5\n5 - ben lvl 5 to 8\n12 - ben lvl 9+';
        const errorBenjaminMsg = 'sorry, please specify a valid value (0, 5, or 12). Run the command again';
        const selectCrosspathMsg =
            'Please select the crosspath by typing the number:\n0 - 03+x farm\n1 - 13+0 farm\n2 - 23+0 farm';
        const errorCrosspathMsg = 'Please specify a valid crosspath option (0 - 2). Run the command again';
        const selectDiffMsg =
            'Please type the corresponding number to select the difficulty\n1 - easy\n2 - medium\n3 - hard\n4 - impoppable\n5 - half cash';
        const errorDiffMsg = 'Please specify a correct number (1 - 5). Run the command again';
        message.channel.send(selectBankMsg);
        message.channel
            .awaitMessages(filter, options)
            .then((collected) => {
                let bankTier = collected.first().content;
                if (isNaN(bankTier) || bankTier < 3 || bankTier > 5) {
                    return message.channel.send(errorBankMsg);
                }
                mm(bankTier);
            })
            .catch(() => {
                tookTooLong(message);
            });
        function mm(bankTier) {
            message.channel.send(selectMKMsg);
            message.channel
                .awaitMessages(filter, options)
                .then((collect) => {
                    let mk = collect.first().content;
                    let flatPackBuilding, BiggerBanks;
                    if (isNaN(mk) || mk > 2 || mk < 0) {
                        return message.channel.send(errorMKMsg);
                    }
                    if (mk > 0) {
                        flatPackBuilding = true;
                    }
                    if (mk > 1) {
                        BiggerBanks = true;
                    }
                    benjamin(bankTier, flatPackBuilding, BiggerBanks);
                })
                .catch(() => {
                    tookTooLong(message);
                });
        }
        function benjamin(bankTier, flatPackBuilding, BiggerBanks) {
            message.channel.send(selectBenjaminMsg);
            message.channel
                .awaitMessages(filter, options)
                .then((collectt) => {
                    let hackPercent = collectt.first().content;
                    if (!isValidHack(hackPercent)) {
                        return message.channel.send(errorBenjaminMsg);
                    }
                    crosspath(bankTier, flatPackBuilding, BiggerBanks, hackPercent);
                })
                .catch(() => {
                    tookTooLong(message);
                });
        }
        function crosspath(bankTier, flatPackBuilding, BiggerBanks, hackPercent) {
            message.channel.send(selectCrosspathMsg);
            message.channel
                .awaitMessages(filter, options)
                .then((collectt2) => {
                    let crosspathNum = collectt2.first().content;
                    if (isNaN(crosspathNum) || crosspathNum < 0 || crosspathNum > 2) {
                        return message.channel.send(errorCrosspathMsg);
                    }
                    findDifficulty(bankTier, flatPackBuilding, BiggerBanks, hackPercent, crosspathNum);
                })
                .catch(() => {
                    tookTooLong(message);
                });
        }
        function findDifficulty(bankTier, flatPackBuilding, BiggerBanks, hackPercent, crosspathNum) {
            message.channel.send(selectDiffMsg);
            message.channel
                .awaitMessages(filter, options)
                .then((collectt3) => {
                    let difficultyId = collectt3.first().content;
                    if (isNaN(difficultyId) || difficultyId < 0 || difficultyId > 5) {
                        return message.channel.send(errorDiffMsg);
                    }
                    const bankEmbed = calculate(
                        bankTier,
                        flatPackBuilding,
                        BiggerBanks,
                        hackPercent,
                        crosspathNum,
                        difficultyId
                    );
                    return message.channel.send(bankEmbed);
                })
                .catch(() => {
                    tookTooLong(message);
                });
        }
    }
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
function calculate(bankTier, flatPackBuilding, BiggerBanks, hackPercent, crosspathNum, difficultyId) {
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
        [96175, 112650, 122205, 135780, 122205]
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
    let incomePerRound = (230 + 40 * parseInt(crosspathNum)) * (1 + parseInt(hackPercent));
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
    let bankEmbed = new Discord.EmbedBuilder()
        .setTitle(`x${bankTier}x bank`)
        .setDescription(`**additional** cash in the bank for 20 rounds\n${resultArray}`)
        .addField('ideal collection', `${bestCollect}`)
        .addField('round when full', `${round} (round 1 is the round you place the bank)`)
        .addField(
            'income per round (Income before interest, this is how much money the Bank will add during the round)',
            `${incomePerRound}`
        )
        .addField('max capacity', `${maxCapacity}`)
        .addField('Rounds to repay', `${roundsToRepay}`)
        .setColor(cyber);
    return bankEmbed;
}
