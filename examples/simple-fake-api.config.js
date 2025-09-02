// Example configuration file for simple-fake-api
// Export a CommonJS object so the bundler helper can require it synchronously.
module.exports = {
  port: 5000,
  apiDir: 'api',
  collectionsDir: 'collections',
  wildcardChar: '_',
  // Choose which route file extension to map: 'js' or 'ts'
  routeFileExtension: 'ts',
  http: {
    endpoints: {
      'api-server': {
        // development has no baseUrl; plugin will compute http://localhost:PORT
        staging: { baseUrl: 'https://staging.example.com' },
        production: { baseUrl: 'https://api.example.com' },
        'my-custom-env': { baseUrl: 'https://api.example.com' },
      },
    },
  },
};
