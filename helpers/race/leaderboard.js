// takes a body.data JSON parsed from the API

const Player = require('./player');

class Leaderboard {
    constructor(obj) {
        this.scores = obj.scores.equal;
        let arr = [];
        if (this.scores.length == 0) return (this.isDataExpunged = true);
        for (let i = 0; i < this.scores.length; i++) {
            arr.push(new Player(this.scores[i], i + 1));
        }
        this.players = arr;
        let maxLength = 0;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].username.length > maxLength) {
                maxLength = this.players[i].username.length;
            }
        }
        this.maxLength = maxLength;
    }
    async init() {
        for (let i = 0; i < this.players.length; i++) {
            await this.players[i].getMedals();
        }
    }
    /**
     *
     * @param {string} name
     * Can actually also be a user id or position
     */
    async getPlayer(name) {
        if (this.isDataExpunged) return '**Data expunged by NK**';
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (
                player.username.toLowerCase().includes(name) ||
                player.userID == name ||
                (!isNaN(name) && player.position == name)
            )
                return await player.individual();
        }
        return undefined;
    }
    /**
     * The more classic "wall-like" lb
     * start and end both inclusive
     */
    async getWall(start = 1, end = 50) {
        if (this.isDataExpunged) return 'Data expunged by NK';

        let output = '';
        for (let i = start - 1; i < end; i++) {
            let player = this.players[i];
            output += (await player.inline(this.maxLength)) + '\n';
        }
        return `\`\`\`${output}\`\`\``;
    }
}
module.exports = Leaderboard;
