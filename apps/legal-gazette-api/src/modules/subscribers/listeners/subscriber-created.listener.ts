import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { getLogger } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../core/constants'
import { SubscriberModel } from '../../../models/subscriber.model'
import { SubscriberPaymentModel } from '../../../models/subscriber-payment.model'
import { ITBRService } from '../../tbr/tbr.service.interface'
import { SubscriberCreatedEvent } from '../events/subscriber-created.event'

const logger = getLogger('SubscriberCreatedListener')

const SUBSCRIPTION_FEE_CODE =
  process.env.LG_SUBSCRIPTION_FEE_CODE || 'SUBSCRIPTION_FEE'
const SUBSCRIPTION_AMOUNT = parseInt(
  process.env.LG_SUBSCRIPTION_AMOUNT || '3000',
  10,
)

@Injectable()
export class SubscriberCreatedListener {
  constructor(
    @Inject(ITBRService) private readonly tbrService: ITBRService,
    @InjectModel(SubscriberPaymentModel)
    private readonly subscriberPaymentModel: typeof SubscriberPaymentModel,
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
  ) {
    if (!process.env.LG_TBR_CHARGE_CATEGORY_PERSON) {
      throw new Error('LG_TBR_CHARGE_CATEGORY_PERSON environment variable is required')
    }

    if (!process.env.LG_TBR_CHARGE_CATEGORY_COMPANY) {
      throw new Error('LG_TBR_CHARGE_CATEGORY_COMPANY environment variable is required')
    }
  }

  @OnEvent(LegalGazetteEvents.SUBSCRIBER_CREATED, { async: true })
  async createSubscriptionPayment({
    subscriber,
    isLegacyMigration,
  }: SubscriberCreatedEvent) {
    // Skip payment for legacy migrations (they already paid)
    if (isLegacyMigration) {
      logger.info('Skipping payment for legacy migration', {
        subscriberId: subscriber.id,
      })
      return
    }

    logger.info('Creating subscription payment for new subscriber', {
      subscriberId: subscriber.id,
      nationalId: subscriber.nationalId,
    })

    try {
      // Determine charge category based on national ID format
      // Icelandic personal IDs are 10 digits, company IDs start with certain patterns
      const isCompany = this.isCompanyNationalId(subscriber.nationalId)
      const chargeCategory = (
        isCompany
          ? process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
          : process.env.LG_TBR_CHARGE_CATEGORY_PERSON
      ) as string

      const chargeBase = subscriber.id

      // Create TBR payment request
      await this.tbrService.postPayment({
        advertId: subscriber.id, // Using subscriberId as unique identifier
        chargeCategory,
        chargeBase,
        debtorNationalId: subscriber.nationalId,
        expenses: [
          {
            feeCode: SUBSCRIPTION_FEE_CODE,
            reference: `Áskrift - ${subscriber.nationalId}`,
            quantity: 1,
            unitPrice: SUBSCRIPTION_AMOUNT,
            sum: SUBSCRIPTION_AMOUNT,
          },
        ],
      })

      logger.info('TBR payment request created successfully', {
        subscriberId: subscriber.id,
        amount: SUBSCRIPTION_AMOUNT,
      })

      // Save payment record
      await this.subscriberPaymentModel.create({
        subscriberId: subscriber.id,
        amount: SUBSCRIPTION_AMOUNT,
        chargeBase,
        chargeCategory,
        feeCode: SUBSCRIPTION_FEE_CODE,
        paidAt: null,
      })

      // Activate the subscriber and set subscription date
      await this.subscriberModel.update(
        { isActive: true, subscribedAt: new Date() },
        { where: { id: subscriber.id } },
      )

      logger.info('Subscriber activated after payment request', {
        subscriberId: subscriber.id,
        subscribedAt: new Date(),
      })
    } catch (error) {
      logger.error('Failed to create subscription payment', {
        subscriberId: subscriber.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Check if a national ID belongs to a company
   * Icelandic company IDs typically start with 4-9
   * Personal IDs typically start with 0-3 (birth date format)
   */
  private isCompanyNationalId(nationalId: string): boolean {
    if (!nationalId || nationalId.length !== 10) {
      return false
    }
    const firstDigit = parseInt(nationalId.charAt(0), 10)
    return firstDigit >= 4
  }
}
