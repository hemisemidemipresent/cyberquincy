const { darkgreen } = require('../jsons/colours.json');
const GoogleSheetsHelper = require('../helpers/google-sheets.js');
module.exports = {
    name: 'balance',
    dependencies: ['btd6index'],

    aliases: ['changes', 'balances'],
    execute,
};
async function execute(message, args) {
    let name = args[0];
    if (!name) {
        return message.channel.send(`Please specify a proper tower name.`);
    } else {
        return showBuffNerf(message, name);
    }
}
const alphabet = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    'AA',
    'AB',
    'AC',
    'AD',
    'AE',
    'AF',
    'AG',
    'AH',
    'AI',
    'AJ',
    'AK',
    'AL',
    'AM',
    'AN',
    'AO',
    'AP',
    'AQ',
    'AR',
    'AS',
    'AT',
    'AU',
    'AV',
    'AW',
    'AX',
    'AY',
    'AZ',
];
const indexTowerNames = [
    ['dart-monkey', 4],
    ['boomerang-monkey', 6],
    ['bomb-shooter', 8],
    ['tack-shooter', 10],
    ['ice-monkey', 12],
    ['glue-gunner', 14],
    ['sniper-monkey', 16],
    ['monkey-sub', 18],
    ['monkey-bucc', 20],
    ['monkey-ace', 22],
    ['heli-pilot', 24],
    ['mortar-monkey', 26],
    ['wizard-monkey', 28],
    ['super-monkey', 30],
    ['ninja-monkey', 32],
    ['alchemist', 34],
    ['druid', 36],
    ['banana-farm', 38],
    ['spike-factory', 40],
    ['monkey-village', 42],
    ['engineer-monkey', 44],
];
async function showBuffNerf(message, tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
    await sheet.loadCells('D23:AS44');
    let tnum = 0;
    for (i = 0; i < 21; i++) {
        let indexTowerName = indexTowerNames[i][0];
        if (tower.includes(indexTowerName) || indexTowerName.includes(tower)) {
            tnum = indexTowerNames[i][1];
            break;
        }
    }
    let col0 = alphabet[tnum - 1];

    let col1 = alphabet[tnum];

    let balances = [];
    for (i = 0; i < 21; i++) {
        let buff = sheet.getCellByA1(`${col0}${i + 24}`).note;
        let nerf = sheet.getCellByA1(`${col1}${i + 24}`).note;

        buff = buff.replace(/✔️/g, '✅');
        buff = buff.replace(/\n\n/g, '\n');

        nerf = nerf.replace(/\n\n/g, '\n');

        res = [buff.toString(), nerf.toString()];
        balances.push(res);
    }
    let embed = new Discord.MessageEmbed()
        .setTitle(`Buffs and Nerfs for ${tower}\n`)
        .setColor(darkgreen);

    for (i = 0; i < 21; i++) {
        if (balances[i][0] == 'none' && balances[i][1] == 'none') {
            continue;
        } else {
            let str = `${balances[i][0]}\n${balances[i][1]}`;
            if (str.length > 1024) str = 'way too many';
            embed.addField(`**v${i + 2}.0:**`, `${str}`);
        }
    }
    message.channel.send(embed);
}
