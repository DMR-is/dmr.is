import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'

import { AdminAccess } from '../../core/decorators/admin.decorator'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { FeeCodeDto, GetFeeCodesResponse } from '../../models/fee-code.model'
import { IFeeCodeService } from './fee-code.service.interface'

// TODO: Determine usage - currently no tRPC routers call this controller
// By default controllers that are not used, will have admin API only access
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@Controller({
  path: 'fee-codes',
  version: '1',
})
export class FeeCodeController {
  constructor(
    @Inject(IFeeCodeService)
    private readonly feeCodeService: IFeeCodeService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getFeeCodes', type: GetFeeCodesResponse })
  getFeeCodes() {
    return this.feeCodeService.getFeeCodes()
  }

  @Get(':id')
  @LGResponse({ operationId: 'getFeeCodeById', type: FeeCodeDto })
  getFeeCodeById(@Param('id') id: string) {
    return this.feeCodeService.getFeeCodeById(id)
  }
}
