/**
 * Configurações padrão para a Fast API.
 * Estas configurações serão usadas se não forem definidas no package.json.
 */
export const DEFAULT_CONFIG = {
    port: 5000,
    apiDir: 'api',
    wildcardChar: '_',
    collectionsDir: 'collections',
};
export const VALID_WILDCARD_CHARS = new Set([
    '!',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
    '_',
    '-',
    '+',
    '=',
    '~',
]);
