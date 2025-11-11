import addDays from 'date-fns/addDays'
import { Op } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'

import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { generatePaging, getLimitAndOffset } from '@dmr.is/utils'

import { LegalGazetteEvents } from '../../lib/constants'
import { mapVersionToIndex } from '../../lib/utils'
import { AdvertModel, AdvertVersionEnum } from '../../models/advert.model'
import { StatusIdEnum } from '../../models/status.model'
import {
  GetPublicationsDto,
  GetPublicationsQueryDto,
  UpdateAdvertPublicationDto,
} from './dto/advert-publication.dto'
import { AdvertPublicationDetailedDto } from './dto/advert-publication-detailed.dto'
import { AdvertPublishedEvent } from './events/advert-published.event'
import { AdvertPublicationModel } from '../../models/advert-publication.model'
import { IAdvertPublicationService } from './advert-publication.service.interface'
@Injectable()
export class AdvertPublicationService implements IAdvertPublicationService {
  constructor(
    @InjectModel(AdvertPublicationModel)
    readonly advertPublicationModel: typeof AdvertPublicationModel,
    @InjectModel(AdvertModel)
    readonly advertModel: typeof AdvertModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private eventEmitter: EventEmitter2,
    private sequelize: Sequelize,
  ) {}

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

    const mapped = publications.rows.map((pub) => pub.fromModelToPublishedDto())

    const paging = generatePaging(
      publications.rows,
      query.page,
      query.pageSize,
      publications.count,
    )

    return {
      publications: mapped,
      paging,
    }
  }

  async publishAdverts(advertIds: string[]): Promise<void> {
    // maybe fail if length of advert results is not the same as advertIds length
    const adverts = await this.advertModel.unscoped().findAll({
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

    publications.forEach(async (publication, index) => {
      await publication.update({ versionNumber: index + 1 })
    })
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
    const advertPromise = this.advertModel.findByPkOrThrow(id)
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

      const advert = await this.advertModel.findByPkOrThrow(advertId)

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
        const maxPublication = await this.advertModel.unscoped().findOne({
          attributes: ['id', 'publicationNumber'],
          where: {
            publicationNumber: {
              [Op.like]: `${year}${month}${day}%`,
            },
          },
          order: [['publicationNumber', 'DESC']],
          limit: 1,
        })

        const publishCount = (
          maxPublication && maxPublication.publicationNumber
            ? parseInt(maxPublication.publicationNumber.slice(8), 11) + 1
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

      t.afterCommit(() => {
        const payload: AdvertPublishedEvent = {
          advert: advert.fromModelToDetailed(),
          publication: publication.fromModel(),
          html: advert.htmlMarkup(publication.versionLetter),
        }

        this.eventEmitter.emit(LegalGazetteEvents.ADVERT_PUBLISHED, payload)
      })
    })
  }
}
