const request = require('request');
const { red, cyber } = require('../jsons/colours.json');
const raceImg =
    'https://static.wikia.nocookie.net/b__/images/4/40/EventRaceIcon.png/revision/latest/scale-to-width-down/340?cb=20200616225307&path-prefix=bloons';
module.exports = {
    name: 'r4ndy',
    casedArgs: true,
    rawArgs: true,
    async execute(message, args) {
        let raceID = 'Ready_Set_No_ktdogfkw';
        let start = 1;
        let end = 50;
        let url = `https://priority-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Race_${raceID}.json`;
        request(url, (err, res, body) => {
            if (err) {
                reject('req');
            }
            let data;
            try {
                data = JSON.parse(JSON.parse(body).data);
            } catch {
                return message.channel.send(
                    'invalid race id. To see all race ids join the discord server by running `q!server`'
                );
            }
            let scores = data.scores.equal;

            let output = '';

            // get max length of names, there is probably a more efficient way but heh
            let maxLength = 0;

            for (let i = start - 1; i < end; i++) {
                if (!scores[i]) break;
                let md = scores[i].metadata.split(',');
                let username = md[0];
                if (username.length > maxLength) {
                    maxLength = username.length;
                }
            }
            for (let i = start - 1; i < end; i++) {
                if (!scores[i]) break;
                let time = 1000000000 - scores[i].score;

                time = parsetime(time);
                let md = scores[i].metadata.split(',');
                let username;
                if (
                    message.author.id == '279126808455151628' ||
                    message.author.id == '217726724752932864'
                ) {
                    let userid = scores[i].userID;
                    if (
                        userid == '5b7f82e318c7cbe32fa01e4e' ||
                        userid == '5b2845abfcd0f8d9745e6cfe'
                    ) {
                        username = md[0];
                    } else {
                        username = '???';
                    }
                } else {
                    if (i == 0) username = 'RandyZ524';
                    else username = md[0];
                }
                let row = '';
                row += addSpaces(i + 1, 2) + '|';
                row += addSpaces(username, maxLength);
                row += '|';
                row += time;
                row += '\n';
                output += row;
            }
            if (output.length > 4096) {
                return module.exports.errorMessage(message, [
                    'too many characters',
                ]);
            }
            let embed = new Discord.MessageEmbed()
                .setTitle(`ID: ${data.leaderboardID}`)
                .setURL(url)
                .setDescription('```' + output + '```')
                .setColor(cyber)
                .setTimestamp()
                .setThumbnail(raceImg);
            message.channel.send({ embeds: [embed] });
        });
    },
    errorMessage(message, errors) {
        let errorEmbed = new Discord.MessageEmbed()
            .setTitle(`${errors.join('\n')}`)
            .addField(
                '**q!lb [startingPlacement] [endingPlacement]**',
                'both `startingPlacement` and `endingPlacement` are optional - they default to 1 and 50 respectively'
            )

            .setColor(red);

        message.channel.send({ embeds: [errorEmbed] });
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
    } catch {}

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
const getLB = (url) => {
    return new Promise((res, rej) => {
        fetch(url);
        let data = JSON.parse(JSON.parse(body).data);
        resolve(data);
    });
};
