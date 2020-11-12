const GoogleSheetsHelper = require('../helpers/google-sheets');

const AnyOrderParser = require('../parser/any-order-parser')
const OrParser = require('../parser/or-parser')
const OptionalParser = require('../parser/optional-parser')

const TowerParser = require('../parser/tower-parser');
const TowerPathParser = require('../parser/tower-path-parser')
const TowerUpgradeParser = require('../parser/tower-upgrade-parser')

const VersionParser = require('../parser/version-parser');

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
        new TowerUpgradeParser()
    )

    const parsed = CommandParser.parse(
        args,
        new AnyOrderParser(
            entityParser,
            new OptionalParser(new VersionParser(2, null, false)),
            new OptionalParser(new VersionParser(3, null, false))
        )
    )

    if (parsed.hasErrors()) {
        return errorMessage(message, parsed.parsingErrors);
    }

    await loadTowerBuffNerfsTableCells()
    colIndex = await locateSpecifiedTowerColumnIndex(parsed)
    balanceChanges = await parseBalanceChanges(parsed, colIndex)
    return await formatAndDisplayBalanceChanges(message, parsed, balanceChanges)
}

async function loadTowerBuffNerfsTableCells() {
    const sheet = towersSheet();
    const currentVersion = await parseCurrentVersion();

    // Load from C23 to {end_column}{C+version}
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(HEADER_ROW + currentVersion - 1, sheet.columnCount)
    await sheet.loadCells(`${VERSION_COLUMN}${HEADER_ROW}:${bottomRightCellToBeLoaded}`);
}

async function locateSpecifiedTowerColumnIndex(parsed) {
    const sheet = towersSheet();

    // Parse {column}23 until tower alias is reached
    for (colIndex = GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN) + 1; colIndex < sheet.columnCount; colIndex += 2) {
        towerHeader = sheet.getCell(HEADER_ROW - 1, colIndex).value

        if(!towerHeader) throw `Something went wrong; ${parsed.tower} couldn't be found in the headers`
        
        canonicalHeader = Aliases.getCanonicalForm(towerHeader)
        if (parsed.tower && parsed.tower == canonicalHeader) {
            return colIndex
        } else if (parsed.tower_path && parsed.tower_path.split('#')[0] == canonicalHeader) {
            return colIndex
        } else if (parsed.tower_upgrade && Towers.towerUpgradeToTower(parsed.tower_upgrade) == canonicalHeader) {
            return colIndex
        }
    }
}

VERSION_COLUMN = 'C'
HEADER_ROW = 23

function towersSheet() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
}

async function parseCurrentVersion() {
    const sheet = towersSheet();

    // Get version number from J3
    await sheet.loadCells(`J3`);
    const lastUpdatedAsOf = sheet.getCellByA1(`J3`).value
    const lastUpdatedAsOfTokens = lastUpdatedAsOf.split(' ')
    return new Number(
        lastUpdatedAsOfTokens[lastUpdatedAsOfTokens.length - 1]
    )
}

async function parseBalanceChanges(parsed, entryColIndex) {
    const sheet = towersSheet();
    const currentVersion = await parseCurrentVersion();

    let balances = {};
    // Iterate for currentVersion - 1 rows since there's no row for v1.0
    for (rowIndex = HEADER_ROW; rowIndex <= HEADER_ROW + currentVersion - 2; rowIndex++) {
        v = sheet.getCell(rowIndex, GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)).formattedValue

        let buff = sheet.getCell(rowIndex, entryColIndex).note;
        buff = filterChangeNotes(buff, v, parsed)

        let nerf = sheet.getCell(rowIndex, entryColIndex + 1).note;
        nerf = filterChangeNotes(nerf, v, parsed)

        if (buff) {
            buff = buff.replace(/✔️/g, '✅');
            balances[v] = buff
        }
        if (nerf) {
            balances[v] = balances[v] ? balances[v] + "\n\n" : ""
            balances[v] += nerf
        }
    }

    return balances
}

function filterChangeNotes(noteSet, v, parsed) {
    if (!noteSet) return null;

    const version = Number(v)
    if (parsed.versions) {
        if (parsed.versions.length == 2) {
            const [minV, maxV] = parsed.versions.sort((a, b) => Number(a) - Number(b))
            if (version < Number(minV) || version > Number(maxV)) return null;
        } else if (parsed.versions.length == 1) {
            if (version !== Number(parsed.version)) return null;
        }
    }

    // TODOS:
    // - 4+xx format
    // - xxx
    // - Ask index maintainers to prepend ALL patch notes with {symbol} XYZ
    const notes = noteSet.split("\n\n").filter(note => {
        if (parsed.tower) return true;
        else {
            const upgradeSet = note.replace(/✔️|❌/g, "").trim().split(" ")[0].replace(/x/gi, '0')
            if (!Towers.isValidUpgradeSet(upgradeSet)) return handleIrregularNote(note, parsed)

            const [path, tier] = Towers.pathTierFromUpgradeSet(upgradeSet)
            if (parsed.tower_path) {
                const parsedPath = parsed.tower_path.split("#")[1]

                return Aliases.getCanonicalForm(
                    [null, "top", "mid", "bot"][path]
                ) == parsedPath
            } else if (parsed.tower_upgrade) {
                const parsedUpgradeSet = parsed.tower_upgrade.split("#")[1]
                const [parsedPath, parsedTier] = Towers.pathTierFromUpgradeSet(parsedUpgradeSet)
                return parsedPath == path && parsedTier == tier
            }
        }
    })

    return notes.length > 0 ? notes.join("\n") : null
}

function handleIrregularNote(note, parsed) {
    // TODO: Handle non-standard notes rather than always just not including them
    return false
}

async function formatAndDisplayBalanceChanges(message, parsed, balances) {
    formattedTower = Towers.formatTower(parsed.tower || parsed.tower_upgrade || parsed.tower_path)

    if(Object.keys(balances).length == 0) {
        versionText = ""
        if (parsed.versions && parsed.versions.length == 2) {
            sortedVersions = parsed.versions.sort((a, b) => Number(a) - (b))
            versionText = ` between ${sortedVersions.map(v => `v${v}`).join(" & ")}`
        } else if (parsed.versions) {
            versionText = ` in v${parsed.version}`
        }
        return message.channel.send(
            new Discord.MessageEmbed()
                .setTitle(`No patch notes found for ${formattedTower}${versionText}`)
                .setColor(colours['yellow'])
        )
    }

    let embed = new Discord.MessageEmbed()
        .setTitle(`Buffs and Nerfs for ${formattedTower}`)
        .setColor(colours['darkgreen'])
    
    for (const version in balances) {
        embed.addField(`v. ${version}`, balances[version] + "\n\u200b")
    }

    try {
        await message.channel.send(embed);
    } catch(e) {
        return message.channel.send(`Too many balance changes for ${formattedTower}; Try a more narrow search. Type \`q!balance\` for details.`)
    }
}

function errorMessage(message, parsingErrors) {
    let errorEmbed = new Discord.MessageEmbed()
        .setTitle('ERROR')
        .addField(
            'Likely Cause(s)',
            parsingErrors.map((msg) => ` • ${msg}`).join('\n')
        )
        .addField('Type `q!balance` for help', '\u200b')
        .setColor(colours['orange'])
        .setFooter('Currently t1 and t2 towers are not searchable on their own. Fix coming')

    return message.channel.send(errorEmbed);
}

function helpMessage(message) {
    let helpEmbed = new Discord.MessageEmbed()
        .setTitle('`q!balance` HELP')
        .addField(
            '`q!balance <tower/tower_path/tower_upgrade>`',
            'Get the patch notes for a given tower\n`q!balance heli\nq!balance wiz#middle-path\nq!balance icicle_impale`'
        )
        .addField(
            'Incorporate a version, or two to specify a range',
            '`q!balance sub#mid v15 v18`'
        )
        .setFooter('Currently t1 and t2 towers are not searchable on their own. Fix coming')

    return message.channel.send(helpEmbed);
}
