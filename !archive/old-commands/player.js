/**
 * Types of object sent
 * v1.0: {userID: 'userID', score: 999905533, isNew: false, metadata: 'username,level,0,0,0,0,0,0,0,0'}
 * v1.1: {userID: 'userID', score: 999868933, isNew: false, metadata: 'username,level,0,0,0,0,0,0,0,0,0'}
 * v1.2: {userID: 'userID', score: 999889166, isNew: false, metadata: 'username,level,0,0,0,0,0,0,0,0,0;timestamp,1633872148667'}
 * v1.x: {userID: 'userID', score: 999905533, isNew: false, metadata: ''}
 * v2.0: {userID: 'userID', score: 999896332, isNew: false, metadata: 'medals,0,0,0;timestamp,1634293108325'}
 *
 * 1.0: the original
 * 1.1: added t50 badge
 * 1.2: added timestamps (faulty ones)
 * 1.x: no clue
 * 2.0: update 28.0 -  no more usernames :(
 */
const axios = require('axios');
const seclateServerID = '543957081183617024';

const gHelper = require('../helpers/general.js');
const Emojis = require('../jsons/emojis.json');
const { UserAgent } = require('../1/config.json');

const raceEmojis = Emojis[seclateServerID + ''].race;
const userIDs = require('../jsons/userID.json');

class Player {
    constructor(obj, position) {
        this.position = position;
        this.userID = obj.userID;
        this.time = 1000000000 - obj.score;
        this.fTime = new Date(this.time).toISOString().substring(14, 23);
        this.isNew = obj.isNew;

        let metadata = obj.metadata;
        if (metadata.includes('timestamp')) {
            let substring = metadata.split(';')[1];
            this.timestamp = substring.split(',')[1];

            let timestampInt = parseInt(this.timestamp);
            let s = new Date(timestampInt).toGMTString();
            let monthDay = s.substring(5, 11);
            let hms = s.substring(17, 25);
            this.fTimestamp = monthDay + ' ' + hms;
        } else {
            this.timestamp = '???????????????';
            this.fTimestamp = this.timestamp;
        }

        let tokens = metadata.split(',');
        if (tokens.length > 5) {
            let username = tokens[0];
            if (username != 'medals') return (this.username = tokens[0]);

            let user = userIDs.find((user) => {
                return user.userID == this.userID;
            });
            this.username = user?.name;
            if (this.username) return;
        }
        this.username = '??????????????????';
    }
    async inline() {
        let row = `${this.addSpaces(this.position, 3)}`;

        row += this.fTime + '|';
        row += this.fTimestamp + '|';
        // medals
        if (this.username == '??????????????????') {
            await this.getMedals();

            row += `${this.formatMedalInline()}`;
        } else {
            row += this.username;
        }
        return row;
    }
    async individual() {
        await this.getMedals();
        let medals = await this.formatMedals();
        let output =
            `placement: ${gHelper.toOrdinalSuffix(this.position)}` +
            `\nname: ${this.username}` +
            `\nisNew: ${this.isNew}` +
            `\ntime: ${this.fTime}` +
            `\nuserID: ${this.userID}` +
            `\nmedals:\n${medals}`;
        if (this.timestamp != '???') output += '\n' + this.fTimestamp;
        return output;
    }
    addSpaces(str, max) {
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
    zeroFill(number, width) {
        width -= number.toString().length;
        if (width > 0) {
            return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
        }
        return number + ''; // always return a string
    }
    async getMedals() {
        if (this.medals) return;
        let url = `https://fast-static-api.nkstatic.com/storage/static/11/${this.userID}/public-stats`;

        let body = await axios.get(url, {
            headers: { 'User-Agent': UserAgent }
        });
        let obj = body.data;
        let medals = obj.raceMedals;
        let first = medals['BlackDiamond'] ?? 0;
        let second = medals['RedDiamond'] ?? 0;
        let third = medals['Diamond'] ?? 0;
        let fifty = medals['GoldDiamond'] ?? 0;
        let one = medals['DoubleGold'] ?? 0;
        let ten = medals['GoldSilver'] ?? 0;
        let twfive = medals['DoubleSilver'] ?? 0;
        let fiftyp = medals['Silver'] ?? 0;
        let seveny = medals['Bronze'] ?? 0;

        this.medals = [first, second, third, fifty, one, ten, twfive, fiftyp, seveny];
    }

    async formatMedals() {
        let emojiNames = [
            'BlackDiamond',
            'RedDiamond',
            'Diamond',
            'GoldDiamond',
            'DoubleGold',
            'GoldSilver',
            'DoubleSilver',
            'Silver',
            'Bronze'
        ];
        let res = [];
        for (let i = 0; i < emojiNames.length; i++) {
            res.push(this.getEmojiFromId(raceEmojis[emojiNames[i]]) + `: ${this.medals[i]}`);
        }

        return res.join('\n');
    }

    formatMedalInline() {
        let medalNames = ['1️⃣', '2️⃣', '3️⃣', '㊿', '➀', '➉', '㉕', '㉌', '㉎'];
        let j = 0;
        let res = '';
        for (let i = 0; i < this.medals.length; i++) {
            if (j > 2) break;
            let medalCount = this.medals[i];
            if (medalCount > 0) {
                res += `${medalNames[i]} ${this.zeroFill(medalCount, 2)} `;
                j++;
            }
        }
        return res;
    }
    getEmojiFromId(id) {
        try {
            let guild = client.guilds.cache.get('543957081183617024');
            let emoji = guild.emojis.cache.get(id);
            return emoji;
        } catch {
            return '<insert emoji here>';
        }
    }
}
module.exports = Player;
