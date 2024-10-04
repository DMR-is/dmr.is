import { Sequelize } from 'sequelize-typescript'
import { Transaction } from 'sequelize'

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
          return originalMethod.apply(this, args)
        }
      }

      const sequelize: Sequelize = this.sequelize as Sequelize
      const transaction = await sequelize.transaction()
      try {
        const applyWithTransaction = originalMethod.bind(this)
        const result = await applyWithTransaction(...args, transaction)

        await transaction.commit()
        return result
      } catch (error) {
        await transaction.rollback()
        throw error
      }
    }

    return descriptor
  }
}
