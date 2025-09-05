import { PagingQuery } from '@dmr.is/shared/dto'

import { AdvertPublicationDetailedDto } from '../advert-publications/dto/advert-publication.dto'
import {
  AdvertDetailedDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from './dto/advert.dto'
import { AdvertVersionEnum } from './advert.model'

export interface IAdvertService {
  getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getAdvertsInProgress(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getCompletedAdverts(query: PagingQuery): Promise<GetAdvertsDto>

  getAdvertById(id: string): Promise<AdvertDetailedDto>

  getAdvertsCount(): Promise<GetAdvertsStatusCounterDto>

  updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto>

  getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto>

  getAdvertPublication(
    id: string,
    version: AdvertVersionEnum,
  ): Promise<AdvertPublicationDetailedDto>
}

export const IAdvertService = Symbol('IAdvertService')
