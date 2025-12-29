import { Sequelize } from 'sequelize-typescript'

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
  process.env.LG_SUBSCRIPTION_FEE_CODE || 'RL401'
const SUBSCRIPTION_AMOUNT = parseInt(
  process.env.LG_SUBSCRIPTION_AMOUNT || '4500',
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
    private readonly sequelize: Sequelize,
  ) {
    if (!process.env.LG_TBR_CHARGE_CATEGORY_PERSON) {
      throw new Error('LG_TBR_CHARGE_CATEGORY_PERSON environment variable is required')
    }

    if (!process.env.LG_TBR_CHARGE_CATEGORY_COMPANY) {
      throw new Error('LG_TBR_CHARGE_CATEGORY_COMPANY environment variable is required')
    }
  }

  @OnEvent(LegalGazetteEvents.SUBSCRIBER_CREATED, { suppressErrors: false })
  async createSubscriptionPayment({
    subscriber,
    actorNationalId,
  }: SubscriberCreatedEvent) {
    logger.info('Creating subscription payment for subscriber', {
      subscriberId: subscriber.id,
      nationalId: subscriber.nationalId,
      actorNationalId,
    })

    // Determine charge category based on national ID format
    const isCompany = this.isCompanyNationalId(subscriber.nationalId)
    const chargeCategory = (
      isCompany
        ? process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
        : process.env.LG_TBR_CHARGE_CATEGORY_PERSON
    ) as string

    const chargeBase = subscriber.id

    // Step 1: Create TBR payment request (external API call - outside transaction)
    // This is done first because we can't roll back an external API call
    try {
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
    } catch (error) {
      logger.error('Failed to create TBR payment request', {
        subscriberId: subscriber.id,
        actorNationalId,
        chargeCategory,
        amount: SUBSCRIPTION_AMOUNT,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }

    // Step 2: Database operations wrapped in a transaction
    // If any DB operation fails, the transaction will be rolled back
    try {
      await this.sequelize.transaction(async (transaction) => {
        // Save payment record
        await this.subscriberPaymentModel.create(
          {
            subscriberId: subscriber.id,
            activatedByNationalId: actorNationalId,
            amount: SUBSCRIPTION_AMOUNT,
            chargeBase,
            chargeCategory,
            feeCode: SUBSCRIPTION_FEE_CODE,
            paidAt: null,
          },
          { transaction },
        )

        // Fetch current subscriber to check if subscribedFrom already exists
        const existingSubscriber = await this.subscriberModel.findByPk(
          subscriber.id,
          { transaction },
        )

        // Calculate subscription end date (1 year from now)
        const subscribedTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

        // Build update object - only set subscribedFrom if not already set
        const updateData: {
          isActive: boolean
          subscribedTo: Date
          subscribedFrom?: Date
        } = {
          isActive: true,
          subscribedTo,
        }

        // Only set subscribedFrom if it doesn't exist (preserve original subscription date on renewal)
        if (!existingSubscriber?.subscribedFrom) {
          updateData.subscribedFrom = new Date()
        }

        // Activate the subscriber and set subscription dates
        await this.subscriberModel.update(updateData, {
          where: { id: subscriber.id },
          transaction,
        })

        logger.info('Subscriber activated after payment request', {
          subscriberId: subscriber.id,
          actorNationalId,
          subscribedFrom:
            updateData.subscribedFrom ?? existingSubscriber?.subscribedFrom,
          subscribedTo,
          isRenewal: !updateData.subscribedFrom,
        })
      })
    } catch (error) {
      // Log the DB failure - note that TBR payment was already created
      // This is a critical state that needs manual intervention
      logger.error(
        'CRITICAL: TBR payment created but database update failed. Manual intervention required.',
        {
          subscriberId: subscriber.id,
          actorNationalId,
          chargeCategory,
          chargeBase,
          amount: SUBSCRIPTION_AMOUNT,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      )
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
