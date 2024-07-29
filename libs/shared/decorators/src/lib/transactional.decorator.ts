import { logger } from '@dmr.is/logging'
import { Sequelize } from 'sequelize-typescript'
import { UniqueConstraintError } from 'sequelize'

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

      const sequelize: Sequelize = this.sequelize as Sequelize
      const transaction = await sequelize.transaction()
      try {
        const applyWithTransaction = originalMethod.bind(this)
        const result = await applyWithTransaction(...args, transaction)

        await transaction.commit()
        return result
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          logger.error(
            `Database exception occured at: ${error.name} - ${error.message}`,
            {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          )

          error.errors.forEach((e) => {
            logger.error(`Database error: ${e.message}`, {
              message: e.message,
            })
          })
        }
        await transaction.rollback()
        throw error
      }
    }

    return descriptor
  }
}
