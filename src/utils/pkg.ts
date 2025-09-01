import fs from 'fs';
import path from 'path';
import type { SimpleFakeApiConfig } from '../types.js';

export function readPackageJson(customPackageJsonPath?: string): any | undefined {
  try {
    // 1) Explicit path always wins (use fs so tests can spy)
    if (customPackageJsonPath) {
      return JSON.parse(fs.readFileSync(customPackageJsonPath, 'utf8')) as any;
    }

    // 2) Prefer fs + cwd first (works with test spies and normal runtime if project package.json exists)
    try {
      const p = path.join(process.cwd(), 'package.json');
      return JSON.parse(fs.readFileSync(p, 'utf8')) as any;
    } catch {
      // ignore and fall through to read-pkg-up
    }

    // 3) Fallback: no package.json found or unreadable
    return undefined;
  } catch {
    return undefined;
  }
}

export function readSimpleFakeApiConfig(customPackageJsonPath?: string): SimpleFakeApiConfig | undefined {
  const pkg = readPackageJson(customPackageJsonPath);
  if (!pkg) return undefined;
  return pkg['simple-fake-api-config'] as SimpleFakeApiConfig | undefined;
}

import type { PackageJsonHttpSection } from '../types.js';

export function readSimpleFakeApiHttpConfig(customPackageJsonPath?: string): PackageJsonHttpSection | undefined {
  const pkg = readPackageJson(customPackageJsonPath);
  if (!pkg) return undefined;
  const root = pkg['simple-fake-api-config'];
  return root && (root['http'] as PackageJsonHttpSection | undefined);
}
