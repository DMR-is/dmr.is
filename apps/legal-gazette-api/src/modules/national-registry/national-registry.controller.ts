import { Controller, Get, Inject } from '@nestjs/common'

import { GetPersonDto } from '@dmr.is/clients/national-registry'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { ILGNationalRegistryService } from './national-registry.service.interface'

@Controller({
  path: 'national-registry',
  version: '1',
})
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
