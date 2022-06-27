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
    .addStringOption(reloadOption)
    .addStringOption(filterOption)

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

    for (const version in changesEntry) {
    }
}
  
module.exports = {
    data: builder,
    execute,
};