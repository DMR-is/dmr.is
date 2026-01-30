import { DMRUser } from '@dmr.is/auth/dmrUser'

import {
  AdvertPublicationDetailedDto,
  AdvertVersionEnum,
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
    currentUser: DMRUser,
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
    currentUser?: DMRUser,
  ): Promise<void>

  publishNextPublication(advertId: string): Promise<void>

  publishAdverts(advertIds: string[], currentUser?: DMRUser): Promise<void>
}

export const IPublicationService = Symbol('IPublicationService')
