import { ConflictException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanySizeEnum } from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { ReportEventModel } from '../report/models/report-event.model'
import { AutoReviewDecisionEnum } from '../report/models/report-event.model'
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
  let reportUpdate: jest.Mock
  let reportEventCreate: jest.Mock
  let companyFindAll: jest.Mock
  let companyFindOne: jest.Mock
  let companyReportBulkCreate: jest.Mock
  let companyReportFindAll: jest.Mock
  let autoReviewEvaluate: jest.Mock

  beforeEach(async () => {
    reportFindAll = jest.fn().mockResolvedValue([])
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

    const module = await Test.createTestingModule({
      providers: [
        ReportFinalizeService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: { findAll: reportFindAll, update: reportUpdate },
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
      ],
    }).compile()

    service = module.get(ReportFinalizeService)
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
