#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import url from 'url';
import { start, initialize } from './index.js';

async function createConfigFile() {
  try {
    const cwd = process.cwd();
    // detect consumer module type
    let consumerType = 'commonjs';
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      if (pkgJson && pkgJson.type === 'module') consumerType = 'module';
    } catch {}
    const isModule = consumerType === 'module';
    const fileName = isModule ? 'simple-fake-api.config.js' : 'simple-fake-api.config.cjs';
    const targetPath = path.join(cwd, fileName);

    if (fs.existsSync(targetPath)) {
      console.log(`${fileName} already exists. Skipping.`);
      return;
    }
    // Resolve package root (this file is in dist/cli.js after build)
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const pkgRoot = path.resolve(__dirname, '..');
    const templatePath = path.join(pkgRoot, 'examples', 'simple-fake-api.config.js');

    if (fs.existsSync(templatePath)) {
      let content = fs.readFileSync(templatePath, 'utf8');
      // ensure routeFileExtension key exists
      if (!/routeFileExtension\s*:/.test(content)) {
        content = content.replace("wildcardChar: '_',", "wildcardChar: '_',\n  routeFileExtension: 'ts',");
      }
      if (isModule) {
        content = content.replace('module.exports = ', 'export default ');
      }
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`Created ${fileName}`);
      return;
    }

    // Fallback inline template (with routeFileExtension)
    const obj = `{
  port: 5000,
  apiDir: 'api',
  collectionsDir: 'collections',
  wildcardChar: '_',
  routeFileExtension: 'ts',
  http: {
    endpoints: {
      'api-server': {
        // development has no baseUrl; plugin will compute http://localhost:PORT
        staging: { baseUrl: 'https://staging.example.com' },
        production: { baseUrl: 'https://api.example.com' },
        'my-custom-env': { baseUrl: 'https://api.example.com' },
      },
    },
  },
}`;
    const fallback = isModule ? `// simple-fake-api.config.js (ESM)\nexport default ${obj};\n` : `// simple-fake-api.config.cjs (CJS)\nmodule.exports = ${obj};\n`;
    fs.writeFileSync(targetPath, fallback, 'utf8');
    console.log(`Created ${fileName} using fallback template`);
  } catch (err: any) {
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
