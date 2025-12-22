import { isEmpty } from 'class-validator'
import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents, TASK_JOB_IDS } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../../models/status.model'
import { AdvertPublishedEvent } from '../../publications/events/advert-published.event'
import { PgAdvisoryLockService } from '../lock.service'
import { IPublishingTaskService } from './publishing.task.interface'

const LOGGER_CONTEXT = 'PublishingTaskService'

@Injectable()
export class PublishingTaskService implements IPublishingTaskService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(AdvertPublicationModel)
    private readonly publicationModel: typeof AdvertPublicationModel,
    private sequelize: Sequelize,
    private readonly eventEmitter: EventEmitter2,
    private readonly lock: PgAdvisoryLockService,
  ) {}

  private async getNextPublicationNumber(
    pubDate: Date,
    transaction: Transaction,
  ): Promise<string> {
    const year = pubDate.getFullYear()
    const month = (pubDate.getMonth() + 1).toString().padStart(2, '0')
    const day = pubDate.getDate().toString().padStart(2, '0')
    const maxPublication = await this.advertModel.findOne({
      attributes: ['id', 'publicationNumber'],
      where: {
        publicationNumber: {
          [Op.like]: `${year}${month}${day}%`,
        },
      },
      order: [['publicationNumber', 'DESC']],
      limit: 1,
      transaction: transaction,
    })

    let count = 1

    if (maxPublication?.publicationNumber) {
      count = parseInt(maxPublication.publicationNumber.slice(8), 11) + 1
    }

    const publicationNumber = `${year}${month}${day}${count.toString().padStart(3, '0')}`

    this.logger.debug(
      `Generated next publication number: ${publicationNumber}`,
      {
        context: LOGGER_CONTEXT,
        publicationNumber,
      },
    )
    return publicationNumber
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'publishing-job',
  })
  async run() {
    const { ran } = await this.lock.runWithSessionLock(
      TASK_JOB_IDS.publishing,
      async () => {
        await this.publishAdverts()
      },
      { minHoldMs: 5000 },
    )

    if (!ran)
      this.logger.debug(
        'PublishingTask skipped (lock held by another container)',
      )
  }

  async publishAdverts(): Promise<void> {
    const now = new Date()

    this.logger.info(`Running publishing task at ${now.toISOString()}`, {
      context: LOGGER_CONTEXT,
      timestamp: now.toISOString(),
    })

    const start = now.setHours(0, 0, 0, 0)
    const end = now.setHours(23, 59, 59, 999)

    const publicationsToBePublished = await this.publicationModel.findAll({
      where: {
        publishedAt: { [Op.is]: null },
        scheduledAt: {
          [Op.gte]: start,
          [Op.lte]: end,
        },
      },
    })

    if (publicationsToBePublished.length === 0) {
      this.logger.info(
        'No publications to be published at this time, skipping job',
        {
          context: LOGGER_CONTEXT,
        },
      )
      return
    }

    this.logger.info(
      `Found ${publicationsToBePublished.length} publications to be published`,
      {
        context: LOGGER_CONTEXT,
      },
    )

    const advert = await this.advertModel.scope('detailed').findOne({
      where: { id: publicationsToBePublished[0]?.advertId },
    })

    if (!advert) {
      this.logger.warn(
        `Advert not found for publication with ID: ${publicationsToBePublished[0]?.id}`,
        {
          context: LOGGER_CONTEXT,
          publicationId: publicationsToBePublished[0]?.id,
        },
      )
      return
    }

    for (const [index, pub] of publicationsToBePublished.entries()) {
      this.logger.debug(
        `Processing publication ${index + 1} of ${publicationsToBePublished.length}`,
        {
          context: LOGGER_CONTEXT,
          publicationId: pub.id,
          advertId: advert.id,
          index,
        },
      )

      try {
        await this.sequelize.transaction(async (transaction) => {
          const publicationNumber = isEmpty(advert.publicationNumber)
            ? await this.getNextPublicationNumber(pub.scheduledAt, transaction)
            : advert.publicationNumber

          pub.publishedAt = new Date()
          await pub.save({ transaction: transaction })

          await advert.update(
            {
              publicationNumber,
              statusId: StatusIdEnum.PUBLISHED,
            },
            { transaction: transaction },
          )

          const payload: AdvertPublishedEvent = {
            advert: advert.fromModelToDetailed(),
            publication: pub.fromModel(),
            html: advert.htmlMarkup(pub.versionLetter),
          }
          transaction.afterCommit(() => {
            this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED, payload)
          })
        })

        this.logger.info(`Published advert publication with ID: ${pub.id}`, {
          context: LOGGER_CONTEXT,
        })
      } catch (error) {
        this.logger.error(`Failed to publish advert publication`, {
          publicationId: pub.id,
          advertId: advert.id,
          context: LOGGER_CONTEXT,
          error: error,
        })
        continue
      }
    }
  }
}
