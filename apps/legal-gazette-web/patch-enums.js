/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

// ✅ 1. Define enum mappings here
const enumMappings = {
  StatusIdEnum: {
    SUBMITTED: 'cd3bf301-52a1-493e-8c80-a391c310c840',
    IN_PROGRESS: '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
    READY_FOR_PUBLICATION: 'a2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
    PUBLISHED: 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
    REJECTED: 'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
    WITHDRAWN: 'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  },
}

// ✅ 2. Paths
const inputPath = path.resolve('clientConfig.json')
const outputPath = path.resolve('clientConfig.patched.json')

// ✅ 3. Read OpenAPI spec
const spec = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

// ✅ 4. Patch each enum schema
const schemas = spec.components?.schemas || {}

for (const [schemaName, schema] of Object.entries(schemas)) {
  const mapping = enumMappings[schemaName]
  if (!mapping) continue

  const expectedValues = Object.values(mapping)
  if (
    Array.isArray(schema.enum) &&
    schema.enum.length === expectedValues.length &&
    schema.enum.every((v) => expectedValues.includes(v))
  ) {
    schema['x-enum-varnames'] = Object.keys(mapping)
    if (schema['x-enumNames']) {
      delete schema['x-enumNames']
    }
    console.log(`✅ Patched ${schemaName} with x-enum-varnames`)
  }
}

// ✅ 5. Write patched spec
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf8')
console.log(`🎉 Patched OpenAPI written to: ${outputPath}`)
