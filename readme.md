# simple-fake-api

A small, fast file‑based fake API server for Node.js. Define endpoints by creating files in a folder (no codegen, no config files), and get realistic data using @faker-js/faker and json-schema-faker for collections.

- Express-based HTTP server
- File-system routing: map files in `apiDir` to routes automatically
- Dynamic params via `wildcardChar` (e.g., `api/users/_id.ts` -> `/users/:id`)
- HTTP method by exported function name in the file (e.g., `export const get = ...` -> `GET`)
- Collections: generate large arrays of realistic objects from JSON Schema using json-schema-faker
- Zero DB, zero migrations; perfect for front-end development, demos, and tests

## Installation

Note on TypeScript support:
- This library bundles ts-node as a runtime dependency and attempts to register it automatically. Consumers can use .ts route files and a TypeScript simple-fake-api.config.ts without installing ts-node in their project.
- Registration prefers 'ts-node/register/transpile-only' for speed and falls back to 'ts-node/register'. If, for any reason, ts-node cannot be loaded, a warning is logged and loading .ts files may fail.

- Note for pnpm users (automatic config generation):
  - pnpm may skip postinstall scripts by default for security. If the simple-fake-api.config.js file was not created automatically after installation, approve the build for this package:
    - Run: pnpm approve-builds
    - Select @marco-pontes/simple-fake-api in the list to allow its postinstall script.
  - Alternatively, you can generate the default configuration via the CLI at any time:
    - npx @marco-pontes/simple-fake-api init
    - or if installed locally: npm run simple-fake-api init (or just simple-fake-api init if available in PATH)
  - The CLI and postinstall will choose the correct file extension based on your project's setup:
    - If your project uses TypeScript (has a tsconfig.json or depends on typescript), it will create simple-fake-api.config.ts
    - Otherwise, CommonJS projects: simple-fake-api.config.cjs (module.exports)
    - Otherwise, ESM projects ("type": "module"): simple-fake-api.config.js (export default)

- Prerequisites: Node.js >= 18 (tested with Node 22.18.0)
- Install:

  ```bash
  npm i @marco-pontes/simple-fake-api
  ```

## Quickstart (TL;DR)

1. Create a simple-fake-api.config.js file at your project root

```js
// simple-fake-api.config.js
module.exports = {
  port: 5000,
  apiDir: 'api',
  collectionsDir: 'collections',
  wildcardChar: '_',
};
```

2. Create your first endpoint file: api/ping.ts

```ts
export const get = (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
};
```

3. (Optional) Create a collection schema: api/collections/users.json

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "name": { "type": "string" },
      "email": { "type": "string", "format": "email" }
    },
    "required": ["id", "name", "email"]
  }
}
```

4. Add a script to start simple-fake-api

```jsonc
{
  "scripts": {
    "api": "simple-fake-api"
  }
}
```

Alternatively, you can run it without adding a script using npx:

```bash
npx @marco-pontes/simple-fake-api
```

5. Build and run

```bash
npm run build
npm run api
```

Open <http://localhost:5000/ping>

## Capabilities

- File-based routing from `apiDir`
  - `index.ts` -> removes "/index" from the path
  - Nested folders become nested routes (`api/v1/users/index.ts` -> `/v1/users`)
- Dynamic route params via `wildcardChar`
  - Example: `api/users/_id.ts` -> `/users/:id`
- HTTP method from exported function name
  - `export const get = ...` => `GET`
  - `export const post = ...` => `POST`
  - `export const put = ...` => `PUT`
  - `export const delete = ...` => `DELETE`
  - If multiple are exported, each method is mapped for the same path
- Collections (json-schema-faker)
  - Place JSON Schema files in `api/collections`
  - They are generated at startup and available in any handler via `getCollections()`

## Configuration (simple-fake-api.config.js)

Create a file named simple-fake-api.config.js at your project root that exports the configuration object. If your project package.json has "type": "module", prefer simple-fake-api.config.js with ESM syntax (export default {...}); for CommonJS projects, the CLI/postinstall will generate simple-fake-api.config.cjs using module.exports.

```js
// simple-fake-api.config.js (CommonJS)
module.exports = {
  port: 5000,
  apiDir: 'api',
  collectionsDir: 'collections',
  wildcardChar: '_',
  // Optional HTTP client mapping for non-development environments
  http: {
    endpoints: {
      'api-server': {
        // development environment uses http://localhost:PORT automatically
        staging: { baseUrl: 'https://staging.endpoint.com' },
        production: { baseUrl: 'https://prod.endpoint.com' },
      },
    },
  },
};
```

Troubleshooting: bundler cannot load config
- The bundler helper loads simple-fake-api.config.js synchronously. Prefer CommonJS export (module.exports = { ... }).
- The loader searches from your project root using INIT_CWD (when available) or process.cwd(). It checks these files in order: simple-fake-api.config.js, .cjs, .mjs. ESM-only .mjs is not supported synchronously.
- If you see an error saying it “could not load simple-fake-api.config.js”, ensure the file exists at the project root and uses CommonJS export, or rename it to .cjs.

Configuration options and defaults:

| Key            | Type   | Description                                                                 | Default       | Allowed values / Notes                                           |
| -------------- | ------ | --------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| port           | number | Server port to listen on.                                                   | 5000          | Any free TCP port.                                               |
| apiDir         | string | Directory (relative to project root) containing your route files.           | "api"         | Must exist in your project. Nested folders map to nested routes. |
| collectionsDir | string | Subdirectory inside apiDir where JSON Schema files for collections live.    | "collections" | Files must be .json. Generated at startup and cached.            |
| wildcardChar   | string | Single character used in filenames to denote dynamic segments (e.g., \_id). | "\_"          | Must be exactly 1 char from: ! @ # $ % ^ & \* \_ - + = ~         |

Notes:

- Manage these settings exclusively via simple-fake-api.config.js.
- Example: with `wildcardChar` "_", a file `api/users/_id.ts` maps to `GET /users/:id`. 

## URL mapping examples (5)

Given `wildcardChar` "_": 

1. `api/v1/users.ts` -> `GET /v1/users`
   File content:

```ts
export const get = (_req, res) => {
  res.json([{ id: 1, name: 'A' }]);
};
```

2. `api/users/list/index.ts` -> `GET /users/list`
   File content:

```ts
export const get = (_req, res) => {
  res.json(['a', 'b', 'c']);
};
```

3. `api/users/_id.ts` -> `GET /users/:id`
   File content:

```ts
export const get = (req, res) => {
  res.json({ id: req.params.id });
};
```

4. `api/users/create.js` -> `POST /users/create`
   File content:

```js
export const post = (req, res) => {
  res.status(201).json({ created: true, body: req.body });
};
```

5. `api/v1/users/_id/details.ts` -> `GET /v1/users/:id/details`
   File content:

```ts
export const get = (req, res) => {
  res.json({ id: req.params.id, details: true });
};
```

## Collections with json-schema-faker (4 examples)

Place these JSON files under api/collections. On startup, simple-fake-api generates arrays using JSON Schema Faker. In your handlers, use:

```ts
import { getCollections } from 'simple-fake-api';
const { users, products, orders, comments } = getCollections();
```

1. users.json

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "name": { "type": "string" },
      "email": { "type": "string", "format": "email" }
    },
    "required": ["id", "name", "email"]
  }
}
```

2. products.json

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "title": { "type": "string" },
      "price": { "type": "number", "minimum": 1 }
    },
    "required": ["id", "title", "price"]
  }
}
```

3. orders.json

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "userId": { "type": "integer" },
      "total": { "type": "number", "minimum": 0 }
    },
    "required": ["id", "userId", "total"]
  }
}
```

4. comments.json

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "integer" },
      "postId": { "type": "integer" },
      "body": { "type": "string" }
    },
    "required": ["id", "postId", "body"]
  }
}
```

By default, the generator creates 50 items per collection (configurable in code; schemas can specify their own array size constraints as well).

### Using collections inside a route

Example: api/users/index.ts

```ts
import { getCollections } from 'simple-fake-api';

export const get = (_req, res) => {
  const { users } = getCollections();
  res.json(users);
};
```

## Example project structure

```text
my-app/
├─ package.json
├─ tsconfig.json
├─ api/
│ ├─ collections/
│ │ ├─ users.json
│ │ ├─ products.json
│ │ ├─ orders.json
│ │ └─ comments.json
│ ├─ ping.ts
│ ├─ v1/
│ │ └─ users.ts
│ └─ users/
│    ├─ index.ts
│    └─ _id.ts
└─ src/ (your app code if needed)
```

Example minimal package scripts (consumer project)

```jsonc
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "api": "simple-fake-api"
  },
  "dependencies": {
    "@marco-pontes/simple-fake-api": "latest"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

Notes

- If you’re not using TypeScript, omit the build step and use `.js` files in `api/`.
- Your routes are ESM modules; export named handlers by HTTP verb (`GET`, `POST`, etc.).

## Programmatic usage

### Environment-aware HTTP client for front-end apps (bundler-friendly)

- Import the HTTP client creator from the subpath export:
  - import { create } from '@marco-pontes/simple-fake-api/http'

Important changes:
- HTTP configuration should be provided at build time by your bundler (Vite/Webpack), not from package.json.
- The client reads configuration injected by the bundler via the setupSimpleFakeApiHttpRoutes plugin (no global named SIMPLE_FAKE_API_HTTP to reference directly).
- If no config is injected (e.g., local development in Node), the client falls back to http://localhost:<port> using the port from your simple-fake-api.config.js.
- For browser bundles, you can inject whichever environments you need (e.g., dev/prod). The client will pick based on NODE_ENV (dev by default).

Vite example (synchronous config to avoid async define issues):

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { setupSimpleFakeApiHttpRoutes } from '@marco-pontes/simple-fake-api/bundler';

let environment = process.env.NODE_ENV || 'development';

// Use the setupSimpleFakeApiHttpRoutes directly and synchronously so env vars are set before Vite proceeds
const apiConfig = setupSimpleFakeApiHttpRoutes(environment);

export default defineConfig({
  define: {
    ...apiConfig,
  },
});
```

How it works:
- The plugin loads simple-fake-api.config.js from your project root and picks the correct baseUrl per endpoint for the provided environment string.
- In development, baseUrl is computed as http://localhost:<port from simple-fake-api.config.js> (no baseUrl needed in the config for dev).
- For other environments (e.g., production, staging, or any custom name), add a baseUrl under http.endpoints.<endpoint>.<envName> in your simple-fake-api.config.js.

Webpack example (DefinePlugin already takes a plain object synchronously):

```js
// webpack.config.js
const webpack = require('webpack');
const { setupSimpleFakeApiHttpRoutes } = require('@marco-pontes/simple-fake-api/bundler');

module.exports = (env) => {
  const environment = process.env.NODE_ENV || 'production';
  // Call helper synchronously before returning config
  const apiConfig = setupSimpleFakeApiHttpRoutes(environment);
  return {
    // ...
    plugins: [
      new webpack.DefinePlugin(apiConfig),
    ],
  };
};
```

Notes on async: In Vite, returning a function can encourage async patterns which may evaluate define later; by computing the object first as shown above, you avoid any timing issues. In Webpack, DefinePlugin expects a plain object and is evaluated during compilation synchronously, so using the helper as shown is safe.

Using the client in your app:

```ts
import { create } from '@marco-pontes/simple-fake-api/http';

// Build-time injected config selects the baseUrl for this endpoint name
const api = create('api-server');

const res = await api.get('/users');
const created = await api.post('/users', { name: 'John' });
```

Node/local development fallback:
- If you don’t inject any config via the bundler, the client will read your simple-fake-api.config.js port and use http://localhost:<port> for any endpoint name you pass to create().
- This lets you run your front-end dev server against the local Simple Fake API without extra setup.

Notes:
- The library no longer reads any http configuration from package.json. Provide HTTP client configuration via bundler injection; for local Node development without injection, the client falls back to http://localhost:<port> using the port in simple-fake-api.config.js.
- For typing HTTP handlers in your Simple Fake API project, import types from the http subpath: import type { Request, Response } from '@marco-pontes/simple-fake-api/http'

Embedding the server in another Node process (optional):

```ts
import { initialize, start, getCollections } from 'simple-fake-api';

await initialize();
console.log(Object.keys(getCollections()));
start();
```

## Tips and conventions

- Exported function name sets method: export const post = ... -> POST
- index.ts removes the trailing path segment
- Use wildcardChar for dynamic segments; default is "\_"
- Collections are cached after generation for speed

## Troubleshooting

- 404? Ensure your file name and folder structure match the expected route.
- Dynamic segments not working? Check `simple-fake-api-config.wildcardChar` matches your filenames.
- ESM import errors? Ensure `"type": "module"` in your package.json, or use .cjs/interop accordingly.

## Publishing to npm

Follow these steps to publish this package to npm:

- Prerequisites
  - Ensure you own the package name (simple-fake-api) or adjust the name in package.json (e.g., "@your-scope/simple-fake-api").
  - Node >= 18.
  - 2FA on npm (recommended).

- One-time setup
  - Create an npm account: https://www.npmjs.com/signup
  - Login locally: `npm login`
  - If using a scope and you want it public by default: `npm config set access public`

- Versioning
  - Bump version: `npm version patch` (or `minor`/`major`). This updates package.json and creates a git tag.

- Build, test, and dry-run
  - `npm run build`
  - `npm test`
  - Optional: `npm publish --dry-run` to see what would be published. Only files from the `files` list and `dist` will be included.

- Publish
  - Public package (default): `npm publish`
  - Scoped public package: `npm publish --access public`
  - With 2FA, you’ll be prompted for an OTP.

- Useful tips
  - The package exports ESM (`"type": "module"`). Consumers on CommonJS might need dynamic import or transpilation.
  - The CLI binary is available as `simple-fake-api` after install. Run it in a project with a configured `simple-fake-api-config`.
  - To deprecate or unpublish, see npm docs (be cautious with unpublish on popular packages).

## License

MIT
