const Discord = require('discord.js');
const collection = new Discord.Collection();

module.exports = {
    answerCorrect(userID) {
        if (checkIfStreak(userID)) incrementStreak(userID);
        else startStreak(userID);
    },
    answerWrong(userID) {
        if (checkIfStreak) removeStreak(userID);
    },
    getStreak(userID) {
        if (collection.has(userID)) {
            let streak = collection.get(userID);

            return `Streak: ${streak}`;
        } else return 'No Streak Currently';
    },
};
function checkIfStreak(userID) {
    // returns boolean whether use has a streak or not
    return collection.has(userID);
}

function startStreak(userID) {
    // creates a key-value pair with {userID => 1}
    collection.set(userID, 1);
}

function incrementStreak(userID) {
    // updates the key value pairs
    let streak = collection.get(userID);
    collection.set(userID, streak + 1);
}

function removeStreak(userID) {
    // removes the key value pair
    collection.delete(userID);
}
