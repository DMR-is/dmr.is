#!/usr/bin/env node
/**
 * Regenerates `src/modules/report-excel/template-data.ts` from the current
 * contents of `src/modules/report-excel/template.xlsx`.
 *
 * Run after editing the xlsx template. The generated file is committed so
 * runtime never touches the filesystem for the template bytes.
 *
 * ⚠️ **Output is prettier-formatted with the repo's own config**, which the
 * `generated-files` CI job depends on: it regenerates and fails on any diff, so
 * this script's output has to be byte-identical to what `nx format:write` would
 * leave behind. It was not, and the drift was invisible until something
 * formatted the tree — `JSON.stringify` always emits DOUBLE quotes while
 * `.prettierrc` sets `singleQuote: true`, so the two disagreed on exactly one
 * character and CI called the committed file stale. Formatting here removes the
 * disagreement rather than exempting the file from formatting.
 *
 * Usage:  node scripts/refresh-template-data.js
 */

const fs = require('fs')
const path = require('path')

const XLSX_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'libs',
  'directorate-of-equality',
  'modules',
  'src',
  'report-excel',
  'template.xlsx',
)
/**
 * Output and source both live in `@dmr.is/doe-modules` now: the DoE domain layer
 * moved into a library so the partner API can write reports in its own process.
 * The generator stays here because it is a repo maintenance script, not part of
 * either app's runtime — and the CI check that asserts it produces no diff lives
 * in this app's pipeline.
 */
const OUT_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'libs',
  'directorate-of-equality',
  'modules',
  'src',
  'report-excel',
  'template-data.ts',
)

const bytes = fs.readFileSync(XLSX_PATH)
const base64 = bytes.toString('base64')
const wrapped = base64.match(/.{1,76}/g).join('\n')

const content = `/**
 * Base64-encoded payload of the cleaned salary-report Excel template.
 *
 * The source xlsx lives next to this file as \`template.xlsx\`. To refresh
 * the inlined bytes after editing that file run:
 *
 *   node scripts/refresh-template-data.js
 *
 * Why inline instead of read-from-disk? Template generation happens inside a
 * NestJS route handler that runs both under ts-node (dev) and inside the
 * Nx/webpack-bundled prod artifact. The two environments disagree on what
 * \`__dirname\` resolves to and the monorepo has no existing asset-copy
 * convention. Inlining sidesteps both problems: the buffer is always exactly
 * one \`Buffer.from\` call away, in any environment, including Jest.
 */

export const TEMPLATE_BASE64 =
${JSON.stringify(wrapped, null, 0)}
`

const main = async () => {
  // Required lazily and resolved from the workspace root, matching
  // `refresh-sub-criterion-catalog.js`: the point is to format with the repo's
  // own prettier and `.prettierrc`, not a version pinned here.
  const prettier = require('prettier')

  const formatted = await prettier.format(content, {
    ...(await prettier.resolveConfig(OUT_PATH)),
    filepath: OUT_PATH,
  })

  fs.writeFileSync(OUT_PATH, formatted)
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${path.relative(process.cwd(), OUT_PATH)} (${bytes.length} bytes → ${base64.length} base64 chars)`,
  )
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
