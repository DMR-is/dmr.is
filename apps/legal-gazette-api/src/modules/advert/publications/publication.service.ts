import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents } from '../../../core/constants'
import { mapIndexToVersion, mapVersionToIndex } from '../../../core/utils'
import { AdvertModel } from '../../../models/advert.model'
import {
  AdvertPublicationDetailedDto,
  AdvertPublicationModel,
  AdvertVersionEnum,
  GetPublicationsDto,
  GetPublicationsQueryDto,
  UpdateAdvertPublicationDto,
} from '../../../models/advert-publication.model'
import { StatusIdEnum } from '../../../models/status.model'
import { AdvertPublishedEvent } from './events/advert-published.event'
import { IPublicationService } from './publication.service.interface'
@Injectable()
export class PublicationService implements IPublicationService {
  constructor(
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

  async publishAdverts(advertIds: string[]): Promise<void> {
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
        this.logger.error(`No publication found for advert ${advert.id}`)
        throw new BadRequestException('No publication found for advert')
      }

      await this.publishAdvertPublication(advert.id, publication.id)
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
    const advertPromise = this.advertModel
      .withScope('detailed')
      .findByPkOrThrow(id)
    const publicationPromise = this.advertPublicationModel.findOneOrThrow({
      where: {
        advertId: id,
        versionNumber: mapVersionToIndex(version),
      },
    })

    const [advert, publication] = await Promise.all([
      advertPromise,
      publicationPromise,
    ])

    return {
      advert: advert.fromModel(),
      html: advert.htmlMarkup(version),
      publication: publication.fromModel(),
    }
  }

  async publishAdvertPublication(
    advertId: string,
    publicationId: string,
  ): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      const pubDate = new Date()
      this.logger.info(
        `Publishing advert publication at ${pubDate.toISOString()}`,
        {
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

      this.logger.info(
        'Advert publication marked as published, emitting ADVERT_PUBLISHED event',
        {
          context: 'PublicationService',
          advertId: advert.id,
          publicationId: publication.id,
        },
      )

      const payload: AdvertPublishedEvent = {
        advert: advert.fromModelToDetailed(),
        publication: publication.fromModel(),
        html: advert.htmlMarkup(publication.versionLetter),
      }

      // Emit event for TBR transaction creation and WAIT for it to complete
      // This happens BEFORE transaction commits - if it fails, entire transaction rolls back
      // emitAsync returns a Promise that resolves when all listeners complete
      // If any listener throws, the error propagates and transaction is rolled back (requires suppressErrors: false on listener)
      try {
        await this.eventEmitter.emitAsync(
          LegalGazetteEvents.ADVERT_PUBLISHED,
          payload,
        )

        this.eventEmitter.emit(
          LegalGazetteEvents.ADVERT_PUBLISHED_SIDE_EFFECTS,
          payload,
        )
      } catch (error) {
        this.logger.error(
          'Error occurred while emitting ADVERT_PUBLISHED event',
          {
            context: 'PublicationService',
            advertId: advert.id,
            publicationId: publication.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        )
        throw error
      }
    })
  }
}
