import { Body, Controller, Inject, Param, Patch } from '@nestjs/common'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { UpdateSettlementDto } from './dto/settlement.dto'
import { ISettlementService } from './settlement.service.interface'

@Controller({
  path: 'settlements',
  version: '1',
})
export class SettlementController {
  constructor(
    @Inject(ISettlementService)
    private readonly settlementService: ISettlementService,
  ) {}
  @Patch(':id')
  @LGResponse({ operationId: 'updateSettlement' })
  async updateSettlement(
    @Param('id', new UUIDValidationPipe()) id: string,
    @Body() body: UpdateSettlementDto,
  ) {
    return this.settlementService.updateSettlement(id, body)
  }
}
