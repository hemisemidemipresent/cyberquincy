const resolve = require('path').resolve;
const readdirSync = require('fs').readdirSync;

function* getFiles(dir, fileTypes) {
    const dirents = readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res, fileTypes);
        } else {
            if (fileTypes.length == 0) {
                yield res;
            } else {
                for (let i = 0; i < fileTypes.length; i++) {
                    if (dirent.name.endsWith(fileTypes[i])) {
                        yield res;
                    }
                }
            }
        }
    }
}

module.exports = {
    getFiles,
};
