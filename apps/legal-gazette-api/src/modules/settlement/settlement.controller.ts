import { Body, Controller, Inject, Param, Patch } from '@nestjs/common'

import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { UpdateSettlementDto } from '../../models/settlement.model'
import { ISettlementService } from './settlement.service.interface'

// TODO: Make this controller admin-only by adding RoleGuard and @Roles(UserRoleEnum.Admin)
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
