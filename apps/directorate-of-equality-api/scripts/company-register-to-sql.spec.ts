import * as ExcelJS from 'exceljs'

import { readDay } from './company-register-to-sql'

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
      s.getCell('A1').value = {
        formula: 'B1',
        result: DUE,
        shareType: 'shared',
        ref: 'A1:A2',
      }
      s.getCell('A2').value = { sharedFormula: 'A1', result: DUE }
    })

    // The shapes the readers actually have to cope with. Asserted rather than
    // assumed, so an exceljs upgrade that changes them fails here and not in a
    // silently short load.
    expect(Object.keys(sheet.getCell('A1').value as object)).toContain('formula')
    const slave = sheet.getCell('A2').value as object
    expect(Object.keys(slave)).toContain('sharedFormula')
    expect(Object.keys(slave)).not.toContain('formula')

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

  it('reads a shared-formula slave holding text rather than a date', async () => {
    const sheet = await roundTrip((s) => {
      s.getCell('A1').value = {
        formula: 'B1',
        result: '31.12.2027',
        shareType: 'shared',
        ref: 'A1:A2',
      }
      s.getCell('A2').value = { sharedFormula: 'A1', result: '31.12.2027' }
    })

    expect(readDay(sheet.getCell('A2'))).toEqual({
      year: 2027,
      month: 12,
      day: 31,
    })
  })
})
