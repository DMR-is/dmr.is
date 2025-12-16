import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'

import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import { ISubscriberService } from './subscriber.service.interface'

@Injectable()
export class SubscriberService implements ISubscriberService {
  constructor(
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
  ) {}

  async createSubscriber(user: DMRUser): Promise<SubscriberDto> {
    const subscriber = await this.subscriberModel.create({
      nationalId: user.nationalId,
      name: user.name || null,
      isActive: false,
    })
    return subscriber.fromModel()
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
}
