import * as ExcelJS from 'exceljs'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const generator = require('./refresh-sub-criterion-catalog.js')

const {
  SHEET,
  HEADER_ROW,
  FIRST_DATA_ROW,
  SCALE_ROW,
  MAX_STEPS,
  COLS,
  SCALE_MARKER,
  assertLayout,
  extract,
  extractGeneralScale,
  readSteps,
  render,
} = generator

/**
 * Exercises the generator's rejection paths.
 *
 * The generator exists so a bad workbook fails at generation time instead of
 * shipping a subtly wrong catalog to the application portal, which makes its
 * validation layer the whole point of the file — and every throw below is
 * unreachable from the committed `template.xlsx`, which satisfies all of them.
 * The formula guard in particular can never fire on the real sheet (it has no
 * formula cells), so without these fixtures it would be entirely unexercised
 * code.
 *
 * Workbooks are built in memory rather than committed as fixtures: the defect
 * under test is then visible in the test itself, and there is no binary to keep
 * in step with the real template.
 */

/** A sheet the generator accepts: two entries, headers, marker, generic scale. */
const validSheet = (): ExcelJS.Worksheet => {
  const sheet = new ExcelJS.Workbook().addWorksheet(SHEET)

  sheet.getCell(SCALE_ROW, COLS.numSteps).value = SCALE_MARKER
  sheet.getCell(SCALE_ROW, COLS.firstStep).value = 'Aldrei, engin'
  sheet.getCell(SCALE_ROW, COLS.firstStep + 1).value = 'Stundum, nokkuð'

  sheet.getCell(HEADER_ROW, COLS.parent).value = 'Yfirviðmið'
  sheet.getCell(HEADER_ROW, COLS.title).value = 'Undirviðmið'
  sheet.getCell(HEADER_ROW, COLS.description).value = 'Skilgreining'
  sheet.getCell(HEADER_ROW, COLS.numSteps).value = 'Fjöldi þrepa'
  for (let step = 1; step <= MAX_STEPS; step++) {
    sheet.getCell(HEADER_ROW, COLS.firstStep + step - 1).value = `Þrep ${step}`
  }

  // Job-based entry with a declared, fixed step scale.
  sheet.getCell(FIRST_DATA_ROW, COLS.parent).value = 'Hæfni'
  sheet.getCell(FIRST_DATA_ROW, COLS.title).value = 'Formleg menntun'
  sheet.getCell(FIRST_DATA_ROW, COLS.description).value = 'Starf krefst náms.'
  sheet.getCell(FIRST_DATA_ROW, COLS.numSteps).value = 3
  sheet.getCell(FIRST_DATA_ROW, COLS.firstStep).value = 'Þrep eitt'
  sheet.getCell(FIRST_DATA_ROW, COLS.firstStep + 1).value = 'Þrep tvö'
  sheet.getCell(FIRST_DATA_ROW, COLS.firstStep + 2).value = 'Þrep þrjú'

  // Personal entry the employer finishes: no step count, step 1 only.
  sheet.getCell(FIRST_DATA_ROW + 1, COLS.parent).value = 'Frammistöðumat'
  sheet.getCell(FIRST_DATA_ROW + 1, COLS.title).value = 'Sjálfstæði'
  sheet.getCell(FIRST_DATA_ROW + 1, COLS.description).value = 'Metið árlega.'
  sheet.getCell(FIRST_DATA_ROW + 1, COLS.firstStep).value = 'Þrep eitt'

  return sheet
}

/** Runs the generator's full read over a sheet, in the order `main` does. */
const run = (sheet: ExcelJS.Worksheet) => {
  assertLayout(sheet)
  return {
    entries: extract(sheet),
    generalScale: extractGeneralScale(sheet),
  }
}

describe('sub-criterion catalog generator', () => {
  it('accepts a well-formed sheet', () => {
    const { entries, generalScale } = run(validSheet())

    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      criterionType: 'COMPETENCE',
      parentTitle: 'Hæfni',
      title: 'Formleg menntun',
      description: 'Starf krefst náms.',
      numSteps: 3,
      steps: ['Þrep eitt', 'Þrep tvö', 'Þrep þrjú'],
    })
    // Blank Fjöldi þrepa stays null — the employer authors the rest.
    expect(entries[1].numSteps).toBeNull()
    expect(entries[1].criterionType).toBe('PERSONAL')
    expect(generalScale).toEqual(['Aldrei, engin', 'Stundum, nokkuð'])
  })

  describe('layout', () => {
    it('rejects a renamed header', () => {
      const sheet = validSheet()
      sheet.getCell(HEADER_ROW, COLS.description).value = 'Lýsing'

      // Two assertions rather than one dotAll pattern: the `s` flag needs an
      // es2018 target, which this project's spec tsconfig does not set.
      expect(() => run(sheet)).toThrow(/Unexpected .* layout/)
      expect(() => run(sheet)).toThrow(/D5 is "Lýsing"/)
    })

    it('rejects an inserted column, naming every shifted header', () => {
      const sheet = validSheet()
      sheet.spliceColumns(COLS.title, 0, [])

      expect(() => run(sheet)).toThrow(
        /a column was inserted, removed or renamed/,
      )
    })

    it('rejects a moved generic-scale marker', () => {
      const sheet = validSheet()
      sheet.getCell(SCALE_ROW, COLS.numSteps).value = null

      expect(() => run(sheet)).toThrow(/generic step scale is not where it was/)
    })
  })

  describe('rows', () => {
    it('rejects an unrecognised Yfirviðmið instead of calling it PERSONAL', () => {
      // The original defect: a `?? 'PERSONAL'` fallback mis-grouped a renamed
      // job-based section in the portal with nothing to catch it.
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.parent).value = 'Nýtt yfirviðmið'

      expect(() => run(sheet)).toThrow(
        /unrecognised Yfirviðmið "Nýtt yfirviðmið"/,
      )
    })

    it('rejects a missing Skilgreining', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value = null

      expect(() => run(sheet)).toThrow(/has no Skilgreining/)
    })

    it('rejects a half-filled row rather than skipping it', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.title).value = null

      expect(() => run(sheet)).toThrow(
        /fills only one of Yfirviðmið \/ Undirviðmið/,
      )
    })

    it('skips a wholly blank row', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW + 1, COLS.parent).value = null
      sheet.getCell(FIRST_DATA_ROW + 1, COLS.title).value = null

      expect(run(sheet).entries).toHaveLength(1)
    })

    it('rejects a gap in the step columns', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.firstStep + 1).value = null

      expect(() => run(sheet)).toThrow(
        /leaves G6 blank but fills a later Þrep column/,
      )
    })

    it('rejects a non-integer Fjöldi þrepa', () => {
      // Would otherwise read as blank and reclassify a fixed-scale entry as
      // employer-authored.
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.numSteps).value = '5 þrep'

      expect(() => run(sheet)).toThrow(/non-integer Fjöldi þrepa \("5 þrep"\)/)
    })

    it('rejects a Fjöldi þrepa that disagrees with the wording shipped', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.numSteps).value = 7

      expect(() => run(sheet)).toThrow(
        /declares 7 steps but has 3 descriptions/,
      )
    })

    it('rejects a sheet with no data rows instead of writing an empty catalog', () => {
      const sheet = validSheet()
      for (const row of [FIRST_DATA_ROW, FIRST_DATA_ROW + 1]) {
        sheet.getCell(row, COLS.parent).value = null
        sheet.getCell(row, COLS.title).value = null
      }

      expect(() => run(sheet)).toThrow(/Read 0 entries/)
    })
  })

  describe('cell reading', () => {
    it('rejects a formula whose cached result Excel never wrote', () => {
      // Unreachable from the committed template — it has no formula cells — so
      // this is the only thing exercising the guard.
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value = {
        formula: 'A1',
      } as ExcelJS.CellFormulaValue

      expect(() => run(sheet)).toThrow(/formula with no cached result/)
    })

    it('reads a formula that does carry a cached result', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value = {
        formula: 'A1',
        result: 'Starf krefst náms.',
      } as ExcelJS.CellFormulaValue

      expect(run(sheet).entries[0].description).toBe('Starf krefst náms.')
    })

    it('flattens rich text', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value = {
        richText: [{ text: 'Starf ' }, { text: 'krefst náms.' }],
      }

      expect(run(sheet).entries[0].description).toBe('Starf krefst náms.')
    })

    it.each([
      ['U+2028 line separator', ' ', '2028'],
      ['U+200B zero-width space', '​', '200B'],
      ['a C0 control character', '', '0001'],
    ])('rejects %s pasted into a cell', (_label, char, code) => {
      // `JSON.stringify` emits all of these verbatim, so they would land in the
      // generated source and the API response invisibly.
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value =
        `Starf${char} krefst náms.`

      expect(() => run(sheet)).toThrow(
        new RegExp(`invisible character U\\+${code}`),
      )
    })

    it('keeps a tab, which is legitimate whitespace', () => {
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value = 'Starf\tkrefst.'

      expect(run(sheet).entries[0].description).toBe('Starf\tkrefst.')
    })
  })

  describe('emitted source', () => {
    // The generated file is the actual artifact — the layout guards above only
    // protect what feeds it. Nothing else asserts the shape that reaches the API.
    const emit = (sheet: ExcelJS.Worksheet) => {
      const { entries, generalScale } = run(sheet)
      return render(entries, generalScale, 'template.xlsx')
    }

    it('emits the enum reference, not a string literal, for criterionType', () => {
      // The data file imports ReportCriterionTypeEnum; emitting 'COMPETENCE' as a
      // string would still typecheck against `criterionType` and silently widen it.
      expect(emit(validSheet())).toContain(
        'criterionType: ReportCriterionTypeEnum.COMPETENCE',
      )
    })

    it('emits a bare null for an employer-authored step count', () => {
      // `numSteps: null` is meaningful (the employer authors the rest), and it must
      // not be quoted or omitted.
      expect(emit(validSheet())).toContain('numSteps: null,')
    })

    it('emits steps in order, and the generic scale', () => {
      // Literals are double-quoted here: `quote` is `JSON.stringify`, and the
      // project's single-quote style is applied by the prettier pass in `main`.
      // That split is what makes the committed file byte-stable.
      const source = emit(validSheet())

      expect(source).toContain('"Þrep eitt",')
      expect(source.indexOf('"Þrep eitt"')).toBeLessThan(
        source.indexOf('"Þrep tvö"'),
      )
      expect(source).toContain('SUB_CRITERION_GENERAL_SCALE')
      expect(source).toContain('"Aldrei, engin",')
    })

    it('escapes a quote and a newline rather than breaking the literal', () => {
      // The hand-rolled escaping this replaced emitted a raw newline, which made
      // prettier fail on generated source instead of naming the cell.
      const sheet = validSheet()
      sheet.getCell(FIRST_DATA_ROW, COLS.description).value =
        'Starf "krefst"\nnáms.'

      const source = emit(sheet)
      // Escaped, not raw: a literal newline inside the literal made prettier
      // abort on generated source instead of naming the offending cell.
      expect(source).toContain(String.raw`\n`)
      expect(source).toContain(String.raw`\"krefst\"`)
      expect(source).not.toMatch(/description: "[^"\n]*\n/)
    })
  })

  describe('readSteps', () => {
    it('rejects a row with no step descriptions at all', () => {
      const sheet = validSheet()
      for (let step = 0; step < MAX_STEPS; step++) {
        sheet.getCell(FIRST_DATA_ROW, COLS.firstStep + step).value = null
      }

      expect(() => readSteps(sheet, FIRST_DATA_ROW, 'Formleg menntun')).toThrow(
        /has no step descriptions/,
      )
    })
  })

  describe('generic step scale', () => {
    it('rejects an empty scale row', () => {
      const sheet = validSheet()
      sheet.getCell(SCALE_ROW, COLS.firstStep).value = null
      sheet.getCell(SCALE_ROW, COLS.firstStep + 1).value = null

      expect(() => run(sheet)).toThrow(/Read no generic step scale/)
    })

    it('rejects a gap in the scale row rather than truncating it', () => {
      // The bug `readSteps` was rewritten to reject, which this path used to
      // keep: `generalScale` is the only wording the null-numSteps entries get.
      const sheet = validSheet()
      sheet.getCell(SCALE_ROW, COLS.firstStep + 2).value = 'Mjög mikið'
      sheet.getCell(SCALE_ROW, COLS.firstStep + 1).value = null

      expect(() => run(sheet)).toThrow(
        /generic step scale on row 4 leaves G4 blank/,
      )
    })
  })
})
