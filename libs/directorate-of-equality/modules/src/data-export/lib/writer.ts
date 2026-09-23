/**
 * Turns rows + columns into the bytes of a file.
 *
 * Two formats, for two different readers. The xlsx is what the admins open:
 * frozen header, autofilter, real date cells. The CSV is for whatever parses
 * the file downstream, so it is plain RFC 4180 — comma-separated and quoted,
 * not tuned for one spreadsheet's import dialog.
 */

import ExcelJS from 'exceljs'

import type { ExportCellValue, ExportColumn } from './columns'

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
export const CSV_MIME = 'text/csv; charset=utf-8'

/** Excel's own date format code; `dd.mm.yyyy` is the Icelandic convention. */
const DATE_FORMAT = 'dd.mm.yyyy'

/**
 * A line describing how the file was produced, rendered onto its own sheet.
 *
 * An export that leaves the building with no record of the filter behind it
 * is a table of numbers nobody can reproduce — and these files get mailed on,
 * quoted in reports and compared against each other months later.
 */
export type ExportMetadata = {
  title: string
  generatedAt: Date
  rowCount: number
  /** Human-readable filter lines, already localised by the caller. */
  filters: string[]
}

/**
 * Excel silently truncates a sheet name past 31 characters and rejects
 * `[]:*?/\`, so a title that came from a label map cannot be used raw.
 */
const toSheetName = (title: string): string =>
  title.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31)

export async function writeXlsx<TRow>(
  rows: TRow[],
  columns: ExportColumn<TRow>[],
  metadata: ExportMetadata,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.created = metadata.generatedAt

  const sheet = workbook.addWorksheet(toSheetName(metadata.title))

  sheet.columns = columns.map((column) => ({
    header: column.header,
    width: column.width ?? 18,
  }))

  sheet.getRow(1).font = { bold: true }
  // Header stays put while scrolling, and the filter dropdowns land on it.
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  }

  for (const row of rows) {
    const added = sheet.addRow(columns.map((column) => column.value(row)))

    // Dates are added as real Date cells so they sort and filter as dates;
    // without an explicit numFmt Excel renders them as a serial number.
    columns.forEach((_, index) => {
      const cell = added.getCell(index + 1)
      if (cell.value instanceof Date) cell.numFmt = DATE_FORMAT
    })
  }

  const about = workbook.addWorksheet('Um útdráttinn')
  about.columns = [{ width: 28 }, { width: 70 }]
  about.addRow(['Útdráttur', metadata.title]).font = { bold: true }
  about
    .addRow(['Keyrt', metadata.generatedAt])
    .getCell(2).numFmt = `${DATE_FORMAT} hh:mm`
  about.addRow(['Fjöldi raða', metadata.rowCount])
  about.addRow([])
  about.addRow(['Síur', '']).font = { bold: true }
  if (metadata.filters.length === 0) {
    about.addRow(['', 'Engar síur — allt sem listinn sýnir sjálfgefið.'])
  } else {
    for (const line of metadata.filters) about.addRow(['', line])
  }

  // `as Buffer`: exceljs types this as its own `Buffer` interface, which is
  // structurally Node's but not nominally.
  return (await workbook.xlsx.writeBuffer()) as Buffer
}

/** RFC 4180: double the quotes, wrap anything that could confuse a parser. */
const csvCell = (value: ExportCellValue): string => {
  if (value === null || value === undefined) return ''

  const raw =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value)

  // Formula injection: applicant-entered text starting with = + - @ tab or CR
  // would run as a formula in Excel. Strings only — a number stays a number.
  const text =
    typeof value === 'string' && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function writeCsv<TRow>(
  rows: TRow[],
  columns: ExportColumn<TRow>[],
): Buffer {
  const lines = [
    columns.map((column) => csvCell(column.header)).join(','),
    ...rows.map((row) =>
      columns.map((column) => csvCell(column.value(row))).join(','),
    ),
  ]

  // Leading BOM: without it Excel reads a UTF-8 CSV as the system codepage and
  // every Icelandic character in the file arrives mangled. Harmless to the
  // parsers this format is actually for.
  return Buffer.from(`﻿${lines.join('\r\n')}\r\n`, 'utf8')
}
