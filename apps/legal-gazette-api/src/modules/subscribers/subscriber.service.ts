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

    return subscriber.fromModel()
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
      // Determine the actor nationalId - use actor if exists (delegation), otherwise user
      const actorNationalId = user.actor?.nationalId ?? user.nationalId

      // Emit event for payment processing
      // Activation happens in listener after successful TBR payment
      this.eventEmitter.emit(LegalGazetteEvents.SUBSCRIBER_CREATED, {
        subscriber: subscriber.fromModel(),
        actorNationalId,
      } as SubscriberCreatedEvent)

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
