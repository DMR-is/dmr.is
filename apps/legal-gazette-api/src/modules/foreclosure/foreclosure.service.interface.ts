import { ForeclosureDto, GetForeclosuresDto } from './dto/foreclosure.dto'

export interface IForeclosureService {
  getForeclosures(): Promise<GetForeclosuresDto>
  getForeclosureById(id: string): Promise<ForeclosureDto>
  createForeclosureSale(): Promise<void>
}

export const IForeclosureService = Symbol('IForeclosureService')
