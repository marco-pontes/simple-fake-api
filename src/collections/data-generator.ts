import { JSONSchemaFaker } from 'json-schema-faker';

// Valores padrão quando minItems e maxItems não são fornecidos.
const DEFAULT_MIN_ITEMS = 0;
const DEFAULT_MAX_ITEMS = 50;

/**
 * Gera dados falsos com base em um esquema JSON, respeitando minItems e maxItems.
 *
 * - Se o schema.type === 'array':
 *   - Usa minItems e maxItems do próprio schema quando presentes.
 *   - Caso contrário, usa os valores informados via parâmetros.
 *   - Se ainda assim não informados, aplica os defaults (0 e 50).
 * - Se o esquema não for um array, retorna sempre um array contendo o objeto gerado.
 *
 * @param {any} schema O esquema JSON que define a estrutura e o tipo dos dados.
 * @param {number} [minItems=0] Quantidade mínima de itens quando o schema for um array.
 * @param {number} [maxItems=50] Quantidade máxima de itens quando o schema for um array.
 * @returns {Promise<any[]>} Uma Promise que resolve para um array de dados falsos.
 */
export async function generate(schema: any, minItems?: number, maxItems?: number): Promise<any[]> {
  // Cria uma cópia do esquema para evitar modificar o original.
  const schemaWithCount: any = { ...schema };

  // Ajusta minItems e maxItems apenas se o esquema for do tipo array.
  if ('type' in schemaWithCount && schemaWithCount.type === 'array') {
    const hasSchemaMin = Object.prototype.hasOwnProperty.call(schemaWithCount, 'minItems');
    const hasSchemaMax = Object.prototype.hasOwnProperty.call(schemaWithCount, 'maxItems');
    const paramMinProvided = typeof minItems !== 'undefined';
    const paramMaxProvided = typeof maxItems !== 'undefined';

    let effectiveMin = hasSchemaMin ? (schemaWithCount as any).minItems : (paramMinProvided ? (minItems as number) : DEFAULT_MIN_ITEMS);
    let effectiveMax = hasSchemaMax ? (schemaWithCount as any).maxItems : (paramMaxProvided ? (maxItems as number) : DEFAULT_MAX_ITEMS);

    // Normalize and clamp
    effectiveMin = Math.max(0, Math.floor(effectiveMin));
    effectiveMax = Math.max(0, Math.floor(effectiveMax));
    if (effectiveMin > effectiveMax) effectiveMin = effectiveMax;

    try { console.log('data-generator: computed effectiveMin=', effectiveMin, 'effectiveMax=', effectiveMax); } catch {}
    (schemaWithCount as any).minItems = effectiveMin;
    (schemaWithCount as any).maxItems = effectiveMax;
  }

  // Usa o `JSONSchemaFaker.resolve` para gerar os dados de forma assíncrona.
  try { console.log('data-generator: schemaWithCount before resolve =', JSON.stringify(schemaWithCount)); } catch {}
  // Extra guard: if minItems somehow exceeds maxItems due to external mutation, clamp.
  if ((schemaWithCount as any).type === 'array' && typeof (schemaWithCount as any).minItems === 'number' && typeof (schemaWithCount as any).maxItems === 'number' && (schemaWithCount as any).minItems > (schemaWithCount as any).maxItems) {
    (schemaWithCount as any).minItems = (schemaWithCount as any).maxItems;
  }
  const generatedData = await JSONSchemaFaker.resolve(schemaWithCount);

  // Garante que o retorno seja sempre um array.
  return Array.isArray(generatedData) ? generatedData : [generatedData];
}
