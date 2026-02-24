import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'

import { logger } from '@dmr.is/logging'
import { get } from '@dmr.is/utils-shared/lodash/get'

const LOGGING_CONTEXT = 'Transactional'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      if ('sequelize' in this === false) {
        throw new Error('sequelize instance is required')
      }

      // check if a transaction is already in progress, could be passed as an argument
      if (args.length > 0) {
        const currentTransaction = args.find(
          (arg) => arg instanceof Transaction,
        )

        if (currentTransaction) {
          logger.debug(
            `Using existing transaction for ${originalMethod.name}`,
            {
              context: LOGGING_CONTEXT,
              traceId: get(currentTransaction, '_localTraceId'),
            },
          )
          return originalMethod.apply(this, args)
        }
      }

      const sequelize: Sequelize = this.sequelize as Sequelize
      const traceId = uuid()
      const transaction = await sequelize.transaction()
      Object.assign(transaction, { _localTraceId: traceId })
      try {
        const applyWithTransaction = originalMethod.bind(this)
        logger.debug(`Starting transaction for ${originalMethod.name}`, {
          context: LOGGING_CONTEXT,
          traceId: get(transaction, '_localTraceId'),
        })
        const result = await applyWithTransaction(...args, transaction)

        logger.debug(`Committing transaction for ${originalMethod.name}`, {
          context: LOGGING_CONTEXT,
          traceId: get(transaction, '_localTraceId'),
        })
        await transaction.commit()
        return result
      } catch (error) {
        logger.error(`Rolling back transaction for ${originalMethod.name}`, {
          context: LOGGING_CONTEXT,
          traceId: get(transaction, '_localTraceId'),
          error,
        })
        await transaction.rollback()
        throw error
      }
    }

    return descriptor
  }
}
