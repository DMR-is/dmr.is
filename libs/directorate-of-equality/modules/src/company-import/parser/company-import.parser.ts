/**
 * Parser for the annual company register workbook.
 *
 * Pure (buffer → result): extracts and locally validates every row, never
 * throws on a single-row problem (those accumulate into `errors`). Only a
 * structural problem — unreadable workbook or a missing required header —
 * throws `BadRequestException`.
 *
 * Columns are located by header name (row 1), not by fixed letter, so a blank
 * spacer column or reordering doesn't break the mapping. DB-dependent checks
 * (ISAT code exists, postcode resolves) are deferred to the service.
 */

import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { isValid as isValidKennitala, sanitize } from 'kennitala'

import { BadRequestException } from '@nestjs/common'

import { CompanySizeEnum } from '../../company/models/company.enums'
import {
  ArchiveTooLargeError,
  assertArchiveWithinBudget,
  MAX_INFLATED_ARCHIVE_BYTES,
} from '../../import-upload/archive-budget'
import { readInteger, readString } from '../../report-excel/parser/cell'
import { CompanyImportErrorDto } from '../dto/company-import-result.dto'
import {
  ParsedCompanyImport,
  ParsedCompanyRow,
} from '../dto/parsed-company-row.dto'

// Header labels as they appear in the sheet (row 1), upper-cased for matching.
const HEADERS = {
  year: 'TEKJUAR',
  nationalId: 'KENNITALA',
  name: 'NAFN',
  address: 'LOGHEIMILI',
  postcode: 'POSTNUMER',
  isat: 'ISAT',
  size: 'LAUNAFLOKKUR',
} as const

// Without these the file isn't the register we expect.
const REQUIRED_HEADERS = [HEADERS.nationalId, HEADERS.name, HEADERS.size]

/** Headers are row 1, so data starts here. */
const FIRST_DATA_ROW = 2

/**
 * Hard ceiling on how many data rows are scanned, whatever the file claims.
 *
 * ⚠️ `sheet.rowCount` is NOT a trustworthy bound — it is
 * `Worksheet._lastRowNumber`, taken straight from the `r` attribute of the
 * highest `<row>` in the uploaded sheet XML (`row-xform.js` does
 * `parseInt(node.attributes.r, 10)` with no clamp). Whoever authors the .xlsx
 * chooses it. Because `getRow`/`getCell` *create and retain* Row and Cell
 * objects, a sub-kilobyte file declaring `<row r="2000000000">` used to drive a
 * synchronous allocating loop that blocked the only thread and exhausted the
 * heap — taking the whole API down for every user, from the cheapest possible
 * request. The endpoint needs no privilege beyond a logged-in DoE user, since
 * `AdminGuard` only resolves an active `doe_user` row and returns true.
 *
 * The value is headroom, not a business rule: the Icelandic company register is
 * on the order of tens of thousands of rows, so 100 000 cannot reject a real
 * import while still bounding the worst case to something that finishes.
 */
const ABSOLUTE_MAX_COMPANY_ROWS = 100000

/**
 * Stop scanning after this many consecutive empty rows.
 *
 * The cap above is the backstop; this is what normally ends the scan. Whole-
 * column formatting — borders or styles applied to an entire column, very
 * common in hand-edited files — pushes `rowCount` out to Excel's ~1 048 576-row
 * maximum with no data behind it. A real register never contains a 200-row
 * internal gap, so breaking after this run bounds cell materialisation to the
 * real data plus a small margin, while still tolerating the stray blank rows
 * that a register exported by hand tends to carry.
 *
 * Matches `report-excel/parser/employees.parser.ts`, which guards the same
 * hazard on the employee sheet.
 */
const EMPTY_ROW_RUN_LIMIT = 200

/**
 * The scan bound, clamped to {@link ABSOLUTE_MAX_COMPANY_ROWS}.
 *
 * Exported so the clamp itself can be asserted directly: the blank-run break is
 * what ends a realistic scan, which means an end-to-end test cannot distinguish
 * a working cap from a missing one without a fixture of >100 000 populated rows.
 * Keeping the arithmetic here makes the bound a unit-testable fact rather than
 * an untested backstop.
 */
export const computeLastRow = (rowCount: number): number =>
  Math.min(rowCount, FIRST_DATA_ROW + ABSOLUTE_MAX_COMPANY_ROWS - 1)

/** LAUNAFLOKKUR → size bucket. Anything that isn't 50+/25-49 is treated as SMALL. */
export const mapSizeLabel = (label: string | null): CompanySizeEnum => {
  const v = (label ?? '').replace(/\s/g, '')
  if (v === '50+') return CompanySizeEnum.LARGE
  if (v === '25-49') return CompanySizeEnum.MEDIUM
  return CompanySizeEnum.SMALL
}

/**
 * Normalize an ÍSAT code to the 5-digit form. Excel often stores a code like
 * "01110" as the number 1110, dropping the leading zero — pad it back. Codes
 * outside 5 digits are returned as-is so the service rejects them with the
 * offending value shown.
 */
export const normalizeIsatCode = (raw: string | null): string | null => {
  if (raw == null) return null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  return digits.length <= 5 ? digits.padStart(5, '0') : digits
}

export const parseCompanyImport = async (
  fileBuffer: Buffer,
): Promise<ParsedCompanyImport> => {
  const workbook = new ExcelJS.Workbook()
  try {
    // Same exposure as the report importer: the buffer comes from
    // `fetchWorkbook`, whose only size check counts compressed bytes, and
    // `xlsx.load` will expand whatever it is given. Admin-only, so harder to
    // reach — not a reason to leave the one path bounded and the other not.
    await assertArchiveWithinBudget(await JSZip.loadAsync(fileBuffer))
    await workbook.xlsx.load(fileBuffer)
  } catch (e) {
    if (e instanceof ArchiveTooLargeError) {
      throw new BadRequestException(
        `The uploaded workbook expands beyond the ${
          MAX_INFLATED_ARCHIVE_BYTES / (1024 * 1024)
        }MB limit`,
      )
    }
    throw new BadRequestException(
      'Could not read the uploaded file as an .xlsx workbook',
    )
  }

  const sheet = workbook.worksheets[0]
  if (!sheet) {
    throw new BadRequestException('The workbook has no worksheets')
  }

  // Map header label → column number from row 1.
  const headerRow = sheet.getRow(1)
  const colByHeader = new Map<string, number>()
  headerRow.eachCell((cell, col) => {
    const label = readString(cell)?.toUpperCase()
    if (label && !colByHeader.has(label)) colByHeader.set(label, col)
  })

  const missing = REQUIRED_HEADERS.filter((h) => !colByHeader.has(h))
  if (missing.length) {
    throw new BadRequestException(
      `Missing required column(s): ${missing.join(', ')}`,
    )
  }

  const col = (header: string): number | null => colByHeader.get(header) ?? null
  const cellStr = (rowNo: number, header: string): string | null => {
    const c = col(header)
    return c ? readString(sheet.getRow(rowNo).getCell(c)) : null
  }

  const rows: ParsedCompanyRow[] = []
  const errors: CompanyImportErrorDto[] = []
  const years = new Set<number>()
  // Track kennitalas seen, to flag duplicates within the file.
  const seenAt = new Map<string, number>()
  const dupKennitalas = new Set<string>()

  // Never scan past the ceiling, however many rows the file declares.
  const lastRow = computeLastRow(sheet.rowCount)

  let consecutiveEmpty = 0
  for (let rowNo = FIRST_DATA_ROW; rowNo <= lastRow; rowNo++) {
    const rawKt = cellStr(rowNo, HEADERS.nationalId)
    const name = cellStr(rowNo, HEADERS.name)

    // Skip fully-blank rows (no kennitala and no name), and bail out of a
    // runaway scan once the blank run is long enough that no real data can
    // plausibly follow (see EMPTY_ROW_RUN_LIMIT).
    if (!rawKt && !name) {
      if (++consecutiveEmpty >= EMPTY_ROW_RUN_LIMIT) break
      continue
    }
    consecutiveEmpty = 0

    const nationalId = rawKt ? sanitize(rawKt) : null

    if (!nationalId || !isValidKennitala(nationalId)) {
      errors.push({
        row: rowNo,
        nationalId: rawKt,
        reason: 'Invalid or missing kennitala',
      })
      continue
    }

    if (!name) {
      errors.push({
        row: rowNo,
        nationalId,
        reason: 'Missing company name (NAFN)',
      })
      continue
    }

    if (seenAt.has(nationalId)) dupKennitalas.add(nationalId)
    else seenAt.set(nationalId, rowNo)

    const yearCol = col(HEADERS.year)
    if (yearCol) {
      const y = readInteger(sheet.getRow(rowNo).getCell(yearCol))
      if (y != null) years.add(y)
    }

    rows.push({
      row: rowNo,
      nationalId,
      name,
      address: cellStr(rowNo, HEADERS.address),
      postcodeCode: cellStr(rowNo, HEADERS.postcode),
      isatCategoryCode: normalizeIsatCode(cellStr(rowNo, HEADERS.isat)),
      size: mapSizeLabel(cellStr(rowNo, HEADERS.size)),
    })
  }

  // Reject every row of a duplicated kennitala — we can't tell which is truth.
  if (dupKennitalas.size) {
    const kept: ParsedCompanyRow[] = []
    for (const r of rows) {
      if (dupKennitalas.has(r.nationalId)) {
        errors.push({
          row: r.row,
          nationalId: r.nationalId,
          reason: 'Duplicate kennitala in file — no row applied',
        })
      } else {
        kept.push(r)
      }
    }
    rows.length = 0
    rows.push(...kept)
  }

  return {
    rows,
    errors,
    year: years.size === 1 ? [...years][0] : null,
  }
}
