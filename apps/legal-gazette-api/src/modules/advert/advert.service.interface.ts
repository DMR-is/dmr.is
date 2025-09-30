import { PagingQuery } from '@dmr.is/shared/dto'

import {
  AdvertDetailedDto,
  CreateAdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from './dto/advert.dto'

export interface IAdvertService {
  getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getAdvertsInProgress(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getCompletedAdverts(query: PagingQuery): Promise<GetAdvertsDto>

  getAdvertById(id: string): Promise<AdvertDetailedDto>

  getAdvertsCount(): Promise<GetAdvertsStatusCounterDto>

  updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto>

  getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto>

  markAdvertAsReady(advertId: string): Promise<void>

  markAdvertAsSubmitted(advertId: string): Promise<void>

  assignAdvertToEmployee(advertId: string, userId: string): Promise<void>

  createAdvert(body: CreateAdvertDto): Promise<void>
}

export const IAdvertService = Symbol('IAdvertService')
