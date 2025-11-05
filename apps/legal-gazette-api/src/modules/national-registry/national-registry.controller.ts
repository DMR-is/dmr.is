import { Controller, Get, Inject, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { GetPersonDto } from '@dmr.is/clients/national-registry'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { ILGNationalRegistryService } from './national-registry.service.interface'

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
  getPersonByNationalId(nationalId: string) {
    return this.nationalRegistryService.getPersonByNationalId(nationalId)
  }
}
