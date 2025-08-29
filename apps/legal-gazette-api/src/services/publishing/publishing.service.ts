import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { isTodayOrInThePast } from '../../lib/utils'
import {
  AdvertModel,
  AdvertModelScopes,
} from '../../modules/advert/advert.model'

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

    const advertToBePublished = await this.advertModel
      .scope(AdvertModelScopes)
      .findAll()

    if (advertToBePublished.length === 0) {
      this.logger.info('No adverts to be published, skipping job', {
        context: LOGGER_CONTEXT,
      })

      return
    }

    let numberOfSkippedAdverts = 0
    let numberOfPublishedAdverts = 0
    advertToBePublished.forEach(async (advert) => {
      if (!isTodayOrInThePast(advert.scheduledAt)) {
        numberOfSkippedAdverts++
        return
      }

      try {
        await advert.publishAdvert()
        numberOfPublishedAdverts++
      } catch (error) {
        this.logger.error(`Failed to publish advert with ID ${advert.id}`, {
          context: LOGGER_CONTEXT,
          error: error,
          advertId: advert.id,
          timestamp: new Date().toISOString(),
        })
        numberOfSkippedAdverts++
      }
    })

    this.logger.info(
      `Publishing task completed: ${numberOfPublishedAdverts} adverts published, ${numberOfSkippedAdverts} adverts skipped`,
      {
        skipped: numberOfSkippedAdverts,
        published: numberOfPublishedAdverts,
        context: LOGGER_CONTEXT,
        timestamp: new Date().toISOString(),
      },
    )
  }
}
