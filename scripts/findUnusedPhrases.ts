/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

import * as fs from 'fs';
import * as path from 'path';

const root = path.join(__dirname, '..');
const languageFilePath = path.join(root, 'src/languages/en.json');
const allFiles: string[] = [];

const ignoredDirs = [
    'languages',
    'resources',
    'staticFiles',
    'node_modules',
    'templates'
];

function recursiveSearchOfAllFiles(currentPath: string) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = fs.lstatSync(filePath);

        /* Only include files in src or the index.ts file */
        if (stat.isDirectory()) {
            const relativeDir = path.relative(root, filePath);
            if (!ignoredDirs.some(dir => relativeDir.includes(dir))) {
                recursiveSearchOfAllFiles(filePath);
            }
        } else {
            /* Include index.ts explicitly and all files in the src directory */
            if (file === 'index.ts' || filePath.includes(path.join(root, 'src'))) {
                allFiles.push(filePath);
            }
        }
    }
}

recursiveSearchOfAllFiles(root);

/* Read the phrases from the language file */
const phrases = JSON.parse(fs.readFileSync(languageFilePath, 'utf8'));
const phrasesKeys = Object.keys(phrases);
const nbrOfPhrases = phrasesKeys.length;

let counter = 1;
const unusedPhrases: string[] = [];

for (const phrase of phrasesKeys) {
    console.log(`Checking phrase (${counter}/${nbrOfPhrases}): "${phrase}"`);

    let used = false;
    for (const file of allFiles) {
        const data = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });

        /* Check if the phrase is used in any of the three cases */
        if (data.includes(`'${phrase}'`) || data.includes(`"${phrase}"`) || data.includes(`\`${phrase}\``)) {
            used = true;
            break;
        }
    }

    if (!used) {
        unusedPhrases.push(phrase);
    }

    counter += 1;
}

console.log('\nUnused Phrases:\n');
console.log(unusedPhrases);