import { DMRUser } from '@dmr.is/auth/dmrUser'

import {
  AdvertDetailedDto,
  CreateAdvertDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  UpdateAdvertDto,
} from '../../models/advert.model'

export interface IAdvertService {
  getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getAdvertById(id: string, currentUser: DMRUser): Promise<AdvertDetailedDto>

  getAdvertsCount(): Promise<GetAdvertsStatusCounterDto>

  updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto>

  getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto>

  moveAdvertToNextStatus(advertId: string, currentUser: DMRUser): Promise<void>

  moveAdvertToPreviousStatus(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void>

  markAdvertAsWithdrawn(advertId: string): Promise<void>
  rejectAdvert(advertId: string, currentUser: DMRUser): Promise<void>

  assignAdvertToEmployee(advertId: string, userId: string): Promise<void>

  createAdvert(body: CreateAdvertDto): Promise<{ id: string }>
}

export const IAdvertService = Symbol('IAdvertService')
