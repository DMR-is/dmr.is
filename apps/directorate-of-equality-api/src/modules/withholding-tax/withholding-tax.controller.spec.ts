import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common'

import {
  type IWithholdingTaxService,
  WithholdingTaxError,
} from '@dmr.is/clients-withholding-tax'

import { WithholdingTaxController } from './withholding-tax.controller'

describe('WithholdingTaxController', () => {
  const service: jest.Mocked<IWithholdingTaxService> = {
    checkConnection: jest.fn(),
    getJobCounts: jest.fn(),
  }
  const controller = new WithholdingTaxController(service)

  afterEach(() => jest.resetAllMocks())

  describe('check', () => {
    it('reports ok', async () => {
      service.checkConnection.mockResolvedValue()
      await expect(controller.check()).resolves.toMatchObject({
        ok: true,
        reason: null,
      })
    })

    it('reports the reason without throwing', async () => {
      service.checkConnection.mockRejectedValue(
        new WithholdingTaxError('AUTH_FAILED', 'token', 'rejected', 401),
      )
      await expect(controller.check()).resolves.toMatchObject({
        ok: false,
        reason: 'token AUTH_FAILED HTTP 401',
      })
    })

    it('rethrows anything that is not a client error', async () => {
      service.checkConnection.mockRejectedValue(new Error('bug'))
      await expect(controller.check()).rejects.toThrow('bug')
    })
  })

  describe('getJobCounts', () => {
    it('passes the result through', async () => {
      const result = { incomeYear: 2025, companies: [], skipped: [] }
      service.getJobCounts.mockResolvedValue(result)
      await expect(controller.getJobCounts(2025)).resolves.toBe(result)
      expect(service.getJobCounts).toHaveBeenCalledWith(2025)
    })

    it('maps NOT_CONFIGURED to 503', async () => {
      service.getJobCounts.mockRejectedValue(
        new WithholdingTaxError('NOT_CONFIGURED', 'getJobCount', 'unset'),
      )
      await expect(controller.getJobCounts(2025)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      )
    })

    it('maps an upstream failure to 502', async () => {
      service.getJobCounts.mockRejectedValue(
        new WithholdingTaxError('HTTP_ERROR', 'getJobCount', 'boom', 500),
      )
      await expect(controller.getJobCounts(2025)).rejects.toBeInstanceOf(
        BadGatewayException,
      )
    })
  })
})
