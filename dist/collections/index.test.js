import { loadCollections, resetCollectionsCache } from './index';
import * as fs from 'fs';
import * as path from 'path';
import { generate } from '@/collections/data-generator';
// Mocks robustos para os módulos 'fs' e 'path' que garantem a presença
// dos exports nomeados e do 'default' export.
// Isso resolve o problema de "No default export".
vi.mock('fs', async () => {
    const originalFs = await vi.importActual('fs');
    const readdirSyncMock = vi.fn();
    const readFileSyncMock = vi.fn();
    return {
        // Retorna todos os exports originais
        ...originalFs,
        // Sobrescreve apenas as funções que precisamos mockar
        readdirSync: readdirSyncMock,
        readFileSync: readFileSyncMock,
        // Garante que o 'default' export também tenha essas funções mockadas
        default: {
            ...originalFs,
            readdirSync: readdirSyncMock,
            readFileSync: readFileSyncMock,
        },
    };
});
vi.mock('path', async () => {
    const originalPath = await vi.importActual('path');
    const basenameMock = vi.fn((filePath) => filePath
        .split('/')
        .pop()
        ?.replace(/\.json$/, '') ?? '');
    const joinMock = vi.fn((...args) => args.join('/'));
    return {
        ...originalPath,
        join: joinMock,
        basename: basenameMock,
        default: {
            ...originalPath,
            join: joinMock,
            basename: basenameMock,
        },
    };
});
vi.mock('@/collections/data-generator', () => ({
    generate: vi.fn(),
}));
// Uses vi.spyOn to reliably intercept and mock process.cwd().
const mockCwd = vi.spyOn(process, 'cwd').mockReturnValue('/fake-path');
// Variables for mock data.
const MOCK_CONFIG = {
    apiDir: 'api',
    collectionsDir: 'collections',
};
const mockUsersSchema = JSON.stringify({
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
        },
    },
});
const mockGeneratedUsers = [
    { id: 1, name: 'João' },
    { id: 2, name: 'Maria' },
];
beforeEach(() => {
    // RESET THE CACHE FOR EACH TEST. THIS IS CRUCIAL FOR ISOLATING THE TESTS.
    resetCollectionsCache();
    // Configures the mocks to simulate reading a "users.json" file.
    // This ensures a clean state before each test.
    fs.readdirSync.mockReturnValue(['users.json']);
    fs.readFileSync.mockReturnValue(mockUsersSchema);
    generate.mockResolvedValue(mockGeneratedUsers);
});
afterEach(() => {
    // Resets all mocks to ensure the state does not leak between tests.
    vi.clearAllMocks();
});
describe('loadCollections', () => {
    it('should load and generate collections from JSON files', async () => {
        const collections = await loadCollections(MOCK_CONFIG.apiDir, MOCK_CONFIG.collectionsDir);
        // Checks if the functions were called correctly with the mocked paths.
        expect(mockCwd).toHaveBeenCalled();
        expect(fs.readdirSync).toHaveBeenCalledWith('/fake-path/api/collections');
        expect(fs.readFileSync).toHaveBeenCalledWith('/fake-path/api/collections/users.json', 'utf8');
        expect(generate).toHaveBeenCalledWith(JSON.parse(mockUsersSchema));
        // Checks if the collection was generated and returned correctly.
        expect(collections).toEqual({ users: mockGeneratedUsers });
    });
    it('should not load the collections again if they are already cached', async () => {
        // First call to populate the cache.
        const firstLoad = await loadCollections(MOCK_CONFIG.apiDir, MOCK_CONFIG.collectionsDir);
        // Clears the mocks for the next call, except for those that need to be active.
        fs.readdirSync.mockClear();
        fs.readFileSync.mockClear();
        path.join.mockClear();
        generate.mockClear();
        // Second call, which should use the cache.
        const secondLoad = await loadCollections(MOCK_CONFIG.apiDir, MOCK_CONFIG.collectionsDir);
        // Checks if the `readdirSync` function was not called again,
        // which proves that the cache was used.
        expect(fs.readdirSync).not.toHaveBeenCalled();
        expect(fs.readFileSync).not.toHaveBeenCalled();
        expect(secondLoad).toBe(firstLoad);
    });
    it('should return an empty object in case of a directory read error', async () => {
        // Simulates an error in reading the directory, overriding the beforeEach mock.
        fs.readdirSync.mockImplementation(() => {
            throw new Error('Directory not found.');
        });
        const collections = await loadCollections(MOCK_CONFIG.apiDir, MOCK_CONFIG.collectionsDir);
        // Expects the result to be an empty object.
        expect(collections).toEqual({});
    });
});
