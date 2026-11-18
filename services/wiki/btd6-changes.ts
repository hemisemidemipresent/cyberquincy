import { z } from 'zod';
import WikiAPIError from '../../exceptions/wiki-api-error';

// Every BTD6 change the wiki lists in its update histories, from the btd6_changes cargo table.
// Each row covers one entity's changes in one version; `names` holds the entities it applies to, e.g.
// `Dart Monkey` (the whole tower), `Dart Monkey 3 5` (bottom path tier 5), `Heli Pilot 0` (the base tower) or `Quincy`

const API_URL = 'https://www.bloonswiki.com/api.php';
const FIELDS = ['version', 'version_note', 'priority', 'cosmetic', 'names', 'changes'];
// Cargo's maximum page size
const PAGE_SIZE = 500;
const CACHE_LIFETIME_MS = 60 * 60 * 1000;

// Cargo replaces underscores in field names with spaces, and returns every field as a string
const ChangeRowSchema = z.object({
    version: z.string(),
    'version note': z.string(),
    priority: z.string(),
    cosmetic: z.string(),
    names: z.string(),
    changes: z.string()
});

const CargoResponseSchema = z.object({
    cargoquery: z.array(z.object({ title: ChangeRowSchema }))
});

export interface BTD6Change {
    /** e.g. `57.0`; null for the few changes the wiki couldn't date */
    version: string | null;
    versionNote: string;
    /** How the wiki orders a version's changes; e.g. 1 is a whole tower's changes, 2 one upgrade's, 5 one upgrade's dev quote */
    priority: number;
    cosmetic: boolean;
    names: string[];
    /** Wikitext; see helpers/wikitext */
    changes: string;
}

let cache: { fetchedAt: number; changes: Promise<BTD6Change[]> } | null = null;

/** All of the wiki's BTD6 changes, cached for an hour unless `reload` is set */
export function fetchBTD6Changes(reload = false): Promise<BTD6Change[]> {
    if (reload || !cache || Date.now() - cache.fetchedAt > CACHE_LIFETIME_MS) {
        const changes = fetchAllChanges();
        cache = { fetchedAt: Date.now(), changes };
        // Don't keep serving a failed fetch
        changes.catch(() => {
            if (cache?.changes === changes) cache = null;
        });
    }
    return cache.changes;
}

async function fetchAllChanges(): Promise<BTD6Change[]> {
    const changes: BTD6Change[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
        const page = await fetchChangesPage(offset);
        changes.push(...page);
        if (page.length < PAGE_SIZE) return changes;
    }
}

async function fetchChangesPage(offset: number): Promise<BTD6Change[]> {
    const searchParams = new URLSearchParams({
        action: 'cargoquery',
        tables: 'btd6_changes',
        fields: FIELDS.join(','),
        order_by: '_ID',
        limit: String(PAGE_SIZE),
        offset: String(offset),
        format: 'json'
    });
    const url = `${API_URL}?${searchParams}`;

    let res: Response;
    try {
        res = await fetch(url, { headers: { 'User-Agent': 'cyberquincy (https://github.com/hemisemidemipresent/cyberquincy)' } });
    } catch (e) {
        throw new WikiAPIError(url, `request failed: ${e}`);
    }
    if (!res.ok) throw new WikiAPIError(url, `HTTP ${res.status}`);

    let body: unknown;
    try {
        body = await res.json();
    } catch (e) {
        throw new WikiAPIError(url, `response was not JSON: ${e}`);
    }

    const parsed = CargoResponseSchema.safeParse(body);
    if (!parsed.success) throw new WikiAPIError(url, `unexpected response: ${parsed.error.message}`);

    return parsed.data.cargoquery.map(({ title: row }) => ({
        version: row.version || null,
        versionNote: row['version note'],
        priority: parseInt(row.priority) || 0,
        cosmetic: row.cosmetic === '1',
        names: row.names.split(';').map((n) => n.trim()),
        changes: row.changes
    }));
}

/** Sorts versions like `9.0` < `10.0` < `10.1`, with undated (null) versions last */
export function compareVersions(v1: string | null, v2: string | null): number {
    if (v1 === v2) return 0;
    if (v1 === null) return 1;
    if (v2 === null) return -1;
    const [major1, minor1 = 0] = v1.split('.').map(Number);
    const [major2, minor2 = 0] = v2.split('.').map(Number);
    return major1 - major2 || minor1 - minor2;
}
