import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'
import { PagingQuery } from '@dmr.is/shared-dto'

import {
  CreateCommonAdvertAndApplicationDto,
  CreateRecallBankruptcyAdvertAndApplicationDto,
  CreateRecallDeceasedAdvertAndApplicationDto,
} from '../../core/dto/advert-application.dto'
import {
  AdvertDetailedDto,
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

  getAdvertsCount(
    query: GetAdvertsQueryDto,
  ): Promise<GetAdvertsStatusCounterDto>

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
  reactivateAdvert(advertId: string, currentUser: DMRUser): Promise<void>

  assignAdvertToEmployee(
    advertId: string,
    userId: string,
    currentUser: DMRUser,
  ): Promise<void>

  createAdvert(body: CreateAdvertInternalDto): Promise<AdvertDetailedDto>

  createAdvertAndCommonApplication(
    body: CreateCommonAdvertAndApplicationDto,
    currentUser: DMRUser,
  ): Promise<void>

  createAdvertAndRecallBankruptcyApplication(
    body: CreateRecallBankruptcyAdvertAndApplicationDto,
    currentUser: DMRUser,
  ): Promise<void>

  createAdvertAndRecallDeceasedApplication(
    body: CreateRecallDeceasedAdvertAndApplicationDto,
    currentUser: DMRUser,
  ): Promise<void>

  getMyAdverts(query: PagingQuery, user: DMRUser): Promise<GetMyAdvertsDto>

  getMyLegacyAdverts(
    query: PagingQuery,
    user: DMRUser,
  ): Promise<GetMyAdvertsDto>

  deleteAdvert(advertId: string): Promise<void>
}

export const IAdvertService = Symbol('IAdvertService')
