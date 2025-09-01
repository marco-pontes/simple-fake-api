import fs from 'fs';
import path from 'path';
export function readPackageJson(customPackageJsonPath) {
    try {
        // 1) Explicit path always wins (use fs so tests can spy)
        if (customPackageJsonPath) {
            return JSON.parse(fs.readFileSync(customPackageJsonPath, 'utf8'));
        }
        // 2) Prefer fs + cwd first (works with test spies and normal runtime if project package.json exists)
        try {
            const p = path.join(process.cwd(), 'package.json');
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
        catch {
            // ignore and fall through to read-pkg-up
        }
        // 3) Fallback: no package.json found or unreadable
        return undefined;
    }
    catch {
        return undefined;
    }
}
export function readSimpleFakeApiConfig(customPackageJsonPath) {
    const pkg = readPackageJson(customPackageJsonPath);
    if (!pkg)
        return undefined;
    return pkg['simple-fake-api-config'];
}
export function readSimpleFakeApiHttpConfig(customPackageJsonPath) {
    const pkg = readPackageJson(customPackageJsonPath);
    if (!pkg)
        return undefined;
    const root = pkg['simple-fake-api-config'];
    return root && root['http'];
}
// Centralized loader for HTTP client config
export function loadHttpClientConfigFromPackageJson(customPackageJsonPath) {
    try {
        const section = readSimpleFakeApiHttpConfig(customPackageJsonPath);
        if (!section) {
            throw new Error('Key "simple-fake-api-config.http" not found in package.json');
        }
        if (!section.endpoints || typeof section.endpoints !== 'object') {
            throw new Error('Invalid "simple-fake-api-config.http": missing endpoints');
        }
        return {
            endpoints: section.endpoints,
            resolveEnv: section.resolveEnv,
        };
    }
    catch (e) {
        const msg = `simple-fake-api/http: unable to load configuration from package.json (${e?.message || e})`;
        throw new Error(msg);
    }
}
