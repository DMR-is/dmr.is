import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'

import {
  AdvertTypeQuery,
  CreateAdvertMainTypeBody,
  CreateAdvertTypeBody,
  GetAdvertMainType,
  GetAdvertMainTypes,
  GetAdvertType,
  GetAdvertTypes,
  UpdateAdvertTypeBody,
  UpdateMainAdvertTypeBody,
} from './dto'

export interface IAdvertTypeService {
  getTypes(query?: AdvertTypeQuery): Promise<ResultWrapper<GetAdvertTypes>>

  getMainTypes(
    query?: AdvertTypeQuery,
  ): Promise<ResultWrapper<GetAdvertMainTypes>>

  getTypeById(id: string): Promise<ResultWrapper<GetAdvertType>>

  getMainTypeById(id: string): Promise<ResultWrapper<GetAdvertMainType>>

  createMainType(
    body: CreateAdvertMainTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertMainType>>

  createType(
    body: CreateAdvertTypeBody,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetAdvertType>>

  updateMainType(
    id: string,
    body: UpdateMainAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertMainType>>

  updateType(
    id: string,
    body: UpdateAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertType>>

  deleteMainType(id: string): Promise<ResultWrapper>

  deleteType(id: string): Promise<ResultWrapper>
}

export const IAdvertTypeService = Symbol('IAdvertTypeService')
