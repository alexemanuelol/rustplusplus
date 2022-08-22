/*
 * This script is used to combine all of the item meta .json files from
 * the Rust game directory "<drive>:\SteamLibrary\steamapps\common\Rust\Bundles\items"
 * into a single items.json file to be used in this project.
 */

const Fs = require('fs');

var items = {};

/* Iterate each file in current directory. */
Fs.readdirSync('.').forEach(file => {
    /* Check if file is item meta file. */
    if (file.endsWith('.json')) {

        /* Read item meta. */
        var item = JSON.parse(Fs.readFileSync(file));

        /* Push item meta we want to keep. */
        items[item.itemid] = {
            shortname: item.shortname,
            name: item.Name,
            description: item.Description
        };
    }
});

/* Write formatted json to items.json. */
Fs.writeFileSync('items.json', JSON.stringify(items, null, 4));