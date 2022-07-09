const {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandIntegerOption,
} = require('@discordjs/builders');

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

const { cyber } = require('../jsons/colours.json')

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
    .setRequired(false)

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
        { name: "✅/❌", value: "✅/❌" },
        { name: "🟡/🟦", value: "🟡/🟦" },
        { name: "✅", value: "✅" },
        { name: "❌", value: "❌" },
        { name: "🟡", value: "🟡" },
        { name: "🟦", value: "🟦" },
    )

builder = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check balance history of all towers/heroes throughout versions according to index records')
    .addStringOption(entityOption)
    .addIntegerOption(version1Option)
    .addIntegerOption(version2Option)
    .addStringOption(filterOption)
    .addStringOption(reloadOption)

const BALANCE_TYPE_MAPPINGS = {
    "✅": 'Buffs',
    "❌": 'Nerfs',
    "⚠️": 'Fixes',
    "↔": 'Changes',
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
    const v = interaction.options.getInteger(`version${num}`);
    if (v) {
        return CommandParser.parse([`v${v}`], new VersionParser(2));
    } else return new Parsed();
}

function parseFilter(interaction) {
    const parsed = new Parsed();
    adjustedTypeFilter = interaction.options.getString('type_filter')?.replace('🟡', '⚠️')?.replace('🟦', '↔')
    parsed.addField(
        "balance_filter", adjustedTypeFilter
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
        return `Parsed Version 1 must be a number >= 2`;
    }

    if (parsedVersion2.hasErrors()) {
        return `Parsed Version 2 must be a number >= 2`;
    }
}

async function execute(interaction) {
    const validationFailure = validateInput(interaction);
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

    parsed.versions?.sort(function (v1, v2) {
        return parseInt(v1) - parseInt(v2)
    })

    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const balances = await Index.fetchInfo('balances', forceReload);

    const filteredBalances = {}
    let balanceTowerUpgrade, balanceSymbol, versionNumber;
    for (const entity in balances) {
        const entityBalances = balances[entity].balances
        for (const version in entityBalances) {
            for (const balanceType in entityBalances[version]) {
                for (const note of entityBalances[version][balanceType]) {
                    // "⚠️ 3+xx blah blah blah ..."
                    // or for heroes "⚠️ blah blah blah"
                    // there is some safeguarding against extra or not enough spaces
                    const mat = note.match(/(✅|❌|⚠️|↔)? *(?:((?:\d|x|(?:\d\+)){3}) )?/)

                    // Will be undefined for hero
                    balanceTowerUpgrade = mat?.[2]

                    if (!matchesEntity(entity, balanceTowerUpgrade, parsed)) {
                        continue
                    }

                    versionNumber = parseInt(version)

                    if (!matchesVersions(versionNumber, parsed)) {
                        continue
                    }

                    balanceSymbol = mat[1]

                    if (!matchesBalanceType(balanceSymbol, parsed)) {
                        continue
                    }

                    // If the balance note is of regular form,
                    // matches the entity if provided,
                    // matches the version(s) if provided,
                    // and matches the balance type if provided,
                    // then add it to the list of balances to display
                    filteredBalances[versionNumber] ||= {}
                    filteredBalances[versionNumber][entity] ||= []
                    filteredBalances[versionNumber][entity].push(note)
                }
            }
        }
    }

    const pages = paginateBalances(filteredBalances, parsed)

    let addedVersion = null
    if (hasEntity(parsed) && pages.length > 0) {
        const soleEntity = Object.keys(filteredBalances[Object.keys(filteredBalances)[0]])[0]
        addedVersion = balances[soleEntity]?.versionAdded
    }

    displayPages(interaction, pages, addedVersion, parsed)
}

function paginateBalances(balances, parsed) {
    const pages = []
    let page = {}
    let header;
    let pageLength = 0;
    let field = ""

    const sortedVersions = Object.keys(balances).sort(function (v1, v2) {
        return parseInt(v1) - parseInt(v2)
    })

    for (const version of sortedVersions) {
        for (const entity in balances[version]) {
            // HEADER
            if (parsed.versions?.length == 1) {
                if (hasEntity(parsed)) {
                    header = `v${version} — ${Aliases.toIndexNormalForm(entity)}`
                } else {
                    header = Aliases.toIndexNormalForm(entity)
                }
            } else {
                if (hasEntity(parsed)) {
                    header = `v${version}`
                } else {
                    header = `v${version} — ${Aliases.toIndexNormalForm(entity)}`
                }
            }

            // FIELD
            for (const note of balances[version][entity]) {
                field += note + "\n"
                // PAGE TURNING
                if (pageLength + header.length + field.length > 750) {
                    page[header] = field
                    pages.push(page)
                    page = {}
                    pageLength = 0
                    field = ""
                    if (!header.endsWith(' (cont.)')) {
                        header += ' (cont.)'
                    }
                }
            }

            // ADD HEADER+FIELD TO PAGE
            if (field.length > 0) {
                page[header] = field
                field = ""
                pageLength = Object.entries(page).map((h, f) => h + f).join("").length
            }
        }
    }

    if (Object.keys(page).length > 0) {
        pages.push(page)
    }

    return pages
}

function hasEntity(parsed) {
    return parsed.tower || parsed.hero || parsed.tower_upgrade || parsed.tower_path
}

const multipageButtons = [
    new MessageButton().setCustomId('first').setLabel('⏪').setStyle('PRIMARY'),
    new MessageButton().setCustomId('prev!').setLabel('⬅️').setStyle('PRIMARY'),
    new MessageButton().setCustomId('pg').setLabel('FILL_ME_IN').setStyle('SECONDARY').setDisabled(true),
    new MessageButton().setCustomId('next!').setLabel('➡️').setStyle('PRIMARY'),
    new MessageButton().setCustomId('last').setLabel('⏩').setStyle('PRIMARY'),
];

function displayPages(interaction, pages, versionAdded, parsed) {
    pageIdx = 0
    let embed;

    let includedButtons;
    if (pages.length <= 1) {
        includedButtons = []
    } else if (pages.length < 5) {
        includedButtons = multipageButtons.filter(b => b.customId.endsWith('!') || b.style == 'SECONDARY')
    } else {
        includedButtons = multipageButtons.filter(b => true)
    }

    let displayedButtons;

    async function embedPage() {
        const embed = new MessageEmbed()
            .setTitle(title(parsed, pages.length > 0))
            .setColor(cyber)

        if (versionAdded) {
            embed.setDescription(`**Added in v${parseInt(versionAdded)}**`)
        }

        for (const header in pages[pageIdx]) {
            embed.addField(`**${header}**`, pages[pageIdx][header])
        }

        if (includedButtons.length > 0) {
            includedButtons.find(b => b.disabled).setLabel(`${pageIdx + 1}/${pages.length}`)
        }

        displayedButtons = new MessageActionRow().addComponents(...includedButtons)

        await interaction.editReply({
            embeds: [embed],
            components: includedButtons.length > 0 ? [displayedButtons] : [],
        });

        const filter = (selection) => {
            // Ensure user clicking button is same as the user that started the interaction
            if (selection.user.id !== interaction.user.id) {
                return false;
            }
            // Ensure that the button press corresponds with this interaction and wasn't
            // a button press on the previous interaction
            if (selection.message.interaction.id !== interaction.id) {
                return false;
            }
            return true;
        };

        if (pages.length == 1) return

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: 'BUTTON',
            time: 60000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            switch (buttonInteraction.customId) {
                case "first":
                    pageIdx = 0
                    break
                case "prev!":
                    pageIdx = ((pageIdx - 1) + pages.length) % pages.length
                    break
                case "next!":
                    pageIdx = (pageIdx + 1) % pages.length
                    break
                case "last":
                    pageIdx = pages.length - 1
                    break
            }

            await embedPage()
        });

        collector.on('end', async (collected) => {
            if (collected.size == 0) {
                await interaction.editReply({
                    embeds: [embed],
                    components: []
                });
            }
        });
    }

    embedPage()
}

function title(parsed, hasResults=true) {
    let title = hasResults ? "All " : "No "

    if (parsed.balance_filter) {
        title += parsed.balance_filter.split('/').map(bf => BALANCE_TYPE_MAPPINGS[bf]).join('/')
    } else {
        title += "Balance Changes"
    }

    if (!hasResults) title += ' Found'

    if (hasEntity(parsed)) {
        title += ` for ${Towers.formatEntity(parsed.tower || parsed.hero || parsed.tower_upgrade || parsed.tower_path)}`
    }

    if (parsed.versions?.length == 1) {
        title += ` in v${parsed.version}`
    } else if (parsed.versions?.length == 2) {
        title += ` between v${parsed.versions[0]} and v${parsed.versions[1]}`
    }

    return title
}

function matchesEntity(noteEntity, noteUpgrade, parsed) {
    // If no entity is provided, don't filter by entity
    if (!hasEntity(parsed)) {
        return true
    }

    if (parsed.tower) {
        return noteEntity == parsed.tower
    } else if (parsed.hero) {
        return noteEntity == parsed.hero
    }

    // TODO: add paragons to tower aliases
    if (!noteUpgrade || ['555', '600'].includes(noteUpgrade)) return false

    const noteUpgrades = upgradesFromUpgradeNotation(noteUpgrade)

    if (noteUpgrades.some(u => u.length > 3)) {
        console.log("Very irregular upgrade")
        return false
    }

    let entityUpgrades;
    if (parsed.tower_upgrade) {
        if (Towers.towerUpgradeToTower(parsed.tower_upgrade) != noteEntity) {
            return false
        }
        entityUpgrades = [
            Towers.towerUpgradeToUpgrade(parsed.tower_upgrade)
        ]
    } else if (parsed.tower_path) {
        if (Towers.towerPathToTower(parsed.tower_path) != noteEntity) {
            return false
        }
        entityUpgrades = Towers.upgradesFromPath(
            Towers.towerPathtoPath(parsed.tower_path)
        )
    }

    const entityPathTiers = entityUpgrades.map(u => Towers.pathTierFromUpgradeSet(u))
    const notePathTiers = noteUpgrades.map(u =>
        Towers.pathTierFromUpgradeSet(
            u.replace(/x/g, '0')
        )
    )

    // Comparing path/tiers instead of upgrades in order to ignore crosspathing in the balance notes
    return entityPathTiers.some(pt =>
        notePathTiers.some(npt =>
            pt[0] == npt[0] && pt[1] == npt[1]
        )
    )
}

function matchesVersions(noteVersion, parsed) {
    if (!parsed.versions) return true

    if (parsed.versions.length == 1) {
        return parseInt(noteVersion) == parseInt(parsed.version)
    }

    return parseInt(noteVersion) >= parseInt(parsed.versions[0]) && parseInt(noteVersion) <= parseInt(parsed.versions[1])
}

function matchesBalanceType(noteSymbol, parsed) {
    if (!parsed.balance_filter) return true
    
    return parsed.balance_filter.split("/").includes(noteSymbol)
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