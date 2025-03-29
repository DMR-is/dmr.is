import { ResultWrapper } from '@dmr.is/types'
import { Transaction } from 'sequelize'
import { CreateAdvert } from './dto/advert.dto'
import { GetAdvertResponse } from './dto/get-advert-response.dto'
import { GetAdvertsQueryParams } from './dto/get-adverts-query.dto'
import {
  GetAdvertsResponse,
  GetSimilarAdvertsResponse,
} from './dto/get-adverts-responses.dto'
import { UpdateAdvertBody } from './dto/update-advert-body.dto'

export interface IAdvertService {
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
}

export const IAdvertService = Symbol('IAdvertService')
