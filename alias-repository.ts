import fs from 'fs';
import AliasError from './exceptions/alias-error.js';
import gHelper from './helpers/general.js';
import filesHelper from './helpers/files.js';

import type { TowerTypeCanonical, TowerUpgradeCanonical } from './types/towers';
import type {
    BloonCanonical,
    DifficultyCanonical,
    GameModeCanonical,
    GeraldoShopItemCanonical,
    HeroCanonical,
    MapCanonical,
    MapDifficultyCanonical,
    MoabCanonical,
    PathCanonical
} from './types/aliases';
import type miscJson from './aliases/misc.json';

// misc.json mixes aliases with config values; left untyped beyond its keys for now
export type MiscCanonical = keyof typeof miscJson;

/** The canonical type each kind of alias group resolves to */
export interface CanonicalByKind {
    tower: TowerTypeCanonical;
    tower_upgrade: TowerUpgradeCanonical;
    hero: HeroCanonical;
    geraldo_item: GeraldoShopItemCanonical;
    map: MapCanonical;
    map_difficulty: MapDifficultyCanonical;
    difficulty: DifficultyCanonical;
    game_mode: GameModeCanonical;
    bloon: BloonCanonical;
    moab: MoabCanonical;
    path: PathCanonical;
    misc: MiscCanonical;
}

export type AliasKind = keyof CanonicalByKind;

export type TowerCategory = 'primary' | 'military' | 'magic' | 'support';

/** Extra information some kinds record at load time */
interface ExtraByKind {
    tower: { towerCategory: TowerCategory };
    tower_upgrade: { towerCategory: TowerCategory };
    map: { mapDifficulty: MapDifficultyCanonical };
}

export type AliasGroupOf<K extends AliasKind> = {
    kind: K;
    canonical: CanonicalByKind[K];
    aliases: string[];
    sourcefile: string;
} & (K extends keyof ExtraByKind ? ExtraByKind[K] : unknown);

export type AliasGroup = { [K in AliasKind]: AliasGroupOf<K> }[AliasKind];

/** Result of a lookup across several kinds: switch on `kind` to narrow `canonical` */
export type AliasMatch<K extends AliasKind> = { [P in K]: { kind: P; canonical: CanonicalByKind[P] } }[K];

/**
 * Kinds that share a lookup table. No alias may belong to two groups within a supergroup;
 * across supergroups they may overlap (e.g. `dd` is both a map and a tower upgrade).
 * Every kind belongs to exactly one supergroup.
 */
export const SUPERGROUPS = {
    TOWER: ['tower', 'tower_upgrade', 'hero', 'geraldo_item'],
    MAP: ['map', 'map_difficulty'],
    DIFFICULTY: ['difficulty'],
    GAME_MODE: ['game_mode'],
    ENEMY: ['bloon', 'moab'],
    PATH: ['path'],
    MISC: ['misc']
} as const satisfies Record<string, readonly AliasKind[]>;

export type Supergroup = keyof typeof SUPERGROUPS;

const SUPERGROUP_OF_KIND = {} as Record<AliasKind, Supergroup>;
for (const supergroup of Object.keys(SUPERGROUPS) as Supergroup[]) {
    for (const kind of SUPERGROUPS[supergroup]) {
        if (SUPERGROUP_OF_KIND[kind]) throw new AliasError(`Alias kind ${kind} is in more than one supergroup`);
        SUPERGROUP_OF_KIND[kind] = supergroup;
    }
}

// {alias file (relative to ./aliases): kind}; tower files are handled separately
const FILE_KINDS: Record<string, AliasKind> = {
    'heroes.json': 'hero',
    'geraldos_shop.json': 'geraldo_item',
    'map-difficulties.json': 'map_difficulty',
    'difficulties.json': 'difficulty',
    'gamemodes.json': 'game_mode',
    'enemies/bloons.json': 'bloon',
    'enemies/moabs.json': 'moab',
    'paths.json': 'path',
    'misc.json': 'misc'
};

export class AliasRepository {
    private groups: AliasGroup[] = [];
    private groupsByKind = new Map<AliasKind, AliasGroup[]>();
    private tables = new Map<Supergroup, Map<string, AliasGroup>>();

    private constructor() {}

    // Creates a repository with every alias file loaded; throws if aliases clash within a supergroup
    static load(): AliasRepository {
        const repository = new AliasRepository();
        repository.loadAliasFiles();
        repository.buildTables();
        return repository;
    }

    ////////////////////////////////////////////////////
    // Access
    ////////////////////////////////////////////////////

    /** The canonical form of `member` if it is an alias of the given kind, e.g. `lookup('wiz', 'tower')` */
    lookup<K extends AliasKind>(member: string | null | undefined, kind: K): CanonicalByKind[K] | null {
        return this.lookupGroup(member, kind)?.canonical ?? null;
    }

    /** The whole alias group of `member` if it is an alias of the given kind */
    lookupGroup<K extends AliasKind>(member: string | null | undefined, kind: K): AliasGroupOf<K> | null {
        const group = this.findInSupergroup(member, SUPERGROUP_OF_KIND[kind]);
        return group?.kind === kind ? (group as AliasGroupOf<K>) : null;
    }

    /**
     * The kind and canonical form of `member` if it is an alias of any of the given kinds, which must share a supergroup.
     * e.g. `lookupMultiple('sotf', SUPERGROUPS.TOWER)` gives `{ kind: 'tower_upgrade', canonical: 'druid#050' }`
     */
    lookupMultiple<const K extends readonly AliasKind[]>(member: string | null | undefined, kinds: K): AliasMatch<K[number]> | null {
        const supergroup = SUPERGROUP_OF_KIND[kinds[0]];
        if (kinds.some((kind) => SUPERGROUP_OF_KIND[kind] !== supergroup)) {
            throw new AliasError(`lookupMultiple() kinds must share a supergroup; got ${kinds.join(', ')}`);
        }
        const group = this.findInSupergroup(member, supergroup);
        if (!group || !(kinds as readonly AliasKind[]).includes(group.kind)) return null;
        return { kind: group.kind, canonical: group.canonical } as AliasMatch<K[number]>;
    }

    /** Every alias group of a kind, in the order they were loaded */
    groupsOfKind<K extends AliasKind>(kind: K): AliasGroupOf<K>[] {
        return (this.groupsByKind.get(kind) ?? []) as AliasGroupOf<K>[];
    }

    /** Every canonical of a kind, in the order they were loaded */
    canonicalsOfKind<K extends AliasKind>(kind: K): CanonicalByKind[K][] {
        return this.groupsOfKind(kind).map((ag) => ag.canonical);
    }

    /** Every group `member` belongs to, across all supergroups (used by /alias) */
    findAllGroups(member: string | null | undefined): AliasGroup[] {
        return (Object.keys(SUPERGROUPS) as Supergroup[])
            .map((supergroup) => this.findInSupergroup(member, supergroup))
            .filter((group) => group !== null);
    }

    private findInSupergroup(member: string | null | undefined, supergroup: Supergroup): AliasGroup | null {
        if (!member) return null;
        return this.tables.get(supergroup).get(normalizeMember(member)) ?? null;
    }

    ////////////////////////////////////////////////////
    // Formatting
    ////////////////////////////////////////////////////

    toAliasNormalForm(indexForm: string): string {
        // index legacy cases
        let aliasNormalForm = indexForm.toLowerCase().split(' ').join('_');
        if (aliasNormalForm == "engineer") return "engineer_monkey";
        if (aliasNormalForm == "druid_monkey") return "druid";
        return aliasNormalForm;
    }

    toIndexNormalForm(canonical: string): string {
        let indexNormalForm = canonical
            .split('_')
            .map((tk) => gHelper.toTitleCase(tk))
            .join(' ')
            .replace(/ \(.*\)/, ''); // Parentheticals are used to avoid clashing aliases (e.g. double shot) but are filtered out when displayed
        // index legacy cases
        if (indexNormalForm == "Engineer Monkey") return "Engineer";
        if (indexNormalForm == "Druid") return "Druid Monkey";
        return indexNormalForm;
    }

    ////////////////////////////////////////////////////
    // Loading
    ////////////////////////////////////////////////////

    private loadAliasFiles() {
        for (const absolutePath of filesHelper.getFiles('./aliases', ['.json'])) {
            const tokens = absolutePath.split(/[\\/]/);
            const pathInAliases = tokens.slice(tokens.lastIndexOf('aliases') + 1);
            const sourcefile = './aliases/' + pathInAliases.join('/');
            const contents = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

            if (pathInAliases[0] === 'towers') {
                // towers/<category>/<tower>.json
                this.loadTowerAliasFile(contents, sourcefile, pathInAliases[1] as TowerCategory, pathInAliases[2].split('.')[0]);
            } else if (pathInAliases[0] === 'maps') {
                // maps/<map difficulty>-maps.json
                const mapDifficulty = pathInAliases[1].split('-')[0];
                for (const canonical in contents) {
                    this.addAliasGroup({ kind: 'map', canonical, aliases: contents[canonical], sourcefile, mapDifficulty });
                }
            } else {
                const kind = FILE_KINDS[pathInAliases.join('/')];
                if (!kind) throw new AliasError(`No alias kind is configured for ${sourcefile}`);
                for (const canonical in contents) {
                    this.addAliasGroup({ kind, canonical, aliases: contents[canonical], sourcefile });
                }
            }
        }
    }

    // This handling is a bit more complex because there is implicit
    // meaning to the tower alias keys
    private loadTowerAliasFile(towerUpgrades: Record<string, string[]>, sourcefile: string, towerCategory: TowerCategory, baseName: string) {
        for (const upgrade in towerUpgrades) {
            // xyz upgrade is meant to represent the tower as a whole ignoring upgrades
            // which is not exactly synonymous with the 000 tower.
            // The canonical form of the xyz tower is tower_name
            // whereas the canonical form of a specific upgrade is tower_name#ddd where d=digit
            if (upgrade == 'xyz') {
                this.addAliasGroup({ kind: 'tower', canonical: baseName, aliases: towerUpgrades[upgrade], sourcefile, towerCategory });

                // Hack to add appropriate base tower entry
                this.addAliasGroup({
                    kind: 'tower_upgrade',
                    canonical: `${baseName}#000`,
                    aliases: towerUpgrades['xyz']
                        .concat(baseName)
                        .map((al) => [`base_${al}`, `b_${al}`])
                        .flat(),
                    sourcefile,
                    towerCategory
                });
            } else {
                this.addAliasGroup({ kind: 'tower_upgrade', canonical: `${baseName}#${upgrade}`, aliases: towerUpgrades[upgrade], sourcefile, towerCategory });
            }
        }
    }

    // Expands the aliases with their separator/punctuation variations, then stores the group.
    // Canonicals are only cast here and in loadTowerAliasFile: the alias files are the source of truth for every kind.
    private addAliasGroup(ag: { kind: AliasKind; canonical: string; aliases: string | string[]; sourcefile: string; [extra: string]: unknown }) {
        // If adora's_temple is an alias, include adoras_temple as well
        let aliases = [ag.aliases]
            .flat()
            .concat(ag.canonical)
            .map((al) => permuteRemovalForgettableCharacters(al))
            .flat();
        // Delete the canonical verbatim from the alias list
        aliases.splice(aliases.indexOf(ag.canonical), 1);

        // If another_brick is an alias, include another-brick and anotherbrick as well
        aliases = aliases
            .concat(ag.canonical)
            .map((al) => permuteSeparators(al))
            .flat();
        // Delete the canonical verbatim from the alias list
        aliases.splice(aliases.indexOf(ag.canonical), 1);

        // Remove duplicates, maintaining alias order
        aliases = aliases.filter((v, i, a) => a.indexOf(v) === i);

        const group = { ...ag, aliases } as AliasGroup;
        this.groups.push(group);
        if (!this.groupsByKind.has(group.kind)) this.groupsByKind.set(group.kind, []);
        this.groupsByKind.get(group.kind).push(group);
    }

    // One table per supergroup, mapping every canonical and alias to its group
    private buildTables() {
        const clashes: string[] = [];
        for (const supergroup of Object.keys(SUPERGROUPS) as Supergroup[]) {
            const table = new Map<string, AliasGroup>();
            for (const group of this.groups.filter((g) => SUPERGROUP_OF_KIND[g.kind] === supergroup)) {
                for (const member of [group.canonical, ...group.aliases]) {
                    const key = normalizeMember(member);
                    const existing = table.get(key);
                    if (existing && existing !== group) {
                        clashes.push(`"${key}" (${supergroup}): ${existing.canonical} in ${existing.sourcefile} and ${group.canonical} in ${group.sourcefile}`);
                    } else {
                        table.set(key, group);
                    }
                }
            }
            this.tables.set(supergroup, table);
        }
        if (clashes.length > 0) {
            throw new AliasError(`Aliases clash within a supergroup:\n${clashes.join('\n')}`);
        }
    }
}

// User input may use spaces for underscores and any capitalization
function normalizeMember(member: string): string {
    return member.replace(/ /g, '_').toLowerCase();
}

// If "spike-o-pult", adds "spike_o_pult", "spike_o-pult", "spike-o_pult", "spike_opult", etc.
function permuteSeparators(al: string): string[] {
    if (al.includes('#')) return [al];

    const SEPARATOR_TOKENS = ['_', '-'];
    const JOIN_TOKENS = ['_', '-', ''];

    const tokens = al.split(new RegExp(SEPARATOR_TOKENS.join('|')));
    let aliases = [tokens[0]];
    if (tokens.length < 8) {
        for (let i = 1; i < tokens.length; i++) {
            let new_aliases = [];
            for (let j = 0; j < aliases.length; j++) {
                for (let k = 0; k < JOIN_TOKENS.length; k++) {
                    new_aliases.push(aliases[j] + JOIN_TOKENS[k] + tokens[i]);
                }
            }
            aliases = [...new_aliases];
        }
    }

    // Move the original alias to the front of the transformed list
    aliases.splice(
        aliases.findIndex((a) => a == al),
        1
    );
    return [al].concat(aliases);
}

function permuteRemovalForgettableCharacters(al: string): string[] {
    if (al.includes('#')) return [al];

    const FORGETTABLE_CHARACTERS = [':', "'"];
    return forgetRecursive(al, FORGETTABLE_CHARACTERS);
}

function forgetRecursive(w: string, chars: string[]): string[] {
    const sepIndex = w.search(new RegExp(chars.join('|')));
    if (sepIndex == -1) return [w];

    const prefix = w.slice(0, sepIndex);
    const suffix = w.slice(sepIndex + 1);
    const sep = w[sepIndex];

    const useits = forgetRecursive(suffix, chars).map((sfx) => prefix + sep + sfx);
    const loseits = forgetRecursive(suffix, chars).map((sfx) => prefix + sfx);

    return useits.concat(loseits);
}
