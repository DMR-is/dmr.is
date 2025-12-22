import { QueryTypes } from 'sequelize'
import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { TASK_NAMESPACE } from '../../../core/constants'

@Injectable()
export class PgAdvisoryLockService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly sequelize: Sequelize,
  ) {}
  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  async runWithSessionLock(
    lockKey: number,
    fn: () => Promise<void>,
    opts?: { minHoldMs?: number },
  ): Promise<{ ran: boolean }> {
    const namespace = TASK_NAMESPACE
    const minHoldMs = opts?.minHoldMs ?? 0

    return this.sequelize.transaction(async (tx: Transaction) => {
      const lockedRow = await this.sequelize.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_lock($1, $2) AS locked',
        {
          bind: [TASK_NAMESPACE, lockKey],
          type: QueryTypes.SELECT,
          plain: true,
          transaction: tx,
        },
      )

      if (!lockedRow?.locked) return { ran: false }

      const start = Date.now()

      try {
        await fn()

        if (minHoldMs > 0) {
          const elapsed = Date.now() - start
          const remaining = minHoldMs - elapsed
          if (remaining > 0) await this.sleep(remaining)
        }

        return { ran: true }
      } finally {
        try {
          await this.sequelize.query('SELECT pg_advisory_unlock($1, $2)', {
            bind: [namespace, lockKey],
            type: QueryTypes.SELECT,
            plain: true,
            transaction: tx,
          })
        } catch (e) {
          this.logger.warn(
            `Failed to unlock advisory lock (${namespace}, ${lockKey}): ${String(e)}`,
          )
        }
      }
    })
  }
}
