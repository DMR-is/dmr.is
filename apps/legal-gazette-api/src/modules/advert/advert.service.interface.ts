import { DMRUser } from '@dmr.is/auth/dmrUser'

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

  getAdvertById(id: string, currentUser: DMRUser): Promise<AdvertDetailedDto>

  getAdvertsCount(): Promise<GetAdvertsStatusCounterDto>

  updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto>

  getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto>

  markAdvertAsReady(advertId: string): Promise<void>

  markAdvertAsSubmitted(advertId: string): Promise<void>
  markAdvertAsWithdrawn(advertId: string): Promise<void>

  assignAdvertToEmployee(advertId: string, userId: string): Promise<void>

  createAdvert(body: CreateAdvertDto): Promise<{ id: string }>
}

export const IAdvertService = Symbol('IAdvertService')
