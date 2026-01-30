import { Cache } from 'cache-manager'
import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Cacheable, CacheEvictTopics } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents, SYSTEM_ACTOR } from '../../../core/constants'
import { mapIndexToVersion } from '../../../core/utils'
import { AdvertModel } from '../../../models/advert.model'
import {
  AdvertPublicationDetailedDto,
  AdvertPublicationModel,
  GetPublicationsDto,
  GetPublicationsQueryDto,
  UpdateAdvertPublicationDto,
} from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { AdvertPublishedEvent } from './events/advert-published.event'
import { IPublicationService } from './publication.service.interface'

const LOGGING_CONTEXT = 'PublicationService'
@Injectable()
export class PublicationService implements IPublicationService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,

    @InjectModel(AdvertPublicationModel)
    readonly publicationModel: typeof AdvertPublicationModel,
    @InjectModel(AdvertModel)
    readonly advertModel: typeof AdvertModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private eventEmitter: EventEmitter2,
    private sequelize: Sequelize,
  ) {}

  async getPublishedPublicationsByAdvertId(
    advertId: string,
  ): Promise<AdvertPublicationDetailedDto[]> {
    const advert = await this.advertModel
      .withScope('listview')
      .findByPkOrThrow(advertId, {
        include: [
          {
            model: AdvertPublicationModel,
            as: 'publications',
            where: { publishedAt: { [Op.ne]: null } },
          },
        ],
      })

    return advert.publications.map((publication, index) => {
      return {
        advert: advert.fromModel(),
        html: advert.htmlMarkup(mapIndexToVersion(index)),
        publication: publication.fromModel(),
      }
    })
  }

  @Cacheable({ tagBy: [0], topic: 'advert-publications-all', service: 'lg' })
  async getPublications(
    query: GetPublicationsQueryDto,
  ): Promise<GetPublicationsDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const publications = await this.publicationModel
      .scope({ method: ['published', query] })
      .findAndCountAll({
        limit,
        offset,
      })

    const erroredRows: string[] = []
    const mapped = publications.rows.flatMap((pub) => {
      try {
        return pub.fromModelToPublishedDto()
      } catch (e) {
        erroredRows.push(pub.id)
        this.logger.error('Error mapping publication to DTO', {
          error: e,
          publicationId: pub.id,
        })
        return []
      }
    })

    const paging = generatePaging(
      publications.rows.filter((pub) => !erroredRows.includes(pub.id)),
      query.page,
      query.pageSize,
      publications.count - erroredRows.length,
    )

    return {
      publications: mapped,
      paging,
    }
  }

  async createPublication(advertId: string): Promise<void> {
    const currentPublications = await this.publicationModel.findAll({
      where: { advertId },
      order: [
        ['scheduledAt', 'ASC'],
        ['publishedAt', 'ASC'],
      ],
    })

    if (currentPublications.length > 2) {
      throw new BadRequestException('Max 3 publications allowed')
    }

    const lastestPublication =
      currentPublications[currentPublications.length - 1]
    const withTwoWeeks = addDays(lastestPublication.scheduledAt, 14)

    await this.publicationModel.create({
      advertId,
      scheduledAt: withTwoWeeks,
      versionNumber: currentPublications.length + 1,
    })
  }

  async deletePublication(publicationId: string): Promise<void> {
    const publication =
      await this.publicationModel.findByPkOrThrow(publicationId)

    const siblings = await this.publicationModel.findAll({
      where: {
        advertId: publication.advertId,
        id: { [Op.ne]: publication.id },
      },
    })

    const pubCount = siblings.length + 1

    if (pubCount <= 1) {
      throw new BadRequestException('At least one publication must remain')
    }

    // Prevent deletion of published versions
    if (publication.publishedAt) {
      throw new BadRequestException('Cannot delete published versions')
    }

    this.logger.info('Force deleting advert publication', {
      context: LOGGING_CONTEXT,
      publicationId: publication.id,
      advertId: publication.advertId,
    })

    await this.publicationModel.destroy({
      where: {
        id: publication.id,
      },
      force: true,
    })

    const publications = await this.publicationModel.findAll({
      where: { advertId: publication.advertId },
      order: [
        ['scheduledAt', 'ASC'],
        ['publishedAt', 'ASC'],
      ],
    })

    // FIX M-2: Use for...of instead of forEach with async to properly await
    for (let index = 0; index < publications.length; index++) {
      this.logger.info('Reassigning version number after deletion', {
        context: LOGGING_CONTEXT,
        advertId: publication.advertId,
        publicationId: publications[index].id,
        newVersionNumber: index + 1,
      })
      await publications[index].update({ versionNumber: index + 1 })
    }
  }

  private validatePublicationSchedule(
    publications: { versionNumber: number; scheduledAt: Date }[],
    publicationId: string,
    advertId: string,
  ) {
    const sorted = publications.sort(
      (a, b) => a.versionNumber - b.versionNumber,
    )

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      // structural check: versions must be sequential
      if (next.versionNumber !== current.versionNumber + 1) {
        this.logger.error('Invalid publication version structure', {
          context: LOGGING_CONTEXT,
          publicationId,
          advertId,
          versions: sorted.map((p) => p.versionNumber),
        })
        throw new BadRequestException('Invalid publication version structure')
      }

      // date ordering check
      if (current.scheduledAt >= next.scheduledAt) {
        throw new BadRequestException(
          `Version ${current.versionNumber} scheduled date must be before Version ${next.versionNumber} scheduled date`,
        )
      }
    }
  }

  async updatePublication(
    publicationId: string,
    body: UpdateAdvertPublicationDto,
  ): Promise<void> {
    const publication = await this.publicationModel.findOneOrThrow({
      where: { id: publicationId },
    })

    const prevDate = publication.scheduledAt.toISOString()
    const incomingDate = new Date(body.scheduledAt)

    const siblings = await this.publicationModel.findAll({
      where: {
        advertId: publication.advertId,
        id: { [Op.ne]: publication.id },
      },
    })

    const pubsToValidate = [
      ...siblings.map((s) => ({
        versionNumber: s.versionNumber,
        scheduledAt: s.scheduledAt,
      })),
      { versionNumber: publication.versionNumber, scheduledAt: incomingDate },
    ]

    this.validatePublicationSchedule(
      pubsToValidate,
      publicationId,
      publication.advertId,
    )

    await publication.update({
      scheduledAt: incomingDate,
    })

    this.logger.info(
      `Advert publication updated from ${prevDate} to ${incomingDate.toISOString()}`,
      {
        context: LOGGING_CONTEXT,
        publicationId,
        advertId: publication.advertId,
        previousScheduledAt: prevDate,
        nextScheduledAt: incomingDate.toISOString(),
      },
    )
  }

  async getPublicationById(
    publicationId: string,
  ): Promise<AdvertPublicationDetailedDto> {
    const pub = await this.publicationModel.findByPkOrThrow(publicationId, {
      include: [{ model: AdvertModel.scope('detailed'), as: 'advert' }],
    })

    return {
      advert: pub.advert.fromModel(),
      html: pub.advert.htmlMarkup(pub.versionLetter),
      publication: pub.fromModel(),
    }
  }

  @CacheEvictTopics('advert-publications-all')
  async publishAdvertPublication(
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

  async publishNextPublication(advertId: string): Promise<void> {
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

    await this.publishAdvertPublication(advertId, nextPub.id)
  }
}
