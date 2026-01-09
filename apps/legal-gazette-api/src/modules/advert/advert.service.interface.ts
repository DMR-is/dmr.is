import { DMRUser } from '@dmr.is/auth/dmrUser'
import { PagingQuery } from '@dmr.is/shared/dto'

import {
  AdvertDetailedDto,
  CreateAdvertAndCommonApplicationBodyDto,
  CreateAdvertAndRecallBankruptcyApplicationBodyDto,
  CreateAdvertAndRecallDeceasedApplicationBodyDto,
  CreateAdvertInternalDto,
  GetAdvertsDto,
  GetAdvertsQueryDto,
  GetAdvertsStatusCounterDto,
  GetExternalAdvertsDto,
  GetMyAdvertsDto,
  UpdateAdvertDto,
} from '../../models/advert.model'

export interface IAdvertService {
  getAdverts(query: GetAdvertsQueryDto): Promise<GetAdvertsDto>

  getAdvertById(id: string, currentUser: DMRUser): Promise<AdvertDetailedDto>

  getAdvertsCount(): Promise<GetAdvertsStatusCounterDto>

  updateAdvert(id: string, body: UpdateAdvertDto): Promise<AdvertDetailedDto>

  getAdvertsByCaseId(caseId: string): Promise<GetAdvertsDto>

  getAdvertsByExternalId(externalId: string): Promise<GetExternalAdvertsDto>

  moveAdvertToNextStatus(advertId: string, currentUser: DMRUser): Promise<void>

  moveAdvertToPreviousStatus(
    advertId: string,
    currentUser: DMRUser,
  ): Promise<void>

  markAdvertAsWithdrawn(advertId: string): Promise<void>
  rejectAdvert(advertId: string, currentUser: DMRUser): Promise<void>

  assignAdvertToEmployee(
    advertId: string,
    userId: string,
    currentUser: DMRUser,
  ): Promise<void>

  createAdvert(body: CreateAdvertInternalDto): Promise<AdvertDetailedDto>

  createAdvertAndCommonApplication(
    body: CreateAdvertAndCommonApplicationBodyDto,
    currentUser: DMRUser,
  ): Promise<void>

  createAdvertAndRecallBankruptcyApplication(
    body: CreateAdvertAndRecallBankruptcyApplicationBodyDto,
    currentUser: DMRUser,
  ): Promise<void>

  createAdvertAndRecallDeceasedApplication(
    body: CreateAdvertAndRecallDeceasedApplicationBodyDto,
    currentUser: DMRUser,
  ): Promise<void>

  getMyAdverts(query: PagingQuery, user: DMRUser): Promise<GetMyAdvertsDto>

  getMyLegacyAdverts(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<GetMyAdvertsDto>
}

export const IAdvertService = Symbol('IAdvertService')
