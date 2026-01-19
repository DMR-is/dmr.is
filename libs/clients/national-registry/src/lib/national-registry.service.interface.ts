import { GetPersonDto } from './national-registry.dto'

export interface INationalRegistryService {
  getPersonByNationalId(nationalId: string): Promise<GetPersonDto>
}
export const INationalRegistryService = 'INationalRegistryService'
