import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils-server/serverUtils'

import {
  GetPaymentsDto,
  GetPaymentsQuery,
  SyncPaymentsResponseDto,
} from '../../core/dto/payments.dto'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
} from '../../models/tbr-transactions.model'
import { TBRGetPaymentResponseDto } from '../tbr/tbr.dto'
import { TBRService } from '../tbr/tbr.service'
import { ITBRService } from '../tbr/tbr.service.interface'
import { IPaymentsService } from './payments.service.interface'

export const LOGGING_CONTEXT = 'PaymentsService'

@Injectable()
export class PaymentsService implements IPaymentsService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ITBRService) private readonly tbrService: TBRService,
    @InjectModel(TBRTransactionModel)
    private readonly tbrTransactionModel: typeof TBRTransactionModel,
  ) {}

  async getPaymentByTransactionId(
    transactionId: string,
  ): Promise<TBRGetPaymentResponseDto> {
    const transaction =
      await this.tbrTransactionModel.findByPkOrThrow(transactionId)

    const paymentData = await this.tbrService.getPaymentStatus({
      chargeCategory: transaction.chargeCategory,
      chargeBase: transaction.chargeBase,
      debtorNationalId: transaction.debtorNationalId,
    })

    if (paymentData.paid && transaction.status !== TBRTransactionStatus.PAID) {
      this.logger.info('TBR payment completed, updating transaction', {
        chargeBase: transaction.chargeBase,
        transactionId: transaction.id,
        context: LOGGING_CONTEXT,
      })
      transaction.status = TBRTransactionStatus.PAID
      transaction.paidAt = new Date()
      await transaction.save()
    }
    return paymentData
  }

  async syncPayments(): Promise<SyncPaymentsResponseDto> {
    this.logger.info('Starting manual TBR payment sync', {
      context: LOGGING_CONTEXT,
    })

    const pendingTransactions = await this.tbrTransactionModel.findAll({
      where: {
        paidAt: { [Op.eq]: null },
        status: TBRTransactionStatus.CREATED,
      },
    })

    if (pendingTransactions.length === 0) {
      this.logger.info('No pending TBR payments found', {
        context: LOGGING_CONTEXT,
      })
      return { processed: 0, updated: 0, failed: 0 }
    }

    this.logger.info(
      `Found ${pendingTransactions.length} pending transactions`,
      {
        context: LOGGING_CONTEXT,
      },
    )

    let updated = 0
    let failed = 0

    const promises = pendingTransactions.map((transaction, i) =>
      this.tbrService.getPaymentStatus({
        chargeBase: transaction.chargeBase,
        chargeCategory: transaction.chargeCategory,
        debtorNationalId: transaction.debtorNationalId,
      }, i),
    )

    const results = await Promise.allSettled(promises)

    for (const [i, result] of results.entries()) {
      const transaction = pendingTransactions[i]
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
          updated++
        } else if (paymentData.canceled) {
          this.logger.info('TBR payment canceled, updating transaction', {
            chargeBase: transaction.chargeBase,
            transactionId: transaction.id,
            context: LOGGING_CONTEXT,
          })
          transaction.status = TBRTransactionStatus.CANCELED
          await transaction.save()
          updated++
        }
      } else {
        this.logger.error('Error fetching TBR payment status', {
          error: result.reason,
          chargeBase: transaction.chargeBase,
          transactionId: transaction.id,
          context: LOGGING_CONTEXT,
        })
        failed++
      }
    }

    this.logger.info('Manual TBR payment sync completed', {
      processed: pendingTransactions.length,
      updated,
      failed,
      context: LOGGING_CONTEXT,
    })

    return {
      processed: pendingTransactions.length,
      updated,
      failed,
    }
  }

  async getPayments(query: GetPaymentsQuery): Promise<GetPaymentsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const where: WhereOptions<TBRTransactionModel> = {}

    if (query.dateFrom && query.dateTo) {
      where.createdAt = {
        [Op.between]: [
          startOfDay(new Date(query.dateFrom)),
          endOfDay(new Date(query.dateTo)),
        ],
      }
    } else if (query.dateFrom) {
      where.createdAt = { [Op.gte]: startOfDay(new Date(query.dateFrom)) }
    } else if (query.dateTo) {
      where.createdAt = { [Op.lte]: endOfDay(new Date(query.dateTo)) }
    }

    if (query.type) {
      where.transactionType = query.type
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.paid !== undefined) {
      where.paidAt = query.paid ? { [Op.ne]: null } : { [Op.eq]: null }
    }

    const transactions = await this.tbrTransactionModel.findAndCountAll({
      where: where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    })

    const payments = transactions.rows.map((transaction) =>
      transaction.fromModelToPaymentDto(),
    )

    const paging = generatePaging(
      transactions.rows,
      query.page,
      query.pageSize,
      transactions.count,
    )

    return { payments, paging }
  }
}
