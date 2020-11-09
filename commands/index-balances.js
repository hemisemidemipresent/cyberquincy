const GoogleSheetsHelper = require('../helpers/google-sheets');

const AnyOrderParser = require('../parser/any-order-parser')
const OrParser = require('../parser/or-parser')
const OptionalParser = require('../parser/optional-parser')

const TowerParser = require('../parser/tower-parser');
const TowerPathParser = require('../parser/tower-path-parser')
const TowerUpgradeParser = require('../parser/tower-upgrade-parser')
const HeroParser = require('../parser/hero-parser');

const VersionParser = require('../parser/version-parser')

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

    entityParser = new OrParser(
        new TowerParser(),
        new TowerPathParser(),
        new TowerUpgradeParser(),
        new HeroParser()
    )

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(
            new OptionalParser(entityParser),
            new OptionalParser(new VersionParser()),
            new OptionalParser(new VersionParser())
        )
    )

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    if (parsed.version || !parsed.tower) {
        return message.channel.send('Feature in progress')
    }

    return showBuffNerf(message, parsed.tower);
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!2tc` for help', '\u200b')
        .setColor(colours['orange']);

    return message.channel.send(errorEmbed);
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!balance` HELP')
        .addField(
            '`q!balance <tower>`',
            'Get the patch notes for a given tower\n`q!balance heli`'
        )

    return message.channel.send(helpEmbed);
}

MIN_COLUMN = 'C'
MIN_ROW = 23

async function showBuffNerf(message, tower) {
    const sheet = GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
    // Get version number from J3
    await sheet.loadCells(`J3`);
    const lastUpdatedAsOf = sheet.getCellByA1(`J3`).value
    const lastUpdatedAsOfTokens = lastUpdatedAsOf.split(' ')
    const currentVersion = new Number(
        lastUpdatedAsOfTokens[lastUpdatedAsOfTokens.length - 1]
    )

    // Load from C23 to {end_column}{C+version}
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(MIN_ROW + currentVersion, sheet.columnCount)
    await sheet.loadCells(`${MIN_COLUMN}${MIN_ROW}:${bottomRightCellToBeLoaded}`);

    // Parse {column}23 until tower alias is reached
    entryColIndex = null
    const headerRowIndex = MIN_ROW - 1 
    const dartColIndex = MIN_COLUMN.charCodeAt(0) + 1 - 65;

    for (colIndex = dartColIndex; colIndex < sheet.columnCount; colIndex += 2) {
        towerHeader = sheet.getCell(headerRowIndex, colIndex).value

        if(!towerHeader) throw `Something went wrong; ${tower} couldn't be found in the headers`
        
        if(Aliases.getCanonicalForm(towerHeader) == tower) {
            entryColIndex = colIndex
            break
        }
    }

    let balances = {};
    // Iterate rows until column C no longer shows a version number
    for (row = headerRowIndex + 1; v = sheet.getCell(row, dartColIndex - 1).formattedValue; row++) {
        let buff = sheet.getCell(row, entryColIndex).note;
        let nerf = sheet.getCell(row, entryColIndex + 1).note;

        if (buff) {
            buff = buff.replace(/✔️/g, '✅');
            balances[v] = buff
        }
        if (nerf) {
            balances[v] = balances[v] ? balances[v] + "\n\n" : ""
            balances[v] += nerf
        }
    }

    formattedTower = Aliases.toIndexNormalForm(tower)

    let embed = new Discord.MessageEmbed()
        .setTitle(`Buffs and Nerfs for ${formattedTower}\n`)
        .setColor(colours['darkgreen'])
    
    for (const version in balances) {
        embed.addField(`v. ${version}`, balances[version] + "\n\u200b")
    }

    try {
        await message.channel.send(embed);
    } catch(e) {
        return message.channel.send(`Too many balance changes for ${formattedTower}; fix in progress`)
    }
}
