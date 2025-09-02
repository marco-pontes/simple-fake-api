#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import url from 'url';
import { start, initialize } from './index.js';
async function createConfigFile() {
    try {
        const cwd = process.cwd();
        const targetPath = path.join(cwd, 'simple-fake-api.config.js');
        if (fs.existsSync(targetPath)) {
            console.log('simple-fake-api.config.js already exists. Skipping.');
            return;
        }
        // Resolve package root (this file is in dist/cli.js after build)
        const __filename = url.fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const pkgRoot = path.resolve(__dirname, '..');
        const templatePath = path.join(pkgRoot, 'examples', 'simple-fake-api.config.js');
        if (fs.existsSync(templatePath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            fs.writeFileSync(targetPath, content, 'utf8');
            console.log('Created simple-fake-api.config.js');
            return;
        }
        // Fallback inline template
        const fallback = `// simple-fake-api.config.js\nmodule.exports = {\n  port: 5000,\n  apiDir: 'api',\n  collectionsDir: 'collections',\n  wildcardChar: '_',\n  http: {\n    endpoints: {\n      'api-server': {\n        // development has no baseUrl; plugin will compute http://localhost:PORT\n        staging: { baseUrl: 'https://staging.example.com' },\n        production: { baseUrl: 'https://api.example.com' },\n        'my-custom-env': { baseUrl: 'https://api.example.com' },\n      },\n    },\n  },\n};\n`;
        fs.writeFileSync(targetPath, fallback, 'utf8');
        console.log('Created simple-fake-api.config.js using fallback template');
    }
    catch (err) {
        console.error('[simple-fake-api] init failed:', err?.message || err);
    }
}
const args = process.argv.slice(2);
if (args[0] === 'init') {
    await createConfigFile();
    // Do not start server when running init
    process.exit(0);
}
await initialize();
start();
