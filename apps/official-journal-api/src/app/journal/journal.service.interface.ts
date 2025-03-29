import { Transaction } from 'sequelize'
import {
  GetInstitutionResponse,
  GetInstitutionsResponse,
  Institution,
} from '@dmr.is/official-journal/modules/institution'
import { ResultWrapper } from '@dmr.is/types'

import { CreateAdvert } from './dto/advert.dto'
import { DefaultSearchParams } from './dto/default-search-params.dto'
import { GetAdvertResponse } from './dto/get-advert-response.dto'
import { GetAdvertsQueryParams } from './dto/get-adverts-query.dto'
import {
  GetAdvertsResponse,
  GetSimilarAdvertsResponse,
} from './dto/get-adverts-responses.dto'
import { UpdateAdvertBody } from './dto/update-advert-body.dto'

export interface IJournalService {
  getAdvert(id: string): Promise<ResultWrapper<GetAdvertResponse>>
  getAdverts(
    params?: GetAdvertsQueryParams,
  ): Promise<ResultWrapper<GetAdvertsResponse>>
  getSimilarAdverts(
    advertId: string,
    limit?: number,
  ): Promise<ResultWrapper<GetSimilarAdvertsResponse>>
  create(
    model: CreateAdvert,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertResponse>>
  updateAdvert(
    advertId: string,
    body: UpdateAdvertBody,
  ): Promise<ResultWrapper<GetAdvertResponse>>

  getInstitution(id: string): Promise<ResultWrapper<GetInstitutionResponse>>
  getInstitutions(
    params?: DefaultSearchParams,
  ): Promise<ResultWrapper<GetInstitutionsResponse>>
  insertInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>
  updateInstitution(
    model: Institution,
  ): Promise<ResultWrapper<GetInstitutionResponse>>
}

// Token for DI, based on https://stackoverflow.com/a/70088972
export const IJournalService = Symbol('IJournalService')
