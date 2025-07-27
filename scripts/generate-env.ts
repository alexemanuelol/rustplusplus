import fs from 'fs';
import path from 'path';

const templatePath = path.resolve(__dirname, '.env.template');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
    console.log('.env already exists. Skipping generation.');
    process.exit(0);
}

fs.copyFileSync(templatePath, envPath);
console.log('.env file created from template.');