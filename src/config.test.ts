import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
const getLoadConfig = async () => (await import('./config')).loadConfig;
import { DEFAULT_CONFIG, VALID_WILDCARD_CHARS } from '@/utils/constants';

// Helper to build a fake package.json string
const makePkg = (overrides?: Record<string, any>) => {
  const base: any = { name: 'simple-fake-api-test' };
  if (overrides) base['simple-fake-api-config'] = overrides;
  return JSON.stringify(base);
};

// Spy references
let readSpy: MockInstance;
// @ts-ignore
let cwdSpy: any;
// @ts-ignore
let exitSpy: any;
let infoSpy: MockInstance;
let errorSpy: MockInstance;

describe('loadConfig', () => {
  beforeEach(() => {
    // Mock process.cwd to a deterministic path
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/tmp/project');

    // Mock fs.readFileSync
    readSpy = vi.spyOn(fs, 'readFileSync');

    // Spy on console and process.exit
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      // Throw instead of exiting so we can assert it
      // @ts-ignore
      const err: any = new Error('process.exit called');
      err.code = code;
      throw err;
    }) as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses default config when simple-fake-api-config is missing', async () => {
    // Return a package.json without the key
    readSpy.mockReturnValue(makePkg());

    const loadConfig = await getLoadConfig();
    const cfg = loadConfig();
    expect(cfg).toEqual(DEFAULT_CONFIG);

    // Should have read correct path
    expect(readSpy).toHaveBeenCalledWith(path.join('/tmp/project', 'package.json'), 'utf8');
    // Should log info about using defaults
    expect(infoSpy).toHaveBeenCalled();
  });

  it('merges user config with defaults when provided', async () => {
    const user = { port: 1234, apiDir: 'apis', wildcardChar: '_', collectionsDir: 'cols' };
    readSpy.mockReturnValue(makePkg(user));

    const loadConfig = await getLoadConfig();
    const cfg = loadConfig();
    expect(cfg).toEqual({ ...DEFAULT_CONFIG, ...user });
  });

  it('accepts valid single-character wildcardChar', async () => {
    for (const ch of Array.from(VALID_WILDCARD_CHARS)) {
      vi.restoreAllMocks();
      // Re-setup spies for each iteration
      cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/tmp/project');
      readSpy = vi.spyOn(fs, 'readFileSync').mockReturnValue(makePkg({ wildcardChar: ch }));
      infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        const err: any = new Error('process.exit called');
        err.code = code;
        throw err;
      }) as any);

      const loadConfig = await getLoadConfig();
      const cfg = loadConfig();
      expect(cfg.wildcardChar).toBe(ch);
      expect(errorSpy).not.toHaveBeenCalled();
    }
  });

  it('exits with code 1 when wildcardChar is invalid (not in allowed set)', async () => {
    readSpy.mockReturnValue(makePkg({ wildcardChar: 'x' })); // assuming 'x' not in set

    try {
      const loadConfig = await getLoadConfig();
      loadConfig();
      throw new Error('Expected process.exit to be called');
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error);
      expect(e.message).toBe('process.exit called');
      expect(e.code).toBe(1);
      expect(errorSpy).toHaveBeenCalled();
    }
  });

  it('exits when wildcardChar length is not 1', async () => {
    readSpy.mockReturnValue(makePkg({ wildcardChar: '**' }));

    try {
      const loadConfig = await getLoadConfig();
      loadConfig();
      throw new Error('Expected process.exit to be called');
    } catch (e: any) {
      expect(e.code).toBe(1);
      expect(errorSpy).toHaveBeenCalled();
    }
  });

  it('uses defaults when package.json is unreadable or invalid JSON', async () => {
    // Cause JSON.parse to fail by returning invalid JSON
    readSpy.mockReturnValue('this is not json');

    const loadConfig = await getLoadConfig();
    const cfg = loadConfig();
    expect(cfg).toEqual(DEFAULT_CONFIG);
    expect(infoSpy).toHaveBeenCalled();
  });

  it('handles empty user config object gracefully', async () => {
    readSpy.mockReturnValue(makePkg({}));
    const loadConfig = await getLoadConfig();
    const cfg = loadConfig();
    expect(cfg).toEqual({ ...DEFAULT_CONFIG });
  });
});
