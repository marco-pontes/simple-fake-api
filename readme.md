# simple-fake-api

A small, fast file‑based fake API server for Node.js. Define endpoints by creating files in a folder (no codegen, no config files), and get realistic data using @faker-js/faker and json-schema-faker for collections.

- Express-based HTTP server
- File-system routing: map files in `apiDir` to routes automatically
- Dynamic params via `wildcardChar` (e.g., `api/users/_id.ts` -> `/users/:id`)
- HTTP method by exported function name in the file (e.g., `export const get = ...` -> `GET`)
- Collections: generate large arrays of realistic objects from JSON Schema using json-schema-faker
- Zero DB, zero migrations; perfect for front-end development, demos, and tests

## Installation

- Prerequisites: Node.js >= 18 (tested with Node 22.18.0)
- Install:

  ```bash
  npm i @marco-pontes/simple-fake-api
  ```

## Quickstart (TL;DR)

1. Add config to your package.json

```jsonc
"simple-fake-api-config": {
  "port": 5000,
  "apiDir": "api",
  "collectionsDir": "collections",
  "wildcardChar": "_"
}
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

## Configuration (package.json)

Add a simple-fake-api-config section to your package.json:

```jsonc
"simple-fake-api-config": {
  "port": 5000,
  "apiDir": "api",
  "collectionsDir": "collections",
  "wildcardChar": "_"
}
```

Configuration options and defaults:

| Key            | Type   | Description                                                                 | Default       | Allowed values / Notes                                           |
| -------------- | ------ | --------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| port           | number | Server port to listen on.                                                   | 5000          | Any free TCP port.                                               |
| apiDir         | string | Directory (relative to project root) containing your route files.           | "api"         | Must exist in your project. Nested folders map to nested routes. |
| collectionsDir | string | Subdirectory inside apiDir where JSON Schema files for collections live.    | "collections" | Files must be .json. Generated at startup and cached.            |
| wildcardChar   | string | Single character used in filenames to denote dynamic segments (e.g., \_id). | "\_"          | Must be exactly 1 char from: ! @ # $ % ^ & \* \_ - + = ~         |

Notes:

- You can override any of the above in your package.json under `"simple-fake-api-config"`.
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

Example package.json (consumer project)

```jsonc
{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "api": "node ./node_modules/simple-fake-api/dist/index.js",
  },
  "simple-fake-api-config": {
    "port": 5000,
    "apiDir": "api",
    "collectionsDir": "collections",
    "wildcardChar": "*",
  },
  "devDependencies": {
    "typescript": "^5.6.0",
  },
}
```

Notes

- If you’re not using TypeScript, omit the build step and use `.js` files in `api/`.
- Your routes are ESM modules; export named handlers by HTTP verb (`GET`, `POST`, etc.).

## Programmatic usage

### New: Environment-aware HTTP client for front-end apps

- Import the HTTP client creator from the subpath export:
  - import { create } from '@marco-pontes/simple-fake-api/http'

Configuration in your package.json (consumer project):

```jsonc
{
  "simple-fake-api-config": {
    // ... other simple-fake-api server settings ...
    "http": {
      "endpoints": {
      "api-server": {
        "dev": { "baseUrl": "http://localhost:5000" },
        "staging": { "baseUrl": "https://staging.endpoint.com" },
        "prod": { "baseUrl": "https://prod.endpoint.com" }
      }
    }
  }
}
```

Usage (auto-load from package.json):

```ts
import { create } from '@marco-pontes/simple-fake-api/http';

// Load config automatically from your package.json (simple-fake-api-config.http)
const api = create('api-server', { headers: { /* auth, etc. */ } });

// usage
// const res = await api.get('/users');
// const created = await api.post('/users', { name: 'John' });
```

Environment resolution:
- Defaults to dev when NODE_ENV is not set.
- test -> test, staging -> staging, production/prod -> prod. You can also pass resolveEnv in config or in package.json via "simple-fake-api-http.resolveEnv" (function not serializable; prefer NODE_ENV).

You can embed simple-fake-api in another Node process (if you import from ESM):

```ts
import { initialize, start, getCollections } from 'simple-fake-api';

await initialize();

// optional: access collections programmatically
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
