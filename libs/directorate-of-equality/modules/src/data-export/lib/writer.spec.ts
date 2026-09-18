import ExcelJS from 'exceljs'

import type { ExportColumn } from './columns'
import { writeCsv, writeXlsx } from './writer'

type Row = { name: string; count: number | null; due: Date | null }

const columns: ExportColumn<Row>[] = [
  { header: 'Nafn', value: (r) => r.name },
  { header: 'Fjöldi', value: (r) => r.count },
  { header: 'Skiladagur', value: (r) => r.due },
]

const metadata = {
  title: 'Fyrirtæki',
  generatedAt: new Date('2026-09-18T10:00:00Z'),
  rowCount: 1,
  filters: ['Starfsmannafjöldi: 25–49, 50+'],
}

describe('writeCsv', () => {
  it('starts with a BOM so Excel reads it as UTF-8', () => {
    // Without this every Icelandic character in the file arrives mangled.
    const csv = writeCsv([], columns).toString('utf8')

    expect(csv.startsWith('﻿')).toBe(true)
  })

  it('writes a header row even with no data', () => {
    const csv = writeCsv([], columns).toString('utf8')

    expect(csv).toBe('﻿Nafn,Fjöldi,Skiladagur\r\n')
  })

  it('leaves a null cell empty rather than writing "null" or 0', () => {
    // A company with no due date has no due date. `0` would read as the epoch
    // and "null" would read as a value.
    const csv = writeCsv(
      [{ name: 'A', count: null, due: null }],
      columns,
    ).toString('utf8')

    expect(csv.split('\r\n')[1]).toBe('A,,')
  })

  it('keeps zero, which is a real count', () => {
    const csv = writeCsv(
      [{ name: 'A', count: 0, due: null }],
      columns,
    ).toString('utf8')

    expect(csv.split('\r\n')[1]).toBe('A,0,')
  })

  it('quotes and escapes a value that would otherwise break the row', () => {
    const csv = writeCsv(
      [{ name: 'Nafn, ehf. "gamla"', count: 1, due: null }],
      columns,
    ).toString('utf8')

    expect(csv.split('\r\n')[1]).toBe('"Nafn, ehf. ""gamla""",1,')
  })

  it('does not let a newline in a value split the row', () => {
    const csv = writeCsv(
      [{ name: 'A\nB', count: 1, due: null }],
      columns,
    ).toString('utf8')

    // Still exactly one data row: header, data, trailing empty.
    expect(csv.replace(/"[^"]*"/g, 'X').split('\r\n')).toHaveLength(3)
  })

  it('writes dates as ISO days, not locale strings', () => {
    const csv = writeCsv(
      [{ name: 'A', count: 1, due: new Date('2028-03-31T00:00:00Z') }],
      columns,
    ).toString('utf8')

    expect(csv.split('\r\n')[1]).toBe('A,1,2028-03-31')
  })
})

describe('writeXlsx', () => {
  const read = async (buffer: Buffer) => {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as never)
    return workbook
  }

  it('writes the data sheet plus the provenance sheet', async () => {
    const workbook = await read(
      await writeXlsx([{ name: 'A', count: 1, due: null }], columns, metadata),
    )

    // An export with no record of the filter behind it cannot be reproduced.
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'Fyrirtæki',
      'Um útdráttinn',
    ])
  })

  it('puts the headers in column order and freezes them', async () => {
    const workbook = await read(
      await writeXlsx([{ name: 'A', count: 1, due: null }], columns, metadata),
    )
    const sheet = workbook.worksheets[0]

    expect(sheet.getRow(1).values).toEqual([
      undefined,
      'Nafn',
      'Fjöldi',
      'Skiladagur',
    ])
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 })
  })

  it('keeps a date as a real date cell so it sorts as one', async () => {
    const due = new Date('2028-03-31T00:00:00Z')
    const workbook = await read(
      await writeXlsx([{ name: 'A', count: 1, due }], columns, metadata),
    )

    const cell = workbook.worksheets[0].getRow(2).getCell(3)
    expect(cell.value).toBeInstanceOf(Date)
    expect(cell.numFmt).toBe('dd.mm.yyyy')
  })

  it('records the filter that produced the file', async () => {
    const workbook = await read(await writeXlsx([], columns, metadata))
    const about = workbook.getWorksheet('Um útdráttinn')

    const text = JSON.stringify(about?.getSheetValues())
    expect(text).toContain('Starfsmannafjöldi: 25–49, 50+')
  })

  it('says so explicitly when no filter was applied', async () => {
    // A blank "Síur" section reads as "the filter was not recorded", which is
    // a different claim from "there was no filter".
    const workbook = await read(
      await writeXlsx([], columns, { ...metadata, filters: [] }),
    )

    const text = JSON.stringify(
      workbook.getWorksheet('Um útdráttinn')?.getSheetValues(),
    )
    expect(text).toContain('Engar síur')
  })

  it('folds a sheet name Excel would reject', async () => {
    const workbook = await read(
      await writeXlsx([], columns, {
        ...metadata,
        title: 'Skýrslur / launagreining [2026] — allt saman og meira til',
      }),
    )

    const name = workbook.worksheets[0].name
    expect(name.length).toBeLessThanOrEqual(31)
    expect(name).not.toMatch(/[[\]:*?/\\]/)
  })
})
