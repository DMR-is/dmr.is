import { QueryTypes } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Injectable } from '@nestjs/common'

import { TASK_NAMESPACE } from '../../../core/constants'

@Injectable()
export class PgAdvisoryXactLockService {
  constructor(private readonly sequelize: Sequelize) {}

  async runWithXactLock(
    lockKey2: number,
    fn: () => Promise<void>,
  ): Promise<{ ran: boolean }> {
    return this.sequelize.transaction(async (tx) => {
      const row = await this.sequelize.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock($1, $2) AS locked',
        {
          bind: [TASK_NAMESPACE, lockKey2],
          transaction: tx,
          plain: true,
          type: QueryTypes.SELECT,
        },
      )

      if (!row?.locked) return { ran: false }

      await fn()
      return { ran: true }
    })
  }
}
