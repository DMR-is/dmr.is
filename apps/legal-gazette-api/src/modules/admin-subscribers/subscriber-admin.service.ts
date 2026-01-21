import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { PagingQuery } from '@dmr.is/shared/dto'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import {
  CreateSubscriberAdminDto,
  GetSubscribersWithPagingResponse,
  SubscriberDto,
  SubscriberModel,
  UpdateSubscriberEndDateDto,
} from '../../models/subscriber.model'
import { LGNationalRegistryService } from '../national-registry/national-registry.service'
import { ILGNationalRegistryService } from '../national-registry/national-registry.service.interface'
import { ISubscriberAdminService } from './subscriber-admin.service.interface'

const LOGGING_CONTEXT = 'SubscriberAdminService'

@Injectable()
export class SubscriberAdminService implements ISubscriberAdminService {
  constructor(
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ILGNationalRegistryService)
    private readonly nationalRegistryService: LGNationalRegistryService,
  ) {}

  private async findSubscriberOrThrow(subscriberId: string): Promise<SubscriberModel> {
    const subscriber = await this.subscriberModel.findByPk(subscriberId)
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found')
    }
    return subscriber
  }

  async getSubscribers(
    query: PagingQuery,
    includeInactive?: boolean,
  ): Promise<GetSubscribersWithPagingResponse> {
    const { limit, offset } = getLimitAndOffset(query)

    const whereClause = includeInactive ? {} : { isActive: true }

    const subscribersResults = await this.subscriberModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']],
    })

    const subscribers = subscribersResults.rows.map((subscriber) =>
      subscriber.fromModel(),
    )

    const paging = generatePaging(
      subscribersResults.rows,
      query.page,
      query.pageSize,
      subscribersResults.count,
    )

    return {
      subscribers,
      paging,
    }
  }

  async createSubscriber(
    body: CreateSubscriberAdminDto,
    user: DMRUser,
  ): Promise<SubscriberDto> {
    const existingSubscriber = await this.subscriberModel.findOne({
      where: { nationalId: body.nationalId },
    })

    if (existingSubscriber) {
      this.logger.warn('Subscriber already exists with given national ID', {
        nationalId: body.nationalId,
        context: LOGGING_CONTEXT,
      })
      throw new BadRequestException(
        'Subscriber already exists with given national ID',
      )
    }

    const subscribedTo = new Date(body.subscribedTo)
    if (subscribedTo < new Date()) {
      throw new BadRequestException('Subscription end date cannot be in the past')
    }

    const { entity } = await this.nationalRegistryService.getEntityByNationalId(
      body.nationalId,
    )

    if (!entity) {
      this.logger.warn('No entity found with nationalId', {
        context: LOGGING_CONTEXT,
      })
      throw new BadRequestException('No entity found with given nationalId')
    }

    const name = entity.nafn

    const newSubscriber = await this.subscriberModel.create({
      nationalId: body.nationalId,
      name: name,
      email: body.email ?? null,
      isActive: true,
      subscribedFrom: new Date(),
      subscribedTo: subscribedTo,
    })

    this.logger.info('Subscriber created by admin', {
      createdByAdminUserId: user.adminUserId,
      newSubscriberId: newSubscriber.id,
      context: LOGGING_CONTEXT,
    })

    return newSubscriber.fromModel()
  }

  async updateSubscriberEndDate(
    subscriberId: string,
    body: UpdateSubscriberEndDateDto,
    user: DMRUser,
  ): Promise<SubscriberDto> {
    const subscriber = await this.findSubscriberOrThrow(subscriberId)

    const subscribedTo = new Date(body.subscribedTo)
    if (subscriber.subscribedFrom && subscribedTo < subscriber.subscribedFrom) {
      throw new BadRequestException('Subscription end date cannot be before start date')
    }

    await subscriber.update({
      subscribedTo: subscribedTo,
    })

    this.logger.info('Subscriber end date updated by admin', {
      updatedByAdminUserId: user.adminUserId,
      subscriberId: subscriberId,
      newEndDate: body.subscribedTo,
      context: LOGGING_CONTEXT,
    })

    return subscriber.fromModel()
  }

  async deactivateSubscriber(subscriberId: string, user: DMRUser): Promise<void> {
    const subscriber = await this.findSubscriberOrThrow(subscriberId)

    await subscriber.update({
      isActive: false,
    })

    this.logger.info('Subscriber deactivated by admin', {
      deactivatedByAdminUserId: user.adminUserId,
      subscriberId: subscriberId,
      context: LOGGING_CONTEXT,
    })
  }

  async activateSubscriber(
    subscriberId: string,
    user: DMRUser,
  ): Promise<SubscriberDto> {
    const subscriber = await this.findSubscriberOrThrow(subscriberId)

    await subscriber.update({
      isActive: true,
    })

    this.logger.info('Subscriber activated by admin', {
      activatedByAdminUserId: user.adminUserId,
      subscriberId: subscriberId,
      context: LOGGING_CONTEXT,
    })

    return subscriber.fromModel()
  }
}
