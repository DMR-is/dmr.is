import format from 'date-fns/format'
import subMonths from 'date-fns/subMonths'
import { UniqueConstraintError } from 'sequelize'

import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { DEFAULT_OUTLIER_GROUP_NAME } from '../../../core/constants'
import { ICompanyService } from '../../company/company.service.interface'
import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import { REPORT_IDENTIFIER_INDEX } from '../../report/lib/report-identifier'
import {
  ReportStatusEnum,
  ReportTypeEnum,
  SalaryDataBasisEnum,
} from '../../report/models/report.model'
import { ReportEmployeeModel } from '../../report-employee/models/report-employee.model'
import { ReportEmployeeOutlierModel } from '../../report-employee/models/report-employee-outlier.model'
import { ReportOutlierGroupModel } from '../../report-employee/models/report-outlier-group.model'
import { IReportFinalizeService } from '../../report-finalize/report-finalize.service.interface'
import { IReportIdentifierService } from '../../report-identifier/report-identifier.service.interface'
import { IReportResultService } from '../../report-result/report-result.service.interface'
import { IReportDraftAnalysisService } from '../analysis/report-draft-analysis.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { SubmitDraftDto } from './dto/submit-draft.dto'
import { ReportDraftSubmitService } from './report-draft-submit.service'

const REPORT_ID = 'report-id-1'
const EQUALITY_REPORT_ID = 'eq-1'

// A payroll month inside the API's 36-month reporting window, derived from the
// clock so the fixture cannot age out of the bound.
const PERIOD_MONTH = format(subMonths(new Date(), 1), 'yyyy-MM')
const PERIOD_INPUT = `${PERIOD_MONTH}-17`
const PERIOD_STORED = `${PERIOD_MONTH}-01`
const COMPANY_NATIONAL_ID = '5500000000'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = {
  id: 'company-1',
  nationalId: COMPANY_NATIONAL_ID,
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

/** What the stubbed `IReportIdentifierService.allocate` hands back. */
const IDENTIFIER = 'KTPQZW'

const salaryBody = (
  overrides: Partial<SubmitDraftDto> = {},
): SubmitDraftDto => ({
  company: {
    name: 'Acme',
    nationalId: COMPANY_NATIONAL_ID,
    address: 'Laugavegur 1',
    city: 'Reykjavík',
    postcode: '101',
    isatCategory: '62.01.0',
  },
  equalityReportId: EQUALITY_REPORT_ID,
  ...overrides,
})

describe('ReportDraftSubmitService', () => {
  let service: ReportDraftSubmitService
  let findOwnedDraft: jest.Mock
  let allocate: jest.Mock
  let reportUpdate: jest.Mock
  let persistScores: jest.Mock
  let getDetectedOutlierEmployeeIds: jest.Mock
  let createForReport: jest.Mock
  let assertEqualityReportApproved: jest.Mock
  let withdrawInflightSibling: jest.Mock
  let createCompanyReportSnapshots: jest.Mock
  let emitSubmittedEvent: jest.Mock
  let recordAutoReview: jest.Mock
  let emitWithdrawnEvents: jest.Mock
  let employeeFindAll: jest.Mock
  let outlierFindAll: jest.Mock
  let outlierBulkCreate: jest.Mock
  let outlierDestroy: jest.Mock
  let groupFindAll: jest.Mock
  let groupCreate: jest.Mock

  // A salary draft carries a declared salary-data basis by default — the
  // applicant sets it during drafting via the header PATCH, and submit requires
  // it. Tests that exercise the missing/incomplete cases override it.
  const makeReport = (
    type: ReportTypeEnum,
    salaryData: {
      salaryDataBasis?: SalaryDataBasisEnum | null
      salaryDataPeriod?: string | null
    } = {
      salaryDataBasis: SalaryDataBasisEnum.MONTH,
      salaryDataPeriod: PERIOD_STORED,
    },
  ) => {
    reportUpdate = jest.fn()
    return {
      id: REPORT_ID,
      type,
      salaryDataBasis: salaryData.salaryDataBasis ?? null,
      salaryDataPeriod: salaryData.salaryDataPeriod ?? null,
      update: reportUpdate,
    }
  }

  beforeEach(async () => {
    findOwnedDraft = jest.fn()
    allocate = jest.fn().mockResolvedValue(IDENTIFIER)
    persistScores = jest.fn().mockResolvedValue(undefined)
    getDetectedOutlierEmployeeIds = jest.fn().mockResolvedValue(new Set())
    createForReport = jest.fn().mockResolvedValue({ id: 'result-1' })
    assertEqualityReportApproved = jest.fn().mockResolvedValue(undefined)
    withdrawInflightSibling = jest.fn().mockResolvedValue([])
    createCompanyReportSnapshots = jest.fn().mockResolvedValue(undefined)
    emitSubmittedEvent = jest.fn().mockResolvedValue(undefined)
    recordAutoReview = jest.fn().mockResolvedValue(undefined)
    emitWithdrawnEvents = jest.fn().mockResolvedValue(undefined)
    employeeFindAll = jest.fn().mockResolvedValue([])
    outlierFindAll = jest.fn().mockResolvedValue([])
    outlierBulkCreate = jest.fn().mockResolvedValue([])
    outlierDestroy = jest.fn().mockResolvedValue(1)
    groupFindAll = jest.fn().mockResolvedValue([])
    groupCreate = jest.fn().mockResolvedValue({ id: 'default-group-1' })

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftSubmitService,
        {
          provide: LOGGER_PROVIDER,
          useValue: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
        },
        {
          provide: IReportDraftService,
          useValue: { findOwnedDraft },
        },
        {
          provide: IReportIdentifierService,
          useValue: { allocate },
        },
        {
          provide: IReportDraftAnalysisService,
          useValue: { persistScores, getDetectedOutlierEmployeeIds },
        },
        {
          provide: IReportFinalizeService,
          useValue: {
            assertEqualityReportApproved,
            withdrawInflightSibling,
            createCompanyReportSnapshots,
            emitSubmittedEvent,
            recordAutoReview,
            emitWithdrawnEvents,
          },
        },
        { provide: IReportResultService, useValue: { createForReport } },
        {
          provide: ICompanyService,
          useValue: { getOrCreateSubsidiaryReportSnapshotSource: jest.fn() },
        },
        {
          provide: getModelToken(ReportEmployeeModel),
          useValue: { findAll: employeeFindAll },
        },
        {
          provide: getModelToken(ReportEmployeeOutlierModel),
          useValue: {
            findAll: outlierFindAll,
            bulkCreate: outlierBulkCreate,
            destroy: outlierDestroy,
          },
        },
        {
          provide: getModelToken(ReportOutlierGroupModel),
          useValue: { findAll: groupFindAll, create: groupCreate },
        },
      ],
    }).compile()

    service = module.get(ReportDraftSubmitService)
  })

  it('400s a salary submit without equalityReportId', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))

    await expect(
      service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({ equalityReportId: null }),
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('400s when the payload parent company does not match the authenticated company', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))

    await expect(
      service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({
          company: { ...salaryBody().company, nationalId: '9999999999' },
        }),
      ),
    ).rejects.toThrow(BadRequestException)
  })

  it('400s a salary submit when the salary-data basis was never declared', async () => {
    findOwnedDraft.mockResolvedValueOnce(
      makeReport(ReportTypeEnum.SALARY, {
        salaryDataBasis: null,
        salaryDataPeriod: null,
      }),
    )

    await expect(
      service.submitDraft(PROVIDER_ID, COMPANY, salaryBody()),
    ).rejects.toThrow(BadRequestException)
    expect(createCompanyReportSnapshots).not.toHaveBeenCalled()
  })

  it('400s a salary submit when the basis is MONTH but no month was stated', async () => {
    findOwnedDraft.mockResolvedValueOnce(
      makeReport(ReportTypeEnum.SALARY, {
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: null,
      }),
    )

    await expect(
      service.submitDraft(PROVIDER_ID, COMPANY, salaryBody()),
    ).rejects.toThrow(BadRequestException)
    expect(createCompanyReportSnapshots).not.toHaveBeenCalled()
  })

  it('submits a salary draft on a twelve-month average, which needs no month', async () => {
    findOwnedDraft.mockResolvedValueOnce(
      makeReport(ReportTypeEnum.SALARY, {
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
        salaryDataPeriod: null,
      }),
    )
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set())

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ReportStatusEnum.SUBMITTED,
        salaryDataBasis: SalaryDataBasisEnum.AVERAGE,
        salaryDataPeriod: null,
      }),
    )
  })

  it('normalises a stored mid-month day when it persists the basis at submit', async () => {
    findOwnedDraft.mockResolvedValueOnce(
      makeReport(ReportTypeEnum.SALARY, {
        salaryDataBasis: SalaryDataBasisEnum.MONTH,
        salaryDataPeriod: PERIOD_INPUT,
      }),
    )
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set())

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ salaryDataPeriod: PERIOD_STORED }),
    )
  })

  it('submits an equality draft as SUBMITTED without touching scores/result', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.EQUALITY))

    const result = await service.submitDraft(PROVIDER_ID, COMPANY, {
      company: salaryBody().company,
    })

    expect(result).toEqual({ reportId: REPORT_ID })
    expect(createCompanyReportSnapshots).toHaveBeenCalled()
    expect(persistScores).not.toHaveBeenCalled()
    expect(createForReport).not.toHaveBeenCalled()
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
    expect(emitSubmittedEvent).toHaveBeenCalledWith(
      REPORT_ID,
      ReportStatusEnum.SUBMITTED,
      COMPANY.id,
    )
  })

  it('submits a salary draft with no outliers as SUBMITTED, freezing scores + result', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set())

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(assertEqualityReportApproved).toHaveBeenCalledWith(
      EQUALITY_REPORT_ID,
    )
    expect(persistScores).toHaveBeenCalledWith(REPORT_ID)
    expect(createForReport).toHaveBeenCalledWith(REPORT_ID)
    // The resolved basis is written alongside the status, so submit does not
    // rely on the draft PATCH having normalised the pair earlier.
    expect(reportUpdate).toHaveBeenCalledWith({
      status: ReportStatusEnum.SUBMITTED,
      identifier: IDENTIFIER,
      equalityReportId: EQUALITY_REPORT_ID,
      salaryDataBasis: SalaryDataBasisEnum.MONTH,
      salaryDataPeriod: PERIOD_STORED,
    })
  })

  // Reviewers search reports by identifier and it is printed on the PDF, so a
  // draft-born report that submits without one is effectively unfindable.
  it('mints an identifier server-side and freezes it onto the report', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.EQUALITY))
    allocate.mockResolvedValueOnce('XYZWVU')

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(allocate).toHaveBeenCalledTimes(1)
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'XYZWVU' }),
    )
  })

  it('maps an identifier collision on submit to a retryable 503', async () => {
    // The finding this whole path exists for: uncaught, the shared
    // SequelizeExceptionFilter turns the collision into a 400 and island.is
    // treats a good submission as unretryable, silently dropping it.
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.EQUALITY))
    const collision = new UniqueConstraintError({})
    Object.defineProperty(collision, 'parent', {
      value: Object.assign(new Error('duplicate key'), {
        constraint: REPORT_IDENTIFIER_INDEX,
      }),
    })
    reportUpdate.mockRejectedValueOnce(collision)

    await expect(
      service.submitDraft(PROVIDER_ID, COMPANY, salaryBody()),
    ).rejects.toThrow(ServiceUnavailableException)
  })

  it('leaves an unrelated submit failure untouched', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.EQUALITY))
    reportUpdate.mockRejectedValueOnce(new Error('connection reset'))

    await expect(
      service.submitDraft(PROVIDER_ID, COMPANY, salaryBody()),
    ).rejects.toThrow('connection reset')
  })

  it('400s when a detected outlier is not assigned to a group', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }])
    outlierFindAll.mockResolvedValueOnce([]) // no memberships

    await expect(
      service.submitDraft(PROVIDER_ID, COMPANY, salaryBody()),
    ).rejects.toThrow(BadRequestException)
  })

  // The applicant groups an outlier, then edits the data until that employee
  // leaves the lágmarksmengi. They cannot clear the row themselves — the
  // grouping step no longer shows that employee — so submit drops it instead
  // of dead-ending on a 400.
  it('drops a membership for an employee who is no longer a detected outlier', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
      { reportEmployeeId: 'emp-2', groupId: 'g-1' },
    ])
    groupFindAll.mockResolvedValueOnce([{ id: 'g-1', reason: 'explained' }])

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(outlierDestroy).toHaveBeenCalledWith({
      where: { reportEmployeeId: ['emp-2'] },
    })
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
  })

  it('leaves the memberships alone when every one is still detected', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
    ])
    groupFindAll.mockResolvedValueOnce([{ id: 'g-1', reason: 'explained' }])

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(outlierDestroy).not.toHaveBeenCalled()
  })

  // A draft whose outliers all disappeared: every membership is stale, so the
  // prune empties the grouping entirely and there is nothing left to explain.
  it('submits a draft whose detected set emptied out from under its groups', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set<string>())
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
    ])

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(outlierDestroy).toHaveBeenCalledWith({
      where: { reportEmployeeId: ['emp-1'] },
    })
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
  })

  it('drops stale memberships on the postponed path too', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
      { reportEmployeeId: 'emp-2', groupId: 'g-1' },
    ])
    groupFindAll.mockResolvedValueOnce([{ id: 'g-1', reason: null }])

    await service.submitDraft(
      PROVIDER_ID,
      COMPANY,
      salaryBody({ outliersPostponed: true }),
    )

    expect(outlierDestroy).toHaveBeenCalledWith({
      where: { reportEmployeeId: ['emp-2'] },
    })
    // emp-1 is still assigned, so nothing needs backfilling into a default group.
    expect(outlierBulkCreate).not.toHaveBeenCalled()
    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
    )
  })

  it('lands POSTPONED when all detected outliers are assigned to unexplained groups', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
    ])
    groupFindAll.mockResolvedValueOnce([{ id: 'g-1', reason: null }])

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
    )
  })

  it('lands SUBMITTED when all detected outliers are in explained groups', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
    ])
    groupFindAll.mockResolvedValueOnce([{ id: 'g-1', reason: 'explained' }])

    await service.submitDraft(PROVIDER_ID, COMPANY, salaryBody())

    expect(reportUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
    )
  })

  it('400s a mixed explained/unexplained set when postponement was not requested', async () => {
    findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
    getDetectedOutlierEmployeeIds.mockResolvedValueOnce(
      new Set(['emp-1', 'emp-2']),
    )
    employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
    outlierFindAll.mockResolvedValueOnce([
      { reportEmployeeId: 'emp-1', groupId: 'g-1' },
      { reportEmployeeId: 'emp-2', groupId: 'g-2' },
    ])
    groupFindAll.mockResolvedValueOnce([
      { id: 'g-1', reason: 'explained' },
      { id: 'g-2', reason: null },
    ])

    await expect(
      service.submitDraft(PROVIDER_ID, COMPANY, salaryBody()),
    ).rejects.toThrow(BadRequestException)
  })

  describe('outliersPostponed', () => {
    // The reported bug: the portal offers a "postpone outliers" tick, the
    // applicant uses it and never groups anybody, and submit died on the
    // "must be assigned to an outlier group" guard. The API had nowhere to put
    // the flag, so `whitelist: true` on the global ValidationPipe stripped it
    // silently.
    it('submits with nothing grouped, backfilling a default group (the reported failure)', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(
        new Set(['emp-1', 'emp-2']),
      )
      employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
      outlierFindAll
        .mockResolvedValueOnce([]) // nothing grouped yet
        .mockResolvedValueOnce([
          { reportEmployeeId: 'emp-1', groupId: 'default-group-1' },
          { reportEmployeeId: 'emp-2', groupId: 'default-group-1' },
        ])
      groupFindAll.mockResolvedValueOnce([
        { id: 'default-group-1', reason: null },
      ])

      await service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({ outliersPostponed: true }),
      )

      // One default group, explanation columns all NULL (the DB CHECK is
      // all-or-none), covering exactly the detected outliers.
      expect(groupCreate).toHaveBeenCalledWith({
        reportId: REPORT_ID,
        name: DEFAULT_OUTLIER_GROUP_NAME,
        reason: null,
        action: null,
        signatureName: null,
        signatureRole: null,
      })
      expect(outlierBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeId: 'emp-1', groupId: 'default-group-1' },
        { reportEmployeeId: 'emp-2', groupId: 'default-group-1' },
      ])
      expect(reportUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
      )
    })

    it('backfills only the outliers that are not already grouped', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(
        new Set(['emp-1', 'emp-2']),
      )
      employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
      outlierFindAll
        .mockResolvedValueOnce([
          { reportEmployeeId: 'emp-1', groupId: 'g-1' },
        ])
        .mockResolvedValueOnce([
          { reportEmployeeId: 'emp-1', groupId: 'g-1' },
          { reportEmployeeId: 'emp-2', groupId: 'default-group-1' },
        ])
      groupFindAll.mockResolvedValueOnce([
        { id: 'g-1', reason: 'explained' },
        { id: 'default-group-1', reason: null },
      ])

      await service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({ outliersPostponed: true }),
      )

      // emp-1's existing group is left alone.
      expect(outlierBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeId: 'emp-2', groupId: 'default-group-1' },
      ])
      expect(reportUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
      )
    })

    // POSTPONED cannot be assigned (assign takes SUBMITTED/IN_REVIEW only) and
    // so cannot be approved. If there is nothing left to defer, honouring the
    // flag literally would strand the report where a reviewer could only deny
    // it.
    it('lands SUBMITTED when every detected outlier is already explained', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
      employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }])
      outlierFindAll.mockResolvedValueOnce([
        { reportEmployeeId: 'emp-1', groupId: 'g-1' },
      ])
      groupFindAll.mockResolvedValueOnce([{ id: 'g-1', reason: 'explained' }])

      await service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({ outliersPostponed: true }),
      )

      expect(groupCreate).not.toHaveBeenCalled()
      expect(outlierBulkCreate).not.toHaveBeenCalled()
      expect(reportUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.SUBMITTED }),
      )
    })

    // Same fixture as the "400s a mixed set" case above — the explicit flag is
    // what turns the ambiguity into a decision.
    it('lands POSTPONED on a mixed explained/unexplained set', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(
        new Set(['emp-1', 'emp-2']),
      )
      employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
      outlierFindAll.mockResolvedValueOnce([
        { reportEmployeeId: 'emp-1', groupId: 'g-1' },
        { reportEmployeeId: 'emp-2', groupId: 'g-2' },
      ])
      groupFindAll.mockResolvedValueOnce([
        { id: 'g-1', reason: 'explained' },
        { id: 'g-2', reason: null },
      ])

      await service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({ outliersPostponed: true }),
      )

      expect(groupCreate).not.toHaveBeenCalled()
      expect(reportUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReportStatusEnum.POSTPONED }),
      )
    })

    it('400s when there is nothing to postpone', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set())

      await expect(
        service.submitDraft(
          PROVIDER_ID,
          COMPANY,
          salaryBody({ outliersPostponed: true }),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(groupCreate).not.toHaveBeenCalled()
    })

    // A row for an employee who is no longer an outlier would never be
    // re-pointed by the outliers edit endpoint and would block its group
    // cleanup on the NOT NULL group_id FK — so it is dropped, not rejected.
    it('drops a stale assignment and backfills the real outlier', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.SALARY))
      getDetectedOutlierEmployeeIds.mockResolvedValueOnce(new Set(['emp-1']))
      employeeFindAll.mockResolvedValueOnce([{ id: 'emp-1' }, { id: 'emp-2' }])
      outlierFindAll.mockResolvedValueOnce([
        { reportEmployeeId: 'emp-2', groupId: 'g-1' },
      ])

      await service.submitDraft(
        PROVIDER_ID,
        COMPANY,
        salaryBody({ outliersPostponed: true }),
      )

      expect(outlierDestroy).toHaveBeenCalledWith({
        where: { reportEmployeeId: ['emp-2'] },
      })
      // emp-1 was left unassigned once the stale row went, so it is backfilled
      // into the default group rather than submitted ungrouped.
      expect(groupCreate).toHaveBeenCalled()
      expect(outlierBulkCreate).toHaveBeenCalledWith([
        { reportEmployeeId: 'emp-1', groupId: 'default-group-1' },
      ])
    })

    it('400s on an equality draft, which has no outliers to defer', async () => {
      findOwnedDraft.mockResolvedValueOnce(makeReport(ReportTypeEnum.EQUALITY))

      await expect(
        service.submitDraft(PROVIDER_ID, COMPANY, {
          company: salaryBody().company,
          outliersPostponed: true,
        }),
      ).rejects.toThrow(BadRequestException)
      expect(createCompanyReportSnapshots).not.toHaveBeenCalled()
    })
  })
})
