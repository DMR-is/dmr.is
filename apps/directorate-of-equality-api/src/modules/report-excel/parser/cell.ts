/**
 * Cell value extraction helpers.
 *
 * exceljs returns `cell.value` as a broad `CellValue` union: strings, numbers,
 * Dates, null, rich-text objects, hyperlink objects, formula objects, error
 * markers. The parser always wants a specific scalar type (string / number /
 * Date) and needs to extract it uniformly regardless of cell formatting.
 *
 * ## Rich-text
 *
 * A cell styled with partial formatting (bold on part of the string) is
 * stored as `{ richText: [{ text, font }, ...] }` rather than a plain string.
 * We flatten it back to plain text by concatenating the runs.
 *
 * ## Formulas
 *
 * A formula cell stores `{ formula, result }`. We NEVER use `result` — the
 * parser's strategy is to avoid formula evaluation entirely (it's unreliable
 * across tools; exceljs does not evaluate, only caches what the originating
 * writer decided to save). Formula cells in user-input positions are treated
 * as empty, and we pull canonical data from the raw-data sheets instead.
 */

import ExcelJS from 'exceljs'

export const readString = (cell: ExcelJS.Cell): string | null => {
  const v = cell.value
  if (v == null) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && 'richText' in v) {
    return (
      v.richText
        .map((run) => run.text)
        .join('')
        .trim() || null
    )
  }
  if (typeof v === 'object' && 'formula' in v) return null
  if (typeof v === 'object' && 'hyperlink' in v) {
    return typeof v.text === 'string' ? v.text.trim() || null : null
  }
  return null
}

export const readNumber = (cell: ExcelJS.Cell): number | null => {
  const v = cell.value
  if (v == null) return null
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const trimmed = v.trim().replace(',', '.')
    if (!trimmed) return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }
  if (typeof v === 'object' && 'formula' in v) return null
  return null
}

export const readInteger = (cell: ExcelJS.Cell): number | null => {
  const n = readNumber(cell)
  if (n == null) return null
  return Number.isInteger(n) ? n : null
}

/**
 * Excel's day-zero is 1899-12-30 (the off-by-one accommodates Excel's
 * fictional 1900 leap day). Date cells whose number-format was stripped —
 * common after paste / fill-down in the data-entry template — round-trip
 * through xlsx as a bare serial number rather than a typed date, so we
 * coerce numeric serials back to dates here.
 */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)
const MS_PER_DAY = 86_400_000
/** Guard band: serials outside ~[1900, 9999] are almost certainly not dates. */
const MIN_DATE_SERIAL = 1
const MAX_DATE_SERIAL = 2_958_465 // 9999-12-31

export const readDate = (cell: ExcelJS.Cell): Date | null => {
  const v = cell.value
  if (v == null) return null
  if (v instanceof Date) return v
  if (typeof v === 'number') {
    if (v < MIN_DATE_SERIAL || v > MAX_DATE_SERIAL) return null
    return new Date(EXCEL_EPOCH_UTC + Math.round(v) * MS_PER_DAY)
  }
  if (typeof v === 'object' && 'formula' in v) return null
  return null
}

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10)
