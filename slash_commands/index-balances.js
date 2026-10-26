const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption, ComponentType } = require('discord.js');
const Aliases = require('../aliases');

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');

const { cyber } = require('../jsons/colors.json');

const Index = require('../helpers/index.js');
const Towers = require('../helpers/towers');

const entityOption = new SlashCommandStringOption()
    .setName('entity')
    .setDescription('Tower/Path/Upgrade/Hero')
    .setRequired(false);

const version1Option = new SlashCommandIntegerOption()
    .setName('version1')
    .setDescription('Exact or Starting Version')
    .setRequired(false);

const version2Option = new SlashCommandIntegerOption().setName('version2').setDescription('End Version').setRequired(false);

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
        { name: '✅/❌', value: '✅/❌' },
        { name: '🛠️/🔄', value: '🛠️/🔄' },
        { name: '✅', value: '✅' },
        { name: '❌', value: '❌' },
        { name: '🛠️', value: '🛠️' },
        { name: '🔄', value: '🔄' }
    );

builder = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check balance history of all towers/heroes throughout versions according to index records')
    .addStringOption(entityOption)
    .addIntegerOption(version1Option)
    .addIntegerOption(version2Option)
    .addStringOption(filterOption)
    .addStringOption(reloadOption);

const BALANCE_TYPE_MAPPINGS = {
    '✅': 'Buffs',
    '❌': 'Nerfs',
    '🛠️': 'Fixes',
    '🔄': 'Changes'
};

// Returns either { error } or { input }; `entity` is a { kind, canonical } lookup result or null,
// `versions` holds 0-2 version numbers as strings in ascending order
function readInput(interaction) {
    const entityArg = interaction.options.getString('entity');
    let entity = null;
    if (entityArg) {
        entity = Towers.lookupTowerEntity(entityArg, { allowTowerPaths: true });
        if (!entity) return { error: 'Entity did not match a tower/upgrade/path/hero' };
    }

    const versions = [];
    for (const num of [1, 2]) {
        const v = interaction.options.getInteger(`version${num}`);
        if (!v) continue;
        // Versions are written v#{#.#}, so at most 3 digits
        if (v < 2 || v > 999) return { error: `Parsed Version ${num} must be a number >= 2` };
        versions.push(String(v));
    }
    versions.sort((v1, v2) => parseInt(v1) - parseInt(v2));

    const balanceFilter = interaction.options.getString('type_filter')?.replace('🟡', '⚠️')?.replace('🟦', '↔') || null;

    return { input: { entity, versions, balanceFilter } };
}

async function execute(interaction) {
    const { error, input } = readInput(interaction);
    if (error) {
        return await interaction.reply({
            content: error,
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply();

    const forceReload = interaction.options.getString('reload') ? true : false;

    const balances = await Index.fetchInfo('balances', forceReload);

    const filteredBalances = {};
    let balanceTowerUpgrade, balanceSymbol, versionNumber;
    for (const entity in balances) {
        const entityBalances = balances[entity].balances;
        for (const version in entityBalances) {
            for (const balanceType in entityBalances[version]) {
                for (const note of entityBalances[version][balanceType]) {
                    // "✅ 3+xx blah blah blah ..."
                    // or for heroes "✅ blah blah blah"
                    // there is some safeguarding against extra or not enough spaces
                    const mat = note.match(/(✅|❌|🛠️|🔄)? *(?:((?:\d|x|(?:\d\+)){3}) )?/);

                    // Will be undefined for hero
                    balanceTowerUpgrade = mat?.[2];

                    if (!matchesEntity(entity, balanceTowerUpgrade, input)) {
                        continue;
                    }

                    versionNumber = parseInt(version);

                    if (!matchesVersions(versionNumber, input)) {
                        continue;
                    }

                    balanceSymbol = mat[1];

                    // needs to change based on balance type
                    if (!matchesBalanceType(balanceSymbol, input)) {
                        continue;
                    }

                    // If the balance note is of regular form,
                    // matches the entity if provided,
                    // matches the version(s) if provided,
                    // and matches the balance type if provided,
                    // then add it to the list of balances to display
                    filteredBalances[versionNumber] ||= {};
                    filteredBalances[versionNumber][entity] ||= [];
                    filteredBalances[versionNumber][entity].push(note);
                }
            }
        }
    }

    const pages = paginateBalances(filteredBalances, input);

    let addedVersion = null;
    if (input.entity && pages.length > 0) {
        const soleEntity = Object.keys(filteredBalances[Object.keys(filteredBalances)[0]])[0];
        addedVersion = balances[soleEntity]?.versionAdded;
    }

    await displayPages(interaction, pages, addedVersion, input);
}

function paginateBalances(balances, input) {
    const pages = [];
    let page = {};
    let header;
    let pageLength = 0;
    let field = '';

    const sortedVersions = Object.keys(balances).sort(function (v1, v2) {
        return parseInt(v1) - parseInt(v2);
    });

    for (const version of sortedVersions) {
        for (const entity in balances[version]) {
            // HEADER
            if (input.versions.length == 1) {
                if (input.entity) {
                    header = `v${version} — ${Aliases.toIndexNormalForm(entity)}`;
                } else {
                    header = Aliases.toIndexNormalForm(entity);
                }
            } else {
                if (input.entity) {
                    header = `v${version}`;
                } else {
                    header = `v${version} — ${Aliases.toIndexNormalForm(entity)}`;
                }
            }

            // FIELD
            for (const note of balances[version][entity]) {
                field += note + '\n';
                // PAGE TURNING
                if (pageLength + header.length + field.length > 750) {
                    page[header] = field;
                    pages.push(page);
                    page = {};
                    pageLength = 0;
                    field = '';
                    if (!header.endsWith(' (cont.)')) {
                        header += ' (cont.)';
                    }
                }
            }

            // ADD HEADER+FIELD TO PAGE
            if (field.length > 0) {
                page[header] = field;
                field = '';
                pageLength = Object.entries(page)
                    .map((h, f) => h + f)
                    .join('').length;
            }
        }
    }

    if (Object.keys(page).length > 0) {
        pages.push(page);
    }

    return pages;
}

const multipageButtons = [
    new ButtonBuilder().setCustomId('first').setLabel('⏪').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('prev!').setLabel('⬅️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('pg').setLabel('FILL_ME_IN').setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId('next!').setLabel('➡️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('last').setLabel('⏩').setStyle(ButtonStyle.Primary)
];

async function displayPages(interaction, pages, versionAdded, input) {
    pageIdx = 0;
    let embed;

    let includedButtons;
    if (pages.length <= 1) {
        includedButtons = [];
    } else if (pages.length < 5) {
        includedButtons = multipageButtons.filter((b) => {
            return b.data.custom_id.endsWith('!') || b.data.style == ButtonStyle.Secondary;
        });
    } else {
        includedButtons = multipageButtons;
    }

    let displayedButtons;

    async function embedPage() {
        embed = new EmbedBuilder().setTitle(title(input, pages.length > 0)).setColor(cyber);

        if (versionAdded) {
            embed.setDescription(`**Added in v${parseInt(versionAdded)}**`);
        }

        for (const header in pages[pageIdx]) {
            embed.addFields([{ name: `**${header}**`, value: pages[pageIdx][header] }]);
        }

        let footer = [];
        for(const emoji in BALANCE_TYPE_MAPPINGS) {
            footer.push(`${emoji} ${BALANCE_TYPE_MAPPINGS[emoji]}`);
        }
        embed.setFooter({ text: "INDEX HAS NOT UPDATED BALANCES SINCE LIKE v43 btw " + footer.join(' • ') });

        if (includedButtons.length > 0) {
            includedButtons.find((b) => b.data.disabled).setLabel(`${pageIdx + 1}/${pages.length}`);
        }

        displayedButtons = new ActionRowBuilder().addComponents(...includedButtons);

        await interaction.editReply({
            embeds: [embed],
            components: includedButtons.length > 0 ? [displayedButtons] : []
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

        if (pages.length == 1) return;

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 60000
        });

        collector.on('collect', async (buttonInteraction) => {
            collector.stop();
            buttonInteraction.deferUpdate();

            switch (buttonInteraction.customId) {
                case 'first':
                    pageIdx = 0;
                    break;
                case 'prev!':
                    pageIdx = (pageIdx - 1 + pages.length) % pages.length;
                    break;
                case 'next!':
                    pageIdx = (pageIdx + 1) % pages.length;
                    break;
                case 'last':
                    pageIdx = pages.length - 1;
                    break;
            }

            await embedPage();
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

    await embedPage();
}

function title(input, hasResults = true) {
    let title = hasResults ? 'All ' : 'No ';

    if (input.balanceFilter) {
        title += input.balanceFilter
            .split('/')
            .map((bf) => BALANCE_TYPE_MAPPINGS[bf])
            .join('/');
    } else {
        title += 'Balance Changes';
    }

    if (!hasResults) title += ' Found';

    if (input.entity) {
        title += ` for ${Towers.formatEntity(input.entity.canonical)}`;
    }

    if (input.versions.length == 1) {
        title += ` in v${input.versions[0]}`;
    } else if (input.versions.length == 2) {
        title += ` between v${input.versions[0]} and v${input.versions[1]}`;
    }

    return title;
}

function matchesEntity(noteEntity, noteUpgrade, { entity }) {
    // If no entity is provided, don't filter by entity
    if (!entity) {
        return true;
    }

    if (entity.kind === 'tower' || entity.kind === 'hero') {
        return noteEntity == entity.canonical;
    }

    // TODO: add paragons to tower aliases
    if (!noteUpgrade || ['555', '600'].includes(noteUpgrade)) return false;

    const noteUpgrades = upgradesFromUpgradeNotation(noteUpgrade);

    if (noteUpgrades.some((u) => u.length > 3)) {
        console.log('Very irregular upgrade');
        return false;
    }

    let entityUpgrades;
    if (entity.kind === 'tower_upgrade') {
        if (Towers.towerUpgradeToTower(entity.canonical) != noteEntity) {
            return false;
        }
        entityUpgrades = [Towers.towerUpgradeToUpgrade(entity.canonical)];
    } else if (entity.kind === 'tower_path') {
        if (Towers.towerPathToTower(entity.canonical) != noteEntity) {
            return false;
        }
        entityUpgrades = Towers.upgradesFromPath(Towers.towerPathtoPath(entity.canonical));
    }

    const entityPathTiers = entityUpgrades.map((u) => Towers.pathTierFromUpgradeSet(u));
    const notePathTiers = noteUpgrades.map((u) => Towers.pathTierFromUpgradeSet(u.replace(/x/g, '0')));

    // Comparing path/tiers instead of upgrades in order to ignore crosspathing in the balance notes
    return entityPathTiers.some((pt) => notePathTiers.some((npt) => pt[0] == npt[0] && pt[1] == npt[1]));
}

function matchesVersions(noteVersion, { versions }) {
    if (versions.length == 0) return true;

    if (versions.length == 1) {
        return parseInt(noteVersion) == parseInt(versions[0]);
    }

    return parseInt(noteVersion) >= parseInt(versions[0]) && parseInt(noteVersion) <= parseInt(versions[1]);
}

function matchesBalanceType(noteSymbol, { balanceFilter }) {
    if (!balanceFilter) return true;

    return balanceFilter.split('/').includes(noteSymbol);
}

/**
 *
 * @param {string} upgradeNotation The balance upgrade, such as 003 or x4+x
 * @returns All upgrades the upgrade notation represents, i.e. 003 => {003}; x4+x => {x4x, x5x}
 */
function upgradesFromUpgradeNotation(upgradeNotation) {
    const plusIndex = upgradeNotation.indexOf('+');

    if (plusIndex == -1) {
        return [upgradeNotation];
    }

    const upgrades = [];

    let tier;
    for (tier = parseInt(upgradeNotation[plusIndex - 1]); tier <= 5; tier++) {
        upgrades.push(upgradeNotation.slice(0, plusIndex - 1) + `${tier}` + upgradeNotation.slice(plusIndex + 1));
    }

    return upgrades;
}

module.exports = {
    data: builder,
    execute
};
