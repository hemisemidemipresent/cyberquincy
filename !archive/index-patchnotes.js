const GoogleSheetsHelper = require('../helpers/google-sheets');
const { btd6Version } = require('../1/config.json');

const offset = 67;

module.exports = {
    name: 'update',
    aliases: ['patch'],
    dependencies: ['btd6index'],
    async execute(message) {
        const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Landing Page');
        await sheet.loadCells('A67:N91');
        let output = '```';
        for (let i = 2; i < btd6Version; i++) {
            console.log(offset + i);
            let versionCell = sheet.getCellByA1(`B${offset + i}`);
            let versionStr = versionCell.value;
            //let versionHyperlink = versionCell.hyperlink;
            let date = sheet.getCellByA1(`C${offset + i}`).formattedValue;
            let deltaTime = sheet.getCellByA1(`D${offset + i}`).value;
            let towerAdded = sheet.getCellByA1(`E${offset + i}`).value;
            let map = sheet.getCellByA1(`F${offset + i}`).value;
            let gamemode = sheet.getCellByA1(`H${offset + i}`).value;
            let balance = sheet.getCellByA1(`N${offset + i}`).value;
            let delta = '';
            delta += `${addSpaces(versionStr, 4)}|`;
            delta += `${addSpaces(date, 8)}|`;
            delta += `${addSpaces(deltaTime, 7)}|`;
            delta += `${addSpaces(towerAdded, 9)}|`;
            delta += `${addSpaces(map, 18)}|`;
            delta += `${addSpaces(gamemode, 20)}|`;
            delta += `${addSpaces(balance, 16)}\n`;
            console.log(delta);
            output += delta;
        }
        message.channel.send(output.substr(0, 1997) + '```');
        if (output.length > 2000) {
            message.channel.send(output.substr(1998, 3997));
        }
        if (output.length > 4000) {
            message.channel.send(output.substr(3998, 5997));
        }
        message.channel.send(output);
    },
};
function addSpaces(str, max) {
    if (str == null || !str) {
        str = ' '.repeat(max);
        return str;
    }
    let diff = max - str.toString().length;

    str += ' '.repeat(diff);

    return str;
}
