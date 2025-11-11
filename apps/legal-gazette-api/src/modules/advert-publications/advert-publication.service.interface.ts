import { AdvertVersionEnum } from '../../models/advert.model'
import {
  GetPublicationsDto,
  GetPublicationsQueryDto,
  GetRelatedPublicationsDto,
  UpdateAdvertPublicationDto,
} from './dto/advert-publication.dto'
import { AdvertPublicationDetailedDto } from './dto/advert-publication-detailed.dto'

export interface IAdvertPublicationService {
  createAdvertPublication(advertId: string): Promise<void>

  updateAdvertPublication(
    advertId: string,
    publicationId: string,
    body: UpdateAdvertPublicationDto,
  ): Promise<void>

  deleteAdvertPublication(id: string, pubId: string): Promise<void>

  getAdvertPublication(
    id: string,
    version: AdvertVersionEnum,
  ): Promise<AdvertPublicationDetailedDto>

  getPublications(query?: GetPublicationsQueryDto): Promise<GetPublicationsDto>

  publishAdvertPublication(
    advertId: string,
    publicationId: string,
  ): Promise<void>

  publishAdverts(advertIds: string[]): Promise<void>
}

export const IAdvertPublicationService = Symbol('IAdvertPublicationService')
