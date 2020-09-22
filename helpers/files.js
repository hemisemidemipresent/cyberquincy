const resolve = require('path').resolve;
const readdir = require('fs').promises.readdir;

async function* getFiles(dir, fileTypes) {
    const dirents = await readdir(dir, { withFileTypes: true });
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
