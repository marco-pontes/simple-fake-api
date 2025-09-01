"use strict";
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
