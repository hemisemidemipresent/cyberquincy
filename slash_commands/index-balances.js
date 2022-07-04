const {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
  } = require('@discordjs/builders');
  
const Index = require('../helpers/index.js');

const OrParser = require('../parser/or-parser');

const TowerParser = require('../parser/tower-parser');
const TowerPathParser = require('../parser/tower-path-parser');
const TowerUpgradeParser = require('../parser/tower-upgrade-parser');
const HeroParser = require('../parser/hero-parser');

const VersionParser = require('../parser/version-parser');

const Parsed = require('../parser/parsed')

const Towers = require('../helpers/towers')
  
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

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Do you need to reload completions from the index but for a much slower runtime?')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

const filterOption = new SlashCommandStringOption()
    .setName('type_filter')
    .setDescription('Which type of balance changes do you wish to include (default = all)')
    .setRequired(false)
    .addChoices(
        { name: "✅/❌", value: "✅/❌"},
        { name: "🟡/↔", value: "🟡/↔"},
    )
  
builder = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check balance history of all towers/heroes throughout versions according to index records')
    .addStringOption(entityOption)
    .addIntegerOption(version1Option)
    .addIntegerOption(version2Option)
    .addStringOption(filterOption)
    .addStringOption(reloadOption)

SYMBOL_MAPPINGS = {
    "✅": "buffs",
    "❌": "nerfs",
    "🟡": "fixes",
    "↔": "changes",
}

function parseEntity(interaction) {
    const entityParser = new OrParser(new TowerParser(), new TowerPathParser(), new TowerUpgradeParser(), new HeroParser());
    const entity = interaction.options.getString('entity');
    if (entity) {
        const canonicalEntity = Aliases.canonicizeArg(entity);
        if (canonicalEntity) {
            return CommandParser.parse([canonicalEntity], entityParser);
        } else {
            const parsed = new Parsed();
            parsed.addError('Canonical not found');
            return parsed;
        }
    } else return new Parsed();
}

function parseVersion(interaction, num) {
    const v = interaction.options.getString(`version${num}`);
    if (v) {
        return CommandParser.parse([`v${v}`], new VersionParser());
    } else return new Parsed();
}

function parseFilter(interaction) {
    const parsed = new Parsed();
    parsed.addField(
        "show", interaction.options.getString('type_filter') || "✅/❌/🟡/↔"
    )
    return parsed
}

function parseAll(interaction) {
    const parsedEntity = parseEntity(interaction)
    const parsedVersion1 = parseVersion(interaction, 1)
    const parsedVersion2 = parseVersion(interaction, 2)
    const parsedFilter = parseFilter(interaction)
    return [parsedEntity, parsedVersion1, parsedVersion2, parsedFilter]
}
  
function validateInput(interaction) {
    entityParser = new OrParser(
        new TowerParser(),
        new TowerPathParser(),
        new TowerUpgradeParser(),
        new HeroParser()
    );

    let [parsedEntity, parsedVersion1, parsedVersion2, parsedFilter] = parseAll(interaction)

    if (parsedEntity.hasErrors()) {
        return 'Entity did not match a tower/upgrade/path/hero'
    }

    if (parsedVersion1.hasErrors()) {
        return `Parsed Version 1 must be a number >= 1`;
    }

    if (parsedVersion2.hasErrors()) {
        return `Parsed Version 2 must be a number >= 1`;
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
  
    const parsed = parseAll(interaction).reduce(
        (combinedParsed, nextParsed) => combinedParsed.merge(nextParsed),
        new Parsed()
    );

    parsed.versions?.sort()

    await interaction.deferReply({ ephemeral: true });

    const forceReload = interaction.options.getString('reload') ? true : false;

    const balances = await Index.fetchInfo('balances', forceReload);

    let changesEntry;
    if (parsed.hero) {
        changesEntry = balances[parsed.hero]
    } else if (parsed.tower) {
        changesEntry = balances[parsed.tower]
    } else if (parsed.tower_upgrade) {
        changesEntry = balances[Towers.towerUpgradeToTower(parsed.tower_upgrade)]
    } else if (parsed.tower_path) {
        changesEntry = balances[Towers.towerPathToTower(parsed.tower_path)]
    }

    const filteredBalances = []
    let balanceUpgrade;
    for (const entity in balances) {
        if (entity == 'quincy') break
        const entityBalances = balances[entity].balances
        for (const version in entityBalances) {
            for (const balanceType in entityBalances[version]) {
                for (const note of entityBalances[version][balanceType]) {
                    // i.e. "🟡 3+xx blah blah blah ...""
                    const mat = note.match(/(?:✅|❌|🟡|↔) ?((?:\d|x|(?:\d\+)){3}) /)

                    if (!mat) {
                        console.log(`${entity} - ${version}`)
                        console.log(note + "\n")
                        continue
                    }

                    balanceUpgrade = mat[1]

                    if (!matchesEntity(entity, balanceUpgrade, parsed)) {
                        continue
                    }

                    // If the balance note is of regular form,
                    // matches the entity if provided,
                    // matches the version(s) if provided,
                    // and matches the balance type if provided,
                    // then add it to the list of balances to display
                    filteredBalances.push(note)
                }
            }
        }
    }
}

function matchesEntity(noteEntity, noteUpgrade, parsed) {
    if (!parsed.tower && !parsed.hero && !parsed.tower_upgrade && !parsed.tower_path) {
        return true
    }

    if (parsed.tower) {
        return noteEntity == parsed.tower
    } else if (parsed.hero) {
        return noteEntity == parsed.hero
    }

    const noteUpgrades = upgradesFromUpgradeNotation(noteUpgrade)

    let entityUpgrades;
    if (parsed.tower_upgrade) {
        entityUpgrades = [ parsed.tower_upgrade.split('#')[1] ]
    } else if (parsed.tower_path) {
        const path = parsed.tower_path.split('#')[1]
        entityUpgrades = Towers.upgradesFromPath(path)
    }

    const entityPathTiers = entityUpgrades.map(u => Towers.pathTierFromUpgradeSet(u))
    const notePathTiers = noteUpgrades.map(u => 
        Towers.pathTierFromUpgradeSet(
            u.replace(/x/g, '0')
        )
    )

    // Comparing path/tiers instead of upgrades in order to ignore crosspathing in the balance notes
    return entityPathTiers.some(pt => notePathTiers.includes(pt))
}

/**
 * 
 * @param {string} upgradeNotation The balance upgrade, such as 003 or x4+x
 * @returns All upgrades the upgrade notation represents, i.e. 003 => {003}; x4+x => {x4x, x5x} 
 */
 function upgradesFromUpgradeNotation(upgradeNotation) {
    const plusIndex = upgradeNotation.indexOf('+')

    if (plusIndex == -1) {
        return [upgradeNotation]
    }

    const upgrades = []

    let tier;
    for (tier = parseInt(upgradeNotation[plusIndex - 1]); tier <= 5; tier++) {
        upgrades.push(
            upgradeNotation.slice(0, plusIndex - 1) + `${tier}` + upgradeNotation.slice(plusIndex + 1)
        )
    }

    return upgrades
}
  
module.exports = {
    data: builder,
    execute,
};