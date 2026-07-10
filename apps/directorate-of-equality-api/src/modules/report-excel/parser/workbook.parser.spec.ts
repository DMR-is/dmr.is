/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ExcelJS from 'exceljs'

import { BadRequestException } from '@nestjs/common'

import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../../report-employee/models/report-employee.model'
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
    workRatio: number
    education: string
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
  const s = wb.getWorksheet('Starfsmenn')!
  const r = 5 + ordinal
  s.getCell(`A${r}`).value = ordinal
  s.getCell(`B${r}`).value = values.name
  s.getCell(`C${r}`).value = values.role
  s.getCell(`D${r}`).value = values.gender
  s.getCell(`E${r}`).value = values.workRatio
  s.getCell(`F${r}`).value = values.education
  s.getCell(`G${r}`).value = values.field
  s.getCell(`H${r}`).value = values.department
  s.getCell(`I${r}`).value = values.startDate
  s.getCell(`J${r}`).value = values.baseSalary
  s.getCell(`K${r}`).value = values.additionalFixedOvertime
  s.getCell(`L${r}`).value = values.additionalFixedCarAllowance
  s.getCell(`M${r}`).value = values.bonusOccasionalCarAllowance
  s.getCell(`N${r}`).value = values.bonusOccasionalOvertime
  s.getCell(`O${r}`).value = values.bonusPayments
  s.getCell(`P${r}`).value = values.bonusOther
}

// Step-order inputs sit on every SECOND column (score column interleaved after
// each): role rows start at row 11 and job-sub columns start at G (col 7);
// employee rows start at row 7 and personal-sub columns start at D (col 4).
// Written by numeric coordinate so helpers follow the named-range geometry.
const fillRoleClassification = (
  wb: ExcelJS.Workbook,
  rolesInOrder: number[][],
) => {
  const sheet = wb.getWorksheet('Flokkun starfa')!
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
  const sheet = wb.getWorksheet('Flokkun starfsmanna')!
  empsInOrder.forEach((empSteps, empIdx) => {
    empSteps.forEach((stepOrder, subIdx) => {
      sheet.getCell(7 + empIdx, 4 + 2 * subIdx).value = stepOrder
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
) => {
  const s = wb.getWorksheet('Undirviðmið')!
  s.getCell(`B${undirviðmiðRow}`).value = parentTitle
  s.getCell(`C${undirviðmiðRow}`).value = subTitle
  s.getCell(`D${undirviðmiðRow}`).value = `${subTitle} description`
  s.getCell(`E${undirviðmiðRow}`).value = weightPct
  s.getCell(`F${undirviðmiðRow}`).value = stepDescriptions.length
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
    workRatio: 1,
    education: 'BA/BS eða sambærilegt háskólanám',
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
    workRatio: 1,
    education: 'Háskólapróf á framhaldsstigi (MA/MS)',
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
    workRatio: 0.8,
    education: 'Styttra framhaldsnám (t.d. leikskóla-/félagsliði)',
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

    it('derives 3 distinct roles from Starfsmenn in first-appearance order', () => {
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

    it('parses employees with Icelandic → enum translation + workRatio preserved as 0…1', () => {
      const emp = report.employees.find((e) => e.ordinal === 3)
      expect(emp).toEqual(
        expect.objectContaining({
          ordinal: 3,
          roleTitle: 'Verkstjóri',
          gender: GenderEnum.FEMALE,
          education: EducationEnum.VOCATIONAL,
          workRatio: 0.8,
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
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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
      s.getCell('D6').value = {
        formula: 'CATALOG_DESC()',
        result: 'Cached description',
      } as ExcelJS.CellValue
      s.getCell('F6').value = {
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
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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
      const s = wb.getWorksheet('Starfsmenn')!
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
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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
      const s = wb.getWorksheet('Starfsmenn')!
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
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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

    it('rejects unknown education value', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        workRatio: 1,
        education: 'Made-up degree',
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
          e.message.includes('Óþekkt menntunarstig „Made-up degree“'),
        ),
      ).toBe(true)
    })

    it('rejects out-of-range workRatio', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        workRatio: 1.5,
        education: 'BA/BS eða sambærilegt háskólanám',
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
          e.message.includes('Starfshlutfall 1.5 er utan leyfilegs bils'),
        ),
      ).toBe(true)
    })

    it('rejects required missing field with specific column reference', async () => {
      const wb = await loadTemplate()
      // Only fill partial row — omit education
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        workRatio: 1,
        education: '',
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
            e.message.includes('Menntun'),
        ),
      ).toBe(true)
    })

    it('rejects step order outside 1..numSteps', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        workRatio: 1,
        education: 'BA/BS eða sambærilegt háskólanám',
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
          workRatio: 1,
          education: 'BA/BS eða sambærilegt háskólanám',
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
  })

  it('rejects a non-xlsx payload with a descriptive error', async () => {
    const { message } = await expectBadRequest(
      parseWorkbook(Buffer.from('not a workbook')),
    )
    expect(message).toMatch(/Ekki tókst að lesa vinnubókina/)
  })
})
