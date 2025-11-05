import { GetPersonDto } from '@dmr.is/clients/national-registry'

export interface ILGNationalRegistryService {
  getPersonByNationalId(nationalId: string): Promise<GetPersonDto>
}

export const ILGNationalRegistryService = Symbol('ILGNationalRegistryService')
