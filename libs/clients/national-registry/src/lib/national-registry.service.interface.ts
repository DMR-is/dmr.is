import { GetNationalRegistryEntityDto } from './national-registry.dto'

export interface INationalRegistryService {
  getEntityByNationalId(
    nationalId: string,
  ): Promise<GetNationalRegistryEntityDto>
}
export const INationalRegistryService = 'INationalRegistryService'
