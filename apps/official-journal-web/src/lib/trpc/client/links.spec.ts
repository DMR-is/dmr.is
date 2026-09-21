/** @jest-environment node */
import { createLinks } from './links'

import { createTRPCUntypedClient } from '@trpc/client'
import { initTRPC, TRPCError } from '@trpc/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

describe('payment query transport isolation', () => {
  it('delivers other queries before a stalled payment request fails', async () => {
    let failPayment!: () => void
    const payment = new Promise<void>((resolve) => {
      failPayment = resolve
    })
    const t = initTRPC.create()
    const router = t.router({
      getPaymentStatus: t.procedure.query(async () => {
        await payment
        throw new TRPCError({ code: 'TIMEOUT' })
      }),
      getCase: t.procedure.query(() => ({ id: 'case-id' })),
      getTypes: t.procedure.query(() => ['type']),
    })
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation((url, init) =>
        fetchRequestHandler({
          endpoint: '/api/trpc',
          req: new Request(url, init),
          router,
          createContext: () => ({}),
        }),
      )
    const client = createTRPCUntypedClient({
      links: createLinks('http://localhost/api/trpc'),
    })
    const paymentResult = client
      .query('getPaymentStatus')
      .catch((error) => error)
    try {
      await expect(
        Promise.all([client.query('getCase'), client.query('getTypes')]),
      ).resolves.toEqual([{ id: 'case-id' }, ['type']])
      const requests = fetchMock.mock.calls.map(([url]) => new URL(String(url)))
      expect(requests).toHaveLength(2)
      expect(
        requests
          .find((url) => url.pathname.endsWith('/getPaymentStatus'))
          ?.searchParams.has('batch'),
      ).toBe(false)
      expect(
        requests.find((url) => url.searchParams.has('batch'))?.pathname,
      ).not.toContain('getPaymentStatus')
    } finally {
      failPayment()
    }
    expect(await paymentResult).toMatchObject({ data: { code: 'TIMEOUT' } })
  })
})
