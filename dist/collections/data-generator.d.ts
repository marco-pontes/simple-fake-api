/**
 * Gera um array de objetos falsos com base em um esquema JSON e um número de itens.
 *
 * @param {any} schema O esquema JSON que define a estrutura e o tipo dos dados.
 * @param {number} [count=50] O número de objetos a serem gerados.
 * @returns {Promise<any[]>} Uma Promise que resolve para um array de objetos falsos.
 */
export declare function generate(schema: any, count?: number): Promise<any[]>;
