/**
 * Este arquivo atua como um "bootstrap" para o ambiente de execução.
 * Seu propósito é simular o objeto 'location' do navegador no ambiente Node.js.
 * Isso é crucial para bibliotecas como `$RefParser` (usada pelo `json-schema-faker`)
 * que esperam encontrar essa variável globalmente para resolver referências.
 * Ao garantir que 'location' esteja sempre presente, evitamos o erro
 * "ReferenceError: location is not defined" em tempo de execução.
 */
interface GlobalLocation {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
}
