const { cyber, orange } = require('../jsons/colours.json');
const filter = (msg) => msg.author.id === `${message.author.id}`;
module.exports = {
    name: 'test-calc',
    aliases: ['calculation'],
    execute(message) {},
};
function isValidUpgrade(u) {
    if (!gHelper.is_str(u) || u.length != 3) return false;

    if (isNaN(u)) return false;

    if (!u.includes('0')) return false;

    if (/6|7|8|9/.test(u)) return false;

    d = u.match(/3|4|5/g);
    if (d && d.length > 1) return false;

    return true;
}
