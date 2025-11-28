import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { GetPersonDto } from '@dmr.is/clients/national-registry'
import { TokenJwtAuthGuard } from '@dmr.is/modules/guards/auth'
import { NationalIdValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { ILGNationalRegistryService } from './national-registry.service.interface'

// TODO: Make this controller use ApplicationWebScopes decorator
@Controller({
  path: 'national-registry',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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
}
