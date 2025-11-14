import { AdvertVersionEnum } from '../../../models/advert.model'
import {
  AdvertPublicationDetailedDto,
  GetPublicationsDto,
  GetPublicationsQueryDto,
  UpdateAdvertPublicationDto,
} from '../../../models/advert-publication.model'

export interface IPublicationService {
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

  getPublishedPublicationsByAdvertId(
    advertId: string,
  ): Promise<AdvertPublicationDetailedDto[]>

  publishAdvertPublication(
    advertId: string,
    publicationId: string,
  ): Promise<void>

  publishAdverts(advertIds: string[]): Promise<void>
}

export const IPublicationService = Symbol('IPublicationService')
