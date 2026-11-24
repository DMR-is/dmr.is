import { getNamespace } from 'cls-hooked'
import { NextFunction, Request, Response } from 'express'
import { Sequelize } from 'sequelize-typescript'
import { v4 } from 'uuid'

import { Inject, Injectable, NestMiddleware } from '@nestjs/common'

import { CLS_NAMESPACE } from '@dmr.is/constants'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

@Injectable()
export class CLSMiddleware implements NestMiddleware {
  constructor(
    private readonly sequelize: Sequelize,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const transactionNamespace = getNamespace(CLS_NAMESPACE)

    if (!transactionNamespace) {
      throw new Error('Transaction namespace not found')
    }

    transactionNamespace.run(async () => {
      const traceId = v4()
      this.logger.debug(`Starting transaction`, {
        context: 'CLSMiddleware',
        traceId,
      })
      const transaction = await this.sequelize.transaction()
      transactionNamespace.set('transaction', transaction)

      // One flag so the transaction ends exactly once: `close` also fires
      // after a normal `finish`, and an abort must never roll back a
      // transaction that `finish` is committing.
      let finalised = false

      const finalise = async (action: 'commit' | 'rollback') => {
        if (finalised) {
          return
        }
        finalised = true

        this.logger.debug(
          action === 'commit'
            ? 'Committing transaction'
            : 'Rolling back transaction',
          { context: 'CLSMiddleware', traceId },
        )

        try {
          await transaction[action]()
        } catch (error) {
          this.logger.error(`Failed to ${action} transaction`, {
            context: 'CLSMiddleware',
            traceId,
            error,
          })
        }
      }

      res.on('finish', () => {
        void finalise(
          res.statusCode >= 200 && res.statusCode < 400 ? 'commit' : 'rollback',
        )
      })

      // The client went away before the response was sent: only `close`
      // fires, so without this the transaction would hold its row locks until
      // the connection is killed.
      res.on('close', () => {
        if (res.writableFinished || finalised) {
          return
        }

        this.logger.warn('Request aborted before the response finished', {
          context: 'CLSMiddleware',
          traceId,
        })
        void finalise('rollback')
      })

      next()
    })
  }
}
