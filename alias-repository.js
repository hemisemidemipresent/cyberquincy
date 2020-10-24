const filepath = require('filepath');
const AliasError = require('./exceptions/alias-error.js');

class AliasRepository extends Array {
    ////////////////////////////////////////////////////
    // Configuration/Initialization
    ////////////////////////////////////////////////////

    asyncAliasFiles() {
        // {source_directory: handling function}
        const SPECIAL_HANDLING_CASES = {
            './aliases/towers': this.loadTowerAliasFile,
        };

        (async () => {
            for await (const absolutePath of Files.getFiles('./aliases', [
                '.json',
            ])) {
                let fpath = filepath.create(absolutePath);
                let tokens = fpath.split();

                let relPath =
                    './' +
                    tokens
                        .slice(tokens.findIndex((i) => i === 'aliases'))
                        .join('/');

                // Determine the function that will handle the alias file

                // Default
                let handlingFunction = this.loadAliasFile;

                // See if the file has a special handler
                for (const specialRelPath in SPECIAL_HANDLING_CASES) {
                    if (relPath.startsWith(specialRelPath)) {
                        handlingFunction =
                            SPECIAL_HANDLING_CASES[specialRelPath];
                        break;
                    }
                }

                handlingFunction.call(this, relPath);
            }
        })();
    }

    // Default way to load in an alias file
    loadAliasFile(f) {
        const nextAliases = require(f);

        for (const canonical in nextAliases) {
            const nextAliasGroup = {
                canonical: canonical,
                aliases: nextAliases[canonical],
                sourcefile: f,
            };
            this.addAliasGroup(nextAliasGroup);
        }
    }

    // This handling is a bit more complex because there is implicit
    // meaning to the tower alias keys
    loadTowerAliasFile(f) {
        const towerUpgrades = require(f);

        const fpath = filepath.create(f);
        let baseName = fpath.split().slice(-1)[0].split('.')[0];

        for (const upgrade in towerUpgrades) {
            // xyz upgrade is meant to represent the tower as a whole ignoring upgrades
            // which is not exactly synonymous with the 000 tower.
            // The canonical form of the xyz tower is tower_name
            // whereas the canonical form of a specific upgrade is tower_name#ddd where d=digit
            const canonical =
                upgrade == 'xyz' ? `${baseName}` : `${baseName}#${upgrade}`;
            const nextAliasGroup = {
                canonical: canonical,
                aliases: towerUpgrades[upgrade],
                sourcefile: f,
            };
            this.addAliasGroup(nextAliasGroup);

            // Hack to add appropriate base tower entry
            if (upgrade == 'xyz') {
                const baseTowerAliasGroup = {
                    canonical: `${baseName}#222`,
                    aliases: towerUpgrades['xyz']
                        .concat(baseName)
                        .map((al) => `base_${al}`),
                    sourcefile: f,
                };
                this.addAliasGroup(baseTowerAliasGroup);
            }
        }
    }

    // Ensure that none of the aliases clash before adding it in
    addAliasGroup(ag) {
        try {
            // If adora's_temple is an alias, include adoras_temple as well
            ag.aliases = [ag.aliases].flat()
                .concat(ag.canonical)
                .map((al) => this.permuteRemovalForgettableCharacters(al))
                .flat();
            // Delete the canonical verbatim from the alias list
            ag.aliases.splice(ag.aliases.indexOf(ag.canonical), 1);

            // If another_brick is an alias, include another-brick and anotherbrick as well
            ag.aliases = ag.aliases
                .concat(ag.canonical)
                .map((al) => this.permuteSeparators(al))
                .flat();
            // Delete the canonical verbatim from the alias list
            ag.aliases.splice(ag.aliases.indexOf(ag.canonical), 1);

            // Remove duplicates, maintaining alias order
            ag.aliases = ag.aliases.filter((v, i, a) => a.indexOf(v) === i);

            // Make sure that none of these aliases overlap with other alias sets
            this.preventSharedAliases(ag);
        } catch (e) {
            if (e instanceof AliasError) {
                console.log(e.message);
            } else {
                throw e;
            }
        }
        this.push(ag);
    }

    // If "spike-o-pult", adds "spike_o_pult", "spike_o-pult", "spike-o_pult", "spike_opult", etc.
    permuteSeparators(al) {
        if (al.includes('#')) return [al];

        const SEPARATOR_TOKENS = ['_', '-'];
        const JOIN_TOKENS = ['_', '-', ''];

        const tokens = al.split(new RegExp(SEPARATOR_TOKENS.join('|')));
        let aliases = [tokens[0]];

        for (var i = 1; i < tokens.length; i++) {
            let new_aliases = [];
            for (var j = 0; j < aliases.length; j++) {
                for (var k = 0; k < JOIN_TOKENS.length; k++) {
                    new_aliases.push(aliases[j] + JOIN_TOKENS[k] + tokens[i]);
                }
            }
            aliases = [...new_aliases];
        }

        // Move the original alias to the front of the transformed list
        aliases.splice(
            aliases.findIndex((a) => a == al),
            1
        );
        return [al].concat(aliases);
    }

    permuteRemovalForgettableCharacters(al) {
        if (al.includes('#')) return [al];

        const FORGETTABLE_CHARACTERS = [':', "'"];
        return this.forgetRecursive(al, FORGETTABLE_CHARACTERS);
    }

    forgetRecursive(w, chars) {
        const sepIndex = w.search(new RegExp(chars.join('|')));
        if (sepIndex == -1) return [w];

        const prefix = w.slice(0, sepIndex);
        const suffix = w.slice(sepIndex + 1);
        const sep = w[sepIndex];

        const useits = this.forgetRecursive(suffix, chars).map(
            (sfx) => prefix + sep + sfx
        );
        const loseits = this.forgetRecursive(suffix, chars).map(
            (sfx) => prefix + sfx
        );

        return useits.concat(loseits);
    }

    // Checks canonical + aliases against all other alias groups' canonical + aliases
    // and expects to find 0 matches between each set of aliases (alias set)
    preventSharedAliases(nextAliasGroup) {
        for (let i = 0; i < this.length; i++) {
            const existingAliasGroup = this[i];

            let nextAliasSet = nextAliasGroup.aliases.concat(
                nextAliasGroup.canonical
            );
            let existingAliasSet = existingAliasGroup.aliases.concat(
                existingAliasGroup.canonical
            );

            let sharedAliasMembers = nextAliasSet.filter((aliasMember) =>
                existingAliasSet.includes(aliasMember)
            );

            if (sharedAliasMembers.length > 0) {
                throw new AliasError(
                    `Aliases members [${sharedAliasMembers.map(
                        (a) => `"${a}"`
                    )}] clash among existing group ` +
                        `${this.formatAliasGroup(
                            existingAliasGroup
                        )} and new group ` +
                        `${this.formatAliasGroup(nextAliasGroup)}`
                );
            }
        }
    }

    formatAliasGroup(ag) {
        return JSON.stringify(ag, undefined, 2);
    }

    ////////////////////////////////////////////////////
    // Access
    ////////////////////////////////////////////////////

    // Converts a member of an alias group to its canonical form
    getCanonicalForm(aliasMember) {
        let ag = this.getAliasGroup(aliasMember.toLowerCase());
        if (ag) return ag.canonical;
        else return null;
    }

    // Returns a single key-values pair alias group, `{canonical: [aliases]}`,
    // in which aliasMember is found
    getAliasGroup(aliasMember) {
        let ags = this.filter(
            (ag) =>
                ag.canonical == aliasMember || ag.aliases.includes(aliasMember)
        );
        if (!ags || ags.length == 0) {
            return null;
        } else if (ags.length == 1) {
            return ags[0];
        } else {
            throw (
                `Multiple alises groups found sharing a given alias member` +
                `(something went horribly wrong): ${ags.map(
                    (ag) => ag.canonical
                )}`
            );
        }
    }

    // Returns a flat list of aliases semantically equivalent to `aliasMember`
    getAliasSet(aliasMember) {
        aliasMember = aliasMember.toLowerCase();
        let ag = this.getAliasGroup(aliasMember);
        if (ag) return [ag.canonical].concat(ag.aliases);
        else return null;
    }

    getAliasGroupsFromSameFileAs(aliasMember) {
        aliasMember = aliasMember.toLowerCase();
        let ag = this.getAliasGroup(aliasMember);
        let result = this.filter(
            (otherAliasGroup) => otherAliasGroup.sourcefile === ag.sourcefile
        )
        return result;
    }

    getAliasGroupsFromSameImmediateDirectoryAs(aliasMember) {
        aliasMember = aliasMember.toLowerCase();
        let ag = this.getAliasGroup(aliasMember);
        let result = this.filter(function (otherAliasGroup) {
            let agPathTokens = ag.sourcefile.split('/')
            let otherAgPathTokens = otherAliasGroup.sourcefile.split('/')
            return agPathTokens[agPathTokens.length - 2] == 
                    otherAgPathTokens[otherAgPathTokens.length - 2]
        })
        return result;
    }

    ////////////////////////////////////////////////////
    // Expedited Access
    ////////////////////////////////////////////////////
    allMaps() {
        return this.beginnerMaps()
            .concat(this.intermediateMaps())
            .concat(this.advancedMaps())
            .concat(this.expertMaps());
    }

    allWaterMaps() {
        return this.allMaps().filter((m) => this.allNonWaterMaps().includes(m));
    }

    // TODO: rewrite this involving the q!map command results rather than hardcoding it
    allNonWaterMaps() {
        return [
            'TS',
            'H',
            'AR',
            'MM',
            'ML',
            'KD',
            'CF',
            'GD',
            'UG',
            'MS',
            'W',
        ].map((m) => this.getCanonicalForm(m.toLowerCase()));
    }

    beginnerMaps() {
        return this.getAliasGroupsFromSameFileAs('LOGS').map(
            (ag) => ag.canonical
        );
    }

    intermediateMaps() {
        return this.getAliasGroupsFromSameFileAs('HAUNTED').map(
            (ag) => ag.canonical
        );
    }

    advancedMaps() {
        return this.getAliasGroupsFromSameFileAs('CORNFIELD').map(
            (ag) => ag.canonical
        );
    }

    expertMaps() {
        return this.getAliasGroupsFromSameFileAs('INFERNAL').map(
            (ag) => ag.canonical
        );
    }

    allMapDifficulties() {
        const map_difficulties = this.getAliasGroupsFromSameFileAs(
            'INTERMEDIATE'
        );

        return map_difficulties.map((ag) => ag.canonical);
    }

    allDifficulties() {
        const difficulties = this.getAliasGroupsFromSameFileAs('MEDIUM');

        return difficulties.map((ag) => ag.canonical).concat('impoppable');
    }

    allModes() {
        const modes = this.getAliasGroupsFromSameFileAs('STANDARD');

        return modes.map((ag) => ag.canonical);
    }

    allTowerUpgrades() {
        const TOWER_CANONICAL_REGEX = /[a-z]#\d\d\d/i;

        let upgrades = [];
        for (let i = 0; i < this.length; i++) {
            const canonical = this[i].canonical;
            if (TOWER_CANONICAL_REGEX.test(canonical)) {
                upgrades.push(canonical);
            }
        }
        return upgrades;
    }

    // Gets all 0-0-0 tower names
    allTowers() {
        return [].concat(this.allPrimaryTowers())
                 .concat(this.allMilitaryTowers())
                 .concat(this.allMagicTowers())
                 .concat(this.allSupportTowers()) 
    }

    allPrimaryTowers() {
        const primaryTowers = this.getAliasGroupsFromSameImmediateDirectoryAs('DART');

        return primaryTowers.map((ag) => ag.canonical)
                            .filter((upgrade) => !upgrade.includes('#'))
    }

    allMilitaryTowers() {
        const militaryTowers = this.getAliasGroupsFromSameImmediateDirectoryAs('HELI');

        return militaryTowers.map((ag) => ag.canonical)
                            .filter((upgrade) => !upgrade.includes('#'))
    }

    allMagicTowers() {
        const magicTowers = this.getAliasGroupsFromSameImmediateDirectoryAs('WIZ');

        return magicTowers.map((ag) => ag.canonical)
                            .filter((upgrade) => !upgrade.includes('#'))
    }

    allSupportTowers() {
        const supportTowers = this.getAliasGroupsFromSameImmediateDirectoryAs('FARM');

        return supportTowers.map((ag) => ag.canonical)
                            .filter((upgrade) => !upgrade.includes('#'))
    }

    allWaterTowers() {
        return ['sub', 'bucc', 'brick'].map((t) => this.getCanonicalForm(t));
    }

    allHeroes() {
        const heroes = this.getAliasGroupsFromSameFileAs('EZILI');

        return heroes.map((ag) => ag.canonical);
    }

    allBloons() {
        const bloons = this.getAliasGroupsFromSameFileAs('RED');
        return bloons.map((ag) => ag.canonical);
    }

    towerUpgradeToIndexNormalForm(upgrade) {
        const indexNormalUnformatted = this.getAliasSet(upgrade)[1];
        return this.toIndexNormalForm(indexNormalUnformatted);
    }

    towerUpgradeFromTowerAndPathAndTier(tower, path, tier) {
        // Re-assign tower to canonical and ensure that it exists and is a tower
        if (
            !(tower = this.getCanonicalForm(tower)) ||
            !this.allTowers().includes(tower)
        ) {
            throw 'First argument must be a tower';
        }

        // Validate path
        if (isNaN(path)) {
            throw 'Second argument `path` must be 1, 2, or 3';
        }
        try {
            path = parseInt(path);
        } catch (e) {
            throw 'Second argument `path` must be 1, 2, or 3';
        }

        if (path < 1 || path > 3) {
            throw 'Second argument `path` must be 1, 2, or 3';
        }

        // Validate tier
        if (!tier) {
            return this.towerUpgradeToIndexNormalForm(`${tower}#222`);
        }

        if (isNaN(tier)) {
            throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
        }
        try {
            tier = parseInt(tier);
        } catch (e) {
            throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
        }

        if (tier < 0 || tier > 5) {
            throw 'Third argument `tier` must be an integer between 0 and 5 inclusive';
        }

        // Convert path + tier to appropriate upgrade string like 003 or 400
        const upgradeInt = tier * Math.pow(10, 3 - path);
        const upgradeStr = upgradeInt.toString().padStart(3, '0');

        // Combine tower with upgrade string to get tower upgrade canonical like wizard#300
        return this.towerUpgradeToIndexNormalForm(`${tower}#${upgradeStr}`);
    }

    towerUpgradeToTower(towerUpgrade) {
        if (this.allHeroes().includes(this.getCanonicalForm(towerUpgrade))) {
            return towerUpgrade;
        }

        return this.getCanonicalForm(towerUpgrade).slice(0, -4);
    }

    mapToIndexAbbreviation(map) {
        return this.getAliasSet(map)[1].toUpperCase();
    }

    indexAbbreviationToMap(mapAbbr) {
        const indexNormalUnformatted = this.getAliasSet(
            mapAbbr.toLowerCase()
        )[0];
        return this.toIndexNormalForm(indexNormalUnformatted);
    }

    toAliasNormalForm(indexForm) {
        return indexForm.toLowerCase().split(' ').join('_');
    }

    toIndexNormalForm(canonical) {
        return canonical
            .split('_')
            .map((tk) => h.toTitleCase(tk))
            .join(' ');
    }

    canonicizeArg(arg) {
        return arg
            .split('#')
            .map((t) => Aliases.getCanonicalForm(t) || t)
            .join('#');
    }
}

module.exports = AliasRepository;
