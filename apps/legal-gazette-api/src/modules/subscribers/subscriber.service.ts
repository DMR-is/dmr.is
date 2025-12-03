import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'

import { LegalGazetteEvents } from '../../core/constants'
import { MutationResponse } from '../../core/dto/mutation.do'
import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import { SubscriberCreatedEvent } from './events/subscriber-created.event'
import { ISubscriberService } from './subscriber.service.interface'

@Injectable()
export class SubscriberService implements ISubscriberService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createSubscriber(user: DMRUser): Promise<SubscriberDto> {
    const subscriber = await this.subscriberModel.create({
      nationalId: user.nationalId,
      name: user.name || null,
      isActive: false,
    })

    const subscriberDto = subscriber.fromModel()

    // Emit event for payment processing
    this.eventEmitter.emit(LegalGazetteEvents.SUBSCRIBER_CREATED, {
      subscriber: subscriberDto,
      isLegacyMigration: false,
    } as SubscriberCreatedEvent)

    return subscriberDto
  }

  async getUserByNationalId(user: DMRUser): Promise<SubscriberDto> {
    // Check existing subscriber
    const subscriber = await this.subscriberModel.findOne({
      where: { nationalId: user.nationalId },
    })

    if (subscriber) {
      return subscriber.fromModel()
    }

    // Create new inactive subscriber
    const newSubscriber = await this.createSubscriber(user)

    if (!newSubscriber) {
      throw new NotFoundException(
        `Subscriber not found and could not be created.`,
      )
    }

    return newSubscriber
  }
  async createSubscriptionForUser(user: DMRUser): Promise<MutationResponse> {
    const subscriber = await this.subscriberModel.findOne({
      where: { nationalId: user.nationalId },
    })

    if (!subscriber) {
      throw new NotFoundException(
        `Subscriber with nationalId ${user.nationalId} not found.`,
      )
    }

    try {
      // Set isActive true and subscribedTo date 1 year from now
      // Set subscribedFrom if not already set
      subscriber.isActive = true
      subscriber.subscribedTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      if (!subscriber.subscribedFrom) {
        subscriber.subscribedFrom = new Date()
      }
      await subscriber.save()

      return { success: true }
    } catch (error) {
      this.logger.error('Error creating subscription', {
        error: error,
        category: 'subscriber-service',
      })
      return { success: false }
    }
  }
}
