import { Op } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { TASK_JOB_IDS } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
} from '../../../../models/tbr-transactions.model'
import { ITBRService } from '../../../tbr/tbr.service.interface'
import { IPriceCalculatorService } from '../../calculator/price-calculator.service.interface'
import { PgAdvisoryLockService } from '../lock.service'
import { IPaymentTaskService } from './payment.task.interface'

const LOGGING_CONTEXT = 'PaymentTaskService'

@Injectable()
export class PaymentTaskService implements IPaymentTaskService {
  private readonly chunkSize: number = 25
  private readonly chunkDelayMs: number = 500
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ITBRService) private readonly tbrService: ITBRService,
    @Inject(IPriceCalculatorService)
    private readonly priceCalculatorService: IPriceCalculatorService,

    @InjectModel(TBRTransactionModel)
    private readonly tbrTransactionModel: typeof TBRTransactionModel,
    @InjectModel(AdvertModel)
    private readonly advertModel: typeof AdvertModel,
    private readonly lock: PgAdvisoryLockService,
  ) {
    const tbrChunk = process.env.TBR_CHUNK_SIZE
      ? parseInt(process.env.TBR_CHUNK_SIZE, 10)
      : 10

    if (!Number.isNaN(tbrChunk)) {
      this.chunkSize = tbrChunk
    }

    const tbrChunkDelay = process.env.TBR_CHUNK_DELAY_MS
      ? parseInt(process.env.TBR_CHUNK_DELAY_MS, 10)
      : 1000

    if (!Number.isNaN(tbrChunkDelay)) {
      this.chunkDelayMs = tbrChunkDelay
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM, {
    name: 'payment-job',
  })
  async run() {
    // Use distributed lock with 10-minute cooldown (cron runs every 15 min)
    // This prevents duplicate runs even if containers have slight clock drift
    const { ran, reason } = await this.lock.runWithDistributedLock(
      TASK_JOB_IDS.payment,
      async () => {
        await this.updateTBRPayments()
      },
      {
        cooldownMs: 10 * 60 * 1000, // 10 minutes
        containerId: process.env.HOSTNAME,
      },
    )

    if (!ran) {
      this.logger.debug(`TBRPayments skipped (${reason})`, {
        context: LOGGING_CONTEXT,
      })
    }
  }

  async updateTBRPayments() {
    const now = new Date()
    this.logger.info(
      'Starting TBR payment status update job for created payments',
      {
        timestamp: now.toISOString(),
        context: LOGGING_CONTEXT,
      },
    )

    const pendingTransactions = await this.tbrTransactionModel.findAll({
      where: {
        paidAt: {
          [Op.eq]: null,
        },
        chargeCategory: process.env.LG_TBR_CHARGE_CATEGORY_PERSON, // Only process LR1
        status: TBRTransactionStatus.CREATED,
      },
    })

    if (pendingTransactions.length === 0) {
      this.logger.info('No pending TBR payments found, skipping job', {
        timestamp: new Date().toISOString(),
        context: LOGGING_CONTEXT,
      })
      return
    }

    // create chunks of transactions to process
    const chunks: TBRTransactionModel[][] = []
    for (let i = 0; i < pendingTransactions.length; i += this.chunkSize) {
      chunks.push(pendingTransactions.slice(i, i + this.chunkSize))
    }

    this.logger.info(
      `Found ${pendingTransactions.length} pending TBR payments`,
      {
        chunks: chunks.length,
        chunkSize: this.chunkSize,
        context: LOGGING_CONTEXT,
      },
    )

    // Process each chunk sequentially to avoid overwhelming the TBR service
    for (const [index, chunk] of chunks.entries()) {
      this.logger.info(
        `Processing TBR transaction chunk ${index + 1}/${chunks.length}`,
        {
          chunkSize: chunk.length,
          context: LOGGING_CONTEXT,
        },
      )

      try {
        const promises = chunk.map((transaction, i) =>
          this.tbrService.getPaymentStatus({
            chargeBase: transaction.chargeBase,
            chargeCategory: transaction.chargeCategory,
            debtorNationalId: transaction.debtorNationalId,
          }, i),
        )
        const results = await Promise.allSettled(promises)

        for (const [i, result] of results.entries()) {
          const transaction = chunk[i]
          if (result.status === 'fulfilled') {
            const paymentData = result.value

            if (paymentData.paid) {
              this.logger.info('TBR payment completed, updating transaction', {
                chargeBase: transaction.chargeBase,
                transactionId: transaction.id,
                context: LOGGING_CONTEXT,
              })
              transaction.status = TBRTransactionStatus.PAID
              transaction.paidAt = new Date()
              await transaction.save()
            } else if (paymentData.canceled) {
              this.logger.info('TBR payment canceled, updating transaction', {
                chargeBase: transaction.chargeBase,
                transactionId: transaction.id,
                context: LOGGING_CONTEXT,
              })
              transaction.status = TBRTransactionStatus.CANCELED
              await transaction.save()
            }
          } else {
            this.logger.error('Error fetching TBR payment status', {
              error: result.reason,
              chargeBase: transaction.chargeBase,
              transactionId: transaction.id,
              context: LOGGING_CONTEXT,
            })
          }
        }
      } catch (error) {
        this.logger.error('Error updating TBR payment statuses', {
          error: error,
          context: LOGGING_CONTEXT,
        })
      } finally {
        // wait before processing the next chunk to avoid overwhelming TBR service
        await new Promise((resolve) => setTimeout(resolve, this.chunkDelayMs))
      }
    }

    const finishedAt = new Date()
    const duration = finishedAt.getTime() - now.getTime()
    this.logger.info(
      `TBR payment status update job finished in ${duration} ms`,
      {
        timestamp: finishedAt.toISOString(),
        duration: duration,
        context: LOGGING_CONTEXT,
      },
    )
  }
}
