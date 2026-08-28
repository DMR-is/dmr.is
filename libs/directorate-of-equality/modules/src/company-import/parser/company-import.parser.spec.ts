import ExcelJS from 'exceljs'

import { BadRequestException } from '@nestjs/common'

import { CompanySizeEnum } from '../../company/models/company.enums'
import {
  computeLastRow,
  mapSizeLabel,
  normalizeIsatCode,
  parseCompanyImport,
} from './company-import.parser'

// Header row mirrors the real file, including a blank spacer column (J) before
// LAUNAFLOKKUR — so we exercise header-based (not letter-based) mapping.
const HEADER = [
  'TEKJUAR',
  'KENNITALA',
  'NAFN',
  'LOGHEIMILI',
  'POSTNUMER',
  'SVEITARFELAG_NR',
  'SVEITARFELAG',
  'ISAT',
  'ISAT2008LYSING',
  null,
  'LAUNAFLOKKUR',
]

type Cell = string | number | null

const buildBook = async (rows: Cell[][], header = HEADER): Promise<Buffer> => {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Companies')
  ws.addRow(header)
  rows.forEach((r) => ws.addRow(r))
  return Buffer.from((await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer)
}

// Valid company kennitalas (verified with the kennitala package).
const kt1 = '4101660389'
const kt2 = '4101680229'

const row = (overrides: Partial<Record<string, Cell>> = {}): Cell[] => [
  overrides.year ?? 2025,
  overrides.kt ?? kt1,
  overrides.name ?? 'Acme ehf.',
  overrides.address ?? 'Vesturvör 34',
  overrides.postcode ?? '200',
  1000,
  'Kópavogur',
  overrides.isat ?? '49390',
  'Aðrir farþegaflutningar á landi',
  null,
  overrides.size ?? '50+',
]

describe('company-import parser', () => {
  describe('mapSizeLabel', () => {
    it('maps 50+ → LARGE, 25-49 → MEDIUM, everything else → SMALL', () => {
      expect(mapSizeLabel('50+')).toBe(CompanySizeEnum.LARGE)
      expect(mapSizeLabel('25-49')).toBe(CompanySizeEnum.MEDIUM)
      expect(mapSizeLabel('0-24')).toBe(CompanySizeEnum.SMALL)
      expect(mapSizeLabel('')).toBe(CompanySizeEnum.SMALL)
      expect(mapSizeLabel(null)).toBe(CompanySizeEnum.SMALL)
      expect(mapSizeLabel(' 50+ ')).toBe(CompanySizeEnum.LARGE)
    })
  })

  describe('normalizeIsatCode', () => {
    it('pads to 5 digits to recover leading zeros lost to numeric cells', () => {
      expect(normalizeIsatCode('1110')).toBe('01110')
      expect(normalizeIsatCode('49390')).toBe('49390')
      expect(normalizeIsatCode('01.11.0')).toBe('01110')
      expect(normalizeIsatCode(null)).toBeNull()
      expect(normalizeIsatCode('')).toBeNull()
    })
  })

  it('parses valid rows and maps the columns', async () => {
    const buf = await buildBook([row(), row({ kt: kt2, name: 'Beta ehf.' })])
    const result = await parseCompanyImport(buf)

    expect(result.errors).toHaveLength(0)
    expect(result.year).toBe(2025)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      nationalId: kt1,
      name: 'Acme ehf.',
      address: 'Vesturvör 34',
      postcodeCode: '200',
      isatCategoryCode: '49390',
      size: CompanySizeEnum.LARGE,
    })
  })

  it('recovers a leading-zero ISAT code stored as a number', async () => {
    const buf = await buildBook([row({ isat: 1110 })])
    const result = await parseCompanyImport(buf)
    expect(result.rows[0].isatCategoryCode).toBe('01110')
  })

  it('rejects an invalid kennitala', async () => {
    const buf = await buildBook([row({ kt: '0000000000' })])
    const result = await parseCompanyImport(buf)
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]).toMatchObject({ reason: 'Invalid or missing kennitala' })
  })

  it('rejects a row missing the company name', async () => {
    const buf = await buildBook([row({ name: '' })])
    const result = await parseCompanyImport(buf)
    expect(result.rows).toHaveLength(0)
    expect(result.errors[0].reason).toContain('Missing company name')
  })

  it('rejects every row of a duplicated kennitala', async () => {
    const buf = await buildBook([
      row({ kt: kt1, name: 'First' }),
      row({ kt: kt1, name: 'Second' }),
    ])
    const result = await parseCompanyImport(buf)
    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(2)
    expect(result.errors.every((e) => e.reason.includes('Duplicate'))).toBe(true)
  })

  it('skips fully blank rows', async () => {
    const buf = await buildBook([
      row(),
      [null, null, null, null, null, null, null, null, null, null, null],
    ])
    const result = await parseCompanyImport(buf)
    expect(result.rows).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
  })

  it('returns null year when rows disagree', async () => {
    const buf = await buildBook([row({ year: 2025 }), row({ kt: kt2, year: 2024 })])
    const result = await parseCompanyImport(buf)
    expect(result.year).toBeNull()
  })

  describe('computeLastRow', () => {
    // The security-relevant bound. `sheet.rowCount` is attacker-chosen, so the
    // clamp is what stops a declared 2e9 from becoming 2e9 iterations of
    // Row/Cell allocation.
    it('clamps a declared row count to the absolute maximum', () => {
      expect(computeLastRow(2000000000)).toBe(100001)
      expect(computeLastRow(1048576)).toBe(100001)
    })

    it('leaves a plausible row count untouched', () => {
      expect(computeLastRow(2)).toBe(2)
      expect(computeLastRow(4000)).toBe(4000)
      expect(computeLastRow(100001)).toBe(100001)
    })
  })

  // `sheet.rowCount` comes from the `r` attribute of the highest <row> in the
  // uploaded XML, so it is chosen by whoever authored the file. Scanning to it
  // materialises a Row and Cells per iteration — an inflated value used to
  // exhaust the heap and take the API down. The scan must terminate on the
  // blank run instead of the declared count.
  it('does not scan to an inflated declared row count', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Companies')
    ws.addRow(HEADER)
    ws.addRow(row())

    // One lone row far below the data, with nothing in between. Deliberately
    // placed INSIDE ABSOLUTE_MAX_COMPANY_ROWS, so the blank-run break is the
    // only thing that can stop the scan reaching it — otherwise the cap would
    // catch this case and the test could not tell a working break from a
    // missing one. The cap is asserted separately, in `computeLastRow`.
    const farRow = ws.getRow(50000)
    farRow.getCell(2).value = kt2
    farRow.getCell(3).value = 'Far away ehf.'
    farRow.commit()

    const buf = Buffer.from(
      (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer,
    )
    expect(ws.rowCount).toBeGreaterThan(40000)

    const result = await parseCompanyImport(buf)

    // The real row is parsed; the far one is never reached.
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].nationalId).toBe(kt1)
    expect(result.errors).toHaveLength(0)
  })

  it('keeps reading across a blank gap shorter than the run limit', async () => {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Companies')
    ws.addRow(HEADER)
    ws.addRow(row())

    // Rows 3-12 blank, data resumes at 13 — the stray gaps a hand-exported
    // register carries must not truncate the import.
    const resumed = ws.getRow(13)
    row({ kt: kt2, name: 'Beta ehf.' }).forEach((value, i) => {
      resumed.getCell(i + 1).value = value
    })
    resumed.commit()

    const buf = Buffer.from(
      (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer,
    )
    const result = await parseCompanyImport(buf)

    expect(result.rows).toHaveLength(2)
    expect(result.rows.map((r) => r.nationalId)).toEqual([kt1, kt2])
  })

  it('throws on a missing required header', async () => {
    const badHeader = ['TEKJUAR', 'NAFN', 'LAUNAFLOKKUR'] // no KENNITALA
    await expect(
      parseCompanyImport(await buildBook([], badHeader)),
    ).rejects.toThrow(BadRequestException)
  })
})
