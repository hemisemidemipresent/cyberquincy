const leaderboard = require('./4tc-leaderboard.json');
const hastebin = require('hastebin-gen');

module.exports = {
    name: 'leaderboard4tc',
    rawArgs: true,
    casedArgs: true,
    async execute(message, args) {
        if (!args.length) {
            const leaderboardMsg = whole_leaderboard();

            if (leaderboardMsg === '') {
                return message.channel.send('leaderboard is empty');
            }

            if (leaderboardMsg.length < 2001) {
                return message.channel.send(leaderboardMsg);
            }

            message.channel.send(
                'Message too long to display, creating a hastebin link'
            );
            const hastebinLink = await hastebin(leaderboardMsg, {
                extension: 'txt',
            });
            return message.channel.send(hastebinLink);
        }

        // Handles names that contain spaces since those names will be multiple different args
        let name = '';
        for (let i = 0; i < args.length; ++i) {
            name += args[i] + ' ';
        }
        name = name.slice(0, name.length - 1);

        const combos = get_combos_by(name);
        if (combos == 1) {
            return message.channel.send(
                name + ' has completed ' + combos + ' combo'
            );
        } else {
            return message.channel.send(
                name + ' has completed ' + combos + ' combos'
            );
        }
    },
};

function get_combos_by(name) {
    for (let i = 0; i < leaderboard.length; ++i) {
        if (leaderboard[i][0] == name) {
            return leaderboard[i][1];
        }
    }
    return 0;
}

function whole_leaderboard() {
    let leaderboardString = '';

    for (let i = 0; i < leaderboard.length; ++i) {
        leaderboardString +=
            leaderboard[i][0] + ': ' + leaderboard[i][1] + '\n';
    }
    return leaderboardString;
}
