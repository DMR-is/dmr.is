import Kennitala from 'kennitala'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { getLogger } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../core/constants'
import { SubscriberModel } from '../../../models/subscriber.model'
import {
  SubscriberPaymentModel,
  SubscriberPaymentStatus,
} from '../../../models/subscriber-payment.model'
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
    const isCompany = Kennitala.isCompany(subscriber.nationalId)
    const chargeCategory = (
      isCompany
        ? process.env.LG_TBR_CHARGE_CATEGORY_COMPANY
        : process.env.LG_TBR_CHARGE_CATEGORY_PERSON
    ) as string

    const chargeBase = subscriber.id

    // C-4 Fix: Create PENDING payment record BEFORE calling TBR API
    // This ensures we have a record of the payment attempt even if TBR succeeds
    // but subsequent database operations fail (prevents orphaned TBR claims)
    let paymentRecord: SubscriberPaymentModel
    try {
      paymentRecord = await this.sequelize.transaction(async (transaction) => {
        return this.subscriberPaymentModel.create(
          {
            subscriberId: subscriber.id,
            activatedByNationalId: actorNationalId,
            amount: SUBSCRIPTION_AMOUNT,
            chargeBase,
            chargeCategory,
            feeCode: SUBSCRIPTION_FEE_CODE,
            paidAt: null,
            status: SubscriberPaymentStatus.PENDING,
          },
          { transaction },
        )
      })

      logger.info('Created PENDING payment record before TBR call', {
        paymentId: paymentRecord.id,
        subscriberId: subscriber.id,
      })
    } catch (error) {
      logger.error('Failed to create PENDING payment record', {
        subscriberId: subscriber.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }

    // Step 2: Call TBR API (external call - cannot be rolled back)
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
        paymentId: paymentRecord.id,
        amount: SUBSCRIPTION_AMOUNT,
      })

      // Update payment record to CONFIRMED after successful TBR call
      await this.sequelize.transaction(async (transaction) => {
        await paymentRecord.update(
          { status: SubscriberPaymentStatus.CREATED },
          { transaction },
        )
      })

      logger.info('Payment record updated to CREATED', {
        paymentId: paymentRecord.id,
      })
    } catch (error) {
      // TBR call failed - update payment record to FAILED
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      logger.error('TBR payment request failed, marking payment as FAILED', {
        subscriberId: subscriber.id,
        paymentId: paymentRecord.id,
        error: errorMessage,
      })

      try {
        await this.sequelize.transaction(async (transaction) => {
          await paymentRecord.update(
            {
              status: SubscriberPaymentStatus.FAILED,
              tbrError: errorMessage,
            },
            { transaction },
          )
        })
      } catch (updateError) {
        logger.error('Failed to update payment record to FAILED status', {
          paymentId: paymentRecord.id,
          originalError: errorMessage,
          updateError:
            updateError instanceof Error
              ? updateError.message
              : 'Unknown error',
        })
      }

      throw error
    }

    // Step 3: Activate subscriber (only after TBR success and payment confirmed)
    try {
      await this.sequelize.transaction(async (transaction) => {

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
}
