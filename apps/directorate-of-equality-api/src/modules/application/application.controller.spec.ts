import { NotFoundException, ServiceUnavailableException } from '@nestjs/common'

import type { CompanyDto } from '@dmr.is/doe-modules/company'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { PartnerClientResourceGuard } from '../../core/guards/partner-client-resource/partner-client-resource.guard'
import {
  assertIdentityGuarded,
  assertTokenSurface,
  ISLAND_IS_APPLICATION_SCOPE,
  ISLAND_IS_SALARY_APPLICATION_SCOPE,
  MY_PAGES_SCOPE,
} from '../../core/guards/token-surface/token-surface.testing'
import { ApplicationController } from './application.controller'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const COMPANY = {
  id: 'company-1',
  name: 'Acme ehf.',
  nationalId: '5501234567',
} as CompanyDto

/**
 * Stands in for the partner-client table: a firm is live while `revokedAt` is
 * null. `findLiveByNationalId` honours that exactly as the real service's
 * query does (`where: { nationalId, revokedAt: null }`, pinned in
 * `partner-client.service.spec.ts`), so the cases below can say "revoked"
 * rather than "the mock returned null".
 */
const partnerClientTable = (
  rows: Array<{ id: string; nationalId: string; revokedAt: Date | null }>,
) => ({
  findLiveByNationalId: jest.fn(
    async (nationalId: string) =>
      rows.find(
        (row) => row.nationalId === nationalId && row.revokedAt === null,
      ) ?? null,
  ),
})

describe('ApplicationController', () => {
  describe('token surface (#1568)', () => {
    // My Pages lists and opens reports but never changes them: these read
    // routes admit it beside the application system.
    const reads = [
      'getCompany',
      'getReports',
      'getActiveEqualityReport',
      'getReport',
      'getEqualityContentPdf',
      'getReportPdf',
      'getImprovementPlanPdf',
      'getReportOutliers',
      'getReportComments',
    ]

    // A sample of the write routes, which stay with the application system,
    // plus the one GET that does too: the attachment list reaches drafts.
    const writes = [
      'submitComment',
      'editEqualityContent',
      'withdrawReport',
      'listEqualityAttachments',
    ]

    it.each([...reads, ...writes])(
      '%s runs behind the identity guard',
      (method) => {
        expect(() =>
          assertIdentityGuarded(
            ApplicationController,
            method,
            CompanyResourceGuard,
          ),
        ).not.toThrow()
      },
    )

    it.each(reads)(
      '%s admits the application system and My Pages, and refuses any other token',
      async (method) => {
        await expect(
          assertTokenSurface(
            ApplicationController,
            method,
            CompanyResourceGuard,
            {
              accepts: [
                ISLAND_IS_APPLICATION_SCOPE,
                ISLAND_IS_SALARY_APPLICATION_SCOPE,
                MY_PAGES_SCOPE,
              ],
            },
          ),
        ).resolves.toBeUndefined()
      },
    )

    it.each(writes)(
      '%s admits the application system and refuses My Pages',
      async (method) => {
        await expect(
          assertTokenSurface(
            ApplicationController,
            method,
            CompanyResourceGuard,
            {
              accepts: [
                ISLAND_IS_APPLICATION_SCOPE,
                ISLAND_IS_SALARY_APPLICATION_SCOPE,
              ],
              refuses: [MY_PAGES_SCOPE],
            },
          ),
        ).resolves.toBeUndefined()
      },
    )
  })

  describe('generated report PDFs', () => {
    const REPORT_ID = '00000000-0000-0000-0000-0000000000cc'
    const PDF = Buffer.from('%PDF-1.7')

    const build = (pdfService: Record<string, jest.Mock>) => {
      const getSignedOffReportId = jest.fn().mockResolvedValue(REPORT_ID)
      // Runs the render straight through, as a gate with free slots does.
      const run = jest.fn(<T>(render: () => Promise<T>) => render())
      const controller = new ApplicationController(
        { getSignedOffReportId } as never,
        {} as never,
        {} as never,
        {} as never,
        pdfService as never,
        { run } as never,
      )
      return { controller, getSignedOffReportId, run }
    }

    it.each(['getReportPdf', 'getImprovementPlanPdf'])(
      '%s is never cached',
      (method) => {
        const headers = Reflect.getMetadata(
          '__headers__',
          ApplicationController.prototype[
            method as keyof ApplicationController
          ],
        )
        expect(headers).toContainEqual({
          name: 'Cache-Control',
          value: 'private, no-store',
        })
      },
    )

    it('renders inside the download gate, after authorization', async () => {
      const generateReportPdf = jest
        .fn()
        .mockResolvedValue({ pdf: PDF, fileName: 'launagreining-x.pdf' })
      const { controller, getSignedOffReportId, run } = build({
        generateReportPdf,
      })

      await controller.getReportPdf('app-1', COMPANY)

      expect(run).toHaveBeenCalledTimes(1)
      expect(getSignedOffReportId.mock.invocationCallOrder[0]).toBeLessThan(
        run.mock.invocationCallOrder[0],
      )
    })

    it('does not render when the download gate sheds', async () => {
      const generateImprovementPlanPdf = jest.fn()
      const { controller, run } = build({ generateImprovementPlanPdf })
      run.mockRejectedValue(new ServiceUnavailableException())

      await expect(
        controller.getImprovementPlanPdf('app-1', COMPANY),
      ).rejects.toThrow(ServiceUnavailableException)
      expect(generateImprovementPlanPdf).not.toHaveBeenCalled()
    })

    it('renders the report the signed-off gate resolved, never the handle', async () => {
      const generateReportPdf = jest
        .fn()
        .mockResolvedValue({ pdf: PDF, fileName: 'launagreining-x.pdf' })
      const { controller, getSignedOffReportId } = build({ generateReportPdf })

      const file = await controller.getReportPdf('partner:vendor-42', COMPANY)

      expect(getSignedOffReportId).toHaveBeenCalledWith(
        'partner:vendor-42',
        COMPANY,
      )
      expect(generateReportPdf).toHaveBeenCalledWith(REPORT_ID)
      expect(file.getHeaders().type).toBe('application/pdf')
    })

    it('does not render when the gate refuses', async () => {
      const generateReportPdf = jest.fn()
      const { controller, getSignedOffReportId } = build({ generateReportPdf })
      getSignedOffReportId.mockRejectedValue(new NotFoundException())

      await expect(controller.getReportPdf('app-1', COMPANY)).rejects.toThrow(
        NotFoundException,
      )
      expect(generateReportPdf).not.toHaveBeenCalled()
    })

    it('serves the úrbótaáætlun for the signed-off report', async () => {
      const generateImprovementPlanPdf = jest
        .fn()
        .mockResolvedValue({ pdf: PDF, fileName: 'urbotaaetlun-x.pdf' })
      const { controller } = build({ generateImprovementPlanPdf })

      const file = await controller.getImprovementPlanPdf('app-1', COMPANY)

      expect(generateImprovementPlanPdf).toHaveBeenCalledWith(REPORT_ID)
      expect(file.getHeaders().type).toBe('application/pdf')
    })

    it('404s when the report has no úrbótaáætlun', async () => {
      const generateImprovementPlanPdf = jest.fn().mockResolvedValue(null)
      const { controller } = build({ generateImprovementPlanPdf })

      await expect(
        controller.getImprovementPlanPdf('app-1', COMPANY),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('getCompany — isServiceProvider', () => {
    const build = (service: ReturnType<typeof partnerClientTable>) => ({
      controller: new ApplicationController(
        {} as never,
        {} as never,
        {} as never,
        service as never,
        {} as never,
        {} as never,
      ),
      guard: new PartnerClientResourceGuard(logger as never, service as never),
    })

    /** Whether `GET /application/partner-client` would answer for this login. */
    const guardAdmits = async (
      guard: PartnerClientResourceGuard,
      nationalId: string,
    ) => {
      try {
        await guard.canActivate({
          switchToHttp: () => ({
            // A My Pages token: the provider routes take no other.
            getRequest: () => ({
              user: { nationalId, scope: [MY_PAGES_SCOPE] },
            }),
          }),
        } as never)
        return true
      } catch (e) {
        if (e instanceof NotFoundException) return false
        throw e
      }
    }

    it('is true for a live partner client, and the provider routes answer', async () => {
      const service = partnerClientTable([
        { id: 'client-a', nationalId: COMPANY.nationalId, revokedAt: null },
      ])
      const { controller, guard } = build(service)

      const result = await controller.getCompany(COMPANY)

      expect(result).toEqual({ ...COMPANY, isServiceProvider: true })
      expect(service.findLiveByNationalId).toHaveBeenCalledWith(
        COMPANY.nationalId,
      )
      await expect(guardAdmits(guard, COMPANY.nationalId)).resolves.toBe(true)
    })

    it('is false when the organisation is no partner client, and the provider routes 404', async () => {
      const service = partnerClientTable([
        { id: 'client-b', nationalId: '4401234567', revokedAt: null },
      ])
      const { controller, guard } = build(service)

      const result = await controller.getCompany(COMPANY)

      expect(result.isServiceProvider).toBe(false)
      await expect(guardAdmits(guard, COMPANY.nationalId)).resolves.toBe(false)
    })

    it('is false for a revoked partner client, and the provider routes 404', async () => {
      const service = partnerClientTable([
        {
          id: 'client-a',
          nationalId: COMPANY.nationalId,
          revokedAt: new Date('2026-10-01T00:00:00.000Z'),
        },
      ])
      const { controller, guard } = build(service)

      const result = await controller.getCompany(COMPANY)

      expect(result.isServiceProvider).toBe(false)
      await expect(guardAdmits(guard, COMPANY.nationalId)).resolves.toBe(false)
    })

    it('keeps every company field', async () => {
      const { controller } = build(partnerClientTable([]))

      const result = await controller.getCompany(COMPANY)

      expect(result).toMatchObject(COMPANY)
    })
  })

  describe('getReports', () => {
    it('lists for the resolved company only', async () => {
      const listReports = jest.fn().mockResolvedValue({ reports: [] })
      const controller = new ApplicationController(
        { listReports } as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      )

      await expect(controller.getReports(COMPANY)).resolves.toEqual({
        reports: [],
      })
      expect(listReports).toHaveBeenCalledWith(COMPANY)
    })
  })
})
