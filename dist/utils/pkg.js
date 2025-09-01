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
