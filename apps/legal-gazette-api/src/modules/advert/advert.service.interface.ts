import { AdvertDto, GetAdvertsDto } from './dto/advert.dto'

export interface IAdvertService {
  getAdverts(): Promise<GetAdvertsDto>

  getAdvertById(id: string): Promise<AdvertDto>

  getAdvertsInProgress(): Promise<GetAdvertsDto>
}

export const IAdvertService = Symbol('IAdvertService')
