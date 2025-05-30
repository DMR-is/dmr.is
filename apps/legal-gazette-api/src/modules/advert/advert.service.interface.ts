import { AdvertDto, GetAdvertsDto } from './dto/advert.dto'

export interface IAdvertService {
  getAdverts(): Promise<GetAdvertsDto>

  getAdvertById(id: string): Promise<AdvertDto>
}

export const IAdvertService = Symbol('IAdvertService')
