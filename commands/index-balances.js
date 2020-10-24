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

    return showBuffNerf(message, parsed.tower);
}

MIN_COLUMN = 'D'
MIN_ROW = 23

async function showBuffNerf(message, tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
    // Get version number from J3
    await sheet.loadCells(`J3`);
    const lastUpdatedAsOf = sheet.getCellByA1(`J3`).value
    const lastUpdatedAsOfTokens = lastUpdatedAsOf.split(' ')
    const currentVersion = parseInt(
        lastUpdatedAsOfTokens[lastUpdatedAsOfTokens.length - 1].split('.')[0]
    )

    // Load from C23 to {end_column}{C+version}
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(MIN_ROW + currentVersion, sheet.columnCount)
    await sheet.loadCells(`${MIN_COLUMN}${MIN_ROW}:${bottomRightCellToBeLoaded}`);

    // Parse {column}23 until tower alias is reached
    entryColIndex = null
    const headerRowInex = MIN_ROW - 1 
    const minColIndex = MIN_COLUMN.charCodeAt(0) - 65;

    for (colIndex = minColIndex; colIndex < sheet.columnCount; colIndex += 2) {
        towerHeader = sheet.getCell(headerRowInex, colIndex).value

        if(!towerHeader) throw `Something went wrong; ${tower} couldn't be found in the headers`
        
        if(Aliases.getCanonicalForm(towerHeader) == tower) {
            entryColIndex = colIndex
            break
        }
    }

    let balances = [];
    for (row = headerRowInex + 1; row < headerRowInex + 1 + currentVersion; row++) {
        let buff = sheet.getCell(row, entryColIndex).note;
        let nerf = sheet.getCell(row, entryColIndex + 1).note;

        if (buff) {
            buff = buff.replace(/✔️/g, '✅');
            buff = buff.replace(/\n\n/g, '\n');
        }
        balances.push(buff)
        if (nerf) {
            nerf = nerf.replace(/\n\n/g, '\n');
        }
        balances.push(nerf);
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
