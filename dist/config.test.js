import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const getLoadConfig = async () => (await import('./config')).loadConfig;
import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from '@/utils/constants';
// Helper to build a fake injected config object
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
        vi.restoreAllMocks();
    });
    it('uses default config when injected global is missing', async () => {
        // Ensure no global is set
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
        const loadConfig = await getLoadConfig();
        const cfg = loadConfig();
        expect(cfg).toEqual(DEFAULT_CONFIG);
        // Should log info about using defaults
        expect(infoSpy).toHaveBeenCalled();
    });
    it('merges user config with defaults when provided', async () => {
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_CONFIG__ = makeCfg({ port: 1234, apiDir: 'apis', wildcardChar: '_', collectionsDir: 'cols' });
        const loadConfig = await getLoadConfig();
        const cfg = loadConfig();
        expect(cfg).toEqual({ ...DEFAULT_CONFIG, port: 1234, apiDir: 'apis', wildcardChar: '_', collectionsDir: 'cols' });
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
    });
    it('accepts valid single-character wildcardChar', async () => {
        for (const ch of Array.from(VALID_WILDCARD_CHARS)) {
            vi.restoreAllMocks();
            // Re-setup spies for each iteration
            cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/tmp/project');
            infoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
            errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
                const err = new Error('process.exit called');
                err.code = code;
                throw err;
            }));
            // @ts-ignore
            globalThis.__SIMPLE_FAKE_API_CONFIG__ = makeCfg({ wildcardChar: ch });
            const loadConfig = await getLoadConfig();
            const cfg = loadConfig();
            expect(cfg.wildcardChar).toBe(ch);
            expect(errorSpy).not.toHaveBeenCalled();
            // @ts-ignore
            delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
        }
    });
    it('exits with code 1 when wildcardChar is invalid (not in allowed set)', async () => {
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_CONFIG__ = makeCfg({ wildcardChar: 'x' });
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
        finally {
            // @ts-ignore
            delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
        }
    });
    it('exits when wildcardChar length is not 1', async () => {
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_CONFIG__ = makeCfg({ wildcardChar: '**' });
        try {
            const loadConfig = await getLoadConfig();
            loadConfig();
            throw new Error('Expected process.exit to be called');
        }
        catch (e) {
            expect(e.code).toBe(1);
            expect(errorSpy).toHaveBeenCalled();
        }
        finally {
            // @ts-ignore
            delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
        }
    });
    it('handles empty injected user config object gracefully', async () => {
        // @ts-ignore
        globalThis.__SIMPLE_FAKE_API_CONFIG__ = makeCfg({});
        const loadConfig = await getLoadConfig();
        const cfg = loadConfig();
        expect(cfg).toEqual({ ...DEFAULT_CONFIG });
        // @ts-ignore
        delete globalThis.__SIMPLE_FAKE_API_CONFIG__;
    });
});
