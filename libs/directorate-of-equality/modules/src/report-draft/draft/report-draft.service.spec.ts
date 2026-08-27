import format from 'date-fns/format'
import subMonths from 'date-fns/subMonths'
import { UniqueConstraintError } from 'sequelize'

import { ConflictException, NotFoundException } from '@nestjs/common'
import { getConnectionToken, getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySectorEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { REPORT_IDENTIFIER_INDEX } from '../../report/lib/report-identifier'
import {
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.enums'
import { ReportModel } from '../../report/models/report.model'
import { ReportCriterionModel } from '../../report-criterion/models/report-criterion.model'
import { ReportSubCriterionModel } from '../../report-criterion/models/report-sub-criterion.model'
import { ReportSubCriterionStepModel } from '../../report-criterion/models/report-sub-criterion-step.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportEmployeePersonalCriterionStepModel } from '../../report-employee/models/report-employee-personal-criterion-step.model'
import { ReportEmployeeRoleModel } from '../../report-employee/models/report-employee-role.model'
import { ReportEmployeeRoleCriterionStepModel } from '../../report-employee/models/report-employee-role-criterion-step.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { ReportDraftService } from './report-draft.service'

const REPORT_ID = 'report-id-1'
const EXISTING_DRAFT_ID = '00000000-0000-0000-0000-0000000000df'

// A payroll month inside the API's 36-month reporting window, derived from the
// clock so the fixture cannot age out of the bound.
const PERIOD_MONTH = format(subMonths(new Date(), 1), 'yyyy-MM')
const PERIOD_INPUT = `${PERIOD_MONTH}-17`
const PERIOD_STORED = `${PERIOD_MONTH}-01`
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
  sector: CompanySectorEnum.UNKNOWN,
  sectorOverride: false,
  legalFormId: null,
  legalFormName: null,
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
  let reportFindAll: jest.Mock
  let reportUpdate: jest.Mock
  let reportDestroy: jest.Mock
  let employeeCount: jest.Mock
  let criterionCount: jest.Mock
  let outlierGroupCount: jest.Mock
  let transaction: jest.Mock

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
    reportFindAll = jest.fn().mockResolvedValue([])
    reportUpdate = jest.fn().mockResolvedValue([1])
    reportDestroy = jest.fn().mockResolvedValue(1)
    employeeCount = jest.fn().mockResolvedValue(0)
    criterionCount = jest.fn().mockResolvedValue(0)
    outlierGroupCount = jest.fn().mockResolvedValue(0)
    transaction = jest.fn((cb: () => unknown) => cb())

    // Child models used by the hard-cascade delete — default to no children.
    const childModel = () => ({
      findAll: jest.fn().mockResolvedValue([]),
      destroy: jest.fn().mockResolvedValue(0),
    })

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          // createDraft wraps its insert in a nested transaction so the
          // replay-recovery SELECT is legal after a unique violation aborts the
          // savepoint. Pass the callback straight through.
          provide: getConnectionToken(),
          useValue: { transaction },
        },
        {
          provide: getModelToken(ReportModel),
          useValue: {
            create: reportCreate,
            findOne: reportFindOne,
            findAll: reportFindAll,
            update: reportUpdate,
            destroy: reportDestroy,
          },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { count: employeeCount, ...childModel() },
        },
        {
          provide: getModelToken(ReportCriterionModel),
          useValue: { count: criterionCount, ...childModel() },
        },
        {
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: { count: outlierGroupCount, ...childModel() },
        },
        {
          provide: getModelToken(ReportEmployeeRoleModel),
          useValue: childModel(),
        },
        {
          provide: getModelToken(ReportSubCriterionModel),
          useValue: childModel(),
        },
        {
          provide: getModelToken(ReportSubCriterionStepModel),
          useValue: childModel(),
        },
        {
          provide: getModelToken(ReportEmployeeRoleCriterionStepModel),
          useValue: childModel(),
        },
        {
          provide: getModelToken(ReportEmployeePersonalCriterionStepModel),
          useValue: childModel(),
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: childModel(),
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

    it('rethrows an identifier collision instead of treating it as a replay', async () => {
      // The whole point of scoping the catch to the provider-tuple constraint:
      // a violation on `identifier` is a different failure, and swallowing it as
      // a replay would return some other company's draft id.
      const collision = new UniqueConstraintError({})
      Object.defineProperty(collision, 'parent', {
        value: Object.assign(new Error('duplicate key'), {
          constraint: REPORT_IDENTIFIER_INDEX,
        }),
      })
      reportFindOne.mockResolvedValueOnce(null)
      reportCreate.mockRejectedValueOnce(collision)

      await expect(service.createDraft(draftInput())).rejects.toThrow(
        UniqueConstraintError,
      )
      // No post-race re-lookup: the replay path must not run.
      expect(reportFindOne).toHaveBeenCalledTimes(1)
    })

    it('runs the insert inside its own transaction so replay recovery is legal', async () => {
      // A unique violation aborts the request's CLS transaction, so the
      // post-race SELECT would fail with 25P02 unless the insert had its own
      // savepoint to roll back to.
      await service.createDraft(draftInput())

      expect(transaction).toHaveBeenCalledTimes(1)
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
      companyAdminTitle: 'Framkvæmdastjóri',
      companyAdminEmail: 'admin@example.is',
      companyAdminGender: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      companyNationalId: COMPANY_NATIONAL_ID,
      averageEmployeeMaleCount: null,
      averageEmployeeFemaleCount: null,
      averageEmployeeNeutralCount: null,
      salaryDataBasis: SalaryDataBasisEnum.MONTH,
      salaryDataPeriod: '2026-03-01',
      equalityReportContent: null,
      importedFromExcel: true,
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
        // Printed on the generated PDF as "Starfsheiti", so the portal has to
        // be able to read it back as well as write it.
        companyAdminTitle: 'Framkvæmdastjóri',
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: '2026-03-01',
        // The portal has to be able to tell whether it is looking at a draft it
        // uploaded a workbook for or one being keyed in by hand.
        importedFromExcel: true,
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
      companyAdminTitle: null,
      companyAdminEmail: null,
      companyAdminGender: null,
      contactName: null,
      contactEmail: null,
      contactPhone: null,
      companyNationalId: COMPANY_NATIONAL_ID,
      averageEmployeeMaleCount: null,
      averageEmployeeFemaleCount: null,
      averageEmployeeNeutralCount: null,
      salaryDataBasis: null,
      salaryDataPeriod: null,
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

    it('patches the company executive job title', async () => {
      reportFindOne.mockResolvedValue(draftRow)
      reportUpdate.mockResolvedValueOnce([1])

      await service.updateDraft(PROVIDER_ID, COMPANY, {
        companyAdminTitle: 'Framkvæmdastjóri',
      })

      expect(reportUpdate).toHaveBeenCalledWith(
        { companyAdminTitle: 'Framkvæmdastjóri' },
        { where: { id: REPORT_ID } },
      )
    })

    it('normalises a declared salary-data month to the 1st', async () => {
      reportFindOne.mockResolvedValue(draftRow)
      reportUpdate.mockResolvedValueOnce([1])

      await service.updateDraft(PROVIDER_ID, COMPANY, {
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: PERIOD_INPUT,
      })

      expect(reportUpdate).toHaveBeenCalledWith(
        {
          salaryDataBasis: SalaryDataBasisEnum.MONTH,
          salaryDataPeriod: PERIOD_STORED,
        },
        { where: { id: REPORT_ID } },
      )
    })

    it('clears a previously stated month when switching to the twelve-month average', async () => {
      reportFindOne.mockResolvedValue({
        ...draftRow,
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: PERIOD_STORED,
      })
      reportUpdate.mockResolvedValueOnce([1])

      await service.updateDraft(PROVIDER_ID, COMPANY, {
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
      })

      expect(reportUpdate).toHaveBeenCalledWith(
        {
          salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
          salaryDataPeriod: null,
        },
        { where: { id: REPORT_ID } },
      )
    })

    // The stored basis, not just the incoming keys, decides what is written —
    // otherwise this PATCH lands `(AVERAGE, <month>)` and the CHECK constraint
    // turns a legitimate partial PATCH into a 500.
    it('drops a month-only PATCH while the stored basis is the twelve-month average', async () => {
      reportFindOne.mockResolvedValue({
        ...draftRow,
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
        salaryDataPeriod: null,
      })
      reportUpdate.mockResolvedValueOnce([1])

      await service.updateDraft(PROVIDER_ID, COMPANY, {
        salaryDataPeriod: PERIOD_INPUT,
      })

      expect(reportUpdate).toHaveBeenCalledWith(
        { salaryDataPeriod: null },
        { where: { id: REPORT_ID } },
      )
    })

    it('clears the stored month when the applicant undeclares the basis', async () => {
      reportFindOne.mockResolvedValue({
        ...draftRow,
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: PERIOD_STORED,
      })
      reportUpdate.mockResolvedValueOnce([1])

      await service.updateDraft(PROVIDER_ID, COMPANY, {
        salaryDataBasis: null,
      })

      expect(reportUpdate).toHaveBeenCalledWith(
        { salaryDataBasis: null, salaryDataPeriod: null },
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

  describe('deleteDraft', () => {
    const ownedDraft = {
      id: REPORT_ID,
      status: ReportStatusEnum.DRAFT,
      companyNationalId: COMPANY_NATIONAL_ID,
    }

    it('hard-deletes the report row after clearing its (empty) child tree', async () => {
      reportFindOne.mockResolvedValueOnce(ownedDraft)

      await service.deleteDraft(PROVIDER_ID, COMPANY)

      expect(reportDestroy).toHaveBeenCalledWith({ where: { id: REPORT_ID } })
    })

    it('404s (and deletes nothing) when the report is not a draft', async () => {
      reportFindOne.mockResolvedValueOnce({
        ...ownedDraft,
        status: ReportStatusEnum.SUBMITTED,
      })

      await expect(service.deleteDraft(PROVIDER_ID, COMPANY)).rejects.toThrow(
        NotFoundException,
      )
      expect(reportDestroy).not.toHaveBeenCalled()
    })
  })

  describe('pruneStaleDrafts', () => {
    it('hard-deletes every stale draft and returns the count', async () => {
      const cutoff = new Date('2026-01-01T00:00:00Z')
      reportFindAll.mockResolvedValueOnce([
        { id: 'draft-a' },
        { id: 'draft-b' },
      ])

      const pruned = await service.pruneStaleDrafts(cutoff)

      expect(pruned).toBe(2)
      // The stale query is scoped to DRAFT rows older than the cutoff.
      expect(reportFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ReportStatusEnum.DRAFT }),
        }),
      )
      // Each stale draft's report row is destroyed by the cascade.
      expect(reportDestroy).toHaveBeenCalledWith({ where: { id: 'draft-a' } })
      expect(reportDestroy).toHaveBeenCalledWith({ where: { id: 'draft-b' } })
    })

    it('returns 0 and deletes nothing when there are no stale drafts', async () => {
      reportFindAll.mockResolvedValueOnce([])

      const pruned = await service.pruneStaleDrafts(new Date())

      expect(pruned).toBe(0)
      expect(reportDestroy).not.toHaveBeenCalled()
    })
  })

  // Identifier minting moved to `ReportIdentifierService` — see
  // report-identifier/report-identifier.service.spec.ts. It never belonged to
  // drafts; both creation paths share it.

  describe('touchDraft', () => {
    // The reaper keys off the report ROW's updated_at, but bulk sync writes
    // only children — so it calls this to register the activity. A plain
    // no-column update would issue no query at all, hence the explicit
    // timestamp. (Workbook import registers via markImportedFromExcel, which
    // writes a column of its own and the timestamp in one statement.)
    it('bumps the report row updated_at without touching any other column', async () => {
      reportUpdate.mockResolvedValueOnce([1])

      await service.touchDraft(REPORT_ID)

      expect(reportUpdate).toHaveBeenCalledWith(
        { updatedAt: expect.any(Date) },
        { where: { id: REPORT_ID }, silent: true },
      )
    })
  })

  describe('markImportedFromExcel', () => {
    it('sets the flag and registers the import as activity in one statement', async () => {
      reportUpdate.mockResolvedValueOnce([1])

      await service.markImportedFromExcel(REPORT_ID)

      expect(reportUpdate).toHaveBeenCalledWith(
        { importedFromExcel: true, updatedAt: expect.any(Date) },
        { where: { id: REPORT_ID }, silent: true },
      )
    })

    it('writes unconditionally, so a re-import still moves updated_at', async () => {
      // The flag is already true on the second import. A conditional or
      // change-tracked write would issue no query and the reaper would count a
      // draft the employer just re-populated as inactive.
      reportUpdate.mockResolvedValue([1])

      await service.markImportedFromExcel(REPORT_ID)
      await service.markImportedFromExcel(REPORT_ID)

      expect(reportUpdate).toHaveBeenCalledTimes(2)
      expect(reportUpdate).toHaveBeenNthCalledWith(
        2,
        { importedFromExcel: true, updatedAt: expect.any(Date) },
        { where: { id: REPORT_ID }, silent: true },
      )
    })
  })
})
