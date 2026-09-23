import { ApiDtoArray } from '@dmr.is/decorators'

import { CompanyPartnerDelegationDto } from './company-partner-delegation.dto'

/** The providers the signed-in company currently allows to act for it. */
export class GetCompanyPartnerDelegationsResponseDto {
  @ApiDtoArray(CompanyPartnerDelegationDto)
  delegations!: CompanyPartnerDelegationDto[]
}
