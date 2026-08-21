const fs = require('fs')
const path = require('path')

/**
 * Regenerates `template-data.ts` from `template.docx`.
 *
 * The equality-report Word template is served from an inlined base64 string
 * rather than read off disk — see the header comment in template-data.ts for
 * why. This script is the other half of that trade-off: run it after editing
 * the docx so the inlined bytes and the file stay in step.
 *
 *   node scripts/refresh-equality-template-data.js
 */

const TEMPLATE_DIR = path.join(
  __dirname,
  '..',
  'apps',
  'directorate-of-equality-api',
  'src',
  'modules',
  'application',
  'equality-template',
)

const DOCX_PATH = path.join(TEMPLATE_DIR, 'template.docx')
const DATA_PATH = path.join(TEMPLATE_DIR, 'template-data.ts')

const HEADER = `/**
 * Base64-encoded payload of the equality-report Word template.
 *
 * The source docx lives next to this file as \`template.docx\`. To refresh
 * the inlined bytes after editing that file run:
 *
 *   node scripts/refresh-equality-template-data.js
 *
 * Why inline instead of read-from-disk? Template generation happens inside a
 * NestJS route handler that runs both under ts-node (dev) and inside the
 * Nx/webpack-bundled prod artifact. The two environments disagree on what
 * \`__dirname\` resolves to and the monorepo has no existing asset-copy
 * convention. Inlining sidesteps both problems: the buffer is always exactly
 * one \`Buffer.from\` call away, in any environment, including Jest.
 *
 * Generated file — do not edit the string by hand.
 */
`

function main() {
  if (!fs.existsSync(DOCX_PATH)) {
    console.error(`No template.docx found at ${DOCX_PATH}`)
    process.exit(1)
  }

  const base64 = fs.readFileSync(DOCX_PATH).toString('base64')
  // 76-char lines keep the generated file diffable and inside Prettier's reach.
  const lines = base64.match(/.{1,76}/g) ?? []
  const literal = lines.map((line) => `${line}\\n`).join('')

  fs.writeFileSync(
    DATA_PATH,
    `${HEADER}\nexport const EQUALITY_REPORT_TEMPLATE_BASE64 =\n  '${literal}'\n`,
    'utf-8',
  )

  console.log(
    `Wrote ${lines.length} lines (${
      base64.length
    } base64 chars) to ${path.relative(process.cwd(), DATA_PATH)}`,
  )
}

main()
