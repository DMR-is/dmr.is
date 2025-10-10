import { ForeclosureDto, GetForeclosuresDto } from './dto/foreclosure.dto'

export interface IForeclosureService {
  getForeclosures(): Promise<GetForeclosuresDto>
  getForeclosureById(id: string): Promise<ForeclosureDto>
}

export const IForeclosureService = Symbol('IForeclosureService')
