import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const getLoadConfig = async () => (await import('./config')).loadConfig;
import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from '@/utils/constants';
// Helper to build a fake config object
const makeCfg = (overrides) => ({
    port: 5000,
    apiDir: 'api',
    collectionsDir: 'collections',
    wildcardChar: '_',
    ...(overrides || {}),
});
// @ts-ignore
let cwdSpy;
// @ts-ignore
let exitSpy;
let infoSpy;
let errorSpy;
// Helper to mock the config loader return value before importing loadConfig
const mockLoader = (value) => {
    vi.doMock('./utils/config-loader', () => ({
        loadSimpleFakeApiConfigSync: () => value,
    }));
};
describe('loadConfig', () => {
    beforeEach(() => {
        // Mock process.cwd to a deterministic path
        cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/tmp/project');
        // Spy on console and process.exit
        infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
            // Throw instead of exiting so we can assert it
            // @ts-ignore
            const err = new Error('process.exit called');
            err.code = code;
            throw err;
        }));
    });
    afterEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });
    it('uses default config when loader returns undefined', async () => {
        mockLoader(undefined);
        const loadConfig = await getLoadConfig();
        const cfg = loadConfig();
        expect(cfg).toEqual(DEFAULT_CONFIG);
        expect(infoSpy).toHaveBeenCalled();
    });
    it('merges user config with defaults when provided', async () => {
        mockLoader(makeCfg({ port: 1234, apiDir: 'apis', wildcardChar: '_', collectionsDir: 'cols' }));
        const loadConfig = await getLoadConfig();
        const cfg = loadConfig();
        expect(cfg).toEqual({ ...DEFAULT_CONFIG, port: 1234, apiDir: 'apis', wildcardChar: '_', collectionsDir: 'cols' });
    });
    it('accepts valid single-character wildcardChar', async () => {
        for (const ch of Array.from(VALID_WILDCARD_CHARS)) {
            vi.resetModules();
            mockLoader(makeCfg({ wildcardChar: ch }));
            const loadConfig = await getLoadConfig();
            const cfg = loadConfig();
            expect(cfg.wildcardChar).toBe(ch);
            expect(errorSpy).not.toHaveBeenCalled();
        }
    });
    it('exits with code 1 when wildcardChar is invalid (not in allowed set)', async () => {
        mockLoader(makeCfg({ wildcardChar: 'x' }));
        try {
            const loadConfig = await getLoadConfig();
            loadConfig();
            throw new Error('Expected process.exit to be called');
        }
        catch (e) {
            expect(e).toBeInstanceOf(Error);
            expect(e.message).toBe('process.exit called');
            expect(e.code).toBe(1);
            expect(errorSpy).toHaveBeenCalled();
        }
    });
    it('exits when wildcardChar length is not 1', async () => {
        mockLoader(makeCfg({ wildcardChar: '**' }));
        try {
            const loadConfig = await getLoadConfig();
            loadConfig();
            throw new Error('Expected process.exit to be called');
        }
        catch (e) {
            expect(e.code).toBe(1);
            expect(errorSpy).toHaveBeenCalled();
        }
    });
    it('handles empty user config object gracefully', async () => {
        mockLoader(makeCfg({}));
        const loadConfig = await getLoadConfig();
        const cfg = loadConfig();
        expect(cfg).toEqual({ ...DEFAULT_CONFIG });
    });
});
