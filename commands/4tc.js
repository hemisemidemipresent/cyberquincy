module.exports = {
    name: '4tc',
    aliases: ['4'],
    execute(message, args) {
        if (!args) return help();
        let cmd = args.shift();
        if (cmd == 'show') leaderboard(message, args);
        else if (cmd == 'inc') inc(message, args);
        else if (cmd == '') {
        }
    },
};
function leaderboard(message, input) {
    user = input.join(' ');
    let num = readLB(user);
    return message.channel.send(`${user}: ${num}`);
}
function updateLB(user) {
    fs.readFile('../jsons/leaderboard.json', 'utf8', (err, jsonString) => {
        if (err) {
            console.log('File read failed:', err);
            return;
        }
        let arr = JSON.parse(jsonString);
        for (i = 0; i < arr.length; i++) {
            if (arr[i][0].toLowerCase() == user) {
                arr[i][1] = arr[i][1] + 1;
            }
        }
    });
}
function readLB(user) {
    let lb = require('../jsons/leaderboard.json');
    for (i = 0; i < lb.length; i++) {
        if (lb[i][0].toLowerCase() == user) return lb[i][1];
    }
}
