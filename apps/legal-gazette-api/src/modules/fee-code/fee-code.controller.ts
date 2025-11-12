import { Controller, Get, Inject, Param } from '@nestjs/common'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { FeeCodeDto, GetFeeCodesResponse } from '../../models/fee-code.model'
import { IFeeCodeService } from './fee-code.service.interface'

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
