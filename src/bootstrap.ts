/**
 * Este arquivo atua como um "bootstrap" para o ambiente de execução.
 * Seu propósito é simular o objeto 'location' do navegador no ambiente Node.js.
 * Isso é crucial para bibliotecas como `$RefParser` (usada pelo `json-schema-faker`)
 * que esperam encontrar essa variável globalmente para resolver referências.
 * Ao garantir que 'location' esteja sempre presente, evitamos o erro
 * "ReferenceError: location is not defined" em tempo de execução.
 */
// Define uma interface para o objeto global 'location' que o TypeScript pode reconhecer.

// Verifica se o objeto 'location' existe no escopo global.
if (typeof globalThis.location === 'undefined') {
  // Se não existir (estamos em Node.js), cria um objeto simulado.
  console.log("Simulando o objeto 'location' para o ambiente Node.js...");

  // Cria e atribui o objeto simulado ao escopo global.
  // @ts-ignore
  globalThis.location = {
    href: '',
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  };
}
