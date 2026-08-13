/* eslint-disable no-console */
/**
 * Regenerates the DoE sub-criterion catalog from the salary-report workbook.
 *
 * The catalog is the `Undirviðmiðalisti (Lýsigögn)` sheet: Jafnréttisstofa's
 * list of standard undirviðmið that the workbook's Undirviðmið sheet offers in
 * a dropdown. The application portal needs the same list, so we lift it out of
 * the xlsx once and ship it as a plain TS constant.
 *
 * Usage (defaults to the workbook committed under report-excel/):
 *
 *   node scripts/refresh-doe-sub-criterion-catalog.js [path/to/template.xlsx]
 *
 * Re-run this whenever Jafnréttisstofa ships an updated workbook, then review
 * the diff — the generated file is committed, not built.
 */

const fs = require('fs')
const path = require('path')

const ExcelJS = require('exceljs')
const prettier = require('prettier')

const SHEET = 'Undirviðmiðalisti (Lýsigögn)'
/** Row 5 is headers, 6+ is data (same layout as the other table sheets). */
const FIRST_DATA_ROW = 6
/** Defensive scan bound; the sheet ships with ~53 rows. */
const LAST_DATA_ROW = 500
/** Row 4 carries the generic step-scale wording under the Þrep columns. */
const SCALE_ROW = 4

const COLS = {
  parent: 2,
  title: 3,
  description: 4,
  numSteps: 5,
  firstStep: 6,
  lastStep: 13,
}

/** Icelandic parent title → ReportCriterionTypeEnum member name. */
const JOB_BASED_TYPE_BY_PARENT = {
  Hæfni: 'COMPETENCE',
  Ábyrgð: 'RESPONSIBILITY',
  Álag: 'STRAIN',
  Vinnuaðstæður: 'CONDITION',
}

const OUT_FILE = path.join(
  __dirname,
  '..',
  'apps/directorate-of-equality-api/src/modules/application/sub-criterion-catalog/sub-criterion-catalog.data.ts',
)

/** The workbook shipped by `GET /application/reports/excel/template`. */
const DEFAULT_SOURCE = path.join(
  __dirname,
  '..',
  'apps/directorate-of-equality-api/src/modules/report-excel/template.xlsx',
)

/** ExcelJS cell value → trimmed string, flattening rich text and formulas. */
const readString = (value) => {
  if (value == null) return null
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) {
      return readString(value.richText.map((part) => part.text).join(''))
    }
    if (value.text != null) return readString(value.text)
    if (value.result != null) return readString(value.result)
    return null
  }
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

const readInteger = (value) => {
  const text = readString(value)
  if (text == null) return null
  const parsed = Number(text)
  return Number.isInteger(parsed) ? parsed : null
}

const quote = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

const extract = (sheet) => {
  const entries = []

  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row++) {
    const parentTitle = readString(sheet.getCell(row, COLS.parent).value)
    const title = readString(sheet.getCell(row, COLS.title).value)
    if (!parentTitle || !title) continue

    const description = readString(sheet.getCell(row, COLS.description).value)
    if (!description) {
      throw new Error(`Row ${row} ("${title}") has no Skilgreining`)
    }

    const steps = []
    for (let col = COLS.firstStep; col <= COLS.lastStep; col++) {
      const step = readString(sheet.getCell(row, col).value)
      if (!step) break
      steps.push(step)
    }
    if (steps.length === 0) {
      throw new Error(`Row ${row} ("${title}") has no step descriptions`)
    }

    // Fjöldi þrepa is blank on the free-text personal entries — those ship
    // with step 1 only and the employer authors the rest. Everywhere else it
    // must agree with the number of Þrep columns actually filled in.
    const numSteps = readInteger(sheet.getCell(row, COLS.numSteps).value)
    if (numSteps != null && numSteps !== steps.length) {
      throw new Error(
        `Row ${row} ("${title}") declares ${numSteps} steps but has ${steps.length} descriptions`,
      )
    }

    entries.push({
      criterionType: JOB_BASED_TYPE_BY_PARENT[parentTitle] ?? 'PERSONAL',
      parentTitle,
      title,
      description,
      numSteps,
      steps,
    })
  }

  return entries
}

const extractGeneralScale = (sheet) => {
  const scale = []
  for (let col = COLS.firstStep; col <= COLS.lastStep; col++) {
    const value = readString(sheet.getCell(SCALE_ROW, col).value)
    if (!value) break
    scale.push(value)
  }
  return scale
}

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
 *   node scripts/refresh-doe-sub-criterion-catalog.js
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
  const source = process.argv[2] ?? DEFAULT_SOURCE

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(source)

  const sheet = workbook.getWorksheet(SHEET)
  if (!sheet) {
    throw new Error(`Workbook has no "${SHEET}" sheet`)
  }

  const entries = extract(sheet)
  const generalScale = extractGeneralScale(sheet)

  // Formatted here so a regenerated file is byte-identical to the committed
  // one and the diff shows only real content changes.
  const source_ts = render(entries, generalScale, path.basename(source))
  const formatted = await prettier.format(source_ts, {
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

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
