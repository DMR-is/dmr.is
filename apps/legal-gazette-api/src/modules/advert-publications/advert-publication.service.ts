import addDays from 'date-fns/addDays'

import { BadRequestException, Injectable } from '@nestjs/common'

import { mapVersionToIndex } from '../../lib/utils'
import { AdvertModel, AdvertVersionEnum } from '../advert/advert.model'
import {
  AdvertPublicationDetailedDto,
  UpdateAdvertPublicationDto,
} from './dto/advert-publication.dto'
import { AdvertPublicationModel } from './advert-publication.model'
import { IAdvertPublicationService } from './advert-publication.service.interface'

@Injectable()
export class AdvertPublicationService implements IAdvertPublicationService {
  constructor(
    private readonly advertPublicationModel: typeof AdvertPublicationModel,
    private readonly advertModel: typeof AdvertModel,
  ) {}
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
}
