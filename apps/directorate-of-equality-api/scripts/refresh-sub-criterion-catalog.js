#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Regenerates `src/modules/application/sub-criterion-catalog/
 * sub-criterion-catalog.data.ts` from the `Undirviðmiðalisti (Lýsigögn)` sheet
 * of `src/modules/report-excel/template.xlsx`.
 *
 * The catalog is Jafnréttisstofa's list of standard undirviðmið that the
 * workbook's Undirviðmið sheet offers in a dropdown. The application portal
 * needs the same list, so we lift it out of the xlsx once and ship it as a
 * plain TS constant rather than re-parsing per request.
 *
 * Run after Jafnréttisstofa ships an updated workbook, then review the diff —
 * the generated file is committed, not built. Output is prettier-formatted here,
 * so a regeneration with no content change produces a byte-identical file.
 *
 * Usage:  node scripts/refresh-sub-criterion-catalog.js [path/to/template.xlsx]
 */

const fs = require('fs')
const path = require('path')

const ExcelJS = require('exceljs')

const SHEET = 'Undirviðmiðalisti (Lýsigögn)'

/**
 * Sheet geometry, duplicating `report-excel/workbook.schema.ts` —
 * `TABLE_HEADER_ROW` (5), `TABLE_FIRST_DATA_ROW` (6) and `MAX_STEPS` (8) — which
 * a plain CJS script cannot import.
 *
 * Only `MAX_STEPS` is cross-checked from `sub-criterion-catalog.data.spec.ts`,
 * and weakly (the generated data must not exceed it). The two row numbers are
 * *not* pinned anywhere and cannot be: the generated file encodes no row numbers,
 * so nothing downstream can observe them. `assertLayout` is what protects them
 * instead — it verifies the header row and the generic-scale marker before a
 * single data row is read, so a row insert or a column shift throws here rather
 * than silently reading the wrong field. That matters because this sheet has no
 * named range to anchor on, unlike the parser's other reads.
 */
const HEADER_ROW = 5
const FIRST_DATA_ROW = 6
const MAX_STEPS = 8
/** Row 4 carries the generic step-scale wording under the Þrep columns. */
const SCALE_ROW = 4
/** Defensive scan bound; the sheet ships with ~53 rows. */
const LAST_DATA_ROW = 500

const COLS = {
  parent: 2,
  title: 3,
  description: 4,
  numSteps: 5,
  firstStep: 6,
}
COLS.lastStep = COLS.firstStep + MAX_STEPS - 1

/** Exact row-5 header text, by column. */
const EXPECTED_HEADERS = {
  [COLS.parent]: 'Yfirviðmið',
  [COLS.title]: 'Undirviðmið',
  [COLS.description]: 'Skilgreining',
  [COLS.numSteps]: 'Fjöldi þrepa',
}
for (let step = 1; step <= MAX_STEPS; step++) {
  EXPECTED_HEADERS[COLS.firstStep + step - 1] = `Þrep ${step}`
}

/** Marker in the `Fjöldi þrepa` column of `SCALE_ROW`, left of the wording. */
const SCALE_MARKER = 'Almennur þrepakvarði →'

/**
 * Icelandic Yfirviðmið label → `ReportCriterionTypeEnum` member name.
 *
 * The job-based half mirrors `JOB_BASED_TITLE_TO_TYPE` in
 * `report-excel/workbook.schema.ts`, whose contract is that an unrecognised
 * job-based title makes the parser *reject the row* — Jafnréttisstofa defines
 * these titles and the employer cannot invent new ones. The personal labels are
 * listed explicitly for the same reason: a `?? 'PERSONAL'` fallback would emit a
 * renamed or newly-added job-based section as PERSONAL, and the portal groups by
 * `parentTitle`, so it would be quietly mis-grouped with no test to catch it.
 */
const TYPE_BY_PARENT = {
  // Job-based (Starfsbundið). These four are the mandatory criteria and are
  // deliberately untouched by the 2026-08 template revision.
  Hæfni: 'COMPETENCE',
  Ábyrgð: 'RESPONSIBILITY',
  Álag: 'STRAIN',
  Vinnuaðstæður: 'CONDITION',
  // Personal (Einstaklingsbundið) — several distinct labels, one enum type.
  //
  // A label may appear in more than one run of rows: the sheet groups by label,
  // not by contiguous block, so `Þekking og reynsla` occupies rows 39-41 and
  // again 47-48, and `Aukaábyrgð` rows 38 and 52. Nothing here depends on
  // contiguity, but do not infer a row range from a label.
  Aukaábyrgð: 'PERSONAL',
  'Þekking og reynsla': 'PERSONAL',
  Færni: 'PERSONAL',
  Frammistaða: 'PERSONAL',
  // Retired by the 2026-08 revision, which replaced them with the four above.
  // Kept because this script accepts an arbitrary workbook path (see Usage), so
  // dropping them would make it throw on any pre-revision template rather than
  // regenerate it.
  Frammistöðumat: 'PERSONAL',
  'Einstaklingsbundinn þáttur': 'PERSONAL',
}

const APP_ROOT = path.join(__dirname, '..')

const OUT_FILE = path.join(
  APP_ROOT,
  'src',
  'modules',
  'application',
  'sub-criterion-catalog',
  'sub-criterion-catalog.data.ts',
)

/** The workbook shipped by `GET /application/reports/excel/template`. */
const DEFAULT_SOURCE = path.join(
  APP_ROOT,
  'src',
  'modules',
  'report-excel',
  'template.xlsx',
)

/**
 * Human-readable cell reference for error messages (`C7`).
 *
 * Taken from ExcelJS rather than derived from the column number, which would
 * need two-letter handling past column Z — and the whole point of these messages
 * is naming the offending cell correctly.
 */
const address = (sheet, row, col) => sheet.getCell(row, col).address

/**
 * Characters that must never reach the generated file or the API response.
 *
 * C0 controls, the Unicode line/paragraph separators U+2028/U+2029 and the
 * zero-width/BOM family are all invisible in Excel and survive `JSON.stringify`
 * verbatim, so they would ship into Jafnréttisstofa's wording unnoticed. In a
 * hand-maintained sheet they are a paste accident, never intent — so this rejects
 * rather than silently stripping, which would make the generated file disagree
 * with the workbook it claims to mirror.
 *
 * Tab, LF and CR are excluded: an in-cell break (Alt+Enter) is legitimate and
 * arrives as LF, or as CRLF when the text was pasted from a Windows editor.
 * Rejecting CR would fail generation on a real line break with a message about
 * corruption.
 */
/* The control characters are the entire point of this pattern. */
/* eslint-disable no-control-regex */
const INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\u2028\u2029\uFEFF]/
/* eslint-enable no-control-regex */

const assertNoInvisibles = (text, ref) => {
  const match = INVISIBLE.exec(text)
  if (match) {
    const code = match[0].codePointAt(0).toString(16).padStart(4, '0')
    throw new Error(
      `${ref} contains the invisible character U+${code.toUpperCase()} at offset ${match.index} — retype the cell rather than pasting it`,
    )
  }
}

/**
 * ExcelJS cell value → trimmed string, flattening rich text and formulas.
 *
 * Mirrors the tested reader in `report-excel/parser/cell.ts`, including its
 * treatment of a formula cell with no cached result: the template deliberately
 * uses formula-or-literal cells, and a formula whose value Excel never wrote
 * would otherwise read as empty — truncating a step list or reporting a filled
 * Skilgreining as missing. There are none on this sheet today; the throw is so
 * that stays true.
 */
const readString = (value, ref) => {
  if (value == null) return null
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return readString(value.richText.map((part) => part.text).join(''), ref)
    }
    if (value.formula != null || value.sharedFormula != null) {
      if (value.result == null) {
        throw new Error(
          `${ref} is a formula with no cached result — open the workbook in Excel and save it so the value is written`,
        )
      }
      return readString(value.result, ref)
    }
    if (value.text != null) return readString(value.text, ref)
    if (value.result != null) return readString(value.result, ref)
    return null
  }

  const text = String(value).trim()
  if (text.length === 0) return null

  assertNoInvisibles(text, ref)
  return text
}

const cell = (sheet, row, col) =>
  readString(sheet.getCell(row, col).value, address(sheet, row, col))

/**
 * Fails before any data is read if the sheet is not laid out as expected.
 *
 * This sheet carries no named range, so unlike the parser's other reads there is
 * nothing stable to anchor to — the column numbers below are the contract, and
 * these assertions are what make a hand-edit that breaks it loud.
 */
const assertLayout = (sheet) => {
  const wrong = Object.entries(EXPECTED_HEADERS)
    .map(([col, expected]) => ({
      col: Number(col),
      expected,
      actual: cell(sheet, HEADER_ROW, Number(col)),
    }))
    .filter(({ expected, actual }) => actual !== expected)

  if (wrong.length > 0) {
    const detail = wrong
      .map(
        ({ col, expected, actual }) =>
          `${address(sheet, HEADER_ROW, col)} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
      )
      .join('; ')
    throw new Error(
      `Unexpected "${SHEET}" layout — a column was inserted, removed or renamed: ${detail}`,
    )
  }

  const marker = cell(sheet, SCALE_ROW, COLS.numSteps)
  if (marker !== SCALE_MARKER) {
    throw new Error(
      `Expected ${JSON.stringify(SCALE_MARKER)} at ${address(sheet, SCALE_ROW, COLS.numSteps)}, found ${JSON.stringify(marker)} — the generic step scale is not where it was`,
    )
  }
}

/**
 * Reads the Þrep columns of one row, left to right, up to the last filled one.
 *
 * Every column is scanned rather than stopping at the first blank, so a gap
 * (blank Þrep 2 with Þrep 3 filled) is rejected instead of silently shipping a
 * truncated scale. `Fjöldi þrepa` would catch that on most rows, but it is blank
 * on the employer-authored personal entries — and on the generic scale row there
 * is no step count at all — which is exactly where the guard is needed. `label`
 * names the thing being read for the error message.
 */
const readContiguous = (sheet, row, label) => {
  const columns = []
  for (let col = COLS.firstStep; col <= COLS.lastStep; col++) {
    columns.push(cell(sheet, row, col))
  }

  const lastFilled = columns.reduce(
    (last, value, index) => (value ? index : last),
    -1,
  )
  const gap = columns.findIndex((value, index) => !value && index < lastFilled)
  if (gap !== -1) {
    throw new Error(
      `${label} leaves ${address(sheet, row, COLS.firstStep + gap)} blank but fills a later Þrep column — steps must be contiguous from step 1`,
    )
  }

  return columns.slice(0, lastFilled + 1)
}

const readSteps = (sheet, row, title) => {
  const steps = readContiguous(sheet, row, `Row ${row} ("${title}")`)

  if (steps.length === 0) {
    throw new Error(`Row ${row} ("${title}") has no step descriptions`)
  }
  return steps
}

/**
 * `Fjöldi þrepa` → integer, or null when the cell is blank.
 *
 * Blank is meaningful: the free-text personal entries ship with step 1 only and
 * the employer authors the rest. A cell that holds something unparseable (`"5
 * þrep"`) is not blank and must not be read as one — that would reclassify a
 * fixed-scale entry as employer-authored.
 */
const readNumSteps = (sheet, row, title) => {
  const text = cell(sheet, row, COLS.numSteps)
  if (text == null) return null

  const parsed = Number(text)
  if (!Number.isInteger(parsed)) {
    throw new Error(
      `Row ${row} ("${title}") has a non-integer Fjöldi þrepa (${JSON.stringify(text)})`,
    )
  }
  return parsed
}

const extract = (sheet) => {
  const entries = []

  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row++) {
    const parentTitle = cell(sheet, row, COLS.parent)
    const title = cell(sheet, row, COLS.title)
    // A wholly blank row ends a section and is skipped; a half-filled one is a
    // defect. Silently dropping it would shrink the served catalog by a row
    // Jafnréttisstofa believes it shipped.
    if (!parentTitle && !title) continue
    if (!parentTitle || !title) {
      throw new Error(
        `Row ${row} fills only one of Yfirviðmið / Undirviðmið (${JSON.stringify(parentTitle)} / ${JSON.stringify(title)}) — both are required`,
      )
    }

    const criterionType = TYPE_BY_PARENT[parentTitle]
    if (!criterionType) {
      throw new Error(
        `Row ${row} ("${title}") has unrecognised Yfirviðmið "${parentTitle}" — add it to TYPE_BY_PARENT with the criterion type it belongs to`,
      )
    }

    const description = cell(sheet, row, COLS.description)
    if (!description) {
      throw new Error(`Row ${row} ("${title}") has no Skilgreining`)
    }

    const steps = readSteps(sheet, row, title)

    // Where Fjöldi þrepa is filled it must agree with the Þrep columns.
    const numSteps = readNumSteps(sheet, row, title)
    if (numSteps != null && numSteps !== steps.length) {
      throw new Error(
        `Row ${row} ("${title}") declares ${numSteps} steps but has ${steps.length} descriptions`,
      )
    }

    entries.push({
      criterionType,
      parentTitle,
      title,
      description,
      numSteps,
      steps,
    })
  }

  if (entries.length === 0) {
    throw new Error(
      `Read 0 entries from "${SHEET}" — the sheet is empty or its data does not start at row ${FIRST_DATA_ROW}`,
    )
  }

  return entries
}

const extractGeneralScale = (sheet) => {
  // Read through a gap rather than stopping at it, exactly like `readSteps`: a
  // blank Þrep 2 with Þrep 3 filled would otherwise ship a one-item scale, and
  // this is the only suggested wording the employer-authored entries get.
  const scale = readContiguous(
    sheet,
    SCALE_ROW,
    `the generic step scale on row ${SCALE_ROW}`,
  )

  if (scale.length === 0) {
    throw new Error(
      `Read no generic step scale from row ${SCALE_ROW} of "${SHEET}" — entries with a null numSteps would ship with no suggested wording`,
    )
  }

  return scale
}

/**
 * Emits a TS string literal. `JSON.stringify` rather than hand-rolled escaping so
 * an embedded newline (Alt+Enter in a cell), a backslash or a quote cannot
 * produce a broken literal — the hand-rolled version escaped only backslash and
 * apostrophe and emitted a raw newline, which made prettier fail on generated
 * source rather than naming the offending cell.
 *
 * It does *not* protect against U+2028/U+2029, which it emits verbatim; those are
 * rejected upstream by `assertNoInvisibles`. Prettier rewrites the double quotes
 * to the project's single-quote style, so output stays byte-stable.
 */
const quote = (text) => JSON.stringify(text)

const render = (entries, generalScale, sourceFile) => {
  const rendered = entries
    .map(
      (entry) => `  {
    criterionType: ReportCriterionTypeEnum.${entry.criterionType},
    parentTitle: ${quote(entry.parentTitle)},
    title: ${quote(entry.title)},
    description: ${quote(entry.description)},
    numSteps: ${entry.numSteps ?? 'null'},
    steps: [
${entry.steps.map((step) => `      ${quote(step)},`).join('\n')}
    ],
  },`,
    )
    .join('\n')

  return `/**
 * Jafnréttisstofa's catalog of standard sub-criteria (undirviðmið).
 *
 * GENERATED FILE — do not edit by hand. Regenerate after updating the
 * workbook:
 *
 *   node scripts/refresh-sub-criterion-catalog.js
 *
 * Source: the \`${SHEET}\` sheet of \`${sourceFile}\`, which
 * is what feeds the Undirviðmið sheet's dropdown inside the workbook. The
 * application portal offers the same list, so the catalog is lifted out of
 * the xlsx and shipped as data rather than re-parsed at request time.
 *
 * Entries are reference material, not a closed set: an employer may pick one
 * and overwrite its wording, or register a sub-criterion as free text. The
 * personal entries with \`numSteps: null\` deliberately ship with step 1 only
 * — the employer authors the remaining steps.
 */

import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'

export type SubCriterionCatalogEntry = {
  /** Which top-level criterion this sub-criterion belongs under. */
  criterionType: ReportCriterionTypeEnum
  /** Icelandic Yfirviðmið label as it appears in the workbook. */
  parentTitle: string
  title: string
  description: string
  /** Fjöldi þrepa, or \`null\` when the employer decides it. */
  numSteps: number | null
  /** Step descriptions, ordered from step 1. */
  steps: string[]
}

/**
 * Generic step wording (\`Almennur þrepakvarði\`) the workbook suggests for
 * sub-criteria that carry no step descriptions of their own. Indexed from
 * step 1; each entry is a comma-separated list of interchangeable phrasings.
 */
export const SUB_CRITERION_GENERAL_SCALE: readonly string[] = [
${generalScale.map((step) => `  ${quote(step)},`).join('\n')}
]

export const SUB_CRITERION_CATALOG: readonly SubCriterionCatalogEntry[] = [
${rendered}
]
`
}

const main = async () => {
  // Required lazily: prettier 3 loads its parsers through dynamic import, which
  // throws under jest without --experimental-vm-modules, and the spec exercising
  // the validation layer above has no use for the formatter. Resolved from the
  // workspace root deliberately — the point is to format with the repo's own
  // prettier and `.prettierrc`, so the generated file matches what everything
  // else in the monorepo is formatted with, not a version pinned here.
  const prettier = require('prettier')

  const source = process.argv[2] ?? DEFAULT_SOURCE

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(source)

  const sheet = workbook.getWorksheet(SHEET)
  if (!sheet) {
    throw new Error(`Workbook has no "${SHEET}" sheet`)
  }

  assertLayout(sheet)

  const entries = extract(sheet)
  const generalScale = extractGeneralScale(sheet)

  // Formatted here so a regenerated file is byte-identical to the committed
  // one and the diff shows only real content changes.
  const generated = render(entries, generalScale, path.basename(source))
  const formatted = await prettier.format(generated, {
    ...(await prettier.resolveConfig(OUT_FILE)),
    filepath: OUT_FILE,
  })

  fs.writeFileSync(OUT_FILE, formatted)
  console.log(
    `Wrote ${entries.length} catalog entries to ${path.relative(
      process.cwd(),
      OUT_FILE,
    )}`,
  )
}

// Only run when invoked as a script — requiring this file from the spec must not
// rewrite the committed catalog.
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}

// Exported for `refresh-sub-criterion-catalog.spec.ts`, which builds workbooks in
// memory to exercise every rejection path above. `require.main` keeps the CLI
// behaviour unchanged when the file is run directly.
module.exports = {
  SHEET,
  HEADER_ROW,
  FIRST_DATA_ROW,
  SCALE_ROW,
  MAX_STEPS,
  COLS,
  EXPECTED_HEADERS,
  SCALE_MARKER,
  TYPE_BY_PARENT,
  assertLayout,
  extract,
  extractGeneralScale,
  readSteps,
  render,
}
