import { BadRequestException, NotFoundException } from '@nestjs/common'

import { IApplicationService } from '@dmr.is/doe-modules/application'
import { CompanyDto } from '@dmr.is/doe-modules/company'
import { SalaryDataBasisEnum } from '@dmr.is/doe-modules/report'
import { IScoringModelService } from '@dmr.is/doe-modules/scoring-model'
import { Logger } from '@dmr.is/logging'

import { convertEqualityDocumentToHtml } from './equality-document'
import { PartnerSubmissionService } from './partner-submission.service'

jest.mock('./equality-document', () => ({
  convertEqualityDocumentToHtml: jest.fn(),
}))

const convert = convertEqualityDocumentToHtml as jest.MockedFunction<
  typeof convertEqualityDocumentToHtml
>

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
  let submitEquality: jest.Mock
  let warn: jest.Mock

  beforeEach(() => {
    expandToParsedPayload = jest.fn().mockResolvedValue(PARSED)
    submitSalary = jest.fn().mockResolvedValue({
      reportId: 'r1',
      replayed: false,
    })
    salaryAnalysis = jest.fn().mockResolvedValue({ outliers: [] })
    submitEquality = jest.fn().mockResolvedValue({
      reportId: 'e1',
      replayed: false,
    })
    warn = jest.fn()
    convert.mockReset()
    convert.mockResolvedValue({
      html: '<h1>Jafnréttisáætlun</h1>',
      warnings: [],
    })

    service = new PartnerSubmissionService(
      {
        submitSalary,
        salaryAnalysis,
        submitEquality,
      } as unknown as IApplicationService,
      { expandToParsedPayload } as unknown as IScoringModelService,
      { warn: warn } as unknown as Logger,
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

    /**
     * These two are the channel's shape, not the vendor's request, which is why
     * they are options rather than fields the DTO publishes. A payroll system
     * files once and never previews, so unexplained outliers postpone instead of
     * being refused; and since POSTPONED is therefore what a submission becomes
     * here rather than something anyone chose, a corrected re-file replaces it
     * instead of colliding with it. island.is passes neither.
     */
    it('declares the channel’s outlier policy on every submission', async () => {
      await service.submitSalary(input, COMPANY)

      expect(submitSalary.mock.calls[0][2]).toEqual({
        postponeUnexplainedOutliers: true,
        withdrawPostponedSibling: true,
        partnerClientId: null,
      })
    })

    it('records the vendor client acting for the company as provenance', async () => {
      await service.submitSalary(input, COMPANY, 'client-1')

      expect(submitSalary.mock.calls[0][2]).toMatchObject({
        partnerClientId: 'client-1',
      })
    })

    it('returns the shared service’s answer unchanged', async () => {
      await expect(service.submitSalary(input, COMPANY)).resolves.toEqual({
        reportId: 'r1',
        replayed: false,
      })
    })

    /**
     * `AVERAGE` covers twelve months, so there is no single month to name. The
     * shared `resolveSalaryDataBasis` clears a month sent alongside it rather
     * than refusing — correct where it lives, because the draft PATCH shares it
     * and a portal user switching a draft from MONTH to AVERAGE legitimately
     * sends the stale month and expects it dropped. A partner submission is not
     * an edit, so here it can only be a program misreading the field.
     *
     * Refused *before* the expansion, so a rejected submission does not first
     * pay for a payroll extract to be expanded.
     */
    describe('salaryDataPeriod against salaryDataBasis', () => {
      const withBasis = (
        salaryDataBasis: SalaryDataBasisEnum,
        salaryDataPeriod?: string | null,
      ) =>
        ({ ...(input as object), salaryDataBasis, salaryDataPeriod }) as never

      it('refuses a month sent with AVERAGE, before expanding anything', async () => {
        await expect(
          service.submitSalary(
            withBasis(SalaryDataBasisEnum.AVERAGE, '2026-08-01'),
            COMPANY,
          ),
        ).rejects.toThrow(BadRequestException)

        expect(expandToParsedPayload).not.toHaveBeenCalled()
        expect(submitSalary).not.toHaveBeenCalled()
      })

      it.each([
        ['omitted', undefined],
        ['null', null],
        ['blank', '   '],
      ])('accepts AVERAGE with the month %s', async (_case, period) => {
        await service.submitSalary(
          withBasis(SalaryDataBasisEnum.AVERAGE, period),
          COMPANY,
        )

        expect(submitSalary).toHaveBeenCalled()
      })

      it('leaves MONTH with a month alone', async () => {
        await service.submitSalary(
          withBasis(SalaryDataBasisEnum.MONTH, '2026-08-01'),
          COMPANY,
        )

        expect(submitSalary).toHaveBeenCalled()
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
          {
            scoringModelId: 'someone-elses-model',
            employees: EMPLOYEES,
          } as never,
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

  /**
   * The converter has its own suite; what is pinned here is the seam. The
   * document is transport: once it is HTML, this channel has nothing left to
   * add, and `ApplicationService` must receive exactly what the portal sends it.
   */
  describe('submitEquality', () => {
    const input = {
      providerId: 'p-1',
      company: { name: 'Fyrirtæki ehf.' },
    } as never

    const document = { buffer: Buffer.from('PK docx') } as Express.Multer.File

    it('files the converted HTML as the report content', async () => {
      await service.submitEquality(input, document, COMPANY)

      expect(convert).toHaveBeenCalledWith(document.buffer)
      expect(submitEquality).toHaveBeenCalledWith(
        {
          providerId: 'p-1',
          company: { name: 'Fyrirtæki ehf.' },
          equalityReportContent: '<h1>Jafnréttisáætlun</h1>',
        },
        COMPANY,
        { partnerClientId: null },
      )
    })

    it('returns the shared service’s result untouched', async () => {
      await expect(
        service.submitEquality(input, document, COMPANY),
      ).resolves.toEqual({ reportId: 'e1', replayed: false })
    })

    /**
     * A conversion warning is about markup this channel could not represent —
     * nothing a payroll system can act on, and surfacing it on a `201` invites a
     * vendor to treat a filed report as failed. It still has to reach someone,
     * because conversion quality lands on the reviewers.
     */
    it('logs conversion warnings rather than returning them', async () => {
      convert.mockResolvedValue({
        html: '<p>plan</p>',
        warnings: ['Unrecognised paragraph style: Heading 7'],
      })

      const result = await service.submitEquality(input, document, COMPANY)

      expect(result).not.toHaveProperty('warnings')
      expect(warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          providerId: 'p-1',
          warningCount: 1,
        }),
      )
    })

    it('says nothing when the conversion was clean', async () => {
      await service.submitEquality(input, document, COMPANY)

      expect(warn).not.toHaveBeenCalled()
    })

    /**
     * The refusal has to happen before anything is filed. A report stored with
     * an empty plan is worse than a rejected submission: it reaches a reviewer
     * looking like the employer's own work.
     */
    it('files nothing when the document is refused', async () => {
      convert.mockRejectedValue(new BadRequestException('not a .docx'))

      await expect(
        service.submitEquality(input, document, COMPANY),
      ).rejects.toThrow(BadRequestException)
      expect(submitEquality).not.toHaveBeenCalled()
    })

    it('passes a missing document to the converter, which owns that refusal', async () => {
      convert.mockRejectedValue(new BadRequestException('missing or empty'))

      await expect(
        service.submitEquality(input, undefined, COMPANY),
      ).rejects.toThrow(BadRequestException)
      expect(convert).toHaveBeenCalledWith(undefined)
      expect(submitEquality).not.toHaveBeenCalled()
    })
  })
})
