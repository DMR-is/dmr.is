/**
 * Top-level parser entrypoint — takes an uploaded xlsx buffer and returns
 * a fully-populated `ParsedReportDto` (or throws a `BadRequestException`
 * carrying a structured error list if anything in the workbook is invalid).
 *
 * ## Two halves
 *
 * `parseWorkbook` owns the byte-level concerns (archive budget, shared-strings
 * repair, "is this even an xlsx") and then hands a loaded workbook to
 * `parseLoadedWorkbook`, which owns everything value-level. Step 1 below is the
 * boundary.
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

import {
  ArchiveTooLargeError,
  assertArchiveWithinBudget,
  MAX_INFLATED_ARCHIVE_BYTES,
} from '../../import-upload'
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

/**
 * A shared-string cell together with its value —
 * `<c r="A1" s="3" t="s"><v>7</v></c>` — capturing the attribute run and the
 * index separately. `t="s"` is then tested against that capture by
 * `SHARED_STRING_TYPE_RE` rather than being matched inline.
 *
 * ## Why it is shaped like this
 *
 * This reads raw sheet XML before the workbook has been validated, so it has
 * to stay predictable on markup no spreadsheet editor would produce. Every
 * quantified run is bounded and excludes `<` and `>`, which keeps a match
 * attempt inside the tag it started in; runs left unbounded either side of
 * the value degrade badly on malformed input instead.
 *
 * Only one variable run precedes a literal (`[^<>]{0,512}`, then `>`), and
 * because that run cannot itself consume a `>`, a failed attempt unwinds in
 * one step rather than retrying every split. Keeping it to a single run —
 * instead of matching `t="s"` inline between two of them — is what makes that
 * hold, and is why the type test is a separate pass over the capture.
 *
 * A trailing `</c>` is deliberately not required: it never contributed to the
 * capture, and matching it would mean another unbounded run after the value.
 * The digit run is bounded for the same reason the ceiling below exists — the
 * parsed index decides the size of an allocation.
 *
 * ## Why `<f>` is spelled out
 *
 * `<f>` is the only element `CT_Cell` allows before `<v>`, and both its forms
 * are accepted here. Requiring whitespace instead would be correct for Excel
 * — which writes computed string results as `t="str"`, never `t="s"` — but
 * this guard exists for producers that emit `t="s"` without the table at all,
 * which is already outside what the schema permits, so their other habits
 * cannot be assumed either. Missing a cell is the harmful direction: the
 * synthesized table comes out short and the load fails.
 *
 * Tolerating arbitrary content instead of naming `<f>` would be worse, not
 * safer. A self-closing `<c t="s"/>` would then reach past itself into the
 * next cell's `<v>`, and an ordinary ISK amount there is large enough to trip
 * `MAX_SHARED_STRING_ENTRIES` and reject a workbook that was fine.
 */
const SHARED_STRING_CELL_RE =
  /<c\b([^<>]{0,512})>(?:<f\b[^<>]{0,512}(?:\/>|>[^<]{0,1024}<\/f>))?\s{0,64}<v>(\d{1,9})<\/v>/g
const SHARED_STRING_TYPE_RE = /\bt="s"/

/**
 * Ceiling on the blank shared-string table synthesized below.
 *
 * `emptySharedStringsXml` builds one array element per entry, so the index
 * read out of the sheet decides how large an allocation this makes. Malformed
 * markup can carry an index far past anything the workbook actually holds,
 * and an allocation that size fails in a way no `try`/`catch` here can turn
 * back into a 400 — so it is refused up front instead.
 *
 * 65536 is ~30x the template's own table (~2000 entries), so the limit is
 * unreachable from a real report while keeping the synthesized document to
 * about a megabyte.
 */
const MAX_SHARED_STRING_ENTRIES = 65_536

const workbookTooLarge = (): BadRequestException =>
  new BadRequestException({
    message:
      'Vinnubókin er of stór til lestrar — of mikið af gögnum í skránni.',
    errors: [
      {
        sheet: '(workbook)',
        row: null,
        column: null,
        message: `Uppsafnað magn afþjappaðra gagna fer yfir ${
          MAX_INFLATED_ARCHIVE_BYTES / (1024 * 1024)
        }MB.`,
      },
    ],
  })

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
const guardMissingSharedStrings = async (
  zip: JSZip,
  buffer: Buffer,
): Promise<Buffer> => {
  if (zip.file(SHARED_STRINGS_PATH)) return buffer

  let maxSharedStringIndex = -1

  // No size accounting here any more. `assertArchiveWithinBudget` has already
  // bounded every member of this archive, so what this loop can inflate is
  // capped before it starts — and one budget in one place beats two that have
  // to be kept in step.
  for (const entry of Object.values(zip.files)) {
    if (entry.dir || !WORKSHEET_XML_RE.test(entry.name)) continue

    const xml = await entry.async('string')

    for (const [, attributes, index] of xml.matchAll(SHARED_STRING_CELL_RE)) {
      if (!SHARED_STRING_TYPE_RE.test(attributes)) continue
      maxSharedStringIndex = Math.max(maxSharedStringIndex, Number(index))
    }
  }

  if (maxSharedStringIndex < 0) return buffer

  if (maxSharedStringIndex >= MAX_SHARED_STRING_ENTRIES) {
    throw new BadRequestException({
      message:
        'Vinnubókin vísar í of margar strengjafærslur til að hægt sé að lesa hana.',
      errors: [
        {
          sheet: '(workbook)',
          row: null,
          column: null,
          message: `Hæsta strengjavísun er ${maxSharedStringIndex}, hámark er ${
            MAX_SHARED_STRING_ENTRIES - 1
          }.`,
        },
      ],
    })
  }

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

/**
 * The value-level half of the parse: everything that reads an already-loaded
 * `ExcelJS.Workbook` rather than bytes. Split out from `parseWorkbook` so tests
 * that build a workbook in memory can exercise it without paying a
 * `writeBuffer()` + re-`load()` round trip per case — on the shipped template
 * that round trip is ~600ms of pure exceljs CPU, and it was also the source of
 * two intermittent failures (a truncated zip out of `writeBuffer`, and buffer
 * pool aliasing on the way back in).
 *
 * Byte-level concerns — archive budget, shared-strings repair, "is this even an
 * xlsx" — belong to `parseWorkbook` and are not reachable from here.
 */
export const parseLoadedWorkbook = (
  workbook: ExcelJS.Workbook,
): ParsedReportDto => {
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

export const parseWorkbook = async (
  fileBuffer: Buffer,
): Promise<ParsedReportDto> => {
  const workbook = new ExcelJS.Workbook()
  try {
    const zip = await JSZip.loadAsync(fileBuffer)
    await assertArchiveWithinBudget(zip)
    const guardedBuffer = await guardMissingSharedStrings(zip, fileBuffer)
    // exceljs declares its own `Buffer extends ArrayBuffer` shape that
    // conflicts with Node 20's `Buffer extends Uint8Array<ArrayBufferLike>`.
    // Hand it the underlying ArrayBuffer slice to satisfy both contracts.
    const arrayBuffer = guardedBuffer.buffer.slice(
      guardedBuffer.byteOffset,
      guardedBuffer.byteOffset + guardedBuffer.byteLength,
    ) as ArrayBuffer
    await workbook.xlsx.load(arrayBuffer)
  } catch (e) {
    // The guard above rejects on purpose, with a message that already says
    // what is wrong. Re-wrapping it would replace that with "is this a valid
    // xlsx file?" — which is both less useful and, for a workbook that is
    // simply too large, untrue. Only genuine load failures get the generic
    // message; `errors` does not reach the client, so the headline is the
    // only part the user reads.
    if (e instanceof ArchiveTooLargeError) throw workbookTooLarge()
    if (e instanceof BadRequestException) throw e

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

  return parseLoadedWorkbook(workbook)
}
