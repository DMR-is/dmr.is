import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './libs/clients/onesystems/clientConfig.json',
  // Patch the pristine swagger export at codegen time instead of hand-editing it.
  // If the spec is refreshed, check these still match: a patch that no longer
  // finds its target fails silently.
  parser: {
    patch: {
      schemas: {
        // The spec models the Login response as an empty object
        // (`TokenRequest: { type: object, additionalProperties: false }`), which
        // generates as `{ [key: string]: never }`. The real shape is undocumented,
        // so make it an untyped schema that generates as `unknown`.
        TokenRequest: (schema) => {
          const target = schema as Record<string, unknown>
          delete target.type
          delete target.additionalProperties
          delete target.properties
        },
      },
      // The spec applies a global Bearer requirement to every operation,
      // including Login. Login is how the token is obtained, so it must not
      // ask for one.
      operations: (method, path, operation) => {
        if (method.toLowerCase() === 'post' && path === '/api/auth/Login') {
          ;(operation as { security?: Array<unknown> }).security = []
        }
      },
    },
  },
  output: {
    path: './libs/clients/onesystems/src/gen/fetch',
    clean: true,
  },
  plugins: [
    'zod',
    '@hey-api/client-fetch',
    '@hey-api/sdk',
    {
      name: '@hey-api/typescript',
      enums: 'javascript',
    },
  ],
})
