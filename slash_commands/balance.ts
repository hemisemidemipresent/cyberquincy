import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    MessageFlags,
    SlashCommandBooleanOption,
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandStringOption
} from 'discord.js';

import Aliases from '../aliases';
import Colors from '../helpers/colors';
import * as Towers from '../helpers/towers';
import * as Heroes from '../helpers/heroes';
import { isOwnButtonPress } from '../helpers/index';
import { CHANGE_TYPE_EMOJIS, parseChanges, type ChangeType } from '../helpers/wikitext';
import { compareVersions, fetchBTD6Changes } from '../services/wiki/btd6-changes';

import type { TowerEntityMatch } from '../helpers/towers';
import type { ReadInputResult } from '../types/slash-commands';

const { cyber } = Colors;

const entityOption = new SlashCommandStringOption()
    .setName('entity')
    .setDescription('Tower/Path/Upgrade/Hero')
    .setRequired(false);

const version1Option = new SlashCommandIntegerOption()
    .setName('version1')
    .setDescription('Exact or Starting Version')
    .setRequired(false);

const version2Option = new SlashCommandIntegerOption().setName('version2').setDescription('End Version').setRequired(false);

const filterOption = new SlashCommandStringOption()
    .setName('type_filter')
    .setDescription('Which type of balance changes do you wish to include (default = all)')
    .setRequired(false)
    .addChoices(
        { name: '✅/❌', value: 'buff/nerf' },
        { name: '🛠️/🔄', value: 'fix/neutral' },
        { name: '✅', value: 'buff' },
        { name: '❌', value: 'nerf' },
        { name: '🛠️', value: 'fix' },
        { name: '🔄', value: 'neutral' }
    );

const devNotesOption = new SlashCommandBooleanOption()
    .setName('dev_notes')
    .setDescription("Include the developers' explanations from the update notes (default = no)")
    .setRequired(false);

const reloadOption = new SlashCommandStringOption()
    .setName('reload')
    .setDescription('Refetch balance changes from the wiki instead of using the hourly cache (slower)')
    .setRequired(false)
    .addChoices({ name: 'Yes', value: 'yes' });

const builder = new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check balance history of all towers/heroes throughout versions according to the Bloons Wiki')
    .addStringOption(entityOption)
    .addIntegerOption(version1Option)
    .addIntegerOption(version2Option)
    .addStringOption(filterOption)
    .addBooleanOption(devNotesOption)
    .addStringOption(reloadOption);

const BALANCE_TYPE_NAMES: Record<ChangeType, string> = {
    buff: 'Buffs',
    nerf: 'Nerfs',
    fix: 'Fixes',
    neutral: 'Changes'
};

// Embed field values are capped at 1024 characters; pages are kept shorter so they stay readable
const MAX_FIELD_LENGTH = 1024;
const MAX_PAGE_LENGTH = 1500;

interface BalanceInput {
    entity: TowerEntityMatch | null;
    /** 0-2 major versions in ascending order */
    versions: number[];
    /** null to include every type */
    types: ChangeType[] | null;
    devNotes: boolean;
}

/** One wiki row that matched the query, ready to display */
interface BalanceEntry {
    header: string;
    lines: string[];
}

type EmbedField = { name: string; value: string };
type Page = EmbedField[];

function readInput(interaction: ChatInputCommandInteraction): ReadInputResult<BalanceInput> {
    const entityArg = interaction.options.getString('entity');
    let entity: TowerEntityMatch | null = null;
    if (entityArg) {
        entity = Towers.lookupTowerEntity(entityArg, { allowTowerPaths: true });
        if (!entity) return { error: 'Entity did not match a tower/upgrade/path/hero' };
    }

    const versions: number[] = [];
    for (const num of [1, 2]) {
        const v = interaction.options.getInteger(`version${num}`);
        if (!v) continue;
        if (v < 1 || v > 999) return { error: `Version ${num} must be a number between 1 and 999` };
        versions.push(v);
    }
    versions.sort((v1, v2) => v1 - v2);

    const typeFilter = interaction.options.getString('type_filter');
    const types = typeFilter ? (typeFilter.split('/') as ChangeType[]) : null;

    const devNotes = interaction.options.getBoolean('dev_notes') ?? false;

    return { input: { entity, versions, types, devNotes } };
}

async function execute(interaction: ChatInputCommandInteraction) {
    const { error, input } = readInput(interaction);
    if (error) {
        return await interaction.reply({
            content: error,
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply();

    const reload = interaction.options.getString('reload') ? true : false;
    const changes = await fetchBTD6Changes(reload);

    const wanted = new Set(canonicalsOf(input.entity));

    const entries: (BalanceEntry & { version: string | null })[] = [];
    for (const change of changes) {
        const matched = new Set(change.names.map(wikiNameToCanonical).filter((c) => wanted.has(c)));
        if (matched.size === 0) continue;

        if (!matchesVersions(change.version, input)) continue;

        const lines = renderChanges(change.changes, input);
        if (lines.length === 0) continue;

        const version = change.version ? `v${change.version}` : 'Unknown version';
        // A tower/upgrade/hero's entries are already labelled by the title; a path's are labelled by upgrade
        const label = !input.entity || input.entity.kind === 'tower_path' ? [...matched].map(Towers.formatEntity).join(', ') : null;
        entries.push({ version: change.version, header: label ? `${version} — ${label}` : version, lines });
    }
    // Stable, so each version keeps the wiki's order
    entries.sort((e1, e2) => compareVersions(e1.version, e2.version));

    await displayPages(interaction, paginateEntries(mergeEntries(entries)), input);
}

// The canonicals the query covers; a path covers its five upgrades
function canonicalsOf(entity: TowerEntityMatch | null): string[] {
    if (!entity) return [...Towers.allTowers(), ...Heroes.allHeroes()];

    if (entity.kind === 'tower_path') {
        const tower = Towers.towerPathToTower(entity.canonical);
        return Towers.upgradesFromPath(Towers.towerPathtoPath(entity.canonical)).map((u: string) => `${tower}#${u}`);
    }
    return [entity.canonical];
}

const wikiNameCanonicals = new Map<string, string | null>();

// Resolves one of the wiki's names, e.g. `Dart Monkey` -> `dart_monkey`, `Obyn Greenfoot` -> `obyn`,
// `Dart Monkey 3 5` (bottom path tier 5) -> `dart_monkey#005` or `Heli Pilot 0` (the base tower) -> `heli_pilot#000`.
// Other names (maps, Monkey Knowledge, paragons, ...) give null
function wikiNameToCanonical(name: string): string | null {
    if (!wikiNameCanonicals.has(name)) wikiNameCanonicals.set(name, resolveWikiName(name));
    return wikiNameCanonicals.get(name);
}

function resolveWikiName(name: string): string | null {
    const upgrade = name.match(/^(.+) (?:0|([1-3]) ([1-5]))$/);
    if (!upgrade) return Aliases.lookupMultiple(name, ['tower', 'hero'] as const)?.canonical ?? null;

    const [, towerName, path, tier] = upgrade;
    const tower = Aliases.lookup(towerName, 'tower');
    if (!tower) return null;

    const upgradeSet = ['0', '0', '0'];
    if (path) upgradeSet[parseInt(path) - 1] = tier;
    return `${tower}#${upgradeSet.join('')}`;
}

function matchesVersions(version: string | null, { versions }: BalanceInput): boolean {
    if (versions.length === 0) return true;
    if (!version) return false;

    const major = parseInt(version);
    if (versions.length === 1) return major === versions[0];
    return major >= versions[0] && major <= versions[1];
}

// The lines to display for one wiki row, leaving out notes of unwanted types and headings left with no notes
function renderChanges(wikitext: string, { types, devNotes }: BalanceInput): string[] {
    const { quotes, sections } = parseChanges(wikitext);

    const noteLines: string[] = [];
    for (const section of sections) {
        const notes = section.notes.filter((n) => !types || types.includes(n.type));
        if (notes.length === 0) continue;

        if (section.heading) noteLines.push(`__${section.heading}__`);
        for (const note of notes) {
            const emoji = note.type ? CHANGE_TYPE_EMOJIS[note.type] : '•';
            noteLines.push(`${emoji} ${note.text}`, ...note.details);
        }
    }

    // When filtering by type, dev notes are only shown alongside changes that made it through
    if (types && noteLines.length === 0) return [];

    const quoteLines = devNotes ? quotes.map((q) => q.replace(/^/gm, '> ')) : [];
    return [...quoteLines, ...noteLines];
}

// The wiki often splits a version's changes over several rows, e.g. an upgrade's changes and its dev quote
function mergeEntries(entries: BalanceEntry[]): BalanceEntry[] {
    const merged: BalanceEntry[] = [];
    for (const entry of entries) {
        const previous = merged[merged.length - 1];
        if (previous?.header === entry.header) {
            previous.lines.push(...entry.lines);
        } else {
            merged.push({ header: entry.header, lines: [...entry.lines] });
        }
    }
    return merged;
}

// Joins each heading to the line after it, so a page never ends on a heading
function keepHeadingsWithNotes(lines: string[]): string[] {
    const chunks: string[] = [];
    for (const line of lines) {
        const previous = chunks[chunks.length - 1];
        if (previous !== undefined && /^__.*__$/.test(previous)) {
            chunks[chunks.length - 1] = `${previous}\n${line}`;
        } else {
            chunks.push(line);
        }
    }
    return chunks;
}

function paginateEntries(entries: BalanceEntry[]): Page[] {
    const pages: Page[] = [];
    let page: Page = [];
    let pageLength = 0;

    const turnPage = () => {
        if (page.length > 0) pages.push(page);
        page = [];
        pageLength = 0;
    };

    for (const entry of entries) {
        let name = entry.header;
        let value = '';

        const addField = () => {
            page.push({ name: truncate(name, 256), value });
            pageLength += name.length + value.length;
            if (!name.endsWith(' (cont.)')) name += ' (cont.)';
            value = '';
        };

        for (const line of keepHeadingsWithNotes(entry.lines).map((l) => truncate(l, MAX_FIELD_LENGTH))) {
            const newValue = value ? `${value}\n${line}` : line;
            const fits = newValue.length <= MAX_FIELD_LENGTH && pageLength + name.length + newValue.length <= MAX_PAGE_LENGTH;
            if (fits) {
                value = newValue;
                continue;
            }
            if (value) addField();
            turnPage();
            value = line;
        }

        if (value) addField();
        if (page.length >= 25) turnPage();
    }
    turnPage();

    return pages;
}

function truncate(s: string, length: number): string {
    return s.length <= length ? s : s.slice(0, length - 1) + '…';
}

function multipageButtons(): ButtonBuilder[] {
    return [
        new ButtonBuilder().setCustomId('first').setLabel('⏪').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('prev!').setLabel('⬅️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('pg').setLabel('FILL_ME_IN').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('next!').setLabel('➡️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('last').setLabel('⏩').setStyle(ButtonStyle.Primary)
    ];
}

async function displayPages(interaction: ChatInputCommandInteraction, pages: Page[], input: BalanceInput) {
    let pageIdx = 0;
    let embed: EmbedBuilder;

    let includedButtons: ButtonBuilder[];
    if (pages.length <= 1) {
        includedButtons = [];
    } else if (pages.length < 5) {
        // Without first/last
        includedButtons = multipageButtons().slice(1, 4);
    } else {
        includedButtons = multipageButtons();
    }
    const pageButton = includedButtons.find((b) => b.data.style === ButtonStyle.Secondary);

    const footer = Object.entries(BALANCE_TYPE_NAMES)
        .map(([type, name]) => `${CHANGE_TYPE_EMOJIS[type]} ${name}`)
        .join(' • ');

    async function embedPage() {
        embed = new EmbedBuilder()
            .setTitle(title(input, pages.length > 0))
            .setColor(cyber)
            .setFooter({ text: `Source: Bloons Wiki • ${footer}` });

        if (pages.length > 0) embed.addFields(pages[pageIdx]);

        pageButton?.setLabel(`${pageIdx + 1}/${pages.length}`);

        await interaction.editReply({
            embeds: [embed],
            components: includedButtons.length > 0 ? [new ActionRowBuilder<ButtonBuilder>().addComponents(...includedButtons)] : []
        });

        if (pages.length <= 1) return;

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (selection: ButtonInteraction) => isOwnButtonPress(interaction, selection),
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

            // Page turns run outside execute(), so slash_command_center can't catch their errors
            await embedPage().catch((e) => console.error(e));
        });

        collector.on('end', async (collected) => {
            if (collected.size == 0) {
                await interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
            }
        });
    }

    await embedPage();
}

function title(input: BalanceInput, hasResults = true): string {
    let title = hasResults ? 'All ' : 'No ';

    if (input.types) {
        title += input.types.map((t) => BALANCE_TYPE_NAMES[t]).join('/');
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

export { builder as data, execute };
