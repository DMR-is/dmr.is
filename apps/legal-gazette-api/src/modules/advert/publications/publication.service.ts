import { Cache } from 'cache-manager'
import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { CACHE_MANAGER } from '@nestjs/cache-manager'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { Cacheable, CacheEvictTopics } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents, SYSTEM_ACTOR } from '../../../core/constants'
import { mapIndexToVersion, mapVersionToIndex } from '../../../core/utils'
import { AdvertModel } from '../../../models/advert.model'
import {
  AdvertPublicationDetailedDto,
  AdvertPublicationDto,
  AdvertPublicationModel,
  AdvertVersionEnum,
  GetPublicationsDetailedDto,
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
    readonly advertPublicationModel: typeof AdvertPublicationModel,
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

    const publications = await this.advertPublicationModel
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

  async getPublicationsDetailed(
    query: GetPublicationsQueryDto,
  ): Promise<GetPublicationsDetailedDto> {
    const { limit, offset } = getLimitAndOffset({
      page: query.page,
      pageSize: query.pageSize,
    })

    const publications = await this.advertPublicationModel
      .scope({ method: ['published', query] })
      .findAndCountAll({
        limit,
        offset,
      })

    const erroredRows: string[] = []
    const mapped = await Promise.all(
      publications.rows.map(async (pub) => {
        try {
          const advert = await this.advertModel
            .withScope('detailed')
            .findByPkOrThrow(pub.advertId)
          return {
            html: advert.htmlMarkup(),
            publication: pub.fromModel(),
          }
        } catch (e) {
          erroredRows.push(pub.id)
          this.logger.error(
            'Error mapping advert publication detailed to DTO',
            {
              error: e,
              publicationId: pub.id,
            },
          )
          return { html: '', publication: {} as AdvertPublicationDto }
        }
      }),
    )

    const paging = generatePaging(
      publications.rows.filter((pub) => !erroredRows.includes(pub.id)),
      query.page,
      query.pageSize,
      publications.count - erroredRows.length,
    )

    return { result: mapped, paging }
  }

  async publishAdverts(
    advertIds: string[],
    currentUser?: DMRUser,
  ): Promise<void> {
    // maybe fail if length of advert results is not the same as advertIds length
    const adverts = await this.advertModel.findAll({
      attributes: ['id', 'publicationNumber', 'statusId'],
      include: [
        {
          model: AdvertPublicationModel,
          required: true,
          limit: 1,
        },
      ],
      where: {
        id: {
          [Op.in]: advertIds,
        },
        statusId: {
          [Op.eq]: StatusIdEnum.READY_FOR_PUBLICATION,
        },
      },
    })

    for (const advert of adverts) {
      const publication = advert.publications?.[0]

      if (!publication) {
        this.logger.error(`No publication found for advert ${advert.id}`, {
          advertId: advert.id,
          context: LOGGING_CONTEXT,
        })
        throw new BadRequestException('No publication found for advert')
      }

      await this.publishAdvertPublication(
        advert.id,
        publication.id,
        currentUser,
      )
    }
  }
  async createAdvertPublication(advertId: string): Promise<void> {
    const currentPublications = await this.advertPublicationModel.findAll({
      where: { advertId },
      order: [
        ['scheduledAt', 'ASC'],
        ['publishedAt', 'ASC'],
      ],
    })

    if (currentPublications.length >= 3) {
      throw new BadRequestException('Max 3 publications allowed')
    }

    const lastestPublication =
      currentPublications[currentPublications.length - 1]
    const withTwoWeeks = addDays(lastestPublication.scheduledAt, 14)

    await this.advertPublicationModel.create({
      advertId,
      scheduledAt: withTwoWeeks,
      versionNumber: currentPublications.length + 1,
    })
  }

  async deleteAdvertPublication(id: string, pubId: string): Promise<void> {
    const count = await this.advertPublicationModel.count({
      where: { advertId: id },
    })

    if (count <= 1) {
      throw new BadRequestException('At least one publication must remain')
    }

    // Check if publication exists
    const publication = await this.advertPublicationModel.findOne({
      where: { id: pubId, advertId: id },
    })

    if (!publication) {
      throw new NotFoundException('Publication not found')
    }

    // Prevent deletion of published versions
    if (publication.publishedAt) {
      throw new BadRequestException('Cannot delete published versions')
    }

    await this.advertPublicationModel.destroy({
      where: {
        id: pubId,
        advertId: id,
      },
      force: true,
    })

    const publications = await this.advertPublicationModel.findAll({
      where: { advertId: id },
      order: [
        ['scheduledAt', 'ASC'],
        ['publishedAt', 'ASC'],
      ],
    })

    // FIX M-2: Use for...of instead of forEach with async to properly await
    for (let index = 0; index < publications.length; index++) {
      await publications[index].update({ versionNumber: index + 1 })
    }
  }

  async updateAdvertPublication(
    advertId: string,
    publicationId: string,
    body: UpdateAdvertPublicationDto,
  ): Promise<void> {
    const publication = await this.advertPublicationModel.findOneOrThrow({
      where: { id: publicationId, advertId },
    })

    await publication.update({
      scheduledAt: new Date(body.scheduledAt),
    })
  }

  async getAdvertPublication(
    id: string,
    version: AdvertVersionEnum,
  ): Promise<AdvertPublicationDetailedDto> {
    const advert = await this.advertModel
      .withScope('detailed')
      .findByPkOrThrow(id)

    const isLegacy = !!advert.legacyId

    const publication = await this.advertPublicationModel.findOneOrThrow({
      where: {
        advertId: id,
        ...(isLegacy ? {} : { versionNumber: mapVersionToIndex(version) }),
      },
    })

    return {
      advert: advert.fromModel(),
      html: advert.htmlMarkup(version),
      publication: publication.fromModel(),
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

      const publication = await this.advertPublicationModel.findOneOrThrow({
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
          statusId: StatusIdEnum.PUBLISHED,
        })
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
      this.logger.info('Emitting side effects after transaction commit', {
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
