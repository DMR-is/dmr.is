import { CaseService } from '../case/case.service'
import { PriceService } from './price.service'

describe('case payment status isolation', () => {
  const originalEnv = process.env
  const logger = { warn: jest.fn(), error: jest.fn() }
  const caseModel = {
    findByPk: jest.fn().mockResolvedValue({
      caseNumber: '2026-1',
      involvedParty: { nationalId: '1234567890' },
    }),
  }
  const sequelize = { transaction: jest.fn() }
  const authService = { xroadFetch: jest.fn() }
  let service: CaseService

  beforeEach(() => {
    process.env = { ...originalEnv, FEE_SERVICE_CRED: 'test:credentials' }
    const priceService = Object.assign(Object.create(PriceService.prototype), {
      logger,
      caseModel,
      sequelize,
      authService,
    }) as PriceService
    service = Object.assign(Object.create(CaseService.prototype), {
      priceService,
      sequelize,
    }) as CaseService
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it.each([
    [
      200,
      { result: { capital: 0, canceled: false } },
      { created: true, paid: true, capital: 0, canceled: false },
    ],
    [
      200,
      { result: { capital: 100, canceled: false } },
      { created: true, paid: false, capital: 100, canceled: false },
    ],
    [404, {}, { created: false, paid: false, capital: 0, canceled: false }],
  ])(
    'preserves payment semantics for HTTP %s',
    async (status, body, expected) => {
      authService.xroadFetch.mockResolvedValue(
        new Response(JSON.stringify(body), { status }),
      )
      const result = await service.getCasePaymentStatus({ caseId: 'case-id' })
      expect(result.unwrap()).toEqual(expected)
      expect(sequelize.transaction).not.toHaveBeenCalled()
      expect(caseModel.findByPk.mock.calls[0][1]).not.toHaveProperty(
        'transaction',
      )
    },
  )

  it('bounds stalled response bodies without holding a database transaction', async () => {
    const controller = new AbortController()
    const timeout = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal)
    let readingBody!: () => void
    const started = new Promise<void>((resolve) => {
      readingBody = resolve
    })
    authService.xroadFetch.mockImplementation(
      async (_url, options: RequestInit) => ({
        status: 200,
        ok: true,
        json: () =>
          new Promise((_, reject) => {
            options.signal?.addEventListener(
              'abort',
              () => reject(options.signal?.reason),
              { once: true },
            )
            readingBody()
          }),
      }),
    )
    const pending = service.getCasePaymentStatus({ caseId: 'case-id' })
    await started
    expect(timeout).toHaveBeenCalledWith(10_000)
    expect(sequelize.transaction).not.toHaveBeenCalled()
    controller.abort(new Error('deadline exceeded'))
    const result = await pending
    expect(() => result.unwrap()).toThrow()
  })

  it('returns a service failure as an error, not an unpaid result', async () => {
    authService.xroadFetch.mockResolvedValue(
      new Response('{}', { status: 503 }),
    )
    const result = await service.getCasePaymentStatus({ caseId: 'case-id' })
    expect(() => result.unwrap()).toThrow()
  })
})
