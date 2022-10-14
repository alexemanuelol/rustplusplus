/*
 * This script is used to find missing translations between different language files.
 * Using en.json as the base file that always have up-to-date translations.
 */

const Fs = require('fs');

if (process.argv.length < 3) return console.log('Missing comparison argument.');

const compLanguage = process.argv[2];

const directoryPath = '../../languages/';
const enTranslation = JSON.parse(Fs.readFileSync(directoryPath + 'en.json'));
const compTranslation = JSON.parse(Fs.readFileSync(directoryPath + compLanguage));

console.log(`en.json in ${compLanguage}:`);
for (const item in enTranslation) {
    if (!(item in compTranslation)) console.log(`  '${item}' missing in language file ${compLanguage}`);
}

console.log(`\n${compLanguage} in en.json:`);
for (const item in compTranslation) {
    if (!(item in enTranslation)) console.log(`'${item}' missing in language file en.json`);
}

const enKeys = Object.keys(enTranslation).length;
const compKeys = Object.keys(compTranslation).length;
console.log(`en.json keys: ${enKeys}\n${compLanguage} keys: ${compKeys}`)

if (enKeys === compKeys) {
    const enArray = Object.keys(enTranslation);
    const compArray = Object.keys(compTranslation);

    for (let i = 0; i < enKeys; i++) {
        if (enArray[i] !== compArray[i]) {
            console.log('Not in the same order.')
            break;
        }
    }
}