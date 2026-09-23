import addMonths from 'date-fns/addMonths'
import format from 'date-fns/format'
import subMonths from 'date-fns/subMonths'
import { UniqueConstraintError } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { analyzeSalaryPayload } from '../report-statistics/lib/salary-analysis'

/**
 * The channel options, passed beside the body rather than in it. They are not
 * fields on `CreateReportDto` precisely so a request cannot set them — see
 * `CreateSalaryOptions`.
 */
const POSTPONE_UNEXPLAINED = { postponeUnexplainedOutliers: true }
const WITHDRAW_POSTPONED = { withdrawPostponedSibling: true }

/**
 * The seeded threshold, named so the preview and the submission below are given
 * the same number — comparing their verdicts under different benchmarks would
 * compare nothing.
 */
const BENCHMARK_PERCENT = 3.9

import { CompanySizeEnum } from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import { DEFAULT_OUTLIER_GROUP_NAME } from '../constants'
import {
  padToSemanticValidity,
  personalCriterion,
} from '../report/lib/parsed-payload.testing'
import { REPORT_IDENTIFIER_INDEX } from '../report/lib/report-identifier'
import {
  EqualityCoverageSourceEnum,
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'
import { IReportService } from '../report/report.service.interface'
import { IReportAutoReviewService } from '../report-auto-review/report-auto-review.service.interface'
import { ReportContentService } from '../report-content/report-content.service'
import { IReportContentService } from '../report-content/report-content.service.interface'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
import { ReportCriterionModel } from '../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { ReportFinalizeService } from '../report-finalize/report-finalize.service'
import { IReportFinalizeService } from '../report-finalize/report-finalize.service.interface'
import { IReportIdentifierService } from '../report-identifier/report-identifier.service.interface'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { CreateEqualityReportDto } from './dto/create-equality-report.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { ReportCreateService } from './report-create.service'

const REPORT_ID = 'report-id-1'
const EQUALITY_REPORT_ID = '00000000-0000-0000-0000-00000000eee1'

// A payroll month inside the API's 36-month reporting window, derived from the
// clock rather than hardcoded — a literal month would silently age out of the
// bound and start failing years from now.
const PERIOD_MONTH = format(subMonths(new Date(), 1), 'yyyy-MM')
const PERIOD_INPUT = `${PERIOD_MONTH}-15`
const PERIOD_STORED = `${PERIOD_MONTH}-01`
// Same reasoning as PERIOD_MONTH above, in the other direction: `remedyDate`
// only accepts a future date inside the next reporting cycle, so a literal
// would pass today and start failing the day it went by.
const REMEDY_DATE = format(addMonths(new Date(), 12), 'yyyy-MM-dd')
const PARENT_COMPANY_ID = '00000000-0000-0000-0000-000000000c01'
const SUBSIDIARY_COMPANY_ID = '00000000-0000-0000-0000-000000000c02'

/** What the stubbed `IReportIdentifierService.allocate` hands back. */
const IDENTIFIER = 'KTPQZW'

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
  let allocate: jest.Mock
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
  let outlierGroupCreate: jest.Mock
  let criterionCreate: jest.Mock
  let subCriterionCreate: jest.Mock
  let subCriterionStepBulkCreate: jest.Mock
  let reportResultCreateForReport: jest.Mock
  let autoReviewEvaluate: jest.Mock
  let resolveEqualityCoverage: jest.Mock
  let configGetByKey: jest.Mock

  beforeEach(async () => {
    reportCreate = jest.fn().mockResolvedValue({ id: REPORT_ID })
    reportFindOne = jest.fn().mockResolvedValue({ id: EQUALITY_REPORT_ID })
    reportFindAll = jest.fn().mockResolvedValue([])
    allocate = jest.fn().mockResolvedValue(IDENTIFIER)
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
    let groupSeq = 0
    outlierGroupCreate = jest.fn(async (row) => ({
      ...row,
      id: `group-${groupSeq++}`,
    }))
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
    resolveEqualityCoverage = jest.fn().mockResolvedValue(null)
    autoReviewEvaluate = jest.fn().mockResolvedValue({
      decision: AutoReviewDecisionEnum.AUTO_APPROVE,
      reason: 'Engin frávik greind.',
      signals: {},
    })
    // Default to a generous threshold so existing fixtures (no salary
    // outliers in their parsed payload) don't accidentally flip into
    // outlier-detected territory and fail submit-side guard checks.
    configGetByKey = jest.fn().mockResolvedValue({
      key: 'salary_difference_threshold_percent',
      value: String(BENCHMARK_PERCENT),
    })

    const module = await Test.createTestingModule({
      providers: [
        ReportCreateService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: IReportIdentifierService, useValue: { allocate } },
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
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: { create: outlierGroupCreate },
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
          provide: IReportContentService,
          useClass: ReportContentService,
        },
        {
          provide: IReportResultService,
          useValue: { createForReport: reportResultCreateForReport },
        },
        {
          provide: IReportAutoReviewService,
          useValue: { evaluate: autoReviewEvaluate },
        },
        {
          provide: IReportFinalizeService,
          useClass: ReportFinalizeService,
        },
        {
          provide: IReportService,
          useValue: { resolveEqualityCoverage },
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

    expect(result).toMatchObject({ reportId: REPORT_ID, replayed: false })

    expect(reportFindOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: EQUALITY_REPORT_ID,
          type: ReportTypeEnum.EQUALITY,
        }),
        // The named equality report must cover the submitting company (F8).
        include: [
          expect.objectContaining({
            where: { companyId: PARENT_COMPANY_ID },
            required: true,
          }),
        ],
      }),
    )

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReportTypeEnum.SALARY,
        status: 'SUBMITTED',
        equalityReportId: EQUALITY_REPORT_ID,
        companyAdminEmail: 'admin@example.is',
        // Snapshotted onto the row itself, not merely mapped into the create
        // DTO — application.service.spec covers the mapping, nothing covered
        // the write until here.
        contactTitle: 'Starfsmannastjóri',
        companyNationalId: '5500000000',
        // Declared basis persisted, month normalised to the 1st.
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: PERIOD_STORED,
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

    // 1 role, 1 employee, and five criteria with one sub-criterion each: the
    // job-based Abyrgd, the personal one, and the three mandatory job-based
    // types `padToSemanticValidity` supplies. A valid salary report cannot
    // have fewer — that is the rule the payload gate now enforces.
    expect(roleBulkCreate.mock.calls[0][0]).toHaveLength(1)
    expect(criterionCreate).toHaveBeenCalledTimes(5)
    expect(subCriterionCreate).toHaveBeenCalledTimes(5)
    expect(subCriterionStepBulkCreate.mock.calls[0][0]).toHaveLength(2)

    // Role step assignments and the personal one both resolve. Four role
    // assignments, not one: a role must be scored on every job-based
    // sub-criterion, which is four of them once the payload is a valid report.
    expect(roleStepBulkCreate.mock.calls[0][0]).toHaveLength(4)
    expect(roleStepBulkCreate.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportEmployeeRoleId: 'role-0',
        }),
      ]),
    )
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

    // Soft auto-review verdict recorded as a system event (no human actor).
    expect(autoReviewEvaluate).toHaveBeenCalledWith(REPORT_ID)
    expect(reportEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        eventType: 'SYSTEM_AUTO_REVIEW',
        actorUserId: null,
        systemDecision: AutoReviewDecisionEnum.AUTO_APPROVE,
        reason: 'Engin frávik greind.',
        companyId: PARENT_COMPANY_ID,
      }),
    )
  })

  it('rejects a salary submission that does not declare the salary-data basis', async () => {
    const input = makeInput()
    // @ts-expect-error — the DTO requires it; this is the wire-level omission.
    delete input.salaryDataBasis

    await expect(service.createSalary(input)).rejects.toThrow(
      BadRequestException,
    )
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('rejects a MONTH basis that does not state which month', async () => {
    const input = makeInput()
    input.salaryDataPeriod = null

    await expect(service.createSalary(input)).rejects.toThrow(
      BadRequestException,
    )
    expect(reportCreate).not.toHaveBeenCalled()
  })

  it('stores no month for a twelve-month average, even if one is sent', async () => {
    const input = makeInput()
    input.salaryDataBasis = SalaryDataBasisEnum.AVERAGE

    await service.createSalary(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
        salaryDataPeriod: null,
      }),
    )
  })

  // The overlapping-assignment case is no longer reachable through this
  // service: a role owns the job-based criteria and an employee owns only the
  // personal ones, so the two cannot name the same sub-criterion and the
  // payload gate refuses a submission where they do. `computeEmployeeScores`
  // still dedups, defensively, and is tested for it directly — see
  // employee-scores.spec.ts.

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
    input.outlierGroups = []

    await service.createSalary(input)

    expect(outlierGroupCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('persists a group + outlier rows resolving employeeOrdinal to the new employee id', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outlierGroups = [
      {
        name: 'Parental leave',
        reason: 'On parental leave for 6 months',
        action: 'No adjustment, salary frozen for the period',
        signatureName: 'Anna Admin',
        signatureRole: 'HR Manager',
        remedyDate: REMEDY_DATE,
        employeeOrdinals: [1],
      },
    ]

    await service.createSalary(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
    expect(reportCreate.mock.calls[0][0]).not.toHaveProperty(
      'outliersPostponed',
    )

    // One group row carrying the explanation...
    expect(outlierGroupCreate).toHaveBeenCalledTimes(1)
    expect(outlierGroupCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        name: 'Parental leave',
        reason: 'On parental leave for 6 months',
        action: 'No adjustment, salary frozen for the period',
        signatureName: 'Anna Admin',
        signatureRole: 'HR Manager',
        remedyDate: REMEDY_DATE,
      }),
    )

    // ...and one thin outlier row pointing at that group.
    expect(outlierBulkCreate).toHaveBeenCalledTimes(1)
    expect(outlierBulkCreate.mock.calls[0][0]).toEqual([
      { reportEmployeeId: 'emp-0', groupId: 'group-0' },
    ])
  })

  it('defaults the group name when none is supplied', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outlierGroups = [
      {
        reason: 'r',
        action: 'a',
        signatureName: 'n',
        signatureRole: 'role',
        remedyDate: REMEDY_DATE,
        employeeOrdinals: [1],
      },
    ]

    await service.createSalary(input)

    expect(outlierGroupCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: DEFAULT_OUTLIER_GROUP_NAME }),
    )
  })

  it('rejects a group referencing a non-outlier employee ordinal (extras)', async () => {
    // The single-employee fixture has no detected outliers — referencing one
    // should be rejected as an extra by the submit-side guard.
    const input = makeInput()
    input.outlierGroups = [
      {
        reason: 'r',
        action: 'a',
        signatureName: 'n',
        signatureRole: 'role',
        remedyDate: REMEDY_DATE,
        employeeOrdinals: [1],
      },
    ]

    await expect(service.createSalary(input)).rejects.toThrow(
      /non-outlier employee ordinal/,
    )
    expect(outlierGroupCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('rejects when detected outliers are present but no groups are provided', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outlierGroups = []

    await expect(service.createSalary(input)).rejects.toThrow(
      /no outlier groups were provided/,
    )
    expect(outlierGroupCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('rejects an ordinal that appears in more than one group', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outlierGroups = [
      {
        reason: 'r',
        action: 'a',
        signatureName: 'n',
        signatureRole: 'role',
        remedyDate: REMEDY_DATE,
        employeeOrdinals: [1],
      },
      {
        reason: 'r2',
        action: 'a2',
        signatureName: 'n2',
        signatureRole: 'role2',
        remedyDate: REMEDY_DATE,
        employeeOrdinals: [1],
      },
    ]

    await expect(service.createSalary(input)).rejects.toThrow(
      /appears in more than one outlier group/,
    )
    expect(outlierGroupCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  it('rejects postponement when the salary report has no detected outliers', async () => {
    const input = makeInput()
    input.outliersPostponed = true
    input.outlierGroups = []

    await expect(service.createSalary(input)).rejects.toThrow(
      'Cannot postpone outlier explanations because this salary report has no detected outliers.',
    )
    expect(reportCreate).not.toHaveBeenCalled()
    expect(outlierGroupCreate).not.toHaveBeenCalled()
  })

  it('submits a zero-outlier salary report normally when postponement is not requested', async () => {
    const input = makeInput()
    input.outliersPostponed = false
    input.outlierGroups = []

    await service.createSalary(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
    expect(outlierGroupCreate).not.toHaveBeenCalled()
    expect(outlierBulkCreate).not.toHaveBeenCalled()
  })

  /**
   * The cross-check the dry run rests on.
   *
   * `POST /partner/reports/salary-analysis` exists so a vendor can find out what
   * a filing would say before filing it. That is worth something only if the two
   * answer the same question — a preview that accepts what the submission
   * refuses sends someone off to build against a payload that cannot be filed,
   * and this codebase has been caught by that exact bug three separate times.
   *
   * So the guarantee under test is not "both call the same helper", which is an
   * implementation detail a refactor can quietly undo. It is that for one
   * payload, both reach the same verdict. These run real payloads through both
   * paths and compare the answers.
   */
  describe('the dry run and the submission agree', () => {
    type Verdict = 'accepted' | 'refused'

    const previewVerdict = (input: CreateReportDto): Verdict => {
      try {
        analyzeSalaryPayload(input.parsed, BENCHMARK_PERCENT)
        return 'accepted'
      } catch {
        return 'refused'
      }
    }

    const submitVerdict = async (input: CreateReportDto): Promise<Verdict> => {
      try {
        await service.createSalary(input)
        return 'accepted'
      } catch (error) {
        // Only a payload refusal counts as disagreement. A conflict or a
        // missing equality report is the submission answering a question the
        // preview never asks, and counting those would fail this test for
        // reasons that have nothing to do with drift.
        return error instanceof BadRequestException ? 'refused' : 'accepted'
      }
    }

    /**
     * Each row pins the verdict it expects, not only that the two agree. Without
     * it, weakening the shared validator moves both paths together and every
     * row still passes on `accepted === accepted`.
     *
     * The last three rows are the semantics-only rules — the half
     * `assertParsedPayloadIntegrity` does not enforce. They are the ones that
     * fail if either path is pointed at the weaker validator; the structural
     * rows above them survive that mutation by design.
     */
    it.each<[string, (input: CreateReportDto) => CreateReportDto, Verdict]>([
      ['a payload both accept', (input) => input, 'accepted'],
      [
        'a step assignment that resolves to nothing',
        (input) => {
          input.parsed.roles[0].stepAssignments[0].stepOrder = 99
          return input
        },
        'refused',
      ],
      [
        'an employee whose role is not in roles[]',
        (input) => {
          input.parsed.employees[0].roleTitle = 'Engin slík staða'
          return input
        },
        'refused',
      ],
      [
        'a sub-criterion weight total that is not 100',
        (input) => {
          input.parsed.criteria[0].subCriteria[0].weight += 5
          return input
        },
        'refused',
      ],
      [
        'a mandatory criterion type that is absent',
        (input) => {
          // Retyped rather than removed: removing it would also orphan the
          // role's assignments to it, a structural failure that would pass
          // this row against the weaker validator too.
          const strain = input.parsed.criteria.find(
            (c) => c.type === ReportCriterionTypeEnum.STRAIN,
          )
          if (!strain) throw new Error('fixture has no STRAIN criterion')
          strain.type = ReportCriterionTypeEnum.RESPONSIBILITY
          return input
        },
        'refused',
      ],
      [
        'an employee left unclassified on a personal sub-criterion',
        (input) => {
          input.parsed.employees[0].personalStepAssignments = []
          return input
        },
        'refused',
      ],
    ])('reaches the same verdict on %s', async (_case, mutate, expected) => {
      const preview = previewVerdict(mutate(makeInput()))
      const submit = await submitVerdict(mutate(makeInput()))

      expect(preview).toBe(expected)
      expect(submit).toBe(expected)
    })
  })

  /**
   * The partner channel's half of the postponement decision.
   *
   * `outliersPostponed` asks a caller to state something it can only know by
   * previewing first. A channel that files the payroll once cannot answer it:
   * set it and a clean payroll is refused, leave it and an unexplained outlier
   * is. `postponeUnexplainedOutliers` asks the question the other way round and
   * is answered here, where detection has already run.
   */
  describe('postponeUnexplainedOutliers', () => {
    it('files POSTPONED when outliers are detected and no groups were sent', async () => {
      const input = makeInputWithDetectedOutlier()
      input.outlierGroups = []

      const result = await service.createSalary(input, POSTPONE_UNEXPLAINED)

      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
      )
      expect(result.status).toBe(ReportStatusEnum.POSTPONED)
    })

    /**
     * The ordinals come back on the submission itself, because this is the only
     * moment the caller learns it owes anything — it never ran a preview. They
     * are the caller's own ordinals, so a payroll system maps them straight back
     * to its rows.
     */
    it('returns the ordinals still owed an explanation', async () => {
      const input = makeInputWithDetectedOutlier()
      input.outlierGroups = []

      const result = await service.createSalary(input, POSTPONE_UNEXPLAINED)

      expect(result.unexplainedOutlierOrdinals).toEqual([1])
    })

    it('files SUBMITTED when the payroll is clean, rather than refusing', async () => {
      const input = makeInput()
      input.outlierGroups = []

      const result = await service.createSalary(input, POSTPONE_UNEXPLAINED)

      expect(result.status).toBe(ReportStatusEnum.SUBMITTED)
      expect(result.unexplainedOutlierOrdinals).toBeUndefined()
      expect(outlierGroupCreate).not.toHaveBeenCalled()
    })

    /**
     * The difference from `outliersPostponed`, which throws here. A caller that
     * could not preview has done nothing wrong by sending a clean payroll with
     * no groups, and refusing it would put back the round trip this removes.
     */
    it('does not refuse a clean payroll the way outliersPostponed does', async () => {
      const postponed = makeInput()
      postponed.outlierGroups = []
      postponed.outliersPostponed = true

      await expect(service.createSalary(postponed)).rejects.toThrow(
        /Cannot postpone/,
      )
    })

    it('still validates the partition when groups are sent', async () => {
      const input = makeInputWithDetectedOutlier()
      input.outlierGroups = [
        {
          reason: 'r',
          action: 'a',
          signatureName: 'n',
          signatureRole: 'role',
          remedyDate: REMEDY_DATE,
          employeeOrdinals: [99],
        },
      ]

      await expect(
        service.createSalary(input, POSTPONE_UNEXPLAINED),
      ).rejects.toThrow(/non-outlier employee ordinal/)
    })

    /**
     * The branch between the two outcomes, and the one a caller reaches by
     * accident: supplying groups turns the postpone *off*, so a partition that
     * does not match the detected set is refused exactly as it is without the
     * option — never partially postponed. Otherwise a vendor that mis-modelled
     * its groups would file a report whose unexplained rows nobody agreed to
     * defer.
     *
     * Asserted through a wrong partition rather than a strictly-partial one on
     * purpose. Reaching the "missing ordinals" message specifically needs a
     * minimum set with two members, which means a fixture tuned against the
     * wage-gap regression — and a test that depends on the detection maths
     * producing exactly two outliers breaks every time that maths is touched,
     * which is worse than not having it. The partition rules themselves are
     * covered by the non-postpone specs above; what is new here is that the
     * option does not soften them.
     */
    it('refuses a mismatched partition rather than postponing the remainder', async () => {
      const input = makeInputWithDetectedOutlier()
      input.outlierGroups = [
        {
          reason: 'r',
          action: 'a',
          signatureName: 'n',
          signatureRole: 'role',
          remedyDate: REMEDY_DATE,
          employeeOrdinals: [4],
        },
      ]

      await expect(
        service.createSalary(input, POSTPONE_UNEXPLAINED),
      ).rejects.toThrow(BadRequestException)
      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('files SUBMITTED in one call when the groups cover the detected set', async () => {
      const input = makeInputWithDetectedOutlier()
      input.outlierGroups = [
        {
          reason: 'r',
          action: 'a',
          signatureName: 'n',
          signatureRole: 'role',
          remedyDate: REMEDY_DATE,
          employeeOrdinals: [1],
        },
      ]

      const result = await service.createSalary(input, POSTPONE_UNEXPLAINED)

      expect(result.status).toBe(ReportStatusEnum.SUBMITTED)
      expect(result.unexplainedOutlierOrdinals).toBeUndefined()
    })
  })

  it('creates a single default group with NULL explanation when postponed', async () => {
    const input = makeInputWithDetectedOutlier()
    input.outliersPostponed = true
    // Any supplied groups are ignored on the postpone path.
    input.outlierGroups = undefined

    await service.createSalary(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
    )
    expect(reportCreate.mock.calls[0][0]).not.toHaveProperty(
      'outliersPostponed',
    )

    // Single default group with all explanation fields NULL...
    expect(outlierGroupCreate).toHaveBeenCalledTimes(1)
    expect(outlierGroupCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        name: DEFAULT_OUTLIER_GROUP_NAME,
        reason: null,
        action: null,
        signatureName: null,
        signatureRole: null,
        remedyDate: null,
      }),
    )

    // ...covering the detected outlier via a thin row.
    expect(outlierBulkCreate).toHaveBeenCalledWith([
      { reportEmployeeId: 'emp-0', groupId: 'group-0' },
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

  // ── createEquality path ────────────────────────────────────────────

  it('creates an EQUALITY report with content + company snapshot + event', async () => {
    const result = await service.createEquality(makeEqualityInput())

    expect(result).toMatchObject({ reportId: REPORT_ID, replayed: false })

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ReportTypeEnum.EQUALITY,
        status: 'SUBMITTED',
        importedFromExcel: false,
        equalityReportContent: 'A narrative gender-equality plan.',
        contactTitle: 'Starfsmannastjóri',
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

    // EQUALITY reports are still audited — the evaluator abstains internally.
    expect(autoReviewEvaluate).toHaveBeenCalledWith(REPORT_ID)
    expect(reportEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: REPORT_ID,
        eventType: 'SYSTEM_AUTO_REVIEW',
        actorUserId: null,
      }),
    )
  })

  it('persists average employee counts on an EQUALITY report when provided', async () => {
    const input = makeEqualityInput()
    input.averageEmployeeMaleCount = 12
    input.averageEmployeeFemaleCount = 18
    input.averageEmployeeNeutralCount = 2

    await service.createEquality(input)

    expect(reportCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        averageEmployeeMaleCount: 12,
        averageEmployeeFemaleCount: 18,
        averageEmployeeNeutralCount: 2,
      }),
    )
  })

  it('leaves average employee counts undefined on an EQUALITY report when omitted', async () => {
    await service.createEquality(makeEqualityInput())

    const createArgs = reportCreate.mock.calls[0][0]
    expect(createArgs.averageEmployeeMaleCount).toBeUndefined()
    expect(createArgs.averageEmployeeFemaleCount).toBeUndefined()
    expect(createArgs.averageEmployeeNeutralCount).toBeUndefined()
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

  it('propagates EQUALITY company_report failures before event creation', async () => {
    companyReportBulkCreate.mockRejectedValue(new Error('cr boom'))

    await expect(service.createEquality(makeEqualityInput())).rejects.toThrow(
      'cr boom',
    )

    expect(reportCreate).toHaveBeenCalled()
    expect(reportEventCreate).not.toHaveBeenCalled()
  })

  // Reviewers search reports by identifier and it prints on the PDF, so a row
  // created without one is effectively unfindable. No caller supplies it — it
  // is minted here — and nothing else in this suite pins that, since every
  // other create assertion uses `objectContaining`.
  describe('server-side identifier minting', () => {
    it('SALARY: mints an identifier and writes it onto the report row', async () => {
      await service.createSalary(makeInput())

      expect(allocate).toHaveBeenCalledTimes(1)
      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: IDENTIFIER }),
      )
    })

    it('EQUALITY: mints an identifier and writes it onto the report row', async () => {
      await service.createEquality(makeEqualityInput())

      expect(allocate).toHaveBeenCalledTimes(1)
      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({ identifier: IDENTIFIER }),
      )
    })

    it('maps an identifier collision to a retryable error, not a 400', async () => {
      // The index is the backstop the probe cannot be: reaching it means two
      // concurrent requests drew the same code. Left uncaught, the shared
      // SequelizeExceptionFilter maps it to 400 and island.is treats a
      // perfectly good submission as unretryable.
      const collision = new UniqueConstraintError({})
      Object.defineProperty(collision, 'parent', {
        value: Object.assign(new Error('duplicate key'), {
          constraint: REPORT_IDENTIFIER_INDEX,
        }),
      })
      reportCreate.mockRejectedValueOnce(collision)

      await expect(service.createSalary(makeInput())).rejects.toThrow(
        ServiceUnavailableException,
      )
    })

    it('leaves an unrelated write failure untouched', async () => {
      reportCreate.mockRejectedValueOnce(new Error('connection reset'))

      await expect(service.createSalary(makeInput())).rejects.toThrow(
        'connection reset',
      )
    })

    it('does not burn a code on an idempotent replay', async () => {
      // The tuple lookup short-circuits before the row is created, so a retry
      // from upstream must not consume an identifier.
      const input = makeInput()
      input.providerType = ReportProviderEnum.ISLAND_IS
      input.providerId = 'island-is-application-uuid-replay'

      reportFindOne.mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-0000000000ee',
        providerType: input.providerType,
        providerId: input.providerId,
        type: ReportTypeEnum.SALARY,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      await service.createSalary(input)

      expect(allocate).not.toHaveBeenCalled()
      expect(reportCreate).not.toHaveBeenCalled()
    })
  })

  describe('resolving the equality report when the caller names none', () => {
    const RESOLVED_EQUALITY_ID = '00000000-0000-0000-0000-0000000000e9'

    const withoutEqualityReportId = (): CreateReportDto => {
      const input = makeInput()
      input.equalityReportId = undefined

      return input
    }

    it("resolves the company's active report and files against it", async () => {
      const input = withoutEqualityReportId()
      // Resolution delegates to the same lookup the eligibility routes answer
      // from; the remaining `findOne` is the schema invariant check.
      resolveEqualityCoverage.mockResolvedValue({
        source: EqualityCoverageSourceEnum.REPORT,
        report: { id: RESOLVED_EQUALITY_ID },
        legacyValidUntil: null,
      })
      reportFindOne.mockResolvedValueOnce({ id: RESOLVED_EQUALITY_ID })

      await service.createSalary(input)

      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          equalityReportId: RESOLVED_EQUALITY_ID,
          equalitySource: EqualityCoverageSourceEnum.REPORT,
          equalityLegacyValidUntil: null,
        }),
      )
    })

    // The companies this whole change is for: covered by a certificate on the
    // retired register, which mints no `report` row, so there is no id to link
    // and requiring one refused the submission outright. The row records WHY
    // the FK is null rather than leaving a null to be interpreted, and copies
    // the stated expiry because the next register load replaces the archive
    // wholesale.
    it('files against legacy coverage, recording the basis and the stated expiry', async () => {
      const input = withoutEqualityReportId()
      resolveEqualityCoverage.mockResolvedValue({
        source: EqualityCoverageSourceEnum.LEGACY,
        report: null,
        legacyValidUntil: '2028-03-31',
      })

      await service.createSalary(input)

      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          equalityReportId: null,
          equalitySource: EqualityCoverageSourceEnum.LEGACY,
          equalityLegacyValidUntil: '2028-03-31',
        }),
      )
    })

    it('does not run the approved-report invariant check on legacy coverage', async () => {
      // There is no report to check. Running it would look up `null` and 404 a
      // submission the eligibility route had just approved.
      const input = withoutEqualityReportId()
      resolveEqualityCoverage.mockResolvedValue({
        source: EqualityCoverageSourceEnum.LEGACY,
        report: null,
        legacyValidUntil: '2028-03-31',
      })

      await service.createSalary(input)

      expect(reportFindOne).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: ReportTypeEnum.EQUALITY,
          }),
        }),
      )
    })

    it('refuses a new submission when nothing covers the company', async () => {
      const input = withoutEqualityReportId()
      resolveEqualityCoverage.mockResolvedValue(null)

      await expect(service.createSalary(input)).rejects.toThrow(
        NotFoundException,
      )
      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('replays an already-filed report even after its equality report has lapsed', async () => {
      // The regression. Resolution used to happen while the creation input was
      // built, i.e. BEFORE this replay check, so a retry of a report that was
      // successfully filed answered 404 once its equality report stopped being
      // active — a precondition for NEW submissions making an old one
      // un-retryable, and an integrator reading a filed report as failed.
      const input = withoutEqualityReportId()
      const FILED_REPORT_ID = '00000000-0000-0000-0000-0000000000ea'
      input.providerType = ReportProviderEnum.OTHER
      input.providerId = '5555555555:vendor-submission-1'

      // The tuple lookup finds the earlier submission; every later `findOne`
      // answers null, so an equality resolution reaching the database would
      // throw instead of replaying.
      reportFindOne
        .mockResolvedValueOnce({
          id: FILED_REPORT_ID,
          providerType: input.providerType,
          providerId: input.providerId,
          type: ReportTypeEnum.SALARY,
        })
        .mockResolvedValue(null)
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      const result = await service.createSalary(input)

      expect(result).toMatchObject({
        reportId: FILED_REPORT_ID,
        replayed: true,
      })
      expect(reportCreate).not.toHaveBeenCalled()
    })
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
        type: ReportTypeEnum.SALARY,
        // Set deliberately: without it `status: existing.status` is `undefined`,
        // and `toEqual` ignores undefined properties — so the replay's status
        // passed through untested while looking covered.
        status: ReportStatusEnum.IN_REVIEW,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      const result = await service.createSalary(input)

      expect(result).toEqual({
        reportId: EXISTING_REPORT_ID,
        replayed: true,
        // The earlier report's status as it stands now, which may have moved on
        // since it was filed — a replay reports the report, not the request.
        status: ReportStatusEnum.IN_REVIEW,
      })
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
        type: ReportTypeEnum.SALARY,
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
        type: ReportTypeEnum.EQUALITY,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      const result = await service.createEquality(input)

      expect(result).toEqual({
        reportId: EXISTING_REPORT_ID,
        replayed: true,
      })
      expect(reportCreate).not.toHaveBeenCalled()
      expect(companyReportBulkCreate).not.toHaveBeenCalled()
      expect(reportEventCreate).not.toHaveBeenCalled()
    })

    it('rejects with 409 when the tuple is registered for the other report type', async () => {
      // Was the live defect: the lookup matched on (providerType, providerId)
      // alone, so a vendor reusing one providerId across the equality and
      // salary calls got 201 with the EQUALITY report's id and filed no salary
      // report at all. Reading back by provider id returned that same equality
      // report, so nothing on the caller's side revealed the loss.
      const input = makeInput()
      input.providerType = ReportProviderEnum.OTHER
      input.providerId = '5555555555:vendor-client'

      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_REPORT_ID,
        providerType: input.providerType,
        providerId: input.providerId,
        type: ReportTypeEnum.EQUALITY,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      await expect(service.createSalary(input)).rejects.toThrow(
        ConflictException,
      )
      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('names the type the tuple is taken by, which is what makes it actionable', async () => {
      const input = makeInput()
      input.providerType = ReportProviderEnum.OTHER
      input.providerId = '5555555555:vendor-client'

      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_REPORT_ID,
        providerType: input.providerType,
        providerId: input.providerId,
        type: ReportTypeEnum.EQUALITY,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: PARENT_COMPANY_ID,
        parentCompanyId: null,
      })

      await expect(service.createSalary(input)).rejects.toThrow(/EQUALITY/)
    })

    it('checks ownership before type, so a foreign tuple reveals nothing about it', async () => {
      // A caller that does not own the tuple must not learn what it is
      // registered for -- it gets the cross-company refusal instead.
      const input = makeInput()
      input.providerType = ReportProviderEnum.OTHER
      input.providerId = '5555555555:vendor-client'

      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_REPORT_ID,
        providerType: input.providerType,
        providerId: input.providerId,
        type: ReportTypeEnum.EQUALITY,
      })
      companyReportFindOne.mockResolvedValueOnce({
        companyId: 'someone-else-company-id',
        parentCompanyId: null,
      })

      await expect(service.createSalary(input)).rejects.toThrow(
        /different company/,
      )
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

      expect(result).toMatchObject({ reportId: REPORT_ID, replayed: false })
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

    function mockPriorSibling(
      status: ReportStatusEnum,
      providerId = 'prior-1',
      // Defaults to the channel `makeInput` files on, so the sibling looks like
      // one the same caller left behind. The cross-channel case passes another.
      providerType = ReportProviderEnum.SYSTEM,
    ) {
      companyReportFindAll.mockResolvedValueOnce([
        { reportId: PRIOR_REPORT_ID },
      ])
      reportFindAll.mockResolvedValueOnce([
        { id: PRIOR_REPORT_ID, status, providerId, providerType },
      ])
    }

    it('SALARY: withdraws a SUBMITTED predecessor and emits a WITHDRAWN event linked to the new report', async () => {
      mockPriorSibling(ReportStatusEnum.SUBMITTED, 'prior-providerId')

      const result = await service.createSalary(makeInput())

      expect(result).toMatchObject({ reportId: REPORT_ID, replayed: false })
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

    /**
     * Phase 3 makes POSTPONED the ordinary landing state for a channel with no
     * preview, which turns the 409 above into a trap: a vendor that files, lands
     * POSTPONED and then finds a payroll error would have to explain outliers it
     * knows are wrong just to reach a state it is allowed to replace.
     *
     * `withdrawPostponedSibling` is opt-in precisely so island.is keeps the 409
     * — there POSTPONED is a deliberate "explain later", and being told to
     * finish it is the right answer.
     */
    it('SALARY: withdraws a POSTPONED predecessor when the caller asks for it', async () => {
      mockPriorSibling(ReportStatusEnum.POSTPONED, 'prior-providerId')

      await service.createSalary(makeInput(), WITHDRAW_POSTPONED)

      expect(reportUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.WITHDRAWN }),
        expect.anything(),
      )
      expect(reportCreate).toHaveBeenCalled()
    })

    /**
     * The flag says "on my channel, POSTPONED is what a submission becomes". It
     * cannot speak for another channel's postponement: an applicant who
     * deliberately deferred on island.is has not asked for that report to be
     * retired by their payroll vendor's next filing, and would never learn it
     * had been — they cannot see the vendor's report, and the 409 that used to
     * name theirs would be gone.
     */
    it('SALARY: leaves a POSTPONED sibling from another channel alone', async () => {
      mockPriorSibling(
        ReportStatusEnum.POSTPONED,
        'prior-providerId',
        ReportProviderEnum.ISLAND_IS,
      )

      await expect(
        service.createSalary(makeInput(), WITHDRAW_POSTPONED),
      ).rejects.toThrow(ConflictException)

      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('SALARY: still rejects an IN_REVIEW predecessor even then', async () => {
      mockPriorSibling(ReportStatusEnum.IN_REVIEW, 'prior-providerId')

      await expect(
        service.createSalary(makeInput(), WITHDRAW_POSTPONED),
      ).rejects.toThrow(ConflictException)
      expect(reportCreate).not.toHaveBeenCalled()
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

      expect(result).toMatchObject({ reportId: REPORT_ID, replayed: false })
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
      expect(
        withdrawnCalls.every(([row]) => row.relatedReportId === REPORT_ID),
      ).toBe(true)
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
    importedFromExcel: true,
    providerType: ReportProviderEnum.SYSTEM,
    providerId: null,
    companyAdminName: 'Anna Admin',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactTitle: 'Starfsmannastjóri',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    averageEmployeeMaleCount: 30,
    averageEmployeeFemaleCount: 40,
    averageEmployeeNeutralCount: 5,
    salaryDataBasis: SalaryDataBasisEnum.MONTH,
    salaryDataPeriod: PERIOD_INPUT,
    companies: [makeCompanySnapshot(PARENT_COMPANY_ID, null)],
    parsed: padToSemanticValidity({
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
        // Carries the 10 the employee below used to take off the job-based
        // criterion, so the total score is unchanged: 50 from the role, 10
        // from the person.
        personalCriterion([
          { order: 1, description: 'low', score: 10 },
          { order: 5, description: 'high', score: 50 },
        ]),
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
          gender: GenderEnum.FEMALE,
          field: 'Mgmt',
          department: 'Mgmt',
          startDate: '2021-01-01',
          paidHours: 173.33,
          baseSalary: 1000000,
          additionalFixedOvertime: 100000,
          additionalFixedCarAllowance: null,
          additionalFixedOther: null,
          bonusOccasionalOvertime: null,
          bonusOccasionalCarAllowance: null,
          bonusOther: null,
          personalStepAssignments: [
            {
              criterionTitle: 'Einstaklingsbundid',
              subTitle: 'Frammistada',
              stepOrder: 1,
            },
          ],
        },
      ],
    }),
  }
}

/**
 * Variant of makeInput engineered so that `detectOutliers` flags ordinal 1 as
 * the lone outlier under the default 3.9% threshold (= 1.95% half-band around
 * the regression prediction at that exact score).
 */
function makeInputWithDetectedOutlier(): CreateReportDto {
  const base = makeInput()
  const spread = [
    { order: 1, description: 'score 100', score: 100 },
    { order: 2, description: 'score 200', score: 200 },
    { order: 3, description: 'score 300', score: 300 },
    { order: 4, description: 'score 400', score: 400 },
    { order: 5, description: 'score 500', score: 500 },
    { order: 6, description: 'score 600', score: 600 },
    { order: 7, description: 'score 700', score: 700 },
  ]
  // The spread is per-employee, so it lives on the personal criterion. The
  // job-based one keeps a step scoring 0 for the role to sit on: a role step
  // would otherwise add the same points to everyone and say nothing about the
  // differences this fixture exists to detect.
  base.parsed.criteria[0].subCriteria[0].steps = [
    { order: 1, description: 'none', score: 0 },
    { order: 5, description: 'none', score: 0 },
  ]
  base.parsed.criteria = base.parsed.criteria.map((criterion) =>
    criterion.type === ReportCriterionTypeEnum.PERSONAL
      ? personalCriterion(spread)
      : criterion,
  )
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
    gender: gender as GenderEnum,
    field: 'Mgmt',
    department: 'Mgmt',
    startDate: '2021-01-01',
    paidHours: 173.33,
    baseSalary: baseSalary as number,
    additionalFixedOvertime: 100000,
    additionalFixedCarAllowance: null,
    additionalFixedOther: null,
    bonusOccasionalOvertime: null,
    bonusOccasionalCarAllowance: null,
    bonusOther: null,
    personalStepAssignments: [
      {
        criterionTitle: 'Einstaklingsbundid',
        subTitle: 'Frammistada',
        stepOrder: ordinal as number,
      },
    ],
  }))
  return base
}

function makeEqualityInput(): CreateEqualityReportDto {
  return {
    providerType: ReportProviderEnum.SYSTEM,
    providerId: null,
    companyAdminName: 'Anna Admin',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactTitle: 'Starfsmannastjóri',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    equalityReportContent: 'A narrative gender-equality plan.',
    companies: [makeCompanySnapshot(PARENT_COMPANY_ID, null)],
  }
}
