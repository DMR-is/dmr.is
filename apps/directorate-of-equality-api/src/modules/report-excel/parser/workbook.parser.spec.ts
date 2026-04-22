/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ExcelJS from 'exceljs'

import { BadRequestException } from '@nestjs/common'

import { GenderEnum } from '../../report/models/report.model'
import { ReportCriterionTypeEnum } from '../../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../../report-employee/models/report-employee.model'
import { ParsedReportDto } from '../dto/parsed-report.dto'
import { TEMPLATE_BASE64 } from '../template-data'
import { parseWorkbook } from './workbook.parser'

const templateBuffer = () => Buffer.from(TEMPLATE_BASE64, 'base64')

const loadTemplate = async (): Promise<ExcelJS.Workbook> => {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(templateBuffer().buffer as ArrayBuffer)
  return wb
}

const serialize = async (wb: ExcelJS.Workbook): Promise<Buffer> =>
  Buffer.from((await wb.xlsx.writeBuffer()) as unknown as ArrayBuffer)

const writeEmployeeRow = (
  wb: ExcelJS.Workbook,
  ordinal: number,
  values: {
    name: string
    role: string
    gender: string
    workRatioPct: number
    education: string
    baseSalary: number
    field: string
    additionalSalary: number
    department: string
    bonusSalary: number | null
    startDate: Date
  },
) => {
  const s = wb.getWorksheet('Starfsmenn')!
  const r = 5 + ordinal
  s.getCell(`A${r}`).value = ordinal
  s.getCell(`B${r}`).value = values.name
  s.getCell(`C${r}`).value = values.role
  s.getCell(`D${r}`).value = values.gender
  s.getCell(`E${r}`).value = values.workRatioPct
  s.getCell(`F${r}`).value = values.education
  s.getCell(`G${r}`).value = values.baseSalary
  s.getCell(`H${r}`).value = values.field
  s.getCell(`I${r}`).value = values.additionalSalary
  s.getCell(`J${r}`).value = values.department
  s.getCell(`K${r}`).value = values.bonusSalary
  s.getCell(`L${r}`).value = values.startDate
}

const fillRoleClassification = (
  wb: ExcelJS.Workbook,
  rolesInOrder: number[][],
) => {
  const sheet = wb.getWorksheet('Flokkun starfa')!
  const cols = ['G', 'I', 'K', 'M', 'O', 'Q', 'S', 'U']
  rolesInOrder.forEach((roleSteps, roleIdx) => {
    roleSteps.forEach((stepOrder, subIdx) => {
      sheet.getCell(`${cols[roleIdx]}${7 + subIdx}`).value = stepOrder
    })
  })
}

const fillEmployeeClassification = (
  wb: ExcelJS.Workbook,
  empsInOrder: number[][],
) => {
  const sheet = wb.getWorksheet('Flokkun starfsmanna')!
  const cols = [
    'D',
    'F',
    'H',
    'J',
    'L',
    'N',
    'P',
    'R',
    'T',
    'V',
    'X',
    'Z',
    'AB',
    'AD',
    'AF',
  ]
  empsInOrder.forEach((empSteps, empIdx) => {
    empSteps.forEach((stepOrder, subIdx) => {
      sheet.getCell(`${cols[subIdx]}${7 + empIdx}`).value = stepOrder
    })
  })
}

const expectBadRequest = async (
  promise: Promise<unknown>,
): Promise<{
  message: string
  errors: { message: string; sheet: string }[]
}> => {
  await expect(promise).rejects.toBeInstanceOf(BadRequestException)
  try {
    await promise
  } catch (e) {
    return (e as BadRequestException).getResponse() as {
      message: string
      errors: { message: string; sheet: string }[]
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
    workRatioPct: 100,
    education: 'Háskólapróf (BA/BS)',
    baseSalary: 900000,
    field: 'Stjórnun',
    additionalSalary: 100000,
    department: 'Framkvæmd',
    bonusSalary: 50000,
    startDate: new Date('2023-01-01'),
  })
  writeEmployeeRow(wb, 2, {
    name: 'Nafn 2',
    role: 'Sérfræðingur',
    gender: 'Karl',
    workRatioPct: 100,
    education: 'Meistarapróf (MA/MS)',
    baseSalary: 700000,
    field: 'Tækni',
    additionalSalary: 50000,
    department: 'Tækni',
    bonusSalary: null,
    startDate: new Date('2023-06-01'),
  })
  writeEmployeeRow(wb, 3, {
    name: 'Nafn 3',
    role: 'Verkstjóri',
    gender: 'Kona',
    workRatioPct: 80,
    education: 'Iðn-/starfsmenntun',
    baseSalary: 600000,
    field: 'Rekstur',
    additionalSalary: 40000,
    department: 'Verkstæði',
    bonusSalary: 10000,
    startDate: new Date('2022-03-15'),
  })

  // Template has 7 job-based sub-criteria; 3 distinct roles.
  fillRoleClassification(wb, [
    [3, 3, 3, 3, 3, 3, 3], // Forstöðumaður
    [2, 2, 2, 2, 2, 2, 2], // Sérfræðingur
    [1, 1, 1, 1, 1, 1, 1], // Verkstjóri
  ])
  // Template has 4 personal sub-criteria; 3 employees.
  fillEmployeeClassification(wb, [
    [1, 2, 3, 4],
    [2, 3, 4, 1],
    [3, 4, 1, 2],
  ])

  return serialize(wb)
}

describe('parseWorkbook', () => {
  describe('empty template', () => {
    it('extracts the 6 default criteria + 11 sub-criteria even with no employees', async () => {
      // Semantics will reject (no roles, no employees), but the extracted
      // structure is still observable via the error payload.
      const { errors } = await expectBadRequest(
        parseWorkbook(templateBuffer()),
      )
      expect(errors).toEqual([
        expect.objectContaining({ message: 'At least one role is required' }),
        expect.objectContaining({
          message: 'At least one employee is required',
        }),
      ])
    })
  })

  describe('filled + valid template', () => {
    let report: ParsedReportDto

    beforeAll(async () => {
      const buf = await buildValidFilled()
      report = await parseWorkbook(buf)
    })

    it('parses all 6 criteria with computed step scores', () => {
      expect(report.criteria).toHaveLength(6)
      const types = report.criteria.map((c) => c.type).sort()
      expect(types).toEqual(
        [
          ReportCriterionTypeEnum.RESPONSIBILITY,
          ReportCriterionTypeEnum.STRAIN,
          ReportCriterionTypeEnum.CONDITION,
          ReportCriterionTypeEnum.COMPETENCE,
          ReportCriterionTypeEnum.PERSONAL,
          ReportCriterionTypeEnum.PERSONAL,
        ].sort(),
      )
    })

    it('computes step scores linearly: stepOrder/numSteps × weight × 10', () => {
      // Ábyrgð á gæðum: 10% weight, 5 steps → step 1 = 20, step 5 = 100
      const resp = report.criteria.find(
        (c) => c.type === ReportCriterionTypeEnum.RESPONSIBILITY,
      )
      const sub = resp?.subCriteria.find((s) => s.title === 'Ábyrgð á gæðum')
      expect(sub?.steps.map((s) => Math.round(s.score))).toEqual([
        20, 40, 60, 80, 100,
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
      expect(role?.stepAssignments).toHaveLength(7)
    })

    it('parses employees with Icelandic → enum translation + workRatio normalised to 0…1', () => {
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

    it('attaches 4 personal step assignments per employee', () => {
      report.employees.forEach((e) => {
        expect(e.personalStepAssignments).toHaveLength(4)
      })
    })
  })

  describe('parse-layer errors', () => {
    it('rejects unknown gender value', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Other',
        workRatioPct: 100,
        education: 'Háskólapróf (BA/BS)',
        baseSalary: 1,
        field: 'X',
        additionalSalary: 0,
        department: 'X',
        bonusSalary: null,
        startDate: new Date('2024-01-01'),
      })
      fillRoleClassification(wb, [[1, 1, 1, 1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1, 1, 1, 1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some((e) => e.message.includes('Unknown gender "Other"')),
      ).toBe(true)
    })

    it('rejects unknown education value', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        workRatioPct: 100,
        education: 'Made-up degree',
        baseSalary: 1,
        field: 'X',
        additionalSalary: 0,
        department: 'X',
        bonusSalary: null,
        startDate: new Date('2024-01-01'),
      })
      fillRoleClassification(wb, [[1, 1, 1, 1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1, 1, 1, 1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some((e) =>
          e.message.includes('Unknown education level "Made-up degree"'),
        ),
      ).toBe(true)
    })

    it('rejects out-of-range workRatio', async () => {
      const wb = await loadTemplate()
      writeEmployeeRow(wb, 1, {
        name: 'X',
        role: 'R',
        gender: 'Kona',
        workRatioPct: 150,
        education: 'Háskólapróf (BA/BS)',
        baseSalary: 1,
        field: 'X',
        additionalSalary: 0,
        department: 'X',
        bonusSalary: null,
        startDate: new Date('2024-01-01'),
      })
      fillRoleClassification(wb, [[1, 1, 1, 1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1, 1, 1, 1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some((e) =>
          e.message.includes('Starfshlutfall 150 out of range'),
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
        workRatioPct: 100,
        education: '',
        baseSalary: 1,
        field: 'X',
        additionalSalary: 0,
        department: 'X',
        bonusSalary: null,
        startDate: new Date('2024-01-01'),
      })
      fillRoleClassification(wb, [[1, 1, 1, 1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1, 1, 1, 1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some(
          (e) =>
            e.message.includes('Missing required field') &&
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
        workRatioPct: 100,
        education: 'Háskólapróf (BA/BS)',
        baseSalary: 1,
        field: 'X',
        additionalSalary: 0,
        department: 'X',
        bonusSalary: null,
        startDate: new Date('2024-01-01'),
      })
      fillRoleClassification(wb, [[99, 1, 1, 1, 1, 1, 1]])
      fillEmployeeClassification(wb, [[1, 1, 1, 1]])

      const { errors } = await expectBadRequest(
        parseWorkbook(await serialize(wb)),
      )
      expect(
        errors.some((e) => e.message.includes('Step 99 out of range')),
      ).toBe(true)
    })
  })

  it('rejects a non-xlsx payload with a descriptive error', async () => {
    const { message } = await expectBadRequest(
      parseWorkbook(Buffer.from('not a workbook')),
    )
    expect(message).toMatch(/Could not read workbook/)
  })
})
