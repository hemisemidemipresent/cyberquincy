const fs = require('fs');

module.exports = {
    loadAliases() {
        global.alises = {} 

        const aliasFiles = fs
            .readdirSync('./aliases')
            .filter((file) => file.endsWith('.json'));
        
        // Register aliases
        for (const aliasKV of aliasFiles) {
            // Merge alias file into all aliases
            alises = {...aliases, ...aliasKV};
        }
    }

    canonicalForm(str) {

    }
}