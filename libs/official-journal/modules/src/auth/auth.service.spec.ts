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
})
