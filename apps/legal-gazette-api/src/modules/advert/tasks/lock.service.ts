import { QueryTypes } from 'sequelize'
import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { TASK_NAMESPACE } from '../../../core/constants'

/**
 * Service for distributed task locking using PostgreSQL advisory locks.
 *
 * Uses a combination of:
 * 1. pg_try_advisory_xact_lock - Prevents concurrent execution
 * 2. job_runs table - Prevents duplicate runs within a time window
 */

const LOGGING_CONTEXT = 'PgAdvisoryLockService'
@Injectable()
export class PgAdvisoryLockService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly sequelize: Sequelize,
  ) {}

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Runs a function with distributed locking that prevents:
   * 1. Concurrent execution (via advisory lock)
   * 2. Duplicate runs within cooldownMs window (via job_runs table)
   *
   * @param lockKey - Unique identifier for this job type
   * @param fn - The async function to execute
   * @param opts.cooldownMs - Minimum time between job runs (default: 60000ms = 1 minute)
   * @param opts.containerId - Optional container identifier for debugging
   */
  async runWithDistributedLock(
    lockKey: number,
    fn: () => Promise<void>,
    opts?: { cooldownMs?: number; containerId?: string },
  ): Promise<{ ran: boolean; reason?: string }> {
    const cooldownMs = opts?.cooldownMs ?? 60000 // Default 1 minute cooldown
    const containerId = opts?.containerId ?? process.env.HOSTNAME ?? 'unknown'

    return this.sequelize.transaction(async (tx: Transaction) => {
      // Step 1: Try to acquire advisory lock (prevents concurrent execution)
      const lockedRow = await this.sequelize.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock($1, $2) AS locked',
        {
          bind: [TASK_NAMESPACE, lockKey],
          type: QueryTypes.SELECT,
          plain: true,
          transaction: tx,
        },
      )

      if (!lockedRow?.locked) {
        return { ran: false, reason: 'lock_held' }
      }

      // Step 2: Check if job ran recently (prevents duplicate runs after lock release)
      const lastRun = await this.sequelize.query<{ last_run_at: Date }>(
        `SELECT last_run_at FROM job_runs WHERE job_key = $1`,
        {
          bind: [lockKey],
          type: QueryTypes.SELECT,
          plain: true,
          transaction: tx,
        },
      )

      if (lastRun?.last_run_at) {
        const elapsed = Date.now() - new Date(lastRun.last_run_at).getTime()
        if (elapsed < cooldownMs) {
          this.logger.debug(
            `Job ${lockKey} skipped - ran ${elapsed}ms ago (cooldown: ${cooldownMs}ms)`,
            { containerId, context: LOGGING_CONTEXT },
          )
          return { ran: false, reason: 'cooldown' }
        }
      }

      // Step 3: Mark job as running (before executing to prevent races)
      await this.sequelize.query(
        `INSERT INTO job_runs (job_key, last_run_at, container_id)
         VALUES ($1, NOW(), $2)
         ON CONFLICT (job_key)
         DO UPDATE SET last_run_at = NOW(), container_id = $2`,
        {
          bind: [lockKey, containerId],
          type: QueryTypes.INSERT,
          transaction: tx,
        },
      )

      // Step 4: Execute the job
      this.logger.debug(`Job ${lockKey} starting on container ${containerId}`, {
        context: LOGGING_CONTEXT,
      })
      await fn()
      this.logger.debug(
        `Job ${lockKey} completed on container ${containerId}`,
        {
          context: LOGGING_CONTEXT,
        },
      )

      return { ran: true }
      // Lock automatically released when transaction commits
    })
  }

  /**
   * Converts a string to a 32-bit integer hash for use as advisory lock key.
   * Uses djb2 algorithm - fast and has good distribution.
   */
  private stringToLockKey(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i)
    }
    // Convert to signed 32-bit integer and ensure positive
    // PostgreSQL's INTEGER type is signed (max: 2,147,483,647)
    return Math.abs(hash | 0)
  }

  /**
   * Runs a function with a per-user advisory lock.
   * Prevents concurrent execution for the same user (e.g., double-click on subscription button).
   *
   * Uses a separate namespace (2000) from task locks to avoid conflicts.
   *
   * @param userKey - Unique user identifier (e.g., nationalId)
   * @param fn - The async function to execute, receives the transaction for use in queries
   * @returns The result of fn, or throws if lock couldn't be acquired
   *
   * @example
   * ```typescript
   * const result = await this.lock.runWithUserLock(
   *   user.nationalId,
   *   async (tx) => {
   *     // All DB operations here use the same transaction
   *     const subscriber = await this.subscriberModel.findOne({ where: {...}, transaction: tx })
   *     // ... do work ...
   *     return { success: true }
   *   }
   * )
   * ```
   */
  async runWithUserLock<T>(
    userKey: string,
    fn: (tx: Transaction) => Promise<T>,
  ): Promise<
    { success: true; result: T } | { success: false; reason: 'lock_held' }
  > {
    const USER_LOCK_NAMESPACE = 2000
    const lockKey = this.stringToLockKey(userKey)

    return this.sequelize.transaction(async (tx: Transaction) => {
      // Try to acquire advisory lock for this user
      const lockedRow = await this.sequelize.query<{ locked: boolean }>(
        'SELECT pg_try_advisory_xact_lock($1, $2) AS locked',
        {
          bind: [USER_LOCK_NAMESPACE, lockKey],
          type: QueryTypes.SELECT,
          plain: true,
          transaction: tx,
        },
      )

      if (!lockedRow?.locked) {
        this.logger.debug(`User lock blocked for key: ${userKey}`, {
          lockKey,
          namespace: USER_LOCK_NAMESPACE,
          context: LOGGING_CONTEXT,
        })
        return { success: false, reason: 'lock_held' }
      }

      // Execute the function with the transaction
      const result = await fn(tx)

      return { success: true, result }
      // Lock automatically released when transaction commits
    })
  }

  /**
   * @deprecated Use runWithDistributedLock instead for better duplicate prevention.
   * Kept for backwards compatibility.
   */
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
            { context: LOGGING_CONTEXT },
          )
        }
      }
    })
  }
}
