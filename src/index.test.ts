// We will mock express, config, routes, and collections to isolate index.ts behavior
vi.mock('express', () => {
  const use = vi.fn();
  const json = vi.fn(() => 'json-mw');
  const listen = vi.fn((_port: number, cb: () => void) => cb());
  const app = { use, listen, get: vi.fn(), post: vi.fn() } as any;
  const express = () => app;
  (express as any).json = json;
  return { default: express };
});

vi.mock('./config', () => ({
  loadConfig: vi.fn(() => ({
    port: 4321,
    apiDir: 'api',
    collectionsDir: 'collections',
    wildcardChar: '_',
  })),
}));

vi.mock('./routes', () => ({
  mapRoutes: vi.fn(async () => ({
    literals: [{ route: '/ping', method: 'GET', handler: () => {} }],
    params: [],
  })),
  addExpressRoutes: vi.fn(),
}));

vi.mock('@/collections', () => ({
  loadCollections: vi.fn(async () => ({ users: [] })),
}));

// mock bootstrap side-effect import so it doesn't do anything
vi.mock('./bootstrap.js', () => ({}));

// import after mocks
import { initialize, start, getCollections, __resetForTests } from './index';
import express from 'express';
import { loadConfig } from './config';
import { mapRoutes, addExpressRoutes } from './routes';
import { loadCollections } from '@/collections';

describe('index (initialize/start)', () => {
  const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const processExit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error('exit ' + code);
  }) as any);

  beforeEach(() => {
    vi.clearAllMocks();
    __resetForTests();
  });

  afterEach(() => {
    // keep spies installed
  });

  it('initialize sets up express, loads config, collections and maps routes', async () => {
    await initialize();

    expect(loadConfig).toHaveBeenCalled();
    expect(loadCollections).toHaveBeenCalledWith('api', 'collections');

    // express app created and json middleware used
    const app = (express as any)();
    expect(app.use).toHaveBeenCalledWith((express as any).json());

    // routes mapped and added
    expect(mapRoutes).toHaveBeenCalledWith('api', '_');
    expect(addExpressRoutes).toHaveBeenCalledWith(
      app,
      [{ route: '/ping', method: 'GET', handler: expect.any(Function) }],
      [],
    );

    // collections getter returns the same collections loaded
    expect(getCollections()).toEqual({ users: [] });

    // log called
    expect(consoleLog).toHaveBeenCalled();
  });

  it('initialize handles error by exiting process', async () => {
    (loadConfig as any).mockImplementationOnce(() => {
      throw new Error('boom');
    });

    await expect(initialize()).rejects.toThrow(/exit 1/);
    expect(consoleError).toHaveBeenCalled();
    expect(processExit).toHaveBeenCalledWith(1);
  });

  it('start exits if initialize not called', () => {
    // simulate fresh module state by calling start without initialize
    expect(() => start()).toThrow(/exit 1/);
    expect(consoleError).toHaveBeenCalledWith(
      'O servidor não foi inicializado. Chame initialize() primeiro.',
    );
  });

  it('start listens on configured port after initialize', async () => {
    await initialize();
    const app = (express as any)();

    // call start and ensure listen invoked
    start();
    expect(app.listen).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(consoleLog).toHaveBeenCalled();
  });
});
