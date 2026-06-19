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
import { isValid as isValidKennitala, sanitize } from 'kennitala'

import { BadRequestException } from '@nestjs/common'

import { CompanySizeEnum } from '../../company/models/company.enums'
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
    await workbook.xlsx.load(fileBuffer)
  } catch {
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

  for (let rowNo = 2; rowNo <= sheet.rowCount; rowNo++) {
    const rawKt = cellStr(rowNo, HEADERS.nationalId)
    const name = cellStr(rowNo, HEADERS.name)

    // Skip fully-blank rows (no kennitala and no name).
    if (!rawKt && !name) continue

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
