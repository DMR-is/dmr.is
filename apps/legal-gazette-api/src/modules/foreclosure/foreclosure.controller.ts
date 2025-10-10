import { Controller, Inject, Param } from '@nestjs/common'

import { Get } from '@dmr.is/decorators'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { ForeclosureDto, GetForeclosuresDto } from './dto/foreclosure.dto'
import { IForeclosureService } from './foreclosure.service.interface'

@Controller({
  path: 'foreclosures',
  version: '1',
})
export class ForeclosureController {
  constructor(
    @Inject(IForeclosureService)
    private readonly foreclosureService: IForeclosureService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getForeclosures', type: GetForeclosuresDto })
  async getForeclosures(): Promise<GetForeclosuresDto> {
    return this.foreclosureService.getForeclosures()
  }

  @Get(':id')
  @LGResponse({ operationId: 'getForeclosureById', type: ForeclosureDto })
  async getForeclosureById(@Param('id') id: string): Promise<ForeclosureDto> {
    return this.foreclosureService.getForeclosureById(id)
  }
}
