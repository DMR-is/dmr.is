import Kennitala from 'kennitala'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { getLogger } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../core/constants'
import { FeeCodeModel } from '../../../models/fee-code.model'
import { SubscriberModel } from '../../../models/subscriber.model'
import { SubscriberTransactionModel } from '../../../models/subscriber-transaction.model'
import {
  TBRTransactionModel,
  TBRTransactionStatus,
  TBRTransactionType,
} from '../../../models/tbr-transactions.model'
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
    @InjectModel(TBRTransactionModel)
    private readonly tbrTransactionModel: typeof TBRTransactionModel,
    @InjectModel(SubscriberTransactionModel)
    private readonly subscriberTransactionModel: typeof SubscriberTransactionModel,
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
    @InjectModel(FeeCodeModel)
    private readonly feeCodeModel: typeof FeeCodeModel,
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

    // Look up fee code ID for subscriptions
    const feeCode = await this.feeCodeModel.findOne({
      where: { feeCode: SUBSCRIPTION_FEE_CODE },
    })

    if (!feeCode) {
      logger.error('Subscription fee code not found', {
        feeCode: SUBSCRIPTION_FEE_CODE,
      })
      throw new Error(`Fee code ${SUBSCRIPTION_FEE_CODE} not found`)
    }

    // C-4 Fix: Create PENDING transaction record BEFORE calling TBR API
    // This ensures we have a record of the payment attempt even if TBR succeeds
    // but subsequent database operations fail (prevents orphaned TBR claims)
    let transactionRecord: TBRTransactionModel
    try {
      transactionRecord = await this.sequelize.transaction(async (transaction) => {
        // Mark any existing current transactions as not current
        await this.subscriberTransactionModel.update(
          { isCurrent: false },
          {
            where: { subscriberId: subscriber.id, isCurrent: true },
            transaction,
          },
        )

        // Create the TBR transaction record
        const tbrTransaction = await this.tbrTransactionModel.create(
          {
            transactionType: TBRTransactionType.SUBSCRIPTION,
            feeCodeId: feeCode.id,
            feeCodeMultiplier: 1,
            totalPrice: SUBSCRIPTION_AMOUNT,
            chargeBase,
            chargeCategory,
            debtorNationalId: subscriber.nationalId,
            status: TBRTransactionStatus.PENDING,
          },
          { transaction },
        )

        // Create the subscriber-transaction junction record
        await this.subscriberTransactionModel.create(
          {
            subscriberId: subscriber.id,
            transactionId: tbrTransaction.id,
            activatedByNationalId: actorNationalId,
            isCurrent: true,
          },
          { transaction },
        )

        return tbrTransaction
      })

      logger.info('Created PENDING transaction record before TBR call', {
        transactionId: transactionRecord.id,
        subscriberId: subscriber.id,
      })
    } catch (error) {
      logger.error('Failed to create PENDING transaction record', {
        subscriberId: subscriber.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }

    // Step 2: Call TBR API (external call - cannot be rolled back)
    try {
      await this.tbrService.postPayment({
        id: subscriber.id, // Using subscriberId as unique identifier
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
        transactionId: transactionRecord.id,
        amount: SUBSCRIPTION_AMOUNT,
      })

      // Update transaction record to CREATED after successful TBR call
      await this.sequelize.transaction(async (transaction) => {
        await transactionRecord.update(
          { status: TBRTransactionStatus.CREATED },
          { transaction },
        )
      })

      logger.info('Transaction record updated to CREATED', {
        transactionId: transactionRecord.id,
      })
    } catch (error) {
      // TBR call failed - update transaction record to FAILED
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      logger.error('TBR payment request failed, marking transaction as FAILED', {
        subscriberId: subscriber.id,
        transactionId: transactionRecord.id,
        error: errorMessage,
      })

      try {
        await this.sequelize.transaction(async (transaction) => {
          await transactionRecord.update(
            {
              status: TBRTransactionStatus.FAILED,
              tbrError: errorMessage,
            },
            { transaction },
          )
        })
      } catch (updateError) {
        logger.error('Failed to update transaction record to FAILED status', {
          transactionId: transactionRecord.id,
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
