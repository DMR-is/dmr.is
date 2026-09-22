import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './apps/directorate-of-equality-partner-web/clientConfig.json',
  output: {
    path: './apps/directorate-of-equality-partner-web/src/gen/fetch',
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
