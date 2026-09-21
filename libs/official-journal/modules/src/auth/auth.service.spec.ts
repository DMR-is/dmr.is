import type { Logger } from '@dmr.is/logging'

import { AuthService } from './auth.service'

const logger = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
} as unknown as Logger

describe('payment request cancellation through AuthService', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ISLAND_IS_TOKEN_URL: 'https://ids.example/token',
      ISLAND_IS_DMR_CLIENT_SECRET: 'test-secret',
      ISLAND_IS_DMR_CLIENT_ID: 'test-client',
      ISLAND_IS_DMR_CLIENT_SCOPES: 'test-scope',
      XROAD_DMR_CLIENT: 'test-xroad-client',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it.each(['token headers', 'token body', 'payment headers'])(
    'aborts a stalled request while waiting for %s',
    async (stage) => {
      const controller = new AbortController()
      let reachedStage!: () => void
      const started = new Promise<void>((resolve) => {
        reachedStage = resolve
      })
      const stall = (signal: AbortSignal) => {
        reachedStage()
        return new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          })
        })
      }
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (url, options) => {
          const signal = options?.signal as AbortSignal
          if (url === process.env.ISLAND_IS_TOKEN_URL) {
            if (stage === 'token headers') return stall(signal)
            return {
              status: 200,
              json: () =>
                stage === 'token body'
                  ? stall(signal)
                  : Promise.resolve({
                      access_token: 'token',
                      expires_in: 3600,
                    }),
            } as Response
          }
          return stall(signal)
        })
      const service = new AuthService(logger)
      const pending = service.xroadFetch('https://payment.example/claim', {
        method: 'GET',
        signal: controller.signal,
      })
      const rejected = expect(pending).rejects.toThrow('deadline exceeded')
      await started
      controller.abort(new Error('deadline exceeded'))
      await rejected
      expect(fetchMock).toHaveBeenCalledTimes(
        stage === 'payment headers' ? 2 : 1,
      )
    },
  )

  describe('default deadline', () => {
    const okResponse = (body: unknown) =>
      ({ status: 200, json: () => Promise.resolve(body) }) as Response

    const callXroadFetch = async (options: RequestInit) => {
      const fetchMock = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (url) =>
          url === process.env.ISLAND_IS_TOKEN_URL
            ? okResponse({ access_token: 'token', expires_in: 3600 })
            : okResponse({}),
        )
      await new AuthService(logger).xroadFetch(
        'https://payment.example/claim',
        options,
      )
      return fetchMock
    }

    it('bounds a caller that passes no signal of its own', async () => {
      const timeout = jest.spyOn(AbortSignal, 'timeout')

      const fetchMock = await callXroadFetch({ method: 'GET' })

      expect(timeout).toHaveBeenCalledWith(30_000)
      for (const [, init] of fetchMock.mock.calls) {
        expect(init?.signal).toBeInstanceOf(AbortSignal)
      }
    })

    it("leaves a caller's own deadline alone", async () => {
      const callerSignal = AbortSignal.timeout(10_000)
      const timeout = jest.spyOn(AbortSignal, 'timeout')

      const fetchMock = await callXroadFetch({
        method: 'GET',
        signal: callerSignal,
      })

      expect(timeout).not.toHaveBeenCalled()
      for (const [, init] of fetchMock.mock.calls) {
        expect(init?.signal).toBe(callerSignal)
      }
    })
  })
})
