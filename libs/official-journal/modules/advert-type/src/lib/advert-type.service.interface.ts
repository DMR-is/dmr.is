import { Transaction } from 'sequelize'
import { ResultWrapper } from '@dmr.is/types'
import { AdvertTypeQuery } from './dto/advert-type.query'
import { CreateAdvertMainTypeBody } from './dto/create-advert-main-type.dto'
import { CreateAdvertTypeBody } from './dto/create-advert-type.dto'
import { GetAdvertMainType } from './dto/get-advert-main-type.dto'
import { GetAdvertMainTypes } from './dto/get-advert-main-types.dto'
import { GetAdvertType } from './dto/get-advert-type.dto'
import { GetAdvertTypes } from './dto/get-advert-types.dto'
import { UpdateAdvertTypeBody } from './dto/update-advert-type.dto'
import { UpdateAdvertMainType } from './dto/update-main-advert-type.dto'

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
    body: UpdateAdvertMainType,
  ): Promise<ResultWrapper<GetAdvertMainType>>

  updateType(
    id: string,
    body: UpdateAdvertTypeBody,
  ): Promise<ResultWrapper<GetAdvertType>>

  deleteMainType(id: string): Promise<ResultWrapper>

  deleteType(id: string): Promise<ResultWrapper>
}

export const IAdvertTypeService = Symbol('IAdvertTypeService')
