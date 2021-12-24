// takes a body.data JSON parsed from the API
const userIDs = require('../../jsons/userID.json');
const gHelper = require('../general.js');

const { getUsernames } = require('../usernames');
class Leaderboard {
    constructor(obj) {
        let scores = obj.scores.equal;
        let arr = [];
        if (scores.length == 0) return (this.isDataExpunged = true);

        this.unknownUsers = [];
        for (let i = 0; i < scores.length; i++) {
            // create a player obj
            let obj = scores[i];
            let position = i + 1;

            let playerObj = {
                position: position,
                userID: obj.userID,
                time: 1000000000 - obj.score,
                isNew: obj.isNew
            };
            playerObj.fTime = new Date(playerObj.time).toISOString().substring(14, 23);

            let metadata = obj.metadata;
            if (metadata.includes('timestamp')) {
                let substring = metadata.split(';')[1];
                playerObj.timestamp = substring.split(',')[1];

                let timestampInt = parseInt(playerObj.timestamp);
                let s = new Date(timestampInt).toGMTString();
                let monthDay = s.substring(5, 11);
                let hms = s.substring(17, 25);
                playerObj.fTimestamp = monthDay + ' ' + hms;
            } else {
                playerObj.timestamp = '???????????????';
                playerObj.fTimestamp = '???????????????';
            }

            let tokens = metadata.split(',');
            if (tokens.length > 5) {
                let username = tokens[0];
                if (username != 'medals') playerObj.username = tokens[0];
                let user = userIDs.find((user) => {
                    return user.userID == playerObj.userID;
                });
                playerObj.username = user?.name;
            }
            if (!playerObj.username) this.unknownUsers.push(playerObj.userID);
            arr.push(playerObj);
        }
        this.players = arr;
    }
    async init() {
        let usernames = await getUsernames(this.unknownUsers);

        if (usernames) {
            let j = 0;
            for (let i = 0; i < this.players.length; i++) {
                let playerObj = this.players[i];

                if (!playerObj.username) {
                    playerObj.username = usernames[j];
                    j++;
                }
            }
        }

        let maxLength = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].username?.length > maxLength) {
                maxLength = this.players[i].username?.length;
            }
        }
        this.maxLength = maxLength;
    }

    /**
     *
     * @param {string} name
     * Can actually also be a user id or position
     */
    getPlayer(name) {
        if (typeof name == 'string') name = name.toLowerCase();

        if (this.isDataExpunged) return '**Data expunged by NK**';
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (
                player.username.toLowerCase().includes(name) ||
                player.userID == name ||
                (!isNaN(name) && player.position == name)
            )
                return this.individual(player);
        }
        return 'no player found';
    }
    /**
     * The more classic "wall-like" lb
     * start and end both inclusive
     */
    getWall(start = 1, end = 50) {
        if (this.isDataExpunged) return 'Data expunged by NK';

        let output = '';
        for (let i = start - 1; i < end; i++) {
            let player = this.players[i];
            output += this.inline(player) + '\n';
        }
        return `\`\`\`${output}\`\`\``;
    }
    inline(playerObj) {
        let row = `${gHelper.addSpaces(playerObj.position, 3)}`;
        row += playerObj.fTime + '|';
        row += playerObj.fTimestamp + '|';
        row += playerObj.username;
        return row;
    }
    individual(playerObj) {
        let output =
            `placement: ${gHelper.toOrdinalSuffix(playerObj.position)}` +
            `\nname: ${playerObj.username}` +
            `\nisNew: ${playerObj.isNew}` +
            `\ntime: ${playerObj.fTime}` +
            `\nuserID: ${playerObj.userID}`;
        if (playerObj.timestamp != '???') output += '\n' + playerObj.fTimestamp;
        return output;
    }
}
module.exports = Leaderboard;
