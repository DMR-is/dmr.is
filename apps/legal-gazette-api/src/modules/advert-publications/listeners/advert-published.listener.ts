import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { IPriceCalculatorService } from '../../price-calculator/price-calculator.service.interface'
import { ITBRService } from '../../tbr/tbr.service.interface'
import { TBRTransactionModel } from '../../tbr-transaction/tbr-transactions.model'
import { AdvertPublishedEvent } from '../events/advert-published.event'

@Injectable()
export class AdvertPublishedListener {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IPriceCalculatorService)
    private readonly priceCalculatorService: IPriceCalculatorService,

    @Inject(ITBRService) private readonly tbrService: ITBRService,
    @InjectModel(TBRTransactionModel)
    private readonly tbrTransactionModel: typeof TBRTransactionModel,
  ) {}

  @OnEvent('advert.published', { async: true })
  async createTBRTransaction(payload: AdvertPublishedEvent) {
    this.logger.info('Creating TBR transaction for advert', {
      advertId: payload.id,
    })

    const paymentData = await this.priceCalculatorService.getPaymentData(
      payload.id,
    )

    // expenses is treated as an array
    // but we only support one expense per advert for now
    if (paymentData.expenses.length === 0) {
      this.logger.warn(
        'No expenses found for advert, skipping TBR transaction creation',
        { advertId: payload.id },
      )
      return
    }

    const expenses = paymentData.expenses[0]

    await this.tbrService.postPayment(paymentData)

    await this.tbrTransactionModel.create({
      advertId: payload.id,
      feeCodeId: expenses.feeCode,
      feeCodeMultiplier: expenses.quantity,
      totalPrice: expenses.sum,
    })
  }
}
