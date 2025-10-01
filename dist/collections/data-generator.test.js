import { generate } from './data-generator';
import { JSONSchemaFaker } from 'json-schema-faker';
// Mockar a biblioteca json-schema-faker para isolar o teste e controlar a saída.
// Usamos o `importOriginal` para manter todos os exports originais.
vi.mock('json-schema-faker', async (importOriginal) => {
    // `importOriginal` importa o módulo real.
    const actual = await importOriginal();
    // Retornamos todos os exports originais, mas substituímos a função `resolve`.
    return {
        ...actual,
        JSONSchemaFaker: {
            ...actual.JSONSchemaFaker,
            resolve: vi.fn(),
        },
    };
});
// Mock de um esquema JSON simples para os testes.
const mockSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            id: { type: 'number' },
            name: { type: 'string' },
        },
        required: ['id', 'name'],
    },
};
// Mock de dados que a biblioteca `json-schema-faker` retornaria.
const mockGeneratedData = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
];
describe('generate', () => {
    // Reset o mock antes de cada teste para garantir um estado limpo.
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('deve gerar dados usando minItems e maxItems passados por parâmetro quando não existirem no schema', async () => {
        JSONSchemaFaker.resolve.mockResolvedValue(mockGeneratedData);
        const min = 3;
        const max = 3;
        const result = await generate(mockSchema, min, max);
        expect(result).toHaveLength(mockGeneratedData.length);
        expect(JSONSchemaFaker.resolve).toHaveBeenCalledWith({
            ...mockSchema,
            minItems: min,
            maxItems: max,
        });
    });
    it('deve usar o valor padrão de quantidade (50 itens) quando minItems e maxItems não forem especificados no schema nem por parâmetro', async () => {
        const mockData50 = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));
        JSONSchemaFaker.resolve.mockResolvedValue(mockData50);
        const result = await generate(mockSchema);
        expect(result).toHaveLength(50);
        // Implementation uses 50 as the effective count when no bounds are provided.
        expect(JSONSchemaFaker.resolve).toHaveBeenCalledWith({
            ...mockSchema,
            minItems: 50,
            maxItems: 50,
        });
    });
    it('deve retornar um array mesmo se o schema não for um array', async () => {
        const mockSingleObjectSchema = {
            type: 'object',
            properties: {
                id: { type: 'number' },
            },
        };
        const mockGeneratedObject = { id: 100 };
        // Configura o mock para resolver com um único objeto.
        JSONSchemaFaker.resolve.mockResolvedValue(mockGeneratedObject);
        const result = await generate(mockSingleObjectSchema, 1, 1);
        // Verifica se o resultado é um array com um único item.
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockGeneratedObject);
    });
});
