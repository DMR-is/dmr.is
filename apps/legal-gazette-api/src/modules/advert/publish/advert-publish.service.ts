import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CacheEvictTopics } from '@dmr.is/decorators'
import { LOGGER_PROVIDER } from '@dmr.is/logging'
import { Logger } from '@dmr.is/logging-next'

import { LegalGazetteEvents, SYSTEM_ACTOR } from '../../../core/constants'
import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { AdvertPublishedEvent } from '../publications/events/advert-published.event'
import { IAdvertPublishService } from './advert-publish.service.interface'

const LOGGING_CONTEXT = 'AdvertPublishService'

@Injectable()
export class AdvertPublishService implements IAdvertPublishService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,

    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
    @InjectModel(AdvertPublicationModel)
    private readonly publicationModel: typeof AdvertPublicationModel,
    private readonly sequelize: Sequelize,
    private eventEmitter: EventEmitter2,
  ) {}
  async publishNextPublication(
    advertId: string,
    currentUser?: DMRUser,
  ): Promise<void> {
    const nextPub = await this.publicationModel.findOneOrThrow(
      {
        limit: 1,
        where: {
          publishedAt: null,
          advertId,
        },
        order: [['scheduledAt', 'ASC']],
      },
      'No unpublished publication found for advert',
    )

    await this.publish(advertId, nextPub.id, currentUser)
  }
  async publishNextPublications(
    advertIds: string[],
    currentUser?: DMRUser,
  ): Promise<void> {
    for (const advertId of advertIds) {
      try {
        await this.publishNextPublication(advertId, currentUser)
      } catch (error) {
        this.logger.error(
          `Error publishing next publication for advert ${advertId}`,
          {
            context: LOGGING_CONTEXT,
            advertId,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        )
      }
    }
  }

  @CacheEvictTopics('advert-publications-all')
  private async publish(
    advertId: string,
    publicationId: string,
    currentUser?: DMRUser,
  ): Promise<void> {
    // Store payload to emit after transaction commits
    let sideEffectsPayload: AdvertPublishedEvent | null = null

    await this.sequelize.transaction(async (t) => {
      const pubDate = new Date()
      this.logger.info(
        `Publishing advert publication at ${pubDate.toISOString()}`,
        {
          context: LOGGING_CONTEXT,
          advertId,
          publicationId,
          date: pubDate.toISOString(),
        },
      )

      const advert = await this.advertModel
        .withScope('detailed')
        .findByPkOrThrow(advertId)

      const publication = await this.publicationModel.findOneOrThrow({
        where: { id: publicationId, advertId },
      })

      if (publication.publishedAt) {
        throw new BadRequestException('Publication already published')
      }

      if (!advert.publicationNumber) {
        const year = pubDate.getFullYear()
        const month = (pubDate.getMonth() + 1).toString().padStart(2, '0')
        const day = pubDate.getDate().toString().padStart(2, '0')

        // find max publication number for today
        const maxPublication = await this.advertModel.findOne({
          attributes: ['id', 'publicationNumber'],
          where: {
            publicationNumber: {
              [Op.like]: `${year}${month}${day}%`,
            },
          },
          order: [['publicationNumber', 'DESC']],
          limit: 1,
          transaction: t,
        })

        const publishCount = (
          maxPublication && maxPublication.publicationNumber
            ? parseInt(maxPublication.publicationNumber.slice(8), 10) + 1
            : 1
        )
          .toString()
          .padStart(3, '0')

        const publicationNumber = `${year}${month}${day}${publishCount}`

        await advert.update({
          publicationNumber,
          statusId: StatusIdEnum.IN_PUBLISHING,
        })
      }

      // check if all pubs are published, if so set advert status to PUBLISHED
      const allPublications = await this.publicationModel.findAll({
        where: { advertId },
        transaction: t,
      })

      const allPublished = allPublications.every(
        (pub) => pub.id === publicationId || pub.publishedAt !== null,
      )

      if (allPublished) {
        await advert.update(
          { statusId: StatusIdEnum.PUBLISHED },
          { transaction: t },
        )
      }

      await publication.update({ publishedAt: new Date() })
      await Promise.all([publication.reload(), advert.reload()])

      this.logger.info(
        'Advert publication marked as published, emitting ADVERT_PUBLISHED event',
        {
          context: LOGGING_CONTEXT,
          advertId: advert.id,
          publicationId: publication.id,
        },
      )

      const payload: AdvertPublishedEvent = {
        advert: advert.fromModelToDetailed(),
        publication: publication.fromModel(),
        html: advert.htmlMarkup(publication.versionLetter),
      }

      // Store payload for side effects to emit after transaction
      sideEffectsPayload = payload

      // Emit critical events that MUST complete within the transaction
      // If these fail, the entire transaction rolls back
      try {
        await this.eventEmitter.emitAsync(
          LegalGazetteEvents.ADVERT_PUBLISHED,
          payload,
        )

        await this.eventEmitter.emitAsync(LegalGazetteEvents.STATUS_CHANGED, {
          advertId,
          actorId: currentUser ? currentUser.nationalId : SYSTEM_ACTOR.id,
          statusId: StatusIdEnum.PUBLISHED,
        })

        await this.eventEmitter.emitAsync(
          LegalGazetteEvents.CREATE_PUBLISH_COMMENT,
          {
            advertId,
            actorId: currentUser ? currentUser.nationalId : SYSTEM_ACTOR.id,
          },
        )
      } catch (error) {
        this.logger.error(
          'Error occurred while emitting critical publication events',
          {
            context: LOGGING_CONTEXT,
            advertId: advert.id,
            publicationId: publication.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        )
        throw error
      }
    })

    // Transaction has committed at this point
    // Fire and forget side effects - runs outside CLS transaction context
    if (sideEffectsPayload) {
      this.logger.info('Emitting side effects after publishing a publication', {
        context: LOGGING_CONTEXT,
        advertId,
        publicationId,
      })

      // Fire and forget - don't await, errors are logged but don't affect response
      this.eventEmitter.emitAsync(
        LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS,
        sideEffectsPayload,
      )
    }
  }
}
