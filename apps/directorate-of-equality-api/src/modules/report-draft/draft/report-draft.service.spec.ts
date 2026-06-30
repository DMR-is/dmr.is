import { UniqueConstraintError } from 'sequelize'

import { ConflictException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import {
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../../report/models/report.enums'
import { ReportModel } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { ReportDraftService } from './report-draft.service'

const REPORT_ID = 'report-id-1'
const EXISTING_DRAFT_ID = '00000000-0000-0000-0000-0000000000df'
const COMPANY_NATIONAL_ID = '5500000000'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY: CompanyDto = {
  id: 'company-1',
  name: 'Acme ehf.',
  employeeCountCategory: CompanySizeEnum.LARGE,
  nationalId: COMPANY_NATIONAL_ID,
  status: CompanyStatusEnum.ACTIVE,
  email: null,
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
}

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportDraftService', () => {
  let service: ReportDraftService
  let reportCreate: jest.Mock
  let reportFindOne: jest.Mock
  let reportUpdate: jest.Mock
  let employeeCount: jest.Mock
  let criterionCount: jest.Mock
  let outlierGroupCount: jest.Mock

  const draftInput = (overrides = {}) => ({
    type: ReportTypeEnum.SALARY,
    providerType: ReportProviderEnum.ISLAND_IS,
    providerId: PROVIDER_ID,
    companyNationalId: COMPANY_NATIONAL_ID,
    ...overrides,
  })

  beforeEach(async () => {
    reportCreate = jest.fn().mockResolvedValue({ id: REPORT_ID })
    reportFindOne = jest.fn().mockResolvedValue(null)
    reportUpdate = jest.fn().mockResolvedValue([1])
    employeeCount = jest.fn().mockResolvedValue(0)
    criterionCount = jest.fn().mockResolvedValue(0)
    outlierGroupCount = jest.fn().mockResolvedValue(0)

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: {
            create: reportCreate,
            findOne: reportFindOne,
            update: reportUpdate,
          },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { count: employeeCount },
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { count: criterionCount },
        },
        {
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: { count: outlierGroupCount },
        },
      ],
    }).compile()

    service = module.get(ReportDraftService)
  })

  describe('createDraft', () => {
    it('inserts a DRAFT report row with no events when no tuple exists', async () => {
      reportFindOne.mockResolvedValueOnce(null)

      const result = await service.createDraft(draftInput())

      expect(result).toEqual({ reportId: REPORT_ID })
      expect(reportCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.DRAFT,
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: 'island-is-application-uuid-draft',
          companyNationalId: COMPANY_NATIONAL_ID,
          importedFromExcel: false,
        }),
      )
    })

    it('returns the existing reportId without inserting when the tuple already exists for the same company', async () => {
      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_DRAFT_ID,
        companyNationalId: COMPANY_NATIONAL_ID,
      })

      const result = await service.createDraft(draftInput())

      expect(result).toEqual({ reportId: EXISTING_DRAFT_ID })
      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('rejects with 409 when the existing tuple belongs to a different company', async () => {
      reportFindOne.mockResolvedValueOnce({
        id: EXISTING_DRAFT_ID,
        companyNationalId: '9999999999',
      })

      await expect(service.createDraft(draftInput())).rejects.toThrow(
        ConflictException,
      )
      expect(reportCreate).not.toHaveBeenCalled()
    })

    it('treats a concurrent unique-constraint race as a replay and returns the winner', async () => {
      // 1st findOne (replay check) → none, so we attempt insert.
      // insert loses the race → UniqueConstraintError.
      // 2nd findOne (post-race re-lookup) → the winning row.
      reportFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: EXISTING_DRAFT_ID,
        companyNationalId: COMPANY_NATIONAL_ID,
      })
      reportCreate.mockRejectedValueOnce(new UniqueConstraintError({}))

      const result = await service.createDraft(draftInput())

      expect(result).toEqual({ reportId: EXISTING_DRAFT_ID })
    })
  })

  describe('getDraftDetail', () => {
    const draftRow = {
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
      status: ReportStatusEnum.DRAFT,
      identifier: null,
      companyAdminName: 'Admin',
      companyAdminEmail: 'admin@example.is',
      companyAdminGender: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      companyNationalId: COMPANY_NATIONAL_ID,
      averageEmployeeMaleCount: null,
      averageEmployeeFemaleCount: null,
      averageEmployeeNeutralCount: null,
      equalityReportContent: null,
      createdAt: new Date('2026-06-30T00:00:00Z'),
      updatedAt: new Date('2026-06-30T00:00:00Z'),
    }

    it('returns the draft header plus child-collection counts', async () => {
      reportFindOne.mockResolvedValueOnce(draftRow)
      employeeCount.mockResolvedValueOnce(3)
      criterionCount.mockResolvedValueOnce(5)
      outlierGroupCount.mockResolvedValueOnce(1)

      const result = await service.getDraftDetail(PROVIDER_ID, COMPANY)

      expect(result).toMatchObject({
        id: REPORT_ID,
        type: ReportTypeEnum.SALARY,
        status: ReportStatusEnum.DRAFT,
        companyAdminEmail: 'admin@example.is',
        counts: { employees: 3, criteria: 5, outlierGroups: 1 },
      })
    })

    it('404s when the report belongs to a different company', async () => {
      reportFindOne.mockResolvedValueOnce({
        ...draftRow,
        companyNationalId: '9999999999',
      })

      await expect(
        service.getDraftDetail(PROVIDER_ID, COMPANY),
      ).rejects.toThrow(NotFoundException)
    })

    it('404s when the report has already been submitted (not a draft)', async () => {
      reportFindOne.mockResolvedValueOnce({
        ...draftRow,
        status: ReportStatusEnum.SUBMITTED,
      })

      await expect(
        service.getDraftDetail(PROVIDER_ID, COMPANY),
      ).rejects.toThrow(NotFoundException)
    })

    it('404s when no report exists for the tuple', async () => {
      reportFindOne.mockResolvedValueOnce(null)

      await expect(
        service.getDraftDetail(PROVIDER_ID, COMPANY),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateDraft', () => {
    const draftRow = {
      id: REPORT_ID,
      type: ReportTypeEnum.SALARY,
      status: ReportStatusEnum.DRAFT,
      identifier: null,
      companyAdminName: 'Old name',
      companyAdminEmail: null,
      companyAdminGender: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      companyNationalId: COMPANY_NATIONAL_ID,
      averageEmployeeMaleCount: null,
      averageEmployeeFemaleCount: null,
      averageEmployeeNeutralCount: null,
      equalityReportContent: null,
      createdAt: new Date('2026-06-30T00:00:00Z'),
      updatedAt: new Date('2026-06-30T00:00:00Z'),
    }

    it('writes only the provided keys and clears on explicit null', async () => {
      // 1st findOne → ownership/draft check; 2nd findOne → getDraftDetail reload.
      reportFindOne.mockResolvedValue(draftRow)
      reportUpdate.mockResolvedValueOnce([1])

      await service.updateDraft(PROVIDER_ID, COMPANY, {
        companyAdminEmail: 'new@example.is',
        contactName: null,
      })

      expect(reportUpdate).toHaveBeenCalledWith(
        { companyAdminEmail: 'new@example.is', contactName: null },
        { where: { id: REPORT_ID } },
      )
    })

    it('does not issue an update when the patch is empty', async () => {
      reportFindOne.mockResolvedValue(draftRow)

      await service.updateDraft(PROVIDER_ID, COMPANY, {})

      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('404s when the draft is not owned by the company', async () => {
      reportFindOne.mockResolvedValueOnce({
        ...draftRow,
        companyNationalId: '9999999999',
      })

      await expect(
        service.updateDraft(PROVIDER_ID, COMPANY, { contactName: 'x' }),
      ).rejects.toThrow(NotFoundException)
      expect(reportUpdate).not.toHaveBeenCalled()
    })
  })
})
