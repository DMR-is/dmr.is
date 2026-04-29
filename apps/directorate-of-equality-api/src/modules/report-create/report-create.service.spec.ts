import { BadRequestException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyReportModel } from '../company/models/company-report.model'
import {
  GenderEnum,
  ReportProviderEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { EducationEnum } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { ReportCreateService } from './report-create.service'

const REPORT_ID = 'report-id-1'
const EQUALITY_REPORT_ID = '00000000-0000-0000-0000-00000000eee1'
const PARENT_COMPANY_ID = '00000000-0000-0000-0000-000000000c01'
const SUBSIDIARY_COMPANY_ID = '00000000-0000-0000-0000-000000000c02'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportCreateService', () => {
  let service: ReportCreateService
  let reportCreate: jest.Mock
  let reportFindOne: jest.Mock
  let reportEventCreate: jest.Mock
  let companyReportBulkCreate: jest.Mock
  let roleBulkCreate: jest.Mock
  let employeeBulkCreate: jest.Mock
  let roleStepBulkCreate: jest.Mock
  let personalStepBulkCreate: jest.Mock
  let outlierBulkCreate: jest.Mock
  let criterionCreate: jest.Mock
  let subCriterionCreate: jest.Mock
  let subCriterionStepBulkCreate: jest.Mock
  let reportResultCreateForReport: jest.Mock

  beforeEach(async () => {
    reportCreate = jest.fn().mockResolvedValue({ id: REPORT_ID })
    reportFindOne = jest.fn().mockResolvedValue({ id: EQUALITY_REPORT_ID })
    reportEventCreate = jest.fn().mockResolvedValue({ id: 'event-1' })
    companyReportBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `cr-${i}` })),
    )
    roleBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `role-${i}` })),
    )
    employeeBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `emp-${i}` })),
    )
    roleStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `rs-${i}` })),
    )
    personalStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `ps-${i}` })),
    )
    outlierBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `dev-${i}` })),
    )
    criterionCreate = jest.fn(async (input) => ({ ...input, id: `cri-${Date.now()}-${Math.random()}` }))
    subCriterionCreate = jest.fn(async (input) => ({
      ...input,
      id: `sub-${Date.now()}-${Math.random()}`,
    }))
    subCriterionStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `step-${Date.now()}-${i}` })),
    )
    reportResultCreateForReport = jest.fn().mockResolvedValue({ id: 'result-1' })

    const module = await Test.createTestingModule({
      providers: [
        ReportCreateService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: { create: reportCreate, findOne: reportFindOne },
        },
        {
          provide: getModelToken(ReportEventModel),
          useValue: { create: reportEventCreate },
        },
        {
          provide: getModelToken(CompanyReportModel),
          useValue: { bulkCreate: companyReportBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: { bulkCreate: roleBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { bulkCreate: employeeBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: { bulkCreate: roleStepBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: { bulkCreate: personalStepBulkCreate },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: { bulkCreate: outlierBulkCreate },
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { create: criterionCreate },
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: { create: subCriterionCreate },
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: { bulkCreate: subCriterionStepBulkCreate },
        },
        {
          provide: IReportResultService,
          useValue: { createForReport: reportResultCreateForReport },
        },
      ],
    }).compile()

    service = module.get(ReportCreateService)
  })

  it('creates a SALARY report with all child rows', async () => {
    const result = await service.createSalary(makeInput())

    expect(result).toEqual({ reportId: REPORT_ID })

    expect(reportFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: EQUALITY_REPORT_ID,
          type: ReportTypeEnum.EQUALITY,
        }),
      }),
    )

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReportTypeEnum.SALARY,
        status: 'SUBMITTED',
        equalityReportId: EQUALITY_REPORT_ID,
        companyAdminEmail: 'admin@example.is',
      }),
    )

    expect(companyReportBulkCreate).toHaveBeenCalledTimes(1)
    expect(companyReportBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(companyReportBulkCreate.mock.calls[0][0][0]).toMatchObject({
      reportId: REPORT_ID,
      companyId: PARENT_COMPANY_ID,
      parentCompanyId: null,
    })

    // 1 role, 1 criterion, 1 sub_criterion, 2 steps, 1 employee.
    expect(roleBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(criterionCreate).toHaveBeenCalledTimes(1)
    expect(subCriterionCreate).toHaveBeenCalledTimes(1)
    expect(subCriterionStepBulkCreate.mock.calls[0][0]).toHaveLength(2)

    // role step assignment + personal step assignment both resolve.
    expect(roleStepBulkCreate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        reportEmployeeRoleId: 'role-0',
      }),
    ])
    expect(personalStepBulkCreate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        reportEmployeeId: 'emp-0',
      }),
    ])

    // Total score = 50 (role assignment, stepOrder=5) + 10 (personal
    // assignment, stepOrder=1) = 60. Different keys, so dedup is a no-op.
    expect(employeeBulkCreate.mock.calls[0][0][0]).toMatchObject({
      reportId: REPORT_ID,
      reportEmployeeRoleId: 'role-0',
      score: 60,
    })

    expect(reportResultCreateForReport).toHaveBeenCalledWith(REPORT_ID)

    expect(reportEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        eventType: 'SUBMITTED',
        reportStatus: 'SUBMITTED',
        actorUserId: null,
      }),
    )
  })

  it('dedups overlapping role and personal step assignments when computing score', async () => {
    const input = makeInput()
    // Role and personal both reference (Abyrgd, Abyrgd a fólki, stepOrder=5).
    // Score should still count once: 50, not 100.
    input.parsed.employees[0].personalStepAssignments = [
      { criterionTitle: 'Abyrgd', subTitle: 'Abyrgd a fólki', stepOrder: 5 },
    ]

    await service.createSalary(input)

    expect(employeeBulkCreate.mock.calls[0][0][0].score).toBe(50)
  })

  it('writes one company_report row per participating company with parent FK wired up', async () => {
    const input = makeInput()
    input.companies = [
      makeCompanySnapshot(PARENT_COMPANY_ID, null),
      makeCompanySnapshot(SUBSIDIARY_COMPANY_ID, PARENT_COMPANY_ID),
    ]

    await service.createSalary(input)

    const rows = companyReportBulkCreate.mock.calls[0][0]
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      companyId: PARENT_COMPANY_ID,
      parentCompanyId: null,
    })
    expect(rows[1]).toMatchObject({
      companyId: SUBSIDIARY_COMPANY_ID,
      parentCompanyId: PARENT_COMPANY_ID,
    })
  })

  it('rejects when the referenced equality report is not APPROVED+valid', async () => {
    reportFindOne.mockResolvedValue(null)

    await expect(service.createSalary(makeInput())).rejects.toThrow(NotFoundException)
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('rejects an employee whose role title is not in roles[]', async () => {
    const input = makeInput()
    input.parsed.employees[0].roleTitle = 'Phantom role'

    await expect(service.createSalary(input)).rejects.toThrow(BadRequestException)
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('rejects step assignments that do not resolve in the parsed criteria tree', async () => {
    const input = makeInput()
    input.parsed.roles[0].stepAssignments[0].stepOrder = 99

    await expect(service.createSalary(input)).rejects.toThrow(BadRequestException)
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('propagates child insert failures before snapshot and event creation', async () => {
    employeeBulkCreate.mockRejectedValue(new Error('db boom'))

    await expect(service.createSalary(makeInput())).rejects.toThrow('db boom')

    expect(reportCreate).toHaveBeenCalled()
    expect(reportResultCreateForReport).not.toHaveBeenCalled()
    expect(reportEventCreate).not.toHaveBeenCalled()
  })

  it('propagates snapshot creation failures before event creation', async () => {
    reportResultCreateForReport.mockRejectedValue(new Error('snapshot boom'))

    await expect(service.createSalary(makeInput())).rejects.toThrow('snapshot boom')

    expect(reportEventCreate).not.toHaveBeenCalled()
  })

  it('skips the outlier insert when none are flagged', async () => {
    const input = makeInput()
    input.outliers = []

    await service.createSalary(input)

    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('persists outliers resolving employeeOrdinal to the new employee id', async () => {
    const input = makeInput()
    input.outliers = [
      {
        employeeOrdinal: 1,
        reason: 'On parental leave for 6 months',
        action: 'No adjustment, salary frozen for the period',
        signatureName: 'Anna Admin',
        signatureRole: 'HR Manager',
      },
    ]

    await service.createSalary(input)

    expect(outlierBulkCreate).toHaveBeenCalledTimes(1)
    expect(outlierBulkCreate.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        reportEmployeeId: 'emp-0',
        reason: 'On parental leave for 6 months',
        action: 'No adjustment, salary frozen for the period',
        signatureName: 'Anna Admin',
        signatureRole: 'HR Manager',
      }),
    ])
  })

  it('rejects outliers referencing an unknown employee ordinal', async () => {
    const input = makeInput()
    input.outliers = [
      {
        employeeOrdinal: 999,
        reason: 'r',
        action: 'a',
        signatureName: 'n',
        signatureRole: 'role',
      },
    ]

    await expect(service.createSalary(input)).rejects.toThrow(BadRequestException)
    expect(reportCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  // ── createEquality path ────────────────────────────────────────────

  it('creates an EQUALITY report with content + company snapshot + event', async () => {
    const result = await service.createEquality(makeEqualityInput())

    expect(result).toEqual({ reportId: REPORT_ID })

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReportTypeEnum.EQUALITY,
        status: 'SUBMITTED',
        importedFromExcel: false,
        equalityReportContent: 'A narrative gender-equality plan.',
      }),
    )

    // Equality submissions never set equalityReportId — that FK is SALARY-only.
    expect(reportCreate.mock.calls[0][0]).not.toHaveProperty('equalityReportId')

    expect(companyReportBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(companyReportBulkCreate.mock.calls[0][0][0]).toMatchObject({
      reportId: REPORT_ID,
      companyId: PARENT_COMPANY_ID,
      parentCompanyId: null,
    })

    // No criteria, no employees, no role/personal joins, no snapshot.
    expect(criterionCreate).not.toHaveBeenCalled()
    expect(subCriterionCreate).not.toHaveBeenCalled()
    expect(subCriterionStepBulkCreate).not.toHaveBeenCalled()
    expect(roleBulkCreate).not.toHaveBeenCalled()
    expect(employeeBulkCreate).not.toHaveBeenCalled()
    expect(roleStepBulkCreate).not.toHaveBeenCalled()
    expect(personalStepBulkCreate).not.toHaveBeenCalled()
    expect(reportResultCreateForReport).not.toHaveBeenCalled()
    // No equality FK lookup — there's nothing to validate against.
    expect(reportFindOne).not.toHaveBeenCalled()

    expect(reportEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        eventType: 'SUBMITTED',
        reportStatus: 'SUBMITTED',
        actorUserId: null,
      }),
    )
  })

  it('writes one company_report row per participating company on EQUALITY too', async () => {
    const input = makeEqualityInput()
    input.companies = [
      makeCompanySnapshot(PARENT_COMPANY_ID, null),
      makeCompanySnapshot(SUBSIDIARY_COMPANY_ID, PARENT_COMPANY_ID),
    ]

    await service.createEquality(input)

    const rows = companyReportBulkCreate.mock.calls[0][0]
    expect(rows).toHaveLength(2)
    expect(rows[1]).toMatchObject({
      companyId: SUBSIDIARY_COMPANY_ID,
      parentCompanyId: PARENT_COMPANY_ID,
    })
  })

  it('propagates EQUALITY company_report failures before event creation', async () => {
    companyReportBulkCreate.mockRejectedValue(new Error('cr boom'))

    await expect(service.createEquality(makeEqualityInput())).rejects.toThrow(
      'cr boom',
    )

    expect(reportCreate).toHaveBeenCalled()
    expect(reportEventCreate).not.toHaveBeenCalled()
  })
})

function makeCompanySnapshot(
  companyId: string,
  parentCompanyId: string | null,
) {
  return {
    companyId,
    parentCompanyId,
    name: 'Acme ehf',
    nationalId: '5500000000',
    address: 'Hofdabakki 9',
    city: 'Reykjavik',
    postcode: '110',
    averageEmployeeCountFromRsk: 75,
    isatCategory: 'J62.01',
  }
}

function makeInput(): CreateReportDto {
  return {
    equalityReportId: EQUALITY_REPORT_ID,
    identifier: 'SAL-2026-001',
    importedFromExcel: true,
    providerType: ReportProviderEnum.SYSTEM,
    providerId: null,
    companyAdminName: 'Anna Admin',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    averageEmployeeMaleCount: 30,
    averageEmployeeFemaleCount: 40,
    averageEmployeeNeutralCount: 5,
    companies: [makeCompanySnapshot(PARENT_COMPANY_ID, null)],
    parsed: {
      criteria: [
        {
          type: ReportCriterionTypeEnum.RESPONSIBILITY,
          title: 'Abyrgd',
          description: 'Responsibility',
          weight: 15,
          subCriteria: [
            {
              title: 'Abyrgd a fólki',
              description: 'People responsibility',
              weight: 5,
              steps: [
                { order: 1, description: 'low', score: 10 },
                { order: 5, description: 'high', score: 50 },
              ],
            },
          ],
        },
      ],
      roles: [
        {
          title: 'Framkvaemdastjori',
          stepAssignments: [
            {
              criterionTitle: 'Abyrgd',
              subTitle: 'Abyrgd a fólki',
              stepOrder: 5,
            },
          ],
        },
      ],
      employees: [
        {
          ordinal: 1,
          identifier: 'TVE-001',
          roleTitle: 'Framkvaemdastjori',
          education: EducationEnum.MASTER,
          gender: GenderEnum.FEMALE,
          field: 'Mgmt',
          department: 'Mgmt',
          startDate: '2021-01-01',
          workRatio: 1,
          baseSalary: 1000000,
          additionalSalary: 100000,
          bonusSalary: null,
          personalStepAssignments: [
            {
              criterionTitle: 'Abyrgd',
              subTitle: 'Abyrgd a fólki',
              stepOrder: 1,
            },
          ],
        },
      ],
    },
  }
}

function makeEqualityInput(): CreateEqualityReportDto {
  return {
    identifier: 'EQ-2026-001',
    providerType: ReportProviderEnum.SYSTEM,
    providerId: null,
    companyAdminName: 'Anna Admin',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    equalityReportContent: 'A narrative gender-equality plan.',
    companies: [makeCompanySnapshot(PARENT_COMPANY_ID, null)],
  }
}
