#!/usr/bin/env node

const Path = require('path');

const RustlabsStaticStorage = require('../src/util/RustlabsStaticStorage');

function parseArgs(argv) {
    const options = {
        sourceDirectory: RustlabsStaticStorage.getDefaultJsonSourcePath(),
        databasePath: null,
        quiet: false
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--help' || arg === '-h') {
            options.help = true;
            continue;
        }

        if (arg === '--quiet') {
            options.quiet = true;
            continue;
        }

        if (arg === '--source' || arg === '-s') {
            i += 1;
            if (i >= argv.length) {
                throw new Error('Missing value for --source');
            }
            options.sourceDirectory = resolvePath(argv[i]);
            continue;
        }

        if (arg.startsWith('--source=')) {
            options.sourceDirectory = resolvePath(arg.split('=').slice(1).join('='));
            continue;
        }

        if (arg === '--output' || arg === '-o') {
            i += 1;
            if (i >= argv.length) {
                throw new Error('Missing value for --output');
            }
            options.databasePath = resolvePath(argv[i]);
            continue;
        }

        if (arg.startsWith('--output=')) {
            options.databasePath = resolvePath(arg.split('=').slice(1).join('='));
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (options.databasePath === null) {
        options.databasePath = RustlabsStaticStorage.getDefaultSqlitePath();
    }

    return options;
}

function resolvePath(value) {
    if (Path.isAbsolute(value)) return value;
    return Path.resolve(process.cwd(), value);
}

function printHelp() {
    console.log('Build the static SQLite database from JSON source files.');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/buildStaticFilesDb.js [--source <dir>] [--output <file>] [--quiet]');
    console.log('');
    console.log('Options:');
    console.log('  --source, -s   Directory containing the static JSON files.');
    console.log('  --output, -o   Output SQLite file path.');
    console.log('  --quiet        Print only errors.');
    console.log('  --help, -h     Show this help message.');
    console.log('');
    console.log(`Defaults:`);
    console.log(`  source: ${RustlabsStaticStorage.getDefaultJsonSourcePath()}`);
    console.log(`  output: ${RustlabsStaticStorage.getDefaultSqlitePath()}`);
}

function main() {
    let options = null;
    try {
        options = parseArgs(process.argv.slice(2));
    }
    catch (e) {
        console.error(`[build-static-db] ${e.message}`);
        printHelp();
        process.exit(1);
    }

    if (options.help) {
        printHelp();
        return;
    }

    try {
        const result = RustlabsStaticStorage.buildDatabaseFromJsonFiles({
            sourceDirectory: options.sourceDirectory,
            databasePath: options.databasePath
        });

        if (!options.quiet) {
            console.log(`[build-static-db] Built SQLite database at: ${result.databasePath}`);
            console.log(`[build-static-db] Source directory: ${result.sourceDirectory}`);
            console.log(`[build-static-db] Schema version: ${result.schemaVersion}`);
            console.log(`[build-static-db] Total rows: ${result.totalRows}`);
            console.log('[build-static-db] Rows per dataset:');
            for (const [dataset, rowCount] of Object.entries(result.datasetRows)) {
                console.log(`  - ${dataset}: ${rowCount}`);
            }
        }
    }
    catch (e) {
        console.error(`[build-static-db] Failed: ${e.message}`);
        process.exit(1);
    }
}

main();
