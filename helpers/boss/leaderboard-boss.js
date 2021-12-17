// takes a body.data JSON parsed from the API

const { getUsernames } = require('../usernames');
const userIDs = require('../../jsons/userID.json');
const gHelper = require('../general.js');

class BossLeaderboard {
    constructor(data, obj) {
        let scores = data.scores.equal;
        let teams = [];
        let currentTeamId = '';
        let currTeam = [];

        this.unknownUsers = [];
        if (obj.type != 'SP') {
            for (let i = 0; i < scores.length; i++) {
                let score = scores[i];
                let md = score.metadata;
                let tokens = md.split(',');
                let teamId = tokens[7];

                let playerObj = this.getPlayerObj(scores[i]);

                if (teamId == currentTeamId) {
                    currTeam.push(playerObj);
                } else {
                    if (i != 0) {
                        teams.push(currTeam);
                    }
                    currTeam = [playerObj];
                    currentTeamId = teamId;
                }
            }
        } else {
            for (let i = 0; i < scores.length; i++) {
                let playerObj = this.getPlayerObj(scores[i]);

                teams.push([playerObj]);
            }
        }
        this.teams = teams;
        this.players = teams.flat();
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
        } else {
            for (let i = 0; i < this.players.length; i++) {
                let playerObj = this.players[i];

                if (!playerObj.username) {
                    playerObj.username = '???             ';
                }
            }
        }
        let maxLength = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].username?.length > maxLength) {
                maxLength = this.players[i].username.length;
            }
        }
        this.maxLength = maxLength;
    }
    /**
     * start and end both inclusive
     */
    getWall(start = 1, end = 50) {
        let final = '';
        end = Math.min(end, this.teams.length);
        for (let i = start - 1; i < end; i++) {
            let team = this.teams[i];
            for (let j = 0; j < team.length; j++) {
                let player = team[j];
                let str = '';
                if (j == 0) str = gHelper.addSpaces(i + 1, 3);
                else str = '   ';

                str += gHelper.addSpaces(player.username, this.maxLength);
                str += ' ';
                if (j == 0) str += player.fTime;

                str += '\n';
                final += str;
            }
        }
        return final;
    }

    getPlayerObj(obj) {
        let playerObj = {
            userID: obj.userID,
            time: 1000000000 - obj.score,
            isNew: obj.isNew,
        };
        playerObj.fTime = new Date(playerObj.time)
            .toISOString()
            .substring(14, 23);
        let user = userIDs.find((user) => {
            return user.userID == playerObj.userID;
        });
        playerObj.username = user?.name;
        if (!playerObj.username) this.unknownUsers.push(playerObj.userID);
        return playerObj;
    }
}
module.exports = BossLeaderboard;
