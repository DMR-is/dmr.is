import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../company/company.service.interface'
import { CompanyDto } from '../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import { SalaryOutlierAnalysisMethodEnum } from '../report/lib/compensation-aggregates'
import {
  CommunicationStatusEnum,
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import {
  ReportEventModel,
  ReportEventTypeEnum,
} from '../report/models/report-event.model'
import { IReportService } from '../report/report.service.interface'
import {
  type ReportResourceContext,
  ReportRoleEnum,
} from '../report/types/report-resource-context'
import { CommentVisibilityEnum } from '../report-comment/models/report-comment.model'
import { IReportCommentService } from '../report-comment/report-comment.service.interface'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'
import { IReportCreateService } from '../report-create/report-create.service.interface'
import { ReportCriterionTypeEnum } from '../report-criterion/models/report-criterion.model'
import { EducationEnum } from '../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { IReportEventService } from '../report-event/report-event.service.interface'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'
import { ApplicationService } from './application.service'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const COMPANY: CompanyDto = {
  id: 'company-1',
  name: 'Acme ehf.',
  employeeCountCategory: CompanySizeEnum.LARGE,
  nationalId: '5501234567',
  status: CompanyStatusEnum.ACTIVE,
  address: 'Laugavegur 1',
  postcodeId: null,
  salaryReportRequired: true,
  salaryReportRequiredOverride: false,
  finesStarted: false,
  quarantined: false,
  nextEqualityReportDueAt: null,
  nextSalaryReportDueAt: null,
  isatCategoryCode: null,
  isatCategory: null,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
  equalityReportOverdue: false,
  salaryReportOverdue: false,
  email: null,
}

describe('ApplicationService', () => {
  let service: ApplicationService
  let configGetByKey: jest.Mock
  let getOrCreateSubsidiaryReportSnapshotSource: jest.Mock
  let getActiveEqualityForCompany: jest.Mock
  let createSalary: jest.Mock
  let createEquality: jest.Mock
  let reportFindOne: jest.Mock
  let reportUpdate: jest.Mock
  let companyReportFindAll: jest.Mock
  let outlierFindAll: jest.Mock
  let outlierFindAndCountAll: jest.Mock
  let outlierCount: jest.Mock
  let outlierUpdate: jest.Mock
  let outlierGroupCreate: jest.Mock
  let outlierGroupFindAll: jest.Mock
  let outlierGroupDestroy: jest.Mock
  let eventFindOne: jest.Mock
  let getCommentsByReportId: jest.Mock
  let createComment: jest.Mock
  let getResultByReportId: jest.Mock
  let emitEdited: jest.Mock
  let emitStatusChanged: jest.Mock
  let emitCommunicationClosed: jest.Mock

  beforeEach(async () => {
    configGetByKey = jest.fn().mockResolvedValue({
      key: 'salary_difference_threshold_percent',
      value: '3.9',
    })
    getOrCreateSubsidiaryReportSnapshotSource = jest
      .fn()
      .mockResolvedValue(makeCompanySnapshotSource())
    getActiveEqualityForCompany = jest.fn()
    createSalary = jest.fn().mockResolvedValue({ reportId: 'report-1' })
    createEquality = jest.fn().mockResolvedValue({ reportId: 'report-1' })
    reportFindOne = jest.fn()
    reportUpdate = jest.fn().mockResolvedValue([1])
    companyReportFindAll = jest.fn().mockResolvedValue([])
    outlierFindAll = jest.fn().mockResolvedValue([])
    outlierFindAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 })
    outlierCount = jest.fn().mockResolvedValue(0)
    outlierUpdate = jest.fn().mockResolvedValue([1])
    let groupSeq = 0
    outlierGroupCreate = jest.fn(async (row) => ({
      ...row,
      id: `group-${groupSeq++}`,
    }))
    outlierGroupFindAll = jest.fn().mockResolvedValue([])
    outlierGroupDestroy = jest.fn().mockResolvedValue(0)
    eventFindOne = jest.fn().mockResolvedValue(null)
    getCommentsByReportId = jest.fn().mockResolvedValue([])
    createComment = jest.fn()
    getResultByReportId = jest.fn()
    emitEdited = jest.fn().mockResolvedValue(undefined)
    emitStatusChanged = jest.fn().mockResolvedValue(undefined)
    emitCommunicationClosed = jest.fn().mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ApplicationService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: IConfigService,
          useValue: { getByKey: configGetByKey },
        },
        {
          provide: ICompanyService,
          useValue: {
            getByNationalId: jest.fn(),
            getOrCreateSubsidiaryReportSnapshotSource,
          },
        },
        {
          provide: IReportService,
          useValue: { getActiveEqualityForCompany },
        },
        {
          provide: IReportCreateService,
          useValue: { createSalary, createEquality },
        },
        {
          provide: IReportCommentService,
          useValue: {
            getByReportId: getCommentsByReportId,
            create: createComment,
          },
        },
        {
          provide: IReportEventService,
          useValue: {
            emitEdited,
            emitStatusChanged,
            emitCommunicationClosed,
          },
        },
        {
          provide: IReportResultService,
          useValue: { getByReportId: getResultByReportId },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: { findOne: reportFindOne, update: reportUpdate },
        },
        {
          provide: getModelToken(CompanyReportModel),
          useValue: { findAll: companyReportFindAll },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: {
            findAll: outlierFindAll,
            findAndCountAll: outlierFindAndCountAll,
            count: outlierCount,
            update: outlierUpdate,
          },
        },
        {
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: {
            create: outlierGroupCreate,
            findAll: outlierGroupFindAll,
            destroy: outlierGroupDestroy,
          },
        },
        {
          provide: getModelToken(ReportEventModel),
          useValue: { findOne: eventFindOne },
        },
      ],
    }).compile()

    service = module.get(ApplicationService)
  })

  describe('salaryAnalysis', () => {
    it('returns regression outliers and the gender-vs-score chart', async () => {
      const result = await service.salaryAnalysis(makeRequest(), COMPANY)

      expect(configGetByKey).toHaveBeenCalledWith(
        'salary_difference_threshold_percent',
      )

      // Ordinal 1 sits about 3% below its predicted salary on the regression
      // line, past the 1.95% half-threshold band. The rest stay inside the band.
      expect(result.outliers).toHaveLength(1)
      expect(result.outliers[0]).toMatchObject({
        employeeOrdinal: 1,
        adjustedBaseSalary: 850000,
        direction: 'BELOW',
        predictedBaseSalary: 876786,
        scoreBucketRangeFrom: 100,
        scoreBucketRangeTo: 200,
      })
      expect(result.outliers[0].differencePercent).toBeCloseTo(-3.055, 3)
      expect(result.outliers[0].allowedDifferencePercent).toBeCloseTo(1.95, 4)

      expect(result.baseSalaryByGenderAndScoreAll.dataPoints).toHaveLength(7)
      expect(result.baseSalaryByGenderAndScoreAll.totals.maleCount).toBe(6)
      expect(result.baseSalaryByGenderAndScoreAll.totals.femaleCount).toBe(1)
    })

    it('rejects malformed parsed payloads with a 400', async () => {
      const request = makeRequest()
      // Inject a duplicate role title — should fail integrity check.
      request.parsed.roles.push({ ...request.parsed.roles[0] })

      await expect(service.salaryAnalysis(request, COMPANY)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('throws when the threshold config value is not numeric', async () => {
      configGetByKey.mockResolvedValue({
        key: 'salary_difference_threshold_percent',
        value: 'not-a-number',
      })

      await expect(
        service.salaryAnalysis(makeRequest(), COMPANY),
      ).rejects.toThrow(InternalServerErrorException)
    })
  })

  describe('getActiveEqualityReport', () => {
    it('returns the summary when one is found', async () => {
      const summary = {
        id: 'eq-1',
        identifier: 'EQ-2025-001',
        approvedAt: new Date('2025-01-01T00:00:00Z'),
        validUntil: new Date('2028-01-01T00:00:00Z'),
      }
      getActiveEqualityForCompany.mockResolvedValue(summary)

      const result = await service.getActiveEqualityReport(COMPANY)

      expect(getActiveEqualityForCompany).toHaveBeenCalledWith(COMPANY.id)
      expect(result).toEqual(summary)
    })

    it('throws NotFoundException when no active equality exists', async () => {
      getActiveEqualityForCompany.mockResolvedValue(null)

      await expect(service.getActiveEqualityReport(COMPANY)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('submitSalary', () => {
    it('maps the application body to the internal salary create DTO', async () => {
      const input = makeSubmitSalaryInput()

      const result = await service.submitSalary(input, COMPANY)

      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createSalary).toHaveBeenCalledWith({
        equalityReportId: input.equalityReportId,
        identifier: input.identifier,
        importedFromExcel: input.importedFromExcel,
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: input.providerId,
        companyAdminName: input.companyAdminName,
        companyAdminEmail: input.companyAdminEmail,
        companyAdminGender: input.companyAdminGender,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        averageEmployeeMaleCount: input.averageEmployeeMaleCount,
        averageEmployeeFemaleCount: input.averageEmployeeFemaleCount,
        averageEmployeeNeutralCount: input.averageEmployeeNeutralCount,
        parsed: input.parsed,
        companies: [makeCompanySnapshot()],
        outliersPostponed: undefined,
        outlierGroups: undefined,
      })
      expect(result).toEqual({ reportId: 'report-1' })
    })

    it('resolves subsidiary snapshot details through the company service', async () => {
      const input = makeSubmitSalaryInput()
      input.subsidiaries = [
        {
          name: 'Subsidiary ehf.',
          nationalId: '6601234567',
        },
      ]
      const source = makeCompanySnapshotSource({
        companyId: 'subsidiary-1',
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
      })
      getOrCreateSubsidiaryReportSnapshotSource.mockResolvedValueOnce(source)

      await service.submitSalary(input, COMPANY)

      expect(getOrCreateSubsidiaryReportSnapshotSource).toHaveBeenCalledWith({
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
      })
      expect(createSalary).toHaveBeenCalledWith(
        expect.objectContaining({
          companies: [
            makeCompanySnapshot(),
            {
              ...source,
              parentCompanyId: COMPANY.id,
            },
          ],
        }),
      )
    })

    it('rejects when the submitted parent is not the authenticated company', async () => {
      const input = makeSubmitSalaryInput()
      input.company.nationalId = '0000000000'

      await expect(service.submitSalary(input, COMPANY)).rejects.toThrow(
        /does not match the authenticated company/,
      )
      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createSalary).not.toHaveBeenCalled()
    })

    it('rejects when a subsidiary is the authenticated parent company', async () => {
      const input = makeSubmitSalaryInput()
      input.subsidiaries = [
        {
          name: COMPANY.name,
          nationalId: COMPANY.nationalId,
        },
      ]

      await expect(service.submitSalary(input, COMPANY)).rejects.toThrow(
        /cannot be the authenticated parent company/,
      )
      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createSalary).not.toHaveBeenCalled()
    })

    it('rejects duplicate subsidiaries', async () => {
      const input = makeSubmitSalaryInput()
      input.subsidiaries = [
        {
          name: 'Subsidiary ehf.',
          nationalId: '6601234567',
        },
        {
          name: 'Duplicate ehf.',
          nationalId: '6601234567',
        },
      ]

      await expect(service.submitSalary(input, COMPANY)).rejects.toThrow(
        /Duplicate company national id/,
      )
      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createSalary).not.toHaveBeenCalled()
    })

    it('blocks (409) when the renewal window is not open yet (due date > 6 months out)', async () => {
      const input = makeSubmitSalaryInput()
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 2)
      const company = { ...COMPANY, nextSalaryReportDueAt: farFuture }

      await expect(service.submitSalary(input, company)).rejects.toThrow(
        ConflictException,
      )
      expect(createSalary).not.toHaveBeenCalled()
    })

    it('allows submission when the due date is within 6 months', async () => {
      const input = makeSubmitSalaryInput()
      const soon = new Date()
      soon.setMonth(soon.getMonth() + 3)
      const company = { ...COMPANY, nextSalaryReportDueAt: soon }

      await service.submitSalary(input, company)

      expect(createSalary).toHaveBeenCalled()
    })
  })

  describe('getSalaryReportEligibility', () => {
    const activeEquality = {
      id: 'eq-1',
      identifier: 'EQ-2025-001',
      approvedAt: new Date('2025-01-01T00:00:00Z'),
      validUntil: new Date('2028-01-01T00:00:00Z'),
    }

    it('is eligible when there is no due date and an equality report exists', async () => {
      getActiveEqualityForCompany.mockResolvedValue(activeEquality)

      const result = await service.getSalaryReportEligibility(COMPANY)

      expect(result.eligible).toBe(true)
      expect(result.reason).toBeNull()
      expect(result.dueAt).toBeNull()
    })

    it('is ineligible with a reason when the due date is more than 6 months out', async () => {
      getActiveEqualityForCompany.mockResolvedValue(activeEquality)
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 2)
      const company = { ...COMPANY, nextSalaryReportDueAt: farFuture }

      const result = await service.getSalaryReportEligibility(company)

      expect(result.eligible).toBe(false)
      expect(result.reason).toBe('RENEWAL_WINDOW_NOT_OPEN')
      expect(result.dueAt).toEqual(farFuture)
      expect(result.earliestSubmissionDate).toBeInstanceOf(Date)
    })

    it('is ineligible with MISSING_EQUALITY_REPORT when no active equality report exists, taking priority over the renewal window', async () => {
      getActiveEqualityForCompany.mockResolvedValue(null)
      // Due date within the window would otherwise be eligible; the missing
      // equality report must still block and win the reason.
      const soon = new Date()
      soon.setMonth(soon.getMonth() + 3)
      const company = { ...COMPANY, nextSalaryReportDueAt: soon }

      const result = await service.getSalaryReportEligibility(company)

      expect(result.eligible).toBe(false)
      expect(result.reason).toBe('MISSING_EQUALITY_REPORT')
      expect(result.dueAt).toEqual(soon)
      expect(result.earliestSubmissionDate).toBeInstanceOf(Date)
    })
  })

  describe('submitEquality', () => {
    it('maps the application body to the internal equality create DTO', async () => {
      const input = makeSubmitEqualityInput()

      const result = await service.submitEquality(input, COMPANY)

      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createEquality).toHaveBeenCalledWith({
        identifier: input.identifier,
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: input.providerId,
        companyAdminName: input.companyAdminName,
        companyAdminEmail: input.companyAdminEmail,
        companyAdminGender: input.companyAdminGender,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        equalityReportContent: input.equalityReportContent,
        companies: [makeCompanySnapshot()],
      })
      expect(result).toEqual({ reportId: 'report-1' })
    })

    it('resolves subsidiary snapshot details through the company service', async () => {
      const input = makeSubmitEqualityInput()
      input.subsidiaries = [
        {
          name: 'Subsidiary ehf.',
          nationalId: '6601234567',
        },
      ]
      const source = makeCompanySnapshotSource({
        companyId: 'subsidiary-1',
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
      })
      getOrCreateSubsidiaryReportSnapshotSource.mockResolvedValueOnce(source)

      await service.submitEquality(input, COMPANY)

      expect(getOrCreateSubsidiaryReportSnapshotSource).toHaveBeenCalledWith({
        name: 'Subsidiary ehf.',
        nationalId: '6601234567',
      })
      expect(createEquality).toHaveBeenCalledWith(
        expect.objectContaining({
          companies: [
            makeCompanySnapshot(),
            {
              ...source,
              parentCompanyId: COMPANY.id,
            },
          ],
        }),
      )
    })

    it('rejects when the submitted parent is not the authenticated company', async () => {
      const input = makeSubmitEqualityInput()
      input.company.nationalId = '0000000000'

      await expect(service.submitEquality(input, COMPANY)).rejects.toThrow(
        /does not match the authenticated company/,
      )
      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createEquality).not.toHaveBeenCalled()
    })

    it('rejects when a subsidiary is the authenticated parent company', async () => {
      const input = makeSubmitEqualityInput()
      input.subsidiaries = [
        {
          name: COMPANY.name,
          nationalId: COMPANY.nationalId,
        },
      ]

      await expect(service.submitEquality(input, COMPANY)).rejects.toThrow(
        /cannot be the authenticated parent company/,
      )
      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createEquality).not.toHaveBeenCalled()
    })

    it('rejects duplicate subsidiaries', async () => {
      const input = makeSubmitEqualityInput()
      input.subsidiaries = [
        {
          name: 'Subsidiary ehf.',
          nationalId: '6601234567',
        },
        {
          name: 'Duplicate ehf.',
          nationalId: '6601234567',
        },
      ]

      await expect(service.submitEquality(input, COMPANY)).rejects.toThrow(
        /Duplicate company national id/,
      )
      expect(getOrCreateSubsidiaryReportSnapshotSource).not.toHaveBeenCalled()
      expect(createEquality).not.toHaveBeenCalled()
    })
  })

  describe('getReport', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'
    const EQUALITY_REPORT_ID = '00000000-0000-0000-0000-0000000000bb'

    it('throws NotFoundException when no report matches the providerId', async () => {
      reportFindOne.mockResolvedValueOnce(null)

      await expect(service.getReport(PROVIDER_ID, COMPANY)).rejects.toThrow(
        NotFoundException,
      )
      expect(reportFindOne).toHaveBeenCalledWith({
        where: {
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: PROVIDER_ID,
        },
      })
      expect(companyReportFindAll).not.toHaveBeenCalled()
    })

    it("throws NotFoundException when the resolved company isn't the parent", async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({ id: REPORT_ID, providerId: PROVIDER_ID }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({
          reportId: REPORT_ID,
          companyId: 'someone-else',
          parentCompanyId: null,
        }),
      ])

      await expect(service.getReport(PROVIDER_ID, COMPANY)).rejects.toThrow(
        NotFoundException,
      )
      expect(getCommentsByReportId).not.toHaveBeenCalled()
    })

    it('returns salary report detail with result, outliers, linked equality, companies, and external comments', async () => {
      const submittedAt = new Date('2026-01-01T00:00:00.000Z')
      const approvedAt = new Date('2025-06-01T00:00:00.000Z')
      const validUntil = new Date('2028-06-01T00:00:00.000Z')
      const salaryReport = makeReportRow({
        id: REPORT_ID,
        providerId: PROVIDER_ID,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.SUBMITTED,
        identifier: 'SAL-2026-001',
        equalityReportId: EQUALITY_REPORT_ID,
        createdAt: submittedAt,
        outliersPostponed: false,
      })
      const equalityReport = makeReportRow({
        id: EQUALITY_REPORT_ID,
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
        identifier: 'EQ-2025-001',
        approvedAt,
        validUntil,
      })
      const reportResult = makeReportResultDto(REPORT_ID)
      const externalComment = makeCommentDto({
        reportId: REPORT_ID,
        visibility: CommentVisibilityEnum.EXTERNAL,
      })
      const slimExternalComment = {
        id: externalComment.id,
        authorKind: externalComment.authorKind,
        body: externalComment.body,
        createdAt: externalComment.createdAt,
      }
      const outlier = makeOutlierRow()

      reportFindOne
        .mockResolvedValueOnce(salaryReport)
        .mockResolvedValueOnce(equalityReport)
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
        makeCompanyReportRow({
          id: 'company-report-sub',
          reportId: REPORT_ID,
          companyId: 'subsidiary-1',
          parentCompanyId: COMPANY.id,
          name: 'Acme Subsidiary ehf.',
        }),
      ])
      getResultByReportId.mockResolvedValueOnce(reportResult)
      outlierCount.mockResolvedValueOnce(1)
      getCommentsByReportId.mockResolvedValueOnce([externalComment])

      const result = await service.getReport(PROVIDER_ID, COMPANY)

      expect(reportFindOne).toHaveBeenCalledWith({
        where: {
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: PROVIDER_ID,
        },
      })
      expect(companyReportFindAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { reportId: REPORT_ID } }),
      )
      expect(result).toMatchObject({
        id: REPORT_ID,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.SUBMITTED,
        identifier: 'SAL-2026-001',
        submittedAt,
        equalityReportContent: null,
        outliersPostponed: false,
        includesImprovementPlan: true,
        result: reportResult,
        externalComments: [slimExternalComment],
        denialReason: null,
      })
      expect(result.companies).toHaveLength(2)
      expect(result.equalityReport).toEqual({
        id: EQUALITY_REPORT_ID,
        identifier: 'EQ-2025-001',
        approvedAt,
        validUntil,
      })
      // outlier row reference retained so the mock factory stays in use for
      // the editOutliers tests below; the detail payload itself no longer
      // includes the outlier list.
      expect(outlier.id).toBe('outlier-1')
      expect(getCommentsByReportId).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          reportStatus: ReportStatusEnum.SUBMITTED,
          actor: {
            kind: ReportRoleEnum.COMPANY,
            nationalId: COMPANY.nationalId,
          },
        }),
      )
    })

    it('returns equality report detail with narrative content and no salary-only data', async () => {
      const equalityReport = makeReportRow({
        id: REPORT_ID,
        providerId: PROVIDER_ID,
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.APPROVED,
        identifier: 'EQ-2026-001',
        equalityReportContent: 'Equality plan narrative',
      })

      reportFindOne.mockResolvedValueOnce(equalityReport)
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getCommentsByReportId.mockResolvedValueOnce([])

      const result = await service.getReport(PROVIDER_ID, COMPANY)

      expect(result.equalityReport).toBeNull()
      expect(result.equalityReportContent).toBe('Equality plan narrative')
      expect(result.includesImprovementPlan).toBe(false)
      expect(result.outliersPostponed).toBeNull()
      expect(result.result).toBeNull()
      expect(getResultByReportId).not.toHaveBeenCalled()
      expect(outlierCount).not.toHaveBeenCalled()
    })

    it('surfaces the latest denial reason when the report is DENIED', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          status: ReportStatusEnum.DENIED,
          type: ReportTypeEnum.EQUALITY,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getCommentsByReportId.mockResolvedValueOnce([])
      eventFindOne.mockResolvedValueOnce({ reason: 'Missing explanation' })

      const result = await service.getReport(PROVIDER_ID, COMPANY)

      expect(result.denialReason).toBe('Missing explanation')
      expect(eventFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportId: REPORT_ID,
            eventType: ReportEventTypeEnum.STATUS_CHANGED,
            toStatus: ReportStatusEnum.DENIED,
          }),
          order: [['createdAt', 'DESC']],
        }),
      )
    })

    it('loads comments through company context and returns the slim application shape', async () => {
      const externalComment = makeCommentDto({
        reportId: REPORT_ID,
        visibility: CommentVisibilityEnum.EXTERNAL,
      })
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({ id: REPORT_ID, providerId: PROVIDER_ID }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getCommentsByReportId.mockImplementationOnce(
        async (context: ReportResourceContext) => {
          expect(context.actor).toEqual({
            kind: ReportRoleEnum.COMPANY,
            nationalId: COMPANY.nationalId,
          })
          return [externalComment]
        },
      )

      const result = await service.getReport(PROVIDER_ID, COMPANY)

      expect(result.externalComments).toEqual([
        {
          id: externalComment.id,
          authorKind: externalComment.authorKind,
          body: externalComment.body,
          createdAt: externalComment.createdAt,
        },
      ])
      expect(result.externalComments[0]).not.toHaveProperty('reportId')
      expect(result.externalComments[0]).not.toHaveProperty('authorUserId')
      expect(result.externalComments[0]).not.toHaveProperty('visibility')
      expect(result.externalComments[0]).not.toHaveProperty('reportStatus')
      expect(result.externalComments).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            visibility: CommentVisibilityEnum.INTERNAL,
          }),
        ]),
      )
    })
  })

  describe('createReportComment', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'

    it('throws NotFoundException when no report matches the providerId', async () => {
      reportFindOne.mockResolvedValueOnce(null)

      await expect(
        service.createReportComment(PROVIDER_ID, { body: 'hi' }, COMPANY),
      ).rejects.toThrow(NotFoundException)
      expect(reportFindOne).toHaveBeenCalledWith({
        where: {
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: PROVIDER_ID,
        },
      })
      expect(companyReportFindAll).not.toHaveBeenCalled()
      expect(createComment).not.toHaveBeenCalled()
    })

    it("throws NotFoundException when the resolved company isn't the parent", async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({ id: REPORT_ID, providerId: PROVIDER_ID }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({
          reportId: REPORT_ID,
          companyId: 'someone-else',
          parentCompanyId: null,
        }),
      ])

      await expect(
        service.createReportComment(PROVIDER_ID, { body: 'hi' }, COMPANY),
      ).rejects.toThrow(NotFoundException)
      expect(createComment).not.toHaveBeenCalled()
    })

    it('forwards an EXTERNAL comment through the company context and returns the slim application DTO', async () => {
      const createdComment = makeCommentDto({
        id: 'comment-new',
        reportId: REPORT_ID,
        visibility: CommentVisibilityEnum.EXTERNAL,
        body: 'Please review my correction',
        authorUserId: 'reviewer-1',
        reportStatus: ReportStatusEnum.SUBMITTED,
      })
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          status: ReportStatusEnum.SUBMITTED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      createComment.mockResolvedValueOnce(createdComment)

      const result = await service.createReportComment(
        PROVIDER_ID,
        { body: 'Please review my correction' },
        COMPANY,
      )

      expect(result).toEqual({
        id: 'comment-new',
        authorKind: createdComment.authorKind,
        body: 'Please review my correction',
        createdAt: createdComment.createdAt,
      })
      expect(result).not.toHaveProperty('reportId')
      expect(result).not.toHaveProperty('authorUserId')
      expect(result).not.toHaveProperty('visibility')
      expect(result).not.toHaveProperty('reportStatus')
      expect(createComment).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          reportStatus: ReportStatusEnum.SUBMITTED,
          actor: {
            kind: ReportRoleEnum.COMPANY,
            nationalId: COMPANY.nationalId,
          },
        }),
        {
          body: 'Please review my correction',
          visibility: CommentVisibilityEnum.EXTERNAL,
        },
      )
    })
  })

  describe('editEqualityContent', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'

    it('updates content, emits EDITED, keeps IN_REVIEW status on success', async () => {
      const equalityReport = makeReportRow({
        id: REPORT_ID,
        providerId: PROVIDER_ID,
        type: ReportTypeEnum.EQUALITY,
        status: ReportStatusEnum.IN_REVIEW,
      })
      // First findOne: editEqualityContent's own ownership lookup.
      // Second findOne: getReport's re-read at the end (the edit method
      // returns the fresh detail by delegating to getReport).
      reportFindOne
        .mockResolvedValueOnce(equalityReport)
        .mockResolvedValueOnce(equalityReport)
      companyReportFindAll
        .mockResolvedValueOnce([makeCompanyReportRow({ reportId: REPORT_ID })])
        .mockResolvedValueOnce([makeCompanyReportRow({ reportId: REPORT_ID })])
      getCommentsByReportId.mockResolvedValueOnce([])

      const result = await service.editEqualityContent(
        PROVIDER_ID,
        { equalityReportContent: 'Revised narrative' },
        COMPANY,
      )

      expect(reportUpdate).toHaveBeenCalledWith(
        { equalityReportContent: 'Revised narrative' },
        { where: { id: REPORT_ID } },
      )
      expect(emitEdited).toHaveBeenCalledWith(
        REPORT_ID,
        ReportStatusEnum.IN_REVIEW,
        COMPANY.id,
      )
      expect(emitStatusChanged).not.toHaveBeenCalled()
      expect(result.id).toBe(REPORT_ID)
    })

    it('rejects when the report is not EQUALITY', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.IN_REVIEW,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.editEqualityContent(
          PROVIDER_ID,
          { equalityReportContent: 'x' },
          COMPANY,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(reportUpdate).not.toHaveBeenCalled()
      expect(emitEdited).not.toHaveBeenCalled()
    })

    it('rejects when the report status is not IN_REVIEW', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.EQUALITY,
          status: ReportStatusEnum.DENIED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.editEqualityContent(
          PROVIDER_ID,
          { equalityReportContent: 'x' },
          COMPANY,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it("throws NotFoundException when the resolved company isn't the parent", async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.EQUALITY,
          status: ReportStatusEnum.IN_REVIEW,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({
          reportId: REPORT_ID,
          companyId: 'someone-else',
          parentCompanyId: null,
        }),
      ])

      await expect(
        service.editEqualityContent(
          PROVIDER_ID,
          { equalityReportContent: 'x' },
          COMPANY,
        ),
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(reportUpdate).not.toHaveBeenCalled()
    })
  })

  describe('withdraw', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'

    it('withdraws a non-terminal report and emits STATUS_CHANGED', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.SUBMITTED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await service.withdraw(PROVIDER_ID, COMPANY)

      expect(reportUpdate).toHaveBeenCalledWith(
        { status: ReportStatusEnum.WITHDRAWN },
        { where: { id: REPORT_ID } },
      )
      expect(emitStatusChanged).toHaveBeenCalledWith(
        REPORT_ID,
        ReportStatusEnum.SUBMITTED,
        ReportStatusEnum.WITHDRAWN,
      )
    })

    it('force-closes an open communication thread on withdraw', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.IN_REVIEW,
          communicationStatus: CommunicationStatusEnum.RESPONSE_RECEIVED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await service.withdraw(PROVIDER_ID, COMPANY)

      expect(reportUpdate).toHaveBeenCalledWith(
        { communicationStatus: CommunicationStatusEnum.CLOSED },
        { where: { id: REPORT_ID } },
      )
      expect(emitCommunicationClosed).toHaveBeenCalledWith(
        REPORT_ID,
        ReportStatusEnum.WITHDRAWN,
        null,
      )
    })

    it('is an idempotent no-op when the report is already WITHDRAWN', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.WITHDRAWN,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.withdraw(PROVIDER_ID, COMPANY),
      ).resolves.toBeUndefined()

      expect(reportUpdate).not.toHaveBeenCalled()
      expect(emitStatusChanged).not.toHaveBeenCalled()
    })

    it('rejects withdrawing a report that has reached a terminal state', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.APPROVED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.withdraw(PROVIDER_ID, COMPANY),
      ).rejects.toBeInstanceOf(BadRequestException)

      expect(reportUpdate).not.toHaveBeenCalled()
      expect(emitStatusChanged).not.toHaveBeenCalled()
    })

    it("throws NotFoundException when the resolved company isn't the parent", async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.SUBMITTED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({
          reportId: REPORT_ID,
          companyId: 'someone-else',
          parentCompanyId: null,
        }),
      ])

      await expect(
        service.withdraw(PROVIDER_ID, COMPANY),
      ).rejects.toBeInstanceOf(NotFoundException)

      expect(reportUpdate).not.toHaveBeenCalled()
    })
  })

  describe('editOutliers', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'

    const detectedSnapshot = (ordinals: number[]) =>
      makeReportResultDto(REPORT_ID, ordinals)

    const validGroup = (...ordinals: number[]) => ({
      name: 'Group',
      reason: 'Parental leave, salary frozen',
      action: 'No adjustment, frozen for the period',
      signatureName: 'Anna Admin',
      signatureRole: 'HR',
      employeeOrdinals: ordinals,
    })

    it('POSTPONED → SUBMITTED resolution: replaces groups, re-points rows, flips status, emits STATUS_CHANGED + EDITED', async () => {
      const postponedSalary = makeReportRow({
        id: REPORT_ID,
        providerId: PROVIDER_ID,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.POSTPONED,
      })
      // 1st reportFindOne: edit method ownership lookup.
      // 2nd reportFindOne: getReport re-read returns the now-SUBMITTED row.
      reportFindOne
        .mockResolvedValueOnce(postponedSalary)
        .mockResolvedValueOnce(
          makeReportRow({
            ...postponedSalary,
            status: ReportStatusEnum.SUBMITTED,
          } as never),
        )
      companyReportFindAll
        .mockResolvedValueOnce([makeCompanyReportRow({ reportId: REPORT_ID })])
        .mockResolvedValueOnce([makeCompanyReportRow({ reportId: REPORT_ID })])
      getResultByReportId.mockResolvedValueOnce(detectedSnapshot([1]))
      outlierFindAll.mockResolvedValueOnce([
        {
          id: 'outlier-1',
          reportEmployee: { id: 'emp-1', ordinal: 1 },
        },
      ])
      // The postponed default group that gets replaced.
      outlierGroupFindAll.mockResolvedValueOnce([{ id: 'old-group-1' }])
      getCommentsByReportId.mockResolvedValueOnce([])

      await service.editOutliers(
        PROVIDER_ID,
        { groups: [validGroup(1)] },
        COMPANY,
      )

      // New group created with the explanation...
      expect(outlierGroupCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          name: 'Group',
          reason: 'Parental leave, salary frozen',
          action: 'No adjustment, frozen for the period',
          signatureName: 'Anna Admin',
          signatureRole: 'HR',
        }),
      )
      // ...outlier row re-pointed at it...
      expect(outlierUpdate).toHaveBeenCalledWith(
        { groupId: 'group-0' },
        { where: { id: 'outlier-1' } },
      )
      // ...and the old group deleted.
      expect(outlierGroupDestroy).toHaveBeenCalledWith({
        where: { id: ['old-group-1'] },
      })
      expect(reportUpdate).toHaveBeenCalledWith(
        { status: ReportStatusEnum.SUBMITTED },
        { where: { id: REPORT_ID } },
      )
      expect(emitStatusChanged).toHaveBeenCalledWith(
        REPORT_ID,
        ReportStatusEnum.POSTPONED,
        ReportStatusEnum.SUBMITTED,
        null,
      )
      expect(emitEdited).toHaveBeenCalledWith(
        REPORT_ID,
        ReportStatusEnum.SUBMITTED,
        COMPANY.id,
      )
    })

    it('IN_REVIEW correction: replaces groups, preserves status, emits EDITED only', async () => {
      const inReviewSalary = makeReportRow({
        id: REPORT_ID,
        providerId: PROVIDER_ID,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.IN_REVIEW,
      })
      reportFindOne
        .mockResolvedValueOnce(inReviewSalary)
        .mockResolvedValueOnce(inReviewSalary)
      companyReportFindAll
        .mockResolvedValueOnce([makeCompanyReportRow({ reportId: REPORT_ID })])
        .mockResolvedValueOnce([makeCompanyReportRow({ reportId: REPORT_ID })])
      getResultByReportId.mockResolvedValueOnce(detectedSnapshot([1]))
      outlierFindAll.mockResolvedValueOnce([
        {
          id: 'outlier-1',
          reportEmployee: { id: 'emp-1', ordinal: 1 },
        },
      ])
      outlierGroupFindAll.mockResolvedValueOnce([{ id: 'old-group-1' }])
      getCommentsByReportId.mockResolvedValueOnce([])

      await service.editOutliers(
        PROVIDER_ID,
        { groups: [validGroup(1)] },
        COMPANY,
      )

      expect(outlierGroupCreate).toHaveBeenCalledTimes(1)
      expect(outlierUpdate).toHaveBeenCalledTimes(1)
      // Status is NOT updated — only the grouping is.
      expect(reportUpdate).not.toHaveBeenCalled()
      expect(emitStatusChanged).not.toHaveBeenCalled()
      expect(emitEdited).toHaveBeenCalledWith(
        REPORT_ID,
        ReportStatusEnum.IN_REVIEW,
        COMPANY.id,
      )
    })

    it('rejects extras (submitted ordinal not in canonical detected set)', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.POSTPONED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getResultByReportId.mockResolvedValueOnce(detectedSnapshot([1]))

      await expect(
        service.editOutliers(
          PROVIDER_ID,
          { groups: [validGroup(1, 2)] },
          COMPANY,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(outlierGroupCreate).not.toHaveBeenCalled()
      expect(outlierUpdate).not.toHaveBeenCalled()
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('rejects missing (detected ordinal not covered by any group)', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.POSTPONED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getResultByReportId.mockResolvedValueOnce(detectedSnapshot([1, 2]))

      await expect(
        service.editOutliers(PROVIDER_ID, { groups: [validGroup(1)] }, COMPANY),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(outlierGroupCreate).not.toHaveBeenCalled()
      expect(outlierUpdate).not.toHaveBeenCalled()
    })

    it('rejects an ordinal that appears in more than one group', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.POSTPONED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.editOutliers(
          PROVIDER_ID,
          { groups: [validGroup(1), validGroup(1)] },
          COMPANY,
        ),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(outlierGroupCreate).not.toHaveBeenCalled()
      expect(outlierUpdate).not.toHaveBeenCalled()
    })

    it('rejects when the report is not SALARY', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.EQUALITY,
          status: ReportStatusEnum.POSTPONED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.editOutliers(PROVIDER_ID, { groups: [validGroup(1)] }, COMPANY),
      ).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rejects when status is neither POSTPONED nor IN_REVIEW', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.DENIED,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await expect(
        service.editOutliers(PROVIDER_ID, { groups: [validGroup(1)] }, COMPANY),
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })
})

function makeRequest(): SalaryAnalysisRequestDto {
  return {
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
                { order: 1, description: 'score 100', score: 100 },
                { order: 2, description: 'score 200', score: 200 },
                { order: 3, description: 'score 300', score: 300 },
                { order: 4, description: 'score 400', score: 400 },
                { order: 5, description: 'score 500', score: 500 },
                { order: 6, description: 'score 600', score: 600 },
                { order: 7, description: 'score 700', score: 700 },
              ],
            },
          ],
        },
      ],
      roles: [
        {
          title: 'Framkvaemdastjori',
          stepAssignments: [],
        },
      ],
      employees: [
        makeEmployee({
          ordinal: 1,
          gender: GenderEnum.FEMALE,
          baseSalary: 850000,
          stepOrder: 1,
        }),
        makeEmployee({
          ordinal: 2,
          gender: GenderEnum.MALE,
          baseSalary: 1000000,
          stepOrder: 2,
        }),
        makeEmployee({
          ordinal: 3,
          gender: GenderEnum.MALE,
          baseSalary: 1100000,
          stepOrder: 3,
        }),
        makeEmployee({
          ordinal: 4,
          gender: GenderEnum.MALE,
          baseSalary: 1200000,
          stepOrder: 4,
        }),
        makeEmployee({
          ordinal: 5,
          gender: GenderEnum.MALE,
          baseSalary: 1300000,
          stepOrder: 5,
        }),
        makeEmployee({
          ordinal: 6,
          gender: GenderEnum.MALE,
          baseSalary: 1400000,
          stepOrder: 6,
        }),
        makeEmployee({
          ordinal: 7,
          gender: GenderEnum.MALE,
          baseSalary: 1500000,
          stepOrder: 7,
        }),
      ],
    },
  }
}

function makeEmployee({
  ordinal,
  gender,
  baseSalary,
  stepOrder,
}: {
  ordinal: number
  gender: GenderEnum
  baseSalary: number
  stepOrder: number
}) {
  return {
    ordinal,
    identifier: `TVE-00${ordinal}`,
    roleTitle: 'Framkvaemdastjori',
    education: EducationEnum.MASTER,
    gender,
    field: 'Mgmt',
    department: 'Mgmt',
    startDate: '2021-01-01',
    workRatio: 1,
    baseSalary,
    additionalFixedOvertime: 100000,
    additionalFixedCarAllowance: null,
    bonusOccasionalCarAllowance: null,
    bonusOccasionalOvertime: null,
    bonusPayments: null,
    bonusOther: null,
    personalStepAssignments: [
      {
        criterionTitle: 'Abyrgd',
        subTitle: 'Abyrgd a fólki',
        stepOrder,
      },
    ],
  }
}

function makeCompanySnapshot(
  overrides: Partial<CreateReportCompanySnapshotDto> = {},
): CreateReportCompanySnapshotDto {
  return {
    companyId: COMPANY.id,
    parentCompanyId: null,
    name: 'Acme ehf.',
    nationalId: '5501234567',
    address: 'Laugavegur 1',
    city: 'Reykjavík',
    postcode: '101',
    isatCategory: '62.0',
    ...overrides,
  }
}

function makeCompanySnapshotSource(
  overrides: Partial<
    Omit<CreateReportCompanySnapshotDto, 'parentCompanyId'>
  > = {},
): Omit<CreateReportCompanySnapshotDto, 'parentCompanyId'> {
  return {
    companyId: 'subsidiary-1',
    name: 'Subsidiary ehf.',
    nationalId: '6601234567',
    address: '',
    city: '',
    postcode: '',
    isatCategory: '',
    ...overrides,
  }
}

function makeSubmitSalaryInput(): SubmitSalaryReportDto {
  return {
    equalityReportId: '00000000-0000-0000-0000-00000000eee1',
    identifier: 'SAL-2026-001',
    importedFromExcel: true,
    providerId: 'salary-provider-1',
    companyAdminName: 'Anna Admin',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    averageEmployeeMaleCount: 30,
    averageEmployeeFemaleCount: 40,
    averageEmployeeNeutralCount: 5,
    parsed: makeRequest().parsed,
    company: {
      name: 'Acme ehf.',
      nationalId: COMPANY.nationalId,
      address: 'Laugavegur 1',
      city: 'Reykjavík',
      postcode: '101',
      isatCategory: '62.0',
    },
  }
}

function makeSubmitEqualityInput(): SubmitEqualityReportDto {
  return {
    identifier: 'EQ-2026-001',
    providerId: 'equality-provider-1',
    companyAdminName: 'Anna Admin',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    equalityReportContent: 'A narrative gender-equality plan.',
    company: {
      name: 'Acme ehf.',
      nationalId: COMPANY.nationalId,
      address: 'Laugavegur 1',
      city: 'Reykjavík',
      postcode: '101',
      isatCategory: '62.0',
    },
  }
}

function makeReportRow(
  overrides: Partial<Record<string, unknown>> = {},
): ReportModel {
  return {
    id: 'report-1',
    providerId: null,
    type: ReportTypeEnum.EQUALITY,
    status: ReportStatusEnum.SUBMITTED,
    communicationStatus: CommunicationStatusEnum.NOT_STARTED,
    identifier: 'REPORT-001',
    equalityReportId: null,
    equalityReportContent: null,
    approvedAt: null,
    validUntil: null,
    correctionDeadline: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as unknown as ReportModel
}

function makeCompanyReportRow(
  overrides: Partial<Record<string, unknown>> = {},
): CompanyReportModel {
  return {
    id: 'company-report-parent',
    companyId: COMPANY.id,
    reportId: 'report-1',
    parentCompanyId: null,
    name: COMPANY.name,
    nationalId: COMPANY.nationalId,
    address: 'Laugavegur 1',
    city: 'Reykjavík',
    postcode: '101',
    employeeCountCategory: COMPANY.employeeCountCategory,
    isatCategory: '62.0',
    ...overrides,
  } as unknown as CompanyReportModel
}

function makeOutlierRow(
  overrides: Partial<Record<string, unknown>> = {},
): ReportEmployeeOutlierModel {
  return {
    id: 'outlier-1',
    reportEmployeeId: 'employee-1',
    groupId: 'group-1',
    group: {
      id: 'group-1',
      name: 'Group',
      reason: 'Reason',
      action: 'Action',
      signatureName: 'Anna Admin',
      signatureRole: 'HR',
    },
    reportEmployee: {
      gender: GenderEnum.FEMALE,
      role: { title: 'Manager' },
    },
    ...overrides,
  } as unknown as ReportEmployeeOutlierModel
}

function makeCommentDto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'comment-1',
    reportId: 'report-1',
    authorKind: ReportRoleEnum.COMPANY,
    authorUserId: null,
    visibility: CommentVisibilityEnum.EXTERNAL,
    body: 'Visible to company',
    reportStatus: ReportStatusEnum.SUBMITTED,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  }
}

function makeReportResultDto(
  reportId: string,
  detectedOrdinals: number[] = [],
) {
  const aggregate = {
    overall: {
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    },
    male: {
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    },
    female: {
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    },
    neutral: {
      average: null,
      median: null,
      minimum: null,
      maximum: null,
    },
    salaryDifferences: {
      maleFemale: null,
      maleNeutral: null,
      femaleMale: null,
      femaleNeutral: null,
      neutralMale: null,
      neutralFemale: null,
    },
  }

  const snapshot = {
    totals: aggregate,
    scoreBuckets: [],
  }

  return {
    id: 'report-result-1',
    reportId,
    salaryDifferenceThresholdPercent: 3.9,
    calculationVersion: 'v1',
    base: snapshot,
    full: snapshot,
    outlierAnalysis: {
      method:
        SalaryOutlierAnalysisMethodEnum.BASE_SALARY_LINEAR_REGRESSION_BY_SCORE,
      thresholdPercent: 3.9,
      allowedDifferencePercent: 1.95,
      regressions: {
        overall: makeEmptyRegression(),
        male: makeEmptyRegression(),
        female: makeEmptyRegression(),
        neutral: makeEmptyRegression(),
      },
      employees: detectedOrdinals.map((ordinal) => ({
        ordinal,
        score: 0,
        gender: GenderEnum.MALE,
        adjustedBaseSalary: 0,
        predictedBaseSalary: 0,
        scoreBucketRangeFrom: null,
        scoreBucketRangeTo: null,
        direction: null,
        differencePercent: null,
        allowedDifferencePercent: 1.95,
        isOutlier: true,
      })),
    },
  }
}

function makeEmptyRegression() {
  return {
    slope: null,
    intercept: null,
    sampleCount: 0,
    scoreMean: null,
    adjustedBaseSalaryMean: null,
    rSquared: null,
    scoreRangeFrom: null,
    scoreRangeTo: null,
  }
}
