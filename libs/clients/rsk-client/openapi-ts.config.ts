import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './libs/clients/rsk-client/clientConfig.yaml',
  // Transform the pristine portal export at codegen time instead of hand-editing it.
  parser: {
    patch: {
      schemas: {
        // The spec models the PDF response as an empty schema (`BinaryData: {}`),
        // which generates as `unknown`. Type it as binary so it becomes `Blob | File`.
        BinaryData: (schema) => {
          Object.assign(schema as Record<string, unknown>, {
            type: 'string',
            format: 'binary',
          })
        },
      },
      // The exported example value leaked into the path param as an `enum`,
      // restricting lookups to a single kennitala. Drop it so it's a plain string.
      operations: (_method, _path, operation) => {
        const param = operation.parameters?.find(
          (p) => 'name' in p && p.name === 'nationalId' && p.in === 'path',
        )
        if (param && 'schema' in param && param.schema) {
          const schema = param.schema as { enum?: unknown; default?: unknown }
          delete schema.enum
          delete schema.default
        }
      },
    },
  },
  output: {
    path: './libs/clients/rsk-client/src/gen/fetch',
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
