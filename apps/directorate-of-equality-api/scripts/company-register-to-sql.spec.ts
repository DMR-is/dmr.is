import * as ExcelJS from 'exceljs'

import {
  bucketFromLabel,
  COMPANY_ON_CONFLICT,
  normalizeIsatCode,
  readDay,
} from './company-register-to-sql'

/**
 * Pins the cell reader against Excel's two formula shapes.
 *
 * Every reader in the generator unwraps a formula cell through the same
 * `scalar` helper, and it used to test `'formula' in value` alone. That holds
 * for the MASTER cell of a shared formula but not for its SLAVE cells: exceljs
 * builds a cell's value with `Cell._copyModel`, which copies only the keys it
 * finds, so a slave carries `{result, sharedFormula}` and no `formula` key at
 * all. `scalar` then returned the wrapper object, which matches no branch in
 * any reader, and every such cell read as null.
 *
 * That failure is invisible by construction — the generator's diagnostics fire
 * on `raw && !parsed`, and `raw` is itself null when the read fails, so nothing
 * is reported and the load simply omits the column. It also does not reproduce
 * on the current workbook, which has no shared formulas in a read column. So
 * without this spec the fix is unexercised code guarding against a defect no
 * output would reveal.
 *
 * The workbook is round-tripped through a real xlsx buffer rather than hand-
 * built, because the slave shape is produced by exceljs's own writer/reader and
 * asserting against a shape we invented would prove nothing.
 */
const roundTrip = async (
  build: (sheet: ExcelJS.Worksheet) => void,
): Promise<ExcelJS.Worksheet> => {
  const wb = new ExcelJS.Workbook()
  build(wb.addWorksheet('register'))
  const buffer = await wb.xlsx.writeBuffer()

  const reread = new ExcelJS.Workbook()
  await reread.xlsx.load(buffer)
  const sheet = reread.getWorksheet('register')
  if (!sheet) throw new Error('worksheet did not survive the round trip')
  return sheet
}

const DUE = new Date(Date.UTC(2027, 11, 31))

describe('readDay — formula cells', () => {
  it('reads the cached result of a plain formula', async () => {
    const sheet = await roundTrip((s) => {
      s.getCell('A1').value = { formula: 'TODAY()', result: DUE }
    })

    expect(readDay(sheet.getCell('A1'))).toEqual({
      year: 2027,
      month: 12,
      day: 31,
    })
  })

  it('reads a shared formula through both the master and its slave cells', async () => {
    const sheet = await roundTrip((s) => {
      // Only the slave names its master. exceljs's writer derives the shared
      // group from that reference, so the master needs no `ref`/`shareType`
      // here — and its published typings do not describe those keys anyway.
      s.getCell('A1').value = { formula: 'B1', result: DUE }
      s.getCell('A2').value = { sharedFormula: 'A1', result: DUE }
    })

    // The shapes the readers actually have to cope with. Asserted rather than
    // assumed, so an exceljs upgrade that changes them fails here and not in a
    // silently short load.
    //
    // `in` rather than `Object.keys`, because that is the operator `scalar`
    // branches on. exceljs declares `readonly formula?: string` on
    // `CellSharedFormulaValue`, so a future version could expose it as a
    // prototype getter: own-key assertions would stay green while the defect's
    // precondition had quietly gone.
    const master = sheet.getCell('A1').value as object
    expect('formula' in master).toBe(true)
    const slave = sheet.getCell('A2').value as object
    expect('sharedFormula' in slave).toBe(true)
    expect('formula' in slave).toBe(false)

    expect(readDay(sheet.getCell('A1'))).toEqual({
      year: 2027,
      month: 12,
      day: 31,
    })
    // The regression: this read as null while the sheet plainly states a date.
    expect(readDay(sheet.getCell('A2'))).toEqual({
      year: 2027,
      month: 12,
      day: 31,
    })
  })

  // Pins the key test's NARROWNESS, not just its presence. `scalar` must unwrap
  // formula wrappers and nothing else: dropping the key check altogether and
  // unwrapping every object would still satisfy the shared-formula cases above,
  // while silently nulling the two non-formula object shapes `readString`
  // handles — rich text and hyperlinks — both of which are ordinary export
  // content. Without this case that mutant passes the whole file.
  it('does not mistake a rich-text cell for a formula wrapper', async () => {
    const sheet = await roundTrip((s) => {
      s.getCell('A1').value = { richText: [{ text: '31.12.2027' }] }
    })

    expect('richText' in (sheet.getCell('A1').value as object)).toBe(true)
    expect(readDay(sheet.getCell('A1'))).toEqual({
      year: 2027,
      month: 12,
      day: 31,
    })
  })

  it('reads a shared-formula slave holding text rather than a date', async () => {
    const sheet = await roundTrip((s) => {
      s.getCell('A1').value = { formula: 'B1', result: '31.12.2027' }
      s.getCell('A2').value = { sharedFormula: 'A1', result: '31.12.2027' }
    })

    expect(readDay(sheet.getCell('A2'))).toEqual({
      year: 2027,
      month: 12,
      day: 31,
    })
  })
})

/**
 * The two mappings where a wrong answer is a different REAL value rather than a
 * null, which is why they are pinned and the rest of the readers are not: a
 * null shows up in the summary's diagnostics, a plausible wrong value does not.
 */
describe('bucketFromLabel', () => {
  it('reads the bands by their numbers, not their text', () => {
    expect(bucketFromLabel('0-24')).toBe('SMALL')
    expect(bucketFromLabel('0')).toBe('SMALL')
    // En dash, which this sheet uses interchangeably with a hyphen.
    expect(bucketFromLabel('25–49')).toBe('MEDIUM')
    expect(bucketFromLabel('50+')).toBe('LARGE')
    expect(bucketFromLabel('50 eða fleiri')).toBe('LARGE')
  })

  it("collapses the old column's finer bands upwards", () => {
    expect(bucketFromLabel('50-89')).toBe('LARGE')
    expect(bucketFromLabel('90-149')).toBe('LARGE')
    expect(bucketFromLabel('150-249')).toBe('LARGE')
    expect(bucketFromLabel('>249')).toBe('LARGE')
  })

  it('reads a range by its top, except 25-49 which is its own band', () => {
    // The upper bound of "25-49" is 49, and bucketFromCount(49) would be
    // MEDIUM anyway — but "0-24" must not become SMALL by accident of 24 < 25
    // while "25-49" is decided by a special case. Pinned so the special case
    // cannot be dropped without a failure.
    expect(bucketFromLabel('25-49')).toBe('MEDIUM')
    expect(bucketFromLabel('49')).toBe('MEDIUM')
    expect(bucketFromLabel('24')).toBe('SMALL')
  })

  it('returns null for nothing to read, and never guesses SMALL', () => {
    expect(bucketFromLabel(null)).toBeNull()
    expect(bucketFromLabel('')).toBeNull()
    // The whole reason this is not the import parser: an unreadable label is
    // not a claim that the company is small. The caller turns null into
    // UNKNOWN and reports it, and the upsert's CASE carves UNKNOWN out of
    // clearing next_salary_report_due_at on that strength.
    expect(bucketFromLabel('óskilgreint')).toBeNull()
    expect(bucketFromLabel('n/a')).toBeNull()
  })
})

describe('normalizeIsatCode', () => {
  // The rule that matters: the same four digits mean two different real
  // industries depending on whether the cell carried a dot.
  it('pads plain digits left and dotted codes right', () => {
    expect(normalizeIsatCode('1071')).toBe('01071')
    expect(normalizeIsatCode('10.71')).toBe('10710')
  })

  it('leaves an already-normalized code alone in either form', () => {
    expect(normalizeIsatCode('01110')).toBe('01110')
    expect(normalizeIsatCode('10.71.0')).toBe('10710')
  })

  it('returns null when there is nothing to normalize', () => {
    expect(normalizeIsatCode(null)).toBeNull()
    expect(normalizeIsatCode('')).toBeNull()
    expect(normalizeIsatCode('engin')).toBeNull()
  })

  it('hands back an over-long value so the caller can report it', () => {
    expect(normalizeIsatCode('123456')).toBe('123456')
  })
})

/**
 * Pins the one branch of the upsert that can destroy live data on a re-run.
 *
 * `next_salary_report_due_at` is cleared when the register states a size below
 * LARGE. UNKNOWN is not such a statement — it is "we could not read the
 * bucket" — so an earlier `<> 'LARGE'` let one blank stærðarflokkur cell in a
 * later export null out a deadline `advanceCompanyReportDueDate` had written
 * after a real approval. A string assertion is thin, but this clause has no
 * cheaper home: the alternative is a live Postgres, and the regression is a
 * single operator.
 */
describe('COMPANY_ON_CONFLICT', () => {
  it('does not clear the salary deadline on an unreadable size', () => {
    expect(COMPANY_ON_CONFLICT).toContain(
      "EXCLUDED.employee_count_category NOT IN ('LARGE', 'UNKNOWN')",
    )
    expect(COMPANY_ON_CONFLICT).not.toContain(
      "EXCLUDED.employee_count_category <> 'LARGE'",
    )
  })

  it('still lets an admin override outrank the clearing', () => {
    expect(COMPANY_ON_CONFLICT).toContain(
      'company.salary_report_required_override IS NOT TRUE',
    )
  })

  it('reads sector_override but never assigns it', () => {
    // It means "an admin corrected this in the admin UI". Setting it here made
    // a re-run silently revert those corrections — the exact thing the column
    // exists to prevent.
    expect(COMPANY_ON_CONFLICT).toContain('WHEN company.sector_override THEN')
    expect(COMPANY_ON_CONFLICT).not.toMatch(/^\s*sector_override\s*=/m)
  })
})
