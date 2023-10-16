const axios = require('axios').default;
module.exports = {
    parsetime,
    formatPersan,
    getRaceJSON,
    getRaceURL,
    getBossJSON,
    getBossURL,
};
function parsetime(ms) {
    let milliseconds = ms % 1000;
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);

    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 100 ? '0' + milliseconds : milliseconds;
    return minutes + ':' + seconds + '.' + milliseconds;
}
function formatPersan(message, score, maxLength, i) {
    let time = 1000000000 - score.score;

    time = parsetime(time);
    let md = score.metadata.split(',');
    let username;
    if (
        message.author.id == '279126808455151628' ||
        message.author.id == '217726724752932864'
    ) {
        let userid = score.userID;
        if (
            userid == '5b7f82e318c7cbe32fa01e4e' ||
            userid == '5b2845abfcd0f8d9745e6cfe'
        ) {
            username = md[0];
        } else {
            username = '???';
        }
    } else {
        username = md[0];
    }
    let row = '';
    row += addSpaces(i + 1, 2) + '|';
    row += addSpaces(username, maxLength);
    row += '|';
    row += time;
    row += '\n';
    return row;
}
async function getRaceJSON(raceID) {
    let url = getRaceURL(raceID);
    let body = await axios.get(url);
    let data;
    try {
        data = JSON.parse(body.data.data);
    } catch (e) {
        throw e;
    }

    return data;
}
async function getBossJSON(bossID, obj) {
    let url = getBossURL(bossID, obj);
    let body = await axios.get(url);
    let data;
    try {
        data = JSON.parse(body.data.data);
    } catch (e) {
        throw e;
    }

    return data;
}
function getRaceURL(raceID) {
    return `https://priority-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Race_${raceID}.json`;
}
function getBossURL(bossID, obj) {
    if (!obj.elite)
        return `https://fast-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Boss_${bossID}_${obj.type}.json`;
    return `https://fast-static-api.nkstatic.com/storage/static/appdocs/11/leaderboards/Boss_${bossID}_Elite_${obj.type}.json`;
}
//
// Util functions
//
function addSpaces(str, max) {
    if (str == null || !str) {
        str = ' '.repeat(max);
        return str;
    }
    let diff = max - str.toString().length;

    try {
        str += ' '.repeat(diff);
    } catch {
        return str
    }
    return str;
}
