#!/usr/bin/env node
// Postinstall script: creates simple-fake-api.config.js in the consumer project if it doesn't exist
// It copies the template from our package examples/simple-fake-api.config.js

import fs from 'fs';
import path from 'path';
import url from 'url';

const cwd = process.cwd();
const targetPath = path.join(cwd, 'simple-fake-api.config.js');

try {
  if (fs.existsSync(targetPath)) {
    // Do not overwrite existing user config
    process.exit(0);
  }

  // Resolve the path of this installed package to find the template file
  // __dirname equivalent for ESM
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // In the installed package, examples/simple-fake-api.config.js should be present in the published files.
  // We read it from our package directory.
  const pkgRoot = __dirname; // this file sits at package root after install
  const templatePath = path.join(pkgRoot, 'examples', 'simple-fake-api.config.js');

  if (!fs.existsSync(templatePath)) {
    // Fallback: if examples not published, embed minimal template here
    const fallback = `// simple-fake-api.config.js\nmodule.exports = {\n  port: 5000,\n  apiDir: 'api',\n  collectionsDir: 'collections',\n  wildcardChar: '_',\n  http: {\n    endpoints: {\n      'api-server': {\n        // development has no baseUrl; plugin will compute http://localhost:PORT\n        staging: { baseUrl: 'https://staging.example.com' },\n        production: { baseUrl: 'https://api.example.com' },\n      },\n    },\n  },\n};\n`;
    fs.writeFileSync(targetPath, fallback, 'utf8');
    console.log('Created simple-fake-api.config.js using fallback template');
    process.exit(0);
  }

  const content = fs.readFileSync(templatePath, 'utf8');
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('Created simple-fake-api.config.js');
} catch (err) {
  // Non-fatal; do not block installation
  console.warn('[simple-fake-api] postinstall could not create simple-fake-api.config.js:', err?.message || err);
  process.exit(0);
}
