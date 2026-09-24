// Refreshes clientConfig.json from the OneExternalAPI swagger endpoint that
// OneSystems hosts for Jafnréttisstofa's One instance.
//
// Swashbuckle serves the document at a static path next to the swagger UI.
// Whether that path answers without authentication is unconfirmed; if it
// returns 401, download the spec from the swagger UI by hand instead.
//
// After refreshing, re-check the patches in openapi-ts.config.ts (the empty
// `TokenRequest` schema and the Login security override) still match.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SPEC_URL =
  'https://jafnrettisstofa-one.onecrm.is/OneExternalAPI/swagger/v1/swagger.json'

const OUTPUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'clientConfig.json',
)

async function main() {
  const response = await fetch(SPEC_URL)
  if (!response.ok) {
    throw new Error(
      `Spec download failed: ${response.status} ${response.statusText}`,
    )
  }
  const text = await response.text()

  // Fail loudly on an HTML error page or a truncated body rather than
  // committing something codegen cannot read.
  let spec
  try {
    spec = JSON.parse(text)
  } catch {
    throw new Error('Spec response was not valid JSON')
  }
  if (!spec.openapi || !spec.paths) {
    throw new Error('Spec response is not an OpenAPI document')
  }

  const json = `${JSON.stringify(spec, null, 2)}\n`
  writeFileSync(OUTPUT_PATH, json)
  console.log(`Updated clientConfig.json (${json.length} bytes)`)
}

main().catch((error) => {
  console.error(`Failed to update OpenAPI spec: ${error.message}`)
  process.exit(1)
})
