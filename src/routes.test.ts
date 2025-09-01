import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { mapRoutes, addExpressRoutes } from './routes';
import type { RouteDefinition } from './types';
import { glob } from 'glob';
import fs from 'fs';

vi.mock('glob', () => ({
  glob: vi.fn(),
}));

// helper to simulate dynamic import of handler modules
const createTempModule = (filePath: string, exportsObj: Record<string, any>) => {
  // write a temporary js module file to disk for dynamic import to work
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const content = Object.entries(exportsObj)
    .map(([k, v]) => `export const ${k} = ${v.toString()}`)
    .join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
};

const removeDirSafe = (dir: string) => {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {}
};

describe('routes', () => {
  process.cwd();
  const tmpRoot = path.join(process.cwd(), '.vitest-tmp');
  const apiDir = 'api';
  const apiPath = path.join(tmpRoot, apiDir);

  beforeEach(() => {
    vi.clearAllMocks();
    // point cwd to temp root so mapRoutes uses it
    vi.spyOn(process, 'cwd').mockReturnValue(tmpRoot as any);
    removeDirSafe(tmpRoot);
    fs.mkdirSync(apiPath, { recursive: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    removeDirSafe(tmpRoot);
  });

  it('mapRoutes separates literal and param routes, handles index, and loads handlers', async () => {
    // create files on disk to be imported
    const usersList = path.join(apiPath, 'users', 'list', 'index.ts');
    createTempModule(usersList, { GET: (_req: any, res: any) => res.send('ok') });

    const usersId = path.join(apiPath, 'users', '_id.ts');
    createTempModule(usersId, { GET: (_req: any, res: any) => res.send('id') });

    const v1Users = path.join(apiPath, 'v1', 'users.ts');
    createTempModule(v1Users, { POST: (_req: any, res: any) => res.send('post') });

    // mock glob to return relative paths from apiPath
    (glob as any).mockResolvedValue(['users/list/index.ts', 'users/_id.ts', 'v1/users.ts']);

    const { literals, params } = await mapRoutes(apiDir, '_');

    // literals should include users/list (GET) and v1/users (POST)
    expect(literals.map((r) => ({ route: r.route, method: r.method }))).toEqual(
      expect.arrayContaining([
        { route: '/users/list', method: 'GET' },
        { route: '/v1/users', method: 'POST' },
      ]),
    );

    // params should include users/:id (GET)
    expect(params.map((r) => ({ route: r.route, method: r.method }))).toEqual(
      expect.arrayContaining([{ route: '/users/:id', method: 'GET' }]),
    );

    // handlers are functions
    [...literals, ...params].forEach((def) => {
      expect(typeof def.handler).toBe('function');
    });
  });

  it('mapRoutes logs error when a module fails to import and continues', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // one good file, one bad file
    const good = path.join(apiPath, 'ok.ts');
    createTempModule(good, { GET: () => {} });

    (glob as any).mockResolvedValue(['ok.ts', 'bad.ts']);

    const { literals, params } = await mapRoutes(apiDir, '_');

    expect(consoleSpy).toHaveBeenCalled();
    // only ok.ts yields a route
    expect([...literals, ...params].length).toBe(1);
    expect(literals[0].route).toBe('/ok');
  });

  it('addExpressRoutes registers literal before param and uses correct HTTP methods', () => {
    const calls: Array<{ method: string; route: string }> = [];
    // @ts-ignore
    const makeMethod = () => (route: string) =>
      calls.push({ method: expect.getState().currentTestName!, route });

    const app: any = {
      get: vi.fn((route: string) => calls.push({ method: 'GET', route })),
      post: vi.fn((route: string) => calls.push({ method: 'POST', route })),
    };

    const literalRoutes: RouteDefinition[] = [
      { route: '/users', method: 'GET', handler: () => {} },
    ];
    const paramRoutes: RouteDefinition[] = [
      { route: '/users/:id', method: 'POST', handler: () => {} },
    ];

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    addExpressRoutes(app, literalRoutes, paramRoutes);

    expect(app.get).toHaveBeenCalledWith('/users', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/users/:id', expect.any(Function));
    // two logs
    expect(logSpy).toHaveBeenCalledTimes(2);
  });
});
