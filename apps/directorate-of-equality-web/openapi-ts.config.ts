import nuqsParsersPlugin from './openapi-ts.nuqs-plugin'

import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './apps/directorate-of-equality-web/clientConfig.json',
  output: {
    path: './apps/directorate-of-equality-web/src/gen/fetch',
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
    nuqsParsersPlugin(),
  ],
})
