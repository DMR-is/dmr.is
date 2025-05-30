import { getNamespace } from 'cls-hooked'
import { NextFunction, Request, Response } from 'express'
import { Sequelize } from 'sequelize-typescript'
import { v4 } from 'uuid'

import { Inject, Injectable, NestMiddleware } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

@Injectable()
export class CLSMiddleware implements NestMiddleware {
  constructor(
    private readonly sequelize: Sequelize,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const nameSpaceHeader = req.headers['x-namespace']

    if (!nameSpaceHeader) {
      throw new Error('Namespace header not found')
    }
    const transactionNamespace = getNamespace(nameSpaceHeader as string)

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

      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.logger.debug('Committing transaction', {
            context: 'CLSMiddleware',
            traceId,
          })
          await transaction.commit()
        } else {
          this.logger.debug('Rolling back transaction', {
            context: 'CLSMiddleware',
            traceId,
          })
          await transaction.rollback()
        }
      })

      next()
    })
  }
}
