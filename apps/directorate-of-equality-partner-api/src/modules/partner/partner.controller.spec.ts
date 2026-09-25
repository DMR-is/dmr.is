import { Response } from 'express'

import { HttpStatus } from '@nestjs/common'

import { IApplicationService } from '@dmr.is/doe-modules/application'
import { CompanyDto } from '@dmr.is/doe-modules/company'

import { PartnerSubmissionService } from '../submission/partner-submission.service'
import { PartnerController } from './partner.controller'

import 'multer'

const COMPANY = { id: 'company-1', nationalId: '5555555555' } as CompanyDto

/**
 * The upload never reaches a converter here — `submitEquality` is a double.
 * The subject is still `answerCreated`, and the document is only present
 * because the handler now takes one.
 */
const DOCUMENT = { buffer: Buffer.from('docx') } as Express.Multer.File

const responseDouble = () => {
  const status = jest.fn()
  return { res: { status } as unknown as Response, status }
}

/**
 * The 200/201 split is the behaviour this surface advertises, and until now
 * nothing pinned it: invert the condition or drop the `res.status()` call and
 * every other test stayed green. It is worth a real test precisely because the
 * mechanism leans on a Nest internal — `@Res({ passthrough: true })`, where the
 * handler still returns the body but the status has already been set on the
 * response object.
 */
describe('PartnerController — the replay status split', () => {
  let controller: PartnerController
  let submitSalary: jest.Mock
  let submitEquality: jest.Mock

  // Constructed directly rather than through a testing module: the controller's
  // `@UseGuards` classes would be instantiated with it, pulling in the whole
  // authentication graph for a test that never routes a request. The subject
  // here is `answerCreated`, which the handler reaches without any of that.
  beforeEach(() => {
    submitSalary = jest.fn()
    submitEquality = jest.fn()

    controller = new PartnerController(
      {} as unknown as IApplicationService,
      { submitSalary, submitEquality } as unknown as PartnerSubmissionService,
    )
  })

  describe('salary', () => {
    it('answers 201 when a report was filed', async () => {
      submitSalary.mockResolvedValue({ reportId: 'r1', replayed: false })
      const { res, status } = responseDouble()

      const body = await controller.submitSalaryReport(
        {} as never,
        COMPANY,
        null,
        res,
      )

      expect(status).toHaveBeenCalledWith(HttpStatus.CREATED)
      expect(body).toEqual({ reportId: 'r1', replayed: false })
    })

    // The whole point of the split: a naive `assert status === 201` has to
    // catch a replay, because the body alone did not distinguish one and a
    // follow-up read by provider id returns the earlier report either way.
    it('answers 200 when nothing was filed', async () => {
      submitSalary.mockResolvedValue({ reportId: 'r1', replayed: true })
      const { res, status } = responseDouble()

      const body = await controller.submitSalaryReport(
        {} as never,
        COMPANY,
        null,
        res,
      )

      expect(status).toHaveBeenCalledWith(HttpStatus.OK)
      expect(body).toEqual({ reportId: 'r1', replayed: true })
    })

    it('returns the service result untouched', async () => {
      const result = { reportId: 'r1', replayed: true }
      submitSalary.mockResolvedValue(result)
      const { res } = responseDouble()

      await expect(
        controller.submitSalaryReport({} as never, COMPANY, null, res),
      ).resolves.toBe(result)
    })
  })

  /**
   * Provenance: the firm `PartnerCompanyGuard` resolved reaches the submission,
   * which records it as `report.partner_client_id`. A company key passes null.
   */
  describe('provenance', () => {
    it('hands the acting vendor client to both submissions', async () => {
      submitSalary.mockResolvedValue({ reportId: 'r1', replayed: false })
      submitEquality.mockResolvedValue({ reportId: 'e1', replayed: false })

      await controller.submitSalaryReport(
        {} as never,
        COMPANY,
        'client-1',
        responseDouble().res,
      )
      await controller.submitEqualityReport(
        {} as never,
        DOCUMENT,
        COMPANY,
        'client-1',
        responseDouble().res,
      )

      expect(submitSalary).toHaveBeenCalledWith({}, COMPANY, 'client-1')
      expect(submitEquality).toHaveBeenCalledWith(
        {},
        DOCUMENT,
        COMPANY,
        'client-1',
      )
    })
  })

  describe('equality', () => {
    it('answers 201 when a report was filed', async () => {
      submitEquality.mockResolvedValue({ reportId: 'e1', replayed: false })
      const { res, status } = responseDouble()

      await controller.submitEqualityReport(
        {} as never,
        DOCUMENT,
        COMPANY,
        null,
        res,
      )

      expect(status).toHaveBeenCalledWith(HttpStatus.CREATED)
    })

    it('answers 200 when nothing was filed', async () => {
      submitEquality.mockResolvedValue({ reportId: 'e1', replayed: true })
      const { res, status } = responseDouble()

      await controller.submitEqualityReport(
        {} as never,
        DOCUMENT,
        COMPANY,
        null,
        res,
      )

      expect(status).toHaveBeenCalledWith(HttpStatus.OK)
    })
  })
})
