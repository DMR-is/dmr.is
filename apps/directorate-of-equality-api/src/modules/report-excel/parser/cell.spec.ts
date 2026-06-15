import ExcelJS from 'exceljs'

import { readDate, toIsoDate } from './cell'

// The readers only touch `cell.value`, so a minimal stub is sufficient.
const cell = (value: ExcelJS.CellValue): ExcelJS.Cell =>
  ({ value }) as unknown as ExcelJS.Cell

describe('readDate', () => {
  it('passes through a real Date', () => {
    const d = new Date('2023-06-01T00:00:00.000Z')
    expect(readDate(cell(d))).toEqual(d)
  })

  it('coerces an Excel date serial number to the right date', () => {
    // Serials produced when a filled date cell loses its date number-format
    // on round-trip (common in the data-entry template).
    expect(toIsoDate(readDate(cell(45078))!)).toBe('2023-06-01')
    expect(toIsoDate(readDate(cell(44635))!)).toBe('2022-03-15')
    expect(toIsoDate(readDate(cell(44927))!)).toBe('2023-01-01')
  })

  it('returns null for out-of-range serials', () => {
    expect(readDate(cell(0))).toBeNull()
    expect(readDate(cell(-5))).toBeNull()
    expect(readDate(cell(3_000_000))).toBeNull()
  })

  it('returns null for formula cells (never trusts cached results)', () => {
    expect(
      readDate(cell({ formula: 'TODAY()', result: 45000 } as ExcelJS.CellValue)),
    ).toBeNull()
  })

  it('returns null for empty cells', () => {
    expect(readDate(cell(null))).toBeNull()
    expect(readDate(cell(undefined))).toBeNull()
  })
})
