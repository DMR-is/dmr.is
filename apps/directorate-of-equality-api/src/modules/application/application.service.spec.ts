import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { ICompanyService } from '../company/company.service.interface'
import { CompanyDto } from '../company/dto/company.dto'
import { CompanyReportModel } from '../company/models/company-report.model'
import { IConfigService } from '../config/config.service.interface'
import {
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
import { IReportResultService } from '../report-result/report-result.service.interface'
import { SalaryAnalysisRequestDto } from './dto/salary-analysis.request.dto'
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
  averageEmployeeCountFromRsk: 3,
  nationalId: '5501234567',
  salaryReportRequired: true,
  salaryReportRequiredOverride: false,
}

describe('ApplicationService', () => {
  let service: ApplicationService
  let configGetByKey: jest.Mock
  let getOrCreateReportSnapshotSource: jest.Mock
  let getActiveEqualityForCompany: jest.Mock
  let createSalary: jest.Mock
  let createEquality: jest.Mock
  let reportFindOne: jest.Mock
  let companyReportFindAll: jest.Mock
  let outlierFindAll: jest.Mock
  let eventFindOne: jest.Mock
  let getCommentsByReportId: jest.Mock
  let getResultByReportId: jest.Mock

  beforeEach(async () => {
    configGetByKey = jest.fn().mockResolvedValue({
      key: 'salary_difference_threshold_percent',
      value: '3.9',
    })
    getOrCreateReportSnapshotSource = jest
      .fn()
      .mockResolvedValue(makeCompanySnapshotSource())
    getActiveEqualityForCompany = jest.fn()
    createSalary = jest.fn().mockResolvedValue({ reportId: 'report-1' })
    createEquality = jest.fn().mockResolvedValue({ reportId: 'report-1' })
    reportFindOne = jest.fn()
    companyReportFindAll = jest.fn().mockResolvedValue([])
    outlierFindAll = jest.fn().mockResolvedValue([])
    eventFindOne = jest.fn().mockResolvedValue(null)
    getCommentsByReportId = jest.fn().mockResolvedValue([])
    getResultByReportId = jest.fn()

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
            getOrCreateReportSnapshotSource,
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
          useValue: { getByReportId: getCommentsByReportId },
        },
        {
          provide: IReportResultService,
          useValue: { getByReportId: getResultByReportId },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: { findOne: reportFindOne },
        },
        {
          provide: getModelToken(CompanyReportModel),
          useValue: { findAll: companyReportFindAll },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: { findAll: outlierFindAll },
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
    it('returns outliers (with bucket + assessment) and the gender-vs-score chart', async () => {
      const result = await service.salaryAnalysis(makeRequest(), COMPANY)

      expect(configGetByKey).toHaveBeenCalledWith(
        'salary_difference_threshold_percent',
      )

      // Ordinal 1 sits 16.7% below the bucket median (1,200,000), well past the
      // 1.95% half-threshold band — flagged. Ordinals 2 and 3 fall inside the
      // band and are not flagged.
      expect(result.outliers).toHaveLength(1)
      expect(result.outliers[0]).toMatchObject({
        employeeOrdinal: 1,
        adjustedBaseSalary: 1000000,
        direction: 'BELOW',
        referenceSalary: 1200000,
        scoreBucketRangeFrom: 200,
        scoreBucketRangeTo: 300,
      })
      expect(result.outliers[0].differencePercent).toBeCloseTo(-16.6667, 2)
      expect(result.outliers[0].allowedDifferencePercent).toBeCloseTo(1.95, 4)

      expect(result.baseSalaryByGenderAndScoreAll.dataPoints).toHaveLength(3)
      expect(result.baseSalaryByGenderAndScoreAll.totals.maleCount).toBe(2)
      expect(result.baseSalaryByGenderAndScoreAll.totals.femaleCount).toBe(1)
    })

    it('rejects malformed parsed payloads with a 400', async () => {
      const request = makeRequest()
      // Inject a duplicate role title — should fail integrity check.
      request.parsed.roles.push({ ...request.parsed.roles[0] })

      await expect(service.salaryAnalysis(request, COMPANY)).rejects.toThrow(
        BadRequestException,
      )
      expect(configGetByKey).not.toHaveBeenCalled()
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

      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
      expect(createSalary).toHaveBeenCalledWith({
        equalityReportId: input.equalityReportId,
        identifier: input.identifier,
        importedFromExcel: input.importedFromExcel,
        providerType: input.providerType,
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
        outliers: undefined,
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
      getOrCreateReportSnapshotSource.mockResolvedValueOnce(source)

      await service.submitSalary(input, COMPANY)

      expect(getOrCreateReportSnapshotSource).toHaveBeenCalledWith({
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
      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
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
      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
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
      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
      expect(createSalary).not.toHaveBeenCalled()
    })
  })

  describe('submitEquality', () => {
    it('maps the application body to the internal equality create DTO', async () => {
      const input = makeSubmitEqualityInput()

      const result = await service.submitEquality(input, COMPANY)

      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
      expect(createEquality).toHaveBeenCalledWith({
        identifier: input.identifier,
        providerType: input.providerType,
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
      getOrCreateReportSnapshotSource.mockResolvedValueOnce(source)

      await service.submitEquality(input, COMPANY)

      expect(getOrCreateReportSnapshotSource).toHaveBeenCalledWith({
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
      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
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
      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
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
      expect(getOrCreateReportSnapshotSource).not.toHaveBeenCalled()
      expect(createEquality).not.toHaveBeenCalled()
    })
  })

  describe('getReport', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
    const EQUALITY_REPORT_ID = '00000000-0000-0000-0000-0000000000bb'

    it("throws NotFoundException when the report doesn't exist", async () => {
      reportFindOne.mockResolvedValueOnce(null)

      await expect(service.getReport(REPORT_ID, COMPANY)).rejects.toThrow(
        NotFoundException,
      )
      expect(companyReportFindAll).not.toHaveBeenCalled()
    })

    it("throws NotFoundException when the resolved company isn't the parent", async () => {
      reportFindOne.mockResolvedValueOnce(makeReportRow({ id: REPORT_ID }))
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({
          reportId: REPORT_ID,
          companyId: 'someone-else',
          parentCompanyId: null,
        }),
      ])

      await expect(service.getReport(REPORT_ID, COMPANY)).rejects.toThrow(
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
      outlierFindAll.mockResolvedValueOnce([outlier])
      getCommentsByReportId.mockResolvedValueOnce([externalComment])

      const result = await service.getReport(REPORT_ID, COMPANY)

      expect(result).toMatchObject({
        id: REPORT_ID,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.SUBMITTED,
        identifier: 'SAL-2026-001',
        submittedAt,
        equalityReportContent: null,
        outliersPostponed: false,
        result: reportResult,
        externalComments: [externalComment],
        denialReason: null,
      })
      expect(result.companies).toHaveLength(2)
      expect(result.equalityReport).toEqual({
        id: EQUALITY_REPORT_ID,
        identifier: 'EQ-2025-001',
        approvedAt,
        validUntil,
      })
      expect(result.outliers).toEqual([
        {
          id: outlier.id,
          reportEmployeeId: outlier.reportEmployeeId,
          reason: outlier.reason,
          action: outlier.action,
          signatureName: outlier.signatureName,
          signatureRole: outlier.signatureRole,
        },
      ])
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

      const result = await service.getReport(REPORT_ID, COMPANY)

      expect(result.equalityReport).toBeNull()
      expect(result.equalityReportContent).toBe('Equality plan narrative')
      expect(result.outliers).toEqual([])
      expect(result.outliersPostponed).toBeNull()
      expect(result.result).toBeNull()
      expect(getResultByReportId).not.toHaveBeenCalled()
      expect(outlierFindAll).not.toHaveBeenCalled()
    })

    it('surfaces the latest denial reason when the report is DENIED', async () => {
      reportFindOne.mockResolvedValueOnce(
        makeReportRow({
          id: REPORT_ID,
          status: ReportStatusEnum.DENIED,
          type: ReportTypeEnum.EQUALITY,
        }),
      )
      companyReportFindAll.mockResolvedValueOnce([
        makeCompanyReportRow({ reportId: REPORT_ID }),
      ])
      getCommentsByReportId.mockResolvedValueOnce([])
      eventFindOne.mockResolvedValueOnce({ reason: 'Missing explanation' })

      const result = await service.getReport(REPORT_ID, COMPANY)

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

    it('loads comments through company context so internal comments are stripped', async () => {
      const externalComment = makeCommentDto({
        reportId: REPORT_ID,
        visibility: CommentVisibilityEnum.EXTERNAL,
      })
      reportFindOne.mockResolvedValueOnce(makeReportRow({ id: REPORT_ID }))
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

      const result = await service.getReport(REPORT_ID, COMPANY)

      expect(result.externalComments).toEqual([externalComment])
      expect(result.externalComments).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            visibility: CommentVisibilityEnum.INTERNAL,
          }),
        ]),
      )
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
                { order: 1, description: 'low', score: 10 },
                { order: 5, description: 'high', score: 250 },
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
        makeEmployee({
          ordinal: 1,
          gender: GenderEnum.FEMALE,
          baseSalary: 1000000,
        }),
        makeEmployee({
          ordinal: 2,
          gender: GenderEnum.MALE,
          baseSalary: 1200000,
        }),
        makeEmployee({
          ordinal: 3,
          gender: GenderEnum.MALE,
          baseSalary: 1210000,
        }),
      ],
    },
  }
}

function makeEmployee({
  ordinal,
  gender,
  baseSalary,
}: {
  ordinal: number
  gender: GenderEnum
  baseSalary: number
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
    additionalSalary: 100000,
    bonusSalary: null,
    personalStepAssignments: [],
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
  overrides: Partial<Omit<CreateReportCompanySnapshotDto, 'parentCompanyId'>> = {},
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
    providerType: ReportProviderEnum.SYSTEM,
    providerId: null,
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
    type: ReportTypeEnum.EQUALITY,
    status: ReportStatusEnum.SUBMITTED,
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
    averageEmployeeCountFromRsk: COMPANY.averageEmployeeCountFromRsk,
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
    reason: 'Reason',
    action: 'Action',
    signatureName: 'Anna Admin',
    signatureRole: 'HR',
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

function makeReportResultDto(reportId: string) {
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
  }
}
