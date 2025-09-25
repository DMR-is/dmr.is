import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertVersionEnum } from '../../advert/advert.model'
import { IPriceCalculatorService } from '../../price-calculator/price-calculator.service.interface'
import { ITBRService } from '../../tbr/tbr.service.interface'
import { TBRTransactionModel } from '../../tbr-transaction/tbr-transactions.model'
import { AdvertPublishedEvent } from '../events/advert-published.event'

const LOGGING_CONTEXT = 'AdvertPublishedListener'

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
    if (payload.version !== AdvertVersionEnum.A) return

    this.logger.info('Creating TBR transaction for advert', {
      advertId: payload.id,
      context: LOGGING_CONTEXT,
    })

    const { feeCodeId, paymentData } =
      await this.priceCalculatorService.getPaymentData(payload.id)

    // expenses is treated as an array
    // but we only support one expense per advert for now
    if (paymentData.expenses.length === 0) {
      this.logger.warn(
        'No expenses found for advert, skipping TBR transaction creation',
        { advertId: payload.id, context: LOGGING_CONTEXT },
      )
      return
    }

    const expenses = paymentData.expenses[0]

    await this.tbrService.postPayment(paymentData)

    this.logger.info('TBR payment posted, creating transaction', {
      advertId: payload.id,
      context: LOGGING_CONTEXT,
    })

    await this.tbrTransactionModel.create({
      advertId: payload.id,
      feeCodeId: feeCodeId,
      feeCodeMultiplier: expenses.quantity,
      totalPrice: expenses.sum,
    })
  }

  @OnEvent('advert.published')
  sendEmailNotification(payload: AdvertPublishedEvent) {
    this.logger.info('Sending email notification for advert', {
      advertId: payload.id,
      version: payload.version,
      context: LOGGING_CONTEXT,
    })
  }
}
