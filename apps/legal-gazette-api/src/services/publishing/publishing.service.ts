import { Inject, Injectable, NotImplementedException } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../../modules/advert/advert.model'

const LOGGER_CONTEXT = 'PublishingService'

@Injectable()
export class PublishingService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async publishTask() {
    const now = new Date()

    this.logger.info(`Running publishing task at ${now.toISOString()}`, {
      context: LOGGER_CONTEXT,
      timestamp: now.toISOString(),
    })

    throw new NotImplementedException()
  }
}
