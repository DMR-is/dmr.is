import { GetTypesDto } from './dto/type.dto'

export interface ITypeService {
  getTypes(): Promise<GetTypesDto>
}

export const ITypeService = Symbol('ITypeService')
