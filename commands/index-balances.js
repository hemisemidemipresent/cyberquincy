const { darkgreen } = require('../jsons/colours.json');
const GoogleSheetsHelper = require('../helpers/google-sheets');
const TowerParser = require('../parser/tower-parser');


module.exports = {
    name: 'balance',
    dependencies: ['btd6index'],

    aliases: ['changes', 'balances'],
    execute,
};

async function execute(message, args) {
    if (args.length == 0 || (args.length == 1 && args[0] == 'help')) {
        return helpMessage(message);
    }

    const parsed = CommandParser.parse(args, new TowerParser());

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    console.log(Aliases.allPrimaryTowers())

    return showBuffNerf(message, parsed.tower);
}

MIN_COLUMN = 'D'
MAX_COLUMN = 'AS'



async function showBuffNerf(message, tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
    // Get version number from J3
    // Load from C23 to {end_column}{C+v#}
    // Parse {column}23 until tower alias is reached
    await sheet.loadCells(`${MIN_COLUMN}23:AS44`);
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
        if (!buff) buff = 'none';
        else {
            buff = buff.replace(/✔️/g, '✅');
            buff = buff.replace(/\n\n/g, '\n');
        }
        if (!nerf) nerf = 'none';
        else {
            nerf = nerf.replace(/\n\n/g, '\n');
        }
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
