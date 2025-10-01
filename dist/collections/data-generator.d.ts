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
export declare function generate(schema: any, minItems?: number, maxItems?: number): Promise<any[]>;
