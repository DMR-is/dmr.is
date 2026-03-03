import {
  AdvertVersionEnum,
} from '../../../models/advert-publication.model'
import {
  AdvertPublicationDetailedDto,
  GetCombinedHTMLDto,
  GetPublicationsDto,
  GetPublicationsQueryDto,
  GetRelatedPublicationsDto,
  UpdateAdvertPublicationDto,
} from './dto/publication.dto'

export interface IPublicationService {
  createPublication(advertId: string): Promise<void>

  updatePublication(
    publicationId: string,
    body: UpdateAdvertPublicationDto,
  ): Promise<void>

  deletePublication(publicationId: string): Promise<void>

  getPublicationById(
    publicationId: string,
  ): Promise<AdvertPublicationDetailedDto>

  getPublicationByNumberAndVersion(
    publicationNumber: string,
    version: string,
  ): Promise<AdvertPublicationDetailedDto>

  getPublications(query?: GetPublicationsQueryDto): Promise<GetPublicationsDto>

  getPublicationsCombinedHTML(
    query?: GetPublicationsQueryDto,
  ): Promise<GetCombinedHTMLDto>

  getPublishedPublicationsByAdvertId(
    advertId: string,
  ): Promise<AdvertPublicationDetailedDto[]>

  getRelatedPublications(
    publicationNumber: string,
    version: AdvertVersionEnum,
  ): Promise<GetRelatedPublicationsDto>
}

export const IPublicationService = Symbol('IPublicationService')
