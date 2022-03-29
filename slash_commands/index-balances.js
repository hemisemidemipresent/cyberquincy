const {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
  } = require('@discordjs/builders');
  
const GoogleSheetsHelper = require('../helpers/google-sheets');

const OrParser = require('../parser/or-parser');

const TowerParser = require('../parser/tower-parser');
const TowerPathParser = require('../parser/tower-path-parser');
const TowerUpgradeParser = require('../parser/tower-upgrade-parser');
const HeroParser = require('../parser/hero-parser');

const VersionParser = require('../parser/version-parser');
  
const OptionalParser = require('../parser/optional-parser');

const { yellow, darkgreen } = require('../jsons/colours.json');
const isEqual = require('lodash.isequal');
  
const entityOption = new SlashCommandStringOption()
    .setName('entity')
    .setDescription('Tower/Path/Upgrade/Hero')
    .setRequired(true)
  
const version1Option = new SlashCommandIntegerOption()
    .setName('version1')
    .setDescription('Exact or Starting Version')
    .setRequired(false)
  
const version2Option = new SlashCommandIntegerOption()
    .setName('version2')
    .setDescription('End Version')
    .setRequired(false)
  
builder = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check balance history of all towers/heroes throughout versions according to index records')
    .addStringOption(entityOption)
    .addIntegerOption(version1Option)
    .addIntegerOption(version2Option)
  
function validateInput(interaction) {
      entityParser = new OrParser(
          new TowerParser(),
          new TowerPathParser(),
          new TowerUpgradeParser(),
          new HeroParser()
      );
  
      const entity = Aliases.canonicizeArg(interaction.options.getString('entity'))
      const parsedEntity = CommandParser.parse([entity], entityParser)
      if ( !(parsedEntity.tower || parsedEntity.tower_path || parsedEntity.tower_upgrade || parsedEntity.hero) ) {
          return `Entity entered does not match any towers, tower paths, tower upgrades, or heroes`
      }
  
      version1 = interaction.options.getInteger('version1')
      version2 = interaction.options.getInteger('version2')
  
      if ( version2 && !version1 ) {
          return `You entered an ending version but not a starting version`
      }
    
      if (version1 && version1 < 1) {
          return `Starting/Only version not valid`
      }
  
      if (version2 && version2 < 1) {
          return `Ending version not valid`
      }

      if (version1 && version2 && version1 >= version2) {
          return `Ending version must be larger than starting version`
      }
  }
  
  async function execute(interaction) {
    validationFailure = validateInput(interaction);
    if (validationFailure) {
        return interaction.reply({
            content: validationFailure,
            ephemeral: true,
        })
    }
  
    entityParser = new OrParser(
        new TowerParser(),
        new TowerPathParser(),
        new TowerUpgradeParser(),
        new HeroParser()
    );

    // Re-using the old infrastructure to make porting much easier
    args = [
        Aliases.canonicizeArg(interaction.options.getString('entity')),
        'v' + String(interaction.options.getInteger('version1')),
        'v' + String(interaction.options.getInteger('version2')),
    ].filter(arg => arg)
  
    const parsed = CommandParser.parse(
        args,
        entityParser,
        new OptionalParser(new VersionParser()),
        new OptionalParser(new VersionParser())
    );

    // Towers might take a while
    interaction.deferReply({ ephemeral: true });
  
    await loadEntityBuffNerfsTableCells(parsed);
    if (!parsed.hero) await loadTowerChangesTableCells(parsed);
    colIndex = await locateSpecifiedEntityColumnIndex(parsed);
  
    let [versionAdded, balanceChanges] = await parseBalanceChanges(
        parsed,
        colIndex
    );
    return await formatAndDisplayBalanceChanges(
        interaction,
        parsed,
        versionAdded,
        balanceChanges
    );
  }
  
async function loadEntityBuffNerfsTableCells(parsed) {
    let sheet = getSheet(parsed);
    const currentVersion = await parseCurrentVersion(parsed);
  
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(
        headerRow(parsed) + currentVersion - 1,
        sheet.columnCount
    );
    await sheet.loadCells(
        `${VERSION_COLUMN}${headerRow(parsed)}:${bottomRightCellToBeLoaded}`
    );
  }
  
async function loadTowerChangesTableCells(parsed) {
    let sheet = getSheet(parsed);
    const currentVersion = await parseCurrentVersion(parsed);
  
    const hrow = await towerChangesHeaderRow(parsed);
  
    bottomRightCellToBeLoaded = GoogleSheetsHelper.rowColToA1(
        hrow + currentVersion - 1,
        sheet.columnCount
    );
    await sheet.loadCells(
        `${VERSION_COLUMN}${hrow}:${bottomRightCellToBeLoaded}`
    );
  }
  
async function locateSpecifiedEntityColumnIndex(parsed) {
    const sheet = getSheet(parsed);
  
    // Parse {column}{headerRow} until tower alias is reached
    for (
        colIndex =
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN) + 1;
        colIndex < sheet.columnCount;
        colIndex += 2
    ) {
        towerHeader = sheet.getCell(headerRow(parsed) - 1, colIndex).value;
  
        if (!towerHeader)
            throw `Something went wrong; ${parsedEntity(
                parsed
            )} couldn't be found in the headers`;
  
        canonicalHeader = Aliases.getCanonicalForm(towerHeader);
        if (parsed.tower && parsed.tower == canonicalHeader) {
            return colIndex;
        } else if (
            parsed.tower_path &&
            parsed.tower_path.split('#')[0] == canonicalHeader
        ) {
            return colIndex;
        } else if (
            parsed.tower_upgrade &&
            Towers.towerUpgradeToTower(parsed.tower_upgrade) == canonicalHeader
        ) {
            return colIndex;
        } else if (parsed.hero && parsed.hero == canonicalHeader) {
            return colIndex;
        }
    }
  }
  
function headerRow(parsed) {
    return parsed.hero ? 18 : 23;
}
  
async function towerChangesHeaderRow(parsed) {
    return (await parseCurrentVersion(parsed)) + headerRow(parsed) + 2;
}
  
VERSION_COLUMN = 'C';
  
function getSheet(parsed) {
    if (parsed.hero) return heroesSheet();
    else return towersSheet();
}
  
function towersSheet() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'Towers');
}
  
function heroesSheet() {
    return GoogleSheetsHelper.sheetByName(Btd6Index, 'Heroes');
}
  
function parsedEntity(parsed) {
    if (parsed.hero) return parsed.hero;
    else if (parsed.tower) return parsed.tower;
    else if (parsed.tower_upgrade) return parsed.tower_upgrade;
    else if (parsed.tower_path) return parsed.tower_path;
}
  
async function parseCurrentVersion(parsed) {
    let sheet = getSheet(parsed);
  
    // Get version number from J3
    await sheet.loadCells(`J3`);
    const lastUpdatedAsOf = sheet.getCellByA1(`J3`).value;
    const lastUpdatedAsOfTokens = lastUpdatedAsOf.split(' ');
    version = lastUpdatedAsOfTokens[lastUpdatedAsOfTokens.length - 1];
    return Math.floor(new Number(version));
}
  
async function parseBalanceChanges(parsed, entryColIndex) {
    const sheet = getSheet(parsed);
    const currentVersion = await parseCurrentVersion(parsed);
  
    let versionAdded = null;
  
    let towerChangesOffset;
    if (!parsed.hero)
        towerChangesOffset =
            (await towerChangesHeaderRow(parsed)) - headerRow(parsed);
  
    let balances = {};
    // Iterate for currentVersion - 1 rows since there's no row for v1.0
    for (
        rowIndex = headerRow(parsed);
        rowIndex <= headerRow(parsed) + currentVersion - 2;
        rowIndex++
    ) {
        v = sheet.getCell(
            rowIndex,
            GoogleSheetsHelper.getColumnIndexFromLetter(VERSION_COLUMN)
        ).formattedValue;
  
        let buff = sheet.getCell(rowIndex, entryColIndex).note;
        buff = filterChangeNotes(buff, v, parsed);
  
        let nerf = sheet.getCell(rowIndex, entryColIndex + 1).note;
        nerf = filterChangeNotes(nerf, v, parsed);
  
        let fix, change;
  
        if (!parsed.hero) {
            const changesRowIndex = rowIndex + towerChangesOffset;
  
            fix = sheet.getCell(changesRowIndex, entryColIndex).note;
            fix = filterChangeNotes(fix, v, parsed);
            change = sheet.getCell(changesRowIndex, entryColIndex + 1).note;
            change = filterChangeNotes(change, v, parsed);
        }
  
        // The version added is the first non-greyed out row for the column
        if (
            !versionAdded &&
            sheet.getCell(rowIndex, entryColIndex).effectiveFormat &&
            !isEqual(
                sheet.getCell(rowIndex, entryColIndex).effectiveFormat
                    .backgroundColor,
                { red: 0.6, green: 0.6, blue: 0.6 }
            )
        ) {
            versionAdded = v;
        }
  
        if (buff) {
            buff = buff.replace(/✔️/g, '✅');
            balances[v] = buff;
        }
        if (nerf) {
            balances[v] = balances[v] ? balances[v] + '\n\n' : '';
            balances[v] += nerf;
        }
        if (fix) {
            balances[v] = balances[v] ? balances[v] + '\n\n' : '';
            balances[v] += fix;
        }
        if (change) {
            balances[v] = balances[v] ? balances[v] + '\n\n' : '';
            balances[v] += change;
        }
    }
  
    if (versionAdded === '2.0') versionAdded = '1.0';
  
    return [versionAdded, balances];
  }
  
  function filterChangeNotes(noteSet, v, parsed) {
    if (!noteSet) return null;
  
    const version = Number(v);
    if (parsed.versions) {
        if (parsed.versions.length == 2) {
            const [minV, maxV] = parsed.versions.sort(
                (a, b) => Number(a) - Number(b)
            );
            if (version < Number(minV) || version > Number(maxV)) return null;
        } else if (parsed.versions.length == 1) {
            if (version !== Number(parsed.version)) return null;
        }
    }
  
    // TODOS:
    // - 4+xx format
    const notes = noteSet.split('\n\n').filter((note) => {
        if (parsed.tower) return true;
        else if (parsed.hero) return true;
        else {
            const upgradeSet = note
                .replace(/✔️|❌/g, '')
                .trim()
                .split(' ')[0]
                .replace(/x/gi, '0');
            if (!Towers.isValidUpgradeSet(upgradeSet))
                return handleIrregularNote(note, parsed);
  
            const [path, tier] = Towers.pathTierFromUpgradeSet(upgradeSet);
            if (parsed.tower_path) {
                const parsedPath = parsed.tower_path.split('#')[1];
  
                return (
                    Aliases.getCanonicalForm(
                        [null, 'top', 'mid', 'bot'][path]
                    ) == parsedPath
                );
            } else if (parsed.tower_upgrade) {
                const parsedUpgradeSet = parsed.tower_upgrade.split('#')[1];
                const [parsedPath, parsedTier] =
                    Towers.pathTierFromUpgradeSet(parsedUpgradeSet);
                return parsedPath == path && parsedTier == tier;
            }
        }
    });
  
    return notes.length > 0 ? notes.join('\n') : null;
}
  
function handleIrregularNote(note, parsed) {
    // TODO: Handle non-standard notes rather than always just not including them
    return false;
}
  
async function formatAndDisplayBalanceChanges(
    interaction,
    parsed,
    versionAdded,
    balances
) {
    const formattedEntity = Towers.formatEntity(
        parsed.tower || parsed.tower_upgrade || parsed.tower_path || parsed.hero
    );
  
    if (Object.keys(balances).length == 0) {
        let versionText = '';
        if (parsed.versions && parsed.versions.length == 2) {
            const sortedVersions = parsed.versions.sort((a, b) => Number(a) - b);
            versionText = ` between ${sortedVersions
                .map((v) => `v${v}`)
                .join(' & ')}`;
        } else if (parsed.versions) {
            versionText = ` in v${parsed.version}`;
        }
        return interaction.editReply({
            embeds: [
                new Discord.MessageEmbed()
                    .setTitle(
                        `No patch notes found for ${formattedEntity}${versionText}`
                    )
                    .setColor(yellow),
            ],
        });
    }
  
    let addedText = `**Added in ${versionAdded}**`;
  
    if (parsed.tower_upgrade == 'wizard_monkey#005')
        addedText = `Reworked from Soulbind in 2.0`;
  
    let embed = new Discord.MessageEmbed()
        .setTitle(`Buffs and Nerfs for ${formattedEntity}`)
        .setDescription(addedText)
        .setColor(darkgreen);
  
    for (const version in balances) {
        embed.addField(`v. ${version}`, balances[version] + '\n\u200b');
    }
  
    try {
        await interaction.editReply({ embeds: [embed] });
    } catch (e) {
        return interaction.editReply({
            content: `Too many balance changes for ${formattedEntity}; Try a more narrow search using a more specific entity or by incorporating version limits`
        });
    }
}
  
module.exports = {
    data: builder,
    execute,
};