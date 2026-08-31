/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ExcelJS from 'exceljs'
import JSZip from 'jszip'

import { BadRequestException } from '@nestjs/common'

import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { ParsedReportDto } from '../dto/parsed-report.dto'
import { TEMPLATE_BASE64 } from '../template-data'
import { parseWorkbook } from './workbook.parser'

// CI runs this project's tests concurrently with several other Nx projects on
// shared CPU, and exceljs's xlsx generation/parsing is heavy enough to
// occasionally exceed Jest's 5000ms default under that contention (surfaces
// as "Exceeded timeout... for a hook/test" even though nothing is actually
// hanging). Same underlying full-suite-load sensitivity as the corrupted-zip
// issue `serialize()` retries below, different symptom.
jest.setTimeout(20000)

const templateBuffer = () => Buffer.from(TEMPLATE_BASE64, 'base64')

/**
 * A Node `Buffer` may be a view into a larger shared pool, so `.buffer` alone
 * can hand exceljs bytes beyond this buffer's own region. Slice to the exact
 * range — same guard the parser applies (see `parseWorkbook`). Passing the raw
 * `.buffer` intermittently corrupts the load under full-suite memory pressure.
 */
const toArrayBuffer = (buf: Buffer): ArrayBuffer =>
  buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer

const loadTemplate = async (): Promise<ExcelJS.Workbook> => {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(toArrayBuffer(templateBuffer()))
  return wb
}

/** xlsx is a zip; every valid file starts with the local-file-header magic `PK\x03\x04`. */
const isValidXlsx = (buf: Buffer): boolean =>
  buf.length > 4 &&
  buf[0] === 0x50 &&
  buf[1] === 0x4b &&
  buf[2] === 0x03 &&
  buf[3] === 0x04

type WorksheetModelWithTables = ExcelJS.Worksheet['model'] & {
  tables?: Array<{ style?: ExcelJS.TableStyleProperties | null }>
}

const normaliseTableStylesForExcelJsWrite = (wb: ExcelJS.Workbook): void => {
  for (const ws of wb.worksheets) {
    // exceljs can load table XML with `style: null`, but its writer assumes a
    // style object and crashes when tests re-serialize the template. The
    // nullable table list is an internal model detail, so keep the cast narrow.
    const tables = (ws.model as WorksheetModelWithTables).tables ?? []
    for (const table of tables) {
      table.style ??= {
        showFirstColumn: false,
        showLastColumn: false,
        showRowStripes: false,
        showColumnStripes: false,
      }
    }
  }
}

/**
 * exceljs's `writeBuffer()` occasionally emits a truncated/empty zip under the
 * parallelised full-suite run (surfaces as "Corrupted zip: expected N records,
 * got 0" on the subsequent load). It's non-deterministic and re-serialising
 * fixes it, so validate the output and retry a couple of times before giving up.
 */
const serialize = async (wb: ExcelJS.Workbook): Promise<Buffer> => {
  normaliseTableStylesForExcelJsWrite(wb)
  for (let attempt = 0; attempt < 3; attempt++) {
    const buf = Buffer.from(
      (await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer,
    )
    if (isValidXlsx(buf)) return buf
  }
  throw new Error(
    'exceljs writeBuffer produced an invalid xlsx after 3 attempts',
  )
}

const writeEmployeeRow = (
  wb: ExcelJS.Workbook,
  ordinal: number,
  values: {
    name: string
    role: string
    gender: string
    paidHours: number
    baseSalary: number
    additionalFixedOvertime: number | null
    additionalFixedCarAllowance: number | null
    bonusOccasionalCarAllowance: number | null
    bonusOccasionalOvertime: number | null
    bonusPayments: number | null
    bonusOther: number | null
    field: string
    department: string
    startDate: Date
  },
) => {
  const s = wb.getWorksheet('Launagögn')!
  const r = 5 + ordinal
  s.getCell(`A${r}`).value = ordinal
  s.getCell(`B${r}`).value = values.name
  s.getCell(`C${r}`).value = values.role
  s.getCell(`D${r}`).value = values.gender
  s.getCell(`E${r}`).value = values.paidHours
  s.getCell(`F${r}`).value = values.field
  s.getCell(`G${r}`).value = values.department
  s.getCell(`H${r}`).value = values.startDate
  s.getCell(`I${r}`).value = values.baseSalary
  s.getCell(`J${r}`).value = values.additionalFixedOvertime
  s.getCell(`K${r}`).value = values.additionalFixedCarAllowance
  s.getCell(`L${r}`).value = values.bonusOccasionalCarAllowance
  s.getCell(`M${r}`).value = values.bonusOccasionalOvertime
  s.getCell(`N${r}`).value = values.bonusPayments
  s.getCell(`O${r}`).value = values.bonusOther
}

// Step-order inputs sit on every SECOND column (score column interleaved after
// each): role rows start at row 11 and job-sub columns start at G (col 7);
// employee rows start at row 11 and personal-sub columns start at F (col 6).
// Written by numeric coordinate so helpers follow the named-range geometry
// (`ROLE_STEP_INPUTS` = Starfsmat!G11:GX110, `EMP_STEP_INPUTS` =
// Einstaklingsmat!F11:BC510).
const fillRoleClassification = (
  wb: ExcelJS.Workbook,
  rolesInOrder: number[][],
) => {
  const sheet = wb.getWorksheet('Starfsmat')!
  rolesInOrder.forEach((roleSteps, roleIdx) => {
    roleSteps.forEach((stepOrder, subIdx) => {
      sheet.getCell(11 + roleIdx, 7 + 2 * subIdx).value = stepOrder
    })
  })
}

const fillEmployeeClassification = (
  wb: ExcelJS.Workbook,
  empsInOrder: number[][],
) => {
  const sheet = wb.getWorksheet('Einstaklingsmat')!
  empsInOrder.forEach((empSteps, empIdx) => {
    empSteps.forEach((stepOrder, subIdx) => {
      sheet.getCell(11 + empIdx, 6 + 2 * subIdx).value = stepOrder
    })
  })
}

/**
 * The bundled template ships with empty weights and no selected subcriteria.
 * Tests fill the required rows explicitly so they do not depend on catalog
 * lookup formula caches.
 */
const setCriterionWeight = (
  wb: ExcelJS.Workbook,
  viðmiðRow: number,
  weightPct: number,
) => {
  wb.getWorksheet('Viðmið')!.getCell(`E${viðmiðRow}`).value = weightPct
}

const addPersonalCriterion = (
  wb: ExcelJS.Workbook,
  viðmiðRow: number,
  title: string,
  weightPct: number,
) => {
  const s = wb.getWorksheet('Viðmið')!
  s.getCell(`C${viðmiðRow}`).value = title
  s.getCell(`D${viðmiðRow}`).value = `${title} description`
  s.getCell(`E${viðmiðRow}`).value = weightPct
}

const addSubCriterion = (
  wb: ExcelJS.Workbook,
  undirviðmiðRow: number,
  parentTitle: string,
  subTitle: string,
  weightPct: number,
  stepDescriptions: string[],
  /**
   * `Fjöldi þrepa` as DECLARED in column G. Defaults to the number of
   * descriptions written, which is the consistent case; pass a different
   * value to exercise the step bound, which reads column G rather than
   * counting descriptions (matching `Starfsmat!G$8`'s own validation).
   */
  declaredNumSteps: number = stepDescriptions.length,
) => {
  const s = wb.getWorksheet('Undirviðmið')!
  s.getCell(`B${undirviðmiðRow}`).value = parentTitle
  s.getCell(`C${undirviðmiðRow}`).value = subTitle
  // D is the computed `Tegund (sjálfvirkt)` column — deliberately not written.
  // E/F/G are Skilgreining / Vægi (%) / Fjöldi þrepa.
  s.getCell(`E${undirviðmiðRow}`).value = `${subTitle} description`
  s.getCell(`F${undirviðmiðRow}`).value = weightPct
  s.getCell(`G${undirviðmiðRow}`).value = declaredNumSteps
  // Step descriptions live in columns J…Q (Þrep 1…8). Col index 10 = J.
  stepDescriptions.forEach((desc, i) => {
    s.getCell(undirviðmiðRow, 10 + i).value = desc
  })
}

const FIVE_STEPS = ['Lágt', 'Frekar lágt', 'Miðlungs', 'Hátt', 'Mjög hátt']
const JOB_SUB_COUNT = 4

const fillCriteriaAndSubCriteria = (wb: ExcelJS.Workbook) => {
  setCriterionWeight(wb, 6, 30)
  setCriterionWeight(wb, 7, 20)
  setCriterionWeight(wb, 8, 20)
  setCriterionWeight(wb, 9, 20)
  addPersonalCriterion(wb, 10, 'Sérhæfing', 10)

  addSubCriterion(wb, 6, 'Ábyrgð', 'Ábyrgð á gæðum', 30, FIVE_STEPS)
  addSubCriterion(wb, 7, 'Álag', 'Álag í starfi', 20, FIVE_STEPS)
  addSubCriterion(wb, 8, 'Vinnuaðstæður', 'Vinnuumhverfi', 20, FIVE_STEPS)
  addSubCriterion(wb, 9, 'Hæfni', 'Formleg menntun', 20, FIVE_STEPS)
  addSubCriterion(wb, 10, 'Sérhæfing', 'Tungumál', 10, FIVE_STEPS)
}

const expectBadRequest = async (
  promise: Promise<unknown>,
): Promise<{
  message: string
  errors: {
    message: string
    sheet: string
    row: number | null
    column: string | null
  }[]
}> => {
  await expect(promise).rejects.toBeInstanceOf(BadRequestException)
  try {
    await promise
  } catch (e) {
    return (e as BadRequestException).getResponse() as {
      message: string
      errors: {
        message: string
        sheet: string
        row: number | null
        column: string | null
      }[]
    }
  }
  throw new Error('unreachable')
}

const buildValidFilled = async (): Promise<Buffer> => {
  const wb = await loadTemplate()
  writeEmployeeRow(wb, 1, {
    name: 'Nafn 1',
    role: 'Forstöðumaður',
    gender: 'Kona',
    paidHours: 173.33,
    baseSalary: 900000,
    additionalFixedOvertime: 100000,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: 50000,
    bonusOther: null,
    field: 'Stjórnun',
    department: 'Framkvæmd',
    startDate: new Date('2023-01-01'),
  })
  writeEmployeeRow(wb, 2, {
    name: 'Nafn 2',
    role: 'Sérfræðingur',
    gender: 'Karl',
    paidHours: 173.33,
    baseSalary: 700000,
    additionalFixedOvertime: 50000,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: null,
    bonusOther: null,
    field: 'Tækni',
    department: 'Tækni',
    startDate: new Date('2023-06-01'),
  })
  writeEmployeeRow(wb, 3, {
    name: 'Nafn 3',
    role: 'Verkstjóri',
    gender: 'Kona',
    paidHours: 173.33,
    baseSalary: 600000,
    additionalFixedOvertime: 40000,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: 10000,
    bonusOther: null,
    field: 'Rekstur',
    department: 'Verkstæði',
    startDate: new Date('2022-03-15'),
  })

  fillCriteriaAndSubCriteria(wb)

  // Template fixture has 4 job-based sub-criteria; 3 distinct roles.
  fillRoleClassification(wb, [
    [3, 3, 3, 3], // Forstöðumaður
    [2, 2, 2, 2], // Sérfræðingur
    [1, 1, 1, 1], // Verkstjóri
  ])
  // 1 personal sub-criterion, 3 employees.
  fillEmployeeClassification(wb, [[1], [3], [5]])

  return serialize(wb)
}

describe('parseWorkbook', () => {
  describe('empty template', () => {
    it('rejects with weight-sum + minimum-population errors', async () => {
      // Empty template ships with 4 job-based criteria, empty weights, and no
      // selected subcriteria. Weight validation catches the incomplete state.
      const { errors } = await expectBadRequest(parseWorkbook(templateBuffer()))
      const messages = errors.map((e) => e.message)
      expect(messages).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Vægi viðmiða leggst saman í 0%'),
          expect.stringContaining('Vægi undirviðmiða leggst saman í 0%'),
          'Að minnsta kosti eitt starf er nauðsynlegt',
          'Að minnsta kosti einn starfsmaður er nauðsynlegur',
        ]),
      )
    })
  })

  describe('filled + valid template', () => {
    let report: ParsedReportDto

    beforeAll(async () => {
      const buf = await buildValidFilled()
      report = await parseWorkbook(buf)
    })

    it('parses all 5 criteria (4 mandatory + 1 employer-added personal)', () => {
      expect(report.criteria).toHaveLength(5)
      const types = report.criteria.map((c) => c.type).sort()
      expect(types).toEqual(
        [
          ReportCriterionTypeEnum.RESPONSIBILITY,
          ReportCriterionTypeEnum.STRAIN,
          ReportCriterionTypeEnum.CONDITION,
          ReportCriterionTypeEnum.COMPETENCE,
          ReportCriterionTypeEnum.PERSONAL,
        ].sort(),
      )
    })

    it('computes step scores linearly: stepOrder/numSteps × weight × 10', () => {
      // Ábyrgð á gæðum: 30% weight, 5 steps → step 1 = 60, step 5 = 300
      const resp = report.criteria.find(
        (c) => c.type === ReportCriterionTypeEnum.RESPONSIBILITY,
      )
      const sub = resp?.subCriteria.find((s) => s.title === 'Ábyrgð á gæðum')
      expect(sub?.steps.map((s) => Math.round(s.score))).toEqual([
        60, 120, 180, 240, 300,
      ])
    })

    it('derives 3 distinct roles from Launagögn in first-appearance order', () => {
      expect(report.roles.map((r) => r.title)).toEqual([
        'Forstöðumaður',
        'Sérfræðingur',
        'Verkstjóri',
      ])
    })

    it('attaches a job-based step assignment per role per job-based sub', () => {
      const role = report.roles.find((r) => r.title === 'Forstöðumaður')
      expect(role?.stepAssignments.every((a) => a.stepOrder === 3)).toBe(true)
      expect(role?.stepAssignments).toHaveLength(JOB_SUB_COUNT)
    })

    it('parses employees with Icelandic → enum translation + paidHours preserved as 0…1', () => {
      const emp = report.employees.find((e) => e.ordinal === 3)
      expect(emp).toEqual(
        expect.objectContaining({
          ordinal: 3,
          roleTitle: 'Verkstjóri',
          gender: GenderEnum.FEMALE,
          paidHours: 173.33,
          baseSalary: 600000,
          startDate: '2022-03-15',
        }),
      )
    })

    it('does NOT include employee names (PII stripped)', () => {
      const serialized = JSON.stringify(report.employees)
      expect(serialized).not.toMatch(/Nafn [123]/)
    })

    it('attaches 1 personal step assignment per employee (one personal sub defined)', () => {
      report.employees.forEach((e) => {
        expect(e.personalStepAssignments).toHaveLength(1)
      })
    })

    it('assigns each employee a pseudonymous identifier, same prefix across the import', () => {
      const identifiers = report.employees.map((e) => e.identifier)
      identifiers.forEach((id) => expect(id).toMatch(/^[A-Z]{3}-\d{3,}$/))
      const prefixes = new Set(identifiers.map((id) => id.slice(0, 3)))
      expect(prefixes.size).toBe(1)
      // Ordinal portion matches the employee's ordinal
      report.employees.forEach((e) => {
        expect(e.identifier.endsWith(String(e.ordinal).padStart(3, '0'))).toBe(
          true,
        )
      })
    })

    it('reads cached formula results from Undirviðmið autofill cells', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'A',
        role: 'R',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)

      const s = wb.getWorksheet('Undirviðmið')!
      s.getCell('E6').value = {
        formula: 'CATALOG_DESC()',
        result: 'Cached description',
      } as ExcelJS.CellValue
      s.getCell('G6').value = {
        formula: 'CATALOG_STEPS()',
        result: 2,
      } as ExcelJS.CellValue
      s.getCell('J6').value = {
        formula: 'CATALOG_STEP_1()',
        result: 'Cached step 1',
      } as ExcelJS.CellValue
      s.getCell('K6').value = {
        formula: 'CATALOG_STEP_2()',
        result: 'Cached step 2',
      } as ExcelJS.CellValue

      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const formulaReport = await parseWorkbook(await serialize(wb))
      const resp = formulaReport.criteria.find(
        (c) => c.type === ReportCriterionTypeEnum.RESPONSIBILITY,
      )
      const sub = resp?.subCriteria.find((s) => s.title === 'Ábyrgð á gæðum')

      expect(sub?.description).toBe('Cached description')
      expect(sub?.steps.map((step) => step.description)).toEqual([
        'Cached step 1',
        'Cached step 2',
      ])
    })

    it('rejects Undirviðmið formulas without cached results with an exact cell location', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'A',
        role: 'R',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)

      const s = wb.getWorksheet('Undirviðmið')!
      s.getCell('F6').value = {
        formula: 'CATALOG_STEPS()',
      } as ExcelJS.CellValue

      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sheet: 'Undirviðmið',
            row: 6,
            column: 'F',
            message: expect.stringContaining('formúlu án reiknaðs gildis'),
          }),
        ]),
      )
    })
  })

  describe('ordinal derivation (column A is a formula in the real template)', () => {
    it('derives ordinal from row position, ignoring the =ROW()-5 formula in column A', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'A',
        role: 'R',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      writeEmployeeRow(wb, 2, {
        name: 'B',
        role: 'R',
        gender: 'Karl',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })

      // Mirror the shipped template: column A holds the auto-numbering formula,
      // NOT a literal. Before the row-position fix this made every non-empty
      // row fail with "Raðnúmer vantar".
      const s = wb.getWorksheet('Launagögn')!
      s.getCell('A6').value = { formula: 'ROW()-5', result: 1 }
      s.getCell('A7').value = { formula: 'ROW()-5', result: 2 }

      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1], [1]])

      const report = await parseWorkbook(await serialize(wb))

      // Row 6 → ordinal 1, row 7 → ordinal 2 (matches the sheet's "#" column).
      expect(report.employees.map((e) => e.ordinal)).toEqual([1, 2])
    })
  })

  describe('inflated rowCount (whole-column formatting)', () => {
    it('stays bounded and parses correctly when a stray far-down cell inflates sheet.rowCount', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'A',
        role: 'R',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })

      // Simulate what whole-column formatting does to a hand-edited file: a
      // stray value far below the data pushes sheet.rowCount into the tens of
      // thousands. The scan must break on the long blank run rather than
      // materialise a cell object for every row down to here (the OOM cause).
      const s = wb.getWorksheet('Launagögn')!
      s.getCell('B40000').value = 'stray'
      expect(s.rowCount).toBeGreaterThan(30000)

      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const report = await parseWorkbook(await serialize(wb))

      // Only the real row is parsed; the stray far-down cell is never reached.
      expect(report.employees.map((e) => e.ordinal)).toEqual([1])
    })
  })

  describe('parse-layer errors', () => {
    it('rejects unknown gender value', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Other',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(errors.some((e) => e.message.includes('Óþekkt kyn „Other“'))).toBe(
        true,
      )
    })

    /**
     * The layout gate. Column letters are hard-coded in every table parser, so
     * an older template silently feeds each one the wrong field — and the
     * resulting per-row errors blame the submitter's data. This asserts the
     * upload is rejected once, on the header, naming the stale sheet.
     */
    describe('workbook layout', () => {
      it('accepts the shipped template', async () => {
        // The positive case matters as much as the negative one: an assertion
        // that is too strict would reject every real upload.
        const wb = await loadTemplate()
        writeEmployeeRow(wb, 1, {
          name: 'X',
          role: 'R',
          gender: 'Kona',
          paidHours: 173.33,
          baseSalary: 650000,
          additionalFixedOvertime: 0,
          additionalFixedCarAllowance: null,
          bonusOccasionalCarAllowance: null,
          bonusOccasionalOvertime: null,
          bonusPayments: null,
          bonusOther: null,
          field: 'X',
          department: 'X',
          startDate: new Date('2024-01-01'),
        })
        fillCriteriaAndSubCriteria(wb)
        fillRoleClassification(wb, [[1, 1, 1, 1]])
        fillEmployeeClassification(wb, [[1]])

        await expect(parseWorkbook(await serialize(wb))).resolves.toBeDefined()
      })

      it.each([
        ['Launagögn', 'E', 'Starfshlutfall (0-1)'],
        ['Undirviðmið', 'G', 'Hámarksstig'],
      ])(
        'rejects a stale %s layout at %s and says so once',
        async (sheetName, column, staleHeader) => {
          const wb = await loadTemplate()
          const sheet = wb.getWorksheet(sheetName)
          if (!sheet) throw new Error(`no ${sheetName} sheet`)
          // Reproduce the pre-shift header without touching any data row.
          sheet.getCell(`${column}5`).value = staleHeader

          const { errors } = await expectBadRequest(
            parseWorkbook(await serialize(wb)),
          )

          expect(
            errors.some((e) =>
              e.message.includes('Sniðmátið er af eldri útgáfu'),
            ),
          ).toBe(true)
          // The point of bailing early: no per-row noise about the data.
          expect(errors.every((e) => e.row === 5)).toBe(true)
        },
      )
    })

    /**
     * The mirror of the 2080 case: column E previously held
     * `Starfshlutfall (0–1)`, so a value carried over from an older sheet — or
     * from a submitter filling in the field they remember — is a plain positive
     * number that inflates reglulegt tímakaup by up to ~173×.
     *
     * `1` is the important one. It is the most common starfshlutfall there is,
     * and a `>= 1` floor (the bound the Directorate's R reference uses) would
     * admit it. Both must be rejected.
     */
    it.each([0.8, 1])(
      'rejects a carried-over starfshlutfall of %s as paid hours',
      async (paidHours) => {
        const wb = await loadTemplate()
        writeEmployeeRow(wb, 1, {
          name: 'X',
          role: 'R',
          gender: 'Kona',
          paidHours,
          baseSalary: 650000,
          additionalFixedOvertime: 0,
          additionalFixedCarAllowance: null,
          bonusOccasionalCarAllowance: null,
          bonusOccasionalOvertime: null,
          bonusPayments: null,
          bonusOther: null,
          field: 'X',
          department: 'X',
          startDate: new Date('2024-01-01'),
        })
        fillCriteriaAndSubCriteria(wb)
        fillRoleClassification(wb, [[1, 1, 1, 1]])
        fillEmployeeClassification(wb, [[1]])

        const { errors } = await expectBadRequest(
          parseWorkbook(await serialize(wb)),
        )
        expect(
          errors.some((e) =>
            e.message.includes(
              `Greiddar stundir ${paidHours} eru utan leyfilegs bils`,
            ),
          ),
        ).toBe(true)
      },
    )

    // 2080 is the mistake this bound exists for: the annual total entered
    // where the 12-month basis asks for a monthly average.
    it('rejects paid hours above the template bound', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        paidHours: 2080,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some((e) =>
          e.message.includes('Greiddar stundir 2080 eru utan leyfilegs bils'),
        ),
      ).toBe(true)
    })

    it('rejects required missing field with specific column reference', async () => {
      const wb = await loadTemplate()
      // Only fill partial row — omit role (Starf), which is still required.
      // field (Svið) and department (Deild) are intentionally optional.
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: '',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some(
          (e) =>
            e.message.includes('Nauðsynlegan reit vantar') &&
            e.message.includes('Starf'),
        ),
      ).toBe(true)
    })

    it('rejects step order outside 1..numSteps', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[99, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some((e) =>
          e.message.includes('Þrep 99 er utan leyfilegs bils'),
        ),
      ).toBe(true)
    })
  })

  describe('capacity beyond the legacy layout', () => {
    it('parses roles past the old 8-column limit (named-range driven)', async () => {
      const wb = await loadTemplate()
      const roleTitles = Array.from(
        { length: 9 },
        (_, i) => `Hlutverk ${i + 1}`,
      )
      roleTitles.forEach((role, i) =>
        writeEmployeeRow(wb, i + 1, {
          name: `Nafn ${i + 1}`,
          role,
          gender: i % 2 === 0 ? 'Kona' : 'Karl',
          paidHours: 173.33,
          baseSalary: 500000,
          additionalFixedOvertime: 0,
          additionalFixedCarAllowance: null,
          bonusOccasionalCarAllowance: null,
          bonusOccasionalOvertime: null,
          bonusPayments: null,
          bonusOther: null,
          field: 'Svið',
          department: 'Deild',
          startDate: new Date('2023-01-01'),
        }),
      )
      fillCriteriaAndSubCriteria(wb)
      // 9 roles × 4 job-based subs, and 9 employees × 1 personal sub. The
      // 9th role lands in a row the old role-column layout could not address.
      fillRoleClassification(
        wb,
        roleTitles.map(() => [1, 1, 1, 1]),
      )
      fillEmployeeClassification(
        wb,
        roleTitles.map(() => [1]),
      )

      const report = await parseWorkbook(await serialize(wb))

      expect(report.roles).toHaveLength(9)
      expect(report.roles[8].title).toBe('Hlutverk 9')
      expect(report.roles[8].stepAssignments).toHaveLength(JOB_SUB_COUNT)
    })

    // Einstaklingsmat ships 500 employee rows (EMP_STEP_INPUTS = F11:BC510).
    // That is provisioning, not capacity: an employer with more staff copies
    // rows down, so the parser must never treat 500 as a ceiling. The domain
    // ceiling is MAX_EMPLOYEES (10 000), enforced elsewhere.
    const EMPLOYEES_PAST_PROVISIONED_ROWS = 502

    const writeManyEmployees = (wb: ExcelJS.Workbook, count: number) => {
      for (let i = 1; i <= count; i++) {
        writeEmployeeRow(wb, i, {
          name: `Nafn ${i}`,
          role: 'Hlutverk',
          gender: i % 2 === 0 ? 'Kona' : 'Karl',
          paidHours: 173.33,
          baseSalary: 500000,
          additionalFixedOvertime: 0,
          additionalFixedCarAllowance: null,
          bonusOccasionalCarAllowance: null,
          bonusOccasionalOvertime: null,
          bonusPayments: null,
          bonusOther: null,
          field: 'Svið',
          department: 'Deild',
          startDate: new Date('2023-01-01'),
        })
      }
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
    }

    it('parses more employees than Einstaklingsmat provisions rows for, once the employer extends the sheet', async () => {
      const wb = await loadTemplate()
      writeManyEmployees(wb, EMPLOYEES_PAST_PROVISIONED_ROWS)
      // The employer's own extension: one personal step per employee, running
      // past the shipped row 510.
      fillEmployeeClassification(
        wb,
        Array.from({ length: EMPLOYEES_PAST_PROVISIONED_ROWS }, () => [1]),
      )

      const report = await parseWorkbook(await serialize(wb))

      expect(report.employees).toHaveLength(EMPLOYEES_PAST_PROVISIONED_ROWS)
      // The tail employees are the ones the old 500-row cap rejected outright.
      const last = report.employees[EMPLOYEES_PAST_PROVISIONED_ROWS - 1]
      expect(last.ordinal).toBe(EMPLOYEES_PAST_PROVISIONED_ROWS)
      expect(last.personalStepAssignments).toHaveLength(1)
    })

    it('rejects when Einstaklingsmat is shorter than the employee list rather than silently dropping steps', async () => {
      const wb = await loadTemplate()
      writeManyEmployees(wb, EMPLOYEES_PAST_PROVISIONED_ROWS)
      // Employer extended Launagögn but NOT Einstaklingsmat: blanks would read
      // as "no assignment" and understate every tail employee's score.
      fillEmployeeClassification(
        wb,
        Array.from({ length: 500 }, () => [1]),
      )

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sheet: 'Einstaklingsmat',
            message: expect.stringContaining('nær aðeins til'),
          }),
        ]),
      )
    })
  })

  /**
   * The classification matrices lay out one column pair per Undirviðmið row,
   * in ROW order (`Starfsmat!G4` = `SMALL(IF(Undirviðmið!$D$6:$D$205=
   * "Starfsbundið", ROW(…)-5), (COLUMN()-5)/2)`). `fillCriteriaAndSubCriteria`
   * happens to enter its sub-criteria already sorted by the Viðmið criterion
   * order, so a parser that flattened the criterion TREE instead read the
   * right columns by luck. Nothing in the template requires that sorting.
   */
  describe('Undirviðmið row order drives the matrix columns', () => {
    // Viðmið rows 6–9 are the fixed job-based criteria in this order:
    // Ábyrgð, Álag, Vinnuaðstæður, Hæfni. These sub-criteria are entered in a
    // DIFFERENT order, so criterion-grouped order ≠ sheet column order.
    const SHUFFLED_SUBS = [
      { parent: 'Hæfni', sub: 'Formleg menntun', weight: 20 },
      { parent: 'Vinnuaðstæður', sub: 'Vinnuumhverfi', weight: 20 },
      { parent: 'Ábyrgð', sub: 'Ábyrgð á gæðum', weight: 30 },
      { parent: 'Álag', sub: 'Álag í starfi', weight: 20 },
    ]

    const buildShuffled = async (): Promise<Buffer> => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'Nafn 1',
        role: 'Forstöðumaður',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 900000,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'Stjórnun',
        department: 'Framkvæmd',
        startDate: new Date('2023-01-01'),
      })

      setCriterionWeight(wb, 6, 30) // Ábyrgð
      setCriterionWeight(wb, 7, 20) // Álag
      setCriterionWeight(wb, 8, 20) // Vinnuaðstæður
      setCriterionWeight(wb, 9, 20) // Hæfni
      addPersonalCriterion(wb, 10, 'Sérhæfing', 10)

      SHUFFLED_SUBS.forEach(({ parent, sub, weight }, i) => {
        addSubCriterion(wb, 6 + i, parent, sub, weight, FIVE_STEPS)
      })
      addSubCriterion(wb, 10, 'Sérhæfing', 'Tungumál', 10, FIVE_STEPS)

      // One distinct value per column, so a shifted read is unambiguous:
      // column G→1, I→2, K→3, M→4.
      fillRoleClassification(wb, [[1, 2, 3, 4]])
      fillEmployeeClassification(wb, [[1]])

      return serialize(wb)
    }

    it('maps each column to the sub-criterion its own header names', async () => {
      const report = await parseWorkbook(await buildShuffled())
      const role = report.roles.find((r) => r.title === 'Forstöðumaður')

      // Undirviðmið rows 6…9 → columns G / I / K / M, which were filled with
      // 1 / 2 / 3 / 4. Criterion-grouped order would shift every one of them.
      expect(role?.stepAssignments).toEqual([
        { criterionTitle: 'Hæfni', subTitle: 'Formleg menntun', stepOrder: 1 },
        {
          criterionTitle: 'Vinnuaðstæður',
          subTitle: 'Vinnuumhverfi',
          stepOrder: 2,
        },
        { criterionTitle: 'Ábyrgð', subTitle: 'Ábyrgð á gæðum', stepOrder: 3 },
        { criterionTitle: 'Álag', subTitle: 'Álag í starfi', stepOrder: 4 },
      ])
    })
  })

  /**
   * Column identity is DERIVED (from Undirviðmið row order), not read, so a
   * wrong derivation lands values on the wrong sub-criterion instead of
   * failing — and only the subset exceeding the wrong column's step count
   * errors at all. The cached header on each column pair is the independent
   * check that turns that silent class into one message.
   */
  describe('column alignment guard', () => {
    it('refuses to read Starfsmat when a column header contradicts the resolved sub-criterion', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'Nafn 1',
        role: 'Forstöðumaður',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 900000,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'Stjórnun',
        department: 'Framkvæmd',
        startDate: new Date('2023-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      // Starfsmat rows 5/6 label each column pair (`INDEX(Undirviðmið!…, G$4)`).
      // The shipped template stores them as formulas with no cached result;
      // writing a stale pair simulates a workbook saved without recalculating.
      const starfsmat = wb.getWorksheet('Starfsmat')!
      starfsmat.getCell('G5').value = 'Hæfni'
      starfsmat.getCell('G6').value = 'Eitthvað allt annað'

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sheet: 'Starfsmat',
            column: 'G',
            message: expect.stringContaining('Eitthvað allt annað'),
          }),
        ]),
      )
      // Bails instead of reading the matrix, so no per-cell cascade.
      expect(
        errors.filter((e) => e.message.includes('utan leyfilegs bils')),
      ).toHaveLength(0)
    })

    it('accepts headers that agree with the resolved sub-criterion', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'Nafn 1',
        role: 'Forstöðumaður',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 900000,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'Stjórnun',
        department: 'Framkvæmd',
        startDate: new Date('2023-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      // `fillCriteriaAndSubCriteria` writes Undirviðmið rows 6…9 as
      // Ábyrgð / Álag / Vinnuaðstæður / Hæfni → columns G / I / K / M.
      const starfsmat = wb.getWorksheet('Starfsmat')!
      starfsmat.getCell('G5').value = 'Ábyrgð'
      starfsmat.getCell('G6').value = 'Ábyrgð á gæðum'
      starfsmat.getCell('M5').value = 'Hæfni'
      starfsmat.getCell('M6').value = 'Formleg menntun'

      const report = await parseWorkbook(await serialize(wb))
      expect(report.roles[0].stepAssignments).toHaveLength(JOB_SUB_COUNT)
    })
  })

  /**
   * A slot on the matrices is allocated by Undirviðmið's computed `Tegund`
   * column, which resolves through `MATCH` against the Viðmið *cell* — not
   * through whether the parser accepted that row. So a row either sheet
   * rejects must still consume its column pair, or every later column in the
   * bucket shifts and lands on the wrong sub-criterion.
   *
   * Each test below writes the cached column headers, which makes the
   * alignment guard active: a shift shows up as a guard error naming the
   * wrong column, so these fail loudly if the placeholder is dropped.
   */
  describe('rejected rows still reserve their column slot', () => {
    const EMPLOYEE = {
      name: 'Nafn 1',
      role: 'Forstöðumaður',
      gender: 'Kona',
      paidHours: 173.33,
      baseSalary: 900000,
      additionalFixedOvertime: 0,
      additionalFixedCarAllowance: null,
      bonusOccasionalCarAllowance: null,
      bonusOccasionalOvertime: null,
      bonusPayments: null,
      bonusOther: null,
      field: 'Stjórnun',
      department: 'Framkvæmd',
      startDate: new Date('2023-01-01'),
    }

    /**
     * `fillCriteriaAndSubCriteria` writes Undirviðmið rows 6…9 in Viðmið
     * order, so the job-based columns are G / I / K / M. Writing the headers
     * they *should* carry turns any shift into a guard error.
     */
    const writeStarfsmatHeaders = (wb: ExcelJS.Workbook) => {
      const sheet = wb.getWorksheet('Starfsmat')!
      const expected: [string, string, string][] = [
        ['G', 'Ábyrgð', 'Ábyrgð á gæðum'],
        ['I', 'Álag', 'Álag í starfi'],
        ['K', 'Vinnuaðstæður', 'Vinnuumhverfi'],
        ['M', 'Hæfni', 'Formleg menntun'],
      ]
      expected.forEach(([col, criterion, sub]) => {
        sheet.getCell(`${col}5`).value = criterion
        sheet.getCell(`${col}6`).value = sub
      })
    }

    const alignmentErrors = (errors: { message: string }[]) =>
      errors.filter((e) => e.message.includes('samkvæmt röð undirviðmiðanna'))

    it('keeps later columns aligned when a middle Undirviðmið row is rejected', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, EMPLOYEE)
      fillCriteriaAndSubCriteria(wb)
      // Row 7 is Álag → column I. Blanking Skilgreining makes the parser
      // reject it, but the sheet still allocates its column pair.
      wb.getWorksheet('Undirviðmið')!.getCell('E7').value = null
      writeStarfsmatHeaders(wb)
      fillRoleClassification(wb, [[1, 2, 3, 4]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      // The row reports its own problem, and nothing else moves.
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sheet: 'Undirviðmið',
            row: 7,
            message: expect.stringContaining('Röð vantar yfirviðmið'),
          }),
        ]),
      )
      expect(alignmentErrors(errors)).toHaveLength(0)
    })

    it('does not blame Undirviðmið when its parent Viðmið row was the rejected one', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, EMPLOYEE)
      fillCriteriaAndSubCriteria(wb)
      // Viðmið row 8 is Vinnuaðstæður. Blanking its Lýsing rejects the
      // criterion while leaving the title in place, so `MATCH` still
      // resolves and Undirviðmið row 8 keeps column K.
      wb.getWorksheet('Viðmið')!.getCell('D8').value = null
      writeStarfsmatHeaders(wb)
      fillRoleClassification(wb, [[1, 2, 3, 4]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sheet: 'Viðmið',
            row: 8,
            message: 'Röð vantar heiti eða lýsingu',
          }),
        ]),
      )
      // The sub-criterion row is a casualty of the Viðmið error, not a
      // second independent problem: saying its parent "was not found" would
      // point the user at the wrong sheet.
      expect(
        errors.filter((e) => e.message.includes('fannst ekki á blaðinu')),
      ).toHaveLength(0)
      expect(alignmentErrors(errors)).toHaveLength(0)
    })
  })

  describe('step bound comes from the declared Fjöldi þrepa', () => {
    it('accepts a step order above the description count when column G declares it', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'Nafn 1',
        role: 'Forstöðumaður',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 900000,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'Stjórnun',
        department: 'Framkvæmd',
        startDate: new Date('2023-01-01'),
      })
      setCriterionWeight(wb, 6, 30)
      setCriterionWeight(wb, 7, 20)
      setCriterionWeight(wb, 8, 20)
      setCriterionWeight(wb, 9, 20)
      addPersonalCriterion(wb, 10, 'Sérhæfing', 10)

      // Declares 5 steps but describes only 3. Excel's own cell validation
      // caps input at column G, so a 5 is a value the user was allowed to
      // type — the missing descriptions are the actual defect, and the step
      // bound must not report a second, invented one.
      addSubCriterion(
        wb,
        6,
        'Ábyrgð',
        'Ábyrgð á gæðum',
        30,
        FIVE_STEPS.slice(0, 3),
        5,
      )
      // Þrep 4/5 (columns M/N) ship as autofill formulas with no cached
      // result. Blank them so the row is short on *descriptions* rather than
      // on formula caches, which is the case under test.
      const undirviðmið = wb.getWorksheet('Undirviðmið')!
      undirviðmið.getCell(6, 13).value = null
      undirviðmið.getCell(6, 14).value = null
      addSubCriterion(wb, 7, 'Álag', 'Álag í starfi', 20, FIVE_STEPS)
      addSubCriterion(wb, 8, 'Vinnuaðstæður', 'Vinnuumhverfi', 20, FIVE_STEPS)
      addSubCriterion(wb, 9, 'Hæfni', 'Formleg menntun', 20, FIVE_STEPS)
      addSubCriterion(wb, 10, 'Sérhæfing', 'Tungumál', 10, FIVE_STEPS)

      fillRoleClassification(wb, [[5, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      expect(errors.map((e) => e.message)).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Lýsingu vantar fyrir þrep 4'),
          expect.stringContaining('Lýsingu vantar fyrir þrep 5'),
        ]),
      )
      // `steps.length` (3) as the bound would reject the 5 as out of range.
      expect(
        errors.filter((e) => e.message.includes('utan leyfilegs bils')),
      ).toHaveLength(0)
    })
  })

  describe('unreadable column headers', () => {
    it('treats a non-text header as unverifiable rather than a mismatch', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'Nafn 1',
        role: 'Forstöðumaður',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 900000,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'Stjórnun',
        department: 'Framkvæmd',
        startDate: new Date('2023-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      // A row inserted between the header rows and the grid slides the
      // header offsets onto the numeric Vægi row. `readString` would
      // stringify that to e.g. "30" and reject every column; the workbook
      // itself is fine, so the guard must stand down instead.
      const starfsmat = wb.getWorksheet('Starfsmat')!
      starfsmat.getCell('G5').value = 30
      starfsmat.getCell('G6').value = 30

      const report = await parseWorkbook(await serialize(wb))
      expect(report.roles[0].stepAssignments).toHaveLength(JOB_SUB_COUNT)
    })
  })

  /**
   * The user-facing `details` list is these lines verbatim, so the sheet has
   * to be identifiable at a glance. Several sheet names double as domain terms
   * inside the messages (Starfsmat, Viðmið, Undirviðmið), which made a bare
   * leading `Starfsmat:` read as part of the sentence.
   */
  describe('error line formatting', () => {
    // `expectBadRequest` types `message` as the single-string case; the
    // error-list paths put one formatted line per problem in an array.
    const lines = (message: string): string[] => message as unknown as string[]

    it('labels the sheet, with no location to report', async () => {
      const { message } = await expectBadRequest(
        parseWorkbook(templateBuffer()),
      )

      expect(lines(message)).toEqual(
        expect.arrayContaining([
          'Blað: Launagögn – Að minnsta kosti eitt starf er nauðsynlegt',
        ]),
      )
    })

    it('labels the sheet and keeps the column location', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        paidHours: 173.33,
        baseSalary: 1,
        additionalFixedOvertime: 0,
        additionalFixedCarAllowance: null,
        bonusOccasionalCarAllowance: null,
        bonusOccasionalOvertime: null,
        bonusPayments: null,
        bonusOther: null,
        field: 'X',
        department: 'X',
        startDate: new Date('2024-01-01'),
      })
      fillCriteriaAndSubCriteria(wb)
      fillRoleClassification(wb, [[99, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1]])

      const { message } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )

      expect(lines(message)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(
            /^Blað: Starfsmat \(dálkur G\) – Þrep 99 er utan leyfilegs bils/,
          ),
        ]),
      )
    })
  })

  it('rejects a non-xlsx payload with a descriptive error', async () => {
    const { message } = await expectBadRequest(
      parseWorkbook(Buffer.from('not a workbook')),
    )
    expect(message).toMatch(/Ekki tókst að lesa vinnubókina/)
  })

  /**
   * The missing-shared-strings guard is the first thing an uploaded archive
   * touches, before any workbook validation, and it only engages when
   * `xl/sharedStrings.xml` is absent. It therefore has to stay well-behaved
   * on markup no spreadsheet editor would produce — which is what these
   * cover, as opposed to the valid-workbook cases above.
   */
  describe('archives with malformed shared-string markup', () => {
    /**
     * Deliberately not a valid xlsx: reaching the guard only needs a
     * worksheet member and no shared-strings table. Anything that gets past
     * it fails at `workbook.xlsx.load`, which is fine — the guard is not
     * where a malformed upload should be spending its time.
     */
    const zipWithSheet = async (sheetXml: string): Promise<Buffer> => {
      const zip = new JSZip()
      zip.file('[Content_Types].xml', '<Types/>')
      zip.file('xl/worksheets/sheet1.xml', sheetXml)
      return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
    }

    it('scans a sheet whose cell markup never closes in linear time', async () => {
      // A cell tag left open, followed by a long run of values. Matching this
      // has to stay proportional to the sheet — a pattern that can re-scan
      // per value instead grows with its square, and this sheet is large
      // enough for the difference to be minutes rather than milliseconds. The
      // bound below is orders of magnitude looser than the scan needs, so it
      // fails on the behaviour rather than on CI timing noise.
      const payload = await zipWithSheet(
        '<c t="s">' + '<v>1</v>'.repeat(262144),
      )

      const started = Date.now()
      await expectBadRequest(parseWorkbook(payload))
      expect(Date.now() - started).toBeLessThan(5000)
    })

    it('rejects an out-of-range shared-string index instead of allocating for it', async () => {
      // The index sizes the table `emptySharedStringsXml` builds, so one far
      // outside the range a real workbook uses has to be refused rather than
      // allocated for.
      const { message, errors } = await expectBadRequest(
        parseWorkbook(await zipWithSheet('<c t="s"><v>999999999</v></c>')),
      )

      // `errors` only reaches the server log, so the headline is what decides
      // whether the user is told anything useful.
      expect(message).toContain('of margar strengjafærslur')
      expect(errors.map((e) => e.message)).toEqual(
        expect.arrayContaining([expect.stringContaining('Hæsta strengjavísun')]),
      )
    })

    it('rejects worksheet XML past the scan budget', async () => {
      // 72MB inflated, over the 64MB budget, from an archive well under the
      // 20MB compressed limit `ImportUploadService` enforces — compressed
      // size says little about what a sheet inflates to.
      const { message } = await expectBadRequest(
        parseWorkbook(await zipWithSheet('<v>1</v>'.repeat(9 * 1024 * 1024))),
      )

      // Not "is this a valid xlsx file?" — it is one, it is just too big.
      expect(message).toContain('of stór til lestrar')
    })

    it('refuses an oversized member from its declared size, without inflating it', async () => {
      // 320MB inflated in a single member. Reading the size the archive
      // declares costs nothing; inflating first to discover the same thing
      // costs the memory and the time, which is the whole point of checking
      // before rather than after.
      const payload = await zipWithSheet('<v>1</v>'.repeat(40 * 1024 * 1024))

      const started = Date.now()
      const { message } = await expectBadRequest(parseWorkbook(payload))

      expect(message).toContain('of stór til lestrar')
      expect(Date.now() - started).toBeLessThan(1000)
    })

    it('counts a shared-string cell that carries a formula before its value', async () => {
      // `<f>` is the only element the schema allows between `<c>` and `<v>`.
      // Excel never pairs it with t="s", but this guard exists for producers
      // that are already off-schema, and missing a cell is the harmful
      // direction — the synthesized table comes out short and the load fails.
      // An index over the ceiling is the observable proof the cell was seen.
      for (const cell of [
        '<c t="s"><f>A2</f><v>70000</v></c>',
        '<c t="s"><f/><v>70000</v></c>',
        '<c t="s"><f t="shared" si="0"/><v>70000</v></c>',
      ]) {
        const { message } = await expectBadRequest(
          parseWorkbook(await zipWithSheet(cell)),
        )
        expect(message).toContain('of margar strengjafærslur')
      }
    })

    it('does not read a value out of the cell after a self-closing one', async () => {
      // The tolerance above must not reach past the cell it started in: an
      // ISK amount in the next cell is easily large enough to trip the
      // ceiling and reject a workbook that was fine.
      const { message } = await expectBadRequest(
        parseWorkbook(
          await zipWithSheet('<c t="s"/><c t="n"><v>850000000</v></c>'),
        ),
      )

      expect(message).not.toContain('of margar strengjafærslur')
    })

    it('still repairs a workbook that legitimately lost its shared-strings table', async () => {
      const zip = await JSZip.loadAsync(templateBuffer())
      zip.remove('xl/sharedStrings.xml')
      const stripped = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      })

      // The template's cells do reference shared strings, so without an
      // injected table exceljs dereferences undefined during load. The load
      // failure path reports against the synthetic `(workbook)` sheet; real
      // sheet names in the error list mean the archive was repaired, loaded,
      // and got as far as layout validation — which then reports the headers
      // as blank, because the strings genuinely are gone. That is the
      // documented outcome: repair the structure, let validation report the
      // missing data.
      const { errors } = await expectBadRequest(parseWorkbook(stripped))

      expect(errors.length).toBeGreaterThan(0)
      expect(errors.map((e) => e.sheet)).not.toContain('(workbook)')
      expect(errors.map((e) => e.sheet)).toContain('Launagögn')
    })
  })
})
