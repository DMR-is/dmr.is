/**
 * Top-level parser entrypoint — takes an uploaded xlsx buffer and returns
 * a fully-populated `ParsedReportDto` (or throws a `BadRequestException`
 * carrying a structured error list if anything in the workbook is invalid).
 *
 * ## Orchestration order
 *
 * 1. Load the workbook via exceljs.
 * 2. Parse criteria + sub-criteria (tree shape, step scores computed).
 * 3. Parse employees (Launagögn) — derives the role list as a side effect.
 * 4. Parse role classifications (Starfsmat) — attaches step assignments
 *    to the roles produced in (3).
 * 5. Parse employee classifications (Einstaklingsmat) — attaches
 *    personal-sub assignments to the employees produced in (3).
 * 6. Run the semantic validator on the assembled tree.
 * 7. Throw on any accumulated errors, else return the `ParsedReportDto`.
 *
 * Report-level metadata (admin / contact details) and company identification
 * are NOT parsed here — they live in the app-system's auth context and are
 * owned by the submit flow, not by the Excel importer.
 */

import ExcelJS from 'exceljs'
import JSZip from 'jszip'

import { BadRequestException } from '@nestjs/common'

import { ImportErrorDto } from '../dto/import-error.dto'
import { ParsedReportDto } from '../dto/parsed-report.dto'
import { validateSemantics } from '../validators/semantic.validator'
import {
  parseEmployeeClassifications,
  parseRoleClassifications,
} from './classifications.parser'
import { parseCriteriaTree } from './criteria.parser'
import { parseEmployees } from './employees.parser'
import { ErrorBag } from './errors'
import { assertWorkbookLayout } from './layout.assert'

const SHARED_STRINGS_PATH = 'xl/sharedStrings.xml'
const WORKSHEET_XML_RE = /^xl\/worksheets\/sheet\d+\.xml$/
const SHARED_STRING_CELL_RE =
  /<c\b[^>]*\bt="s"[^>]*>[\s\S]*?<v>(\d+)<\/v>[\s\S]*?<\/c>/g

const emptySharedStringsXml = (count: number): string => {
  const items = Array.from({ length: count }, () => '<si><t></t></si>').join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${count}" uniqueCount="${count}">${items}</sst>`
}

/**
 * Inline-string xlsx files are valid and do not need `xl/sharedStrings.xml`.
 * A few producers, however, can leave shared-string cell references (`t="s"`)
 * while omitting the table. ExcelJS then dereferences `undefined` during load.
 * The original strings are unrecoverable at that point, so inject blank shared
 * string entries and let normal validation report the missing data.
 */
const guardMissingSharedStrings = async (buffer: Buffer): Promise<Buffer> => {
  const zip = await JSZip.loadAsync(buffer)
  if (zip.file(SHARED_STRINGS_PATH)) return buffer

  let maxSharedStringIndex = -1
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !WORKSHEET_XML_RE.test(entry.name)) continue
    const xml = await entry.async('string')
    for (const match of xml.matchAll(SHARED_STRING_CELL_RE)) {
      maxSharedStringIndex = Math.max(maxSharedStringIndex, Number(match[1]))
    }
  }

  if (maxSharedStringIndex < 0) return buffer

  zip.file(SHARED_STRINGS_PATH, emptySharedStringsXml(maxSharedStringIndex + 1))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

/**
 * Render a structured import error into a single human-readable line with its
 * sheet/row/column location baked in. These strings are thrown as the
 * `message` array so the shared HttpExceptionFilter forwards them as
 * `details`, which the web client surfaces to the user (the structured
 * `errors` array only survives in server logs).
 *
 * ## Why the sheet name is labelled
 *
 * A bare `Starfsmat: …` prefix is ambiguous to the reader: several sheet names
 * are also domain terms that appear inside the messages themselves (Starfsmat,
 * Viðmið, Undirviðmið), so an unlabelled leading word reads as part of the
 * sentence rather than as a location. A page of them is hard to scan for
 * *which sheet do I open*. `Blað:` names the thing explicitly, and separating
 * the location from the message with an en dash keeps one colon per line.
 *
 * "Blað" (not "skjal") because that is the word the messages themselves
 * already use for a sheet — `Nauðsynlegt blað „Starfsmat“ vantar`,
 * `fannst ekki á blaðinu Viðmið` — while the file as a whole is the
 * "vinnubók".
 */
const formatImportError = (e: ImportErrorDto): string => {
  const location = [
    e.row != null ? `röð ${e.row}` : null,
    e.column != null ? `dálkur ${e.column}` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const where = location ? `${e.sheet} (${location})` : e.sheet
  return `Blað: ${where} – ${e.message}`
}

export const parseWorkbook = async (
  fileBuffer: Buffer,
): Promise<ParsedReportDto> => {
  const workbook = new ExcelJS.Workbook()
  try {
    const guardedBuffer = await guardMissingSharedStrings(fileBuffer)
    // exceljs declares its own `Buffer extends ArrayBuffer` shape that
    // conflicts with Node 20's `Buffer extends Uint8Array<ArrayBufferLike>`.
    // Hand it the underlying ArrayBuffer slice to satisfy both contracts.
    const arrayBuffer = guardedBuffer.buffer.slice(
      guardedBuffer.byteOffset,
      guardedBuffer.byteOffset + guardedBuffer.byteLength,
    ) as ArrayBuffer
    await workbook.xlsx.load(arrayBuffer)
  } catch (e) {
    throw new BadRequestException({
      message: 'Ekki tókst að lesa vinnubókina — er þetta gild xlsx skrá?',
      errors: [
        {
          sheet: '(workbook)',
          row: null,
          column: null,
          message:
            e instanceof Error ? e.message : 'Óþekkt villa við lestur xlsx',
        },
      ],
    })
  }

  const errors = new ErrorBag()

  // ⚠️ Layout FIRST, and bail on mismatch. Every parser below reads by
  // hard-coded column letter, so against an older template they would each
  // report their own per-row failures — describing the submitter's data rather
  // than the stale sheet that caused it. One accurate error beats a page of
  // misleading ones.
  if (!assertWorkbookLayout(workbook, errors)) {
    const list = [...errors.list]
    throw new BadRequestException({
      message: list.map(formatImportError),
      errors: list,
    })
  }

  // `sheetOrder` carries the sub-criteria in Undirviðmið ROW order — the order
  // the classification matrices lay their columns out in, which the criterion
  // tree does not preserve. See `SubCriteriaSheetOrder`.
  const { criteria, sheetOrder } = parseCriteriaTree(workbook, errors)
  const { employees, roles } = parseEmployees(workbook, errors)
  parseRoleClassifications(workbook, sheetOrder, roles, errors)
  parseEmployeeClassifications(workbook, sheetOrder, employees, errors)

  const report: ParsedReportDto = { criteria, roles, employees }

  // Semantic pass runs AFTER parse so it can rely on the tree being
  // structurally sound (no rogue types, no out-of-range step orders). It
  // shares the same error bag, so the client sees parse + semantic problems
  // in a single response.
  validateSemantics(report, errors)

  if (errors.hasErrors) {
    const list = [...errors.list]
    throw new BadRequestException({
      // Array `message` → the shared HttpExceptionFilter forwards it verbatim
      // as `details`, so the web client can list every problem for the user.
      message: list.map(formatImportError),
      // Structured form retained for server-side logging / debugging.
      errors: list,
    })
  }

  return report
}
