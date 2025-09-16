import { AdvertVersionEnum } from '../advert/advert.model'
import {
  AdvertPublicationDetailedDto,
  UpdateAdvertPublicationDto,
} from './dto/advert-publication.dto'

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
}

export const IAdvertPublicationService = Symbol('IAdvertPublicationService')
