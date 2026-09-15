import { NotFoundException } from '@nestjs/common'

import { IApplicationService } from '@dmr.is/doe-modules/application'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import { IScoringModelService } from '@dmr.is/doe-modules/scoring-model'

import { PartnerSubmissionService } from './partner-submission.service'

const COMPANY = { id: 'company-1' } as CompanyDto
const PARSED = { criteria: [], roles: [], employees: [] }

const EMPLOYEES = [{ ordinal: 1 }] as never

/**
 * The translation, and nothing else. What matters is that the expansion happens
 * against the caller's own company, that the rest of the submission reaches the
 * shared service untouched, and that the preview expands the same way the
 * submission does — a preview built from a differently-assembled tree would be
 * answering a question the submission never asks.
 */
describe('PartnerSubmissionService', () => {
  let service: PartnerSubmissionService
  let expandToParsedPayload: jest.Mock
  let submitSalary: jest.Mock
  let salaryAnalysis: jest.Mock

  beforeEach(() => {
    expandToParsedPayload = jest.fn().mockResolvedValue(PARSED)
    submitSalary = jest.fn().mockResolvedValue({
      reportId: 'r1',
      replayed: false,
    })
    salaryAnalysis = jest.fn().mockResolvedValue({ outliers: [] })

    service = new PartnerSubmissionService(
      { submitSalary, salaryAnalysis } as unknown as IApplicationService,
      { expandToParsedPayload } as unknown as IScoringModelService,
    )
  })

  describe('submitSalary', () => {
    const input = {
      providerId: 'p-1',
      scoringModelId: 'model-1',
      employees: EMPLOYEES,
      companyAdminName: 'Admin',
    } as never

    it('expands against the calling company’s own model', async () => {
      await service.submitSalary(input, COMPANY)

      expect(expandToParsedPayload).toHaveBeenCalledWith(
        COMPANY,
        'model-1',
        EMPLOYEES,
      )
    })

    // The two fields this surface adds are the two the shared contract must
    // never see: it takes `parsed`, and knows nothing about scoring models.
    it('hands the shared service `parsed`, without the fields that built it', async () => {
      await service.submitSalary(input, COMPANY)

      const [sent] = submitSalary.mock.calls[0]
      expect(sent.parsed).toBe(PARSED)
      expect(sent).not.toHaveProperty('scoringModelId')
      expect(sent).not.toHaveProperty('employees')
    })

    it('passes every other submission field through untouched', async () => {
      await service.submitSalary(input, COMPANY)

      expect(submitSalary.mock.calls[0][0]).toMatchObject({
        providerId: 'p-1',
        companyAdminName: 'Admin',
      })
      expect(submitSalary.mock.calls[0][1]).toBe(COMPANY)
    })

    it('returns the shared service’s answer unchanged', async () => {
      await expect(service.submitSalary(input, COMPANY)).resolves.toEqual({
        reportId: 'r1',
        replayed: false,
      })
    })

    it('does not file when the expansion refuses', async () => {
      expandToParsedPayload.mockRejectedValue(new Error('bad payload'))

      await expect(service.submitSalary(input, COMPANY)).rejects.toThrow()
      expect(submitSalary).not.toHaveBeenCalled()
    })
  })

  // Tenant isolation on the two routes a vendor actually calls. The gate lives
  // in `expandToParsedPayload`, and nothing here proved a foreign model id
  // reaches it before anything is filed or analysed.
  describe('a scoring model the caller does not own', () => {
    const notFound = new NotFoundException('Starfsmat fannst ekki')

    it('404s the submission, and files nothing', async () => {
      expandToParsedPayload.mockRejectedValue(notFound)

      await expect(
        service.submitSalary(
          {
            providerId: 'p-1',
            scoringModelId: 'someone-elses-model',
            employees: EMPLOYEES,
          } as never,
          COMPANY,
        ),
      ).rejects.toThrow(NotFoundException)

      expect(submitSalary).not.toHaveBeenCalled()
    })

    it('404s the preview, and analyses nothing', async () => {
      expandToParsedPayload.mockRejectedValue(notFound)

      await expect(
        service.salaryAnalysis(
          { scoringModelId: 'someone-elses-model', employees: EMPLOYEES } as never,
          COMPANY,
        ),
      ).rejects.toThrow(NotFoundException)

      expect(salaryAnalysis).not.toHaveBeenCalled()
    })
  })

  describe('salaryAnalysis', () => {
    const input = {
      scoringModelId: 'model-1',
      employees: EMPLOYEES,
    } as never

    it('expands through the identical path the submission uses', async () => {
      await service.salaryAnalysis(input, COMPANY)

      expect(expandToParsedPayload).toHaveBeenCalledWith(
        COMPANY,
        'model-1',
        EMPLOYEES,
      )
      expect(salaryAnalysis).toHaveBeenCalledWith({ parsed: PARSED }, COMPANY)
    })

    it('does not analyse when the expansion refuses', async () => {
      expandToParsedPayload.mockRejectedValue(new Error('bad payload'))

      await expect(service.salaryAnalysis(input, COMPANY)).rejects.toThrow()
      expect(salaryAnalysis).not.toHaveBeenCalled()
    })
  })
})
