import { isEmpty } from 'class-validator'
import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { LegalGazetteEvents } from '../../../../core/constants'
import { AdvertModel } from '../../../../models/advert.model'
import { AdvertPublicationModel } from '../../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../../models/status.model'
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
  ) {}

  private async getNextPublicationNumber(
    pubDate: Date,
    transaction: Transaction,
  ): Promise<string> {
    const year = pubDate.getFullYear()
    const month = (pubDate.getMonth() + 1).toString().padStart(2, '0')
    const day = pubDate.getDate().toString().padStart(2, '0')
    const maxPublication = await this.advertModel.unscoped().findOne({
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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async publishAdverts(): Promise<void> {
    const now = new Date()

    this.logger.info(`Running publishing task at ${now.toISOString()}`, {
      context: LOGGER_CONTEXT,
      timestamp: now.toISOString(),
    })

    const start = now.setHours(0, 0, 0, 0)
    const end = now.setHours(23, 59, 59, 999)

    const publicationsToBePublished = await this.publicationModel
      .unscoped()
      .findAll({
        where: {
          publishedAt: { [Op.is]: null },
          scheduledAt: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        },
        include: [
          {
            model: AdvertModel.unscoped(),
            where: {
              statusId: {
                [Op.eq]: StatusIdEnum.READY_FOR_PUBLICATION,
              },
            },
          },
        ],
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

    for (const [index, pub] of publicationsToBePublished.entries()) {
      this.logger.debug(
        `Processing publication ${index + 1} of ${publicationsToBePublished.length}`,
        {
          context: LOGGER_CONTEXT,
          publicationId: pub.id,
          advertId: pub.advert.id,
          index,
        },
      )
      const transaction = await this.sequelize.transaction()

      try {
        const publicationNumber = isEmpty(pub.advert.publicationNumber)
          ? await this.getNextPublicationNumber(pub.scheduledAt, transaction)
          : pub.advert.publicationNumber

        pub.publishedAt = new Date()
        await pub.save({ transaction: transaction })

        await pub.advert.update(
          {
            publicationNumber,
            statusId: StatusIdEnum.PUBLISHED,
          },
          { transaction: transaction },
        )

        // Add afterCommit hook to emit event
        transaction.afterCommit(() => {
          this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED, {
            publicationId: pub.id,
            advertId: pub.advert.id,
            publicationNumber,
            publishedAt: pub.publishedAt,
            scheduledAt: pub.scheduledAt,
          })
        })

        await transaction.commit()
        this.logger.info(`Published advert publication with ID: ${pub.id}`, {
          context: LOGGER_CONTEXT,
        })

        this.eventEmitter.emit('advert.published', {
          publicationId: pub.id,
          advertId: pub.advert.id,
        })
      } catch (error) {
        this.logger.error(`Failed to publish`, {
          publicationId: pub.id,
          advertId: pub.advert.id,
          context: LOGGER_CONTEXT,
          error: error,
        })
        await transaction.rollback()
        continue
      }
    }
  }
}
