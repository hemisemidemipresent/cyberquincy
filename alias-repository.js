const filepath = require('filepath');
const AliasError = require('./exceptions/alias-error.js');

module.exports = class AliasRepository extends Array {
    ////////////////////////////////////////////////////
    // Configuration/Initialization
    ////////////////////////////////////////////////////

    // {[path_tokens]: handling function}
    SPECIAL_HANDLING_CASES = {
        "./aliases/towers": this.loadTowerAliasFile
    }

    asyncAliasFiles() {
        (async () => {
            for await (const absolutePath of Files.getFiles('./aliases', [
                '.json',
            ])) {
                var fpath = filepath.create(absolutePath);
                var tokens = fpath.split();

                var relPath =
                    './' +
                    tokens
                        .slice(tokens.findIndex((i) => i === 'aliases'))
                        .join('/');

                // Determine the handling function
                
                // Default
                var handlingFunction = this.loadAliasFile;

                // See if the file is a special case
                for (const specialRelPath in this.SPECIAL_HANDLING_CASES) {
                    if (relPath.startsWith(specialRelPath)) {
                        handlingFunction = this.SPECIAL_HANDLING_CASES[specialRelPath];
                        break;
                    }
                }

                handlingFunction.call(this, relPath);
            }
            console.log(this);
        })();
    }

    loadAliasFile(f) {
        const nextAliases = require(f);

        for (const canonical in nextAliases) {
            const nextAliasGroup = {
                canonical: canonical,
                aliases: nextAliases[canonical],
                sourcefile: f,
            }
            this.addAliasGroup(nextAliasGroup);
        }
    }

    loadTowerAliasFile(f) {
        const towerUpgrades = require(f);

        const fpath = filepath.create(f);
        const canonical = fpath.split().slice(-1)[0].split('.')[0];

        for (const upgrade in towerUpgrades) {
            const nextAliasGroup = {
                canonical: `${canonical}#${upgrade}`, // spike_factory#004
                aliases: towerUpgrades[upgrade],
                sourcefile: f,
            }
            this.addAliasGroup(nextAliasGroup);
        }
    }

    addAliasGroup(ag) {
        try {
            this.preventSharedAliases(ag);
        } catch(e) {
            if(e instanceof AliasError) {
                console.log(e.message);
                console.log(`  |-> Refusing to add new group ${this.formatAliasGroup(ag)} to collection`);
            } else {
                throw e;
            }
        }
        this.push(ag);
    }

    preventSharedAliases(nextAliasGroup) {
        for (var i = 0; i < this.length; i++) {
            const existingAliasGroup = this[i];

            var nextAliasSet = nextAliasGroup.aliases.concat(nextAliasGroup.canonical);
            var existingAliasSet = existingAliasGroup.aliases.concat(existingAliasGroup.canonical);

            var sharedAliasMembers = nextAliasSet.filter((aliasMember) =>
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
        };
    }

    formatAliasGroup(ag) {
        return JSON.stringify(ag, undefined, 2);
    }

    ////////////////////////////////////////////////////
    // Access
    ////////////////////////////////////////////////////

    getCanonicalForm(aliasMember) {
        var ag = this.getAliasGroup(aliasMember);
        if (ag) return ag.canonical;
        else return null;
    }

    // Returns a single key-values pair alias group, `{canonical: [aliases]}`,
    // in which aliasMember is found
    getAliasGroup(aliasMember) {
        var ags = this.filter(
            (ag) =>
                ag.canonical == aliasMember || ag.aliases.includes(aliasMember)
        );
        if (!ags || ags.length == 0) {
            null;
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
        var ag = this.getAliasGroup(aliasMember);
        return ag.aliases.concat(ag.canonical);
    }

    getAliasGroupsFromSameFileAs(aliasMember) {
        aliasMember = aliasMember.toLowerCase();
        var ag = this.getAliasGroup(aliasMember);
        var result = this.filter(
            (otherAliasGroup) => otherAliasGroup.sourcefile === ag.sourcefile
        );
        return result;
    }

    ////////////////////////////////////////////////////
    // Expedited Access
    ////////////////////////////////////////////////////
    allMaps() {
        const easyMaps = this.getAliasGroupsFromSameFileAs('LOGS');
        const intermediateMaps = this.getAliasGroupsFromSameFileAs('HAUNTED');
        const hardMaps = this.getAliasGroupsFromSameFileAs('CORNFIELD');
        const expertMaps = this.getAliasGroupsFromSameFileAs('INFERNAL');

        const allMaps = easyMaps
            .concat(intermediateMaps)
            .concat(hardMaps)
            .concat(expertMaps);

        return allMaps.map((ag) => ag.canonical);
    }

    allModes() {
        const modes = this.getAliasGroupsFromSameFileAs('STANDARD');

        return modes.map((ag) => ag.canonical);
    }
};
