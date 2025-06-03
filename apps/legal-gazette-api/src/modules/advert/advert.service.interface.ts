import { PagingQuery } from '@dmr.is/shared/dto'

import {
  AdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
} from './dto/advert.dto'

export interface IAdvertService {
  getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getAdvertsInProgress(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getCompletedAdverts(query: PagingQuery): Promise<GetAdvertsDto>

  getAdvertById(id: string): Promise<AdvertDto>

  getAdvertsCount(): Promise<GetAdvertsStatusCounterDto>
}

export const IAdvertService = Symbol('IAdvertService')
