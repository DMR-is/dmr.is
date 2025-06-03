import { PagingQuery } from '@dmr.is/shared/dto'

import { AdvertDto, GetAdvertsDto } from './dto/advert.dto'

export interface IAdvertService {
  getAdverts(query: PagingQuery): Promise<GetAdvertsDto>

  getAdvertsToBePublished(query: PagingQuery): Promise<GetAdvertsDto>

  getAdvertById(id: string): Promise<AdvertDto>
}

export const IAdvertService = Symbol('IAdvertService')
