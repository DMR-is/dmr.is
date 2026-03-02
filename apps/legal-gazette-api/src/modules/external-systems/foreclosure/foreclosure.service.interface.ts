import { ForeclosureDto } from '../../../models/foreclosure.model'
import {
  ForeclosurePropertyDto,
} from '../../../models/foreclosure-property.model'
import {
  CreateForeclosurePropertyDto,
  CreateForeclosureSaleDto,
} from './dto/foreclosure.dto'

export interface IForeclosureService {
  getForeclosureById(id: string): Promise<ForeclosureDto>
  deleteForclosureSale(id: string): Promise<void>
  createForeclosureSale(body: CreateForeclosureSaleDto): Promise<ForeclosureDto>
  createForeclosureProperty(
    id: string,
    body: CreateForeclosurePropertyDto,
  ): Promise<ForeclosurePropertyDto>
  deletePropertyFromForeclosure(
    id: string,
    propertyNumber: string,
  ): Promise<void>
}

export const IForeclosureService = Symbol('IForeclosureService')
