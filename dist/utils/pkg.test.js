import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const getPkgUtils = async () => await import('./pkg');
let readSpy;
// note: we mock process.cwd but do not store the spy reference
const makePkg = (overrides) => {
    const base = { name: 'pkg-utils-test' };
    if (overrides)
        base['simple-fake-api-config'] = overrides;
    return JSON.stringify(base);
};
const makePkgWithHttp = (httpSection) => {
    const base = { name: 'pkg-utils-test', 'simple-fake-api-config': {} };
    if (httpSection)
        base['simple-fake-api-config']['http'] = httpSection;
    return JSON.stringify(base);
};
describe('utils/pkg', () => {
    beforeEach(() => {
        vi.spyOn(process, 'cwd').mockReturnValue('/tmp/project');
        readSpy = vi.spyOn(fs, 'readFileSync');
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('readPackageJson reads custom path via fs (supports spying)', async () => {
        const { readPackageJson } = await getPkgUtils();
        readSpy.mockReturnValue('{"name":"x"}');
        const res = readPackageJson('/tmp/custom/package.json');
        expect(readSpy).toHaveBeenCalledWith('/tmp/custom/package.json', 'utf8');
        expect(res).toEqual({ name: 'x' });
    });
    it('readPackageJson reads from cwd package.json path', async () => {
        const { readPackageJson } = await getPkgUtils();
        const pkgPath = path.join('/tmp/project', 'package.json');
        readSpy.mockReturnValue('{"name":"y"}');
        const res = readPackageJson();
        expect(readSpy).toHaveBeenCalledWith(pkgPath, 'utf8');
        expect(res).toEqual({ name: 'y' });
    });
    it('readPackageJson returns undefined on invalid JSON or unreadable', async () => {
        const { readPackageJson } = await getPkgUtils();
        readSpy.mockReturnValue('not json');
        const res = readPackageJson();
        expect(res).toBeUndefined();
    });
    it('readSimpleFakeApiConfig returns undefined when key is missing', async () => {
        const { readSimpleFakeApiConfig } = await getPkgUtils();
        readSpy.mockReturnValue(JSON.stringify({ name: 'no-config' }));
        const res = readSimpleFakeApiConfig();
        expect(res).toBeUndefined();
    });
    it('readSimpleFakeApiConfig returns object when present', async () => {
        const { readSimpleFakeApiConfig } = await getPkgUtils();
        const user = { port: 1234, apiDir: 'api', collectionsDir: 'collections', wildcardChar: '_' };
        readSpy.mockReturnValue(makePkg(user));
        const res = readSimpleFakeApiConfig();
        expect(res).toEqual(user);
    });
    it('readSimpleFakeApiHttpConfig returns nested http section', async () => {
        const { readSimpleFakeApiHttpConfig } = await getPkgUtils();
        const http = {
            endpoints: {
                'api': { dev: { baseUrl: 'http://localhost:5000' } },
            },
        };
        readSpy.mockReturnValue(makePkgWithHttp(http));
        const res = readSimpleFakeApiHttpConfig();
        expect(res).toEqual(http);
    });
    it('readSimpleFakeApiHttpConfig returns undefined when http missing', async () => {
        const { readSimpleFakeApiHttpConfig } = await getPkgUtils();
        readSpy.mockReturnValue(makePkgWithHttp(undefined));
        const res = readSimpleFakeApiHttpConfig();
        expect(res).toBeUndefined();
    });
});
