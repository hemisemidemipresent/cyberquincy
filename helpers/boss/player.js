// modified version from race
// {"userID":"","score":999965016,"isNew":false,"metadata":"medals,4,1,1;timestamp,1638028120290;cs,68;gid,52784;teamId,WWWWWW"}
const userIDs = require('../../jsons/userID.json');

class Player {
    constructor(obj) {
        this.userID = obj.userID;
        this.time = 1000000000 - obj.score;
        this.fTime = new Date(this.time).toISOString().substring(14, 23);

        this.isNew = obj.isNew;

        let user = userIDs.find((user) => {
            return user.userID == this.userID;
        });
        this.username = user?.name;
        if (!this.username) this.username = '?';
    }
}
module.exports = Player;
