import { ConflictException, NotFoundException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanySizeEnum } from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import {
  EqualityCoverageSourceEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'
import { IReportService } from '../report/report.service.interface'
import { IReportAutoReviewService } from '../report-auto-review/report-auto-review.service.interface'
import { CreateReportCompanySnapshotDto } from '../report-create/dto/create-report.dto'
import { ReportFinalizeService } from './report-finalize.service'

const REPORT_ID = 'report-id-1'
const COMPANY_ID = '00000000-0000-0000-0000-000000000c01'
const PRIOR_REPORT_ID = '00000000-0000-0000-0000-0000000000aa'
const REPLACING_REPORT_ID = '00000000-0000-0000-0000-0000000000bb'

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('ReportFinalizeService', () => {
  let service: ReportFinalizeService
  let reportFindAll: jest.Mock
  let reportFindOne: jest.Mock
  let reportUpdate: jest.Mock
  let reportEventCreate: jest.Mock
  let companyFindAll: jest.Mock
  let companyFindOne: jest.Mock
  let companyReportBulkCreate: jest.Mock
  let companyReportFindAll: jest.Mock
  let autoReviewEvaluate: jest.Mock
  let resolveEqualityCoverage: jest.Mock

  beforeEach(async () => {
    reportFindAll = jest.fn().mockResolvedValue([])
    reportFindOne = jest.fn().mockResolvedValue(null)
    reportUpdate = jest.fn().mockResolvedValue([0])
    reportEventCreate = jest.fn().mockResolvedValue({ id: 'event-1' })
    companyFindAll = jest
      .fn()
      .mockResolvedValue([makeCompanyRow(COMPANY_ID, CompanySizeEnum.LARGE)])
    companyFindOne = jest.fn().mockResolvedValue({ id: COMPANY_ID })
    companyReportBulkCreate = jest.fn(async (rows) =>
      rows.map((r: object, i: number) => ({ ...r, id: `cr-${i}` })),
    )
    companyReportFindAll = jest.fn().mockResolvedValue([])
    autoReviewEvaluate = jest.fn().mockResolvedValue({
      decision: AutoReviewDecisionEnum.AUTO_APPROVE,
      reason: 'Engin frávik greind.',
      signals: {},
    })

    resolveEqualityCoverage = jest.fn().mockResolvedValue(null)

    const module = await Test.createTestingModule({
      providers: [
        ReportFinalizeService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: {
            findAll: reportFindAll,
            findOne: reportFindOne,
            update: reportUpdate,
          },
        },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findAll: companyFindAll, findOne: companyFindOne },
        },
        {
          provide: getModelToken(CompanyReportModel),
          useValue: {
            bulkCreate: companyReportBulkCreate,
            findAll: companyReportFindAll,
          },
        },
        {
          provide: getModelToken(ReportEventModel),
          useValue: { create: reportEventCreate },
        },
        {
          provide: IReportAutoReviewService,
          useValue: { evaluate: autoReviewEvaluate },
        },
        {
          provide: IReportService,
          useValue: { resolveEqualityCoverage },
        },
      ],
    }).compile()

    service = module.get(ReportFinalizeService)
  })

  describe('assertEqualityReportApproved', () => {
    const EQUALITY_REPORT_ID = '00000000-0000-0000-0000-00000000eee1'

    it('resolves when an approved, in-force equality report covers the company', async () => {
      reportFindOne.mockResolvedValueOnce({ id: EQUALITY_REPORT_ID })

      await expect(
        service.assertEqualityReportApproved(EQUALITY_REPORT_ID, COMPANY_ID),
      ).resolves.toBeUndefined()

      expect(reportFindOne).toHaveBeenCalledTimes(1)
      const [query] = reportFindOne.mock.calls[0]
      expect(query.where).toEqual(
        expect.objectContaining({
          id: EQUALITY_REPORT_ID,
          type: ReportTypeEnum.EQUALITY,
          status: ReportStatusEnum.APPROVED,
        }),
      )
    })

    // F8: the id is applicant-supplied. Without this join a company with no
    // equality plan could file a salary report against any other company's
    // approved plan. The join is an inner join on the submitter's company — a
    // `required: false` or a missing `where` would both let the row through.
    it('requires an inner join on company_report for the submitting company', async () => {
      reportFindOne.mockResolvedValueOnce({ id: EQUALITY_REPORT_ID })

      await service.assertEqualityReportApproved(EQUALITY_REPORT_ID, COMPANY_ID)

      const [query] = reportFindOne.mock.calls[0]
      expect(query.include).toEqual([
        expect.objectContaining({
          model: CompanyReportModel,
          as: 'companyReport',
          where: { companyId: COMPANY_ID },
          required: true,
        }),
      ])
    })

    // The join must select what `findActiveEqualityForCompany` selects for the
    // eligibility and active-report routes: `companyId` alone. A subsidiary is
    // handed its group's equality report id by those routes and must be able
    // to name it back here. `parentCompanyId: null` would refuse exactly that
    // company — the regression `resolveEqualityCoverage` already documents.
    it('joins on companyId alone, so a subsidiary can cite its group report', async () => {
      reportFindOne.mockResolvedValueOnce({ id: EQUALITY_REPORT_ID })

      await service.assertEqualityReportApproved(
        EQUALITY_REPORT_ID,
        'subsidiary-company',
      )

      const [query] = reportFindOne.mock.calls[0]
      expect(query.include[0].where).toEqual({
        companyId: 'subsidiary-company',
      })
      expect(query.include[0].where).not.toHaveProperty('parentCompanyId')
    })

    // 404, not 403, and the same sentence as for an id that does not exist:
    // the caller cannot tell "not yours" from "not there".
    it('404s when the report does not cover the caller, indistinguishably from a missing id', async () => {
      reportFindOne.mockResolvedValueOnce(null)

      await expect(
        service.assertEqualityReportApproved(EQUALITY_REPORT_ID, COMPANY_ID),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.assertEqualityReportApproved(EQUALITY_REPORT_ID, COMPANY_ID),
      ).rejects.toThrow(
        `No approved EQUALITY report found at id "${EQUALITY_REPORT_ID}"`,
      )
    })
  })

  describe('withdrawInflightSibling', () => {
    it('returns [] when there are no parent snapshots', async () => {
      const result = await service.withdrawInflightSibling(
        COMPANY_ID,
        ReportTypeEnum.SALARY,
      )

      expect(result).toEqual([])
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('searches only reports the company filed as the parent', async () => {
      await service.withdrawInflightSibling(COMPANY_ID, ReportTypeEnum.SALARY)

      // A subsidiary's snapshot on its parent's group report must not resolve
      // to the parent's report — that pin is what stops a subsidiary from
      // withdrawing a parent's SUBMITTED filing.
      expect(companyReportFindAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { companyId: COMPANY_ID, parentCompanyId: null },
        }),
      )
    })

    it('throws 409 when an IN_REVIEW sibling exists', async () => {
      companyReportFindAll.mockResolvedValueOnce([{ reportId: PRIOR_REPORT_ID }])
      reportFindAll.mockResolvedValueOnce([
        {
          id: PRIOR_REPORT_ID,
          status: ReportStatusEnum.IN_REVIEW,
          providerId: 'p',
        },
      ])

      await expect(
        service.withdrawInflightSibling(COMPANY_ID, ReportTypeEnum.SALARY),
      ).rejects.toThrow(ConflictException)
      expect(reportUpdate).not.toHaveBeenCalled()
    })

    it('withdraws a SUBMITTED sibling and returns its id', async () => {
      companyReportFindAll.mockResolvedValueOnce([{ reportId: PRIOR_REPORT_ID }])
      reportFindAll.mockResolvedValueOnce([
        {
          id: PRIOR_REPORT_ID,
          status: ReportStatusEnum.SUBMITTED,
          providerId: 'p',
        },
      ])

      const result = await service.withdrawInflightSibling(
        COMPANY_ID,
        ReportTypeEnum.SALARY,
      )

      expect(result).toEqual([PRIOR_REPORT_ID])
      expect(reportUpdate).toHaveBeenCalledWith(
        { status: ReportStatusEnum.WITHDRAWN },
        { where: { id: [PRIOR_REPORT_ID] } },
      )
    })
  })

  describe('createCompanyReportSnapshots', () => {
    it('bulkCreates a snapshot row per company', async () => {
      const companies: CreateReportCompanySnapshotDto[] = [
        makeCompanySnapshot(COMPANY_ID, null),
      ]

      await service.createCompanyReportSnapshots(REPORT_ID, companies)

      expect(companyReportBulkCreate).toHaveBeenCalledTimes(1)
      expect(companyReportBulkCreate.mock.calls[0][0]).toHaveLength(1)
      expect(companyReportBulkCreate.mock.calls[0][0][0]).toMatchObject({
        reportId: REPORT_ID,
        companyId: COMPANY_ID,
        parentCompanyId: null,
        employeeCountCategory: CompanySizeEnum.LARGE,
      })
    })
  })

  describe('emitSubmittedEvent', () => {
    it('creates a SUBMITTED event', async () => {
      await service.emitSubmittedEvent(
        REPORT_ID,
        ReportStatusEnum.SUBMITTED,
        COMPANY_ID,
      )

      expect(reportEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          eventType: 'SUBMITTED',
          reportStatus: ReportStatusEnum.SUBMITTED,
          actorUserId: null,
          companyId: COMPANY_ID,
        }),
      )
    })
  })

  describe('recordAutoReview', () => {
    it('creates a SYSTEM_AUTO_REVIEW event from the verdict', async () => {
      await service.recordAutoReview(
        REPORT_ID,
        ReportStatusEnum.SUBMITTED,
        COMPANY_ID,
      )

      expect(autoReviewEvaluate).toHaveBeenCalledWith(REPORT_ID)
      expect(reportEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: REPORT_ID,
          eventType: 'SYSTEM_AUTO_REVIEW',
          actorUserId: null,
          systemDecision: AutoReviewDecisionEnum.AUTO_APPROVE,
          reason: 'Engin frávik greind.',
          companyId: COMPANY_ID,
        }),
      )
    })
  })

  describe('emitWithdrawnEvents', () => {
    it('emits one WITHDRAWN event per retired report linked to the replacement', async () => {
      await service.emitWithdrawnEvents(
        [PRIOR_REPORT_ID],
        REPLACING_REPORT_ID,
      )

      expect(reportEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: PRIOR_REPORT_ID,
          eventType: 'WITHDRAWN',
          reportStatus: ReportStatusEnum.WITHDRAWN,
          actorUserId: null,
          relatedReportId: REPLACING_REPORT_ID,
        }),
      )
    })
  })

  /**
   * The submission's own resolution of what it will be filed against. Had no
   * direct test: its only coverage was mock-call ordering in the report-create
   * spec, which mis-asserts rather than fails if a query is inserted.
   */
  describe('resolveEqualityCoverage', () => {
    it('returns the coverage the shared lookup resolves', async () => {
      const coverage = {
        source: EqualityCoverageSourceEnum.REPORT,
        report: { id: 'equality-1' },
        legacyValidUntil: null,
      }
      resolveEqualityCoverage.mockResolvedValue(coverage)

      await expect(
        service.resolveEqualityCoverage('company-1'),
      ).resolves.toEqual(coverage)

      expect(resolveEqualityCoverage).toHaveBeenCalledWith('company-1')
    })

    // The regression this replaced: the resolution used to filter
    // `parentCompanyId: null`, selecting only equality reports the company
    // filed as the parent, while the eligibility and active routes join on
    // `companyId` alone and so also match a subsidiary. A company covered by a
    // group report read `eligible: true`, submitted, and was refused — with no
    // field left to override it, since the partner contract dropped
    // `equalityReportId`. Delegating is what keeps the pre-check and the
    // submission from disagreeing, so the delegation itself is the assertion.
    it('asks the same lookup the eligibility routes answer from, so a subsidiary resolves too', async () => {
      resolveEqualityCoverage.mockResolvedValue({
        source: EqualityCoverageSourceEnum.REPORT,
        report: { id: 'group-equality' },
        legacyValidUntil: null,
      })

      const coverage = await service.resolveEqualityCoverage(
        'subsidiary-company',
      )

      expect(coverage.report?.id).toBe('group-equality')
      // No second query of its own: a divergent one is how the two answers
      // drifted apart in the first place.
      expect(companyReportFindAll).not.toHaveBeenCalled()
    })

    // Same delegation, second class of company: the ~540 whose equality plan
    // exists only on the retired register. They have no report row to name, and
    // requiring one is what left them unable to file at all.
    it('passes legacy coverage through, dates and all', async () => {
      resolveEqualityCoverage.mockResolvedValue({
        source: EqualityCoverageSourceEnum.LEGACY,
        report: null,
        legacyValidUntil: '2028-03-31',
      })

      await expect(
        service.resolveEqualityCoverage('legacy-company'),
      ).resolves.toEqual({
        source: EqualityCoverageSourceEnum.LEGACY,
        report: null,
        legacyValidUntil: '2028-03-31',
      })
    })

    it('404s with the sentence the active-report route answers with', async () => {
      resolveEqualityCoverage.mockResolvedValue(null)

      await expect(
        service.resolveEqualityCoverage('company-1'),
      ).rejects.toThrow(NotFoundException)
      await expect(
        service.resolveEqualityCoverage('company-1'),
      ).rejects.toThrow('No approved equality report is in force')
    })
  })

})

function makeCompanySnapshot(
  companyId: string,
  parentCompanyId: string | null,
): CreateReportCompanySnapshotDto {
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
