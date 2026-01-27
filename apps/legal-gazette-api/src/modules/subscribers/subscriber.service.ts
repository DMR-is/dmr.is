import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../core/constants'
import { MutationResponse } from '../../core/dto/mutation.do'
import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import { PgAdvisoryLockService } from '../advert/tasks/lock.service'
import { SubscriberCreatedEvent } from './events/subscriber-created.event'
import { ISubscriberService } from './subscriber.service.interface'

const LOGGING_CONTEXT = 'SubscriberService'
@Injectable()
export class SubscriberService implements ISubscriberService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,

    private readonly eventEmitter: EventEmitter2,

    private readonly lock: PgAdvisoryLockService,
  ) {}

  private async handleSubscriptionExpiry(
    subscriber: SubscriberDto,
  ): Promise<SubscriberDto> {
    if (!subscriber.subscribedTo) {
      return subscriber
    }
    const now = new Date()
    const subscriptionExpiry = new Date(subscriber.subscribedTo)

    if (subscriptionExpiry.valueOf() < now.valueOf()) {
      this.logger.info('Subscriber subscription has expired', {
        subscriberId: subscriber.id,
        subscribedTo: subscriber.subscribedTo,
        context: LOGGING_CONTEXT,
      })
      // Subscription has expired, update subscriber
      const updatedSubscriber = await this.subscriberModel.update(
        { isActive: false, subscribedTo: null },
        { where: { id: subscriber.id }, returning: true },
      )
      return updatedSubscriber[1][0].fromModel()
    }
    return subscriber
  }

  async getUserByNationalId(user: DMRUser): Promise<SubscriberDto> {
    // Check existing subscriber
    const [subscriber] = await this.subscriberModel.findOrCreate({
      where: { nationalId: user.nationalId },
      defaults: {
        nationalId: user.nationalId,
        name: user.name || null,
        isActive: false,
      },
    })

    return this.handleSubscriptionExpiry(subscriber.fromModel())
  }
  async createSubscriptionForUser(user: DMRUser): Promise<MutationResponse> {
    // Use per-user lock to prevent race conditions (double-click, concurrent requests)
    const lockResult = await this.lock.runWithUserLock(
      user.nationalId,
      async (tx) => {
        const subscriber = await this.subscriberModel.findOneOrThrow(
          {
            where: { nationalId: user.nationalId },
            transaction: tx,
          },
          'Subscriber not found when creating subscription',
        )

        // Check if subscription is already active and not expired (idempotency check)
        if (subscriber.isActive && subscriber.subscribedTo) {
          const expiryDate = new Date(subscriber.subscribedTo)
          if (expiryDate > new Date()) {
            this.logger.info('Subscription already active, skipping payment', {
              category: 'subscriber-service',
              context: LOGGING_CONTEXT,
              subscriberId: subscriber.id,
              expiresAt: subscriber.subscribedTo,
            })
            return { success: true }
          }
        }

        // Determine the actor nationalId - use actor if exists (delegation), otherwise user
        const actorNationalId = user.actor?.nationalId ?? user.nationalId

        // Emit event for payment processing and WAIT for it to complete
        // emitAsync returns a Promise that resolves when all listeners complete
        // If any listener throws, the error propagates here (requires suppressErrors: false on listener)
        await this.eventEmitter.emitAsync(
          LegalGazetteEvents.SUBSCRIBER_CREATED,
          {
            subscriber: subscriber.fromModel(),
            actorNationalId,
          } as SubscriberCreatedEvent,
        )

        return { success: true }
      },
    )

    // Handle lock acquisition failure (concurrent request for same user)
    if (!lockResult.success) {
      this.logger.info('Subscription request blocked by concurrent request', {
        category: 'subscriber-service',
        context: LOGGING_CONTEXT,
        nationalId: user.nationalId,
        reason: lockResult.reason,
      })
      // Return success since another request is already processing
      return { success: true }
    }

    return lockResult.result
  }
}
