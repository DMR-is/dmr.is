import {
  CreateAdvertType,
  GetAdvertTypeDto,
  GetAdvertTypesDetailedDto,
  GetAdvertTypesDto,
  UpdateAdvertType,
} from './dto/advert-type.dto'

export interface IAdvertTypeService {
  getAdvertTypes(): Promise<GetAdvertTypesDto>

  getAdvertTypesDetailed(): Promise<GetAdvertTypesDetailedDto>

  createAdvertType(body: CreateAdvertType): Promise<GetAdvertTypeDto>

  updateAdvertType(
    id: string,
    body: UpdateAdvertType,
  ): Promise<GetAdvertTypeDto>

  deleteAdvertType(id: string): Promise<GetAdvertTypeDto>
}

export const IAdvertTypeService = Symbol('IAdvertTypeService')
