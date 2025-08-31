import { JSONSchemaFaker } from 'json-schema-faker';

// Define um valor padrão de 50 para o número de itens, se não for especificado.
const DEFAULT_ITEM_COUNT = 50;

/**
 * Gera um array de objetos falsos com base em um esquema JSON e um número de itens.
 *
 * @param {any} schema O esquema JSON que define a estrutura e o tipo dos dados.
 * @param {number} [count=50] O número de objetos a serem gerados.
 * @returns {Promise<any[]>} Uma Promise que resolve para um array de objetos falsos.
 */
export async function generate(schema: any, count: number = DEFAULT_ITEM_COUNT): Promise<any[]> {
  // Cria uma cópia do esquema para evitar modificar o original.
  const schemaWithCount = { ...schema };

  // Adiciona as propriedades de contagem apenas se o esquema for do tipo array.
  if ('type' in schemaWithCount && schemaWithCount.type === 'array') {
    schemaWithCount.minItems = count;
    schemaWithCount.maxItems = count;
  }

  // Usa o `jsf.resolve` para gerar os dados de forma assíncrona.
  const generatedData = await JSONSchemaFaker.resolve(schemaWithCount);

  // O jsf.resolve pode retornar um único objeto se o esquema não for um array.
  // Garantimos que o retorno seja sempre um array.
  return Array.isArray(generatedData) ? generatedData : [generatedData];
}
