import { GetNationalRegistryEntityDto } from '@dmr.is/clients-national-registry'

export interface ILGNationalRegistryService {
  getEntityByNationalId(
    nationalId: string,
  ): Promise<GetNationalRegistryEntityDto>
  getEntityNameByNationalId(nationalId: string): Promise<string>
}

export const ILGNationalRegistryService = Symbol('ILGNationalRegistryService')
