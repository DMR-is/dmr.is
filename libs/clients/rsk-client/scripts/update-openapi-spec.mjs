// Refreshes clientConfig.yaml from the Skatturinn Azure API Management portal.
//
// The dev portal doesn't expose a static spec URL. Instead you ask the APIM
// management endpoint for an export, which mints a short-lived, SAS-signed blob
// URL. The management response returns that URL with its query values only
// partially encoded, so we re-encode each value before downloading (otherwise a
// `sig` containing `+` or `/` produces "Signature fields not well formed").
//
// No authentication is required — this API's spec is public.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MANAGEMENT_EXPORT_URL =
  'https://apim-lz-prod-neu-02.management.azure-api.net/subscriptions/000/resourceGroups/000/providers/Microsoft.ApiManagement/service/apim-lz-prod-neu-02/apis/company-registry-legalentities-v2-210?export=true&format=openapi-link&api-version=2022-08-01'

const OUTPUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'clientConfig.yaml',
)

/** Re-encode a SAS blob URL so spaces and query values are valid. */
function normalizeSasUrl(link) {
  const [base, query] = link.split('?')
  const path = base.replace(/ /g, '%20')
  if (!query) return path
  const search = query
    .split('&')
    .map((pair) => {
      const eq = pair.indexOf('=')
      const key = pair.slice(0, eq)
      const value = pair.slice(eq + 1)
      return `${key}=${encodeURIComponent(decodeURIComponent(value))}`
    })
    .join('&')
  return `${path}?${search}`
}

async function main() {
  const meta = await fetch(MANAGEMENT_EXPORT_URL)
  if (!meta.ok) {
    throw new Error(`Export request failed: ${meta.status} ${meta.statusText}`)
  }
  const { link } = await meta.json()
  if (!link) throw new Error('Export response did not contain a download link')

  const spec = await fetch(normalizeSasUrl(link))
  if (!spec.ok) {
    throw new Error(`Spec download failed: ${spec.status} ${spec.statusText}`)
  }
  const yaml = await spec.text()

  writeFileSync(OUTPUT_PATH, yaml)
  console.log(`Updated clientConfig.yaml (${yaml.length} bytes)`)
}

main().catch((error) => {
  console.error(`Failed to update OpenAPI spec: ${error.message}`)
  process.exit(1)
})
