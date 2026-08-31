import format from 'date-fns/format'
import subMonths from 'date-fns/subMonths'

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
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import {
  CommunicationStatusEnum,
  GenderEnum,
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
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
import { ReportEmployeeOutlierModel } from '../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../report-employee/models/report-outlier-group.model'
import { IReportEventService } from '../report-event/report-event.service.interface'
import { IReportResultService } from '../report-result/report-result.service.interface'
import { SalaryAnalysisRequestDto } from '../report-statistics/dto/salary-analysis.request.dto'
import { SubmitEqualityReportDto } from './dto/submit-equality-report.dto'
import { SubmitSalaryReportDto } from './dto/submit-salary-report.dto'
import {
  SUB_CRITERION_CATALOG,
  SUB_CRITERION_GENERAL_SCALE,
} from './sub-criterion-catalog/sub-criterion-catalog.data'
import { ApplicationService } from './application.service'
import {
  EXTERNAL_PROVIDER_CHANNEL,
  ISLAND_IS_PROVIDER_CHANNEL,
  REPORT_PROVIDER_CHANNEL,
} from './provider-channel'

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
  sector: CompanySectorEnum.UNKNOWN,
  sectorOverride: false,
  legalFormId: null,
  legalFormName: null,
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

    const module = await Test.createTestingModule({
      providers: [
        ApplicationService,
        // These assertions were written for the island.is channel: provider_type
        // ISLAND_IS and provider_id stored exactly as given.
        {
          provide: REPORT_PROVIDER_CHANNEL,
          useValue: ISLAND_IS_PROVIDER_CHANNEL,
        },
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

      // ⚠️ Instructive: ordinal 1 is still the only flagged employee, but for a
      // completely different reason than before. The retired band flagged her
      // because she sat 2,7% below the fitted line — a fact about her alone.
      // She is now flagged because óskýrt is 4,97% (over 3,9%), konur are the
      // disadvantaged group, and she is the only underpaid woman in the cohort,
      // so lifting her is the whole úrbótaáætlun. Same answer, different rule.
      const gap = result.wageGapDecomposition
      expect(gap.counts).toEqual({ male: 6, female: 1, excluded: 0 })
      expect(gap.oskyrtPercent).toBeCloseTo(4.9711, 4)
      expect(gap.disadvantagedGender).toBe('FEMALE')
      // 5 carriers, not 1: the one underpaid woman plus the four men sitting
      // above the line. Carrying the gap and being liftable are different
      // things — only the first of those five is in the set.
      expect(gap.gapCarrierCount).toBe(5)
      expect(gap.minimumSetSize).toBe(1)

      expect(result.outliers).toHaveLength(1)
      expect(result.outliers[0]).toMatchObject({
        employeeOrdinal: 1,
        // 4.750 kr./klst. = (850.000 + 100.000 föst yfirvinna) / 200.
        regularHourlyWage: 4750,
        payStatus: 'UNDERPAID',
      })
      // 85,71% = exactly 6/7, and the arithmetic is worth following because the
      // number looks arbitrary. Contributions are gender-normalised: a man
      // contributes residual/6, she contributes −residual/1. Residuals sum to
      // zero over the whole cohort, so the men's residuals total −r where r is
      // hers. Óskýrt = −r/6 + (−r) = −r·7/6, and her share is −r ÷ (−r·7/6) =
      // 6/7. The remaining 1/7 is carried jointly by the six men sitting above
      // the line — which is why her share is under 100% even though she is the
      // only correctable employee.
      expect(result.outliers[0].contributionShare).toBeCloseTo(85.71, 2)

      expect(result.regularHourlyWageByScoreAll.dataPoints).toHaveLength(7)
      expect(result.regularHourlyWageByScoreAll.totals.maleCount).toBe(6)
      expect(result.regularHourlyWageByScoreAll.totals.femaleCount).toBe(1)
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

  describe('getSubCriterionCatalog', () => {
    it('returns every catalog entry and the generic step scale', () => {
      const result = service.getSubCriterionCatalog()

      expect(result.entries).toHaveLength(SUB_CRITERION_CATALOG.length)
      expect(result.generalScale).toEqual([...SUB_CRITERION_GENERAL_SCALE])
      expect(result.entries[0]).toEqual({ ...SUB_CRITERION_CATALOG[0] })
    })

    it('hands out copies, so a consumer cannot corrupt the shared catalog', () => {
      // Not a pass-through: the constants are process-wide and served to every
      // company, so the method deep-copies. A refactor to `{ ...entry }` would
      // leave `steps` shared by reference and this is what would catch it.
      const before = JSON.parse(JSON.stringify(SUB_CRITERION_CATALOG))
      const beforeScale = [...SUB_CRITERION_GENERAL_SCALE]

      const result = service.getSubCriterionCatalog()
      result.entries[0].title = 'mutated'
      result.entries[0].steps[0] = 'mutated'
      result.entries.pop()
      result.generalScale[0] = 'mutated'

      expect(JSON.parse(JSON.stringify(SUB_CRITERION_CATALOG))).toEqual(before)
      expect([...SUB_CRITERION_GENERAL_SCALE]).toEqual(beforeScale)
    })
  })

  describe('getActiveEqualityReport', () => {
    it('returns the summary when one is found', async () => {
      const summary = {
        id: 'eq-1',
        identifier: 'EQ-2025-001',
        providerId: 'island-is-application-eq-1',
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
        // No `identifier` — the creation service mints it.
        importedFromExcel: input.importedFromExcel,
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: input.providerId,
        companyAdminName: input.companyAdminName,
        companyAdminTitle: input.companyAdminTitle ?? null,
        companyAdminEmail: input.companyAdminEmail,
        companyAdminGender: input.companyAdminGender,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        averageEmployeeMaleCount: input.averageEmployeeMaleCount,
        averageEmployeeFemaleCount: input.averageEmployeeFemaleCount,
        averageEmployeeNeutralCount: input.averageEmployeeNeutralCount,
        salaryDataBasis: input.salaryDataBasis,
        salaryDataPeriod: input.salaryDataPeriod ?? null,
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

    // The renewal window is only enforced in production — everywhere else
    // testers need to be able to re-submit at will.
    describe('renewal window guard', () => {
      const originalApiEnv = process.env.API_ENV

      const companyDueIn = (years: number, months = 0) => {
        const dueAt = new Date()
        dueAt.setFullYear(dueAt.getFullYear() + years)
        dueAt.setMonth(dueAt.getMonth() + months)
        return { ...COMPANY, nextSalaryReportDueAt: dueAt }
      }

      afterEach(() => {
        if (originalApiEnv === undefined) {
          delete process.env.API_ENV
        } else {
          process.env.API_ENV = originalApiEnv
        }
      })

      it('blocks (409) when the renewal window is not open yet (due date > 6 months out)', async () => {
        process.env.API_ENV = 'prod'
        const input = makeSubmitSalaryInput()

        await expect(
          service.submitSalary(input, companyDueIn(2)),
        ).rejects.toThrow(ConflictException)
        expect(createSalary).not.toHaveBeenCalled()
      })

      it('allows submission when the due date is within 6 months', async () => {
        process.env.API_ENV = 'prod'
        const input = makeSubmitSalaryInput()

        await service.submitSalary(input, companyDueIn(0, 3))

        expect(createSalary).toHaveBeenCalled()
      })

      it('does not block outside prod even when the window is not open yet', async () => {
        process.env.API_ENV = 'dev'
        const input = makeSubmitSalaryInput()

        await service.submitSalary(input, companyDueIn(2))

        expect(createSalary).toHaveBeenCalled()
      })

      it('does not block when API_ENV is unset', async () => {
        delete process.env.API_ENV
        const input = makeSubmitSalaryInput()

        await service.submitSalary(input, companyDueIn(2))

        expect(createSalary).toHaveBeenCalled()
      })
    })
  })

  describe('getSalaryReportEligibility', () => {
    const activeEquality = {
      id: 'eq-1',
      identifier: 'EQ-2025-001',
      providerId: 'island-is-application-eq-1',
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
        // No `identifier` — the creation service mints it.
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: input.providerId,
        companyAdminName: input.companyAdminName,
        companyAdminTitle: input.companyAdminTitle ?? null,
        companyAdminEmail: input.companyAdminEmail,
        companyAdminGender: input.companyAdminGender,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        equalityReportContent: input.equalityReportContent,
        averageEmployeeMaleCount: undefined,
        averageEmployeeFemaleCount: undefined,
        averageEmployeeNeutralCount: undefined,
        companies: [makeCompanySnapshot()],
      })
      expect(result).toEqual({ reportId: 'report-1' })
    })

    it('forwards average employee counts when the applicant provides them', async () => {
      const input = makeSubmitEqualityInput()
      input.averageEmployeeMaleCount = 12
      input.averageEmployeeFemaleCount = 18
      input.averageEmployeeNeutralCount = 2

      await service.submitEquality(input, COMPANY)

      expect(createEquality).toHaveBeenCalledWith(
        expect.objectContaining({
          averageEmployeeMaleCount: 12,
          averageEmployeeFemaleCount: 18,
          averageEmployeeNeutralCount: 2,
        }),
      )
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
    const EQUALITY_PROVIDER_ID = 'island-is-application-bb'

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
        providerType: ReportProviderEnum.ISLAND_IS,
        providerId: EQUALITY_PROVIDER_ID,
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
      // `providerId` is carried through so the portal can fetch the linked
      // equality report's own detail via `GET /application/reports/:providerId`.
      expect(result.equalityReport).toEqual({
        id: EQUALITY_REPORT_ID,
        identifier: 'EQ-2025-001',
        providerId: EQUALITY_PROVIDER_ID,
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

  describe('getReportOutliers', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'

    // The portal renders the improvement plan grouped by role, so the page has
    // to arrive sorted by role title with the employee's ordinal breaking ties
    // — the same order the draft employee lists serve, so a row keeps its place
    // as the report moves from draft to submitted. Sorted by the query, not the
    // mapped page, or paging would slice an unordered set.
    it('orders by role title, then by employee ordinal', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({ id: REPORT_ID, providerId: PROVIDER_ID }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])

      await service.getReportOutliers(PROVIDER_ID, COMPANY, {
        page: 1,
        pageSize: 10,
      })

      const order = outlierFindAndCountAll.mock.calls[0][0].order as Array<
        Array<{ as?: string } | string>
      >

      expect(order).toHaveLength(2)
      expect((order[0][0] as { as: string }).as).toBe('reportEmployee')
      expect((order[0][1] as { as: string }).as).toBe('role')
      expect(order[0][2]).toBe('title')
      expect(order[0][3]).toBe('ASC')
      expect((order[1][0] as { as: string }).as).toBe('reportEmployee')
      expect(order[1][1]).toBe('ordinal')
      expect(order[1][2]).toBe('ASC')
    })
  })

  describe('getReportComments', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const PROVIDER_ID = 'island-is-application-aa'

    it('throws NotFoundException when no report matches the providerId', async () => {
      reportFindOne.mockResolvedValueOnce(null)

      await expect(
        service.getReportComments(PROVIDER_ID, COMPANY),
      ).rejects.toThrow(NotFoundException)
      expect(getCommentsByReportId).not.toHaveBeenCalled()
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
        service.getReportComments(PROVIDER_ID, COMPANY),
      ).rejects.toThrow(NotFoundException)
      expect(getCommentsByReportId).not.toHaveBeenCalled()
    })

    it('reads through the COMPANY actor context and returns slim comment DTOs', async () => {
      const comment = makeCommentDto({
        id: 'comment-1',
        reportId: REPORT_ID,
        body: 'Reviewer asked for a correction',
        authorKind: ReportRoleEnum.REVIEWER,
        authorUserId: 'reviewer-1',
      })
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          providerId: PROVIDER_ID,
          status: ReportStatusEnum.IN_REVIEW,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getCommentsByReportId.mockResolvedValueOnce([comment])

      const result = await service.getReportComments(PROVIDER_ID, COMPANY)

      expect(result).toEqual([
        {
          id: 'comment-1',
          authorKind: ReportRoleEnum.REVIEWER,
          body: 'Reviewer asked for a correction',
          createdAt: comment.createdAt,
        },
      ])
      expect(result[0]).not.toHaveProperty('visibility')
      expect(result[0]).not.toHaveProperty('authorUserId')
      // The COMPANY actor kind is what makes ReportCommentService filter the
      // thread down to EXTERNAL comments.
      expect(getCommentsByReportId).toHaveBeenCalledWith({
        reportId: REPORT_ID,
        reportStatus: ReportStatusEnum.IN_REVIEW,
        actor: {
          kind: ReportRoleEnum.COMPANY,
          nationalId: COMPANY.nationalId,
        },
      })
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
      // Editing IS the applicant's response. Scoped to AWAITING_RESPONSE in the
      // WHERE clause so a thread that was never opened is not reported as
      // answered, and a CLOSED one is not reopened.
      expect(reportUpdate).toHaveBeenCalledWith(
        { communicationStatus: CommunicationStatusEnum.RESPONSE_RECEIVED },
        {
          where: {
            id: REPORT_ID,
            communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
          },
        },
      )
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

    it('force-closes the communication thread on withdraw', async () => {
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

      // Silent — the WITHDRAWN event is the audit record of why it closed.
      expect(reportUpdate).toHaveBeenCalledWith(
        { communicationStatus: CommunicationStatusEnum.CLOSED },
        { where: { id: REPORT_ID } },
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
      // The handover is attempted here too, but the WHERE clause is what keeps
      // it harmless on a POSTPONED report whose thread was never opened: only a
      // row already sitting at AWAITING_RESPONSE matches.
      expect(reportUpdate).toHaveBeenCalledWith(
        { communicationStatus: CommunicationStatusEnum.RESPONSE_RECEIVED },
        {
          where: {
            id: REPORT_ID,
            communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
          },
        },
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
      // Status is NOT updated. Pinned by naming the only write rather than by
      // "reportUpdate was never called", which stopped meaning "status
      // preserved" once the communication handover started writing here too.
      expect(reportUpdate).toHaveBeenCalledTimes(1)
      expect(reportUpdate).toHaveBeenCalledWith(
        { communicationStatus: CommunicationStatusEnum.RESPONSE_RECEIVED },
        {
          where: {
            id: REPORT_ID,
            communicationStatus: CommunicationStatusEnum.AWAITING_RESPONSE,
          },
        },
      )
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
    gender,
    field: 'Mgmt',
    department: 'Mgmt',
    startDate: '2021-01-01',
    // A full month with overtime, so (baseSalary + 100.000) / 200 reads as a
    // plausible kr./klst. rate rather than a per-hour monthly salary.
    paidHours: 200,
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
    importedFromExcel: true,
    providerId: 'salary-provider-1',
    companyAdminName: 'Anna Admin',
    companyAdminTitle: 'Framkvæmdastjóri',
    companyAdminEmail: 'admin@example.is',
    companyAdminGender: GenderEnum.FEMALE,
    contactName: 'Bjorn Contact',
    contactEmail: 'contact@example.is',
    contactPhone: '+354 555 0000',
    averageEmployeeMaleCount: 30,
    averageEmployeeFemaleCount: 40,
    averageEmployeeNeutralCount: 5,
    salaryDataBasis: SalaryDataBasisEnum.MONTH,
    // Inside the API's 36-month reporting window whenever the suite runs.
    salaryDataPeriod: `${format(subMonths(new Date(), 1), 'yyyy-MM')}-01`,
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
    providerId: 'equality-provider-1',
    companyAdminName: 'Anna Admin',
    companyAdminTitle: 'Framkvæmdastjóri',
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
    calculationVersion: 'v3',
    salary: snapshot,
    // `detectedOrdinals` are now the LÁGMARKSMENGI, flagged by `inMinimumSet`
    // rather than by a per-employee band. `editOutliers` reads this to check the
    // submitted groups cover exactly the flagged set.
    wageGapDecomposition: {
      oskyrtAvailable: true,
      oskyrtPercent: 5.5,
      benchmarkPercent: 3.9,
      minimumSetSize: detectedOrdinals.length,
      employees: detectedOrdinals.map((ordinal) => ({
        ordinal,
        score: 0,
        gender: GenderEnum.FEMALE,
        hourlyWage: 4750,
        expectedHourlyWage: 5000,
        deviationPercent: -5,
        payStatus: 'UNDERPAID',
        contributionShare: 100 / Math.max(detectedOrdinals.length, 1),
        widensGap: true,
        inMinimumSet: true,
      })),
    },
  }
}
