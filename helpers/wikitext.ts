// Turns the wikitext of bloonswiki.com's btd6_changes cargo table into Discord markdown.
// It only covers what that table uses: bullet lists, `;` subheadings, tables, update-note quotes,
// links, bold/italics, a handful of HTML tags and the buff/nerf/neutral icons.

export type ChangeType = 'buff' | 'nerf' | 'neutral' | 'fix';

export const CHANGE_TYPE_EMOJIS: Record<ChangeType, string> = {
    buff: '✅',
    nerf: '❌',
    fix: '🛠️',
    neutral: '🔄'
};

/** One top-level bullet point of a change */
export interface ChangeNote {
    /** `fix` for bug fixes, otherwise taken from the bullet's icon; null when it has neither */
    type: ChangeType | null;
    /** Discord markdown, without the type's emoji */
    text: string;
    /** Sub-points and before/after tables, already rendered and indented */
    details: string[];
}

/** The notes under one heading, e.g. a `X-X-5 Crossbow Master` or `Level 4+` table row */
export interface ChangeSection {
    heading: string | null;
    notes: ChangeNote[];
}

export interface ParsedChanges {
    /** Developer quotes from the update notes */
    quotes: string[];
    sections: ChangeSection[];
}

const ICON_TYPES: Record<string, ChangeType> = { Buff: 'buff', Nerf: 'nerf', Neutral: 'neutral' };
const ICON_REGEX = /\[\[File:(Buff|Nerf|Neutral)\.svg[^\]]*\]\]/g;
const LEADING_ICON_REGEX = /^\s*\[\[File:(Buff|Nerf|Neutral)\.svg[^\]]*\]\]/;
const BUG_FIX_TAG_REGEX = /\s*\('''bug fix'''\)/;

// {{Quote}} expands to nested divs; the quote's text sits in `quote-center`, followed by its source
const QUOTE_REGEX =
    /<div style="display:flow-root"><div class="quote">[\s\S]*?<div class="quote-center"[^>]*>([\s\S]*?)(?:<br\s*\/?><span class="quote-source">[\s\S]*?<\/span>)?<\/div><div class="quote-side"[\s\S]*?<\/div><\/div><\/div>/g;

const TABLE_START_REGEX = /^:*\{\|/;
const DETAIL_INDENT = ' ';

const HTML_ENTITIES: Record<string, string> = {
    nbsp: ' ',
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    ldquo: '“',
    rdquo: '”',
    lsquo: '‘',
    rsquo: '’',
    mdash: '—',
    ndash: '–',
    hellip: '…',
    times: '×',
    rarr: '→'
};

export function parseChanges(wikitext: string): ParsedChanges {
    const quotes: string[] = [];
    const withoutQuotes = wikitext.replace(QUOTE_REGEX, (_, quote: string) => {
        quotes.push(renderInline(quote.replace(/\s*\n\s*/g, ' ')));
        return '\n';
    });

    const sections: ChangeSection[] = [];
    parseBlock(withoutQuotes, null, sections);
    return { quotes: quotes.filter((q) => q), sections: sections.filter((s) => s.heading || s.notes.length > 0) };
}

// Adds the sections found in `wikitext` to `sections`; `heading` is the heading of the table row it's in, if any
function parseBlock(wikitext: string, heading: string | null, sections: ChangeSection[]): void {
    let section: ChangeSection = { heading, notes: [] };
    sections.push(section);

    const lines = wikitext.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (TABLE_START_REGEX.test(line)) {
            const end = findTableEnd(lines, i);
            const rows = parseTableRows(lines.slice(i + 1, end));
            i = end;

            if (isChangeTable(rows)) {
                addChangeTableSections(rows, heading, sections);
                // Anything after the table belongs to the surrounding heading again
                section = { heading, notes: [] };
                sections.push(section);
            } else {
                addDetails(section, renderDetailTable(rows, 1));
            }
            continue;
        }

        const prefix = line.match(/^[*#:;]*/)[0];
        const content = line.slice(prefix.length);

        if (prefix.startsWith(';')) {
            // `;term` is a definition list term, used as a subheading like `;0-2-5`
            section = { heading: joinHeadings(heading, renderInline(content, ', ')), notes: [] };
            sections.push(section);
        } else if (prefix.length <= 1 && !prefix.startsWith(':')) {
            section.notes.push(parseNote(content));
        } else {
            addDetails(section, renderDetailLines(content, prefix.length));
        }
    }
}

function addDetails(section: ChangeSection, details: string[]): void {
    if (details.length === 0) return;
    const lastNote = section.notes[section.notes.length - 1];
    if (lastNote) {
        lastNote.details.push(...details);
    } else {
        // Sub-points with nothing above them are shown as notes of their own
        const [first, ...rest] = details.map((d) => d.replace(/^ *◦ /, ''));
        section.notes.push({ type: null, text: first, details: rest });
    }
}

function parseNote(wikitext: string): ChangeNote {
    const [main, listItems] = splitListItems(wikitext);

    let type: ChangeType | null = null;
    const icon = main.match(LEADING_ICON_REGEX);
    if (icon) type = ICON_TYPES[icon[1]];
    let text = main.replace(LEADING_ICON_REGEX, '');

    // Bug fixes are counted as fixes even when they also have a buff/nerf icon
    if (BUG_FIX_TAG_REGEX.test(text)) {
        type = 'fix';
        text = text.replace(BUG_FIX_TAG_REGEX, '');
    }

    return {
        type,
        text: renderInline(text),
        details: listItems.map((item) => `${DETAIL_INDENT}◦ ${renderInline(item)}`)
    };
}

// A `**`-style sub-point (depth 2+), or the `<ul><li>` notes some bullets end with
function renderDetailLines(wikitext: string, depth: number): string[] {
    const [main, listItems] = splitListItems(wikitext);
    const indent = DETAIL_INDENT.repeat(Math.max(depth - 1, 1));
    const lines = [`${indent}◦ ${renderInline(main)}`];
    for (const item of listItems) lines.push(`${indent}${DETAIL_INDENT}◦ ${renderInline(item)}`);
    return lines.filter((l) => !l.endsWith('◦ '));
}

// Separates trailing `<ul><li>Note: ...</li></ul>` items from the rest of a line
function splitListItems(wikitext: string): [string, string[]] {
    const items: string[] = [];
    const main = wikitext.replace(/<ul>([\s\S]*?)<\/ul>/g, (_, list: string) => {
        for (const item of list.matchAll(/<li>([\s\S]*?)<\/li>/g)) items.push(item[1]);
        return '';
    });
    return [main, items];
}

//////////////////////////////////////////////////////
// Tables
//////////////////////////////////////////////////////

interface TableCell {
    header: boolean;
    content: string;
}

// Index of the `|}` line closing the table that opens at `start`
function findTableEnd(lines: string[], start: number): number {
    let depth = 0;
    for (let i = start; i < lines.length; i++) {
        const line = lines[i].trim();
        if (TABLE_START_REGEX.test(line)) depth++;
        else if (line.startsWith('|}') && --depth === 0) return i;
    }
    return lines.length;
}

// `lines` are the lines between `{|` and `|}`; a cell's content runs until the next cell or row,
// and nested tables are kept whole inside the cell they're in
function parseTableRows(lines: string[]): TableCell[][] {
    const rows: TableCell[][] = [];
    let row: TableCell[] = [];
    let cell: TableCell | null = null;
    let depth = 0;

    const appendToCell = (raw: string) => {
        if (!cell) {
            cell = { header: false, content: '' };
            row.push(cell);
        }
        cell.content += '\n' + raw;
    };

    for (const raw of lines) {
        const line = raw.trim();

        if (depth > 0 || TABLE_START_REGEX.test(line)) {
            if (TABLE_START_REGEX.test(line)) depth++;
            else if (line.startsWith('|}')) depth--;
            appendToCell(raw);
        } else if (line.startsWith('|-')) {
            if (row.length > 0) rows.push(row);
            row = [];
            cell = null;
        } else if (line.startsWith('|+')) {
            // Captions aren't shown
        } else if (line.startsWith('!') || line.startsWith('|')) {
            const header = line.startsWith('!');
            for (const part of line.slice(1).split(header ? /!!|\|\|/ : /\|\|/)) {
                cell = { header, content: stripCellAttributes(part) };
                row.push(cell);
            }
        } else {
            appendToCell(raw);
        }
    }
    if (row.length > 0) rows.push(row);

    return rows.filter((r) => r.some((c) => c.content.trim()));
}

// `style="..." | text` -> `text`, leaving links like `[[a|b]]` alone
function stripCellAttributes(cell: string): string {
    const match = cell.match(/^([^[|]*=\s*["'][^[|]*)\|(?!\|)([\s\S]*)$/);
    return match ? match[2] : cell;
}

// Change tables (e.g. `!Tiers!!Changes` or `!Levels`/`!Changes`) start with a row of column headers;
// detail tables like `!Before |...` / `!After |...` don't
function isChangeTable(rows: TableCell[][]): boolean {
    return rows.length > 0 && rows[0].length >= 2 && rows[0].every((c) => c.header);
}

// Each row of a change table becomes its own section, headed by the row's first cell
function addChangeTableSections(rows: TableCell[][], heading: string | null, sections: ChangeSection[]): void {
    const firstColumn = renderInline(rows[0][0].content);
    for (const row of rows.slice(1)) {
        if (row.length === 1) {
            parseBlock(row[0].content, heading, sections);
            continue;
        }
        let rowHeading = renderInline(row[0].content, ', ');
        if (firstColumn === 'Levels' && rowHeading) {
            rowHeading = rowHeading === 'All' ? 'All levels' : `Level ${rowHeading}`;
        }
        const body = row
            .slice(1)
            .map((c) => c.content)
            .join('\n');
        parseBlock(body, joinHeadings(heading, rowHeading || null), sections);
    }
}

// e.g. `◦ **Before:** Automatically calls in 3 more Comanches...`
function renderDetailTable(rows: TableCell[][], depth: number): string[] {
    const indent = DETAIL_INDENT.repeat(depth);
    return rows.map((row) => {
        const text = row
            .map((c) => {
                const content = renderInline(c.content.replace(/^[*:\s]+/gm, ''), ' ');
                return c.header ? `**${content}:**` : content;
            })
            .filter((t) => t)
            .join(' ');
        return `${indent}◦ ${text}`;
    });
}

function joinHeadings(outer: string | null, inner: string | null): string | null {
    if (!outer) return inner;
    if (!inner) return outer;
    return `${outer} — ${inner}`;
}

//////////////////////////////////////////////////////
// Inline markup
//////////////////////////////////////////////////////

/** Converts one line's worth of wikitext to Discord markdown; `lineBreak` replaces `<br>` */
export function renderInline(wikitext: string, lineBreak = '\n'): string {
    let s = wikitext;

    s = s.replace(/\{\{\{[^{}]*\}\}\}/g, '?'); // Template parameters the wiki left unfilled
    s = s.replace(/\{\{[^{}]*\}\}/g, '');

    s = s.replace(ICON_REGEX, (_, icon: string) => CHANGE_TYPE_EMOJIS[ICON_TYPES[icon]]);
    s = s.replace(/\[\[File:[^\]]*\]\]/g, '');
    s = s.replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1');
    s = s.replace(/\[https?:\/\/[^\s\]]+ ([^\]]*)\]/g, '$1');

    // Tags like <amount> and <tiers> are placeholders from the game's own text, so only known HTML tags are touched
    s = s.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/g, '');
    s = s.replace(/<br\s*\/?>/g, lineBreak);
    s = s.replace(/<code>\s*<\/code>/g, '?');
    s = s.replace(/<\/?code>/g, '`');
    s = s.replace(/<\/?(?:s|del|strike)>/g, '~~');
    s = s.replace(/<\/?(?:b|strong)>/g, '**');
    s = s.replace(/<\/?(?:i|em)>/g, '*');
    s = s.replace(/<\/?(?:span|div|abbr|small|big|u|ins|p|ul|ol|li)\b[^>]*>/g, '');

    // Tags like ('''undocumented''') or ('''bug''')
    s = s.replace(/\('''([^']*)'''\)/g, '*($1)*');
    s = s.replace(/'''''(.*?)'''''/g, '***$1***');
    s = s.replace(/'''(.*?)'''/g, '**$1**');
    s = s.replace(/''(.*?)''/g, '*$1*');

    s = decodeEntities(s);

    return s
        .split('\n')
        .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
        .join('\n')
        .trim();
}

function decodeEntities(s: string): string {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
        if (code.startsWith('#x') || code.startsWith('#X')) return String.fromCodePoint(parseInt(code.slice(2), 16));
        if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1)));
        return HTML_ENTITIES[code.toLowerCase()] ?? entity;
    });
}
