import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import { Op, WhereOptions } from 'sequelize'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { GetPaymentsDto, GetPaymentsQuery } from '../../core/dto/payments.dto'
import { TBRTransactionModel } from '../../models/tbr-transactions.model'
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
  async getPaymentByTransactionId(transactionId: string): Promise<void> {
    const transaction =
      await this.tbrTransactionModel.findByPkOrThrow(transactionId)

    const tbrPaymentInfo = await this.tbrService.getPaymentStatus({
      chargeCategory: transaction.chargeCategory,
      chargeBase: transaction.chargeBase,
      debtorNationalId: transaction.debtorNationalId,
    })
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
