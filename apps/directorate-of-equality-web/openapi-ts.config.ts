import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './apps/directorate-of-equality-web/clientConfig.json',
  output: {
    path: './apps/directorate-of-equality-web/src/gen/fetch',
    clean: true,
  },
  plugins: [
    '@hey-api/client-fetch',
    {
      name: '@hey-api/typescript',
      enums: 'typescript',
    },
    '@hey-api/sdk',
  ],
})
