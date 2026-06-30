import { UniqueConstraintError } from 'sequelize'

import { ConflictException } from '@nestjs/common'
import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  ReportProviderEnum,
  ReportStatusEnum,
  ReportTypeEnum,
} from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { ReportDraftService } from './report-draft.service'

const REPORT_ID = 'report-id-1'
const EXISTING_DRAFT_ID = '00000000-0000-0000-0000-0000000000df'
const COMPANY_NATIONAL_ID = '5500000000'

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

  const draftInput = (overrides = {}) => ({
    type: ReportTypeEnum.SALARY,
    providerType: ReportProviderEnum.ISLAND_IS,
    providerId: 'island-is-application-uuid-draft',
    companyNationalId: COMPANY_NATIONAL_ID,
    ...overrides,
  })

  beforeEach(async () => {
    reportCreate = jest.fn().mockResolvedValue({ id: REPORT_ID })
    reportFindOne = jest.fn().mockResolvedValue(null)

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        {
          provide: getModelToken(ReportModel),
          useValue: { create: reportCreate, findOne: reportFindOne },
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
})
