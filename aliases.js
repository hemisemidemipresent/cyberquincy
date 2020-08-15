const filepath = require('filepath');
const AliasError = require('./exceptions/alias-error.js');

module.exports = class AsliasRepository extends Object {
    constructor() {
        super();

        this.asyncAliasFiles();
    }

    asyncAliasFiles() {
        (async () => {
            for await (const absolutePath of Files.getFiles('./aliases', ['.json'])) {
                var fpath = filepath.create(absolutePath);
                var tokens = fpath.split();

                var relPath = './' + tokens.slice(
                    tokens.findIndex(i => i === 'cyberquincy') + 1
                ).join('/');

                this.loadAliasFile(relPath);
            }
        })();
    }

    loadAliasFile(f) {
        var nextAliases = require(f);
        
        for (const canonical in nextAliases) {
            var aliases = nextAliases[canonical];
            try {
                this.preventSharedAliases(canonical, aliases);
            } catch(e) {
                if(e instanceof AliasError) {
                    console.log(e.message);
                    console.log(`  |-> Refusing to add new group ${this.formatAliasGroup(canonical, aliases)} to collection`);
                } else {
                    throw e;
                }
            }
            this[canonical] = aliases;
        }
    }

    preventSharedAliases(canonical, aliases) {
        for (const otherCanonical in this) {
            var otherAliases = this[otherCanonical];

            var aliasGroup = aliases.concat(canonical);
            var otherAliasGroup = otherAliases.concat(otherCanonical);

            var sharedAliasMembers = otherAliasGroup.filter(aliasMember => aliasGroup.includes(aliasMember));

            if (sharedAliasMembers.length > 0) {
                throw new AliasError(`Aliases members [${sharedAliasMembers.map(a => `"${a}"`)}] clash among existing group ` +  
                `${this.formatAliasGroup(otherCanonical, otherAliases)} and new group ` +
                `${this.formatAliasGroup(canonical, aliases)}`);
            }
        }
    }

    formatAliasGroup(canonical, aliases) {
        return `{"${canonical}": [${aliases.map(a => `"${a}"`)}]}`;
    }
}