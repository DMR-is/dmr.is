import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'

import {
  SubscriberDto,
  SubscriberModel,
} from '../../models/subscriber.model'
import { ISubscriberService } from './subscriber.service.interface'

@Injectable()
export class SubscriberService implements ISubscriberService {
  constructor(
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
  ) {}

  async createSubscriber(user: DMRUser): Promise<SubscriberDto> {
    const firstName = user.name?.split(' ')[0] || ''
    const lastName = user.name?.split(' ').slice(1).join(' ') || ''
    const subscriber = await this.subscriberModel.create({
      nationalId: user.nationalId,
      firstName,
      lastName,
      isActive: false,
    })
    return subscriber.fromModel()
  }

  async getUserByNationalId(user: DMRUser): Promise<SubscriberDto> {
    const subscriber = await this.subscriberModel.findOne({
      where: { nationalId: user.nationalId },
    })

    if (!subscriber) {
      const newSubscriber = await this.createSubscriber(user)

      if (!newSubscriber) {
        throw new NotFoundException(
          `Subscriber not found and could not be created.`,
        )
      }

      return newSubscriber
    }

    return subscriber.fromModel()
  }
}
