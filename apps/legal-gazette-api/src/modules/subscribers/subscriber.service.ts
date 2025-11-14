import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import { ISubscriberService } from './subscriber.service.interface'

@Injectable()
export class SubscriberService implements ISubscriberService {
  constructor(
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
  ) {}

  async getUserByNationalId(nationalId: string): Promise<SubscriberDto> {
    const subscriber = await this.subscriberModel.findOne({
      where: { nationalId },
    })

    if (!subscriber) {
      throw new NotFoundException(`Subscriber not found`)
    }

    return subscriber.fromModel()
  }
}
