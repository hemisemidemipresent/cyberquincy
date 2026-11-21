import { resolve } from 'path';
import { readdirSync } from 'fs';

/** Yields the absolute path of every file under `dir` whose name ends with one of `fileTypes` (or every file, if empty) */
function* getFiles(dir: string, fileTypes: string[]): Generator<string> {
    const dirents = readdirSync(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res, fileTypes);
        } else if (fileTypes.length == 0) {
            yield res;
        } else {
            for (const fileType of fileTypes) {
                if (dirent.name.endsWith(fileType)) {
                    yield res;
                }
            }
        }
    }
}

export { getFiles };
