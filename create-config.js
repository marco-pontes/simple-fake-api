#!/usr/bin/env node
// Postinstall script: creates simple-fake-api.config.js in the consumer project if it doesn't exist
// It copies the template from our package examples/simple-fake-api.config.js

import fs from 'fs';
import path from 'path';
import url from 'url';

function findConsumerRoot(pkgDir) {
  // Prefer INIT_CWD set by npm/yarn; pnpm also sets it to the original cwd of the install command
  const initCwd = process.env.INIT_CWD;
  if (initCwd && fs.existsSync(path.join(initCwd, 'package.json'))) return initCwd;

  // npm sets npm_config_local_prefix to the project root
  const localPrefix = process.env.npm_config_local_prefix;
  if (localPrefix && fs.existsSync(path.join(localPrefix, 'package.json'))) return localPrefix;

  // Walk up from the package directory until we find a package.json that is not this library's
  let cur = pkgDir;
  try {
    const libPkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    while (true) {
      const parent = path.dirname(cur);
      if (!parent || parent === cur) break;
      const pj = path.join(parent, 'package.json');
      if (fs.existsSync(pj)) {
        try {
          const data = JSON.parse(fs.readFileSync(pj, 'utf8'));
          if (data && data.name !== libPkg.name) return parent;
        } catch {}
      }
      cur = parent;
    }
  } catch {}

  // Fallback: two levels up from package dir (node_modules/@scope)
  return path.resolve(pkgDir, '..', '..');
}

try {
  // __dirname of this script inside the installed package
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const consumerRoot = findConsumerRoot(__dirname);
  // detect consumer module type
  let consumerType = 'commonjs';
  try {
    const pkgJson = JSON.parse(fs.readFileSync(path.join(consumerRoot, 'package.json'), 'utf8'));
    if (pkgJson && pkgJson.type === 'module') consumerType = 'module';
  } catch {}
  const isModule = consumerType === 'module';
  const fileName = isModule ? 'simple-fake-api.config.js' : 'simple-fake-api.config.cjs';
  const targetPath = path.join(consumerRoot, fileName);

  if (fs.existsSync(targetPath)) {
    // Do not overwrite existing user config
    process.exit(0);
  }

  // Resolve the path of this installed package to find the template file
  const pkgRoot = __dirname; // this file sits at package root after install
  const templatePath = path.join(pkgRoot, 'examples', 'simple-fake-api.config.js');

  if (!fs.existsSync(templatePath)) {
    // Fallback: embed minimal template here, with correct syntax and routeFileExtension option
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
      },
    },
  },
}`;
    const content = isModule ? `// simple-fake-api.config.js (ESM)\nexport default ${obj};\n` : `// simple-fake-api.config.cjs (CJS)\nmodule.exports = ${obj};\n`;
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log(`Created ${fileName} using fallback template at`, targetPath);
    process.exit(0);
  }

  // Use example template as base and adjust filename extension if needed
  let content = fs.readFileSync(templatePath, 'utf8');
  // ensure routeFileExtension exists (if the example template already has it, fine)
  if (!/routeFileExtension\s*:/.test(content)) {
    content = content.replace("wildcardChar: '_',", "wildcardChar: '_',\n  routeFileExtension: 'ts',");
  }
  if (isModule) {
    // convert CommonJS example to ESM export default
    content = content.replace('module.exports = ', 'export default ');
  }
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`Created ${fileName} at`, targetPath);
} catch (err) {
  // Non-fatal; do not block installation
  console.warn('[simple-fake-api] postinstall could not create simple-fake-api.config.js:', err?.message || err);
  process.exit(0);
}
