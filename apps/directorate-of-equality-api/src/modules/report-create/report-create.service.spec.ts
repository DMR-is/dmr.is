import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanySizeEnum } from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import {
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
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
  let reportFindAll: jest.Mock
  let reportUpdate: jest.Mock
  let reportEventCreate: jest.Mock
  let companyFindAll: jest.Mock
  let companyFindOne: jest.Mock
  let companyReportBulkCreate: jest.Mock
  let companyReportFindOne: jest.Mock
  let companyReportFindAll: jest.Mock
  let roleBulkCreate: jest.Mock
  let employeeBulkCreate: jest.Mock
  let roleStepBulkCreate: jest.Mock
  let personalStepBulkCreate: jest.Mock
  let outlierBulkCreate: jest.Mock
  let criterionCreate: jest.Mock
  let subCriterionCreate: jest.Mock
  let subCriterionStepBulkCreate: jest.Mock
  let reportResultCreateForReport: jest.Mock
  let configGetByKey: jest.Mock

  beforeEach(async () => {
    reportCreate = jest.fn().mockResolvedValue({ id: REPORT_ID })
    reportFindOne = jest.fn().mockResolvedValue({ id: EQUALITY_REPORT_ID })
    reportFindAll = jest.fn().mockResolvedValue([])
    reportUpdate = jest.fn().mockResolvedValue([0])
    reportEventCreate = jest.fn().mockResolvedValue({ id: 'event-1' })
    companyFindAll = jest
      .fn()
      .mockResolvedValue([
        makeCompanyRow(PARENT_COMPANY_ID, CompanySizeEnum.LARGE),
        makeCompanyRow(SUBSIDIARY_COMPANY_ID, CompanySizeEnum.MEDIUM),
      ])
    companyFindOne = jest.fn().mockResolvedValue({ id: PARENT_COMPANY_ID })
    companyReportBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `cr-${i}` })),
    )
    companyReportFindOne = jest.fn().mockResolvedValue(null)
    companyReportFindAll = jest.fn().mockResolvedValue([])
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
    criterionCreate = jest.fn(async (input) => ({
      ...input,
      id: `cri-${Date.now()}-${Math.random()}`,
    }))
    subCriterionCreate = jest.fn(async (input) => ({
      ...input,
      id: `sub-${Date.now()}-${Math.random()}`,
    }))
    subCriterionStepBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({
        ...r,
        id: `step-${Date.now()}-${i}`,
      })),
    )
    reportResultCreateForReport = jest
      .fn()
      .mockResolvedValue({ id: 'result-1' })
    // Default to a generous threshold so existing fixtures (no salary
    // outliers in their parsed payload) don't accidentally flip into
    // outlier-detected territory and fail submit-side guard checks.
    configGetByKey = jest.fn().mockResolvedValue({
      key: 'salary_difference_threshold_percent',
      value: '3.9',
    })

    const module = await Test.createTestingModule({
      providers: [
        ReportCreateService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: {
            create: reportCreate,
            findOne: reportFindOne,
            findAll: reportFindAll,
            update: reportUpdate,
          },
        },
        {
          provide: getModelToken(ReportEventModel),
          useValue: { create: reportEventCreate },
        },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findAll: companyFindAll, findOne: companyFindOne },
        },
        {
          provide: getModelToken(CompanyReportModel),
          useValue: {
            bulkCreate: companyReportBulkCreate,
            findOne: companyReportFindOne,
            findAll: companyReportFindAll,
          },
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
        {
          provide: IConfigService,
          useValue: { getByKey: configGetByKey },
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
        companyNationalId: '5500000000',
      }),
    )

    expect(companyReportBulkCreate).toHaveBeenCalledTimes(1)
    expect(companyReportBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(companyReportBulkCreate.mock.calls[0][0][0]).toMatchObject({
      reportId: REPORT_ID,
      companyId: PARENT_COMPANY_ID,
      parentCompanyId: null,
      employeeCountCategory: CompanySizeEnum.LARGE,
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
        companyId: PARENT_COMPANY_ID,
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
      employeeCountCategory: CompanySizeEnum.MEDIUM,
    })
  })

  it('rejects when the referenced equality report is not APPROVED+valid', async () => {
    reportFindOne.mockResolvedValue(null)

    await expect(service.createSalary(makeInput())).rejects.toThrow(
      NotFoundException,
    )
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('rejects an employee whose role title is not in roles[]', async () => {
    const input = makeInput()
    input.parsed.employees[0].roleTitle = 'Phantom role'

    await expect(service.createSalary(input)).rejects.toThrow(
      BadRequestException,
    )
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('rejects step assignments that do not resolve in the parsed criteria tree', async () => {
    const input = makeInput()
    input.parsed.roles[0].stepAssignments[0].stepOrder = 99

    await expect(service.createSalary(input)).rejects.toThrow(
      BadRequestException,
    )
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

    await expect(service.createSalary(makeInput())).rejects.toThrow(
      'snapshot boom',
    )

    expect(reportEventCreate).not.toHaveBeenCalled()
  })

  it('skips the outlier insert when none are flagged', async () => {
    const input = makeInput()
    input.outliers = []

    await service.createSalary(input)

    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('persists outliers resolving employeeOrdinal to the new employee id', async () => {
    const input = makeInputWithDetectedOutlier()
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

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
    expect(reportCreate.mock.calls[0][0]).not.toHaveProperty('outliersPostponed')
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
    expect(outlierBulkCreate.mock.calls[0][0][0]).not.toHaveProperty(
      'postponed',
    )
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

    await expect(service.createSalary(input)).rejects.toThrow(
      BadRequestException,
    )
    expect(reportCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('rejects an outlier row submitted for a non-outlier employee (extras)', async () => {
    // The single-employee fixture has no detected outliers — submitting one
    // row should be rejected as an extra by the submit-side guard.
    const input = makeInput()
    input.outliers = [
      {
        employeeOrdinal: 1,
        reason: 'r',
        action: 'a',
        signatureName: 'n',
        signatureRole: 'role',
      },
    ]

    await expect(service.createSalary(input)).rejects.toThrow(
      /non-outlier employee ordinal/,
    )
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('rejects when a detected outlier has no acknowledgement row (missing)', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outliers = []

    await expect(service.createSalary(input)).rejects.toThrow(
      /missing acknowledgement/,
    )
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('rejects postponement when the salary report has no detected outliers', async () => {
    const input = makeInput()
    input.outliersPostponed = true
    input.outliers = []

    await expect(service.createSalary(input)).rejects.toThrow(
      'Cannot postpone outlier explanations because this salary report has no detected outliers.',
    )
    expect(reportCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('submits a zero-outlier salary report normally when postponement is not requested', async () => {
    const input = makeInput()
    input.outliersPostponed = false
    input.outliers = []

    await service.createSalary(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('persists every outlier with NULL explanation columns when the report is postponed', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outliersPostponed = true
    input.outliers = [
      {
        employeeOrdinal: 1,
        // Explanation fields supplied here are ignored when the report is postponed.
        reason: 'should be discarded',
        action: 'should be discarded',
        signatureName: 'should be discarded',
        signatureRole: 'should be discarded',
      },
    ]

    await service.createSalary(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
    )
    expect(reportCreate.mock.calls[0][0]).not.toHaveProperty('outliersPostponed')
    expect(outlierBulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        reportEmployeeId: 'emp-0',
        reason: null,
        action: null,
        signatureName: null,
        signatureRole: null,
      }),
    ])

    // The SUBMITTED audit event snapshots the actual landing status —
    // POSTPONED for a postponed salary report. This is the historical signal
    // for "did this report ever postpone?" once status flips to SUBMITTED
    // after the applicant resolves outliers.
    expect(reportEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'SUBMITTED',
        reportStatus: ReportStatusEnum.POSTPONED,
      }),
    )
  })

  it('accepts a postponed report with bare acknowledgement rows (no explanations supplied)', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outliersPostponed = true
    input.outliers = [{ employeeOrdinal: 1 }]

    await service.createSalary(input)

    expect(outlierBulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        reportEmployeeId: 'emp-0',
        reason: null,
        action: null,
        signatureName: null,
        signatureRole: null,
      }),
    ])
  })

  it('rejects a non-postponed outlier with missing explanation fields', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outliers = [
      {
        employeeOrdinal: 1,
        reason: '',
        action: 'something',
        signatureName: 'somebody',
        signatureRole: '',
      },
    ]

    await expect(service.createSalary(input)).rejects.toThrow(
      /Outlier for employee ordinal .* missing required field\(s\): reason, signatureRole/,
    )
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
        companyNationalId: '5500000000',
      }),
    )

    // Equality submissions never set equalityReportId — that FK is SALARY-only.
    expect(reportCreate.mock.calls[0][0]).not.toHaveProperty('equalityReportId')

    expect(companyReportBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(companyReportBulkCreate.mock.calls[0][0][0]).toMatchObject({
      reportId: REPORT_ID,
      companyId: PARENT_COMPANY_ID,
      parentCompanyId: null,
      employeeCountCategory: CompanySizeEnum.LARGE,
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
        companyId: PARENT_COMPANY_ID,
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
      employeeCountCategory: CompanySizeEnum.MEDIUM,
    })
  })

  it('normalizes empty array employeeCountCategory values before writing company_report rows', async () => {
    companyFindAll.mockResolvedValueOnce([
      makeCompanyRow(
        PARENT_COMPANY_ID,
        [] as unknown as CompanySizeEnum,
      ),
    ])

    await service.createEquality(makeEqualityInput())

    expect(companyReportBulkCreate.mock.calls[0][0][0]).toMatchObject({
      companyId: PARENT_COMPANY_ID,
      employeeCountCategory: CompanySizeEnum.SMALL,
    })
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('empty employeeCountCategory array'),
      expect.objectContaining({ companyId: PARENT_COMPANY_ID }),
    )
  })

  it('propagates EQUALITY company_report failures before event creation', async () => {
    companyReportBulkCreate.mockRejectedValue(new Error('cr boom'))

    await expect(service.createEquality(makeEqualityInput())).rejects.toThrow(
      'cr boom',
    )

    expect(reportCreate).toHaveBeenCalled()
    expect(reportEventCreate).not.toHaveBeenCalled()
  })

  describe('idempotent replay on (providerType, providerId)', () => {
    const EXISTING_REPORT_ID = '00000000-0000-0000-0000-0000000000ee'

    it('SALARY: returns existing reportId without inserting when tuple already exists for the same company', async () => {
      const input = makeInput()
      input.providerType = ReportProviderEnum.ISLAND_IS
      input.providerId = 'island-is-application-uuid-1'

      // First findOne is the provider-tuple lookup → returns existing row.
      // No follow-up call is made because we short-circuit before
      // assertEqualityReportApproved.
      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_REPORT_ID,
        providerType: input.providerType,
        providerId: input.providerId,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      const result = await service.createSalary(input)

      expect(result).toEqual({ reportId: EXISTING_REPORT_ID })
      expect(reportCreate).not.toHaveBeenCalled()
      expect(companyReportBulkCreate).not.toHaveBeenCalled()
      expect(reportResultCreateForReport).not.toHaveBeenCalled()
      expect(reportEventCreate).not.toHaveBeenCalled()
    })

    it('SALARY: rejects with 409 when an existing tuple belongs to a different company', async () => {
      const input = makeInput()
      input.providerType = ReportProviderEnum.ISLAND_IS
      input.providerId = 'island-is-application-uuid-1'

      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_REPORT_ID,
        providerType: input.providerType,
        providerId: input.providerId,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: 'someone-else-company-id',
        parentCompanyId: null,
      })

      await expect(service.createSalary(input)).rejects.toThrow(
        ConflictException,
      )
      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('EQUALITY: returns existing reportId without inserting when tuple already exists for the same company', async () => {
      const input = makeEqualityInput()
      input.providerType = ReportProviderEnum.ISLAND_IS
      input.providerId = 'island-is-application-uuid-2'

      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_REPORT_ID,
        providerType: input.providerType,
        providerId: input.providerId,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      const result = await service.createEquality(input)

      expect(result).toEqual({ reportId: EXISTING_REPORT_ID })
      expect(reportCreate).not.toHaveBeenCalled()
      expect(companyReportBulkCreate).not.toHaveBeenCalled()
      expect(reportEventCreate).not.toHaveBeenCalled()
    })

    it('proceeds with insert when providerId is non-null but no existing tuple matches', async () => {
      const input = makeInput()
      input.providerType = ReportProviderEnum.ISLAND_IS
      input.providerId = 'island-is-application-uuid-3'

      // 1st findOne (provider tuple lookup) → null = no replay.
      // 2nd findOne (equality report lookup) → approved equality stays.
      reportFindOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: EQUALITY_REPORT_ID })

      const result = await service.createSalary(input)

      expect(result).toEqual({ reportId: REPORT_ID })
      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: 'island-is-application-uuid-3',
        }),
      )
    })

    it('skips the idempotency check entirely when providerId is null', async () => {
      // makeInput() defaults to providerType=SYSTEM, providerId=null.
      // The default reportFindOne mock returns {id: EQUALITY_REPORT_ID}, which
      // would falsely match the provider-tuple lookup if the check ran. The
      // fact that this still completes a successful insert proves the null
      // short-circuit fires before any findOne call.
      await service.createSalary(makeInput())

      expect(reportCreate).toHaveBeenCalled()
      expect(companyReportFindOne).not.toHaveBeenCalled()
    })
  })

  describe('in-flight sibling guard', () => {
    const PRIOR_REPORT_ID = '00000000-0000-0000-0000-0000000000aa'

    function mockPriorSibling(status: ReportStatusEnum, providerId = 'prior-1') {
      companyReportFindAll.mockResolvedValueOnce([
        { reportId: PRIOR_REPORT_ID },
      ])
      reportFindAll.mockResolvedValueOnce([
        { id: PRIOR_REPORT_ID, status, providerId },
      ])
    }

    it('SALARY: withdraws a SUBMITTED predecessor and emits a WITHDRAWN event linked to the new report', async () => {
      mockPriorSibling(ReportStatusEnum.SUBMITTED, 'prior-providerId')

      const result = await service.createSalary(makeInput())

      expect(result).toEqual({ reportId: REPORT_ID })
      expect(reportUpdate).toHaveBeenCalledWith(
        { status: ReportStatusEnum.WITHDRAWN },
        { where: { id: [PRIOR_REPORT_ID] } },
      )
      // SUBMITTED event for the new report + WITHDRAWN event for the prior.
      expect(reportEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          eventType: 'SUBMITTED',
        }),
      )
      expect(reportEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: PRIOR_REPORT_ID,
          eventType: 'WITHDRAWN',
          reportStatus: ReportStatusEnum.WITHDRAWN,
          relatedReportId: REPORT_ID,
          actorUserId: null,
        }),
      )
    })

    it('SALARY: rejects with 409 when an IN_REVIEW predecessor exists, no insert, no withdraw, no events', async () => {
      mockPriorSibling(ReportStatusEnum.IN_REVIEW, 'prior-providerId')

      await expect(service.createSalary(makeInput())).rejects.toThrow(
        ConflictException,
      )

      expect(reportCreate).not.toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
      expect(reportEventCreate).not.toHaveBeenCalled()
    })

    it('SALARY: rejects with 409 when a POSTPONED predecessor exists', async () => {
      mockPriorSibling(ReportStatusEnum.POSTPONED, 'prior-providerId')

      await expect(service.createSalary(makeInput())).rejects.toThrow(
        ConflictException,
      )

      expect(reportCreate).not.toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('SALARY: proceeds normally when no in-flight sibling exists', async () => {
      // Default mocks: companyReportFindAll → [], reportFindAll → [].
      await service.createSalary(makeInput())

      expect(reportCreate).toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
      // No WITHDRAWN event emitted.
      const withdrawnEventCalls = reportEventCreate.mock.calls.filter(
        ([row]) => row.eventType === 'WITHDRAWN',
      )
      expect(withdrawnEventCalls).toHaveLength(0)
    })

    it('SALARY: ignores prior reports in terminal statuses (APPROVED / DENIED / SUPERSEDED / WITHDRAWN)', async () => {
      companyReportFindAll.mockResolvedValueOnce([
        { reportId: PRIOR_REPORT_ID },
      ])
      // The Sequelize WHERE clause filters status server-side, so a terminal
      // prior simulates as "findAll returns no in-flight rows for this filter".
      reportFindAll.mockResolvedValueOnce([])

      await service.createSalary(makeInput())

      expect(reportCreate).toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('SALARY: scopes the guard by type — an in-flight EQUALITY does not block a new SALARY submission', async () => {
      // The guard queries reportModel.findAll with WHERE type=SALARY. If an
      // EQUALITY is in flight, the SQL filter excludes it, so the mock for the
      // SALARY-scoped findAll returns [].
      companyReportFindAll.mockResolvedValueOnce([
        { reportId: PRIOR_REPORT_ID },
      ])
      reportFindAll.mockResolvedValueOnce([])

      await service.createSalary(makeInput())

      // The findAll WHERE asserted explicitly for confidence.
      expect(reportFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: ReportTypeEnum.SALARY }),
        }),
      )
      expect(reportCreate).toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('SALARY: locks the company row to serialise concurrent submits', async () => {
      mockPriorSibling(ReportStatusEnum.SUBMITTED)

      await service.createSalary(makeInput())

      expect(companyFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PARENT_COMPANY_ID },
          lock: true,
        }),
      )
    })

    it('EQUALITY: withdraws a SUBMITTED predecessor and emits a linked WITHDRAWN event', async () => {
      mockPriorSibling(ReportStatusEnum.SUBMITTED, 'prior-equality')

      const result = await service.createEquality(makeEqualityInput())

      expect(result).toEqual({ reportId: REPORT_ID })
      expect(reportUpdate).toHaveBeenCalledWith(
        { status: ReportStatusEnum.WITHDRAWN },
        { where: { id: [PRIOR_REPORT_ID] } },
      )
      expect(reportEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: PRIOR_REPORT_ID,
          eventType: 'WITHDRAWN',
          relatedReportId: REPORT_ID,
        }),
      )
    })

    it('EQUALITY: rejects with 409 when an IN_REVIEW predecessor exists', async () => {
      mockPriorSibling(ReportStatusEnum.IN_REVIEW, 'prior-equality')

      await expect(service.createEquality(makeEqualityInput())).rejects.toThrow(
        ConflictException,
      )

      expect(reportCreate).not.toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('EQUALITY: scopes the guard by type — an in-flight SALARY does not block a new EQUALITY submission', async () => {
      companyReportFindAll.mockResolvedValueOnce([
        { reportId: PRIOR_REPORT_ID },
      ])
      reportFindAll.mockResolvedValueOnce([])

      await service.createEquality(makeEqualityInput())

      expect(reportFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: ReportTypeEnum.EQUALITY }),
        }),
      )
      expect(reportCreate).toHaveBeenCalled()
    })

    it('withdraws multiple SUBMITTED predecessors defensively (data drift before the guard was added)', async () => {
      const OTHER_PRIOR_ID = '00000000-0000-0000-0000-0000000000bb'
      companyReportFindAll.mockResolvedValueOnce([
        { reportId: PRIOR_REPORT_ID },
        { reportId: OTHER_PRIOR_ID },
      ])
      reportFindAll.mockResolvedValueOnce([
        {
          id: PRIOR_REPORT_ID,
          status: ReportStatusEnum.SUBMITTED,
          providerId: 'a',
        },
        {
          id: OTHER_PRIOR_ID,
          status: ReportStatusEnum.SUBMITTED,
          providerId: 'b',
        },
      ])

      await service.createSalary(makeInput())

      expect(reportUpdate).toHaveBeenCalledWith(
        { status: ReportStatusEnum.WITHDRAWN },
        { where: { id: [PRIOR_REPORT_ID, OTHER_PRIOR_ID] } },
      )
      // Two WITHDRAWN events, one per prior, both pointing at the new report.
      const withdrawnCalls = reportEventCreate.mock.calls.filter(
        ([row]) => row.eventType === 'WITHDRAWN',
      )
      expect(withdrawnCalls).toHaveLength(2)
      expect(withdrawnCalls.map(([row]) => row.reportId)).toEqual([
        PRIOR_REPORT_ID,
        OTHER_PRIOR_ID,
      ])
      expect(withdrawnCalls.every(([row]) => row.relatedReportId === REPORT_ID))
        .toBe(true)
    })
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
    isatCategory: 'J62.01',
  }
}

function makeCompanyRow(
  id: string,
  employeeCountCategory: CompanySizeEnum,
): CompanyModel {
  return {
    id,
    employeeCountCategory,
  } as CompanyModel
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

/**
 * Variant of makeInput engineered so that `detectOutliers` flags ordinal 1 as
 * the lone outlier under the default 3.9% threshold (= 1.95% half-band around
 * the regression prediction at that exact score).
 */
function makeInputWithDetectedOutlier(): CreateReportDto {
  const base = makeInput()
  base.parsed.criteria[0].subCriteria[0].steps = [
    { order: 1, description: 'score 100', score: 100 },
    { order: 2, description: 'score 200', score: 200 },
    { order: 3, description: 'score 300', score: 300 },
    { order: 4, description: 'score 400', score: 400 },
    { order: 5, description: 'score 500', score: 500 },
    { order: 6, description: 'score 600', score: 600 },
    { order: 7, description: 'score 700', score: 700 },
  ]
  base.parsed.roles[0].stepAssignments = []
  base.parsed.employees = [
    [1, GenderEnum.FEMALE, 850000],
    [2, GenderEnum.MALE, 1000000],
    [3, GenderEnum.MALE, 1100000],
    [4, GenderEnum.MALE, 1200000],
    [5, GenderEnum.MALE, 1300000],
    [6, GenderEnum.MALE, 1400000],
    [7, GenderEnum.MALE, 1500000],
  ].map(([ordinal, gender, baseSalary]) => ({
    ordinal: ordinal as number,
    identifier: `TVE-00${ordinal}`,
    roleTitle: 'Framkvaemdastjori',
    education: EducationEnum.MASTER,
    gender: gender as GenderEnum,
    field: 'Mgmt',
    department: 'Mgmt',
    startDate: '2021-01-01',
    workRatio: 1,
    baseSalary: baseSalary as number,
    additionalSalary: 100000,
    bonusSalary: null,
    personalStepAssignments: [
      {
        criterionTitle: 'Abyrgd',
        subTitle: 'Abyrgd a fólki',
        stepOrder: ordinal as number,
      },
    ],
  }))
  return base
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
