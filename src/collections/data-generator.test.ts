import type { Mock } from 'vitest';
import { generate } from './data-generator';
import { JSONSchemaFaker } from 'json-schema-faker';

// Mockar a biblioteca json-schema-faker para isolar o teste e controlar a saída.
// Usamos o `importOriginal` para manter todos os exports originais.
vi.mock('json-schema-faker', async (importOriginal) => {
  // `importOriginal` importa o módulo real.
  const actual = await importOriginal<typeof import('json-schema-faker')>();

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

  it('deve gerar dados com a quantidade especificada', async () => {
    // Configura o mock para resolver com 3 itens.
    (JSONSchemaFaker.resolve as Mock).mockResolvedValue(mockGeneratedData);

    // Chama a função com um número específico de itens.
    const count = 3;
    const result = await generate(mockSchema, count);

    // Verifica se a função retorna um array com a quantidade correta de itens.
    expect(result).toHaveLength(count);

    // Verifica se `json-schema-faker` foi chamado com os parâmetros corretos.
    expect(JSONSchemaFaker.resolve).toHaveBeenCalledWith({
      ...mockSchema,
      minItems: count,
      maxItems: count,
    });
  });

  it('deve usar o valor padrão de 50 itens se a contagem não for especificada', async () => {
    const mockData50 = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));
    // Configura o mock para simular 50 itens.
    (JSONSchemaFaker.resolve as Mock).mockResolvedValue(mockData50);

    // Chama a função sem especificar a contagem.
    const result = await generate(mockSchema);

    // Verifica se o resultado tem o tamanho padrão.
    expect(result).toHaveLength(50);

    // Verifica se `json-schema-faker` foi chamado com os valores padrão.
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
    (JSONSchemaFaker.resolve as Mock).mockResolvedValue(mockGeneratedObject);

    const result = await generate(mockSingleObjectSchema, 1);

    // Verifica se o resultado é um array com um único item.
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockGeneratedObject);
  });
});
