/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

const Path = require('path');
const Fs = require('fs');

const root = Path.join(__dirname, '..');
const enJsonPath = Path.join(root, 'languages/en.json');
const allFiles = [];

const ignoredDirs = [
    'languages',
    'resources',
    'docs'
];

function recursiveSearchOfAllFiles(path) {
    Fs.readdirSync(path).forEach(file => {
        const filePath = Path.join(path, file);

        if (Fs.lstatSync(filePath).isDirectory()) {
            if (!ignoredDirs.includes(file)) {
                recursiveSearchOfAllFiles(filePath);
            }
        }
        else {
            allFiles.push(filePath);
        }
    })
}
recursiveSearchOfAllFiles(root);

const phrases = JSON.parse(Fs.readFileSync(enJsonPath, 'utf8'));
const phrasesKeys = Object.keys(phrases);
const nbrOfPhrases = phrasesKeys.length;

let counter = 1;
const unusedPhrases = [];
for (const phrase of phrasesKeys) {
    console.log(`Phrase (${counter}/${nbrOfPhrases})`);

    let used = false;
    for (const file of allFiles) {
        const data = Fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
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