import { GetNationalRegistryEntityDto } from './national-registry.dto'

export interface INationalRegistryService {
  /**
   * Any non-2xx from the registry — including its `404` for a kennitala it
   * does not hold — is a `BadGatewayException`.
   */
  getEntityByNationalId(
    nationalId: string,
  ): Promise<GetNationalRegistryEntityDto>

  /**
   * As `getEntityByNationalId`, except that the registry's `404` for a
   * kennitala it does not hold is `{ entity: null }`. For callers that tell
   * "not in the registry" apart from "the registry failed".
   */
  findEntityByNationalId(
    nationalId: string,
  ): Promise<GetNationalRegistryEntityDto>
}
export const INationalRegistryService = 'INationalRegistryService'
