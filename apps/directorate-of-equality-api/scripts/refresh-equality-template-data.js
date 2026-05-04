#!/usr/bin/env node
/**
 * Regenerates `src/modules/application/equality-template/template-data.ts`
 * from the current contents of
 * `src/modules/application/equality-template/template.docx`.
 *
 * Run after editing the docx template. The generated file is committed so
 * runtime never touches the filesystem for the template bytes.
 *
 * Usage:  node scripts/refresh-equality-template-data.js
 */

const fs = require('fs')
const path = require('path')

const TEMPLATE_DIR = path.join(
  __dirname,
  '..',
  'src',
  'modules',
  'application',
  'equality-template',
)
const DOCX_PATH = path.join(TEMPLATE_DIR, 'template.docx')
const OUT_PATH = path.join(TEMPLATE_DIR, 'template-data.ts')

const bytes = fs.readFileSync(DOCX_PATH)
const base64 = bytes.toString('base64')
const wrapped = base64.match(/.{1,76}/g).join('\n')

const content = `/**
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
 */

export const EQUALITY_REPORT_TEMPLATE_BASE64 =
${JSON.stringify(wrapped, null, 0)}
`

fs.writeFileSync(OUT_PATH, content)
// eslint-disable-next-line no-console
console.log(
  `Wrote ${path.relative(process.cwd(), OUT_PATH)} (${bytes.length} bytes → ${base64.length} base64 chars)`,
)
