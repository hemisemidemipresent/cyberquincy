const request = require('request');

module.exports = {
    name: 'raceleaderboard',
    aliases: ['leaderboard', 'lb', 't100'],

    async execute(message) {
        let url =
            'https://priority-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Race_WorkingOnForm_ki9pdqx4.json';

        request(url, (err, res, body) => {
            if (err) {
                reject('req');
            }
            let data = JSON.parse(JSON.parse(body).data);
            let scores = data.scores.equal;

            let output = '';
            for (let i = 0; i < 50; i++) {
                let time = 1000000000 - scores[i].score;

                time = parsetime(time);
                let md = scores[i].metadata.split(',');
                let username = md[0];
                let row = '';
                row += addSpaces(i + 1, 2) + '|';
                row += addSpaces(username, 20);
                row += '|';
                row += time;
                row += '\n';
                output += row;
            }
            message.channel.send('```' + output + '```');
        });
    },
};
function addSpaces(str, max) {
    if (str == null || !str) {
        str = ' '.repeat(max);
        return str;
    }
    let diff = max - str.toString().length;

    try {
        str += ' '.repeat(diff);
    } catch {
        console.log(str);
    }

    return str;
}
function parsetime(ms) {
    let milliseconds = ms % 1000;
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 100 ? '0' + milliseconds : milliseconds;
    return minutes + ':' + seconds + '.' + milliseconds;
}
