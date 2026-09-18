import { ApiDtoArray } from '@dmr.is/decorators'
import { ApiKeyDto } from '@dmr.is/doe-shared'

/**
 * The keys a company holds — revoked and expired ones included, so the list
 * doubles as the audit view. Small, unpaginated set.
 */
export class GetApiKeysResponseDto {
  @ApiDtoArray(ApiKeyDto)
  apiKeys!: ApiKeyDto[]
}
