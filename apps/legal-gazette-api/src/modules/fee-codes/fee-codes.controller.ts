import { Controller, Get, Inject } from '@nestjs/common'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { GetFeeCodesResponse } from './dto/fee-codes.dto'
import { IFeeCodesService } from './fee-codes.service.interface'

@Controller({
  path: 'fee-codes',
  version: '1',
})
export class FeeCodesController {
  constructor(
    @Inject(IFeeCodesService)
    private readonly feeCodesService: IFeeCodesService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getFeeCodes', type: GetFeeCodesResponse })
  getFeeCodes() {
    return this.feeCodesService.getFeeCodes()
  }
}
