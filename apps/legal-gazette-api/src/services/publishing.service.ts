import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../modules/advert/advert.model'

const LOGGER_CONTEXT = 'PublishingService'

@Injectable()
export class PublishingService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async publishAdverts() {
    const now = new Date()

    this.logger.info(`Running publishing task at ${now.toISOString()}`, {
      context: LOGGER_CONTEXT,
      timestamp: now.toISOString(),
    })

    const advertToBePublished = await this.advertModel
      .scope('toBePublished')
      .findAll()

    if (advertToBePublished.length === 0) {
      this.logger.info('No adverts to be published, skipping job', {
        context: LOGGER_CONTEXT,
      })

      return
    }

    advertToBePublished.forEach(async (advert) => {
      await advert.publishAdvert()
    })
  }
}
