import { EventEmitter } from 'events'

import { CLSMiddleware } from './cls.middleware'

const mockNamespace = {
  // Runs the callback and hands back its promise so the test can await it
  run: jest.fn((fn: () => Promise<void>) => fn()),
  set: jest.fn(),
}
jest.mock('cls-hooked', () => ({ getNamespace: () => mockNamespace }))

type FakeResponse = EventEmitter & {
  statusCode: number
  writableFinished: boolean
}

const flush = () => new Promise((resolve) => setImmediate(resolve))

describe('CLSMiddleware', () => {
  let transaction: { commit: jest.Mock; rollback: jest.Mock }
  let logger: Record<'debug' | 'info' | 'warn' | 'error', jest.Mock>
  let res: FakeResponse
  let next: jest.Mock

  beforeEach(async () => {
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
    })
    next = jest.fn()

    const middleware = new CLSMiddleware(
      { transaction: jest.fn().mockResolvedValue(transaction) } as never,
      logger as never,
    )
    await middleware.use({} as never, res as never, next)
    await flush()
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
    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)
    transaction.commit.mockRejectedValue(new Error('already finished'))

    finish(200)
    await flush()
    process.off('unhandledRejection', unhandled)

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to commit transaction',
      expect.objectContaining({ context: 'CLSMiddleware' }),
    )
    expect(unhandled).not.toHaveBeenCalled()
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
})
