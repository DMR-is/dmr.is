import { EventEmitter } from 'events'

import { CLSMiddleware } from './cls.middleware'

// The promise of the callback handed to `run`, so a test can see whether it
// settled cleanly
let mockLastRun: Promise<void> | undefined
const mockNamespace = {
  run: jest.fn((fn: () => Promise<void>) => {
    mockLastRun = fn()
    return mockLastRun
  }),
  set: jest.fn(),
}
jest.mock('cls-hooked', () => ({ getNamespace: () => mockNamespace }))

type FakeResponse = EventEmitter & {
  statusCode: number
  writableFinished: boolean
  closed: boolean
  destroyed: boolean
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('CLSMiddleware', () => {
  let transaction: { commit: jest.Mock; rollback: jest.Mock }
  let logger: Record<'debug' | 'info' | 'warn' | 'error', jest.Mock>
  let res: FakeResponse
  let next: jest.Mock
  let middleware: CLSMiddleware
  let sequelize: { transaction: jest.Mock }

  beforeEach(async () => {
    mockNamespace.set.mockClear()
    mockLastRun = undefined
    transaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    }
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }
    res = Object.assign(new EventEmitter(), {
      statusCode: 200,
      writableFinished: false,
      closed: false,
      destroyed: false,
    })
    next = jest.fn()
    sequelize = { transaction: jest.fn().mockResolvedValue(transaction) }

    middleware = new CLSMiddleware(sequelize as never, logger as never)
    await middleware.use({} as never, res as never, next)
    await flush()
  })

  it('exposes the transaction and continues the request', () => {
    expect(mockNamespace.set).toHaveBeenCalledWith('transaction', transaction)
    expect(next).toHaveBeenCalledTimes(1)
  })

  const finish = (statusCode: number) => {
    res.statusCode = statusCode
    res.writableFinished = true
    res.emit('finish')
  }

  it.each([200, 201, 302])('commits once on finish with %i', async (code) => {
    finish(code)
    res.emit('close')
    await flush()

    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()
  })

  it.each([400, 404, 500])(
    'rolls back once on finish with %i',
    async (code) => {
      finish(code)
      res.emit('close')
      await flush()

      expect(transaction.rollback).toHaveBeenCalledTimes(1)
      expect(transaction.commit).not.toHaveBeenCalled()
    },
  )

  it('rolls back once and logs when the client closes before finish', async () => {
    res.emit('close')
    res.emit('close')
    await flush()

    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(transaction.commit).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'Request aborted before the response finished',
      expect.objectContaining({
        context: 'CLSMiddleware',
        traceId: expect.any(String),
      }),
    )
  })

  it('does not end the transaction again when finish follows a close', async () => {
    res.emit('close')
    finish(200)
    await flush()

    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(transaction.commit).not.toHaveBeenCalled()
  })

  it('logs instead of rejecting when the commit throws', async () => {
    transaction.commit.mockRejectedValue(new Error('already finished'))

    finish(200)
    await flush()

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to commit transaction',
      expect.objectContaining({ context: 'CLSMiddleware' }),
    )
    // The request callback itself settled; nothing escaped it
    await expect(mockLastRun).resolves.toBeUndefined()
  })

  it('logs instead of rejecting when the rollback throws', async () => {
    transaction.rollback.mockRejectedValue(new Error('already finished'))

    res.emit('close')
    await flush()

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to rollback transaction',
      expect.objectContaining({ context: 'CLSMiddleware' }),
    )
  })

  it.each(['closed', 'destroyed'] as const)(
    'rolls back once and skips the handler when the client left while the transaction was pending (%s)',
    async (flag) => {
      let resolveTransaction!: (t: typeof transaction) => void
      sequelize.transaction.mockReturnValue(
        new Promise((resolve) => {
          resolveTransaction = resolve
        }),
      )
      const pendingRes = Object.assign(new EventEmitter(), {
        statusCode: 200,
        writableFinished: false,
        closed: false,
        destroyed: false,
      })
      const pendingNext = jest.fn()
      mockNamespace.set.mockClear()
      logger.warn.mockClear()

      await middleware.use({} as never, pendingRes as never, pendingNext)
      // The client disconnects before the pool hands out a connection
      pendingRes[flag] = true
      pendingRes.emit('close')
      resolveTransaction(transaction)
      await flush()

      expect(transaction.rollback).toHaveBeenCalledTimes(1)
      expect(transaction.commit).not.toHaveBeenCalled()
      expect(pendingNext).not.toHaveBeenCalled()
      expect(mockNamespace.set).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledTimes(1)
      await expect(mockLastRun).resolves.toBeUndefined()
    },
  )
})
