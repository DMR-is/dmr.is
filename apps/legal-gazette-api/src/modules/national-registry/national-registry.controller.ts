import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger'

import { GetCompanyDto, LegalEntityDto } from '@dmr.is/clients/company-registry'
import { GetPersonDto } from '@dmr.is/clients/national-registry'
import {
  ApplicationWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'
import { NationalIdValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { ILGNationalRegistryService } from './national-registry.service.interface'

@Controller({
  path: 'national-registry',
  version: '1',
})
@ApiExtraModels(LegalEntityDto)
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@ApplicationWebScopes()
export class LGNationalRegistryController {
  constructor(
    @Inject(ILGNationalRegistryService)
    private nationalRegistryService: ILGNationalRegistryService,
  ) {}

  @Get('/person/:nationalId')
  @LGResponse({ operationId: 'getPersonByNationalId', type: GetPersonDto })
  getPersonByNationalId(
    @Param('nationalId', new NationalIdValidationPipe()) nationalId: string,
  ) {
    return this.nationalRegistryService.getPersonByNationalId(nationalId)
  }

  @Get('/company/:nationalId')
  @LGResponse({ operationId: 'getCompanyByNationalId', type: GetCompanyDto })
  getCompanyByNationalId(
    @Param('nationalId', new NationalIdValidationPipe()) nationalId: string,
  ) {
    return this.nationalRegistryService.getCompanyByNationalId(nationalId)
  }
}
