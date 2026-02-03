import {
  Body,
  Controller,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/ojoi/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { UpdateSettlementDto } from '../../models/settlement.model'
import { ISettlementService } from './settlement.service.interface'

@Controller({
  path: 'settlements',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
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
