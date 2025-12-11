import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { getLogger } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../core/constants'
import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import { ILegacyMigrationService } from '../legacy-migration/legacy-migration.service.interface'
import { SubscriberCreatedEvent } from './events/subscriber-created.event'
import { ISubscriberService } from './subscriber.service.interface'

const logger = getLogger('SubscriberService')

@Injectable()
export class SubscriberService implements ISubscriberService {
  constructor(
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
    @Inject(ILegacyMigrationService)
    private readonly legacyMigrationService: ILegacyMigrationService,
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
    // 1. Check existing subscriber
    const subscriber = await this.subscriberModel.findOne({
      where: { nationalId: user.nationalId },
    })

    if (subscriber) {
      return subscriber.fromModel()
    }

    // 2. Check for auto-migratable legacy user (has kennitala)
    try {
      const migratedSubscriber =
        await this.legacyMigrationService.autoMigrateByKennitala(user)

      if (migratedSubscriber) {
        logger.info('Auto-migrated legacy subscriber', {
          nationalId: user.nationalId,
        })

        // Emit event for legacy migration (no payment needed)
        this.eventEmitter.emit(LegalGazetteEvents.SUBSCRIBER_CREATED, {
          subscriber: migratedSubscriber,
          isLegacyMigration: true,
        } as SubscriberCreatedEvent)

        return migratedSubscriber
      }
    } catch (error) {
      // Log but don't fail - continue to create new subscriber
      logger.warn('Auto-migration check failed', {
        nationalId: user.nationalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // 3. Create new inactive subscriber
    const newSubscriber = await this.createSubscriber(user)

    if (!newSubscriber) {
      throw new NotFoundException(
        `Subscriber not found and could not be created.`,
      )
    }

    return newSubscriber
  }
}
